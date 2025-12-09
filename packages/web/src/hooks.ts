import { useCallback, useEffect, useState } from "react"

import { Event, State } from "@track-player/core"
import type { EventData, EventHandler, Progress, Track } from "@track-player/core"

import TrackPlayer from "./TrackPlayer"

/**
 * Registers event listeners for TrackPlayer events that are automatically cleaned up when the component unmounts
 * @param events Array of events to listen to
 * @param handler Event handler function
 */
export function useTrackPlayerEvents(events: Event[], handler: EventHandler): void {
  useEffect(() => {
    events.forEach((event) => {
      TrackPlayer.addEventListener(event, handler)
    })

    return () => {
      events.forEach((event) => {
        TrackPlayer.removeEventListener(event, handler)
      })
    }
  }, [events, handler])
}

/**
 * Hook that polls the player's progress at a specified interval
 * @param interval Polling interval in milliseconds (default: 1000)
 * @returns Current progress information
 */
export function useProgress(interval = 1000): Progress {
  const [progress, setProgress] = useState<Progress>({
    position: 0,
    duration: 0,
    buffered: 0
  })

  useEffect(() => {
    const getProgress = () => {
      try {
        const position = TrackPlayer.getPosition()
        const duration = TrackPlayer.getDuration()
        const buffered = TrackPlayer.getBufferedPosition()

        setProgress({ position, duration, buffered })
      } catch {
        // Player might not be initialized yet
      }
    }

    getProgress()

    const intervalId = setInterval(getProgress, interval)

    return () => clearInterval(intervalId)
  }, [interval])

  return progress
}

/**
 * Hook that keeps track of the current playback state
 * @returns Current playback state
 */
export function usePlaybackState(): State | undefined {
  const [state, setState] = useState<State | undefined>(undefined)

  useEffect(() => {
    try {
      setState(TrackPlayer.getPlaybackState())
    } catch {
      // Player might not be initialized yet
    }
  }, [])

  const onStateChange = useCallback((data: EventData) => {
    if (data.type === Event.PlaybackState) {
      setState(data.state)
    }
  }, [])

  useTrackPlayerEvents([Event.PlaybackState], onStateChange)

  return state
}

/**
 * Hook that keeps track of the "playWhenReady" state
 * @returns Current playWhenReady state
 */
export function usePlayWhenReady(): boolean {
  const [playWhenReady, setPlayWhenReady] = useState<boolean>(false)
  const playbackState = usePlaybackState()

  useEffect(() => {
    if (playbackState === State.Playing) {
      setPlayWhenReady(true)
    } else if (playbackState === State.Paused || playbackState === State.Stopped) {
      setPlayWhenReady(false)
    }
  }, [playbackState])

  return playWhenReady
}

/**
 * Hook that keeps track of the currently active track
 * @returns Current active track or undefined
 */
export function useActiveTrack(): Track | undefined {
  const [activeTrack, setActiveTrack] = useState<Track | undefined>(undefined)

  useEffect(() => {
    const getInitialTrack = () => {
      try {
        const track = TrackPlayer.getActiveTrack()
        setActiveTrack(track)
      } catch {
        // Player might not be initialized yet
      }
    }

    getInitialTrack()
  }, [])

  const onTrackChange = useCallback((data: EventData) => {
    if (data.type === Event.PlaybackTrackChanged && data.nextTrack !== null) {
      try {
        const track = TrackPlayer.getTrack(data.nextTrack)
        setActiveTrack(track)
      } catch {
        // Track might not exist
      }
    }
  }, [])

  useTrackPlayerEvents([Event.PlaybackTrackChanged], onTrackChange)

  return activeTrack
}
