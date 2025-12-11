export {
  Capability,
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
} from "./constants"

export type {
  AudioSource,
  AudioAnalysisData,
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
  Progress,
  SetupOptions,
  Track,
  TrackChangedEventData
} from "./types"

export { EqualizerManager } from "./EqualizerManager"
export { EventEmitter } from "./EventEmitter"
export { QueueManager } from "./QueueManager"

export { BaseTrackPlayer } from "./BaseTrackPlayer"
export type { BaseSetupOptions } from "./BaseTrackPlayer"
export type { PlayerAdapter } from "./PlayerAdapter"

export {
  CapabilityNotEnabledError,
  InvalidOperationError,
  NoTrackLoadedError,
  PlayerNotInitializedError,
  SetupNotCalledError,
  TrackNotFoundError,
  TrackPlayerError
} from "./errors"

export { clampRate, clampVolume, isPowerOfTwo } from "./utils"
