import { AudioManager } from "react-native-audio-api"
import type { AudioEventSubscription } from "react-native-audio-api/lib/typescript/events"

import {
  BaseTrackPlayer,
  Capability,
  DEFAULT_CAPABILITIES,
  SetupNotCalledError,
  State,
  isPowerOfTwo,
  type AudioAnalysisData,
  type BaseSetupOptions,
  type EqualizerBand,
  type EqualizerPreset,
  type Event,
  type EventHandler,
  type PlayerAdapter,
  type Progress,
  type RepeatMode,
  type Track
} from "@track-player/core"

import { NativePlayerAdapter } from "./NativePlayerAdapter"

/**
 * iOS audio session category options
 */
export type IOSCategory =
  | "record"
  | "ambient"
  | "playback"
  | "multiRoute"
  | "soloAmbient"
  | "playAndRecord"

/**
 * iOS audio session mode options
 */
export type IOSMode =
  | "default"
  | "gameChat"
  | "videoChat"
  | "voiceChat"
  | "measurement"
  | "voicePrompt"
  | "spokenAudio"
  | "moviePlayback"
  | "videoRecording"

/**
 * iOS audio session options
 */
export type IOSOption =
  | "duckOthers"
  | "allowAirPlay"
  | "mixWithOthers"
  | "allowBluetooth"
  | "defaultToSpeaker"
  | "allowBluetoothA2DP"
  | "overrideMutedMicrophoneInterruption"
  | "interruptSpokenAudioAndMixWithOthers"

/**
 * Setup options for the native track player
 */
export interface NativeSetupOptions extends BaseSetupOptions {
  /**
   * Whether to enable lock screen controls (iOS/Android notification and lock screen)
   * @default true
   */
  useLockScreenControls?: boolean
  /**
   * Whether to handle audio interruptions (e.g., phone calls)
   * @default true
   */
  handleAudioInterruptions?: boolean
  /**
   * iOS audio session category
   * @default "playback"
   */
  iosCategory?: IOSCategory
  /**
   * iOS audio session mode
   * @default "default"
   */
  iosMode?: IOSMode
  /**
   * iOS audio session options
   * @default ["allowBluetooth", "allowAirPlay"]
   */
  iosOptions?: IOSOption[]
}

const DEFAULT_NATIVE_OPTIONS: Required<NativeSetupOptions> = {
  waitForBuffer: true,
  updateInterval: 1,
  useLockScreenControls: true,
  handleAudioInterruptions: true,
  capabilities: DEFAULT_CAPABILITIES,
  iosCategory: "playback",
  iosMode: "default",
  iosOptions: ["allowBluetooth", "allowAirPlay"]
}

/**
 * Native-specific TrackPlayer implementation
 *
 * Extends BaseTrackPlayer with React Native-specific features like
 * lock screen controls, remote commands, and audio interruption handling.
 */
class NativeTrackPlayer extends BaseTrackPlayer {
  private nativeOptions: Required<NativeSetupOptions> = DEFAULT_NATIVE_OPTIONS
  private progressIntervalId: ReturnType<typeof setInterval> | null = null
  private nativeAdapter: NativePlayerAdapter | null = null

  // AudioManager subscriptions
  private remotePlaySubscription: AudioEventSubscription | undefined
  private remotePauseSubscription: AudioEventSubscription | undefined
  private remoteStopSubscription: AudioEventSubscription | undefined
  private remoteNextTrackSubscription: AudioEventSubscription | undefined
  private remotePreviousTrackSubscription: AudioEventSubscription | undefined
  private remoteSeekSubscription: AudioEventSubscription | undefined
  private remoteChangePlaybackPositionSubscription: AudioEventSubscription | undefined
  private interruptionSubscription: AudioEventSubscription | undefined

  protected override createAdapter(): PlayerAdapter {
    this.nativeAdapter = new NativePlayerAdapter()
    return this.nativeAdapter
  }

  protected override async onBeforeInit(): Promise<void> {
    // Configure audio session for iOS
    AudioManager.setAudioSessionOptions({
      iosCategory: this.nativeOptions.iosCategory,
      iosMode: this.nativeOptions.iosMode,
      iosOptions: this.nativeOptions.iosOptions
    })
  }

  protected override async onAfterInit(): Promise<void> {
    if (this.nativeOptions.useLockScreenControls) {
      this.setupRemoteCommands()
    }

    if (this.nativeOptions.handleAudioInterruptions) {
      this.setupAudioInterruptions()
    }

    this.startProgressInterval()
  }

  public async initNative(options: NativeSetupOptions = {}): Promise<void> {
    this.nativeOptions = { ...DEFAULT_NATIVE_OPTIONS, ...options }
    await this.init(options)
  }

  // ============================================
  // Remote Commands (Lock Screen Controls)
  // ============================================

  private setupRemoteCommands(): void {
    const capabilities = this.nativeOptions.capabilities

    // Play command
    if (capabilities.includes(Capability.Play)) {
      AudioManager.enableRemoteCommand("remotePlay", true)
      this.remotePlaySubscription = AudioManager.addSystemEventListener("remotePlay", () => {
        this.play().catch(console.error)
      })
    }

    // Pause command
    if (capabilities.includes(Capability.Pause)) {
      AudioManager.enableRemoteCommand("remotePause", true)
      this.remotePauseSubscription = AudioManager.addSystemEventListener("remotePause", () => {
        this.pause().catch(console.error)
      })
    }

    // Stop command
    if (capabilities.includes(Capability.Stop)) {
      AudioManager.enableRemoteCommand("remoteStop", true)
      this.remoteStopSubscription = AudioManager.addSystemEventListener("remoteStop", () => {
        this.stop().catch(console.error)
      })
    }

    // Next track command
    if (capabilities.includes(Capability.SkipToNext)) {
      AudioManager.enableRemoteCommand("remoteNextTrack", true)
      this.remoteNextTrackSubscription = AudioManager.addSystemEventListener(
        "remoteNextTrack",
        () => {
          this.skipToNext().catch(console.error)
        }
      )
    }

    // Previous track command
    if (capabilities.includes(Capability.SkipToPrevious)) {
      AudioManager.enableRemoteCommand("remotePreviousTrack", true)
      this.remotePreviousTrackSubscription = AudioManager.addSystemEventListener(
        "remotePreviousTrack",
        () => {
          this.skipToPrevious().catch(console.error)
        }
      )
    }

    // Seek command
    if (capabilities.includes(Capability.SeekTo)) {
      AudioManager.enableRemoteCommand("remoteChangePlaybackPosition", true)
      this.remoteChangePlaybackPositionSubscription = AudioManager.addSystemEventListener(
        "remoteChangePlaybackPosition",
        (event) => {
          if (event.value !== undefined) {
            this.seekTo(event.value).catch(console.error)
          }
        }
      )
    }
  }

  private removeRemoteCommandSubscriptions(): void {
    this.remotePlaySubscription?.remove()
    this.remotePauseSubscription?.remove()
    this.remoteStopSubscription?.remove()
    this.remoteNextTrackSubscription?.remove()
    this.remotePreviousTrackSubscription?.remove()
    this.remoteSeekSubscription?.remove()
    this.remoteChangePlaybackPositionSubscription?.remove()

    this.remotePlaySubscription = undefined
    this.remotePauseSubscription = undefined
    this.remoteStopSubscription = undefined
    this.remoteNextTrackSubscription = undefined
    this.remotePreviousTrackSubscription = undefined
    this.remoteSeekSubscription = undefined
    this.remoteChangePlaybackPositionSubscription = undefined

    // Disable remote commands
    AudioManager.enableRemoteCommand("remotePlay", false)
    AudioManager.enableRemoteCommand("remotePause", false)
    AudioManager.enableRemoteCommand("remoteStop", false)
    AudioManager.enableRemoteCommand("remoteNextTrack", false)
    AudioManager.enableRemoteCommand("remotePreviousTrack", false)
    AudioManager.enableRemoteCommand("remoteChangePlaybackPosition", false)
  }

  // ============================================
  // Audio Interruptions
  // ============================================

  private setupAudioInterruptions(): void {
    AudioManager.observeAudioInterruptions(true)

    this.interruptionSubscription = AudioManager.addSystemEventListener("interruption", (event) => {
      if (event.type === "began") {
        // Pause playback when interruption begins (e.g., phone call)
        this.pause().catch(console.error)
      } else if (event.type === "ended" && event.shouldResume) {
        // Resume playback if interruption ended and we should resume
        this.play().catch(console.error)
      }
    })
  }

  private removeAudioInterruptionSubscription(): void {
    this.interruptionSubscription?.remove()
    this.interruptionSubscription = undefined
    AudioManager.observeAudioInterruptions(false)
  }

  // ============================================
  // Lock Screen Info
  // ============================================

  private updateLockScreenInfo(): void {
    if (!this.nativeOptions.useLockScreenControls) return

    const currentTrack = this.getActiveTrack()
    if (!currentTrack) return

    const state = this.getPlaybackState()
    const position = this.getPosition()
    const duration = this.getDuration()
    const rate = this.getRate()

    const lockScreenInfo: {
      title: string
      artist: string
      album: string
      artwork: string
      elapsedTime: number
      speed: number
      state: "state_playing" | "state_paused"
      duration?: number
    } = {
      title: currentTrack.title,
      artist: currentTrack.artist ?? "",
      album: currentTrack.album ?? "",
      artwork: currentTrack.artwork ?? "",
      elapsedTime: position,
      speed: rate,
      state: state === State.Playing ? "state_playing" : "state_paused"
    }

    if (duration > 0) {
      lockScreenInfo.duration = duration
    }

    AudioManager.setLockScreenInfo(lockScreenInfo)
  }

  // ============================================
  // Progress Interval
  // ============================================

  private startProgressInterval(): void {
    if (this.progressIntervalId) {
      this.stopProgressInterval()
    }

    const interval = this.nativeOptions.updateInterval * 1000

    this.progressIntervalId = setInterval(() => {
      this.emitProgress()

      // Update lock screen elapsed time
      if (this.nativeOptions.useLockScreenControls && this.getPlaybackState() === State.Playing) {
        this.updateLockScreenInfo()
      }
    }, interval)
  }

  private stopProgressInterval(): void {
    if (this.progressIntervalId) {
      clearInterval(this.progressIntervalId)
      this.progressIntervalId = null
    }
  }

  // ============================================
  // Overrides for Lock Screen Updates
  // ============================================

  public override async play(): Promise<void> {
    await super.play()

    if (this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async pause(): Promise<void> {
    await super.pause()

    if (this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async stop(): Promise<void> {
    await super.stop()

    if (this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async skip(index: number, initialPosition?: number): Promise<void> {
    await super.skip(index, initialPosition)

    if (this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async move(fromIndex: number, toIndex: number): Promise<void> {
    const currentIndex = this.getActiveTrackIndex()
    await super.move(fromIndex, toIndex)

    if (currentIndex === fromIndex && this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async updateMetadataForTrack(
    index: number,
    metadata: Partial<Track>
  ): Promise<void> {
    await super.updateMetadataForTrack(index, metadata)

    if (index === this.getActiveTrackIndex() && this.nativeOptions.useLockScreenControls) {
      this.updateLockScreenInfo()
    }
  }

  public override async updateOptions(options: Partial<NativeSetupOptions>): Promise<void> {
    await super.updateOptions(options)

    this.nativeOptions = { ...this.nativeOptions, ...options }

    if (options.updateInterval !== undefined) {
      this.startProgressInterval()
    }

    if (options.useLockScreenControls !== undefined || options.capabilities !== undefined) {
      if (this.nativeOptions.useLockScreenControls) {
        this.removeRemoteCommandSubscriptions()
        this.setupRemoteCommands()
        this.updateLockScreenInfo()
      } else {
        this.removeRemoteCommandSubscriptions()
      }
    }

    if (options.handleAudioInterruptions !== undefined) {
      if (this.nativeOptions.handleAudioInterruptions) {
        this.removeAudioInterruptionSubscription()
        this.setupAudioInterruptions()
      } else {
        this.removeAudioInterruptionSubscription()
      }
    }

    // Update iOS audio session settings
    if (
      options.iosCategory !== undefined ||
      options.iosMode !== undefined ||
      options.iosOptions !== undefined
    ) {
      AudioManager.setAudioSessionOptions({
        iosCategory: this.nativeOptions.iosCategory,
        iosMode: this.nativeOptions.iosMode,
        iosOptions: this.nativeOptions.iosOptions
      })
    }
  }

  public override async reset(): Promise<void> {
    this.stopProgressInterval()

    await super.reset()

    this.startProgressInterval()
  }

  public override async destroy(): Promise<void> {
    this.stopProgressInterval()
    this.removeRemoteCommandSubscriptions()
    this.removeAudioInterruptionSubscription()

    await super.destroy()
  }

  // ============================================
  // Audio Analysis Methods
  // ============================================

  public getAudioAnalysisData(): AudioAnalysisData | null {
    return this.nativeAdapter?.getAudioAnalysisData() ?? null
  }

  public configureAudioAnalyser(fftSize: number = 2048, smoothingTimeConstant: number = 0.8): void {
    if (!isPowerOfTwo(fftSize)) {
      throw new Error("fftSize must be a power of 2")
    }

    this.nativeAdapter?.configureAudioAnalyser(fftSize, smoothingTimeConstant)
  }
}

/**
 * TrackPlayer static API for React Native
 */
class TrackPlayer {
  private static instance: NativeTrackPlayer | null = null

  public static async setupPlayer(options: NativeSetupOptions = {}): Promise<void> {
    if (!TrackPlayer.instance) {
      TrackPlayer.instance = new NativeTrackPlayer()
    }

    await TrackPlayer.instance.initNative(options)
  }

  private static getInstance(): NativeTrackPlayer {
    if (!TrackPlayer.instance || !TrackPlayer.instance.isInitialized()) {
      throw new SetupNotCalledError()
    }

    return TrackPlayer.instance
  }

  public static addEventListener(event: Event, listener: EventHandler): void {
    TrackPlayer.getInstance().addEventListener(event, listener)
  }

  public static removeEventListener(event: Event, listener: EventHandler): boolean {
    return TrackPlayer.getInstance().removeEventListener(event, listener)
  }

  public static async updateOptions(options: Partial<NativeSetupOptions>): Promise<void> {
    await TrackPlayer.getInstance().updateOptions(options)
  }

  public static async add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void> {
    await TrackPlayer.getInstance().add(tracks, insertBeforeIndex)
  }

  public static async move(fromIndex: number, toIndex: number): Promise<void> {
    await TrackPlayer.getInstance().move(fromIndex, toIndex)
  }

  public static async remove(indices: number | number[]): Promise<void> {
    await TrackPlayer.getInstance().remove(indices)
  }

  public static async skip(index: number, initialPosition?: number): Promise<void> {
    await TrackPlayer.getInstance().skip(index, initialPosition)
  }

  public static async skipToNext(initialPosition?: number): Promise<void> {
    await TrackPlayer.getInstance().skipToNext(initialPosition)
  }

  public static async skipToPrevious(initialPosition?: number): Promise<void> {
    await TrackPlayer.getInstance().skipToPrevious(initialPosition)
  }

  public static getQueue(): Track[] {
    return TrackPlayer.getInstance().getQueue()
  }

  public static getTrack(index: number): Track | undefined {
    return TrackPlayer.getInstance().getTrack(index)
  }

  public static getActiveTrack(): Track | undefined {
    return TrackPlayer.getInstance().getActiveTrack()
  }

  public static getActiveTrackIndex(): number {
    return TrackPlayer.getInstance().getActiveTrackIndex()
  }

  public static async updateMetadataForTrack(
    index: number,
    metadata: Partial<Track>
  ): Promise<void> {
    await TrackPlayer.getInstance().updateMetadataForTrack(index, metadata)
  }

  public static async setRepeatMode(mode: RepeatMode): Promise<void> {
    await TrackPlayer.getInstance().setRepeatMode(mode)
  }

  public static getRepeatMode(): RepeatMode {
    return TrackPlayer.getInstance().getRepeatMode()
  }

  public static async play(): Promise<void> {
    await TrackPlayer.getInstance().play()
  }

  public static async pause(): Promise<void> {
    await TrackPlayer.getInstance().pause()
  }

  public static async stop(): Promise<void> {
    await TrackPlayer.getInstance().stop()
  }

  public static async seekTo(position: number): Promise<void> {
    await TrackPlayer.getInstance().seekTo(position)
  }

  public static async seekBy(offset: number): Promise<void> {
    await TrackPlayer.getInstance().seekBy(offset)
  }

  public static async retry(): Promise<void> {
    await TrackPlayer.getInstance().retry()
  }

  public static async setVolume(volume: number): Promise<void> {
    await TrackPlayer.getInstance().setVolume(volume)
  }

  public static getVolume(): number {
    return TrackPlayer.getInstance().getVolume()
  }

  public static async setRate(rate: number): Promise<void> {
    await TrackPlayer.getInstance().setRate(rate)
  }

  public static getRate(): number {
    return TrackPlayer.getInstance().getRate()
  }

  public static getPlaybackState(): State {
    return TrackPlayer.getInstance().getPlaybackState()
  }

  public static getPosition(): number {
    return TrackPlayer.getInstance().getPosition()
  }

  public static getDuration(): number {
    return TrackPlayer.getInstance().getDuration()
  }

  public static getBufferedPosition(): number {
    return TrackPlayer.getInstance().getBufferedPosition()
  }

  public static getProgress(): Progress {
    return TrackPlayer.getInstance().getProgress()
  }

  public static setEqualizerEnabled(enabled: boolean): void {
    TrackPlayer.getInstance().setEqualizerEnabled(enabled)
  }

  public static isEqualizerEnabled(): boolean {
    return TrackPlayer.getInstance().isEqualizerEnabled()
  }

  public static setEqualizerBandGain(bandIndex: number, gain: number): void {
    TrackPlayer.getInstance().setEqualizerBandGain(bandIndex, gain)
  }

  public static getEqualizerBandGain(bandIndex: number): number {
    return TrackPlayer.getInstance().getEqualizerBandGain(bandIndex)
  }

  public static getEqualizerBands(): EqualizerBand[] {
    return TrackPlayer.getInstance().getEqualizerBands()
  }

  public static setEqualizerBands(bands: EqualizerBand[]): void {
    TrackPlayer.getInstance().setEqualizerBands(bands)
  }

  public static resetEqualizer(): void {
    TrackPlayer.getInstance().resetEqualizer()
  }

  public static setEqualizerPreset(preset: EqualizerPreset): void {
    TrackPlayer.getInstance().setEqualizerPreset(preset)
  }

  public static getAudioAnalysisData(): AudioAnalysisData | null {
    return TrackPlayer.getInstance().getAudioAnalysisData()
  }

  public static configureAudioAnalyser(
    fftSize: number = 2048,
    smoothingTimeConstant: number = 0.8
  ): void {
    TrackPlayer.getInstance().configureAudioAnalyser(fftSize, smoothingTimeConstant)
  }

  public static async reset(): Promise<void> {
    if (!TrackPlayer.instance || !TrackPlayer.instance.isInitialized()) {
      return
    }

    await TrackPlayer.instance.reset()
  }

  public static async destroy(): Promise<void> {
    if (!TrackPlayer.instance) {
      return
    }

    await TrackPlayer.instance.destroy()
    TrackPlayer.instance = null
  }
}

export default TrackPlayer
