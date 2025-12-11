import {
  BaseTrackPlayer,
  Capability,
  DEFAULT_CAPABILITIES,
  SetupNotCalledError,
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
  type State,
  type Track
} from "@track-player/core"

import { WebPlayerAdapter } from "./WebPlayerAdapter"

/**
 * Setup options for the web track player
 */
export interface WebSetupOptions extends BaseSetupOptions {
  /**
   * Whether to enable integration with the MediaSession API
   * @default true
   */
  useMediaSession?: boolean
}

const DEFAULT_WEB_OPTIONS: Required<WebSetupOptions> = {
  waitForBuffer: true,
  updateInterval: 1,
  useMediaSession: true,
  capabilities: DEFAULT_CAPABILITIES
}

/**
 * Web-specific TrackPlayer implementation
 *
 * Extends BaseTrackPlayer with web-specific features like MediaSession API
 * integration and progress interval using requestAnimationFrame.
 */
class WebTrackPlayer extends BaseTrackPlayer {
  private webOptions: Required<WebSetupOptions> = DEFAULT_WEB_OPTIONS
  private progressInterval: number | null = null
  private metadataLoadedMap: Map<number, boolean> = new Map()
  private webAdapter: WebPlayerAdapter | null = null

  protected override createAdapter(): PlayerAdapter {
    this.webAdapter = new WebPlayerAdapter()
    return this.webAdapter
  }

  protected override async onAfterInit(): Promise<void> {
    if (this.webOptions.useMediaSession && "mediaSession" in navigator) {
      this.setupMediaSession()
    }

    this.startProgressInterval()
  }

  public async initWeb(options: WebSetupOptions = {}): Promise<void> {
    this.webOptions = { ...DEFAULT_WEB_OPTIONS, ...options }

    await this.init(options)
  }

  private setupMediaSession(): void {
    if (!("mediaSession" in navigator)) return

    const capabilities = this.webOptions.capabilities

    if (capabilities.includes(Capability.Play)) {
      navigator.mediaSession.setActionHandler("play", () => {
        this.play().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("play", null)
    }

    if (capabilities.includes(Capability.Pause)) {
      navigator.mediaSession.setActionHandler("pause", () => {
        this.pause().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("pause", null)
    }

    if (capabilities.includes(Capability.Stop)) {
      navigator.mediaSession.setActionHandler("stop", () => {
        this.stop().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("stop", null)
    }

    if (capabilities.includes(Capability.SkipToPrevious)) {
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        this.skipToPrevious().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("previoustrack", null)
    }

    if (capabilities.includes(Capability.SkipToNext)) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        this.skipToNext().catch(console.error)
      })
    } else {
      navigator.mediaSession.setActionHandler("nexttrack", null)
    }

    if (capabilities.includes(Capability.SeekTo)) {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          this.seekTo(details.seekTime).catch(console.error)
        }
      })
    } else {
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }

  private updateMediaSessionMetadata(): void {
    if (!("mediaSession" in navigator)) return

    const currentTrack = this.getActiveTrack()
    if (!currentTrack) return

    const metadata: MediaMetadataInit = {
      title: currentTrack.title,
      artist: currentTrack.artist ?? "",
      album: currentTrack.album ?? ""
    }

    if (currentTrack.artwork && typeof currentTrack.artwork === "string") {
      metadata.artwork = [{ src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" }]
    }

    navigator.mediaSession.metadata = new MediaMetadata(metadata)
  }

  private startProgressInterval(): void {
    if (this.progressInterval) {
      this.stopProgressInterval()
    }

    const interval = this.webOptions.updateInterval
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

  private stopProgressInterval(): void {
    if (this.progressInterval) {
      cancelAnimationFrame(this.progressInterval)
      this.progressInterval = null
    }
  }

  private preloadNextTrackMetadata(): void {
    const currentIndex = this.getActiveTrackIndex()
    const queue = this.getQueue()

    if (currentIndex < queue.length - 1) {
      const nextTrackIndex = currentIndex + 1
      const nextTrack = this.getTrack(nextTrackIndex)

      if (
        nextTrack &&
        !nextTrack.isLiveStream &&
        !this.metadataLoadedMap.get(nextTrackIndex) &&
        typeof nextTrack.url === "string"
      ) {
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

  public override async skip(index: number, initialPosition?: number): Promise<void> {
    await super.skip(index, initialPosition)
    if (this.webOptions.useMediaSession) {
      this.updateMediaSessionMetadata()
    }
    this.preloadNextTrackMetadata()
  }

  public override async move(fromIndex: number, toIndex: number): Promise<void> {
    const currentIndex = this.getActiveTrackIndex()
    await super.move(fromIndex, toIndex)
    const metadataLoaded = this.metadataLoadedMap.get(fromIndex)
    if (metadataLoaded !== undefined) {
      this.metadataLoadedMap.delete(fromIndex)
      this.metadataLoadedMap.set(toIndex, metadataLoaded)
    }
    if (currentIndex === fromIndex && this.webOptions.useMediaSession) {
      this.updateMediaSessionMetadata()
    }
  }

  public override async remove(indices: number | number[]): Promise<void> {
    await super.remove(indices)
    const indicesArray = Array.isArray(indices) ? indices : [indices]
    for (const index of indicesArray) {
      this.metadataLoadedMap.delete(index)
    }
  }

  public override async updateMetadataForTrack(
    index: number,
    metadata: Partial<Track>
  ): Promise<void> {
    await super.updateMetadataForTrack(index, metadata)

    if (index === this.getActiveTrackIndex() && this.webOptions.useMediaSession) {
      this.updateMediaSessionMetadata()
    }
  }

  public override async updateOptions(options: Partial<WebSetupOptions>): Promise<void> {
    await super.updateOptions(options)

    this.webOptions = { ...this.webOptions, ...options }

    if (options.updateInterval !== undefined) {
      this.startProgressInterval()
    }

    if (options.useMediaSession !== undefined || options.capabilities !== undefined) {
      if (this.webOptions.useMediaSession && "mediaSession" in navigator) {
        this.setupMediaSession()
        this.updateMediaSessionMetadata()
      }
    }
  }

  public override async reset(): Promise<void> {
    this.stopProgressInterval()

    await super.reset()

    this.metadataLoadedMap.clear()

    if (this.webOptions.useMediaSession && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = null
    }

    this.startProgressInterval()
  }

  public override async destroy(): Promise<void> {
    this.stopProgressInterval()
    this.metadataLoadedMap.clear()

    await super.destroy()
  }

  public getAudioAnalysisData(): AudioAnalysisData | null {
    return this.webAdapter?.getAudioAnalysisData() ?? null
  }

  public configureAudioAnalyser(fftSize: number = 2048, smoothingTimeConstant: number = 0.8): void {
    if (!isPowerOfTwo(fftSize)) {
      throw new Error("fftSize must be a power of 2")
    }

    this.webAdapter?.configureAudioAnalyser(fftSize, smoothingTimeConstant)
  }
}

/**
 * TrackPlayer static API
 */
class TrackPlayer {
  private static instance: WebTrackPlayer | null = null

  public static async setupPlayer(options: WebSetupOptions = {}): Promise<void> {
    if (!TrackPlayer.instance) {
      TrackPlayer.instance = new WebTrackPlayer()
    }

    await TrackPlayer.instance.initWeb(options)
  }

  private static getInstance(): WebTrackPlayer {
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

  public static async updateOptions(options: Partial<WebSetupOptions>): Promise<void> {
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
