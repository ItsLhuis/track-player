/**
 * Player capabilities
 *
 * Defines the actions that the player can support and expose to the UI,
 * such as play, pause, skip, seek, etc.
 */
export enum Capability {
  /** Allows playing the current track */
  Play = "play",
  /** Allows pausing the current track */
  Pause = "pause",
  /** Allows stopping playback */
  Stop = "stop",
  /** Allows skipping to any track in the queue */
  Skip = "skip",
  /** Allows skipping to the next track in the queue */
  SkipToNext = "skip-to-next",
  /** Allows skipping to the previous track in the queue */
  SkipToPrevious = "skip-to-previous",
  /** Allows seeking to a specific position in the track */
  SeekTo = "seek-to",
  /** Allows seeking forward or backward by a relative amount of time */
  SeekBy = "seek-by",
  /** Allows setting the playback volume */
  SetVolume = "set-volume",
  /** Allows changing the playback rate (e.g. speed up or slow down) */
  SetRate = "set-rate"
}

/**
 * Player events
 *
 * Defines the events emitted by the player during its lifecycle,
 * such as state changes, track changes, progress updates, etc.
 */
export enum Event {
  /** Emitted when the playback state changes (e.g. playing, paused) */
  PlaybackState = "playback-state",
  /** Emitted when an error occurs during playback */
  PlaybackError = "playback-error",
  /** Emitted when the current track changes (e.g. skip, auto-next) */
  PlaybackTrackChanged = "playback-track-changed",
  /** Emitted periodically with the current playback position */
  PlaybackProgressUpdated = "playback-progress-updated",
  /** Emitted when the queue has ended and no more tracks remain */
  PlaybackQueueEnded = "playback-queue-ended"
}

/**
 * Player states
 *
 * Represents the various states the player can be in,
 * such as playing, paused, buffering, etc.
 */
export enum State {
  /** No track is loaded */
  None = "none",
  /** Player is ready with a loaded track */
  Ready = "ready",
  /** Playback is currently active */
  Playing = "playing",
  /** Playback is paused */
  Paused = "paused",
  /** Playback is stopped */
  Stopped = "stopped",
  /** Player is buffering data */
  Buffering = "buffering",
  /** An error occurred and playback cannot proceed */
  Error = "error"
}

/**
 * Repeat modes
 *
 * Controls the repeat behavior of the player, such as repeating
 * a single track or the entire queue.
 */
export enum RepeatMode {
  /** Doesn't repeat anything */
  Off = "off",
  /** Loops the current track indefinitely */
  Track = "track",
  /** Repeats the entire queue from the beginning */
  Queue = "queue"
}

/** Default capabilities enabled for the player */
export const DEFAULT_CAPABILITIES: Capability[] = [
  Capability.Play,
  Capability.Pause,
  Capability.Stop,
  Capability.Skip,
  Capability.SkipToNext,
  Capability.SkipToPrevious,
  Capability.SeekTo,
  Capability.SeekBy,
  Capability.SetVolume,
  Capability.SetRate
]

/**
 * Standard 10-band equalizer frequencies in Hz
 *
 * Covers the full audible spectrum from sub-bass to high treble:
 * 32Hz (sub-bass), 64Hz (bass), 125Hz (low mids), 250Hz (midrange),
 * 500Hz (upper mids), 1kHz (presence), 2kHz (upper presence),
 * 4kHz (brilliance), 8kHz (treble), 16kHz (air)
 */
export const EQUALIZER_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const

/**
 * Predefined equalizer presets for different music genres
 *
 * Each preset is an array of 10 gain values (in dB) corresponding
 * to the EQUALIZER_FREQUENCIES bands.
 */
export const EQUALIZER_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [4, 3, 1, -1, 0, 1, 3, 4, 4, 3],
  pop: [1, 2, 3, 2, 0, -1, -1, 1, 2, 3],
  jazz: [2, 1, 0, 1, 2, 2, 1, 0, 1, 2],
  classical: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3],
  electronic: [5, 4, 2, 0, -1, 1, 2, 3, 4, 5],
  vocal: [0, -1, 0, 2, 4, 3, 2, 1, 0, -1],
  bass: [6, 5, 4, 2, 1, 0, -1, -2, -2, -2],
  treble: [-2, -2, -1, 0, 1, 2, 4, 5, 6, 6]
} as const

/** Minimum gain value in dB for equalizer bands */
export const GAIN_MIN = -12
/** Maximum gain value in dB for equalizer bands */
export const GAIN_MAX = 12
/** Default quality factor (Q) for equalizer bands */
export const DEFAULT_Q = 1
/** Default interval in seconds between progress updates */
export const DEFAULT_UPDATE_INTERVAL = 1
/** Minimum playback rate (0.25x speed) */
export const MIN_RATE = 0.25
/** Maximum playback rate (4x speed) */
export const MAX_RATE = 4.0
