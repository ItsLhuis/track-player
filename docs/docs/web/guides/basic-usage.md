---
sidebar_position: 1
id: basic-usage
title: Basic Usage
---

# Basic Usage

This guide covers the fundamental steps to get Track Player up and running in your application.

## Setting up the Player

Before using any functionality, you need to set up the player. This is typically done in a component
that wraps your entire application or in a component that manages your audio playback.

```javascript
import React, { useEffect } from "react"
import TrackPlayer from "@track-player/web"

function AudioPlayerComponent() {
  useEffect(() => {
    const setupPlayer = async () => {
      try {
        // Initialize the player
        await TrackPlayer.setupPlayer({
          // Update progress every 500ms (0.5 seconds)
          updateInterval: 0.5,
          // Enable media controls in browser
          useMediaSession: true
        })

        console.log("Player initialized successfully")

        // Load tracks
        await loadTracks()
      } catch (error) {
        console.error("Error setting up player:", error)
      }
    }

    setupPlayer()

    // Cleanup on unmount
    return () => {
      TrackPlayer.destroy()
    }
  }, [])

  const loadTracks = async () => {
    // Add your tracks to the queue
    await TrackPlayer.add([
      {
        url: "https://example.com/track1.mp3",
        title: "Amazing Track",
        artist: "Cool Artist",
        artwork: "https://example.com/album-art.jpg"
      },
      {
        url: "https://example.com/track2.mp3",
        title: "Another Great Song",
        artist: "Cool Artist",
        album: "Great Album"
      }
    ])
  }

  return <div>{/* Player UI goes here */}</div>
}

export default AudioPlayerComponent
```

## Creating Basic Player Controls

Once you've set up the player, you'll need to create controls for the user to interact with it:

```javascript
import React from "react"
import TrackPlayer, { usePlaybackState, State } from "@track-player/web"

function PlayerControls() {
  const playbackState = usePlaybackState()

  const handlePlayPause = async () => {
    const isPlaying = playbackState === State.Playing

    if (isPlaying) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.play()
    }
  }

  const handleSkipNext = async () => {
    await TrackPlayer.skipToNext()
  }

  const handleSkipPrevious = async () => {
    await TrackPlayer.skipToPrevious()
  }

  return (
    <div className="player-controls">
      <button onClick={handleSkipPrevious}>Previous</button>

      <button onClick={handlePlayPause}>
        {playbackState === State.Playing ? "Pause" : "Play"}
      </button>

      <button onClick={handleSkipNext}>Next</button>
    </div>
  )
}

export default PlayerControls
```

## Displaying Track Information

Display information about the currently playing track:

```javascript
import React from "react"
import { useActiveTrack } from "@track-player/web"

function TrackInfo() {
  const track = useActiveTrack()

  if (!track) {
    return <div className="track-info">No track selected</div>
  }

  return (
    <div className="track-info">
      {track.artwork && (
        <img src={track.artwork} alt={`${track.title} artwork`} className="track-artwork" />
      )}

      <div className="track-details">
        <h3 className="track-title">{track.title}</h3>
        <p className="track-artist">{track.artist}</p>
        {track.album && <p className="track-album">{track.album}</p>}
      </div>
    </div>
  )
}

export default TrackInfo
```

## Creating a Progress Bar

Show playback progress and allow seeking:

```javascript
import React from "react"
import TrackPlayer, { useProgress } from "@track-player/web"

function ProgressBar() {
  // Update progress every 100ms for smoother progress updates
  const { position, duration } = useProgress(100)

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSeek = (event) => {
    const progressBar = event.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickPosition = event.clientX - rect.left
    const percentage = clickPosition / rect.width

    // Calculate seek position based on percentage and duration
    const seekPosition = percentage * duration

    // Seek to the calculated position
    TrackPlayer.seekTo(seekPosition)
  }

  // Calculate progress percentage
  const progress = position && duration ? (position / duration) * 100 : 0

  return (
    <div className="progress-container">
      <div className="progress-bar-container" onClick={handleSeek}>
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="time-display">
        <span>{formatTime(position)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

export default ProgressBar
```

## Putting It All Together

Here's a complete example showing how to combine everything into a functional player:

```javascript
import React, { useEffect } from "react"
import TrackPlayer, { usePlaybackState, State } from "@track-player/web"

// Importing components
import TrackInfo from "./TrackInfo"
import ProgressBar from "./ProgressBar"
import PlayerControls from "./PlayerControls"

function AudioPlayer() {
  useEffect(() => {
    const initPlayer = async () => {
      try {
        // Initialize player
        await TrackPlayer.setupPlayer({
          updateInterval: 0.5,
          useMediaSession: true
        })

        // Add tracks to queue
        await TrackPlayer.add([
          {
            url: "https://example.com/track1.mp3",
            title: "Amazing Track",
            artist: "Cool Artist",
            artwork: "https://example.com/album-art.jpg"
          },
          {
            url: "https://example.com/track2.mp3",
            title: "Another Great Song",
            artist: "Cool Artist",
            album: "Great Album"
          }
        ])
      } catch (error) {
        console.error("Error initializing player:", error)
      }
    }

    initPlayer()

    return () => {
      TrackPlayer.destroy()
    }
  }, [])

  return (
    <div className="audio-player">
      <TrackInfo />
      <ProgressBar />
      <PlayerControls />
    </div>
  )
}

export default AudioPlayer
```

## Best Practices

1. **Always initialize the player before usage** and ensure it's only set up once.

2. **Use the provided hooks** like `usePlaybackState`, `useActiveTrack`, and `useProgress` to keep
   your UI in sync with the player state.

3. **Handle errors gracefully** by wrapping your player operations in try/catch blocks.

4. **Keep player initialization separate from your render logic** to prevent unnecessary re-renders.

By following these basics, you'll have a functional audio player that you can style and customize to
fit your application's needs.
