---
sidebar_position: 3
id: getting-started
title: Getting Started
---

# Getting Started

This guide will help you set up Track Player and implement basic audio playback functionality in
your application.

## Basic Setup

Before you can use any of the player's features, you need to set up the player. This is typically
done when your app initializes.

```javascript
import TrackPlayer from "@track-player/web"

// In your app initialization
async function setupAudioPlayer() {
  await TrackPlayer.setupPlayer({
    // Configuration options
    updateInterval: 1, // Progress updates every 1 second
    useMediaSession: true // Enable system media controls
  })
}

setupAudioPlayer()
```

## Adding Tracks

After setting up the player, you can add tracks to the queue:

```javascript
// Add a single track
await TrackPlayer.add({
  url: "https://example.com/audio.mp3", // Required
  title: "Track Title", // Required
  artist: "Artist Name",
  album: "Album Name",
  artwork: "https://example.com/artwork.jpg",
  duration: 183 // Duration in seconds (optional)
})

// Add multiple tracks at once
await TrackPlayer.add([
  {
    url: "https://example.com/track1.mp3",
    title: "First Track",
    artist: "Various Artists"
  },
  {
    url: "https://example.com/track2.mp3",
    title: "Second Track",
    artist: "Various Artists"
  }
])
```

## Basic Controls

Once you've added tracks, you can control playback:

```javascript
// Start playback
await TrackPlayer.play()

// Pause playback
await TrackPlayer.pause()

// Skip to next track
await TrackPlayer.skipToNext()

// Skip to previous track
await TrackPlayer.skipToPrevious()

// Seek to position (in seconds)
await TrackPlayer.seekTo(30)

// Adjust volume (0 to 1)
await TrackPlayer.setVolume(0.5)
```

## Handling Events

You can listen for various playback events:

```javascript
import { Event } from "@track-player/web"

// Listen for state changes
TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
  console.log("Playback state changed to:", event.state)
})

// Listen for track changes
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (event) => {
  console.log("Current track changed from", event.prevTrack, "to", event.nextTrack)
})

// Listen for playback progress updates
TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
  console.log("Progress:", event.position, "of", event.duration)
  console.log("Buffered:", event.buffered)
})

// Listen for errors
TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
  console.error("Error:", event.error)
})
```

## Using with React Components

For React components, it's recommended to use the provided hooks for better integration:

```javascript
import React from "react"
import { usePlaybackState, useProgress, useActiveTrack, State } from "@track-player/web"

function Player() {
  const playbackState = usePlaybackState()
  const { position, duration } = useProgress(500) // Update every 500ms
  const track = useActiveTrack()

  // Calculate progress percentage
  const progress = position && duration ? (position / duration) * 100 : 0

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? "0" : ""}${sec}`
  }

  return (
    <div className="player">
      {track && (
        <div className="track-info">
          <h3>{track.title}</h3>
          <p>{track.artist}</p>
        </div>
      )}

      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>

      <div className="time">
        {formatTime(position)} / {formatTime(duration)}
      </div>

      <div className="controls">
        <button onClick={() => TrackPlayer.skipToPrevious()}>Previous</button>

        <button
          onClick={() => {
            if (playbackState === State.Playing) {
              TrackPlayer.pause()
            } else {
              TrackPlayer.play()
            }
          }}
        >
          {playbackState === State.Playing ? "Pause" : "Play"}
        </button>

        <button onClick={() => TrackPlayer.skipToNext()}>Next</button>
      </div>
    </div>
  )
}
```

## Cleaning Up

When your app or component unmounts, you should clean up the player:

```javascript
// Clear the queue but keep the player
await TrackPlayer.reset()

// Completely destroy the player and release resources
await TrackPlayer.destroy()
```

By following these steps, you should have a basic implementation of Track Player in your
application. For more advanced usage, check out the API reference sections.
