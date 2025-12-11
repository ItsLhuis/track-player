import {
  EQUALIZER_FREQUENCIES,
  type AudioAnalysisData,
  type PlayerAdapter,
  type Track
} from "@track-player/core"

/**
 * Web-specific implementation of the PlayerAdapter interface
 *
 * This class handles all browser-specific audio functionality using the
 * HTMLAudioElement and Web Audio API for playback, equalization, and analysis.
 */
export class WebPlayerAdapter implements PlayerAdapter {
  private audioElement: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private equalizerFilters: BiquadFilterNode[] = []
  private analyserNode: AnalyserNode | null = null
  private hasCreatedSource: boolean = false

  // Event callbacks
  onEnded?: () => void
  onError?: (error: string, code?: string) => void
  onBuffering?: (isBuffering: boolean) => void
  onMetadataLoaded?: () => void
  onCanPlay?: () => void

  // ============================================
  // Lifecycle
  // ============================================

  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("WebPlayerAdapter can only be used in a browser environment.")
    }

    // Create audio element
    this.audioElement = document.createElement("audio")
    this.audioElement.crossOrigin = "anonymous"
    this.audioElement.setAttribute("id", "track-player-web")

    document.body.appendChild(this.audioElement)

    // Setup event listeners
    this.setupEventListeners()

    // Initialize audio context for equalizer and analyser
    this.initializeAudioContext()
  }

  async destroy(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ""
      this.audioElement.remove()
      this.audioElement = null
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      await this.audioContext.close()
    }

    this.audioContext = null
    this.sourceNode = null
    this.gainNode = null
    this.equalizerFilters = []
    this.analyserNode = null
    this.hasCreatedSource = false
  }

  // ============================================
  // Event Listeners Setup
  // ============================================

  private setupEventListeners(): void {
    if (!this.audioElement) return

    this.audioElement.addEventListener("ended", () => {
      this.onEnded?.()
    })

    this.audioElement.addEventListener("error", () => {
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

      this.onError?.(message, code)
    })

    this.audioElement.addEventListener("waiting", () => {
      this.onBuffering?.(true)
    })

    this.audioElement.addEventListener("loadstart", () => {
      this.onBuffering?.(true)
    })

    this.audioElement.addEventListener("stalled", () => {
      this.onBuffering?.(true)
    })

    this.audioElement.addEventListener("canplay", () => {
      this.onCanPlay?.()
    })

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.onMetadataLoaded?.()
    })
  }

  // ============================================
  // Audio Context Initialization
  // ============================================

  private initializeAudioContext(): void {
    if (this.audioContext && this.audioContext.state !== "closed") return

    try {
      this.audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()

      if (this.audioContext.state === "suspended") {
        // Will be resumed on first play
        return
      }

      this.createAudioNodes()
    } catch (error) {
      console.error("Error initializing audio context:", error)
    }
  }

  private createAudioNodes(): void {
    if (!this.audioContext) return

    // Create gain node
    this.gainNode = this.audioContext.createGain()

    // Create analyser node
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    // Create equalizer filters
    this.equalizerFilters = EQUALIZER_FREQUENCIES.map((frequency) => {
      const filter = this.audioContext!.createBiquadFilter()

      filter.type = "peaking"
      filter.frequency.value = frequency
      filter.Q.value = 1
      filter.gain.value = 0

      return filter
    })
  }

  private async connectAudioGraph(): Promise<void> {
    if (!this.audioContext || !this.audioElement || this.hasCreatedSource) return

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      // Create source node (can only be created once per audio element)
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)
      this.hasCreatedSource = true

      if (!this.gainNode) {
        this.createAudioNodes()
      }

      // Connect the audio graph: source -> filters -> analyser -> gain -> destination
      let previousNode: AudioNode = this.sourceNode

      for (const filter of this.equalizerFilters) {
        previousNode.connect(filter)
        previousNode = filter
      }

      previousNode.connect(this.analyserNode!)

      this.analyserNode!.connect(this.gainNode!)
      this.gainNode!.connect(this.audioContext.destination)
    } catch (error) {
      console.error("Error connecting audio graph:", error)
    }
  }

  // ============================================
  // Playback Control
  // ============================================

  async load(track: Track): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    // In web, url must be a string. Asset IDs (numbers) are not supported.
    if (typeof track.url !== "string") {
      throw new Error("Web player only supports string URLs, not asset IDs")
    }

    this.audioElement.src = track.url
    this.audioElement.load()
  }

  async play(): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    // Ensure audio graph is connected on first play
    if (!this.hasCreatedSource && this.audioContext) {
      await this.connectAudioGraph()
    }

    await this.audioElement.play()
  }

  async pause(): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    this.audioElement.pause()
  }

  async stop(): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    this.audioElement.pause()
    this.audioElement.currentTime = 0
    this.audioElement.src = ""
  }

  async seekTo(position: number): Promise<void> {
    if (!this.audioElement) {
      throw new Error("Player not initialized")
    }

    this.audioElement.currentTime = position
  }

  // ============================================
  // State Getters
  // ============================================

  getPosition(): number {
    return this.audioElement?.currentTime ?? 0
  }

  getDuration(): number {
    if (!this.audioElement) return 0
    const duration = this.audioElement.duration
    return isNaN(duration) ? 0 : duration
  }

  getBufferedPosition(): number {
    if (!this.audioElement || this.audioElement.buffered.length === 0) return 0
    return this.audioElement.buffered.end(this.audioElement.buffered.length - 1)
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false
  }

  // ============================================
  // Volume & Rate
  // ============================================

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = volume
    }
  }

  getVolume(): number {
    return this.audioElement?.volume ?? 1
  }

  setRate(rate: number): void {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate
    }
  }

  getRate(): number {
    return this.audioElement?.playbackRate ?? 1
  }

  // ============================================
  // Equalizer
  // ============================================

  setEqualizerBandGain(index: number, gain: number): void {
    const filter = this.equalizerFilters[index]
    if (filter) {
      filter.gain.value = gain
    }
  }

  setEqualizerEnabled(enabled: boolean): void {
    // When disabled, set all gains to 0
    // When enabled, the gains should be restored by the EqualizerManager
    if (!enabled) {
      for (const filter of this.equalizerFilters) {
        filter.gain.value = 0
      }
    }
  }

  // ============================================
  // Audio Analysis
  // ============================================

  getAudioAnalysisData(): AudioAnalysisData | null {
    if (!this.analyserNode || !this.audioContext) {
      return null
    }

    const bufferLength = this.analyserNode.frequencyBinCount
    const frequencyData = new Uint8Array(bufferLength)
    const timeData = new Uint8Array(bufferLength)

    this.analyserNode.getByteFrequencyData(frequencyData)
    this.analyserNode.getByteTimeDomainData(timeData)

    return {
      frequencyData,
      timeData,
      sampleRate: this.audioContext.sampleRate,
      fftSize: this.analyserNode.fftSize
    }
  }

  configureAudioAnalyser(fftSize: number, smoothingTimeConstant: number): void {
    if (this.analyserNode) {
      this.analyserNode.fftSize = fftSize
      this.analyserNode.smoothingTimeConstant = Math.max(0, Math.min(1, smoothingTimeConstant))
    }
  }
}
