import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { discoverDevices, DiscoveredDevice } from '../../utils/deviceDiscovery';
import { useApp } from '../../context/AppContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Storage } from '../../utils/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DeviceDiscoveryModal({ visible, onClose }: Props) {
  const { updateSettings, checkConnection, settings } = useApp();
  const haptics = useHaptics();

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState<DiscoveredDevice[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('8080');
  const [tab, setTab] = useState<'scan' | 'manual'>('scan');
  const [connecting, setConnecting] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFound([]);
      setProgress(0);
      loadRecent();
    } else {
      abortRef.current?.abort();
      setScanning(false);
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const loadRecent = useCallback(async () => {
    const history = await Storage.getCommandHistory();
    // Re-use command history key structure — recent IPs stored separately
    const raw = await Storage.getRecentHosts?.() ?? [];
    setRecent(raw);
  }, []);

  const startScan = useCallback(async () => {
    haptics.medium();
    setFound([]);
    setProgress(0);
    setScanning(true);
    abortRef.current = new AbortController();

    await discoverDevices(
      device => setFound(prev => [...prev, device]),
      pct => setProgress(pct),
      abortRef.current.signal,
    );
    setScanning(false);
  }, [haptics]);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    setScanning(false);
  }, []);

  const connectTo = useCallback(async (host: string) => {
    const [ip, port] = host.split(':');
    haptics.success();
    setConnecting(host);
    await updateSettings({ deviceIp: ip, devicePort: port ?? '8080' });
    await Storage.addRecentHost?.(host);
    await checkConnection();
    setConnecting(null);
    onClose();
  }, [haptics, updateSettings, checkConnection, onClose]);

  const connectManual = useCallback(async () => {
    const ip = manualIp.trim();
    const port = manualPort.trim() || '8080';
    if (!ip) return;
    await connectTo(`${ip}:${port}`);
  }, [manualIp, manualPort, connectTo]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="wifi-find" size={22} color={Colors.alexaBlue} />
            <Text style={styles.title}>Connect to Echo Show</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.gray} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['scan', 'manual'] as const).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, tab === t && styles.tabActive]}
              >
                <MaterialCommunityIcons
                  name={t === 'scan' ? 'radar' : 'pencil'}
                  size={14}
                  color={tab === t ? Colors.amazonDark : Colors.gray}
                />
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'scan' ? 'Auto Scan' : 'Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Auto Scan tab ─────────────────────── */}
          {tab === 'scan' && (
            <View style={styles.body}>
              {/* Scan button */}
              <TouchableOpacity
                onPress={scanning ? stopScan : startScan}
                style={[styles.scanBtn, scanning && styles.scanBtnActive]}
                activeOpacity={0.8}
              >
                {scanning
                  ? <ActivityIndicator size="small" color={Colors.amazonDark} />
                  : <MaterialCommunityIcons name="radar" size={20} color={Colors.amazonDark} />
                }
                <Text style={styles.scanBtnText}>
                  {scanning ? 'Stop Scanning' : 'Scan Local Network'}
                </Text>
              </TouchableOpacity>

              {/* Progress bar */}
              {scanning && (
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressBar, { width: barWidth }]} />
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}

              {/* Found devices */}
              {found.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Found Devices</Text>
                  {found.map(d => (
                    <DeviceRow
                      key={d.host}
                      label={d.host}
                      sublabel="Echo Show companion server"
                      icon="television-play"
                      iconColor={Colors.alexaBlue}
                      loading={connecting === d.host}
                      isCurrent={`${settings.deviceIp}:${settings.devicePort}` === d.host}
                      onPress={() => connectTo(d.host)}
                    />
                  ))}
                </>
              )}

              {!scanning && found.length === 0 && progress === 100 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="wifi-off" size={32} color={Colors.darkGray} />
                  <Text style={styles.emptyText}>No devices found</Text>
                  <Text style={styles.emptyHint}>
                    Make sure the companion server is running on the same WiFi network
                  </Text>
                </View>
              )}

              {/* Recent connections */}
              {recent.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Recent</Text>
                  {recent.map(host => (
                    <DeviceRow
                      key={host}
                      label={host}
                      icon="history"
                      iconColor={Colors.gray}
                      loading={connecting === host}
                      isCurrent={`${settings.deviceIp}:${settings.devicePort}` === host}
                      onPress={() => connectTo(host)}
                    />
                  ))}
                </>
              )}

              {!scanning && found.length === 0 && recent.length === 0 && progress < 100 && (
                <View style={styles.hint}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={Colors.alexaBlue} />
                  <Text style={styles.hintText}>
                    Tap Scan to automatically find the companion server on your WiFi network
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Manual tab ────────────────────────── */}
          {tab === 'manual' && (
            <View style={styles.body}>
              <Text style={styles.inputLabel}>IP Address</Text>
              <TextInput
                value={manualIp}
                onChangeText={setManualIp}
                placeholder="e.g. 192.168.1.100"
                placeholderTextColor={Colors.gray}
                style={styles.input}
                keyboardType="decimal-pad"
                autoCorrect={false}
              />
              <Text style={styles.inputLabel}>Port</Text>
              <TextInput
                value={manualPort}
                onChangeText={setManualPort}
                placeholder="8080"
                placeholderTextColor={Colors.gray}
                style={[styles.input, styles.inputSmall]}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={connectManual}
                disabled={!manualIp.trim() || !!connecting}
                style={[styles.scanBtn, (!manualIp.trim() || !!connecting) && styles.scanBtnDisabled]}
                activeOpacity={0.8}
              >
                {connecting ? (
                  <ActivityIndicator size="small" color={Colors.amazonDark} />
                ) : (
                  <MaterialCommunityIcons name="connection" size={20} color={Colors.amazonDark} />
                )}
                <Text style={styles.scanBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

function DeviceRow({
  label, sublabel, icon, iconColor, loading, isCurrent, onPress,
}: {
  label: string; sublabel?: string; icon: string; iconColor: string;
  loading: boolean; isCurrent: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.deviceRow, isCurrent && styles.deviceRowActive]}
      activeOpacity={0.7}
    >
      <View style={[styles.deviceIcon, { backgroundColor: `${iconColor}22` }]}>
        <MaterialCommunityIcons name={icon as never} size={18} color={iconColor} />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceLabel}>{label}</Text>
        {sublabel && <Text style={styles.deviceSub}>{sublabel}</Text>}
      </View>
      {loading
        ? <ActivityIndicator size="small" color={Colors.alexaBlue} />
        : isCurrent
          ? <MaterialCommunityIcons name="check-circle" size={18} color={Colors.green} />
          : <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.gray} />
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.amazonNavy,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { flex: 1, color: Colors.white, fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Colors.amazonDark,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, gap: 6,
  },
  tabActive: { backgroundColor: Colors.alexaBlue },
  tabText: { color: Colors.gray, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.amazonDark },
  body: { paddingHorizontal: 16, gap: 10, paddingBottom: 10 },
  scanBtn: {
    backgroundColor: Colors.alexaBlue,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14,
  },
  scanBtnActive: { backgroundColor: Colors.amazonBlue },
  scanBtnDisabled: { opacity: 0.4 },
  scanBtnText: { color: Colors.amazonDark, fontWeight: '700', fontSize: 15 },
  progressTrack: {
    height: 6, backgroundColor: Colors.amazonDark, borderRadius: 3, overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: Colors.alexaBlue, borderRadius: 3 },
  progressText: { color: Colors.gray, fontSize: 11, textAlign: 'right', marginTop: 4 },
  sectionLabel: {
    color: Colors.gray, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4,
  },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.amazonDark, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'transparent',
  },
  deviceRowActive: { borderColor: Colors.green },
  deviceIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deviceInfo: { flex: 1 },
  deviceLabel: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  deviceSub: { color: Colors.gray, fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: Colors.gray, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: Colors.darkGray, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  hint: {
    flexDirection: 'row', gap: 10, backgroundColor: `${Colors.alexaBlue}11`,
    padding: 12, borderRadius: 10, alignItems: 'flex-start',
  },
  hintText: { color: Colors.lightGray, fontSize: 12, flex: 1, lineHeight: 18 },
  inputLabel: { color: Colors.gray, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  input: {
    backgroundColor: Colors.amazonDark, color: Colors.white,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  inputSmall: { width: 120 },
});
