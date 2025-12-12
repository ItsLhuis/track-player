---
sidebar_position: 1
id: lifecycle
title: Lifecycle
---

# Lifecycle

These functions manage the lifecycle of the player - setup, configuration, updates, and cleanup.

## setupPlayer

Initializes the player with the given options. This must be called before using any other player
functionality.

```javascript
await TrackPlayer.setupPlayer(options?: SetupOptions): Promise<void>
```

### Parameters

| Parameter | Type           | Required | Description                          |
| --------- | -------------- | -------- | ------------------------------------ |
| options   | `SetupOptions` | No       | Configuration options for the player |

### SetupOptions

| Option          | Type           | Default          | Description                                    |
| --------------- | -------------- | ---------------- | ---------------------------------------------- |
| waitForBuffer   | `boolean`      | true             | Whether to wait for buffer before playing      |
| updateInterval  | `number`       | 1                | Interval in seconds between progress updates   |
| useMediaSession | `boolean`      | true             | Whether to enable MediaSession API integration |
| capabilities    | `Capability[]` | All capabilities | List of player capabilities to enable          |

### Example

```javascript
import TrackPlayer, { Capability } from "@track-player/web"

await TrackPlayer.setupPlayer({
  updateInterval: 0.5,
  useMediaSession: true,
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo
  ]
})
```

## updateOptions

Updates the player options after initialization.

```javascript
await TrackPlayer.updateOptions(options: Partial<SetupOptions>): Promise<void>
```

### Parameters

| Parameter | Type                    | Required | Description                    |
| --------- | ----------------------- | -------- | ------------------------------ |
| options   | `Partial<SetupOptions>` | Yes      | Updated options for the player |

### Example

```javascript
// Update player options to change update interval or capabilities
await TrackPlayer.updateOptions({
  updateInterval: 0.2,
  capabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.SeekTo]
})
```

## reset

Resets the player state and clears the queue, but keeps the player initialization.

```javascript
await TrackPlayer.reset(): Promise<void>
```

### Example

```javascript
// Reset the player (clears queue but keeps initialization)
await TrackPlayer.reset()
```

## destroy

Completely destroys the player instance and releases all resources. After calling this, you must
call `setupPlayer` again before using any other functions.

```javascript
await TrackPlayer.destroy(): Promise<void>
```

### Example

```javascript
// Clean up the player when you're done with it
await TrackPlayer.destroy()
```

## Event Listeners

### addEventListener

Registers an event handler for the specified event type.

```javascript
TrackPlayer.addEventListener(event: Event, listener: EventHandler): void
```

### Parameters

| Parameter | Type           | Required | Description                                |
| --------- | -------------- | -------- | ------------------------------------------ |
| event     | `Event`        | Yes      | The event type to listen for               |
| listener  | `EventHandler` | Yes      | The function to call when the event occurs |

### Example

```javascript
import { Event } from "@track-player/web"

// Register event listener
const stateChangeHandler = (event) => {
  console.log("Player state changed:", event.state)
}
TrackPlayer.addEventListener(Event.PlaybackState, stateChangeHandler)
```

### removeEventListener

Removes a previously registered event handler.

```javascript
TrackPlayer.removeEventListener(event: Event, listener: EventHandler): boolean
```

### Parameters

| Parameter | Type           | Required | Description                                |
| --------- | -------------- | -------- | ------------------------------------------ |
| event     | `Event`        | Yes      | The event type to remove the listener from |
| listener  | `EventHandler` | Yes      | The function to remove                     |

### Return Value

Returns `true` if the listener was found and removed, or `false` otherwise.

### Example

```javascript
// Remove the event listener when no longer needed
TrackPlayer.removeEventListener(Event.PlaybackState, stateChangeHandler)
```

## Best Practices

1. **Always setup the player first**: Call `setupPlayer` before using any other functions.

2. **Cleanup when done**: In React components, call `destroy` in the cleanup function of your
   `useEffect` hook:

   ```javascript
   useEffect(() => {
     const setupPlayer = async () => {
       await TrackPlayer.setupPlayer()
       // Add tracks, etc.
     }

     setupPlayer()

     return () => {
       TrackPlayer.destroy()
     }
   }, [])
   ```

3. **Reset between playlists**: When changing playlists, use `reset` to clear the current queue
   before adding new tracks.

4. **Handle setup errors**: Wrap setup code in try/catch blocks to handle potential errors:

   ```javascript
   try {
     await TrackPlayer.setupPlayer()
   } catch (error) {
     console.error("Failed to setup player:", error)
   }
   ```

5. **Remove event listeners**: Always remove event listeners when they're no longer needed to
   prevent memory leaks.
