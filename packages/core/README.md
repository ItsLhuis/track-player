<img src="../../assets/icon.svg" width="100" height="100" />

# @track-player/core

This package contains the platform-agnostic core logic for the Track Player monorepo. It is designed
to be consumed by platform-specific implementations (e.g., `@track-player/web`) to ensure consistent
behavior and a unified API across different environments. **It is not intended for direct use in
end-user applications.**

## Features

The `@track-player/core` package offers the fundamental building blocks for audio playback
management:

- 🎵 **Core State Machine:** Manages the player's internal state transitions.
- 📋 **Queue Management:** Handles all track queue operations (add, remove, move, skip).
- 🎛️ **Equalizer Logic:** Provides the business logic for a 10-band equalizer and presets.
- 🔄 **Event System:** A robust pub/sub system for player events.
- 📝 **Type Definitions:** Comprehensive TypeScript types and interfaces for a consistent API.
- ⚙️ **Utility Functions:** Helper functions for common audio operations.

## Installation (Internal Monorepo Use)

This package is a workspace dependency within the Track Player monorepo. To use it, simply declare
it in the `dependencies` of your platform-specific package (e.g., `@track-player/web`'s
`package.json`):

```json
{
  "name": "@track-player/web",
  // ...
  "dependencies": {
    "@track-player/core": "workspace:*"
  }
}
```

Then run `pnpm install` (or your monorepo's package manager install command) from the root of your
monorepo.

## Usage (For Platform Implementations)

Platform-specific packages typically extend `BaseTrackPlayer` from `@track-player/core` and
implement the `PlayerAdapter` interface.

```typescript
// Example from a platform-specific package (e.g., @track-player/web)
import { BaseTrackPlayer, type PlayerAdapter } from "@track-player/core"
// Assuming you have a WebPlayerAdapter defined elsewhere in your package
import { WebPlayerAdapter } from "./WebPlayerAdapter"

class WebTrackPlayer extends BaseTrackPlayer {
  protected createAdapter(): PlayerAdapter {
    return new WebPlayerAdapter() // Return an instance of your platform-specific adapter
  }
}
```

## License

This project is licensed under the MIT License. See the
[LICENSE](https://github.com/ItsLhuis/track-player/blob/main/LICENSE) file for details.

## Acknowledgments

This package is part of the larger
[Track Player monorepo project](https://github.com/ItsLhuis/track-player).
