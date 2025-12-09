import { useCallback, useEffect, useState } from "react"

import {
  ChevronDown,
  ChevronUp,
  FastForward,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react"

import TrackPlayer, {
  Event,
  RepeatMode,
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
  type EqualizerPreset,
  type Track
} from "@track-player/web"

import localPureArtwork from "../assets/pure/artwork.jpg"
import localPureTrack from "../assets/pure/pure.m4a"

import localSnoozeArtwork from "../assets/snooze/artwork.jpg"
import localSnoozeTrack from "../assets/snooze/snooze.opus"

const tracks: Track[] = [
  {
    url: "https://rntp.dev/example/Longing.mp3",
    title: "Longing",
    artist: "David Chavez",
    artwork: "https://rntp.dev/example/Longing.jpeg",
    duration: 143
  },
  {
    url: "https://rntp.dev/example/Soul%20Searching.mp3",
    title: "Soul Searching (Demo)",
    artist: "David Chavez",
    artwork: "https://rntp.dev/example/Soul%20Searching.jpeg",
    duration: 77
  },
  {
    url: "https://rntp.dev/example/Lullaby%20(Demo).mp3",
    title: "Lullaby (Demo)",
    artist: "David Chavez",
    artwork: "https://rntp.dev/example/Lullaby%20(Demo).jpeg",
    duration: 71
  },
  {
    url: "https://rntp.dev/example/Rhythm%20City%20(Demo).mp3",
    title: "Rhythm City (Demo)",
    artist: "David Chavez",
    artwork: "https://rntp.dev/example/Rhythm%20City%20(Demo).jpeg",
    duration: 106
  },
  {
    url: "https://ais-sa5.cdnstream1.com/b75154_128mp3",
    title: "Smooth Jazz 24/7",
    artist: "New York, NY",
    artwork: "https://rntp.dev/example/smooth-jazz-24-7.jpeg",
    isLiveStream: true
  },
  {
    url: "https://traffic.libsyn.com/atpfm/atp545.mp3",
    title: "Chapters"
  },
  {
    url: localPureTrack,
    title: "Pure (Demo)",
    artist: "David Chavez",
    artwork: localPureArtwork,
    duration: 28
  },
  {
    url: localSnoozeTrack,
    title: "Snooze",
    album: "SOS",
    artist: "SZA",
    artwork: localSnoozeArtwork,
    duration: 202
  }
]

// Component to format time
const TimeDisplay = ({ seconds }: { seconds: number }) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return (
    <span className="text-xs text-gray-600">
      {mins}:{secs < 10 ? "0" : ""}
      {secs}
    </span>
  )
}

// Progress bar component
const ProgressBar = ({ isLive }: { isLive: boolean }) => {
  const { position, duration } = useProgress(100)

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    TrackPlayer.seekTo(newValue).catch(console.error)
  }, [])

  if (isLive) return null

  return (
    <div className="w-full mb-4">
      <input
        type="range"
        min="0"
        max={duration}
        value={position}
        step="0.1"
        onChange={handleSeek}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between mt-1">
        <TimeDisplay seconds={position} />
        <TimeDisplay seconds={duration} />
      </div>
    </div>
  )
}

// Volume control component
const VolumeControl = ({
  volume,
  setVolume
}: {
  volume: number
  setVolume: (vol: number) => void
}) => {
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      setVolume(val)
      TrackPlayer.setVolume(val).catch(console.error)
    },
    [setVolume]
  )

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      // Save current volume before muting
      localStorage.setItem("previousVolume", volume.toString())
      setVolume(0)
      TrackPlayer.setVolume(0).catch(console.error)
    } else {
      // Restore previous volume
      const prevVol = parseFloat(localStorage.getItem("previousVolume") || "0.5")
      setVolume(prevVol)
      TrackPlayer.setVolume(prevVol).catch(console.error)
    }
  }, [volume, setVolume])

  return (
    <div className="flex items-center gap-2">
      <button onClick={toggleMute} className="p-2 rounded-full hover:bg-gray-100">
        {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  )
}

// Playback speed control component
const PlaybackSpeedControl = ({ isLive }: { isLive: boolean }) => {
  const [playbackRate, setPlaybackRate] = useState(1)

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value)
    setPlaybackRate(rate)
    TrackPlayer.setRate(rate).catch(console.error)
  }, [])

  if (isLive) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Speed:</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">0.5x</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.25"
          value={playbackRate}
          onChange={handleRateChange}
          className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500">2x</span>
        <span className="text-sm font-medium text-gray-700 min-w-12 text-center">
          {playbackRate}x
        </span>
      </div>
    </div>
  )
}

// Repeat mode control component
const RepeatModeControl = ({
  repeatMode,
  setRepeatMode
}: {
  repeatMode: RepeatMode
  setRepeatMode: (mode: RepeatMode) => void
}) => {
  const cycleRepeatMode = useCallback(() => {
    let nextMode: RepeatMode

    switch (repeatMode) {
      case RepeatMode.Off:
        nextMode = RepeatMode.Track
        break
      case RepeatMode.Track:
        nextMode = RepeatMode.Queue
        break
      default:
        nextMode = RepeatMode.Off
    }

    TrackPlayer.setRepeatMode(nextMode)
      .then(() => setRepeatMode(nextMode))
      .catch(console.error)
  }, [repeatMode, setRepeatMode])

  return (
    <button
      onClick={cycleRepeatMode}
      className={`p-2 rounded-full hover:bg-gray-100 ${
        repeatMode !== RepeatMode.Off ? "text-blue-500" : ""
      }`}
    >
      {repeatMode === RepeatMode.Track ? <Repeat1 size={20} /> : <Repeat size={20} />}
    </button>
  )
}

// Track control buttons component
const PlaybackControls = () => {
  const playerState = usePlaybackState()

  const togglePlayPause = useCallback(async () => {
    try {
      if (playerState === State.Playing) {
        await TrackPlayer.pause()
      } else {
        await TrackPlayer.play()
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error)
    }
  }, [playerState])

  const isLoading = playerState === State.Buffering
  const isPlaying = playerState === State.Playing

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => TrackPlayer.skipToPrevious().catch(console.error)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <SkipBack size={24} />
      </button>
      <button
        onClick={() => TrackPlayer.seekBy(-10).catch(console.error)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <FastForward size={18} className="rotate-180" />
      </button>
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`p-4 rounded-full ${
          isPlaying ? "bg-red-500" : "bg-green-500"
        } hover:opacity-90 text-white flex items-center justify-center`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={24} />
        ) : (
          <Play size={24} />
        )}
      </button>
      <button
        onClick={() => TrackPlayer.seekBy(10).catch(console.error)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <FastForward size={18} />
      </button>
      <button
        onClick={() => TrackPlayer.skipToNext().catch(console.error)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <SkipForward size={24} />
      </button>
    </div>
  )
}

// Track info and artwork component
const NowPlaying = () => {
  const activeTrack = useActiveTrack()

  if (!activeTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No track selected</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {activeTrack.artwork && (
        <div className="w-full aspect-square mb-4 overflow-hidden rounded-lg">
          <img
            src={activeTrack.artwork}
            alt={activeTrack.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="text-center">
        <h2 className="text-xl font-bold">{activeTrack.title}</h2>
        <p className="text-gray-600">
          {activeTrack.album && <span>{activeTrack.album} - </span>}
          {activeTrack.artist}
        </p>
        {activeTrack.isLiveStream && (
          <span className="inline-block px-2 py-1 mt-2 text-xs font-medium text-red-600 bg-red-100 rounded-full">
            LIVE
          </span>
        )}
      </div>
    </div>
  )
}

// Equalizer UI component
const Equalizer = () => {
  const [enabled, setEnabled] = useState(() => TrackPlayer.isEqualizerEnabled())
  const [bands, setBands] = useState(() => TrackPlayer.getEqualizerBands())
  const [preset, setPreset] = useState("flat")

  // Update bands when changed
  useEffect(() => {
    setBands(TrackPlayer.getEqualizerBands())
  }, [enabled, preset])

  const handleEnable = useCallback(() => {
    TrackPlayer.setEqualizerEnabled(!enabled)
    setEnabled((prev) => !prev)
  }, [enabled])

  const handleBandChange = useCallback((idx: number, gain: number) => {
    TrackPlayer.setEqualizerBandGain(idx, gain)
    setBands(TrackPlayer.getEqualizerBands())
  }, [])

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setPreset(value)
    TrackPlayer.setEqualizerPreset(value as EqualizerPreset)
    setBands(TrackPlayer.getEqualizerBands())
  }, [])

  const handleReset = useCallback(() => {
    TrackPlayer.resetEqualizer()
    setBands(TrackPlayer.getEqualizerBands())
    setPreset("flat")
  }, [])

  const presets = [
    "flat",
    "rock",
    "pop",
    "jazz",
    "classical",
    "electronic",
    "vocal",
    "bass",
    "treble"
  ]

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
      <div className="flex items-center gap-4 mb-2">
        <label className="font-semibold">Equalizer</label>
        <button
          onClick={handleEnable}
          className={`px-3 py-1 rounded ${
            enabled ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"
          }`}
        >
          {enabled ? "On" : "Off"}
        </button>
        <select value={preset} onChange={handlePresetChange} className="ml-2 p-1 rounded border">
          {presets.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleReset}
          className="ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          Reset
        </button>
      </div>
      <div className="flex items-end gap-2 mt-4">
        {bands.map((band, idx) => (
          <div key={band.frequency} className="flex flex-col items-center">
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={band.gain}
              disabled={!enabled}
              onChange={(e) => handleBandChange(idx, Number(e.target.value))}
              className="h-24 w-2"
              style={{ writingMode: "horizontal-tb", WebkitAppearance: "slider-vertical" }}
            />
            <span className="text-xs mt-1">{band.frequency}Hz</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Queue item component
type QueueItemProps = {
  track: Track
  isActive: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onPlay: () => void
}

const QueueItem = ({ track, isActive, onMoveUp, onMoveDown, onPlay }: QueueItemProps) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isActive ? "bg-blue-100" : "bg-gray-100"
      } mb-2`}
    >
      <div className="flex items-center gap-3">
        {track.artwork && (
          <img src={track.artwork} alt={track.title} className="object-cover w-12 h-12 rounded" />
        )}
        <div>
          <p className="font-medium">{track.title}</p>
          {track.artist && <p className="text-sm text-gray-600">{track.artist}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onMoveUp} className="p-1 text-gray-600 rounded hover:bg-gray-200">
          <ChevronUp size={16} />
        </button>
        <button onClick={onMoveDown} className="p-1 text-gray-600 rounded hover:bg-gray-200">
          <ChevronDown size={16} />
        </button>
        <button
          onClick={onPlay}
          className="px-2 py-1 ml-2 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Play
        </button>
      </div>
    </div>
  )
}

// Queue management component
const QueueManager = () => {
  const [queue, setQueue] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)

  // Listen to track change events
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged) {
      const index = TrackPlayer.getActiveTrackIndex()
      setCurrentTrackIndex(index)
    }
  })

  // Initial load of queue
  useEffect(() => {
    const loadQueue = async () => {
      const currentQueue = TrackPlayer.getQueue()
      setQueue(currentQueue)

      const index = TrackPlayer.getActiveTrackIndex()
      setCurrentTrackIndex(index)
    }

    loadQueue().catch(console.error)
  }, [])

  const moveTrack = async (fromIndex: number, toIndex: number) => {
    try {
      await TrackPlayer.move(fromIndex, toIndex)
      const updatedQueue = TrackPlayer.getQueue()
      setQueue(updatedQueue)
    } catch (error) {
      console.error("Failed to move track:", error)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">Queue</h2>
      <div className="max-h-80 overflow-y-auto">
        {queue.map((track, index) => (
          <QueueItem
            key={index}
            track={track}
            isActive={currentTrackIndex === index}
            onMoveUp={() => moveTrack(index, Math.max(0, index - 1))}
            onMoveDown={() => moveTrack(index, Math.min(queue.length - 1, index + 1))}
            onPlay={() => TrackPlayer.skip(index).catch(console.error)}
          />
        ))}
      </div>
    </div>
  )
}

// Player container - only shows player UI when ready
const PlayerReady = ({ children }: { children: React.ReactNode }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Initialize player
  useEffect(() => {
    let isMounted = true

    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({
          updateInterval: 0.1,
          useMediaSession: true
        })

        await TrackPlayer.add(tracks)
        await TrackPlayer.setVolume(0.5)

        if (isMounted) {
          setIsPlayerReady(true)
        }
      } catch (error) {
        console.error("Failed to setup player:", error)
      }
    }

    setupPlayer()

    // Cleanup on unmount
    return () => {
      isMounted = false
      TrackPlayer.destroy().catch(console.error)
    }
  }, [])

  if (!isPlayerReady) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p className="ml-4 text-lg">Loading player...</p>
      </div>
    )
  }

  return <>{children}</>
}

// Player UI that is rendered only when the player is ready
const PlayerUI = () => {
  const [volume, setVolume] = useState(0.5)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off)

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-center">@track-player/web</h1>
        <NowPlaying />
        <ProgressBar isLive={useActiveTrack()?.isLiveStream || false} />
        <div className="mb-4">
          <PlaybackControls />
        </div>
        <div className="flex items-center justify-between mb-6">
          <VolumeControl volume={volume} setVolume={setVolume} />
          <PlaybackSpeedControl isLive={useActiveTrack()?.isLiveStream || false} />
          <RepeatModeControl repeatMode={repeatMode} setRepeatMode={setRepeatMode} />
        </div>
        <Equalizer />
        <QueueManager />
        <div className="p-3 mt-6 text-sm text-gray-600 bg-gray-100 rounded-lg">
          <p>
            <strong>Player state:</strong> <span className="font-mono">{usePlaybackState()}</span>
          </p>
          <p>
            <strong>Repeat mode:</strong> <span className="font-mono">{repeatMode}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Main app component
function App() {
  return (
    <PlayerReady>
      <PlayerUI />
    </PlayerReady>
  )
}

export default App
