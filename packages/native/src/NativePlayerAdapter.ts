import { Asset } from "expo-asset"

import {
  AudioContext,
  type AudioBuffer,
  type AudioBufferSourceNode,
  type BiquadFilterNode,
  type GainNode,
  type AnalyserNode
} from "react-native-audio-api"

import {
  EQUALIZER_FREQUENCIES,
  type AudioSource,
  type AudioAnalysisData,
  type PlayerAdapter,
  type Track
} from "@track-player/core"

/**
 * React Native implementation of the PlayerAdapter interface
 *
 * This class handles all React Native-specific audio functionality using
 * react-native-audio-api for playback, equalization, and analysis.
 */
export class NativePlayerAdapter implements PlayerAdapter {
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private equalizerFilters: BiquadFilterNode[] = []
  private analyserNode: AnalyserNode | null = null

  // Playback state
  private isCurrentlyPlaying: boolean = false
  private startTime: number = 0
  private pausedAt: number = 0
  private currentDuration: number = 0
  private currentVolume: number = 1
  private currentRate: number = 1
  private isLoaded: boolean = false

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
    try {
      this.audioContext = new AudioContext()
      this.createAudioNodes()
    } catch (error) {
      throw new Error(
        `Failed to initialize NativePlayerAdapter: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async destroy(): Promise<void> {
    this.stopAndCleanupSource()

    if (this.audioContext) {
      await this.audioContext.close()
    }

    this.audioContext = null
    this.audioBuffer = null
    this.gainNode = null
    this.equalizerFilters = []
    this.analyserNode = null
    this.isCurrentlyPlaying = false
    this.isLoaded = false
    this.startTime = 0
    this.pausedAt = 0
    this.currentDuration = 0
  }

  // ============================================
  // Audio Nodes Setup
  // ============================================

  private createAudioNodes(): void {
    if (!this.audioContext) return

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = this.currentVolume

    // Create analyser node for audio visualization
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    // Create equalizer filters (10-band)
    this.equalizerFilters = EQUALIZER_FREQUENCIES.map((frequency) => {
      const filter = this.audioContext!.createBiquadFilter()
      filter.type = "peaking"
      filter.frequency.value = frequency
      filter.Q.value = 1
      filter.gain.value = 0
      return filter
    })

    // Connect the static part of the audio graph:
    // EQ filters -> Analyser -> Gain -> Destination
    let previousNode: GainNode | BiquadFilterNode | AnalyserNode = this.equalizerFilters[0]!

    for (let i = 1; i < this.equalizerFilters.length; i++) {
      previousNode.connect(this.equalizerFilters[i]!)
      previousNode = this.equalizerFilters[i]!
    }

    previousNode.connect(this.analyserNode)
    this.analyserNode.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)
  }

  private connectSourceNode(): void {
    if (!this.sourceNode || this.equalizerFilters.length === 0) return

    // Connect source to first EQ filter
    this.sourceNode.connect(this.equalizerFilters[0]!)
  }

  private stopAndCleanupSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch {
        // Ignore errors if already stopped
      }
      try {
        this.sourceNode.disconnect()
      } catch {
        // Ignore errors if already disconnected
      }
      this.sourceNode = null
    }
  }

  // ============================================
  // Playback Control
  // ============================================

  async load(track: Track): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized")
    }

    // Stop any current playback and reset state
    this.stopAndCleanupSource()
    this.isCurrentlyPlaying = false
    this.isLoaded = false
    this.pausedAt = 0
    this.audioBuffer = null
    this.currentDuration = 0

    this.onBuffering?.(true)

    try {
      // Resolve the audio source (handle both Metro asset IDs and URLs)
      const audioSource = await this.resolveAssetSource(track.url)

      let buffer: AudioBuffer

      if (this.isLocalFilePath(audioSource)) {
        // Use decodeAudioData with string path for local files
        buffer = await this.audioContext.decodeAudioData(audioSource)
      } else {
        // Fetch and decode audio data for remote URLs
        const response = await fetch(audioSource)

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        buffer = await this.audioContext.decodeAudioData(arrayBuffer)
      }

      this.audioBuffer = buffer
      this.currentDuration = buffer.duration
      this.isLoaded = true

      this.onMetadataLoaded?.()
      this.onBuffering?.(false)
      this.onCanPlay?.()
    } catch (error) {
      this.onBuffering?.(false)
      this.isLoaded = false
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.onError?.(errorMessage, "LOAD_ERROR")
      throw error
    }
  }

  /**
   * Resolves an asset source to a URI string
   */
  private async resolveAssetSource(source: AudioSource): Promise<string> {
    if (typeof source === "number") {
      // Metro asset ID - resolve using expo-asset
      const asset = Asset.fromModule(source)
      await asset.downloadAsync()

      if (!asset.localUri) {
        throw new Error("Failed to resolve local asset URI")
      }

      return asset.localUri
    }

    // Already a string URL
    return source
  }

  /**
   * Determines if a URL represents a local file path
   */
  private isLocalFilePath(url: string): boolean {
    return (
      url.startsWith("file://") ||
      url.startsWith("/") ||
      url.startsWith("content://") ||
      url.startsWith("asset:/")
    )
  }

  async play(): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized")
    }

    if (!this.audioBuffer || !this.isLoaded) {
      throw new Error("No audio loaded")
    }

    // If already playing, do nothing
    if (this.isCurrentlyPlaying) {
      return
    }

    // Create new source node (AudioBufferSourceNode can only be started once)
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.playbackRate.value = this.currentRate

    // Setup ended callback
    this.sourceNode.onEnded = () => {
      // Only trigger onEnded if playback completed naturally (not stopped/paused)
      if (this.isCurrentlyPlaying) {
        const pos = this.getPosition()
        if (pos >= this.currentDuration - 0.5) {
          this.isCurrentlyPlaying = false
          this.pausedAt = 0
          this.onEnded?.()
        }
      }
    }

    // Connect source to audio graph
    this.connectSourceNode()

    // Start playback from paused position
    const offset = this.pausedAt
    this.startTime = this.audioContext.currentTime - offset / this.currentRate
    this.sourceNode.start(0, offset)

    this.isCurrentlyPlaying = true
  }

  async pause(): Promise<void> {
    if (!this.isCurrentlyPlaying || !this.sourceNode) {
      return
    }

    // Save current position
    this.pausedAt = this.getPosition()
    this.isCurrentlyPlaying = false

    // Stop and cleanup current source
    this.stopAndCleanupSource()
  }

  async stop(): Promise<void> {
    this.isCurrentlyPlaying = false
    this.pausedAt = 0
    this.startTime = 0
    this.isLoaded = false

    this.stopAndCleanupSource()
    this.audioBuffer = null
    this.currentDuration = 0
  }

  async seekTo(position: number): Promise<void> {
    if (!this.audioBuffer || !this.isLoaded) {
      return
    }

    const clampedPosition = Math.max(0, Math.min(position, this.currentDuration))

    if (this.isCurrentlyPlaying) {
      // Stop current playback
      this.stopAndCleanupSource()

      // Create new source and start from new position
      if (this.audioContext) {
        this.sourceNode = this.audioContext.createBufferSource()
        this.sourceNode.buffer = this.audioBuffer
        this.sourceNode.playbackRate.value = this.currentRate

        this.sourceNode.onEnded = () => {
          if (this.isCurrentlyPlaying) {
            const pos = this.getPosition()
            if (pos >= this.currentDuration - 0.5) {
              this.isCurrentlyPlaying = false
              this.pausedAt = 0
              this.onEnded?.()
            }
          }
        }

        this.connectSourceNode()
        this.startTime = this.audioContext.currentTime - clampedPosition / this.currentRate
        this.sourceNode.start(0, clampedPosition)
      }
    } else {
      // Just update the paused position
      this.pausedAt = clampedPosition
    }
  }

  // ============================================
  // State Getters
  // ============================================

  getPosition(): number {
    if (!this.audioContext) {
      return 0
    }

    if (this.isCurrentlyPlaying) {
      const elapsed = (this.audioContext.currentTime - this.startTime) * this.currentRate
      return Math.min(elapsed, this.currentDuration)
    }

    return this.pausedAt
  }

  getDuration(): number {
    return this.currentDuration
  }

  getBufferedPosition(): number {
    // For AudioBuffer, the entire file is buffered once loaded
    return this.isLoaded ? this.currentDuration : 0
  }

  isPlaying(): boolean {
    return this.isCurrentlyPlaying
  }

  // ============================================
  // Volume & Rate
  // ============================================

  setVolume(volume: number): void {
    this.currentVolume = volume

    if (this.gainNode) {
      this.gainNode.gain.value = volume
    }
  }

  getVolume(): number {
    return this.currentVolume
  }

  setRate(rate: number): void {
    const previousPosition = this.getPosition()
    this.currentRate = rate

    if (this.sourceNode && this.audioContext) {
      this.sourceNode.playbackRate.value = rate
      // Recalculate start time to maintain position
      if (this.isCurrentlyPlaying) {
        this.startTime = this.audioContext.currentTime - previousPosition / rate
      }
    }
  }

  getRate(): number {
    return this.currentRate
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
