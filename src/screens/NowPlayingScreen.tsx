import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
  Animated, Easing, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundView } from '../components/common/BackgroundView';
import { useApp } from '../context/AppContext';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../utils/colors';

const TRACKS = [
  { title: 'Lo-fi Study Beats', artist: 'Amazon Music', album: 'Chill Vibes', duration: 213 },
  { title: 'Top Hits 2024', artist: 'Prime Music', album: 'Now Playing', duration: 187 },
  { title: 'Focus Flow', artist: 'Spotify', album: 'Deep Focus', duration: 244 },
];

interface NowPlayingProps {
  asModal?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export function NowPlayingScreen({ asModal, visible, onClose }: NowPlayingProps = {}) {
  if (asModal) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <NowPlayingContent onClose={onClose} />
      </Modal>
    );
  }
  return <NowPlayingContent />;
}

function NowPlayingContent({ onClose }: { onClose?: () => void }) {
  const { sendCommand, sendAlexaText, isConnected } = useApp();
  const haptics = useHaptics();
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(42);
  const [volume, setVolume] = useState(60);
  const [shuffled, setShuffled] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  const track = TRACKS[trackIdx % TRACKS.length];

  useEffect(() => {
    if (playing) {
      spinRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinRef.current.start();
    } else {
      spinRef.current?.stop();
    }
    return () => spinRef.current?.stop();
  }, [playing, spinAnim]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= track.duration) {
          setTrackIdx(i => i + 1);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, track.duration]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pct = Math.min(progress / track.duration, 1);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const togglePlay = async () => {
    haptics.medium();
    setPlaying(p => !p);
    await sendCommand('play_pause');
  };

  const next = async () => {
    haptics.light();
    setTrackIdx(i => i + 1);
    setProgress(0);
    await sendCommand('fast_forward');
  };

  const prev = async () => {
    haptics.light();
    if (progress > 5) { setProgress(0); return; }
    setTrackIdx(i => Math.max(0, i - 1));
    setProgress(0);
    await sendCommand('rewind');
  };

  const adjustVolume = async (delta: number) => {
    haptics.light();
    setVolume(v => Math.min(100, Math.max(0, v + delta)));
    await sendCommand(delta > 0 ? 'volume_up' : 'volume_down');
  };

  const QUICK_COMMANDS = [
    { label: 'Play music', icon: 'music', cmd: 'Play music' },
    { label: 'Next song', icon: 'skip-next', cmd: 'Next song' },
    { label: 'Pause', icon: 'pause-circle', cmd: 'Pause music' },
    { label: 'Shuffle', icon: 'shuffle', cmd: 'Shuffle my music' },
    { label: 'Volume up', icon: 'volume-high', cmd: 'Volume up' },
    { label: 'Mute', icon: 'volume-mute', cmd: 'Mute' },
  ];

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>

        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons name="music-circle" size={20} color={Colors.alexaBlue} />
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={[styles.dot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} />
        </View>

        <View style={styles.content}>

          {/* Vinyl disc */}
          <View style={styles.artContainer}>
            <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
              <LinearGradient
                colors={['#1A2535', '#232F3E', '#0D1521']}
                style={styles.discGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.discCenter} />
              </LinearGradient>
            </Animated.View>
            {!playing && (
              <View style={styles.pausedOverlay}>
                <MaterialCommunityIcons name="pause" size={32} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </View>

          {/* Track info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.trackArtist}>{track.artist}</Text>
            <Text style={styles.trackAlbum}>{track.album}</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${pct * 100}%` as unknown as number }]} />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.timeText}>{fmt(progress)}</Text>
              <Text style={styles.timeText}>{fmt(track.duration)}</Text>
            </View>
          </View>

          {/* Main controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => { haptics.light(); setShuffled(s => !s); }}
              style={styles.sideBtn}
            >
              <MaterialCommunityIcons
                name="shuffle" size={22}
                color={shuffled ? Colors.alexaBlue : Colors.gray}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={prev} style={styles.controlBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="skip-previous" size={36} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlay} style={styles.playBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={playing ? ['#00CAFF', '#0095C5'] : ['#FF9900', '#CC7700']}
                style={StyleSheet.absoluteFill}
                borderRadius={36}
              />
              <MaterialCommunityIcons
                name={playing ? 'pause' : 'play'}
                size={38} color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={next} style={styles.controlBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="skip-next" size={36} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { haptics.light(); setRepeat(r => !r); }}
              style={styles.sideBtn}
            >
              <MaterialCommunityIcons
                name={repeat ? 'repeat-once' : 'repeat'}
                size={22}
                color={repeat ? Colors.alexaBlue : Colors.gray}
              />
            </TouchableOpacity>
          </View>

          {/* Volume */}
          <View style={styles.volumeRow}>
            <TouchableOpacity onPress={() => adjustVolume(-10)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="volume-low" size={22} color={Colors.gray} />
            </TouchableOpacity>
            <View style={styles.volumeBar}>
              <View style={[styles.volumeFill, { width: `${volume}%` }]} />
            </View>
            <TouchableOpacity onPress={() => adjustVolume(10)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="volume-high" size={22} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          {/* Alexa quick commands */}
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>Ask Alexa</Text>
            <View style={styles.quickGrid}>
              {QUICK_COMMANDS.map(q => (
                <TouchableOpacity
                  key={q.cmd}
                  onPress={() => { haptics.light(); sendAlexaText(q.cmd); }}
                  style={styles.quickBtn}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={q.icon as never} size={16} color={Colors.alexaBlue} />
                  <Text style={styles.quickBtnText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  backBtn: { padding: 4, marginRight: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  content: {
    flex: 1, paddingHorizontal: 20, paddingBottom: 16, gap: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  artContainer: {
    width: 160, height: 160, alignItems: 'center', justifyContent: 'center',
  },
  disc: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden' },
  discGrad: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 80,
  },
  discCenter: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.amazonDark,
    borderWidth: 2, borderColor: Colors.alexaBlue,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
  },

  trackInfo: { alignItems: 'center', gap: 4, width: '100%' },
  trackTitle: { color: Colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  trackArtist: { color: Colors.alexaBlue, fontSize: 14, fontWeight: '600' },
  trackAlbum: { color: Colors.gray, fontSize: 12 },

  progressSection: { width: '100%', gap: 6 },
  progressBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'visible',
  },
  progressFill: { height: 4, backgroundColor: Colors.alexaBlue, borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -4, width: 12, height: 12,
    borderRadius: 6, backgroundColor: Colors.white, marginLeft: -6,
  },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: Colors.gray, fontSize: 11 },

  controls: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    justifyContent: 'center',
  },
  sideBtn: { padding: 8 },
  controlBtn: { padding: 8 },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },

  volumeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
  },
  volumeBar: {
    flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  volumeFill: { height: 4, backgroundColor: Colors.amazonOrange, borderRadius: 2 },

  quickSection: { width: '100%', gap: 8 },
  quickLabel: {
    color: Colors.gray, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.amazonNavy, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnText: { color: Colors.lightGray, fontSize: 12, fontWeight: '600' },
});
