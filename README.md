<img src="assets/icon.svg" width="100" height="100" />

# Track Player

[![license](https://img.shields.io/github/license/ItsLhuis/track-player)](https://github.com/ItsLhuis/track-player/blob/main/LICENSE)

A modular and extensible audio player library with advanced features.

## Packages

| Package                               | Description                    | Status      |
| ------------------------------------- | ------------------------------ | ----------- |
| [`@track-player/core`](packages/core) | Shared platform-agnostic logic | ✅ Complete |
| [`@track-player/web`](packages/web)   | Web implementation for React   | ✅ Complete |

## Features

- 🎵 Full audio playback control (play, pause, skip, seek)
- 📋 Queue management with add, remove, move operations
- 🔁 Repeat modes (Off, Track, Queue)
- 🎚️ Volume and playback rate control
- 📱 Media controls integration (MediaSession API for web, Lock Screen for mobile)
- 🔄 Event system for state changes and updates
- 🌊 Buffer state tracking
- 📊 Playback progress tracking
- 🔧 Configurable capabilities
- 🎛️ 10-band Equalizer with presets and real-time control
- 📈 Audio visualization support

## Architecture

Track Player uses a monorepo architecture with a shared core and platform-specific packages:

```
track-player/
├── packages/
│   ├── core/     # Platform-agnostic shared logic
│   └── web/      # Web-specific implementation for React
├── docs/         # Documentation website
└── examples/     # Example applications
```

### Core Package

The core package contains all platform-agnostic business logic:

- Queue management
- State machine
- Event system
- Equalizer logic
- Type definitions

### Web Package

The web package provides browser-specific implementations for React:

- HTMLAudioElement and Web Audio API integration
- MediaSession API integration
- A suite of React hooks for easy integration

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the original
  [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player).
