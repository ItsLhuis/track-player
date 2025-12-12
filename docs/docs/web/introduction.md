---
sidebar_position: 1
id: introduction
title: Introduction
slug: /
---

# Introduction

[![downloads](https://img.shields.io/npm/dw/@track-player/web)](https://www.npmjs.com/package/@track-player/web)
[![npm](https://img.shields.io/npm/v/@track-player/web)](https://www.npmjs.com/package/@track-player/web)
[![license](https://img.shields.io/npm/l/@track-player/web)](https://github.com/ItsLhuis/@track-player/web/blob/main/LICENSE)

**Track Player** is a powerful audio player library for React applications. It provides a simple yet
comprehensive way to play audio tracks in your web application with full control over playback and
queue management.

## Features

- 🎵 **Full audio playback control** (play, pause, skip, seek)
- 📋 **Queue management** for handling multiple tracks
- 🔄 **Dynamic track metadata updates** for real-time information changes
- 🔁 **Repeat modes** (Off, Track, Queue)
- 🎚️ **Volume and playback rate control**
- 🎛️ **10-band equalizer** with real-time audio processing
- 🎨 **Audio visualization** with frequency and time-domain analysis
- 📱 **MediaSession API integration** for media controls in browsers
- 🔄 **Event system** for state changes and updates
- 🌊 **Buffer state tracking** for improved user experience
- 📊 **Playback progress tracking**
- 🔧 **Configurable capabilities** to match your application needs
- ⚛️ **React hooks** for seamless component integration
- 🎯 **Advanced error handling** and recovery mechanisms

## Basic Example

```javascript
import TrackPlayer, { State, Event } from "@track-player/web"

// Step 1: Set up the player when your app initializes
useEffect(() => {
  const setupPlayer = async () => {
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
  }

  setupPlayer()

  // Cleanup when the component unmounts
  return () => {
    TrackPlayer.destroy()
  }
}, [])

// Step 2: Control playback with simple functions
const playPauseTrack = async () => {
  const state = TrackPlayer.getPlaybackState()
  if (state === State.Playing) {
    await TrackPlayer.pause()
  } else {
    await TrackPlayer.play()
  }
}

// Step 3: Listen for events
useEffect(() => {
  const handlePlaybackStateChange = (data) => {
    console.log("Playback state changed to:", data.state)
  }

  TrackPlayer.addEventListener(Event.PlaybackState, handlePlaybackStateChange)

  return () => {
    TrackPlayer.removeEventListener(Event.PlaybackState, handlePlaybackStateChange)
  }
}, [])
```

## Advanced Features

### Equalizer Control

```javascript
// Enable the 10-band equalizer
TrackPlayer.setEqualizerEnabled(true)

// Apply a preset
TrackPlayer.setEqualizerPreset("rock")

// Or customize individual bands
TrackPlayer.setEqualizerBandGain(0, 6) // Boost bass at 32Hz
TrackPlayer.setEqualizerBandGain(9, 4) // Boost treble at 16kHz
```

### Track Metadata Updates

```javascript
// Update track information dynamically
await TrackPlayer.updateMetadataForTrack(0, {
  title: "Updated Title",
  artist: "New Artist",
  artwork: "https://example.com/new-artwork.jpg"
})
```

### Audio Visualization

```javascript
// Get real-time audio analysis data
const analysisData = TrackPlayer.getAudioAnalysisData()
if (analysisData) {
  // Use frequencyData for spectrum visualization
  // Use timeData for waveform visualization
  renderVisualization(analysisData.frequencyData, analysisData.timeData)
}
```

## Why Track Player?

- **Complete Feature Set**: From basic playback to advanced audio processing
- **Simple API**: Designed with ease of use in mind
- **React Integration**: Custom hooks for seamless integration with React components
- **Professional Audio Features**: Equalizer, audio analysis, and visualization capabilities
- **Media Controls**: Support for browser and system media controls
- **Comprehensive Documentation**: Everything you need to get started and master the library
- **TypeScript Support**: Full TypeScript definitions included

Ready to add professional audio playback to your React application? Follow our
[Installation](/docs/installation) guide to get started!
