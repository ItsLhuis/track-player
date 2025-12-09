import {
  Capability,
  DEFAULT_CAPABILITIES,
  EqualizerManager,
  Event,
  EventEmitter,
  QueueManager,
  RepeatMode,
  SetupNotCalledError,
  State,
  clampRate,
  clampVolume,
  isPowerOfTwo,
  type AudioAnalysisData,
  type EqualizerBand,
  type EqualizerPreset,
  type EventHandler,
  type Progress,
  type Track
} from "@track-player/core"

/**
 * Setup options for the web track player
 */
export interface WebSetupOptions {
  /**
   * Whether the player should wait for the buffer to be ready before playing
   * @default true
   */
  waitForBuffer?: boolean
  /**
   * Interval in seconds between progress updates
   * @default 1
   */
  updateInterval?: number
  /**
   * Whether to enable integration with the MediaSession API
   * @default true
   */
  useMediaSession?: boolean
  /**
   * List of player capabilities to enable
   * @default All capabilities
   */
  capabilities?: Capability[]
}

const DefaultOptions: WebSetupOptions = {
  waitForBuffer: true,
  updateInterval: 1,
  useMediaSession: true,
  capabilities: DEFAULT_CAPABILITIES
}

/**
 * Main TrackPlayer class for web audio playback
 *
 * Provides a complete audio playback solution with queue management,
 * equalizer, audio visualization, and Media Session API integration.
 */
class TrackPlayer {
  private static instance: TrackPlayer | null = null

  private audioElement: HTMLAudioElement | null = null
  private options: WebSetupOptions = DefaultOptions
  private state: State = State.None
  private queueManager: QueueManager = new QueueManager()
  private eventEmitter: EventEmitter = new EventEmitter()
  private equalizerManager: EqualizerManager = new EqualizerManager()
  private progressInterval: number | null = null
  private isSetup: boolean = false
  private playWhenReady: boolean = false
  private repeatMode: RepeatMode = RepeatMode.Off
  private isChangingTrack: boolean = false
  private metadataLoadedMap: Map<number, boolean> = new Map()
  private persistentRate: number = 1.0

  private hasTriedInitAudio: boolean = false

  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private equalizerFilters: BiquadFilterNode[] = []
  private analyserNode: AnalyserNode | null = null

  /** Private constructor to enforce singleton pattern */
  private constructor() {
    // Set up equalizer manager callbacks
    this.equalizerManager.setOnBandChange((index, gain) => {
      if (this.equalizerManager.isEnabled() && this.equalizerFilters[index]) {
        this.equalizerFilters[index].gain.value = gain
      }
    })

    this.equalizerManager.setOnEnabledChange((enabled) => {
      this.equalizerFilters.forEach((filter, index) => {
        filter.gain.value = enabled ? this.equalizerManager.getBandGain(index) : 0
      })
    })
  }

  /**
   * Sets up the player with the given options
   * @param options Player setup options
   * @returns Promise that resolves when the player is set up
   */
  public static async setupPlayer(options: WebSetupOptions = {}): Promise<void> {
    if (!TrackPlayer.instance) {
      TrackPlayer.instance = new TrackPlayer()
    }

    await TrackPlayer.instance.init(options)
  }

  /**
   * Gets the TrackPlayer instance
   * @throws SetupNotCalledError if the player is not set up
   */
  private static getInstance(): TrackPlayer {
    if (!TrackPlayer.instance || !TrackPlayer.instance.isSetup) {
      throw new SetupNotCalledError()
    }
    return TrackPlayer.instance
  }

  /**
   * Sets up the audio equalizer and analyser nodes
   */
  private setupEqualizer(): void {
    if (!this.audioElement) return
    if (this.audioContext && this.audioContext.state !== "closed") return

    try {
      this.audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()

      if (this.audioContext.state === "suspended") {
        return
      }

      this.createAudioFilters()
    } catch (error) {
      console.error("Error setting up equalizer:", error)
    }
  }

  /**
   * Creates audio filters and analyser node
   */
  private createAudioFilters(): void {
    if (!this.audioContext) return

    this.gainNode = this.audioContext.createGain()

    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    this.equalizerFilters = []

    const bands = this.equalizerManager.getBands()

    bands.forEach((band) => {
      const filter = this.audioContext!.createBiquadFilter()

      filter.type = "peaking"
      filter.frequency.value = band.frequency
      filter.Q.value = band.Q
      filter.gain.value = band.gain

      this.equalizerFilters.push(filter)
    })
  }

  /**
   * Creates the source node and connects all audio nodes
   */
  private async initializeAudioGraph(): Promise<void> {
    if (!this.audioContext || !this.audioElement || this.sourceNode) return

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)

      if (!this.gainNode) {
        this.createAudioFilters()
      }

      let previousNode: AudioNode = this.sourceNode

      this.equalizerFilters.forEach((filter) => {
        previousNode.connect(filter)
        previousNode = filter
      })

      previousNode.connect(this.analyserNode!)
      this.analyserNode!.connect(this.gainNode!)
      this.gainNode!.connect(this.audioContext.destination)
    } catch (error) {
      console.error("Error initializing audio graph:", error)
    }
  }

  /**
   * Initializes the player with the given options
   */
  private async init(options: WebSetupOptions): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("TrackPlayer can only be used in a browser environment.")
    }

    this.options = { ...DefaultOptions, ...options }

    if (!this.audioElement) {
      this.audioElement = document.createElement("audio")
      this.audioElement.crossOrigin = "anonymous"
      this.audioElement.setAttribute("id", "track-player-web")
      document.body.appendChild(this.audioElement)
    }

    this.audioElement.addEventListener("play", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Playing)
      }
    })

    this.audioElement.addEventListener("pause", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Paused)
      }
    })

    this.audioElement.addEventListener("ended", this.handleEnded.bind(this))
    this.audioElement.addEventListener("waiting", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("canplay", this.handleCanPlay.bind(this))
    this.audioElement.addEventListener("error", this.handleMediaError.bind(this))
    this.audioElement.addEventListener("loadstart", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("stalled", () => {
      if (!this.isChangingTrack) {
        this.updateState(State.Buffering)
      }
    })

    this.audioElement.addEventListener("suspend", this.handleSuspend.bind(this))

    this.audioElement.addEventListener("loadedmetadata", () => {
      const currentIndex = this.queueManager.getCurrentIndex()
      if (currentIndex >= 0) {
        this.metadataLoadedMap.set(currentIndex, true)
      }
      this.emitProgress()
    })

    if (this.options.useMediaSession && "mediaSession" in navigator) {
      this.setupMediaSession()
    }

    this.setupEqualizer()

    this.isSetup = true
    this.updateState(State.Ready)

    this.startProgressInterval()
  }

  /**
   * Sets up the MediaSession API for media controls
   */
  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) return

    const capabilities = this.options.capabilities ?? DEFAULT_CAPABILITIES

    if (capabilities.includes(Capability.Play)) {
      navigator.mediaSession.setActionHandler("play", () => {
        TrackPlayer.play().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("play", null)
    }

    if (capabilities.includes(Capability.Pause)) {
      navigator.mediaSession.setActionHandler("pause", () => {
        TrackPlayer.pause().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("pause", null)
    }

    if (capabilities.includes(Capability.Stop)) {
      navigator.mediaSession.setActionHandler("stop", () => {
        TrackPlayer.stop().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("stop", null)
    }

    if (capabilities.includes(Capability.SkipToPrevious)) {
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        TrackPlayer.skipToPrevious().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("previoustrack", null)
    }

    if (capabilities.includes(Capability.SkipToNext)) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        TrackPlayer.skipToNext().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("nexttrack", null)
    }

    if (capabilities.includes(Capability.SeekTo)) {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          TrackPlayer.seekTo(details.seekTime).catch(console.error)
        }
      })
    } else {
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }

  /**
   * Updates the MediaSession metadata with the current track info
   */
  private updateMediaSessionMetadata(): void {
    if (!("mediaSession" in navigator)) return

    const currentTrack = this.queueManager.getCurrentTrack()
    if (!currentTrack) return

    const metadata: MediaMetadataInit = {
      title: currentTrack.title,
      artist: currentTrack.artist ?? "",
      album: currentTrack.album ?? ""
    }

    if (currentTrack.artwork) {
      metadata.artwork = [{ src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" }]
    }

    navigator.mediaSession.metadata = new MediaMetadata(metadata)
  }

  /**
   * Handles ended event - determines what to play next based on repeat mode
   */
  private handleEnded(): void {
    const instance = TrackPlayer.getInstance()

    switch (instance.repeatMode) {
      case RepeatMode.Track:
        instance.isChangingTrack = true
        if (instance.audioElement) {
          instance.audioElement.currentTime = 0
          instance.audioElement.play().catch(console.error)
          instance.updateState(State.Playing)
        }
        instance.isChangingTrack = false
        break

      case RepeatMode.Queue: {
        const currentIndex = instance.queueManager.getCurrentIndex()
        const queueLength = instance.queueManager.getLength()
        const nextIndex = currentIndex >= queueLength - 1 ? 0 : currentIndex + 1

        TrackPlayer.skip(nextIndex)
          .then(() => TrackPlayer.play())
          .catch(console.error)
        break
      }

      case RepeatMode.Off:
      default: {
        const currentIndex = instance.queueManager.getCurrentIndex()
        const queueLength = instance.queueManager.getLength()

        if (currentIndex < queueLength - 1) {
          TrackPlayer.skip(currentIndex + 1)
            .then(() => TrackPlayer.play())
            .catch(console.error)
        } else {
          instance.updateState(State.Stopped)
          instance.playWhenReady = false

          if (instance.audioElement && instance.audioElement.duration) {
            instance.audioElement.currentTime = instance.audioElement.duration
          }

          instance.eventEmitter.emit({
            type: Event.PlaybackQueueEnded,
            track: currentIndex >= 0 ? currentIndex : null
          })
        }
        break
      }
    }
  }

  /**
   * Handles canplay event
   */
  private handleCanPlay(): void {
    if (this.state === State.Buffering) {
      if (this.isChangingTrack && this.playWhenReady) {
        if (this.audioElement) {
          this.audioElement.play().catch(console.error)
        }
        this.isChangingTrack = false
        this.updateState(State.Playing)
      } else if (this.isChangingTrack && !this.playWhenReady) {
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else if (this.audioElement?.paused && !this.playWhenReady) {
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else {
        this.isChangingTrack = false
        this.updateState(State.Playing)
      }
    }
  }

  /**
   * Handles suspend event
   */
  private handleSuspend(): void {
    if (this.state === State.Buffering && this.audioElement && this.audioElement.readyState >= 3) {
      if (!this.isChangingTrack) {
        this.updateState(this.audioElement.paused ? State.Paused : State.Playing)
      }
    }
  }

  /**
   * Handles media errors
   */
  private handleMediaError(): void {
    const error = this.audioElement?.error
    let message = "Unknown media error"
    let code = ""

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = "Media playback aborted"
          code = "MEDIA_ERR_ABORTED"
          break
        case MediaError.MEDIA_ERR_NETWORK:
          message = "Network error occurred during playback"
          code = "MEDIA_ERR_NETWORK"
          break
        case MediaError.MEDIA_ERR_DECODE:
          message = "Media decoding error"
          code = "MEDIA_ERR_DECODE"
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = "Media format not supported"
          code = "MEDIA_ERR_SRC_NOT_SUPPORTED"
          break
      }
    }

    this.eventEmitter.emit({
      type: Event.PlaybackError,
      error: message,
      code
    })

    this.updateState(State.Error)
  }

  /**
   * Updates the player state and emits a state change event
   */
  private updateState(state: State): void {
    if (this.state !== state) {
      this.state = state
      this.eventEmitter.emit({
        type: Event.PlaybackState,
        state
      })
    }
  }

  /**
   * Starts the progress interval
   */
  private startProgressInterval(): void {
    if (this.progressInterval) {
      this.stopProgressInterval()
    }

    const interval = this.options.updateInterval ?? 1
    let lastUpdate = 0

    const updateProgress = (timestamp: number) => {
      if (timestamp - lastUpdate >= interval * 1000) {
        this.emitProgress()
        lastUpdate = timestamp
      }
      this.progressInterval = requestAnimationFrame(updateProgress)
    }

    this.progressInterval = requestAnimationFrame(updateProgress)
  }

  /**
   * Stops the progress interval
   */
  private stopProgressInterval(): void {
    if (this.progressInterval) {
      cancelAnimationFrame(this.progressInterval)
      this.progressInterval = null
    }
  }

  /**
   * Emits the current playback progress
   */
  private emitProgress(): void {
    if (!this.audioElement) return

    const position = this.audioElement.currentTime
    const currentTrack = this.queueManager.getCurrentTrack()
    let duration = isNaN(this.audioElement.duration) ? 0 : this.audioElement.duration

    if (currentTrack?.isLiveStream) {
      duration = -1
    }

    const buffered =
      this.audioElement.buffered.length > 0
        ? this.audioElement.buffered.end(this.audioElement.buffered.length - 1)
        : 0

    this.eventEmitter.emit({
      type: Event.PlaybackProgressUpdated,
      position,
      duration,
      buffered
    })
  }

  /**
   * Loads a track into the player
   */
  private async loadTrack(track: Track, preservePlayState = true): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    if (this.isChangingTrack) {
      throw new Error(
        "Another track is currently loading. Please wait for the current operation to complete."
      )
    }

    this.isChangingTrack = true

    const wasPlaying = preservePlayState && (this.playWhenReady || this.state === State.Playing)

    try {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      this.audioElement.src = track.url

      if (track.isLiveStream) {
        this.audioElement.currentTime = 0
      }

      if (preservePlayState) {
        this.playWhenReady = wasPlaying
      }

      this.audioElement.load()

      if (track.isLiveStream) {
        this.audioElement.playbackRate = 1.0
      } else {
        this.audioElement.playbackRate = this.persistentRate
      }

      if (this.options.useMediaSession) {
        this.updateMediaSessionMetadata()
      }

      this.updateState(State.Buffering)

      return Promise.resolve()
    } catch (error) {
      this.isChangingTrack = false
      this.eventEmitter.emit({
        type: Event.PlaybackError,
        error: `Failed to load track: ${error instanceof Error ? error.message : String(error)}`
      })
      this.updateState(State.Error)
      return Promise.reject(error)
    }
  }

  /**
   * Preloads next track metadata to optimize duration detection
   */
  private preloadNextTrackMetadata(): void {
    const currentIndex = this.queueManager.getCurrentIndex()
    const queueLength = this.queueManager.getLength()

    if (currentIndex < queueLength - 1) {
      const nextTrackIndex = currentIndex + 1
      const nextTrack = this.queueManager.getTrack(nextTrackIndex)

      if (nextTrack && !nextTrack.isLiveStream && !this.metadataLoadedMap.get(nextTrackIndex)) {
        const tempAudio = new Audio()
        tempAudio.preload = "metadata"
        tempAudio.src = nextTrack.url

        tempAudio.addEventListener(
          "loadedmetadata",
          () => {
            this.metadataLoadedMap.set(nextTrackIndex, true)
            tempAudio.src = ""
          },
          { once: true }
        )

        tempAudio.addEventListener(
          "error",
          () => {
            tempAudio.src = ""
          },
          { once: true }
        )
      }
    }
  }

  /**
   * Checks if the player has the specified capability
   */
  private static hasCapability(capability: Capability): boolean {
    const instance = TrackPlayer.getInstance()
    return instance.options.capabilities?.includes(capability) ?? false
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Adds event listener for player events
   * @param event Event type
   * @param listener Event handler
   */
  public static addEventListener(event: Event, listener: EventHandler): void {
    const instance = TrackPlayer.getInstance()
    instance.eventEmitter.on(event, listener)
  }

  /**
   * Removes event listener
   * @param event Event type
   * @param listener Event handler
   * @returns True if the listener was removed
   */
  public static removeEventListener(event: Event, listener: EventHandler): boolean {
    const instance = TrackPlayer.getInstance()
    return instance.eventEmitter.off(event, listener)
  }

  /**
   * Updates player options after initialization
   * @param options Updated options
   */
  public static async updateOptions(options: Partial<WebSetupOptions>): Promise<void> {
    const instance = TrackPlayer.getInstance()

    instance.options = { ...instance.options, ...options }

    if (options.updateInterval !== undefined) {
      instance.startProgressInterval()
    }

    if (options.useMediaSession !== undefined || options.capabilities !== undefined) {
      if (instance.options.useMediaSession && "mediaSession" in navigator) {
        instance.setupMediaSession()
        instance.updateMediaSessionMetadata()
      }
    }
  }

  /**
   * Adds tracks to the queue
   * @param tracks Track or array of tracks to add
   * @param insertBeforeIndex Optional index to insert before
   */
  public static async add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void> {
    const instance = TrackPlayer.getInstance()
    instance.queueManager.add(tracks, insertBeforeIndex)
  }

  /**
   * Moves a track from one position to another in the queue
   * @param fromIndex Index of the track to move
   * @param toIndex Destination index for the track
   */
  public static async move(fromIndex: number, toIndex: number): Promise<void> {
    const instance = TrackPlayer.getInstance()
    const currentIndex = instance.queueManager.getCurrentIndex()

    instance.queueManager.move(fromIndex, toIndex)

    const metadataLoaded = instance.metadataLoadedMap.get(fromIndex)
    if (metadataLoaded !== undefined) {
      instance.metadataLoadedMap.delete(fromIndex)
      instance.metadataLoadedMap.set(toIndex, metadataLoaded)
    }

    if (currentIndex === fromIndex && instance.options.useMediaSession) {
      instance.updateMediaSessionMetadata()
    }
  }

  /**
   * Removes tracks from the queue
   * @param indices Index or array of indices to remove
   */
  public static async remove(indices: number | number[]): Promise<void> {
    const instance = TrackPlayer.getInstance()
    const wasPlaying = instance.state === State.Playing

    const result = instance.queueManager.remove(indices)

    if (result.removedCurrentTrack) {
      if (instance.queueManager.getLength() > 0) {
        const currentTrack = instance.queueManager.getCurrentTrack()
        if (currentTrack) {
          await instance.loadTrack(currentTrack, wasPlaying)
        }
      } else {
        instance.updateState(State.Stopped)
      }
    }

    const indicesArray = Array.isArray(indices) ? indices : [indices]
    for (const index of indicesArray) {
      instance.metadataLoadedMap.delete(index)
    }
  }

  /**
   * Skips to the track with the given index
   * @param index Index of the track to skip to
   */
  public static async skip(index: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Skip)) {
      throw new Error("Skip capability not enabled")
    }

    const instance = TrackPlayer.getInstance()
    const wasPlaying = instance.state === State.Playing || instance.playWhenReady

    const result = instance.queueManager.skip(index)
    const track = instance.queueManager.getCurrentTrack()

    if (!track) {
      throw new Error(`Track index ${index} is out of bounds`)
    }

    await instance.loadTrack(track, wasPlaying)

    instance.eventEmitter.emit({
      type: Event.PlaybackTrackChanged,
      prevTrack: result.prevIndex >= 0 ? result.prevIndex : null,
      nextTrack: index
    })

    instance.preloadNextTrackMetadata()

    if (wasPlaying) {
      await TrackPlayer.play()
    }
  }

  /**
   * Skips to the next track in the queue
   */
  public static async skipToNext(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SkipToNext)) {
      throw new Error("SkipToNext capability not enabled")
    }

    const instance = TrackPlayer.getInstance()
    const currentIndex = instance.queueManager.getCurrentIndex()

    if (currentIndex < 0) {
      throw new Error("No track is currently playing")
    }

    let nextIndex: number

    if (instance.repeatMode === RepeatMode.Track) {
      nextIndex = currentIndex
    } else if (instance.queueManager.isAtEnd()) {
      if (instance.repeatMode === RepeatMode.Queue && instance.queueManager.getLength() > 0) {
        nextIndex = 0
      } else {
        throw new Error("No next track available")
      }
    } else {
      nextIndex = currentIndex + 1
    }

    await TrackPlayer.skip(nextIndex)
  }

  /**
   * Skips to the previous track in the queue
   */
  public static async skipToPrevious(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SkipToPrevious)) {
      throw new Error("SkipToPrevious capability not enabled")
    }

    const instance = TrackPlayer.getInstance()
    const currentIndex = instance.queueManager.getCurrentIndex()

    if (currentIndex < 0) {
      throw new Error("No track is currently playing")
    }

    let prevIndex: number

    if (instance.repeatMode === RepeatMode.Track) {
      prevIndex = currentIndex
    } else if (instance.queueManager.isAtStart()) {
      if (instance.repeatMode === RepeatMode.Queue && instance.queueManager.getLength() > 0) {
        prevIndex = instance.queueManager.getLength() - 1
      } else {
        throw new Error("No previous track available")
      }
    } else {
      prevIndex = currentIndex - 1
    }

    await TrackPlayer.skip(prevIndex)
  }

  /**
   * Gets the current queue of tracks
   * @returns Array of tracks in the queue
   */
  public static getQueue(): Track[] {
    const instance = TrackPlayer.getInstance()
    return instance.queueManager.getQueue()
  }

  /**
   * Gets a track from the queue by index
   * @param index Index of the track to retrieve
   * @returns The track, or undefined if not found
   */
  public static getTrack(index: number): Track | undefined {
    const instance = TrackPlayer.getInstance()
    return instance.queueManager.getTrack(index)
  }

  /**
   * Gets the currently active track object
   * @returns The active track, or undefined if none
   */
  public static getActiveTrack(): Track | undefined {
    const instance = TrackPlayer.getInstance()
    return instance.queueManager.getCurrentTrack()
  }

  /**
   * Gets the index of the active track
   * @returns Index of the active track, or -1 if none
   */
  public static getActiveTrackIndex(): number {
    const instance = TrackPlayer.getInstance()
    return instance.queueManager.getCurrentIndex()
  }

  /**
   * Updates metadata for a specific track
   * @param index Index of the track to update
   * @param metadata Updated metadata fields
   */
  public static async updateMetadataForTrack(
    index: number,
    metadata: Partial<Track>
  ): Promise<void> {
    const instance = TrackPlayer.getInstance()

    instance.queueManager.updateTrack(index, metadata)

    if (index === instance.queueManager.getCurrentIndex() && instance.options.useMediaSession) {
      instance.updateMediaSessionMetadata()
    }
  }

  /**
   * Sets the repeat mode
   * @param mode RepeatMode option (Off, Track, Queue)
   */
  public static async setRepeatMode(mode: RepeatMode): Promise<void> {
    const instance = TrackPlayer.getInstance()
    instance.repeatMode = mode
  }

  /**
   * Gets the current repeat mode
   * @returns The current RepeatMode value
   */
  public static getRepeatMode(): RepeatMode {
    const instance = TrackPlayer.getInstance()
    return instance.repeatMode
  }

  /**
   * Starts or resumes playback
   */
  public static async play(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Play)) {
      throw new Error("Play capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (!instance.sourceNode && instance.audioContext && !instance.hasTriedInitAudio) {
      instance.hasTriedInitAudio = true
      await instance.initializeAudioGraph()
    }

    const currentIndex = instance.queueManager.getCurrentIndex()
    const queueLength = instance.queueManager.getLength()

    const isAtQueueEnd =
      instance.state === State.Stopped &&
      currentIndex === queueLength - 1 &&
      (instance.audioElement.currentTime >= instance.audioElement.duration - 0.1 ||
        instance.audioElement.duration === 0)

    if (currentIndex === -1 && queueLength > 0) {
      instance.queueManager.setCurrentIndex(0)
      const firstTrack = instance.queueManager.getCurrentTrack()

      if (firstTrack) {
        await instance.loadTrack(firstTrack, false)

        instance.eventEmitter.emit({
          type: Event.PlaybackTrackChanged,
          prevTrack: null,
          nextTrack: 0
        })

        instance.preloadNextTrackMetadata()
      }
    } else if (isAtQueueEnd && queueLength > 0) {
      instance.queueManager.setCurrentIndex(0)
      const firstTrack = instance.queueManager.getCurrentTrack()

      if (firstTrack) {
        await instance.loadTrack(firstTrack, false)
        instance.playWhenReady = true

        instance.eventEmitter.emit({
          type: Event.PlaybackTrackChanged,
          prevTrack: currentIndex >= 0 ? currentIndex : null,
          nextTrack: 0
        })

        instance.preloadNextTrackMetadata()
      }
    } else if (
      instance.state === State.Stopped &&
      currentIndex >= 0 &&
      instance.audioElement.currentTime < instance.audioElement.duration - 0.1
    ) {
      const currentPosition = instance.audioElement.currentTime
      const currentTrack = instance.queueManager.getCurrentTrack()

      if (currentTrack) {
        await instance.loadTrack(currentTrack, false)

        if (currentPosition > 0) {
          instance.audioElement.currentTime = currentPosition
        }

        instance.playWhenReady = true
      }
    } else if (currentIndex === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = true

    try {
      await instance.audioElement.play()
    } catch (error) {
      instance.eventEmitter.emit({
        type: Event.PlaybackError,
        error: `Failed to play: ${error instanceof Error ? error.message : String(error)}`
      })
      throw error
    }
  }

  /**
   * Pauses playback
   */
  public static async pause(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Pause)) {
      throw new Error("Pause capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.queueManager.getCurrentIndex() === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = false
    instance.audioElement.pause()
  }

  /**
   * Stops playback
   */
  public static async stop(): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.Stop)) {
      throw new Error("Stop capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.queueManager.getCurrentIndex() === -1) {
      throw new Error("No track is loaded")
    }

    instance.playWhenReady = false
    instance.audioElement.pause()
    instance.audioElement.currentTime = 0
    instance.audioElement.src = ""

    instance.updateState(State.Stopped)
  }

  /**
   * Seeks to the specified position
   * @param position Position in seconds
   */
  public static async seekTo(position: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SeekTo)) {
      throw new Error("SeekTo capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.queueManager.getCurrentIndex() === -1) {
      throw new Error("No track is loaded")
    }

    instance.audioElement.currentTime = position
    instance.emitProgress()
  }

  /**
   * Retries playback of the current track after an error
   */
  public static async retry(): Promise<void> {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.queueManager.getCurrentIndex() === -1) {
      throw new Error("No track to retry")
    }

    const wasPlaying = instance.state === State.Playing || instance.playWhenReady
    const currentTrack = instance.queueManager.getCurrentTrack()

    if (currentTrack) {
      await instance.loadTrack(currentTrack, wasPlaying)

      if (wasPlaying) {
        await TrackPlayer.play()
      }
    }
  }

  /**
   * Seeks by the specified offset
   * @param offset Offset in seconds (positive or negative)
   */
  public static async seekBy(offset: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SeekBy)) {
      throw new Error("SeekBy capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    if (instance.queueManager.getCurrentIndex() === -1) {
      throw new Error("No track is loaded")
    }

    const newPosition = instance.audioElement.currentTime + offset
    const clampedPosition = Math.min(newPosition, instance.audioElement.duration - 0.01)
    instance.audioElement.currentTime = Math.max(0, clampedPosition)

    instance.emitProgress()
  }

  /**
   * Sets the volume
   * @param volume Volume level from 0 to 1
   */
  public static async setVolume(volume: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SetVolume)) {
      throw new Error("SetVolume capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    instance.audioElement.volume = clampVolume(volume)
  }

  /**
   * Gets the current volume
   * @returns The current volume level (0 to 1)
   */
  public static getVolume(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    return instance.audioElement.volume
  }

  /**
   * Sets the playback rate
   * @param rate Playback rate from 0.25 to 4.0
   */
  public static async setRate(rate: number): Promise<void> {
    if (!TrackPlayer.hasCapability(Capability.SetRate)) {
      throw new Error("SetRate capability not enabled")
    }

    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    const currentTrack = instance.queueManager.getCurrentTrack()

    if (currentTrack?.isLiveStream) {
      throw new Error("Cannot change playback rate for live streams")
    }

    const clampedRate = clampRate(rate)
    instance.audioElement.playbackRate = clampedRate
    instance.persistentRate = clampedRate
  }

  /**
   * Gets the current playback rate
   * @returns The current playback rate
   */
  public static getRate(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      throw new Error("Player not initialized")
    }

    return instance.audioElement.playbackRate
  }

  /**
   * Gets the current playback state
   * @returns The playback state
   */
  public static getPlaybackState(): State {
    const instance = TrackPlayer.getInstance()
    return instance.state
  }

  /**
   * Gets the current playback position
   * @returns The position in seconds
   */
  public static getPosition(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      return 0
    }

    return instance.audioElement.currentTime
  }

  /**
   * Gets the duration of the current track
   * @returns The duration in seconds or 0 if no track is loaded
   */
  public static getDuration(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement) {
      return 0
    }

    return isNaN(instance.audioElement.duration) ? 0 : instance.audioElement.duration
  }

  /**
   * Gets the buffered position of the current track
   * @returns The buffered position in seconds
   */
  public static getBufferedPosition(): number {
    const instance = TrackPlayer.getInstance()

    if (!instance.audioElement || instance.audioElement.buffered.length === 0) {
      return 0
    }

    return instance.audioElement.buffered.end(instance.audioElement.buffered.length - 1)
  }

  /**
   * Gets the current progress information
   * @returns Progress object with position, duration, and buffered position
   */
  public static getProgress(): Progress {
    return {
      position: TrackPlayer.getPosition(),
      duration: TrackPlayer.getDuration(),
      buffered: TrackPlayer.getBufferedPosition()
    }
  }

  /**
   * Enables or disables the equalizer
   * @param enabled True to enable, false to disable
   */
  public static setEqualizerEnabled(enabled: boolean): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerManager.setEnabled(enabled)
  }

  /**
   * Checks if the equalizer is enabled
   * @returns True if the equalizer is enabled
   */
  public static isEqualizerEnabled(): boolean {
    const instance = TrackPlayer.getInstance()
    return instance.equalizerManager.isEnabled()
  }

  /**
   * Sets the gain of a specific equalizer band
   * @param bandIndex Band index (0-9)
   * @param gain Gain in dB (-12 to +12)
   */
  public static setEqualizerBandGain(bandIndex: number, gain: number): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerManager.setBandGain(bandIndex, gain)
  }

  /**
   * Gets the gain of a specific band
   * @param bandIndex Band index
   * @returns Gain in dB
   */
  public static getEqualizerBandGain(bandIndex: number): number {
    const instance = TrackPlayer.getInstance()
    return instance.equalizerManager.getBandGain(bandIndex)
  }

  /**
   * Gets all equalizer bands
   * @returns Array with configuration of all bands
   */
  public static getEqualizerBands(): EqualizerBand[] {
    const instance = TrackPlayer.getInstance()
    return instance.equalizerManager.getBands()
  }

  /**
   * Sets multiple equalizer bands at once
   * @param bands Array with the configuration of the bands
   */
  public static setEqualizerBands(bands: EqualizerBand[]): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerManager.setBands(bands)
  }

  /**
   * Resets the equalizer to default values (all gains to 0)
   */
  public static resetEqualizer(): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerManager.reset()
  }

  /**
   * Applies a predefined equalizer preset
   * @param preset Preset name
   */
  public static setEqualizerPreset(preset: EqualizerPreset): void {
    const instance = TrackPlayer.getInstance()
    instance.equalizerManager.setPreset(preset)
  }

  /**
   * Gets real-time audio analysis data
   * @returns Frequency and time-domain data
   */
  public static getAudioAnalysisData(): AudioAnalysisData | null {
    const instance = TrackPlayer.getInstance()

    if (!instance.analyserNode || !instance.audioContext) {
      return null
    }

    const bufferLength = instance.analyserNode.frequencyBinCount
    const frequencyData = new Uint8Array(bufferLength)
    const timeData = new Uint8Array(bufferLength)

    instance.analyserNode.getByteFrequencyData(frequencyData)
    instance.analyserNode.getByteTimeDomainData(timeData)

    return {
      frequencyData,
      timeData,
      sampleRate: instance.audioContext.sampleRate,
      fftSize: instance.analyserNode.fftSize
    }
  }

  /**
   * Configures the audio analyser
   * @param fftSize FFT size (must be a power of 2)
   * @param smoothingTimeConstant Temporal smoothing (0-1)
   */
  public static configureAudioAnalyser(
    fftSize: number = 2048,
    smoothingTimeConstant: number = 0.8
  ): void {
    const instance = TrackPlayer.getInstance()

    if (!instance.analyserNode) {
      console.warn("Audio analyser not initialized")
      return
    }

    if (!isPowerOfTwo(fftSize)) {
      throw new Error("fftSize must be a power of 2")
    }

    instance.analyserNode.fftSize = fftSize
    instance.analyserNode.smoothingTimeConstant = Math.max(0, Math.min(1, smoothingTimeConstant))
  }

  /**
   * Resets the player state
   */
  public static async reset(): Promise<void> {
    if (!TrackPlayer.instance || !TrackPlayer.instance.isSetup) {
      return
    }

    const instance = TrackPlayer.instance

    instance.stopProgressInterval()
    instance.isChangingTrack = false

    if (instance.audioElement) {
      instance.playWhenReady = false
      instance.audioElement.pause()
      instance.audioElement.currentTime = 0
      instance.audioElement.src = ""
    }

    instance.queueManager.clear()
    instance.metadataLoadedMap.clear()

    if (instance.options.useMediaSession && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = null
    }

    instance.updateState(State.Ready)
    instance.startProgressInterval()
  }

  /**
   * Destroys the player and releases resources
   */
  public static async destroy(): Promise<void> {
    const instance = TrackPlayer.getInstance()

    instance.stopProgressInterval()

    if (instance.audioElement) {
      instance.audioElement.pause()
      instance.audioElement.src = ""
      instance.audioElement.remove()
      instance.audioElement = null
    }

    instance.queueManager.clear()
    instance.eventEmitter.removeAllListeners()
    instance.metadataLoadedMap.clear()
    instance.isSetup = false
    instance.state = State.None

    TrackPlayer.instance = null
  }
}

export default TrackPlayer
