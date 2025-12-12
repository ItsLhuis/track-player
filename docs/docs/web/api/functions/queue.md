---
sidebar_position: 3
id: queue
title: Queue
---

# Queue

These functions allow you to manage the playback queue - adding, removing, and rearranging tracks,
as well as retrieving information about the queue and current track.

## Adding Tracks

### add

Adds one or more tracks to the queue.

```javascript
await TrackPlayer.add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<void>
```

#### Parameters

| Parameter         | Type               | Required | Description                                                                                        |
| ----------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| tracks            | `Track \| Track[]` | Yes      | A single track or array of tracks to add                                                           |
| insertBeforeIndex | `number`           | No       | Optional index to insert tracks before (if not provided, tracks are added to the end of the queue) |

#### Example

```javascript
// Add a single track to the end of the queue
await TrackPlayer.add({
  url: "https://example.com/song.mp3",
  title: "Song Title",
  artist: "Artist Name",
  artwork: "https://example.com/album-art.jpg"
})

// Add multiple tracks to the end of the queue
await TrackPlayer.add([
  {
    url: "https://example.com/song1.mp3",
    title: "First Song",
    artist: "Artist Name"
  },
  {
    url: "https://example.com/song2.mp3",
    title: "Second Song",
    artist: "Artist Name"
  }
])

// Insert tracks at a specific position (before track at index 2)
await TrackPlayer.add(
  [
    {
      url: "https://example.com/song3.mp3",
      title: "Insert Before",
      artist: "Artist Name"
    }
  ],
  2
)
```

## Modifying the Queue

### remove

Removes one or more tracks from the queue by index.

```javascript
await TrackPlayer.remove(indices: number | number[]): Promise<void>
```

#### Parameters

| Parameter | Type                 | Required | Description                         |
| --------- | -------------------- | -------- | ----------------------------------- |
| indices   | `number \| number[]` | Yes      | Index or array of indices to remove |

#### Example

```javascript
// Remove a single track at index 3
await TrackPlayer.remove(3)

// Remove multiple tracks
await TrackPlayer.remove([0, 2, 5])
```

### move

Moves a track from one position to another in the queue.

```javascript
await TrackPlayer.move(fromIndex: number, toIndex: number): Promise<void>
```

#### Parameters

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| fromIndex | `number` | Yes      | Index of the track to move      |
| toIndex   | `number` | Yes      | Destination index for the track |

#### Example

```javascript
// Move the track at index 2 to position 5
await TrackPlayer.move(2, 5)
```

### updateMetadataForTrack

Updates the metadata for a specific track in the queue.

```javascript
await TrackPlayer.updateMetadataForTrack(index: number, metadata: Partial<Track>): Promise<void>
```

#### Parameters

| Parameter | Type             | Required | Description                               |
| --------- | ---------------- | -------- | ----------------------------------------- |
| index     | `number`         | Yes      | Index of the track to update              |
| metadata  | `Partial<Track>` | Yes      | New metadata to merge with existing track |

#### Example

```javascript
// Update the title and artist of track at index 1
await TrackPlayer.updateMetadataForTrack(1, {
  title: "New Track Title",
  artist: "Updated Artist Name",
  album: "New Album"
})

// Update only the artwork
await TrackPlayer.updateMetadataForTrack(0, {
  artwork: "https://example.com/new-artwork.jpg"
})

// Add custom metadata
await TrackPlayer.updateMetadataForTrack(2, {
  genre: "Rock",
  year: 2023,
  rating: 5
})
```

## Queue Information

### getQueue

Gets the entire queue of tracks.

```javascript
TrackPlayer.getQueue(): Track[]
```

#### Return Value

Returns an array of Track objects representing the current queue.

#### Example

```javascript
const queue = TrackPlayer.getQueue()
console.log(`Queue has ${queue.length} tracks`)

// List all tracks in the queue
queue.forEach((track, index) => {
  console.log(`${index + 1}. ${track.title} by ${track.artist || "Unknown"}`)
})
```

### getTrack

Gets a track from the queue by index.

```javascript
TrackPlayer.getTrack(index: number): Track | undefined
```

#### Parameters

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| index     | `number` | Yes      | Index of the track to retrieve |

#### Return Value

Returns the Track object if found, or undefined if the index is out of bounds.

#### Example

```javascript
const trackAtIndex2 = TrackPlayer.getTrack(2)
if (trackAtIndex2) {
  console.log(`Track at index 2: ${trackAtIndex2.title}`)
} else {
  console.log("No track found at index 2")
}
```

### getActiveTrack

Gets the currently active track.

```javascript
TrackPlayer.getActiveTrack(): Track | undefined
```

#### Return Value

Returns the currently active Track object, or undefined if no track is active.

#### Example

```javascript
const activeTrack = TrackPlayer.getActiveTrack()
if (activeTrack) {
  console.log(`Currently playing: ${activeTrack.title} by ${activeTrack.artist}`)
} else {
  console.log("No track is currently active")
}
```

### getActiveTrackIndex

Gets the index of the currently active track in the queue.

```javascript
TrackPlayer.getActiveTrackIndex(): number
```

#### Return Value

Returns the index of the currently active track, or -1 if no track is active.

#### Example

```javascript
const activeIndex = TrackPlayer.getActiveTrackIndex()
if (activeIndex >= 0) {
  console.log(`Currently playing track at index: ${activeIndex}`)

  // Get the track details
  const track = TrackPlayer.getTrack(activeIndex)
  if (track) {
    console.log(`Track: ${track.title}`)
  }
} else {
  console.log("No track is currently active")
}

// Use with queue information
const queue = TrackPlayer.getQueue()
const activeIndex = TrackPlayer.getActiveTrackIndex()

if (activeIndex >= 0 && activeIndex < queue.length) {
  console.log(`Playing track ${activeIndex + 1} of ${queue.length}`)
}
```
