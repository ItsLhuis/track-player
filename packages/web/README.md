<img src="../../assets/icon.svg" width="100" height="100" />

# @track-player/web

[![npm version](https://img.shields.io/npm/v/@track-player/web)](https://www.npmjs.com/package/@track-player/web)
[![license](https://img.shields.io/npm/l/@track-player/web)](https://github.com/ItsLhuis/track-player/blob/main/LICENSE)

A web-based audio player library for React applications. This library provides a simple and powerful
way to play audio tracks in your web application.

## Features

- 🎵 Full audio playback control (play, pause, skip, seek)
- 📋 Queue management
- 🔁 Repeat modes (Off, Track, Queue)
- 🎚️ Volume and playback rate control
- 📱 MediaSession API integration for media controls
- 🔄 Event system for state changes and updates
- 🌊 Buffer state tracking
- 📊 Playback progress tracking
- 🔧 Configurable capabilities
- 🟦 10-band Equalizer with presets and real-time control

## Installation

```bash
npm install @track-player/web
```

## Quick Start

```javascript
import TrackPlayer, { State, Event } from "@track-player/web"

// Setup the player
await TrackPlayer.setupPlayer({
  updateInterval: 0.5, // Update progress every 0.5 second
  useMediaSession: true // Enable media controls in browser
})

// Add tracks to the queue
await TrackPlayer.add([
  {
    url: "https://example.com/track1.mp3",
    title: "Track 1",
    artist: "Artist 1",
    artwork: "https://example.com/artwork1.jpg"
  },
  {
    url: "https://example.com/track2.mp3",
    title: "Track 2",
    artist: "Artist 2",
    artwork: "https://example.com/artwork2.jpg"
  }
])

// Start playback
await TrackPlayer.play()

// Listen for playback state changes
TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
  if (data.state === State.Playing) {
    console.log("Track is playing")
  } else if (data.state === State.Paused) {
    console.log("Track is paused")
  }
})
```

## Usage

### Setup

Before using the player, you need to set it up:

```javascript
await TrackPlayer.setupPlayer(options)
```

#### Setup Options

| Option            | Type         | Default          | Description                                    |
| ----------------- | ------------ | ---------------- | ---------------------------------------------- |
| `waitForBuffer`   | boolean      | `true`           | Whether to wait for buffer before playing      |
| `updateInterval`  | number       | `1`              | Interval in seconds between progress updates   |
| `useMediaSession` | boolean      | `true`           | Whether to enable MediaSession API integration |
| `capabilities`    | Capability[] | All capabilities | List of player capabilities to enable          |

Available capabilities:

- `Play` - Enable play functionality
- `Pause` - Enable pause functionality
- `Stop` - Enable stop functionality
- `Skip` - Enable skip to any track in the queue
- `SkipToNext` - Enable skip to next track
- `SkipToPrevious` - Enable skip to previous track
- `SeekTo` - Enable seeking to position
- `SeekBy` - Enable seeking forward or backward by a relative amount of time
- `SetVolume` - Enable volume control
- `SetRate` - Enable playback rate control

### Managing Tracks

#### Add Tracks

```javascript
// Add a single track
await TrackPlayer.add({
  url: "https://example.com/track.mp3",
  title: "My Track",
  artist: "Artist Name",
  album: "Album Name",
  artwork: "https://example.com/artwork.jpg",
  duration: 180, // Optional, in seconds
  isLiveStream: false // Optional, for live streams
})

// Add multiple tracks
await TrackPlayer.add([track1, track2, track3])

// Add tracks at specific position (inserts before the specified index)
await TrackPlayer.add(track, 2) // Insert before track at index 2
```

#### Remove Tracks

```javascript
// Remove track at index 3
await TrackPlayer.remove(3)

// Remove multiple tracks
await TrackPlayer.remove([0, 2, 4])
```

#### Move Tracks

```javascript
// Move a track from index 1 to index 3
await TrackPlayer.move(1, 3)
```

### Playback Control

```javascript
// Play
await TrackPlayer.play()

// Pause
await TrackPlayer.pause()

// Stop
await TrackPlayer.stop()

// Skip to track at index 2
await TrackPlayer.skip(2)

// Skip to next track
await TrackPlayer.skipToNext()

// Skip to previous track
await TrackPlayer.skipToPrevious()

// Seek to position (in seconds)
await TrackPlayer.seekTo(30)

// Seek by offset (in seconds, positive or negative)
await TrackPlayer.seekBy(10) // Forward 10 seconds
await TrackPlayer.seekBy(-5) // Backward 5 seconds

// Retry playing current track after error
await TrackPlayer.retry()
```

### Volume and Rate Control

```javascript
// Set volume (0 to 1)
await TrackPlayer.setVolume(0.5)

// Get current volume
const volume = TrackPlayer.getVolume()

// Set playback rate (0.25 to 2.0)
await TrackPlayer.setRate(1.5)

// Get current playback rate
const rate = TrackPlayer.getRate()
```

### Queue Management

```javascript
// Get the entire queue
const queue = TrackPlayer.getQueue()

// Get a track from the queue by index
const track = TrackPlayer.getTrack(2)

// Get the active track
const activeTrack = TrackPlayer.getActiveTrack()

// Get the active track index
const activeTrackIndex = TrackPlayer.getActiveTrackIndex()
```

### Track Metadata

```javascript
// Update metadata for a track at a specific index
await TrackPlayer.updateMetadataForTrack(1, {
  title: "Updated Title",
  artist: "New Artist Name",
  artwork: "https://example.com/new-artwork.jpg"
})
```

### Repeat Mode

```javascript
import { RepeatMode } from "@track-player/web"

// Set repeat mode
await TrackPlayer.setRepeatMode(RepeatMode.Track) // Repeat current track
await TrackPlayer.setRepeatMode(RepeatMode.Queue) // Repeat entire queue
await TrackPlayer.setRepeatMode(RepeatMode.Off) // No repeat

// Get current repeat mode
const repeatMode = TrackPlayer.getRepeatMode()
```

### Player State and Progress

```javascript
// Get current state
const state = TrackPlayer.getPlaybackState()

// Get current position (in seconds)
const position = TrackPlayer.getPosition()

// Get duration (in seconds)
const duration = TrackPlayer.getDuration()

// Get buffered position (in seconds)
const buffered = TrackPlayer.getBufferedPosition()

// Get complete progress info
const progress = TrackPlayer.getProgress()
console.log(progress.position, progress.duration, progress.buffered)
```

### Event Handling

```javascript
import { Event } from "@track-player/web"

// Listen for track change
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
  console.log("Changed from track", data.prevTrack, "to", data.nextTrack)
})

// Listen for state change
TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
  console.log("Playback state changed to", data.state)
})

// Listen for playback progress
TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
  console.log("Position:", data.position, "Duration:", data.duration)
})

// Listen for errors
TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
  console.error("Error:", data.error)
})

// Remove event listener
const callback = (data) => console.log(data)
TrackPlayer.addEventListener(Event.PlaybackState, callback)
TrackPlayer.removeEventListener(Event.PlaybackState, callback)
```

### Equalizer

The player includes a 10-band equalizer with support for presets and real-time control.

#### Enable or disable the equalizer

```javascript
// Enable the equalizer
TrackPlayer.setEqualizerEnabled(true)

// Disable the equalizer
TrackPlayer.setEqualizerEnabled(false)

// Check if it's enabled
const isEnabled = TrackPlayer.isEqualizerEnabled()
```

#### Set gain for a specific band

```javascript
// Set gain for band 0 (32 Hz) to +4 dB
TrackPlayer.setEqualizerBandGain(0, 4)

// Get gain for band 0
const gain = TrackPlayer.getEqualizerBandGain(0)
```

#### Set all bands at once

```javascript
import type { EqualizerBand } from "@track-player/web"

// Set all bands (array of 10 bands)
TrackPlayer.setEqualizerBands([
  { frequency: 32, gain: 4, Q: 1 },
  { frequency: 64, gain: 3, Q: 1 },
  // ...other bands...
  { frequency: 16000, gain: 3, Q: 1 }
])
```

#### Reset equalizer

```javascript
// Reset all bands to 0 dB
TrackPlayer.resetEqualizer()
```

#### Use presets

```javascript
import type { EqualizerPreset } from "@track-player/web"

// Apply a preset (e.g., "rock", "pop", "jazz", "flat", etc.)
TrackPlayer.setEqualizerPreset("rock")
TrackPlayer.setEqualizerPreset("flat")
```

Available presets: `"rock"`, `"pop"`, `"jazz"`, `"classical"`, `"electronic"`, `"vocal"`, `"bass"`,
`"treble"`, `"flat"`

#### Get current bands

```javascript
const bands = TrackPlayer.getEqualizerBands()
```

#### Example: Custom UI for equalizer

```javascript
function EqualizerSliders() {
  const bands = TrackPlayer.getEqualizerBands()

  return (
    <div>
      {bands.map((band, idx) => (
        <div key={band.frequency}>
          <label>{band.frequency} Hz</label>
          <input
            type="range"
            min={-12}
            max={12}
            value={band.gain}
            onChange={(e) => TrackPlayer.setEqualizerBandGain(idx, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  )
}
```

### Audio Analysis

Get real-time audio analysis data for building visualizers.

#### Configure the analyser

```javascript
// Configure for high-resolution analysis (fftSize must be a power of 2)
TrackPlayer.configureAudioAnalyser(4096, 0.5)
```

#### Get analysis data

```javascript
// Get real-time audio analysis data
const analysisData = TrackPlayer.getAudioAnalysisData()
if (analysisData) {
  // Use frequencyData for spectrum visualization
  // Use timeData for waveform visualization
  renderVisualization(analysisData.frequencyData, analysisData.timeData)
}
```

## Hooks

For convenient integration with React components, the library provides several hooks:

### useTrackPlayerEvents

Register event listeners that are automatically cleaned up when the component unmounts.

```javascript
import { useTrackPlayerEvents, Event } from "@track-player/web"

function MyComponent() {
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], (event) => {
    // Handle events
    if (event.type === Event.PlaybackState) {
      console.log("State changed:", event.state)
    } else if (event.type === Event.PlaybackTrackChanged) {
      console.log("Track changed:", event.nextTrack)
    }
  })

  return <div>Player controls</div>
}
```

### useProgress

Tracks playback progress at a specified interval.

```javascript
import { useProgress } from "@track-player/web"

function ProgressBar() {
  // Update progress every 500ms
  const { position, duration, buffered } = useProgress(500)

  const progress = (position / duration) * 100 || 0
  const bufferedPercent = (buffered / duration) * 100 || 0

  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="buffered-bar" style={{ width: `${bufferedPercent}%` }} />
      <div className="time-display">
        {formatTime(position)} / {formatTime(duration)}
      </div>
    </div>
  )
}
```

### usePlaybackState

Keeps track of the current playback state.

```javascript
import { usePlaybackState, State } from "@track-player/web"

function PlayPauseButton() {
  const playbackState = usePlaybackState()

  const handlePlayPause = async () => {
    if (playbackState === State.Playing) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.play()
    }
  }

  return (
    <button onClick={handlePlayPause}>{playbackState === State.Playing ? "Pause" : "Play"}</button>
  )
}
```

### usePlayWhenReady

Tracks whether the player will start playing once it's ready.

```javascript
import { usePlayWhenReady } from "@track-player/web"

function LoadingIndicator() {
  const playWhenReady = usePlayWhenReady()
  const playbackState = usePlaybackState()

  const isLoading = playWhenReady && playbackState === State.Buffering

  return isLoading ? <div className="loading-spinner" /> : null
}
```

### useActiveTrack

Keeps track of the currently active track.

```javascript
import { useActiveTrack } from "@track-player/web"

function NowPlaying() {
  const track = useActiveTrack()

  if (!track) return <div>No track playing</div>

  return (
    <div className="now-playing">
      {track.artwork && <img src={track.artwork} alt="Album Art" />}
      <div className="track-info">
        <h3>{track.title}</h3>
        <p>{track.artist}</p>
      </div>
    </div>
  )
}
```

### useQueue

Keeps track of the current playback queue.

```javascript
import { useQueue } from "@track-player/web"

function Playlist() {
  const queue = useQueue()

  return (
    <ul>
      {queue.map((track, index) => (
        <li key={`${index}-${track.url}`}>
          {track.title} - {track.artist}
        </li>
      ))}
    </ul>
  )
}
```

### useIsBuffering

A convenience hook that returns `true` if the player is in the `Buffering` state.

```javascript
import { useIsBuffering } from "@track-player/web"

function BufferingIndicator() {
  const isBuffering = useIsBuffering()

  return isBuffering ? <div className="buffering-spinner" /> : null
}
```

### Cleanup

```javascript
// Reset the player (clear queue but keep setup)
await TrackPlayer.reset()

// Completely destroy the player
await TrackPlayer.destroy()
```

## Track Object Structure

```typescript
type Track = {
  url: string // URL of the audio file (required)
  title: string // Track title (required)
  artist?: string // Name of the artist
  album?: string // Name of the album
  artwork?: string // URL to the track's artwork image
  duration?: number // Duration in seconds
  isLiveStream?: boolean // Flag for live streams
  [key: string]: any // Any additional custom metadata
}
```

## State Values

The player can be in one of these states:

- `State.None`: Player is not initialized
- `State.Ready`: Player is ready but not playing
- `State.Playing`: Audio is playing
- `State.Paused`: Playback is paused
- `State.Stopped`: Playback is stopped (at start position)
- `State.Buffering`: Player is buffering audio
- `State.Error`: An error occurred

## Event Types

- `Event.PlaybackState`: Fired when the playback state changes
- `Event.PlaybackTrackChanged`: Fired when the current track changes
- `Event.PlaybackProgressUpdated`: Fired periodically with position updates
- `Event.PlaybackError`: Fired when an error occurs during playback
- `Event.PlaybackQueueEnded`: Fired when playback finishes and the queue is empty

## License

This project is licensed under the MIT License. See the the
[LICENSE](https://github.com/ItsLhuis/track-player/blob/main/LICENSE) file for details.

## Acknowledgments

- This project is inspired by
  [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)
