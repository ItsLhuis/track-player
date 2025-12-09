import { Capability, DEFAULT_CAPABILITIES, Event, RepeatMode, State } from "./constants"

import {
  CapabilityNotEnabledError,
  NoTrackLoadedError,
  PlayerNotInitializedError,
  TrackNotFoundError
} from "./errors"

import { EqualizerManager } from "./EqualizerManager"
import { EventEmitter } from "./EventEmitter"
import { QueueManager } from "./QueueManager"

import { clampRate, clampVolume } from "./utils"

import type { PlayerAdapter } from "./PlayerAdapter"

import type { EqualizerBand, EqualizerPreset, EventHandler, Progress, Track } from "./types"

/**
 * Setup options for the base track player
 */
export interface BaseSetupOptions {
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
   * List of player capabilities to enable
   * @default All capabilities
   */
  capabilities?: Capability[]
}

/**
 * Default setup options
 */
const DEFAULT_OPTIONS: Required<BaseSetupOptions> = {
  waitForBuffer: true,
  updateInterval: 1,
  capabilities: DEFAULT_CAPABILITIES
}

/**
 * Base TrackPlayer class with platform-agnostic business logic
 *
 * This class contains all the core functionality for managing audio playback,
 * including queue management, state transitions, repeat modes, and event handling.
 * Platform-specific audio operations are delegated to an PlayerAdapter implementation.
 *
 * @example
 * ```typescript
 * // In a platform-specific implementation:
 * class WebTrackPlayer extends BaseTrackPlayer {
 *   protected createAdapter(): PlayerAdapter {
 *     return new WebPlayerAdapter()
 *   }
 * }
 * ```
 */
export abstract class BaseTrackPlayer {
  protected adapter: PlayerAdapter | null = null
  protected options: Required<BaseSetupOptions> = DEFAULT_OPTIONS
  protected state: State = State.None
  protected queueManager: QueueManager = new QueueManager()
  protected eventEmitter: EventEmitter = new EventEmitter()
  protected equalizerManager: EqualizerManager = new EqualizerManager()
  protected isSetup: boolean = false
  protected playWhenReady: boolean = false
  protected repeatMode: RepeatMode = RepeatMode.Off
  protected isChangingTrack: boolean = false
  protected persistentRate: number = 1.0

  /**
   * Creates the platform-specific player adapter
   * This method must be implemented by platform-specific subclasses
   */
  protected abstract createAdapter(): PlayerAdapter

  /**
   * Platform-specific initialization hook
   * Called after the adapter is created but before it's initialized
   */
  protected async onBeforeInit(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Platform-specific initialization hook
   * Called after the adapter is initialized
   */
  protected async onAfterInit(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Initializes the player with the given options
   * @param options Player setup options
   */
  public async init(options: BaseSetupOptions = {}): Promise<void> {
    if (this.isSetup) {
      return
    }

    this.options = { ...DEFAULT_OPTIONS, ...options }

    // Create the platform-specific adapter
    this.adapter = this.createAdapter()

    // Setup adapter event callbacks
    this.setupAdapterCallbacks()

    // Setup equalizer callbacks
    this.setupEqualizerCallbacks()

    // Hook for platform-specific pre-initialization
    await this.onBeforeInit()

    // Initialize the adapter
    await this.adapter.initialize()

    // Hook for platform-specific post-initialization
    await this.onAfterInit()

    this.isSetup = true
    this.updateState(State.Ready)
  }

  /**
   * Sets up the adapter event callbacks
   */
  private setupAdapterCallbacks(): void {
    if (!this.adapter) return

    this.adapter.onEnded = () => {
      this.handleTrackEnded()
    }

    this.adapter.onError = (error: string, code?: string) => {
      const eventData: { type: Event.PlaybackError; error: string; code?: string } = {
        type: Event.PlaybackError,
        error
      }
      if (code !== undefined) {
        eventData.code = code
      }
      this.eventEmitter.emit(eventData)
      this.updateState(State.Error)
    }

    this.adapter.onBuffering = (isBuffering: boolean) => {
      if (!this.isChangingTrack) {
        if (isBuffering) {
          this.updateState(State.Buffering)
        }
      }
    }

    this.adapter.onCanPlay = () => {
      this.handleCanPlay()
    }

    this.adapter.onMetadataLoaded = () => {
      this.emitProgress()
    }
  }

  /**
   * Sets up the equalizer manager callbacks
   */
  private setupEqualizerCallbacks(): void {
    this.equalizerManager.setOnBandChange((index, gain) => {
      if (this.equalizerManager.isEnabled()) {
        this.adapter?.setEqualizerBandGain?.(index, gain)
      }
    })

    this.equalizerManager.setOnEnabledChange((enabled) => {
      this.adapter?.setEqualizerEnabled?.(enabled)
    })
  }

  /**
   * Ensures the player is initialized
   * @throws PlayerNotInitializedError if not initialized
   */
  protected ensureInitialized(): void {
    if (!this.isSetup || !this.adapter) {
      throw new PlayerNotInitializedError()
    }
  }

  /**
   * Ensures the player has a specific capability
   * @throws CapabilityNotEnabledError if capability is not enabled
   */
  protected ensureCapability(capability: Capability): void {
    if (!this.options.capabilities.includes(capability)) {
      throw new CapabilityNotEnabledError(capability)
    }
  }

  /**
   * Ensures a track is loaded
   * @throws NoTrackLoadedError if no track is loaded
   */
  protected ensureTrackLoaded(): void {
    if (this.queueManager.getCurrentIndex() === -1) {
      throw new NoTrackLoadedError()
    }
  }

  /**
   * Updates the player state and emits a state change event
   */
  protected updateState(state: State): void {
    if (this.state !== state) {
      this.state = state
      this.eventEmitter.emit({
        type: Event.PlaybackState,
        state
      })
    }
  }

  /**
   * Handles the track ended event based on repeat mode
   */
  private handleTrackEnded(): void {
    switch (this.repeatMode) {
      case RepeatMode.Track:
        // Replay the same track
        this.isChangingTrack = true
        this.adapter?.seekTo(0).then(() => {
          this.adapter?.play().catch(console.error)
          this.updateState(State.Playing)
          this.isChangingTrack = false
        })
        break

      case RepeatMode.Queue: {
        // Move to next track, or loop to first if at end
        const currentIndex = this.queueManager.getCurrentIndex()
        const queueLength = this.queueManager.getLength()
        const nextIndex = currentIndex >= queueLength - 1 ? 0 : currentIndex + 1

        this.skip(nextIndex)
          .then(() => this.play())
          .catch(console.error)
        break
      }

      case RepeatMode.Off:
      default: {
        // Move to next track, or stop if at end
        const currentIndex = this.queueManager.getCurrentIndex()
        const queueLength = this.queueManager.getLength()

        if (currentIndex < queueLength - 1) {
          this.skip(currentIndex + 1)
            .then(() => this.play())
            .catch(console.error)
        } else {
          // Queue ended
          this.updateState(State.Stopped)
          this.playWhenReady = false

          this.eventEmitter.emit({
            type: Event.PlaybackQueueEnded,
            track: currentIndex >= 0 ? currentIndex : null
          })
        }
        break
      }
    }
  }

  /**
   * Handles the can play event
   */
  private handleCanPlay(): void {
    if (this.state === State.Buffering) {
      if (this.isChangingTrack && this.playWhenReady) {
        this.adapter?.play().catch(console.error)
        this.isChangingTrack = false
        this.updateState(State.Playing)
      } else if (this.isChangingTrack && !this.playWhenReady) {
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else if (!this.adapter?.isPlaying() && !this.playWhenReady) {
        this.isChangingTrack = false
        this.updateState(State.Paused)
      } else {
        this.isChangingTrack = false
        this.updateState(State.Playing)
      }
    }
  }

  /**
   * Emits the current playback progress
   */
  protected emitProgress(): void {
    if (!this.adapter) return

    const position = this.adapter.getPosition()
    const currentTrack = this.queueManager.getCurrentTrack()
    let duration = this.adapter.getDuration()

    if (currentTrack?.isLiveStream) {
      duration = -1
    }

    const buffered = this.adapter.getBufferedPosition()

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
  protected async loadTrack(track: Track, preservePlayState = true): Promise<void> {
    this.ensureInitialized()

    if (this.isChangingTrack) {
      throw new Error(
        "Another track is currently loading. Please wait for the current operation to complete."
      )
    }

    this.isChangingTrack = true

    const wasPlaying = preservePlayState && (this.playWhenReady || this.state === State.Playing)

    try {
      await this.adapter!.stop()
      await this.adapter!.load(track)

      if (preservePlayState) {
        this.playWhenReady = wasPlaying
      }

      // Set rate (live streams always use 1.0)
      if (track.isLiveStream) {
        this.adapter!.setRate(1.0)
      } else {
        this.adapter!.setRate(this.persistentRate)
      }

      this.updateState(State.Buffering)
    } catch (error) {
      this.isChangingTrack = false
      this.eventEmitter.emit({
        type: Event.PlaybackError,
        error: `Failed to load track: ${error instanceof Error ? error.message : String(error)}`
      })
      this.updateState(State.Error)
      throw error
    }
  }

  // ============================================
  // Public API - Event Handling
  // ============================================

  /**
   * Adds event listener for player events
   * @param event Event type
   * @param listener Event handler
   */
  public addEventListener(event: Event, listener: EventHandler): void {
    this.eventEmitter.on(event, listener)
  }

  /**
   * Removes event listener
   * @param event Event type
   * @param listener Event handler
   * @returns True if the listener was removed
   */
  public removeEventListener(event: Event, listener: EventHandler): boolean {
    return this.eventEmitter.off(event, listener)
  }

  // ============================================
  // Public API - Options
  // ============================================

  /**
   * Updates player options after initialization
   * @param options Updated options
   */
  public async updateOptions(options: Partial<BaseSetupOptions>): Promise<void> {
    this.ensureInitialized()
    this.options = { ...this.options, ...options }
  }

  /**
   * Gets the current player options
   */
  public getOptions(): Required<BaseSetupOptions> {
    return { ...this.options }
  }

  // ============================================
  // Public API - Queue Management
  // ============================================

  /**
   * Adds tracks to the queue
   * @param tracks Track or array of tracks to add
   * @param insertBeforeIndex Optional index to insert before
   */
  public async add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void> {
    this.ensureInitialized()
    this.queueManager.add(tracks, insertBeforeIndex)
  }

  /**
   * Moves a track from one position to another in the queue
   * @param fromIndex Index of the track to move
   * @param toIndex Destination index for the track
   */
  public async move(fromIndex: number, toIndex: number): Promise<void> {
    this.ensureInitialized()
    this.queueManager.move(fromIndex, toIndex)
  }

  /**
   * Removes tracks from the queue
   * @param indices Index or array of indices to remove
   */
  public async remove(indices: number | number[]): Promise<void> {
    this.ensureInitialized()
    const wasPlaying = this.state === State.Playing

    const result = this.queueManager.remove(indices)

    if (result.removedCurrentTrack) {
      if (this.queueManager.getLength() > 0) {
        const currentTrack = this.queueManager.getCurrentTrack()
        if (currentTrack) {
          await this.loadTrack(currentTrack, wasPlaying)
        }
      } else {
        this.updateState(State.Stopped)
      }
    }
  }

  /**
   * Skips to the track with the given index
   * @param index Index of the track to skip to
   * @param initialPosition Optional initial position in seconds
   */
  public async skip(index: number, initialPosition?: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.Skip)

    const wasPlaying = this.state === State.Playing || this.playWhenReady

    const result = this.queueManager.skip(index)
    const track = this.queueManager.getCurrentTrack()

    if (!track) {
      throw new TrackNotFoundError(index)
    }

    await this.loadTrack(track, wasPlaying)

    if (initialPosition !== undefined && initialPosition > 0) {
      await this.adapter!.seekTo(initialPosition)
    }

    this.eventEmitter.emit({
      type: Event.PlaybackTrackChanged,
      prevTrack: result.prevIndex >= 0 ? result.prevIndex : null,
      nextTrack: index
    })

    if (wasPlaying) {
      await this.play()
    }
  }

  /**
   * Skips to the next track in the queue
   * @param initialPosition Optional initial position in seconds
   */
  public async skipToNext(initialPosition?: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SkipToNext)

    const currentIndex = this.queueManager.getCurrentIndex()

    if (currentIndex < 0) {
      throw new NoTrackLoadedError()
    }

    let nextIndex: number

    if (this.repeatMode === RepeatMode.Track) {
      nextIndex = currentIndex
    } else if (this.queueManager.isAtEnd()) {
      if (this.repeatMode === RepeatMode.Queue && this.queueManager.getLength() > 0) {
        nextIndex = 0
      } else {
        throw new Error("No next track available")
      }
    } else {
      nextIndex = currentIndex + 1
    }

    await this.skip(nextIndex, initialPosition)
  }

  /**
   * Skips to the previous track in the queue
   * @param initialPosition Optional initial position in seconds
   */
  public async skipToPrevious(initialPosition?: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SkipToPrevious)

    const currentIndex = this.queueManager.getCurrentIndex()

    if (currentIndex < 0) {
      throw new NoTrackLoadedError()
    }

    let prevIndex: number

    if (this.repeatMode === RepeatMode.Track) {
      prevIndex = currentIndex
    } else if (this.queueManager.isAtStart()) {
      if (this.repeatMode === RepeatMode.Queue && this.queueManager.getLength() > 0) {
        prevIndex = this.queueManager.getLength() - 1
      } else {
        throw new Error("No previous track available")
      }
    } else {
      prevIndex = currentIndex - 1
    }

    await this.skip(prevIndex, initialPosition)
  }

  /**
   * Gets the current queue of tracks
   * @returns Array of tracks in the queue
   */
  public getQueue(): Track[] {
    this.ensureInitialized()
    return this.queueManager.getQueue()
  }

  /**
   * Gets a track from the queue by index
   * @param index Index of the track to retrieve
   * @returns The track, or undefined if not found
   */
  public getTrack(index: number): Track | undefined {
    this.ensureInitialized()
    return this.queueManager.getTrack(index)
  }

  /**
   * Gets the currently active track object
   * @returns The active track, or undefined if none
   */
  public getActiveTrack(): Track | undefined {
    this.ensureInitialized()
    return this.queueManager.getCurrentTrack()
  }

  /**
   * Gets the index of the active track
   * @returns Index of the active track, or -1 if none
   */
  public getActiveTrackIndex(): number {
    this.ensureInitialized()
    return this.queueManager.getCurrentIndex()
  }

  /**
   * Updates metadata for a specific track
   * @param index Index of the track to update
   * @param metadata Updated metadata fields
   */
  public async updateMetadataForTrack(index: number, metadata: Partial<Track>): Promise<void> {
    this.ensureInitialized()
    this.queueManager.updateTrack(index, metadata)
  }

  // ============================================
  // Public API - Repeat Mode
  // ============================================

  /**
   * Sets the repeat mode
   * @param mode RepeatMode option (Off, Track, Queue)
   */
  public async setRepeatMode(mode: RepeatMode): Promise<void> {
    this.ensureInitialized()
    this.repeatMode = mode
  }

  /**
   * Gets the current repeat mode
   * @returns The current RepeatMode value
   */
  public getRepeatMode(): RepeatMode {
    return this.repeatMode
  }

  // ============================================
  // Public API - Playback Control
  // ============================================

  /**
   * Starts or resumes playback
   */
  public async play(): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.Play)

    const currentIndex = this.queueManager.getCurrentIndex()
    const queueLength = this.queueManager.getLength()

    // If no track is active but queue has tracks, load the first one
    if (currentIndex === -1 && queueLength > 0) {
      this.queueManager.setCurrentIndex(0)
      const firstTrack = this.queueManager.getCurrentTrack()

      if (firstTrack) {
        await this.loadTrack(firstTrack, false)

        this.eventEmitter.emit({
          type: Event.PlaybackTrackChanged,
          prevTrack: null,
          nextTrack: 0
        })
      }
    } else if (currentIndex === -1) {
      throw new NoTrackLoadedError()
    }

    this.playWhenReady = true

    try {
      await this.adapter!.play()
    } catch (error) {
      this.eventEmitter.emit({
        type: Event.PlaybackError,
        error: `Failed to play: ${error instanceof Error ? error.message : String(error)}`
      })
      throw error
    }
  }

  /**
   * Pauses playback
   */
  public async pause(): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.Pause)
    this.ensureTrackLoaded()

    this.playWhenReady = false
    await this.adapter!.pause()
  }

  /**
   * Stops playback
   */
  public async stop(): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.Stop)
    this.ensureTrackLoaded()

    this.playWhenReady = false
    await this.adapter!.stop()
    this.updateState(State.Stopped)
  }

  /**
   * Seeks to the specified position
   * @param position Position in seconds
   */
  public async seekTo(position: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SeekTo)
    this.ensureTrackLoaded()

    await this.adapter!.seekTo(position)
    this.emitProgress()
  }

  /**
   * Seeks by the specified offset
   * @param offset Offset in seconds (positive or negative)
   */
  public async seekBy(offset: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SeekBy)
    this.ensureTrackLoaded()

    const currentPosition = this.adapter!.getPosition()
    const duration = this.adapter!.getDuration()
    const newPosition = Math.max(0, Math.min(currentPosition + offset, duration - 0.01))

    await this.adapter!.seekTo(newPosition)
    this.emitProgress()
  }

  /**
   * Retries playback of the current track after an error
   */
  public async retry(): Promise<void> {
    this.ensureInitialized()
    this.ensureTrackLoaded()

    const wasPlaying = this.state === State.Playing || this.playWhenReady
    const currentTrack = this.queueManager.getCurrentTrack()

    if (currentTrack) {
      await this.loadTrack(currentTrack, wasPlaying)

      if (wasPlaying) {
        await this.play()
      }
    }
  }

  // ============================================
  // Public API - Volume & Rate
  // ============================================

  /**
   * Sets the volume
   * @param volume Volume level from 0 to 1
   */
  public async setVolume(volume: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SetVolume)

    this.adapter!.setVolume(clampVolume(volume))
  }

  /**
   * Gets the current volume
   * @returns The current volume level (0 to 1)
   */
  public getVolume(): number {
    this.ensureInitialized()
    return this.adapter!.getVolume()
  }

  /**
   * Sets the playback rate
   * @param rate Playback rate from 0.25 to 4.0
   */
  public async setRate(rate: number): Promise<void> {
    this.ensureInitialized()
    this.ensureCapability(Capability.SetRate)

    const currentTrack = this.queueManager.getCurrentTrack()

    if (currentTrack?.isLiveStream) {
      throw new Error("Cannot change playback rate for live streams")
    }

    const clampedRate = clampRate(rate)
    this.adapter!.setRate(clampedRate)
    this.persistentRate = clampedRate
  }

  /**
   * Gets the current playback rate
   * @returns The current playback rate
   */
  public getRate(): number {
    this.ensureInitialized()
    return this.adapter!.getRate()
  }

  // ============================================
  // Public API - State Getters
  // ============================================

  /**
   * Gets the current playback state
   * @returns The playback state
   */
  public getPlaybackState(): State {
    return this.state
  }

  /**
   * Gets the current playback position
   * @returns The position in seconds
   */
  public getPosition(): number {
    if (!this.adapter) return 0
    return this.adapter.getPosition()
  }

  /**
   * Gets the duration of the current track
   * @returns The duration in seconds or 0 if no track is loaded
   */
  public getDuration(): number {
    if (!this.adapter) return 0
    return this.adapter.getDuration()
  }

  /**
   * Gets the buffered position of the current track
   * @returns The buffered position in seconds
   */
  public getBufferedPosition(): number {
    if (!this.adapter) return 0
    return this.adapter.getBufferedPosition()
  }

  /**
   * Gets the current progress information
   * @returns Progress object with position, duration, and buffered position
   */
  public getProgress(): Progress {
    return {
      position: this.getPosition(),
      duration: this.getDuration(),
      buffered: this.getBufferedPosition()
    }
  }

  // ============================================
  // Public API - Equalizer
  // ============================================

  /**
   * Enables or disables the equalizer
   * @param enabled True to enable, false to disable
   */
  public setEqualizerEnabled(enabled: boolean): void {
    this.ensureInitialized()
    this.equalizerManager.setEnabled(enabled)
  }

  /**
   * Checks if the equalizer is enabled
   * @returns True if the equalizer is enabled
   */
  public isEqualizerEnabled(): boolean {
    return this.equalizerManager.isEnabled()
  }

  /**
   * Sets the gain of a specific equalizer band
   * @param bandIndex Band index (0-9)
   * @param gain Gain in dB (-12 to +12)
   */
  public setEqualizerBandGain(bandIndex: number, gain: number): void {
    this.ensureInitialized()
    this.equalizerManager.setBandGain(bandIndex, gain)
  }

  /**
   * Gets the gain of a specific band
   * @param bandIndex Band index
   * @returns Gain in dB
   */
  public getEqualizerBandGain(bandIndex: number): number {
    return this.equalizerManager.getBandGain(bandIndex)
  }

  /**
   * Gets all equalizer bands
   * @returns Array with configuration of all bands
   */
  public getEqualizerBands(): EqualizerBand[] {
    return this.equalizerManager.getBands()
  }

  /**
   * Sets multiple equalizer bands at once
   * @param bands Array with the configuration of the bands
   */
  public setEqualizerBands(bands: EqualizerBand[]): void {
    this.ensureInitialized()
    this.equalizerManager.setBands(bands)
  }

  /**
   * Resets the equalizer to default values (all gains to 0)
   */
  public resetEqualizer(): void {
    this.ensureInitialized()
    this.equalizerManager.reset()
  }

  /**
   * Applies a predefined equalizer preset
   * @param preset Preset name
   */
  public setEqualizerPreset(preset: EqualizerPreset): void {
    this.ensureInitialized()
    this.equalizerManager.setPreset(preset)
  }

  // ============================================
  // Public API - Reset & Destroy
  // ============================================

  /**
   * Resets the player state
   */
  public async reset(): Promise<void> {
    if (!this.isSetup || !this.adapter) {
      return
    }

    this.isChangingTrack = false
    this.playWhenReady = false

    await this.adapter.stop()

    this.queueManager.clear()
    this.updateState(State.Ready)
  }

  /**
   * Destroys the player and releases resources
   */
  public async destroy(): Promise<void> {
    if (!this.adapter) return

    await this.adapter.destroy()

    this.queueManager.clear()
    this.eventEmitter.removeAllListeners()
    this.isSetup = false
    this.state = State.None
    this.adapter = null
  }

  /**
   * Checks if the player is initialized
   */
  public isInitialized(): boolean {
    return this.isSetup
  }
}
