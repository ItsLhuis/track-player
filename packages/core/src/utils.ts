import { MIN_RATE, MAX_RATE } from "./constants"

/**
 * Clamps a volume value to the valid range (0-1)
 * @param volume Volume value to clamp
 * @returns Volume clamped between 0 and 1
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume))
}

/**
 * Clamps a playback rate to the valid range (0.25-4.0)
 * @param rate Playback rate to clamp
 * @returns Rate clamped between MIN_RATE and MAX_RATE
 */
export function clampRate(rate: number): number {
  return Math.max(MIN_RATE, Math.min(MAX_RATE, rate))
}

/**
 * Checks if a number is a power of two
 * @param n Number to check
 * @returns True if n is a power of two
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}
