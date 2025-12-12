---
sidebar_position: 5
id: constants
title: Constants
---

# Constants

Track Player provides several constants for player states, events, capabilities, and repeat modes.

## State

Enum representing the different states the player can be in.

```javascript
import { State } from "@track-player/web"
```

| Constant          | Description                             |
| ----------------- | --------------------------------------- |
| `State.None`      | Player is not initialized               |
| `State.Ready`     | Player is ready but not playing         |
| `State.Playing`   | Audio is playing                        |
| `State.Paused`    | Playback is paused                      |
| `State.Stopped`   | Playback is stopped (at start position) |
| `State.Buffering` | Player is buffering audio               |
| `State.Error`     | An error occurred                       |

### Example

```javascript
import { State } from "@track-player/web"

// Check if player is currently playing
if (TrackPlayer.getPlaybackState() === State.Playing) {
  console.log("Music is playing!")
}
```

## Event

Enum representing the different events that can be emitted by the player.

```javascript
import { Event } from "@track-player/web"
```

| Constant                        | Description                                | Event Data                                                 |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `Event.PlaybackState`           | Fired when the playback state changes      | `{ state: State }`                                         |
| `Event.PlaybackTrackChanged`    | Fired when the current track changes       | `{ prevTrack: number \| null, nextTrack: number \| null }` |
| `Event.PlaybackProgressUpdated` | Fired periodically with position updates   | `{ position: number, duration: number, buffered: number }` |
| `Event.PlaybackError`           | Fired when an error occurs during playback | `{ error: string, code?: string }`                         |

### Example

```javascript
import { Event } from "@track-player/web"

// Listen for playback errors
TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
  console.error("Playback error:", data.error)
  if (data.code) {
    console.error("Error code:", data.code)
  }
})

// Listen for track changes
TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (data) => {
  console.log("Track changed from", data.prevTrack, "to", data.nextTrack)
})
```

## Capability

Enum representing the different capabilities that can be enabled for the player.

```javascript
import { Capability } from "@track-player/web"
```

| Constant                    | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `Capability.Play`           | Enable play functionality                                       |
| `Capability.Pause`          | Enable pause functionality                                      |
| `Capability.Stop`           | Enable stop functionality                                       |
| `Capability.Skip`           | Enable skip to any track in the queue                           |
| `Capability.SkipToNext`     | Enable skip to next track                                       |
| `Capability.SkipToPrevious` | Enable skip to previous track                                   |
| `Capability.SeekTo`         | Enable seeking to position                                      |
| `Capability.SeekBy`         | Enable seeking forward or backward by a relative amount of time |
| `Capability.SetVolume`      | Enable volume control                                           |
| `Capability.SetRate`        | Enable playback rate control                                    |

### Example

```javascript
import { Capability } from "@track-player/web"

// Setup player with specific capabilities
await TrackPlayer.setupPlayer({
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo
  ]
})
```

## RepeatMode

Enum representing the different repeat modes for playback.

```javascript
import { RepeatMode } from "@track-player/web"
```

| Constant           | Description                        |
| ------------------ | ---------------------------------- |
| `RepeatMode.Off`   | No repeat, play through queue once |
| `RepeatMode.Track` | Repeat the current track           |
| `RepeatMode.Queue` | Repeat the entire queue            |

### Example

```javascript
import { RepeatMode } from "@track-player/web"

// Set player to repeat the current track
await TrackPlayer.setRepeatMode(RepeatMode.Track)

// Check current repeat mode
const currentMode = TrackPlayer.getRepeatMode()
if (currentMode === RepeatMode.Queue) {
  console.log("Player is set to repeat the entire queue")
}
```

## EqualizerFrequency

Type representing the standard 10-band equalizer frequencies in Hz.

```javascript
import { EqualizerFrequency } from "@track-player/web"
```

| Frequency | Band Description |
| --------- | ---------------- |
| `32`      | Sub-bass         |
| `64`      | Bass             |
| `125`     | Low mids         |
| `250`     | Midrange         |
| `500`     | Upper mids       |
| `1000`    | Presence         |
| `2000`    | Upper presence   |
| `4000`    | Brilliance       |
| `8000`    | Treble           |
| `16000`   | Air              |

### Example

```javascript
// Get all available frequencies
const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

// Set gain for specific frequency
TrackPlayer.setEqualizerBandGain(0, 4) // Set 32Hz band to +4dB
```

## EqualizerPreset

Type representing predefined equalizer configurations for different music genres.

```javascript
import { EqualizerPreset } from "@track-player/web"
```

| Preset         | Description                                     |
| -------------- | ----------------------------------------------- |
| `"flat"`       | No adjustments (0dB on all bands)               |
| `"rock"`       | Enhanced bass and treble for rock music         |
| `"pop"`        | Balanced with slight bass and treble boost      |
| `"jazz"`       | Smooth mid-range emphasis                       |
| `"classical"`  | Natural sound with subtle enhancements          |
| `"electronic"` | Heavy bass and crisp highs for electronic music |
| `"vocal"`      | Mid-range boost for vocal clarity               |
| `"bass"`       | Heavy low-frequency emphasis                    |
| `"treble"`     | High-frequency emphasis                         |

### Example

```javascript
// Apply different presets
await TrackPlayer.setEqualizerPreset("rock")
await TrackPlayer.setEqualizerPreset("jazz")
await TrackPlayer.setEqualizerPreset("flat") // Reset to flat response
```
