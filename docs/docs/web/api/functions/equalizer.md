---
sidebar_position: 4
id: equalizer
title: Equalizer
---

# Equalizer

These functions manage the 10-band equalizer with real-time audio processing capabilities. The
equalizer provides precise control over frequency bands ranging from 32Hz to 16kHz, covering the
full audible spectrum.

:::info Automatic Headroom Management To ensure the best possible audio quality, the player includes
automatic headroom management. When you boost frequencies, the player automatically reduces the
overall pre-amplifier gain to prevent digital clipping (distortion). This results in a clean, clear
sound even with significant EQ adjustments. :::

## setEqualizerEnabled

Enable or disable the equalizer. When re-enabled, the equalizer will restore its previous state,
including any custom band gains or presets.

```javascript
TrackPlayer.setEqualizerEnabled(enabled: boolean): void
```

### Parameters

| Parameter | Type      | Required | Description                     |
| --------- | --------- | -------- | ------------------------------- |
| enabled   | `boolean` | Yes      | Whether to enable the equalizer |

### Example

```javascript
// Enable equalizer
TrackPlayer.setEqualizerEnabled(true)

// Disable equalizer (bypasses all EQ processing)
TrackPlayer.setEqualizerEnabled(false)
```

## isEqualizerEnabled

Check if the equalizer is currently enabled.

```javascript
TrackPlayer.isEqualizerEnabled(): boolean
```

### Return Value

Returns `boolean` - Whether the equalizer is enabled

### Example

```javascript
if (TrackPlayer.isEqualizerEnabled()) {
  console.log("Equalizer is active")
} else {
  console.log("Equalizer is bypassed")
}
```

## setEqualizerBandGain

Set the gain for a specific frequency band. The player will automatically adjust the pre-amp gain to
prevent clipping if you boost frequencies.

```javascript
TrackPlayer.setEqualizerBandGain(bandIndex: number, gain: number): void
```

### Parameters

| Parameter | Type     | Required | Description             |
| --------- | -------- | -------- | ----------------------- |
| bandIndex | `number` | Yes      | Index of the band (0-9) |
| gain      | `number` | Yes      | Gain in dB (-12 to +12) |

### Band Indices

| Index | Frequency | Description    |
| ----- | --------- | -------------- |
| 0     | 32 Hz     | Sub-bass       |
| 1     | 64 Hz     | Bass           |
| 2     | 125 Hz    | Low mids       |
| 3     | 250 Hz    | Midrange       |
| 4     | 500 Hz    | Upper mids     |
| 5     | 1000 Hz   | Presence       |
| 6     | 2000 Hz   | Upper presence |
| 7     | 4000 Hz   | Brilliance     |
| 8     | 8000 Hz   | Treble         |
| 9     | 16000 Hz  | Air            |

### Example

```javascript
// Boost bass frequencies
TrackPlayer.setEqualizerBandGain(0, 6) // +6dB at 32Hz
TrackPlayer.setEqualizerBandGain(1, 4) // +4dB at 64Hz

// Cut harsh frequencies
TrackPlayer.setEqualizerBandGain(6, -3) // -3dB at 2kHz

// Enhance presence
TrackPlayer.setEqualizerBandGain(5, 2) // +2dB at 1kHz
```

## getEqualizerBandGain

Get the current gain for a specific frequency band.

```javascript
TrackPlayer.getEqualizerBandGain(bandIndex: number): number
```

### Parameters

| Parameter | Type     | Required | Description             |
| --------- | -------- | -------- | ----------------------- |
| bandIndex | `number` | Yes      | Index of the band (0-9) |

### Return Value

Returns `number` - Current gain in dB

### Example

```javascript
// Check current bass level
const bassGain = TrackPlayer.getEqualizerBandGain(1)
console.log(`64Hz band is at ${bassGain}dB`)

// Display all band levels
for (let i = 0; i < 10; i++) {
  const gain = TrackPlayer.getEqualizerBandGain(i)
  console.log(`Band ${i}: ${gain}dB`)
}
```

## setEqualizerBands

Set the configuration for all equalizer bands at once. The player will automatically adjust the
pre-amp gain to prevent clipping based on the new band settings.

```javascript
TrackPlayer.setEqualizerBands(bands: EqualizerBand[]): void
```

### Parameters

| Parameter | Type              | Required | Description                 |
| --------- | ----------------- | -------- | --------------------------- |
| bands     | `EqualizerBand[]` | Yes      | Array of 10 equalizer bands |

### Example

```javascript
import type { EqualizerBand } from "@track-player/web"

// Create custom EQ curve
const customBands = [
  { frequency: 32, gain: 3, Q: 1 },
  { frequency: 64, gain: 5, Q: 1 },
  { frequency: 125, gain: 2, Q: 1 },
  { frequency: 250, gain: 0, Q: 1 },
  { frequency: 500, gain: -1, Q: 1 },
  { frequency: 1000, gain: 0, Q: 1 },
  { frequency: 2000, gain: 1, Q: 1 },
  { frequency: 4000, gain: 2, Q: 1 },
  { frequency: 8000, gain: 4, Q: 1 },
  { frequency: 16000, gain: 3, Q: 1 }
]

TrackPlayer.setEqualizerBands(customBands)
```

## getEqualizerBands

Get the current configuration of all equalizer bands.

```javascript
TrackPlayer.getEqualizerBands(): EqualizerBand[]
```

### Return Value

Returns `EqualizerBand[]` - Array of current equalizer band configurations

### Example

```javascript
const currentBands = TrackPlayer.getEqualizerBands()

currentBands.forEach((band, index) => {
  console.log(`${band.frequency}Hz: ${band.gain}dB (Q: ${band.Q})`)
})

// Save current configuration
const savedEQ = JSON.stringify(currentBands)
localStorage.setItem("myEQSettings", savedEQ)
```

## setEqualizerPreset

Apply a predefined equalizer preset. The player will automatically adjust the pre-amp gain to
prevent clipping based on the preset's values.

```javascript
TrackPlayer.setEqualizerPreset(preset: EqualizerPreset): void
```

### Parameters

| Parameter | Type              | Required | Description                 |
| --------- | ----------------- | -------- | --------------------------- |
| preset    | `EqualizerPreset` | Yes      | Name of the preset to apply |

### Available Presets

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
// Apply presets for different genres
TrackPlayer.setEqualizerPreset("rock") // Great for rock and metal
TrackPlayer.setEqualizerPreset("jazz") // Smooth for jazz and acoustic
TrackPlayer.setEqualizerPreset("electronic") // Punchy for EDM and electronic
TrackPlayer.setEqualizerPreset("vocal") // Clear vocals for podcasts
TrackPlayer.setEqualizerPreset("flat") // Reset to neutral
```

## resetEqualizer

Reset all equalizer bands to 0dB (flat response).

```javascript
TrackPlayer.resetEqualizer(): void
```

### Example

```javascript
// Reset equalizer to neutral
TrackPlayer.resetEqualizer()

// Equivalent to:
TrackPlayer.setEqualizerPreset("flat")
```

## getAudioAnalysisData

Get real-time audio analysis data for visualization purposes.

```javascript
TrackPlayer.getAudioAnalysisData(): AudioAnalysisData | null
```

### Return Value

Returns `AudioAnalysisData | null` - Audio analysis data or null if not available

```typescript
interface AudioAnalysisData {
  frequencyData: Uint8Array // Frequency domain data (0-255)
  timeData: Uint8Array // Time domain data (0-255)
  sampleRate: number // Audio sample rate
  fftSize: number // FFT size used for analysis
}
```

### Example

```javascript
// Get audio analysis data for visualization
const analysisData = TrackPlayer.getAudioAnalysisData()

if (analysisData) {
  const { frequencyData, timeData, sampleRate, fftSize } = analysisData

  // Use frequency data for spectrum analyzer
  console.log(`Frequency bins: ${frequencyData.length}`)
  console.log(`Sample rate: ${sampleRate}Hz`)

  // Draw spectrum visualization
  drawSpectrumVisualizer(frequencyData)

  // Draw waveform visualization
  drawWaveform(timeData)
}
```

## configureAudioAnalyser

Configure the audio analyser settings for real-time analysis.

```javascript
TrackPlayer.configureAudioAnalyser(fftSize?: number, smoothingTimeConstant?: number): void
```

### Parameters

| Parameter             | Type     | Required | Default | Description                             |
| --------------------- | -------- | -------- | ------- | --------------------------------------- |
| fftSize               | `number` | No       | 2048    | FFT size (must be power of 2: 32-32768) |
| smoothingTimeConstant | `number` | No       | 0.8     | Temporal smoothing (0.0 - 1.0)          |

### Example

```javascript
// Configure for high-resolution analysis
TrackPlayer.configureAudioAnalyser(4096, 0.5)

// Configure for low-latency analysis
TrackPlayer.configureAudioAnalyser(512, 0.9)

// Configure for smooth visualization
TrackPlayer.configureAudioAnalyser(2048, 0.8)
```
