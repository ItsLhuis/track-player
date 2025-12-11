import { Ionicons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import { Image } from "expo-image"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  ImageSourcePropType,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"

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
} from "@track-player/native"

import localPureTrack from "../../assets/pure/pure.m4a"

import localSnoozeTrack from "../../assets/snooze/snooze.opus"

import PureArtwork from "../../assets/pure/artwork.jpg"
import SnoozeArtwork from "../../assets/snooze/artwork.jpg"

// Helper to resolve local image assets to URI strings
const resolveImageAsset = (asset: ImageSourcePropType): string => {
  const resolved = RNImage.resolveAssetSource(asset)
  return resolved?.uri ?? ""
}

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
    artwork: resolveImageAsset(PureArtwork),
    duration: 28
  },
  {
    url: localSnoozeTrack,
    title: "Snooze",
    album: "SOS",
    artist: "SZA",
    artwork: resolveImageAsset(SnoozeArtwork),
    duration: 202
  }
]

// Format time helper
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

// Progress bar component
const ProgressBar = ({ isLive }: { isLive: boolean }) => {
  const { position, duration } = useProgress(100)

  const handleSeek = useCallback((value: number) => {
    TrackPlayer.seekTo(value).catch(console.error)
  }, [])

  if (isLive) return null

  return (
    <View style={styles.progressContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#3b82f6"
        maximumTrackTintColor="#d1d5db"
        thumbTintColor="#3b82f6"
      />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
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
    (val: number) => {
      setVolume(val)
      TrackPlayer.setVolume(val).catch(console.error)
    },
    [setVolume]
  )

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setVolume(0)
      TrackPlayer.setVolume(0).catch(console.error)
    } else {
      setVolume(0.5)
      TrackPlayer.setVolume(0.5).catch(console.error)
    }
  }, [volume, setVolume])

  return (
    <View style={styles.volumeContainer}>
      <Pressable onPress={toggleMute} style={styles.iconButton}>
        <Ionicons name={volume === 0 ? "volume-mute" : "volume-high"} size={20} color="#374151" />
      </Pressable>
      <Slider
        style={styles.volumeSlider}
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={handleVolumeChange}
        minimumTrackTintColor="#3b82f6"
        maximumTrackTintColor="#d1d5db"
        thumbTintColor="#3b82f6"
      />
    </View>
  )
}

// Playback speed control component
const PlaybackSpeedControl = ({ isLive }: { isLive: boolean }) => {
  const [playbackRate, setPlaybackRate] = useState(1)

  const handleRateChange = useCallback((rate: number) => {
    const roundedRate = Math.round(rate * 4) / 4
    setPlaybackRate(roundedRate)
    TrackPlayer.setRate(roundedRate).catch(console.error)
  }, [])

  if (isLive) return null

  return (
    <View style={styles.speedContainer}>
      <Text style={styles.labelText}>Speed:</Text>
      <Text style={styles.smallText}>0.5x</Text>
      <Slider
        style={styles.speedSlider}
        minimumValue={0.5}
        maximumValue={2}
        value={playbackRate}
        onSlidingComplete={handleRateChange}
        minimumTrackTintColor="#3b82f6"
        maximumTrackTintColor="#d1d5db"
        thumbTintColor="#3b82f6"
      />
      <Text style={styles.smallText}>2x</Text>
      <Text style={styles.speedValue}>{playbackRate}x</Text>
    </View>
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
    <Pressable
      onPress={cycleRepeatMode}
      style={[styles.iconButton, repeatMode !== RepeatMode.Off && styles.activeButton]}
    >
      <Ionicons
        name={repeatMode === RepeatMode.Track ? "repeat" : "repeat"}
        size={20}
        color={repeatMode !== RepeatMode.Off ? "#3b82f6" : "#374151"}
      />
      {repeatMode === RepeatMode.Track && <Text style={styles.repeatOneIndicator}>1</Text>}
    </Pressable>
  )
}

// Playback controls component
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
    <View style={styles.controlsContainer}>
      <Pressable
        onPress={() => TrackPlayer.skipToPrevious().catch(console.error)}
        style={styles.iconButton}
      >
        <Ionicons name="play-skip-back" size={24} color="#374151" />
      </Pressable>
      <Pressable
        onPress={() => TrackPlayer.seekBy(-10).catch(console.error)}
        style={styles.iconButton}
      >
        <Ionicons name="play-back" size={18} color="#374151" />
      </Pressable>
      <Pressable
        onPress={togglePlayPause}
        disabled={isLoading}
        style={[styles.playButton, isPlaying ? styles.playButtonPause : styles.playButtonPlay]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
        )}
      </Pressable>
      <Pressable
        onPress={() => TrackPlayer.seekBy(10).catch(console.error)}
        style={styles.iconButton}
      >
        <Ionicons name="play-forward" size={18} color="#374151" />
      </Pressable>
      <Pressable
        onPress={() => TrackPlayer.skipToNext().catch(console.error)}
        style={styles.iconButton}
      >
        <Ionicons name="play-skip-forward" size={24} color="#374151" />
      </Pressable>
    </View>
  )
}

// Now playing component
const NowPlaying = () => {
  const activeTrack = useActiveTrack()

  if (!activeTrack) {
    return (
      <View style={styles.noTrackContainer}>
        <Text style={styles.noTrackText}>No track selected</Text>
      </View>
    )
  }

  return (
    <View style={styles.nowPlayingContainer}>
      {activeTrack.artwork && (
        <View style={styles.artworkContainer}>
          <Image source={{ uri: activeTrack.artwork }} style={styles.artwork} contentFit="cover" />
        </View>
      )}
      <View style={styles.trackInfoContainer}>
        <Text style={styles.trackTitle}>{activeTrack.title}</Text>
        <Text style={styles.trackArtist}>
          {activeTrack.album && `${activeTrack.album} - `}
          {activeTrack.artist}
        </Text>
        {activeTrack.isLiveStream && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// Equalizer component
const Equalizer = () => {
  const [enabled, setEnabled] = useState(() => TrackPlayer.isEqualizerEnabled())
  const [bands, setBands] = useState(() => TrackPlayer.getEqualizerBands())
  const [preset, setPreset] = useState("flat")

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

  const handlePresetChange = useCallback((presetName: string) => {
    setPreset(presetName)
    TrackPlayer.setEqualizerPreset(presetName as EqualizerPreset)
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
    <View style={styles.equalizerContainer}>
      <View style={styles.equalizerHeader}>
        <Text style={styles.equalizerTitle}>Equalizer</Text>
        <Pressable
          onPress={handleEnable}
          style={[styles.toggleButton, enabled ? styles.toggleButtonOn : styles.toggleButtonOff]}
        >
          <Text style={styles.toggleButtonText}>{enabled ? "On" : "Off"}</Text>
        </Pressable>
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
        {presets.map((p) => (
          <Pressable
            key={p}
            onPress={() => handlePresetChange(p)}
            style={[styles.presetButton, preset === p && styles.presetButtonActive]}
          >
            <Text style={[styles.presetButtonText, preset === p && styles.presetButtonTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bandsContainer}>
        {bands.map((band, idx) => (
          <View key={band.frequency} style={styles.bandContainer}>
            <Slider
              style={styles.bandSlider}
              minimumValue={-12}
              maximumValue={12}
              value={band.gain}
              disabled={!enabled}
              onSlidingComplete={(value) => handleBandChange(idx, value)}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor={enabled ? "#3b82f6" : "#9ca3af"}
            />
            <Text style={styles.bandFrequency}>{band.frequency}Hz</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// Queue item component
const QueueItem = ({
  track,
  isActive,
  onMoveUp,
  onMoveDown,
  onPlay
}: {
  track: Track
  isActive: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onPlay: () => void
}) => {
  return (
    <View style={[styles.queueItem, isActive && styles.queueItemActive]}>
      <View style={styles.queueItemLeft}>
        {track.artwork && (
          <Image
            source={{ uri: track.artwork }}
            style={styles.queueItemArtwork}
            contentFit="cover"
          />
        )}
        <View style={styles.queueItemInfo}>
          <Text style={styles.queueItemTitle} numberOfLines={1}>
            {track.title}
          </Text>
          {track.artist && (
            <Text style={styles.queueItemArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.queueItemActions}>
        <Pressable onPress={onMoveUp} style={styles.queueActionButton}>
          <Ionicons name="chevron-up" size={16} color="#6b7280" />
        </Pressable>
        <Pressable onPress={onMoveDown} style={styles.queueActionButton}>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </Pressable>
        <Pressable onPress={onPlay} style={styles.queuePlayButton}>
          <Text style={styles.queuePlayButtonText}>Play</Text>
        </Pressable>
      </View>
    </View>
  )
}

// Queue manager component
const QueueManager = () => {
  const [queue, setQueue] = useState<Track[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged) {
      const index = TrackPlayer.getActiveTrackIndex()
      setCurrentTrackIndex(index)
    }
  })

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
    <View style={styles.queueContainer}>
      <Text style={styles.queueTitle}>Queue</Text>
      <View>
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
      </View>
    </View>
  )
}

// Player ready wrapper component
const PlayerReady = ({ children }: { children: React.ReactNode }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({
          updateInterval: 0.1,
          useLockScreenControls: true
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

    return () => {
      isMounted = false
      TrackPlayer.destroy().catch(console.error)
    }
  }, [])

  if (!isPlayerReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading player...</Text>
      </View>
    )
  }

  return <>{children}</>
}

// Player UI component
const PlayerUI = () => {
  const [volume, setVolume] = useState(0.5)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off)
  const playerState = usePlaybackState()
  const activeTrack = useActiveTrack()

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.playerContainer}>
        <Text style={styles.headerTitle}>@track-player/native</Text>
        <NowPlaying />
        <ProgressBar isLive={activeTrack?.isLiveStream || false} />
        <PlaybackControls />
        <View style={styles.secondaryControls}>
          <VolumeControl volume={volume} setVolume={setVolume} />
          <RepeatModeControl repeatMode={repeatMode} setRepeatMode={setRepeatMode} />
        </View>
        <PlaybackSpeedControl isLive={activeTrack?.isLiveStream || false} />
        <Equalizer />
        <QueueManager />
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>
            <Text style={styles.stateLabel}>Player state: </Text>
            {playerState}
          </Text>
          <Text style={styles.stateText}>
            <Text style={styles.stateLabel}>Repeat mode: </Text>
            {repeatMode}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

// Main component
export default function TrackPlayerExample() {
  return (
    <PlayerReady>
      <PlayerUI />
    </PlayerReady>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f9fafb"
  },
  scrollContent: {
    padding: 16
  },
  playerContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280"
  },
  // Now Playing styles
  nowPlayingContainer: {
    marginBottom: 16
  },
  noTrackContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12
  },
  noTrackText: {
    color: "#6b7280"
  },
  artworkContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden"
  },
  artwork: {
    width: "100%",
    height: "100%"
  },
  trackInfoContainer: {
    alignItems: "center"
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center"
  },
  trackArtist: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center"
  },
  liveBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fee2e2",
    borderRadius: 12
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626"
  },
  // Progress styles
  progressContainer: {
    marginBottom: 16
  },
  slider: {
    width: "100%",
    height: 40
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280"
  },
  // Controls styles
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 16
  },
  iconButton: {
    padding: 8,
    borderRadius: 20
  },
  activeButton: {
    backgroundColor: "#eff6ff"
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  playButtonPlay: {
    backgroundColor: "#22c55e"
  },
  playButtonPause: {
    backgroundColor: "#ef4444"
  },
  // Volume styles
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  volumeSlider: {
    flex: 1,
    height: 40
  },
  // Secondary controls
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  repeatOneIndicator: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "bold",
    color: "#3b82f6"
  },
  // Speed styles
  speedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8
  },
  labelText: {
    fontSize: 14,
    color: "#374151"
  },
  smallText: {
    fontSize: 12,
    color: "#6b7280"
  },
  speedSlider: {
    flex: 1,
    height: 40
  },
  speedValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    minWidth: 40,
    textAlign: "center"
  },
  // Equalizer styles
  equalizerContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  equalizerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  equalizerTitle: {
    fontSize: 16,
    fontWeight: "600"
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  toggleButtonOn: {
    backgroundColor: "#3b82f6"
  },
  toggleButtonOff: {
    backgroundColor: "#d1d5db"
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "600"
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 6
  },
  resetButtonText: {
    fontSize: 12,
    color: "#374151"
  },
  presetsContainer: {
    marginBottom: 12
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginRight: 8
  },
  presetButtonActive: {
    backgroundColor: "#3b82f6"
  },
  presetButtonText: {
    fontSize: 12,
    color: "#374151"
  },
  presetButtonTextActive: {
    color: "#fff"
  },
  bandsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  bandContainer: {
    flex: 1,
    alignItems: "center"
  },
  bandSlider: {
    width: 40,
    height: 100,
    transform: [{ rotate: "-90deg" }]
  },
  bandFrequency: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4
  },
  // Queue styles
  queueContainer: {
    marginBottom: 16
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12
  },
  queueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 8
  },
  queueItemActive: {
    backgroundColor: "#dbeafe"
  },
  queueItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  queueItemArtwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12
  },
  queueItemInfo: {
    flex: 1
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: "600"
  },
  queueItemArtist: {
    fontSize: 12,
    color: "#6b7280"
  },
  queueItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  queueActionButton: {
    padding: 4
  },
  queuePlayButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    marginLeft: 8
  },
  queuePlayButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600"
  },
  // State display styles
  stateContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12
  },
  stateText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "monospace"
  },
  stateLabel: {
    fontWeight: "600"
  }
})
