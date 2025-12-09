import {
  EQUALIZER_FREQUENCIES,
  EQUALIZER_PRESETS,
  GAIN_MIN,
  GAIN_MAX,
  DEFAULT_Q
} from "./constants"

import type { EqualizerBand, EqualizerPreset, EqualizerState } from "./types"

/**
 * Platform-agnostic equalizer state manager for TrackPlayer
 *
 * Manages the 10-band parametric equalizer configuration including
 * band gains, presets, and enabled state. Platform-specific audio
 * processing is handled through callbacks.
 */
export class EqualizerManager {
  private state: EqualizerState
  private onBandChange?: (index: number, gain: number) => void
  private onEnabledChange?: (enabled: boolean) => void

  constructor() {
    this.state = {
      enabled: false,
      bands: this.createDefaultBands()
    }
  }

  /** Creates the default 10-band equalizer configuration with flat response */
  private createDefaultBands(): EqualizerBand[] {
    return EQUALIZER_FREQUENCIES.map((frequency) => ({
      frequency,
      gain: 0,
      Q: DEFAULT_Q
    }))
  }

  /** Clamps a gain value to the valid range (-12dB to +12dB) */
  private clampGain(gain: number): number {
    return Math.max(GAIN_MIN, Math.min(GAIN_MAX, gain))
  }

  /**
   * Sets the callback for band gain changes
   * @param callback Function to call when a band gain changes
   */
  setOnBandChange(callback: (index: number, gain: number) => void): void {
    this.onBandChange = callback
  }

  /**
   * Sets the callback for enabled state changes
   * @param callback Function to call when enabled state changes
   */
  setOnEnabledChange(callback: (enabled: boolean) => void): void {
    this.onEnabledChange = callback
  }

  /**
   * Enables or disables the equalizer
   * @param enabled Whether the equalizer should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled
    this.onEnabledChange?.(enabled)
  }

  /**
   * Checks if the equalizer is enabled
   * @returns True if equalizer is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled
  }

  /**
   * Sets the gain for a specific frequency band
   * @param index Band index (0-9)
   * @param gain Gain in dB (-12 to +12)
   * @throws Error if index is out of range
   */
  setBandGain(index: number, gain: number): void {
    if (index < 0 || index >= this.state.bands.length) {
      throw new Error(`Band index ${index} is out of range (0-${this.state.bands.length - 1})`)
    }

    const clampedGain = this.clampGain(gain)
    const band = this.state.bands[index]

    if (band) {
      band.gain = clampedGain
      this.onBandChange?.(index, clampedGain)
    }
  }

  /**
   * Gets the gain for a specific frequency band
   * @param index Band index (0-9)
   * @returns Gain in dB
   * @throws Error if index is out of range
   */
  getBandGain(index: number): number {
    if (index < 0 || index >= this.state.bands.length) {
      throw new Error(`Band index ${index} is out of range (0-${this.state.bands.length - 1})`)
    }

    return this.state.bands[index]?.gain ?? 0
  }

  /**
   * Gets a copy of all equalizer bands
   * @returns Array of all band configurations
   */
  getBands(): EqualizerBand[] {
    return this.state.bands.map((band) => ({ ...band }))
  }

  /**
   * Sets all equalizer bands at once
   * @param bands Array of 10 band configurations
   * @throws Error if bands array length doesn't match
   */
  setBands(bands: EqualizerBand[]): void {
    if (bands.length !== this.state.bands.length) {
      throw new Error(`Expected ${this.state.bands.length} bands, got ${bands.length}`)
    }

    bands.forEach((band, index) => {
      const clampedGain = this.clampGain(band.gain)
      const currentBand = this.state.bands[index]

      if (currentBand) {
        currentBand.frequency = band.frequency
        currentBand.gain = clampedGain
        currentBand.Q = band.Q
        this.onBandChange?.(index, clampedGain)
      }
    })
  }

  /**
   * Applies a predefined equalizer preset
   * @param preset Name of the preset to apply
   * @throws Error if preset is unknown
   */
  setPreset(preset: EqualizerPreset): void {
    const gains = EQUALIZER_PRESETS[preset]

    if (!gains) {
      throw new Error(`Unknown preset: ${preset}`)
    }

    gains.forEach((gain, index) => {
      this.setBandGain(index, gain)
    })
  }

  /**
   * Resets all bands to flat response (0dB)
   */
  reset(): void {
    this.state.bands.forEach((band, index) => {
      band.gain = 0
      this.onBandChange?.(index, 0)
    })
  }

  /**
   * Gets the complete equalizer state
   * @returns Copy of enabled state and all bands
   */
  getState(): EqualizerState {
    return {
      enabled: this.state.enabled,
      bands: this.getBands()
    }
  }

  /**
   * Gets the standard equalizer frequencies
   * @returns Array of 10 frequencies in Hz
   */
  getFrequencies(): readonly number[] {
    return EQUALIZER_FREQUENCIES
  }

  /**
   * Gets all available preset names
   * @returns Array of preset names
   */
  static getAvailablePresets(): EqualizerPreset[] {
    return Object.keys(EQUALIZER_PRESETS) as EqualizerPreset[]
  }

  /**
   * Gets the gain values for a specific preset
   * @param preset Name of the preset
   * @returns Array of 10 gain values in dB
   * @throws Error if preset is unknown
   */
  static getPresetGains(preset: EqualizerPreset): readonly number[] {
    const gains = EQUALIZER_PRESETS[preset]
    if (!gains) {
      throw new Error(`Unknown preset: ${preset}`)
    }
    return gains
  }
}
