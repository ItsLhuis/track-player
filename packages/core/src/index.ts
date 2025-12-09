export {
  Capability,
  Event,
  State,
  RepeatMode,
  DEFAULT_CAPABILITIES,
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
  GAIN_MIN,
  GAIN_MAX,
  DEFAULT_Q,
  DEFAULT_UPDATE_INTERVAL,
  MIN_RATE,
  MAX_RATE
} from "./constants"

export type {
  Track,
  Progress,
  SetupOptions,
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
  AudioAnalysisData
} from "./types"

export { QueueManager } from "./QueueManager"
export { EventEmitter } from "./EventEmitter"
export { EqualizerManager } from "./EqualizerManager"

export {
  TrackPlayerError,
  SetupNotCalledError,
  PlayerNotInitializedError,
  NoTrackLoadedError,
  CapabilityNotEnabledError,
  TrackNotFoundError,
  InvalidOperationError
} from "./errors"

export { clampVolume, clampRate, isPowerOfTwo } from "./utils"
