---
sidebar_position: 1
id: events
title: Events
---

# Events

Track Player emits various events that allow you to monitor and respond to changes in playback
status, track changes, and more.

## Available Events

The library provides the following events, accessible through the `Event` enum:

| Event                     | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `PlaybackState`           | Fired when the playback state changes (playing, paused, etc.) |
| `PlaybackTrackChanged`    | Fired when the current track changes                          |
| `PlaybackProgressUpdated` | Fired periodically with updated playback position             |
| `PlaybackError`           | Fired when a playback error occurs                            |
| `PlaybackQueueEnded`      | Fired when playback finishes and the queue is empty           |

## Listening to Events

You can register event listeners using the `addEventListener` method:

```javascript
import TrackPlayer, { Event } from "@track-player/web"

// Listen for playback state changes
const stateListener = (data) => {
  console.log("Playback state changed:", data.state)
}
TrackPlayer.addEventListener(Event.PlaybackState, stateListener)

// Listen for track changes
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
  console.log("Track changed from", data.prevTrack, "to", data.nextTrack)
})

// Listen for progress updates
TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
  console.log(`Position: ${data.position}, Duration: ${data.duration}`)
})

// Listen for errors
TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
  console.error("Playback error:", data.error, "Code:", data.code)
})
```

## Removing Event Listeners

To prevent memory leaks, you should remove event listeners when they're no longer needed:

```javascript
// Remove a specific listener
TrackPlayer.removeEventListener(Event.PlaybackState, stateListener)
```

## Event Data

Each event provides specific data:

### PlaybackState

```typescript
{
  type: Event.PlaybackState,
  state: State // The new playback state
}
```

### PlaybackTrackChanged

```typescript
{
  type: Event.PlaybackTrackChanged,
  prevTrack: number | null, // Index of the previous track (or null)
  nextTrack: number | null // Index of the new track (or null)
}
```

### PlaybackProgressUpdated

```typescript
{
  type: Event.PlaybackProgressUpdated,
  position: number, // Current playback position in seconds
  duration: number, // Track duration in seconds
  buffered: number // Buffered position in seconds
}
```

### PlaybackError

```typescript
{
  type: Event.PlaybackError,
  error: string, // Error message
  code?: string // Error code (if available)
}
```

### PlaybackQueueEnded

```typescript
{
  type: Event.PlaybackQueueEnded,
  track: number | null // Index of the last track played, or null if queue was empty
}
```

## Advanced Event Handling Examples

### Auto-saving Playback Position

Save the current playback position periodically to localStorage:

```javascript
import { Event } from "@track-player/web"

TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
  // Save position every 10 seconds
  if (Math.floor(data.position) % 10 === 0) {
    localStorage.setItem("lastPosition", data.position.toString())
    localStorage.setItem("lastTrackIndex", TrackPlayer.getActiveTrackIndex().toString())
  }
})
```

### Track Analytics

Track user listening behavior:

```javascript
import { Event, State } from "@track-player/web"

let trackStartTime = null
let totalListenTime = 0

TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
  if (data.prevTrack !== null) {
    // Send analytics for previous track
    const track = TrackPlayer.getTrack(data.prevTrack)
    if (track && totalListenTime > 0) {
      console.log(`Track "${track.title}" listened for ${totalListenTime} seconds`)
      // Send to analytics service
    }
  }

  // Reset for new track
  trackStartTime = Date.now()
  totalListenTime = 0
})

TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
  if (data.state === State.Playing && trackStartTime) {
    // Resume tracking
  } else if (data.state === State.Paused && trackStartTime) {
    // Add to total listen time
    totalListenTime += (Date.now() - trackStartTime) / 1000
  }
})
```

### Queue Management

Automatically load more tracks when nearing the end of the queue:

```javascript
import { Event } from "@track-player/web"

TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (data) => {
  const queue = TrackPlayer.getQueue()
  const currentIndex = data.nextTrack

  // If we're near the end of the queue, load more tracks
  if (currentIndex !== null && currentIndex >= queue.length - 2) {
    try {
      const moreTracks = await fetchMoreTracks()
      await TrackPlayer.add(moreTracks)
      console.log(`Added ${moreTracks.length} more tracks to queue`)
    } catch (error) {
      console.error("Failed to load more tracks:", error)
    }
  }
})
```

### Error Recovery

Implement automatic error recovery with exponential backoff:

```javascript
import { Event } from "@track-player/web"

let retryCount = 0
const MAX_RETRIES = 3

TrackPlayer.addEventListener(Event.PlaybackError, async (data) => {
  console.error(`Playback error: ${data.error}`)

  if (retryCount < MAX_RETRIES) {
    const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
    retryCount++

    console.log(`Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`)

    setTimeout(async () => {
      try {
        await TrackPlayer.retry()
        retryCount = 0 // Reset on success
      } catch (error) {
        console.error("Retry failed:", error)
      }
    }, delay)
  } else {
    // Max retries reached, skip to next track
    console.log("Max retries reached, skipping to next track")
    try {
      await TrackPlayer.skipToNext()
      retryCount = 0 // Reset for next track
    } catch (error) {
      console.error("Failed to skip to next track:", error)
    }
  }
})

// Reset retry count on successful track change
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, () => {
  retryCount = 0
})
```

### Real-time UI Updates

Create a comprehensive player status component:

```javascript
import React, { useState } from "react"
import { useTrackPlayerEvents, Event, State } from "@track-player/web"

function PlayerStatus() {
  const [status, setStatus] = useState({
    state: "Unknown",
    track: null,
    progress: { position: 0, duration: 0, buffered: 0 },
    error: null
  })

  useTrackPlayerEvents(
    [
      Event.PlaybackState,
      Event.PlaybackTrackChanged,
      Event.PlaybackProgressUpdated,
      Event.PlaybackError
    ],
    (event) => {
      switch (event.type) {
        case Event.PlaybackState:
          setStatus((prev) => ({
            ...prev,
            state: event.state,
            error: event.state === State.Error ? prev.error : null
          }))
          break

        case Event.PlaybackTrackChanged:
          const track = event.nextTrack !== null ? TrackPlayer.getTrack(event.nextTrack) : null
          setStatus((prev) => ({ ...prev, track }))
          break

        case Event.PlaybackProgressUpdated:
          setStatus((prev) => ({ ...prev, progress: event }))
          break

        case Event.PlaybackError:
          setStatus((prev) => ({ ...prev, error: event.error }))
          break
      }
    }
  )

  return (
    <div className="player-status">
      <div>State: {status.state}</div>
      {status.track && (
        <div>
          Track: {status.track.title} by {status.track.artist}
        </div>
      )}
      <div>
        Progress: {Math.floor(status.progress.position)}s / {Math.floor(status.progress.duration)}s
      </div>
      {status.error && <div style={{ color: "red" }}>Error: {status.error}</div>}
    </div>
  )
}
```

## Using with React Components

Instead of manually managing event listeners in React components, it's recommended to use the
`useTrackPlayerEvents` hook:

```javascript
import React, { useState } from "react"
import { useTrackPlayerEvents, Event, State } from "@track-player/web"

function PlayerStatus() {
  const [playerState, setPlayerState] = useState("Unknown")
  const [currentTrack, setCurrentTrack] = useState(null)

  // Register multiple event listeners at once
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], (event) => {
    if (event.type === Event.PlaybackState) {
      // Map state enum to human-readable string
      const stateMap = {
        [State.None]: "Uninitialized",
        [State.Ready]: "Ready",
        [State.Playing]: "Playing",
        [State.Paused]: "Paused",
        [State.Stopped]: "Stopped",
        [State.Buffering]: "Buffering",
        [State.Error]: "Error"
      }
      setPlayerState(stateMap[event.state] || "Unknown")
    }

    if (event.type === Event.PlaybackTrackChanged) {
      // Get the track information
      const trackInfo = TrackPlayer.getTrack(event.nextTrack)
      setCurrentTrack(trackInfo)
    }
  })

  return (
    <div>
      <div>Player state: {playerState}</div>
      {currentTrack && (
        <div>
          Now playing: {currentTrack.title} by {currentTrack.artist || "Unknown Artist"}
        </div>
      )}
    </div>
  )
}
```

This approach ensures that event listeners are properly cleaned up when the component unmounts.

## Event Timing Considerations

### PlaybackProgressUpdated Frequency

The `PlaybackProgressUpdated` event frequency is controlled by the `updateInterval` option in
`setupPlayer`:

```javascript
// Update every 100ms for smooth progress bars
await TrackPlayer.setupPlayer({
  updateInterval: 0.1
})

// Update every 5 seconds for less frequent updates
await TrackPlayer.setupPlayer({
  updateInterval: 5
})
```

### Event Order

Events are emitted in a predictable order:

1. When starting playback: `PlaybackState` → `PlaybackTrackChanged` → `PlaybackProgressUpdated`
2. When skipping: `PlaybackTrackChanged` → `PlaybackState` → `PlaybackProgressUpdated`
3. When an error occurs: `PlaybackError` → `PlaybackState` (Error)

Understanding this order helps in building reliable event handlers.
