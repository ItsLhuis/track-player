// Re-export everything from core
export {
  // Base classes (for custom implementations)
  BaseTrackPlayer,
  // Enums
  Capability,
  // Constants
  DEFAULT_CAPABILITIES,
  DEFAULT_Q,
  DEFAULT_UPDATE_INTERVAL,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
  Event,
  GAIN_MAX,
  GAIN_MIN,
  MAX_RATE,
  MIN_RATE,
  RepeatMode,
  State
} from "@track-player/core"

// Re-export types from core
export type {
  AudioSource,
  AudioAnalysisData,
  BaseSetupOptions,
  EqualizerBand,
  EqualizerFrequency,
  EqualizerPreset,
  EqualizerState,
  EventData,
  EventHandler,
  PlaybackErrorEventData,
  PlaybackProgressEventData,
  PlaybackQueueEndedEventData,
  PlaybackStateEventData,
  PlayerAdapter,
  Progress,
  SetupOptions,
  Track,
  TrackChangedEventData
} from "@track-player/core"

// Export native-specific implementations
export { NativePlayerAdapter } from "./NativePlayerAdapter"
export type { IOSCategory, IOSMode, IOSOption, NativeSetupOptions } from "./TrackPlayer"

// Export TrackPlayer as default
import TrackPlayer from "./TrackPlayer"
export default TrackPlayer

// Export hooks
export {
  useActiveTrack,
  useIsBuffering,
  usePlaybackState,
  usePlayWhenReady,
  useProgress,
  useQueue,
  useTrackPlayerEvents
} from "./hooks"
