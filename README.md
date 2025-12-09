<img src="assets/icon.svg" width="100" height="100" />

# Track Player

[![license](https://img.shields.io/github/license/ItsLhuis/track-player)](https://github.com/ItsLhuis/track-player/blob/main/LICENSE)

A cross-platform audio player library for React and React Native applications. Track Player provides
a unified API for audio playback across web and mobile platforms, with shared core logic and
platform-specific optimizations.

## Packages

| Package                                   | Description                    | Status            |
| ----------------------------------------- | ------------------------------ | ----------------- |
| [`@track-player/core`](packages/core)     | Shared platform-agnostic logic | 🚧 In Development |
| [`@track-player/web`](packages/web)       | Web implementation for React   | 🚧 In Development |
| [`@track-player/native`](packages/native) | React Native implementation    | 🚧 In Development |

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

Track Player uses a monorepo architecture with three packages:

```
track-player/
├── packages/
│   ├── core/     # Platform-agnostic shared logic (~70% of codebase)
│   ├── web/      # Web-specific implementation
│   └── native/   # React Native-specific implementation
└── examples/     # Example applications
```

### Core Package

The core package contains all platform-agnostic business logic:

- Queue management
- State machine
- Event system
- Equalizer logic
- Type definitions
- Utility functions

### Web Package

The web package provides browser-specific implementations:

- HTMLAudioElement integration
- Web Audio API graph construction
- MediaSession API integration
- React hooks for web

### Native Package

The native package provides React Native-specific implementations:

- AudioContext and buffer management via `react-native-audio-api`
- Lock screen controls and remote commands
- Background playback support
- React hooks for native

## Installation

### Web

```bash
npm install @track-player/web
```

### React Native

```bash
npm install @track-player/native react-native-audio-api
```

## Migration from react-track-player-web

If you're currently using `react-track-player-web`, migration to `@track-player/web` is
straightforward:

```diff
- import TrackPlayer from "react-track-player-web"
+ import TrackPlayer from "@track-player/web"
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by
  [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player)
- Native audio powered by
  [react-native-audio-api](https://github.com/software-mansion/react-native-audio-api) from Software
  Mansion
