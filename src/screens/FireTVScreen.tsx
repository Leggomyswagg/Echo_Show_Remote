import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundView } from '../components/common/BackgroundView';
import { DPad } from '../components/remote/DPad';
import { MediaControls } from '../components/remote/MediaControls';
import { VolumeControls } from '../components/remote/VolumeControls';
import { AlexaCommandModal } from '../components/alexa/AlexaCommandModal';
import { DeviceDiscoveryModal } from '../components/common/DeviceDiscoveryModal';
import { PremiumGate } from '../components/premium/PremiumGate';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../utils/colors';

const FIRE_APPS = [
  { id: 'prime_video', label: 'Prime', icon: 'play-circle', color: '#00A8E1' },
  { id: 'netflix', label: 'Netflix', icon: 'netflix', color: '#E50914' },
  { id: 'disney_plus', label: 'Disney+', icon: 'disney', color: '#1136A3' },
  { id: 'hulu', label: 'Hulu', icon: 'television-play', color: '#1CE783' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', color: '#FF0000' },
  { id: 'amazon_music', label: 'Music', icon: 'music-circle', color: '#25D1DA' },
  { id: 'twitch', label: 'Twitch', icon: 'twitch', color: '#9146FF' },
  { id: 'spotify', label: 'Spotify', icon: 'spotify', color: '#1DB954' },
];

const NAV_BUTTONS = [
  { cmd: 'home' as const, icon: 'home', label: 'Home', color: Colors.alexaBlue },
  { cmd: 'back' as const, icon: 'arrow-left', label: 'Back', color: Colors.white },
  { cmd: 'menu' as const, icon: 'menu', label: 'Menu', color: Colors.white },
  { cmd: 'settings' as const, icon: 'cog', label: 'Settings', color: Colors.gray },
];

export function FireTVScreen() {
  const { sendCommand, isConnected } = useApp();
  const { isPremium } = usePremium();
  const haptics = useHaptics();
  const [alexaVisible, setAlexaVisible] = useState(false);
  const [connectVisible, setConnectVisible] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);

  if (!isPremium) {
    return (
      <BackgroundView style={styles.bg}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.lockedCenter}>
            <LinearGradient colors={['#1A0A35', '#0D0020']} style={styles.lockedCard}>
              <MaterialCommunityIcons name="television-play" size={52} color="#AA44FF" />
              <Text style={styles.lockedTitle}>Fire TV Remote</Text>
              <Text style={styles.lockedDesc}>
                Control your Fire TV Stick or Fire TV Cube with a dedicated optimized remote layout.
              </Text>
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={() => setGateVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="crown" size={16} color="#fff" />
                <Text style={styles.unlockBtnText}>Unlock with Premium</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </SafeAreaView>
        <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} featureName="Fire TV Remote" />
      </BackgroundView>
    );
  }

  const press = async (cmd: Parameters<typeof sendCommand>[0]) => {
    haptics.light();
    await sendCommand(cmd);
  };

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="television-play" size={20} color="#AA44FF" />
            <Text style={styles.headerTitle}>Fire TV</Text>
            <View style={[styles.dot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} />
          </View>
          <TouchableOpacity onPress={() => setConnectVisible(true)} style={styles.connectBtn}>
            <MaterialCommunityIcons
              name={isConnected ? 'wifi-check' : 'wifi-alert'}
              size={16}
              color={isConnected ? Colors.green : Colors.amazonOrange}
            />
            <Text style={[styles.connectText, { color: isConnected ? Colors.green : Colors.amazonOrange }]}>
              {isConnected ? 'Connected' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* App Row */}
          <View style={styles.appsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.appsRow}>
                {FIRE_APPS.map(app => (
                  <TouchableOpacity
                    key={app.id}
                    onPress={() => press(app.id as Parameters<typeof sendCommand>[0])}
                    style={[styles.appBtn, { borderColor: `${app.color}44` }]}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name={app.icon as never} size={22} color={app.color} />
                    <Text style={styles.appLabel}>{app.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Main remote area */}
          <View style={styles.remoteCore}>
            {/* D-Pad */}
            <DPad size={200} />

            {/* Nav buttons below dpad */}
            <View style={styles.navRow}>
              {NAV_BUTTONS.map(b => (
                <TouchableOpacity
                  key={b.cmd}
                  onPress={() => press(b.cmd)}
                  style={styles.navBtn}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={b.icon as never} size={22} color={b.color} />
                  <Text style={styles.navLabel}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Volume + Media */}
          <View style={styles.controlsRow}>
            <VolumeControls />
            <View style={styles.divider} />
            <MediaControls />
          </View>

          {/* Alexa Button */}
          <TouchableOpacity
            onPress={() => setAlexaVisible(true)}
            style={styles.alexaBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#004080', '#00CAFF']}
              style={StyleSheet.absoluteFill}
              borderRadius={20}
            />
            <MaterialCommunityIcons name="microphone" size={22} color="#fff" />
            <Text style={styles.alexaBtnText}>Ask Alexa (Text)</Text>
          </TouchableOpacity>

          {/* Fire TV specific shortcuts */}
          <View style={styles.shortcuts}>
            <Text style={styles.sectionLabel}>Quick Actions</Text>
            <View style={styles.shortcutGrid}>
              {[
                { label: 'Live TV', icon: 'broadcast', cmd: 'smart_home' as const },
                { label: 'Search', icon: 'magnify', cmd: 'settings' as const },
                { label: 'My Stuff', icon: 'bookmark', cmd: 'menu' as const },
                { label: 'Rewind 10s', icon: 'rewind-10', cmd: 'rewind' as const },
                { label: 'Skip 10s', icon: 'fast-forward-10', cmd: 'fast_forward' as const },
                { label: 'Screenshot', icon: 'camera', cmd: 'camera' as const },
              ].map(s => (
                <TouchableOpacity
                  key={s.label}
                  onPress={() => press(s.cmd)}
                  style={styles.shortcutBtn}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={s.icon as never} size={20} color={Colors.alexaBlue} />
                  <Text style={styles.shortcutLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      <AlexaCommandModal visible={alexaVisible} onClose={() => setAlexaVisible(false)} />
      <DeviceDiscoveryModal visible={connectVisible} onClose={() => setConnectVisible(false)} />
    </BackgroundView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.amazonNavy, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
  },
  connectText: { fontSize: 12, fontWeight: '600' },

  content: { paddingHorizontal: 16, gap: 20, alignItems: 'center', paddingBottom: 20 },

  appsSection: { width: '100%' },
  appsRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  appBtn: {
    alignItems: 'center', gap: 4, padding: 12,
    backgroundColor: Colors.amazonNavy, borderRadius: 14,
    borderWidth: 1, minWidth: 64,
  },
  appLabel: { color: Colors.lightGray, fontSize: 10, fontWeight: '600' },

  remoteCore: { alignItems: 'center', gap: 16 },
  navRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  navBtn: {
    alignItems: 'center', gap: 4, padding: 12,
    backgroundColor: Colors.amazonNavy, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, minWidth: 64,
  },
  navLabel: { color: Colors.gray, fontSize: 10, fontWeight: '600' },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.amazonNavy, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, width: '100%',
    justifyContent: 'center',
  },
  divider: { width: 1, height: 48, backgroundColor: Colors.border },

  alexaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, borderRadius: 20, paddingHorizontal: 24,
    overflow: 'hidden', width: '100%', justifyContent: 'center',
  },
  alexaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  shortcuts: { width: '100%', gap: 10 },
  sectionLabel: {
    color: Colors.gray, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  shortcutGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  shortcutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.amazonNavy, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, width: '47%',
  },
  shortcutLabel: { color: Colors.lightGray, fontSize: 12, fontWeight: '600', flex: 1 },

  // Locked state
  lockedCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedCard: {
    borderRadius: 24, padding: 32, alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#AA44FF44',
  },
  lockedTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  lockedDesc: {
    color: Colors.gray, fontSize: 14, textAlign: 'center', lineHeight: 20,
  },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#AA44FF', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  unlockBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
