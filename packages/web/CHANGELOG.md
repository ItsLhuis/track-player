# Changelog

All notable changes to the `@track-player/web` package will be documented in this file.

## [1.0.0] - 2025-01-15

### Added

- 🎵 Full audio playback control (play, pause, stop, skip, seek)
- 📋 Queue management with add, remove, and move operations
- 🔁 Repeat modes (Off, Track, Queue)
- 🎚️ Volume and playback rate control
- 📱 MediaSession API integration for browser media controls
- 🔄 Event system for state changes and updates
- 🌊 Buffer state tracking
- 📊 Playback progress tracking
- 🔧 Configurable player capabilities
- 🎛️ 10-band equalizer with presets and real-time control
- 📈 Audio visualization support (frequency and waveform data)
- ⚛️ React hooks for easy integration:
  - `useTrackPlayerEvents` - Event listener management
  - `useProgress` - Playback progress tracking
  - `usePlaybackState` - Current playback state
  - `usePlayWhenReady` - Play when ready state
  - `useActiveTrack` - Currently playing track
  - `useQueue` - Queue management
  - `useIsBuffering` - Buffering state indicator
