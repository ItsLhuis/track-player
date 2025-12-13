import type { Track } from "./types"

/**
 * Platform-agnostic queue manager for TrackPlayer
 *
 * Manages the track queue including adding, removing, reordering,
 * and navigating tracks. Automatically adjusts the current index
 * when tracks are modified.
 */
export class QueueManager {
  private queue: Track[] = []
  private currentIndex = -1

  /**
   * Adds tracks to the queue
   * @param tracks Single track or array of tracks to add
   * @param insertBeforeIndex Optional index to insert before. If omitted, appends to end
   */
  add(tracks: Track | Track[], insertBeforeIndex?: number): void {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks]

    if (tracksArray.length === 0) {
      return
    }

    const wasEmpty = this.queue.length === 0

    if (
      insertBeforeIndex !== undefined &&
      insertBeforeIndex >= 0 &&
      insertBeforeIndex <= this.queue.length
    ) {
      this.queue.splice(insertBeforeIndex, 0, ...tracksArray)

      if (this.currentIndex >= insertBeforeIndex) {
        this.currentIndex += tracksArray.length
      }
    } else {
      this.queue.push(...tracksArray)
    }

    if (wasEmpty && this.currentIndex === -1 && tracksArray.length > 0) {
      this.currentIndex = 0
    }
  }

  /**
   * Removes tracks from the queue
   * @param indices Single index or array of indices to remove
   * @returns Object indicating if current track was removed and the new current index
   */
  remove(indices: number | number[]): { removedCurrentTrack: boolean; newIndex: number } {
    const indicesArray = Array.isArray(indices) ? indices : [indices]

    if (indicesArray.length === 0) {
      return { removedCurrentTrack: false, newIndex: this.currentIndex }
    }

    const sortedIndices = [...indicesArray].sort((a, b) => b - a)
    let removedCurrentTrack = false
    let newIndex = this.currentIndex

    for (const index of sortedIndices) {
      if (index >= 0 && index < this.queue.length) {
        this.queue.splice(index, 1)

        if (index < newIndex) {
          newIndex -= 1
        } else if (index === this.currentIndex) {
          removedCurrentTrack = true
          if (this.queue.length > 0) {
            newIndex = Math.min(this.currentIndex, this.queue.length - 1)
          } else {
            newIndex = -1
          }
        }
      }
    }

    this.currentIndex = newIndex
    return { removedCurrentTrack, newIndex }
  }

  /**
   * Moves a track from one position to another
   * @param fromIndex Current index of the track to move
   * @param toIndex Target index to move the track to
   * @throws Error if either index is out of bounds
   */
  move(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.queue.length) {
      throw new Error(`From index ${fromIndex} is out of bounds`)
    }

    if (toIndex < 0 || toIndex >= this.queue.length) {
      throw new Error(`To index ${toIndex} is out of bounds`)
    }

    if (fromIndex === toIndex) {
      return
    }

    const track = this.queue[fromIndex]
    if (!track) {
      return
    }

    this.queue.splice(fromIndex, 1)
    this.queue.splice(toIndex, 0, track)

    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex -= 1
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex += 1
    }
  }

  /**
   * Skips to a specific track in the queue
   * @param index Index of the track to skip to
   * @returns Object containing previous and new indices
   * @throws Error if index is out of bounds
   */
  skip(index: number): { prevIndex: number; newIndex: number } {
    if (index < 0 || index >= this.queue.length) {
      throw new Error(`Track index ${index} is out of bounds`)
    }

    const prevIndex = this.currentIndex
    this.currentIndex = index

    return { prevIndex, newIndex: index }
  }

  /**
   * Returns a copy of the current queue
   * @returns Array of all tracks in the queue
   */
  getQueue(): Track[] {
    return [...this.queue]
  }

  /**
   * Gets a track at a specific index
   * @param index Index of the track to retrieve
   * @returns The track at the index, or undefined if out of bounds
   */
  getTrack(index: number): Track | undefined {
    if (index >= 0 && index < this.queue.length) {
      return this.queue[index]
    }
    return undefined
  }

  /**
   * Gets the currently active track
   * @returns The current track, or undefined if queue is empty
   */
  getCurrentTrack(): Track | undefined {
    return this.getTrack(this.currentIndex)
  }

  /**
   * Gets the current track index
   * @returns Current index, or -1 if queue is empty
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }

  /**
   * Sets the current track index
   * @param index New current index
   */
  setCurrentIndex(index: number): void {
    this.currentIndex = index
  }

  /**
   * Gets the number of tracks in the queue
   * @returns Queue length
   */
  getLength(): number {
    return this.queue.length
  }

  /**
   * Checks if the queue is empty
   * @returns True if queue has no tracks
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Checks if there is a next track in the queue
   * @returns True if there is a next track
   */
  hasNext(): boolean {
    return this.currentIndex < this.queue.length - 1
  }

  /**
   * Checks if there is a previous track in the queue
   * @returns True if there is a previous track
   */
  hasPrevious(): boolean {
    return this.currentIndex > 0
  }

  /**
   * Gets the index of the next track
   * @returns Next track index, or null if at end
   */
  getNextIndex(): number | null {
    if (this.hasNext()) {
      return this.currentIndex + 1
    }
    return null
  }

  /**
   * Gets the index of the previous track
   * @returns Previous track index, or null if at start
   */
  getPreviousIndex(): number | null {
    if (this.hasPrevious()) {
      return this.currentIndex - 1
    }
    return null
  }

  /**
   * Updates metadata for a track at a specific index
   * @param index Index of the track to update
   * @param metadata Partial track data to merge
   * @throws Error if index is out of bounds
   */
  updateTrack(index: number, metadata: Partial<Track>): void {
    const track = this.queue[index]
    if (index < 0 || index >= this.queue.length || !track) {
      throw new Error(`Track index ${index} is out of bounds`)
    }

    this.queue[index] = { ...track, ...metadata }
  }

  /**
   * Clears all tracks from the queue and resets the current index
   */
  clear(): void {
    this.queue = []
    this.currentIndex = -1
  }

  /**
   * Checks if the current track is the last in the queue
   * @returns True if at the end of the queue
   */
  isAtEnd(): boolean {
    return this.currentIndex === this.queue.length - 1
  }

  /**
   * Checks if the current track is the first in the queue
   * @returns True if at the start of the queue
   */
  isAtStart(): boolean {
    return this.currentIndex === 0
  }
}
