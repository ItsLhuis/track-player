/**
 * Base error class for all TrackPlayer errors
 *
 * All player-specific errors extend from this class,
 * allowing for easy error type checking.
 */
export class TrackPlayerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TrackPlayerError"
  }
}

/**
 * Error thrown when the player is used before setup
 *
 * This error is thrown when attempting to use player methods
 * before calling TrackPlayer.setupPlayer().
 */
export class SetupNotCalledError extends TrackPlayerError {
  constructor() {
    super("The player has not been set up. Call TrackPlayer.setupPlayer() first.")
    this.name = "SetupNotCalledError"
  }
}

/**
 * Error thrown when the player failed to initialize
 *
 * This error indicates that the player setup completed
 * but the internal state is not ready.
 */
export class PlayerNotInitializedError extends TrackPlayerError {
  constructor() {
    super("Player not initialized")
    this.name = "PlayerNotInitializedError"
  }
}

/**
 * Error thrown when no track is currently loaded
 *
 * This error is thrown when attempting operations that
 * require an active track (e.g. play, seek) when the queue is empty.
 */
export class NoTrackLoadedError extends TrackPlayerError {
  constructor() {
    super("No track is loaded")
    this.name = "NoTrackLoadedError"
  }
}

/**
 * Error thrown when a capability is not enabled
 *
 * This error is thrown when attempting to use a feature
 * that was not included in the capabilities during setup.
 */
export class CapabilityNotEnabledError extends TrackPlayerError {
  /**
   * @param capability The name of the capability that was not enabled
   */
  constructor(capability: string) {
    super(`${capability} capability not enabled`)
    this.name = "CapabilityNotEnabledError"
  }
}

/**
 * Error thrown when a track index is out of bounds
 *
 * This error is thrown when attempting to access a track
 * at an index that doesn't exist in the queue.
 */
export class TrackNotFoundError extends TrackPlayerError {
  /**
   * @param index The invalid track index that was requested
   */
  constructor(index: number) {
    super(`Track index ${index} is out of bounds`)
    this.name = "TrackNotFoundError"
  }
}

/**
 * Error thrown for invalid operations
 *
 * This error is thrown when an operation cannot be performed
 * due to invalid parameters or state.
 */
export class InvalidOperationError extends TrackPlayerError {
  /**
   * @param message Description of why the operation is invalid
   */
  constructor(message: string) {
    super(message)
    this.name = "InvalidOperationError"
  }
}
