import type { Event } from "./constants"

import type { EventData, EventHandler } from "./types"

type EventMap = {
  [K in Event]: Set<EventHandler>
}

/**
 * Platform-agnostic event emitter for TrackPlayer events
 *
 * Provides a type-safe pub/sub system for player events.
 * Supports one-time listeners, bulk removal, and listener counting.
 */
export class EventEmitter {
  private listeners: Partial<EventMap> = {}

  /**
   * Registers an event listener
   * @param event The event type to listen for
   * @param handler The callback function to invoke when the event is emitted
   */
  on<T extends EventData>(event: Event, handler: EventHandler<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }

    this.listeners[event]?.add(handler as EventHandler)
  }

  /**
   * Removes an event listener
   * @param event The event type to stop listening for
   * @param handler The callback function to remove
   * @returns True if the handler was found and removed, false otherwise
   */
  off<T extends EventData>(event: Event, handler: EventHandler<T>): boolean {
    const handlers = this.listeners[event]
    if (handlers) {
      return handlers.delete(handler as EventHandler)
    }
    return false
  }

  /**
   * Emits an event to all registered listeners
   * @param data The event data to send to listeners
   */
  emit(data: EventData): void {
    const handlers = this.listeners[data.type]
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${data.type}:`, error)
        }
      }
    }
  }

  /**
   * Registers a one-time event listener that is automatically removed after being called
   * @param event The event type to listen for
   * @param handler The callback function to invoke once
   */
  once<T extends EventData>(event: Event, handler: EventHandler<T>): void {
    const onceHandler: EventHandler<T> = (data) => {
      this.off(event, onceHandler)
      handler(data)
    }

    this.on(event, onceHandler)
  }

  /**
   * Removes all listeners for a specific event or all events
   * @param event Optional event type. If omitted, removes all listeners for all events
   */
  removeAllListeners(event?: Event): void {
    if (event) {
      delete this.listeners[event]
    } else {
      this.listeners = {}
    }
  }

  /**
   * Returns the number of listeners for a specific event
   * @param event The event type to count listeners for
   * @returns The number of registered listeners
   */
  listenerCount(event: Event): number {
    return this.listeners[event]?.size ?? 0
  }

  /**
   * Checks if there are any listeners for a specific event
   * @param event The event type to check
   * @returns True if there are listeners, false otherwise
   */
  hasListeners(event: Event): boolean {
    return this.listenerCount(event) > 0
  }
}
