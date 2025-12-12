---
sidebar_position: 2
id: player
title: Player
---

# Player

These functions control audio playback, including play/pause control, seeking, volume adjustment,
and retrieving information about the current state.

## Playback Control

### play

Starts or resumes playback of the current track.

```javascript
await TrackPlayer.play(): Promise<void>
```

#### Example

```javascript
// Start or resume playback
await TrackPlayer.play()
```

### pause

Pauses playback of the current track.

```javascript
await TrackPlayer.pause(): Promise<void>
```

#### Example

```javascript
// Pause playback
await TrackPlayer.pause()
```

### stop

Stops playback and resets the position to the beginning of the track.

```javascript
await TrackPlayer.stop(): Promise<void>
```

#### Example

```javascript
// Stop playback completely
await TrackPlayer.stop()
```

### skip

Skips to the track at the specified index.

```javascript
await TrackPlayer.skip(index: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                             |
| --------- | -------- | -------- | --------------------------------------- |
| index     | `number` | Yes      | Index of the track to skip to (0-based) |

#### Example

```javascript
// Skip to the third track (index 2)
await TrackPlayer.skip(2)
```

### skipToNext

Skips to the next track in the queue.

```javascript
await TrackPlayer.skipToNext(): Promise<void>
```

#### Example

```javascript
// Skip to the next track
await TrackPlayer.skipToNext()
```

### skipToPrevious

Skips to the previous track in the queue.

```javascript
await TrackPlayer.skipToPrevious(): Promise<void>
```

#### Example

```javascript
// Skip to the previous track
await TrackPlayer.skipToPrevious()
```

## Position Control

### seekTo

Seeks to a specific position in the current track.

```javascript
await TrackPlayer.seekTo(position: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| position  | `number` | Yes      | Position to seek to in seconds |

#### Example

```javascript
// Seek to 30 seconds into the track
await TrackPlayer.seekTo(30)
```

### seekBy

Seeks forward or backward relative to the current position.

```javascript
await TrackPlayer.seekBy(offset: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                                                     |
| --------- | -------- | -------- | --------------------------------------------------------------- |
| offset    | `number` | Yes      | Offset in seconds (positive for forward, negative for backward) |

#### Example

```javascript
// Seek 10 seconds forward
await TrackPlayer.seekBy(10)

// Seek 5 seconds backward
await TrackPlayer.seekBy(-5)
```

## Audio Control

### setVolume

Sets the playback volume.

```javascript
await TrackPlayer.setVolume(volume: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                               |
| --------- | -------- | -------- | ----------------------------------------- |
| volume    | `number` | Yes      | Volume level from 0 (mute) to 1 (maximum) |

#### Example

```javascript
// Set volume to 50%
await TrackPlayer.setVolume(0.5)

// Mute audio
await TrackPlayer.setVolume(0)
```

### getVolume

Gets the current volume level.

```javascript
TrackPlayer.getVolume(): number
```

#### Return Value

Returns a number between 0 and 1 representing the current volume level.

#### Example

```javascript
const currentVolume = TrackPlayer.getVolume()
console.log(`Current volume: ${currentVolume * 100}%`)
```

### setRate

Sets the playback rate (speed).

```javascript
await TrackPlayer.setRate(rate: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                                          |
| --------- | -------- | -------- | ---------------------------------------------------- |
| rate      | `number` | Yes      | Playback rate from 0.25 to 2.0 (1.0 is normal speed) |

#### Example

```javascript
// Play at double speed
await TrackPlayer.setRate(2.0)

// Play at half speed
await TrackPlayer.setRate(0.5)

// Reset to normal speed
await TrackPlayer.setRate(1.0)
```

### getRate

Gets the current playback rate.

```javascript
TrackPlayer.getRate(): number
```

#### Return Value

Returns a number representing the current playback rate (1.0 is normal speed).

#### Example

```javascript
const currentRate = TrackPlayer.getRate()
console.log(`Playing at ${currentRate}x speed`)
```

## State and Position

### getPlaybackState

Gets the current playback state.

```javascript
TrackPlayer.getPlaybackState(): State
```

#### Return Value

Returns one of the [State constants](../constants).

#### Example

```javascript
import { State } from "@track-player/web"

const state = TrackPlayer.getPlaybackState()
if (state === State.Playing) {
  console.log("Track is currently playing")
} else if (state === State.Paused) {
  console.log("Track is paused")
}
```

### getPosition

Gets the current playback position in seconds.

```javascript
TrackPlayer.getPosition(): number
```

#### Return Value

Returns the current position in seconds.

#### Example

```javascript
const position = TrackPlayer.getPosition()
console.log(`Current position: ${Math.floor(position)} seconds`)
```

### getDuration

Gets the duration of the current track in seconds.

```javascript
TrackPlayer.getDuration(): number
```

#### Return Value

Returns the track duration in seconds, or 0 if unknown.

#### Example

```javascript
const duration = TrackPlayer.getDuration()
console.log(`Track duration: ${Math.floor(duration)} seconds`)
```

### getBufferedPosition

Gets the buffered position of the current track in seconds.

```javascript
TrackPlayer.getBufferedPosition(): number
```

#### Return Value

Returns the buffered position in seconds.

#### Example

```javascript
const buffered = TrackPlayer.getBufferedPosition()
console.log(`Buffered up to: ${Math.floor(buffered)} seconds`)
```

### getProgress

Gets comprehensive progress information including position, duration, and buffered status.

```javascript
TrackPlayer.getProgress(): Progress
```

#### Return Value

Returns a Progress object with the following properties:

```typescript
{
  position: number // Current position in seconds
  duration: number // Track duration in seconds
  buffered: number // Buffered position in seconds
}
```

#### Example

```javascript
const progress = TrackPlayer.getProgress()
console.log(
  `Position: ${progress.position}s / ${progress.duration}s (${progress.buffered}s buffered)`
)
```

## Repeat Mode

### setRepeatMode

Sets the repeat mode for playback.

```javascript
await TrackPlayer.setRepeatMode(mode: RepeatMode): Promise<void>
```

#### Parameters

| Parameter | Type         | Required | Description            |
| --------- | ------------ | -------- | ---------------------- |
| mode      | `RepeatMode` | Yes      | The repeat mode to set |

#### Example

```javascript
import { RepeatMode } from "@track-player/web"

// No repeat
await TrackPlayer.setRepeatMode(RepeatMode.Off)

// Repeat current track
await TrackPlayer.setRepeatMode(RepeatMode.Track)

// Repeat entire queue
await TrackPlayer.setRepeatMode(RepeatMode.Queue)
```

### getRepeatMode

Gets the current repeat mode.

```javascript
TrackPlayer.getRepeatMode(): RepeatMode
```

#### Return Value

Returns one of the [RepeatMode constants](../constants).

#### Example

```javascript
import { RepeatMode } from "@track-player/web"

const repeatMode = TrackPlayer.getRepeatMode()
if (repeatMode === RepeatMode.Track) {
  console.log("Currently repeating this track")
} else if (repeatMode === RepeatMode.Queue) {
  console.log("Repeating the entire queue")
} else {
  console.log("Repeat is turned off")
}
```

## Error Handling

### retry

Retries playback of the current track after an error has occurred.

```javascript
await TrackPlayer.retry(): Promise<void>
```

#### Example

```javascript
try {
  // Some operation that might fail
  await TrackPlayer.play()
} catch (error) {
  console.error("Playback error:", error)

  // Try to recover
  try {
    await TrackPlayer.retry()
    console.log("Successfully recovered")
  } catch (retryError) {
    console.error("Failed to recover:", retryError)
  }
}
```
