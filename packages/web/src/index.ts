// Re-export everything from core
export {
  // Enums
  Capability,
  Event,
  State,
  RepeatMode,
  // Constants
  DEFAULT_CAPABILITIES,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
  GAIN_MIN,
  GAIN_MAX,
  DEFAULT_Q,
  DEFAULT_UPDATE_INTERVAL,
  MIN_RATE,
  MAX_RATE,
  // Base classes (for custom implementations)
  BaseTrackPlayer
} from "@track-player/core"

// Re-export types from core
export type {
  Track,
  Progress,
  SetupOptions,
  BaseSetupOptions,
  TrackChangedEventData,
  PlaybackStateEventData,
  PlaybackErrorEventData,
  PlaybackProgressEventData,
  PlaybackQueueEndedEventData,
  EventData,
  EventHandler,
  EqualizerFrequency,
  EqualizerBand,
  EqualizerPreset,
  EqualizerState,
  AudioAnalysisData,
  PlayerAdapter
} from "@track-player/core"

// Export web-specific implementations
export { WebPlayerAdapter } from "./WebPlayerAdapter"
export type { WebSetupOptions } from "./TrackPlayer"

// Export TrackPlayer
import TrackPlayer from "./TrackPlayer"
export default TrackPlayer
export { TrackPlayer }

// Export hooks
export {
  useTrackPlayerEvents,
  useProgress,
  usePlaybackState,
  usePlayWhenReady,
  useActiveTrack
} from "./hooks"
