---
sidebar_position: 2
id: advanced-usage
title: Advanced Usage
---

# Advanced Usage

This guide covers more advanced usage patterns for Track Player to help you create a fully-featured
and robust audio player.

## Advanced Player Setup

You can customize your player setup with various options:

```javascript
await TrackPlayer.setupPlayer({
  // Time between progress updates in seconds
  updateInterval: 0.2,

  // Enable media controls in browser and devices
  useMediaSession: true,

  // Specify only the capabilities you need
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo
  ],

  // Wait for sufficient buffering before playing
  waitForBuffer: true
})
```

## Queue Management

### Dynamic Queue Updates

You can dynamically update the queue based on user interaction:

```javascript
import React from "react"
import TrackPlayer from "@track-player/web"

function PlaylistManager({ playlists }) {
  // Play an entire playlist
  const playPlaylist = async (playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId)

    if (!playlist) return

    try {
      // Clear current queue
      await TrackPlayer.reset()

      // Add all tracks from the selected playlist
      await TrackPlayer.add(playlist.tracks)

      // Start playback
      await TrackPlayer.play()
    } catch (error) {
      console.error("Error playing playlist:", error)
    }
  }

  // Add a track to play next
  const playNext = async (track) => {
    try {
      // Get current active track index
      const currentIndex = TrackPlayer.getActiveTrackIndex()

      // Add the track after the current one
      await TrackPlayer.add(track, currentIndex + 1)
    } catch (error) {
      console.error("Error adding track to play next:", error)
    }
  }

  // Add a track to the end of the queue
  const addToQueue = async (track) => {
    try {
      await TrackPlayer.add(track)
    } catch (error) {
      console.error("Error adding track to queue:", error)
    }
  }

  return <div className="playlist-manager">{/* Your playlist UI implementation */}</div>
}
```

### Queue Visualization

Create a component to visualize and interact with the queue:

```javascript
import React, { useEffect, useState } from "react"
import TrackPlayer, { useTrackPlayerEvents, Event } from "@track-player/web"

function QueueView() {
  const [queue, setQueue] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Set up initial queue and active track index
  useEffect(() => {
    const loadQueue = async () => {
      const currentQueue = await TrackPlayer.getQueue()
      setQueue(currentQueue)

      // Get the current active track index
      const currentIndex = TrackPlayer.getActiveTrackIndex()
      setActiveIndex(currentIndex)
    }

    loadQueue()
  }, [])

  // Listen for track changes to update the active index
  useTrackPlayerEvents([Event.PlaybackTrackChanged], (event) => {
    if (event.nextTrack !== undefined) {
      setActiveIndex(event.nextTrack)
    }
  })

  const handleTrackSelect = async (index) => {
    await TrackPlayer.skip(index)
  }

  const handleRemoveTrack = async (index) => {
    await TrackPlayer.remove(index)
    const updatedQueue = await TrackPlayer.getQueue()
    setQueue(updatedQueue)
  }

  const handleMoveTrack = async (fromIndex, toIndex) => {
    await TrackPlayer.move(fromIndex, toIndex)
    const updatedQueue = await TrackPlayer.getQueue()
    setQueue(updatedQueue)
  }

  return (
    <div className="queue-view">
      <h3>Up Next ({queue.length} tracks)</h3>

      <ul className="queue-list">
        {queue.map((track, index) => (
          <li key={index} className={index === activeIndex ? "active" : ""}>
            <div onClick={() => handleTrackSelect(index)}>
              <span className="track-title">{track.title}</span>
              <span className="track-artist">{track.artist}</span>
            </div>

            <div className="track-actions">
              {index !== 0 && (
                <button onClick={() => handleMoveTrack(index, index - 1)}>Move Up</button>
              )}

              {index !== queue.length - 1 && (
                <button onClick={() => handleMoveTrack(index, index + 1)}>Move Down</button>
              )}

              <button onClick={() => handleRemoveTrack(index)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Advanced Event Handling

### Custom Event Listeners

Create custom event listeners to respond to various player events:

```javascript
import React, { useEffect } from "react"
import TrackPlayer, { useTrackPlayerEvents, Event, State } from "@track-player/web"

function AdvancedEventHandling() {
  // Listen for multiple events
  useTrackPlayerEvents(
    [
      Event.PlaybackState,
      Event.PlaybackTrackChanged,
      Event.PlaybackError,
      Event.PlaybackQueueEnded
    ],
    async (event) => {
      switch (event.type) {
        case Event.PlaybackState:
          if (event.state === State.Error) {
            console.error("Playback error occurred")
            // You could try to recover here
            await TrackPlayer.retry()
          } else if (event.state === State.Buffering) {
            console.log("Buffering...")
            // Show buffering indicator
          }
          break

        case Event.PlaybackTrackChanged:
          console.log(`Track changed from ${event.prevTrack} to ${event.nextTrack}`)

          // Log the new track details
          const newTrack = TrackPlayer.getTrack(event.nextTrack)
          if (newTrack) {
            console.log(`Now playing: ${newTrack.title} by ${newTrack.artist}`)
          }
          break

        case Event.PlaybackError:
          console.error(`Playback error: ${event.error}`)
          // Show error notification to user
          break

        case Event.PlaybackQueueEnded:
          console.log("Queue ended")
          // Maybe load more tracks or show "end of playlist" message
          break
      }
    }
  )

  return <div>{/* Your player UI */}</div>
}
```

### Saving and Restoring State

Persist player state to localStorage and restore on page reload:

```javascript
import React, { useEffect } from "react"
import TrackPlayer, { Event, State } from "@track-player/web"

function PersistentPlayer() {
  // Initialize player and restore state
  useEffect(() => {
    const initializePlayer = async () => {
      await TrackPlayer.setupPlayer()

      // Restore queue from localStorage
      const savedQueue = localStorage.getItem("playerQueue")
      const savedPosition = localStorage.getItem("playerPosition")
      const savedTrackIndex = localStorage.getItem("activeTrackIndex")

      if (savedQueue) {
        try {
          const queue = JSON.parse(savedQueue)
          await TrackPlayer.add(queue)

          // Restore active track
          if (savedTrackIndex) {
            await TrackPlayer.skip(parseInt(savedTrackIndex, 10))
          }

          // Restore position
          if (savedPosition) {
            await TrackPlayer.seekTo(parseFloat(savedPosition))
          }
        } catch (error) {
          console.error("Error restoring player state:", error)
        }
      }
    }

    initializePlayer()

    // Save player state when component unmounts
    return () => {
      // Get current queue and state
      const queue = TrackPlayer.getQueue()
      const position = TrackPlayer.getPosition()
      const activeTrackIndex = TrackPlayer.getActiveTrackIndex()

      // Save to localStorage
      localStorage.setItem("playerQueue", JSON.stringify(queue))
      localStorage.setItem("playerPosition", position.toString())
      localStorage.setItem("activeTrackIndex", activeTrackIndex.toString())

      // Destroy player
      TrackPlayer.destroy()
    }
  }, [])

  // Also save state periodically or on certain events
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const queue = TrackPlayer.getQueue()
      const position = TrackPlayer.getPosition()
      const activeTrackIndex = TrackPlayer.getActiveTrackIndex()

      localStorage.setItem("playerQueue", JSON.stringify(queue))
      localStorage.setItem("playerPosition", position.toString())
      localStorage.setItem("activeTrackIndex", activeTrackIndex.toString())
    }, 30000) // Save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [])

  return <div>{/* Your player UI */}</div>
}
```

## Advanced Player Controls

### Volume Control

Implement a volume control slider:

```javascript
import React, { useState, useEffect } from "react"
import TrackPlayer from "@track-player/web"

function VolumeControl() {
  const [volume, setVolume] = useState(1)

  // Initialize volume state
  useEffect(() => {
    setVolume(TrackPlayer.getVolume())
  }, [])

  const handleVolumeChange = async (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    await TrackPlayer.setVolume(newVolume)
  }

  return (
    <div className="volume-control">
      <button
        onClick={async () => {
          if (volume > 0) {
            await TrackPlayer.setVolume(0)
            setVolume(0)
          } else {
            await TrackPlayer.setVolume(1)
            setVolume(1)
          }
        }}
      >
        {volume > 0 ? "Mute" : "Unmute"}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
      />
    </div>
  )
}
```

### Playback Rate Control

Create a playback speed selector:

```javascript
import React, { useState, useEffect } from "react"
import TrackPlayer from "@track-player/web"

function PlaybackRateControl() {
  const [rate, setRate] = useState(1)
  const availableRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // Initialize rate state
  useEffect(() => {
    setRate(TrackPlayer.getRate())
  }, [])

  const handleRateChange = async (newRate) => {
    setRate(newRate)
    await TrackPlayer.setRate(newRate)
  }

  return (
    <div className="playback-rate-control">
      <span>Speed: </span>
      <select value={rate} onChange={(e) => handleRateChange(parseFloat(e.target.value))}>
        {availableRates.map((r) => (
          <option key={r} value={r}>
            {r === 1 ? "Normal" : `${r}x`}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Repeat Mode Control

Implement a repeat mode toggle:

```javascript
import React, { useState, useEffect } from "react"
import TrackPlayer, { RepeatMode } from "@track-player/web"

function RepeatModeControl() {
  const [repeatMode, setRepeatMode] = useState(RepeatMode.Off)

  // Initialize with current repeat mode
  useEffect(() => {
    setRepeatMode(TrackPlayer.getRepeatMode())
  }, [])

  const cycleRepeatMode = async () => {
    let nextMode

    switch (repeatMode) {
      case RepeatMode.Off:
        nextMode = RepeatMode.Track
        break
      case RepeatMode.Track:
        nextMode = RepeatMode.Queue
        break
      case RepeatMode.Queue:
        nextMode = RepeatMode.Off
        break
      default:
        nextMode = RepeatMode.Off
    }

    await TrackPlayer.setRepeatMode(nextMode)
    setRepeatMode(nextMode)
  }

  // Display appropriate icon/text based on repeat mode
  const getRepeatModeLabel = () => {
    switch (repeatMode) {
      case RepeatMode.Off:
        return "No Repeat"
      case RepeatMode.Track:
        return "Repeat One"
      case RepeatMode.Queue:
        return "Repeat All"
      default:
        return "Unknown"
    }
  }

  return (
    <button
      className={`repeat-mode-control ${repeatMode !== RepeatMode.Off ? "active" : ""}`}
      onClick={cycleRepeatMode}
    >
      {getRepeatModeLabel()}
    </button>
  )
}
```

## Custom Track Visualization

Create a waveform visualization for the current track:

```javascript
import React, { useRef, useEffect } from "react"
import TrackPlayer, { useProgress } from "@track-player/web"

function WaveformVisualization() {
  const canvasRef = useRef(null)
  const { position, duration } = useProgress(100)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw simple waveform (in a real implementation, you would analyze the audio)
    const barCount = 100
    const barWidth = canvas.width / barCount

    for (let i = 0; i < barCount; i++) {
      // Create a simple visual pattern (in a real app, use actual audio data)
      const barHeight = Math.sin(i * 0.1) * 50 + 50

      // Determine if this bar is before or after the playhead
      const barPosition = (i / barCount) * duration
      const isPlayed = barPosition <= position

      // Draw the bar
      ctx.fillStyle = isPlayed ? "#1db954" : "#888888"

      // Center the bar vertically
      const x = i * barWidth
      const y = (canvas.height - barHeight) / 2

      ctx.fillRect(x, y, barWidth - 1, barHeight)
    }

    // Draw playhead
    const playheadX = (position / duration) * canvas.width
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(playheadX, 0, 2, canvas.height)
  }, [position, duration])

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / canvas.width

    // Calculate and seek to position
    const seekPosition = percentage * duration
    TrackPlayer.seekTo(seekPosition)
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={100}
      onClick={handleCanvasClick}
      className="waveform-visualization"
    />
  )
}
```

## Error Handling

Create a robust error handling component:

```javascript
import React, { useState, useEffect } from "react"
import TrackPlayer, { useTrackPlayerEvents, Event, State } from "@track-player/web"

function ErrorHandler() {
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  useTrackPlayerEvents([Event.PlaybackError], (event) => {
    setError(event.error)
  })

  useEffect(() => {
    if (error && retryCount < MAX_RETRIES) {
      // Attempt automatic retry with exponential backoff
      const timer = setTimeout(
        async () => {
          try {
            console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`)
            await TrackPlayer.retry()
            setError(null) // Clear error if retry is successful
          } catch (retryError) {
            console.error("Retry failed:", retryError)
            setRetryCount((prev) => prev + 1)
          }
        },
        Math.pow(2, retryCount) * 1000
      ) // Exponential backoff: 1s, 2s, 4s

      return () => clearTimeout(timer)
    }
  }, [error, retryCount])

  // Reset retry count when track changes
  useTrackPlayerEvents([Event.PlaybackTrackChanged], () => {
    setRetryCount(0)
    setError(null)
  })

  const handleManualRetry = async () => {
    try {
      await TrackPlayer.retry()
      setError(null)
      setRetryCount(0)
    } catch (retryError) {
      console.error("Manual retry failed:", retryError)
    }
  }

  const handleSkipTrack = async () => {
    try {
      await TrackPlayer.skipToNext()
      setError(null)
      setRetryCount(0)
    } catch (skipError) {
      console.error("Failed to skip track:", skipError)
    }
  }

  if (!error) return null

  return (
    <div className="error-handler">
      <div className="error-message">
        <p>Playback error: {error}</p>
        <p>
          Retry attempts: {retryCount}/{MAX_RETRIES}
        </p>
      </div>

      <div className="error-actions">
        <button onClick={handleManualRetry}>Retry Now</button>
        <button onClick={handleSkipTrack}>Skip Track</button>
      </div>
    </div>
  )
}
```

These advanced techniques will help you build a more feature-rich and robust audio player
experience. By combining the different components and concepts, you can create a customized player
that meets your specific application needs.
