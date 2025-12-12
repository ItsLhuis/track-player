---
sidebar_position: 6
id: objects
title: Objects
---

# Objects

This page describes the structure of various objects used in Track Player.

## Track

The Track object is the fundamental unit for playback in Track Player.

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

### Required Properties

| Property | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `url`    | `string` | URL of the audio file to play (local or remote) |
| `title`  | `string` | Title of the track                              |

### Optional Properties

| Property       | Type      | Description                                                          |
| -------------- | --------- | -------------------------------------------------------------------- |
| `artist`       | `string`  | Name of the artist                                                   |
| `album`        | `string`  | Name of the album                                                    |
| `artwork`      | `string`  | URL to artwork image                                                 |
| `duration`     | `number`  | Duration in seconds (will be detected automatically if not provided) |
| `isLiveStream` | `boolean` | Whether this track is a live stream                                  |

### Custom Properties

You can add any additional properties to a Track object. These will be stored and available when
accessing the track later.

### Example

```javascript
const track = {
  url: "https://example.com/audio/song.mp3",
  title: "Awesome Song",
  artist: "Amazing Artist",
  album: "Fantastic Album",
  artwork: "https://example.com/artwork/song.jpg",
  duration: 245,
  isLiveStream: false,
  // Custom properties
  genre: "Pop",
  releaseYear: 2023,
  lyrics: "La la la, this is my song..."
}
```

## Progress

The Progress object represents the current playback progress.

```typescript
type Progress = {
  position: number // Current playback position in seconds
  duration: number // Total duration of the track in seconds
  buffered: number // Amount of the track that has been buffered in seconds
}
```

### Properties

| Property   | Type     | Description                                                 |
| ---------- | -------- | ----------------------------------------------------------- |
| `position` | `number` | Current playback position in seconds                        |
| `duration` | `number` | Total duration of the current track in seconds              |
| `buffered` | `number` | Position up to which the track has been buffered in seconds |

### Example

```javascript
// Get current progress
const progress = TrackPlayer.getProgress()
console.log(`
  Position: ${progress.position} seconds
  Duration: ${progress.duration} seconds
  Buffered: ${progress.buffered} seconds
  Completion: ${((progress.position / progress.duration) * 100).toFixed(2)}%
`)
```

## PlaybackState

The PlaybackState represents the current state of the player.

```typescript
type PlaybackState = {
  state: State // Current playback state
  playWhenReady: boolean // Whether the player will play when ready
}
```

### Properties

| Property        | Type      | Description                                                |
| --------------- | --------- | ---------------------------------------------------------- |
| `state`         | `State`   | Current playback state, see [State](./constants#state)     |
| `playWhenReady` | `boolean` | Whether the player will automatically play when it's ready |

### Example

```javascript
// Get current playback state
const playbackState = TrackPlayer.getPlaybackState()
console.log(`
  Current state: ${playbackState.state}
  Will play when ready: ${playbackState.playWhenReady ? "Yes" : "No"}
`)
```

## EqualizerBand

The EqualizerBand object represents a single frequency band in the 10-band equalizer.

```typescript
type EqualizerBand = {
  frequency: EqualizerFrequency // Center frequency of the band in Hz
  gain: number // Gain adjustment in decibels (-12dB to +12dB)
  Q: number // Quality factor that determines bandwidth
}
```

### Properties

| Property    | Type                 | Description                                                                   |
| ----------- | -------------------- | ----------------------------------------------------------------------------- |
| `frequency` | `EqualizerFrequency` | Center frequency in Hz (32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000) |
| `gain`      | `number`             | Gain adjustment in decibels, range: -12dB to +12dB                            |
| `Q`         | `number`             | Quality factor determining bandwidth, typical range: 0.1 to 30                |

### Example

```javascript
const bassBoostBand = {
  frequency: 64, // 64 Hz bass frequency
  gain: 6, // +6dB boost
  Q: 1 // Standard Q factor
}

// Apply to equalizer
const bands = TrackPlayer.getEqualizerBands()
bands[1] = bassBoostBand // Update the 64Hz band
TrackPlayer.setEqualizerBands(bands)
```

## EqualizerOptions

The EqualizerOptions object contains the complete equalizer configuration.

```typescript
type EqualizerOptions = {
  enabled: boolean // Whether the equalizer is currently enabled
  bands: EqualizerBand[] // Array of 10 equalizer bands
}
```

### Properties

| Property  | Type              | Description                                            |
| --------- | ----------------- | ------------------------------------------------------ |
| `enabled` | `boolean`         | Whether the equalizer is currently active              |
| `bands`   | `EqualizerBand[]` | Array of 10 bands covering the full frequency spectrum |

### Example

```javascript
const equalizerConfig = {
  enabled: true,
  bands: [
    { frequency: 32, gain: 2, Q: 1 }, // Sub-bass
    { frequency: 64, gain: 4, Q: 1 }, // Bass
    { frequency: 125, gain: 1, Q: 1 }, // Low mids
    { frequency: 250, gain: 0, Q: 1 }, // Midrange
    { frequency: 500, gain: -1, Q: 1 }, // Upper mids
    { frequency: 1000, gain: 0, Q: 1 }, // Presence
    { frequency: 2000, gain: 1, Q: 1 }, // Upper presence
    { frequency: 4000, gain: 2, Q: 1 }, // Brilliance
    { frequency: 8000, gain: 3, Q: 1 }, // Treble
    { frequency: 16000, gain: 2, Q: 1 } // Air
  ]
}
```

## AudioAnalysisData

The AudioAnalysisData object provides real-time frequency analysis data for visualizers.

```typescript
type AudioAnalysisData = {
  frequencyData: Uint8Array // Frequency domain data (FFT)
  timeData: Uint8Array // Time domain data (waveform)
  sampleRate: number // Sample rate of the audio context
  fftSize: number // Size of the FFT analysis
}
```

### Properties

| Property        | Type         | Description                                        |
| --------------- | ------------ | -------------------------------------------------- |
| `frequencyData` | `Uint8Array` | Frequency magnitudes from 0Hz to Nyquist frequency |
| `timeData`      | `Uint8Array` | Amplitude values over time (waveform data)         |
| `sampleRate`    | `number`     | Sample rate of the audio context in Hz             |
| `fftSize`       | `number`     | FFT size determining frequency resolution          |

### Example

```javascript
// Note: This is a conceptual example - actual implementation may vary
const analysisData = TrackPlayer.getAudioAnalysisData()
console.log(`
  Sample Rate: ${analysisData.sampleRate} Hz
  FFT Size: ${analysisData.fftSize}
  Frequency bins: ${analysisData.frequencyData.length}
  Time samples: ${analysisData.timeData.length}
`)

// Use for visualization
const canvas = document.getElementById("visualizer")
const ctx = canvas.getContext("2d")
// Draw frequency bars or waveform using the data...
```

## Event Data

Different events provide different data structures:

### PlaybackState Event

```typescript
{
  type: Event.PlaybackState
  state: State
}
```

### PlaybackTrackChanged Event

```typescript
{
  type: Event.PlaybackTrackChanged
  prevTrack: number // Index of the previous track (-1 if none)
  nextTrack: number // Index of the new track (-1 if none)
}
```

### PlaybackProgressUpdated Event

```typescript
{
  type: Event.PlaybackProgressUpdated
  position: number // Current position in seconds
  duration: number // Total duration in seconds
  buffered: number // Buffered position in seconds
}
```

### PlaybackError Event

```typescript
{
  type: Event.PlaybackError
  error: string // Error message
}
```

## SetupOptions

Options used when setting up the player.

```typescript
type SetupOptions = {
  waitForBuffer?: boolean // Whether to wait for buffer before playing
  updateInterval?: number // Interval in seconds between progress updates
  useMediaSession?: boolean // Whether to enable MediaSession API integration
  capabilities?: Capability[] // List of player capabilities to enable
}
```

See more details in the [setupPlayer](./functions/lifecycle#setupplayer) function documentation.
