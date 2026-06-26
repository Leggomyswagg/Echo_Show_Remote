import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Switch, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundView } from '../components/common/BackgroundView';
import { AlexaCommandModal } from '../components/alexa/AlexaCommandModal';
import { PremiumGate } from '../components/premium/PremiumGate';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useHaptics } from '../hooks/useHaptics';
import { Colors } from '../utils/colors';

interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'plug' | 'lock' | 'camera' | 'speaker';
  room: string;
  on: boolean;
  value?: string;
}

const INITIAL_DEVICES: Device[] = [
  { id: 'd1', name: 'Living Room Light', type: 'light', room: 'Living Room', on: true, value: '80%' },
  { id: 'd2', name: 'Kitchen Light', type: 'light', room: 'Kitchen', on: false },
  { id: 'd3', name: 'Bedroom Light', type: 'light', room: 'Bedroom', on: false },
  { id: 'd4', name: 'Thermostat', type: 'thermostat', room: 'Main', on: true, value: '72°F' },
  { id: 'd5', name: 'TV Plug', type: 'plug', room: 'Living Room', on: true },
  { id: 'd6', name: 'Front Door Lock', type: 'lock', room: 'Entrance', on: true },
  { id: 'd7', name: 'Porch Camera', type: 'camera', room: 'Exterior', on: true },
  { id: 'd8', name: 'Echo Show', type: 'speaker', room: 'Kitchen', on: true },
];

const DEVICE_ICONS: Record<Device['type'], string> = {
  light: 'lightbulb', thermostat: 'thermometer', plug: 'power-plug',
  lock: 'lock', camera: 'cctv', speaker: 'speaker-wireless',
};

const DEVICE_COLORS: Record<Device['type'], string> = {
  light: '#FFD700', thermostat: '#FF6B35', plug: '#00CAFF',
  lock: '#AA44FF', camera: '#1DB954', speaker: '#FF9900',
};

const ROUTINES = [
  { id: 'r1', name: 'Good Morning', icon: 'weather-sunny', color: '#FFB300', cmd: 'Good morning' },
  { id: 'r2', name: 'Movie Night', icon: 'movie', color: '#AA44FF', cmd: 'Movie night mode' },
  { id: 'r3', name: 'Bedtime', icon: 'weather-night', color: '#4488FF', cmd: 'Bedtime mode' },
  { id: 'r4', name: 'Away Mode', icon: 'home-export-outline', color: '#FF6B35', cmd: 'Leaving home' },
  { id: 'r5', name: 'Party Mode', icon: 'party-popper', color: '#FF4466', cmd: 'Party mode' },
  { id: 'r6', name: 'Work Focus', icon: 'briefcase', color: '#1DB954', cmd: 'Focus mode' },
];

export function SmartHomeScreen() {
  const { sendAlexaText, isConnected } = useApp();
  const { isPremium } = usePremium();
  const haptics = useHaptics();
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [alexaVisible, setAlexaVisible] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | Device['type']>('all');

  if (!isPremium) {
    return (
      <BackgroundView style={styles.bg}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.lockedCenter}>
            <LinearGradient colors={['#001A0D', '#003320']} style={styles.lockedCard}>
              <MaterialCommunityIcons name="home-automation" size={52} color="#00E676" />
              <Text style={styles.lockedTitle}>Smart Home Dashboard</Text>
              <Text style={styles.lockedDesc}>
                Control lights, thermostat, locks, cameras, and run Alexa routines from one dashboard.
              </Text>
              <TouchableOpacity
                style={[styles.unlockBtn, { backgroundColor: '#00E676' }]}
                onPress={() => setGateVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="crown" size={16} color="#001A0D" />
                <Text style={[styles.unlockBtnText, { color: '#001A0D' }]}>Unlock with Premium</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </SafeAreaView>
        <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} featureName="Smart Home Dashboard" />
      </BackgroundView>
    );
  }

  const toggleDevice = (id: string) => {
    haptics.light();
    setDevices(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = { ...d, on: !d.on };
      sendAlexaText(`Turn ${next.on ? 'on' : 'off'} ${d.name}`);
      return next;
    }));
  };

  const runRoutine = async (routine: typeof ROUTINES[0]) => {
    haptics.medium();
    await sendAlexaText(routine.cmd);
    Alert.alert('Routine Started', `"${routine.name}" is now active.`);
  };

  const sendAnnouncement = () => setAlexaVisible(true);

  const sendDropIn = () => {
    Alert.alert('Drop In', 'Which Echo device would you like to Drop In on?', [
      { text: 'Kitchen Echo', onPress: () => sendAlexaText('Drop in on Kitchen') },
      { text: 'Bedroom Echo', onPress: () => sendAlexaText('Drop in on Bedroom') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const filtered = activeFilter === 'all'
    ? devices
    : devices.filter(d => d.type === activeFilter);

  const filterTypes: Array<'all' | Device['type']> = ['all', 'light', 'thermostat', 'plug', 'lock', 'camera'];

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="home-automation" size={20} color="#00E676" />
            <Text style={styles.headerTitle}>Smart Home</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity onPress={sendAnnouncement} style={styles.quickBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#003320', '#00E676']} style={styles.quickGrad} borderRadius={14} />
              <MaterialCommunityIcons name="bullhorn" size={20} color="#fff" />
              <Text style={styles.quickLabel}>Announce</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendDropIn} style={styles.quickBtn} activeOpacity={0.8}>
              <LinearGradient colors={['#001A2E', '#00CAFF']} style={styles.quickGrad} borderRadius={14} />
              <MaterialCommunityIcons name="phone-incoming" size={20} color="#fff" />
              <Text style={styles.quickLabel}>Drop In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => sendAlexaText('All lights off')}
              style={styles.quickBtn}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#1A0A00', '#FF9900']} style={styles.quickGrad} borderRadius={14} />
              <MaterialCommunityIcons name="lightbulb-off" size={20} color="#fff" />
              <Text style={styles.quickLabel}>All Off</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => sendAlexaText('All lights on')}
              style={styles.quickBtn}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#1A1000', '#FFD700']} style={styles.quickGrad} borderRadius={14} />
              <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FFD700" />
              <Text style={styles.quickLabel}>All On</Text>
            </TouchableOpacity>
          </View>

          {/* Routines */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Routines</Text>
            <View style={styles.routinesGrid}>
              {ROUTINES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => runRoutine(r)}
                  style={[styles.routineBtn, { borderColor: `${r.color}44` }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={r.icon as never} size={24} color={r.color} />
                  <Text style={styles.routineName}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Device filter */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Devices</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {filterTypes.map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setActiveFilter(f)}
                    style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                  >
                    {f !== 'all' && (
                      <MaterialCommunityIcons
                        name={DEVICE_ICONS[f as Device['type']] as never}
                        size={13}
                        color={activeFilter === f ? Colors.amazonDark : Colors.gray}
                      />
                    )}
                    <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.deviceList}>
              {filtered.map(device => (
                <View key={device.id} style={styles.deviceCard}>
                  <View style={[styles.deviceIcon, { backgroundColor: `${DEVICE_COLORS[device.type]}22` }]}>
                    <MaterialCommunityIcons
                      name={DEVICE_ICONS[device.type] as never}
                      size={22}
                      color={device.on ? DEVICE_COLORS[device.type] : Colors.gray}
                    />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceRoom}>
                      {device.room}{device.value ? ` • ${device.value}` : ''}
                    </Text>
                  </View>
                  <Switch
                    value={device.on}
                    onValueChange={() => toggleDevice(device.id)}
                    trackColor={{ false: Colors.darkGray, true: DEVICE_COLORS[device.type] }}
                    thumbColor={Colors.white}
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      <AlexaCommandModal visible={alexaVisible} onClose={() => setAlexaVisible(false)} />
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
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  content: { paddingHorizontal: 16, gap: 20, paddingBottom: 20 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1, height: 76, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickGrad: { ...StyleSheet.absoluteFillObject },
  quickLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },

  section: { gap: 12 },
  sectionLabel: {
    color: Colors.gray, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
  },

  routinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  routineBtn: {
    width: '47%', backgroundColor: Colors.amazonNavy, borderRadius: 14,
    padding: 14, gap: 8, borderWidth: 1,
  },
  routineName: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.amazonNavy, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.alexaBlue, borderColor: Colors.alexaBlue },
  filterText: { color: Colors.gray, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: Colors.amazonDark },

  deviceList: { gap: 8 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.amazonNavy, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceInfo: { flex: 1, gap: 2 },
  deviceName: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  deviceRoom: { color: Colors.gray, fontSize: 12 },

  // Locked state
  lockedCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedCard: {
    borderRadius: 24, padding: 32, alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#00E67644',
  },
  lockedTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  lockedDesc: { color: Colors.gray, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  unlockBtnText: { fontSize: 15, fontWeight: '700' },
});
