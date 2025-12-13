import type { AudioAnalysisData, Track } from "./types"

/**
 * Platform-agnostic player adapter interface
 *
 * This interface defines the contract that each platform (web, native, etc.)
 * must implement to provide audio playback capabilities. The BaseTrackPlayer
 * uses this interface to delegate platform-specific operations while
 * maintaining all business logic in a framework-agnostic manner.
 */
export interface PlayerAdapter {
  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Initializes the platform-specific audio player
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>

  /**
   * Destroys the player and releases all resources
   * @returns Promise that resolves when cleanup is complete
   */
  destroy(): Promise<void>

  // ============================================
  // Playback Control
  // ============================================

  /**
   * Cancels any ongoing track loading operation.
   * @returns Promise that resolves when cancellation is complete, or void.
   */
  cancelLoad?(): void | Promise<void>

  /**
   * Loads and prepares a track for playback
   * @param track The track to load
   * @returns Promise that resolves when the track is loaded
   */
  load(track: Track): Promise<void>

  /**
   * Starts or resumes playback
   * @returns Promise that resolves when playback starts
   */
  play(): Promise<void>

  /**
   * Pauses playback
   * @returns Promise that resolves when playback is paused
   */
  pause(): Promise<void>

  /**
   * Stops playback and resets position to the beginning
   * @returns Promise that resolves when playback is stopped
   */
  stop(): Promise<void>

  /**
   * Seeks to a specific position in the current track
   * @param position Position in seconds
   * @returns Promise that resolves when seek is complete
   */
  seekTo(position: number): Promise<void>

  // ============================================
  // State Getters
  // ============================================

  /**
   * Gets the current playback position
   * @returns Current position in seconds
   */
  getPosition(): number

  /**
   * Gets the duration of the current track
   * @returns Duration in seconds, or 0 if no track is loaded
   */
  getDuration(): number

  /**
   * Gets the buffered position
   * @returns Buffered position in seconds
   */
  getBufferedPosition(): number

  /**
   * Checks if the player is currently playing
   * @returns True if playing, false otherwise
   */
  isPlaying(): boolean

  // ============================================
  // Volume & Rate
  // ============================================

  /**
   * Sets the playback volume
   * @param volume Volume level from 0 to 1
   */
  setVolume(volume: number): void

  /**
   * Gets the current volume
   * @returns Current volume level (0 to 1)
   */
  getVolume(): number

  /**
   * Sets the playback rate
   * @param rate Playback rate (1.0 is normal speed)
   */
  setRate(rate: number): void

  /**
   * Gets the current playback rate
   * @returns Current playback rate
   */
  getRate(): number

  // ============================================
  // Equalizer (Optional)
  // ============================================

  /**
   * Sets the gain for a specific equalizer band
   * @param index Band index (0-9)
   * @param gain Gain in dB
   */
  setEqualizerBandGain?(index: number, gain: number): void

  /**
   * Sets the pre-amp gain for the equalizer
   * @param gain Pre-amp gain in dB
   */
  setEqualizerPreAmpGain?(gain: number): void

  /**
   * Enables or disables the equalizer
   * @param enabled Whether the equalizer should be enabled
   */
  setEqualizerEnabled?(enabled: boolean): void

  // ============================================
  // Audio Analysis (Optional)
  // ============================================

  /**
   * Gets real-time audio analysis data for visualizations
   * @returns Audio analysis data or null if not available
   */
  getAudioAnalysisData?(): AudioAnalysisData | null

  /**
   * Configures the audio analyser
   * @param fftSize FFT size (must be a power of 2)
   * @param smoothingTimeConstant Temporal smoothing (0-1)
   */
  configureAudioAnalyser?(fftSize: number, smoothingTimeConstant: number): void

  // ============================================
  // Event Callbacks
  // ============================================

  /**
   * Called when playback ends naturally
   */
  onEnded?: () => void

  /**
   * Called when a playback error occurs
   * @param error Error message
   * @param code Optional error code
   */
  onError?: (error: string, code?: string) => void

  /**
   * Called when the buffering state changes
   * @param isBuffering Whether the player is buffering
   */
  onBuffering?: (isBuffering: boolean) => void

  /**
   * Called when metadata is loaded
   */
  onMetadataLoaded?: () => void

  /**
   * Called when the player is ready to play
   */
  onCanPlay?: () => void
}
