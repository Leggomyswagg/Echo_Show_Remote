import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';
import { BackgroundView } from '../components/common/BackgroundView';
import { ThemeSelector } from '../components/premium/ThemeSelector';
import { PremiumGate } from '../components/premium/PremiumGate';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { Storage } from '../utils/storage';
import { isTablet } from '../utils/responsive';
import { PRICING } from '../utils/premiumFeatures';

const GENERATIONS = [
  { id: 'show5', label: 'Echo Show 5', desc: '5.5" • 3rd Gen', color: Colors.echoGenerations.show5 },
  { id: 'show8', label: 'Echo Show 8', desc: '8" • 3rd Gen', color: Colors.echoGenerations.show8 },
  { id: 'show10', label: 'Echo Show 10', desc: '10.1" • Rotating', color: Colors.echoGenerations.show10 },
  { id: 'show15', label: 'Echo Show 15', desc: '15.6" • Wall Mount', color: Colors.echoGenerations.show15 },
  { id: 'show21', label: 'Echo Show 21', desc: '21" • Smart Display', color: Colors.echoGenerations.show21 },
];

const BG_PRESETS: [string, string][] = [
  ['#131921', '#1A2535'], ['#0D1B2A', '#1B4F72'], ['#1A0533', '#4A148C'],
  ['#0A1628', '#1E3A5F'], ['#1B2631', '#2E4053'], ['#0B3D2E', '#1E8449'],
  ['#2D1B69', '#11998E'], ['#1C1C1C', '#3D3D3D'],
];

const SOLID_COLORS = [
  '#131921', '#1A1A2E', '#16213E', '#0F3460',
  '#1B1B2F', '#162447', '#1F4068', '#1B262C',
];

const AMAZON_DEALS_URL = 'https://www.amazon.com/deals?tag=echoremote-20';
const AMAZON_ECHO_URL = 'https://www.amazon.com/s?k=amazon+echo&tag=echoremote-20';

export function SettingsScreen() {
  const { settings, updateSettings, isConnected, checkConnection } = useApp();
  const {
    isPremium, restore,
    parentalPin, setParentalPin, kidModeActive, setKidMode,
    accessibilityMode, setAccessibilityMode,
    sleepSchedule, setSleepSchedule,
  } = usePremium();

  const [ip, setIp] = useState(settings.deviceIp);
  const [port, setPort] = useState(settings.devicePort);
  const [testing, setTesting] = useState(false);
  const [historyClearing, setHistoryClearing] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState<'set' | 'remove' | null>(null);

  const handleSaveConnection = useCallback(async () => {
    await updateSettings({ deviceIp: ip.trim(), devicePort: port.trim() });
    setTesting(true);
    await checkConnection();
    setTesting(false);
  }, [ip, port, updateSettings, checkConnection]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to set a background.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateSettings({ backgroundType: 'image', backgroundImage: result.assets[0].uri });
    }
  }, [updateSettings]);

  const handleClearHistory = useCallback(async () => {
    Alert.alert('Clear History', 'Remove all Alexa command history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          setHistoryClearing(true);
          await Storage.clearHistory();
          setHistoryClearing(false);
        },
      },
    ]);
  }, []);

  const handleSetPin = () => {
    if (pinInput.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.');
      return;
    }
    setParentalPin(pinInput);
    setPinInput('');
    setPinMode(null);
    Alert.alert('PIN Set', 'Parental PIN has been set.');
  };

  const handleRemovePin = () => {
    if (pinInput !== parentalPin) {
      Alert.alert('Wrong PIN', 'The PIN you entered is incorrect.');
      return;
    }
    setParentalPin(null);
    setPinInput('');
    setPinMode(null);
  };

  const openPremiumFeature = (feature: () => void) => {
    if (!isPremium) { setGateVisible(true); return; }
    feature();
  };

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Settings</Text>

          {/* ── Premium ──────────────────────────────────────────── */}
          {!isPremium ? (
            <LinearGradient colors={['#1A0A35', '#0D0020']} style={styles.premiumBanner}>
              <View style={styles.premiumBannerLeft}>
                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                <View>
                  <Text style={styles.premiumBannerTitle}>Go Premium</Text>
                  <Text style={styles.premiumBannerSub}>
                    {PRICING.ANNUAL}/yr · {PRICING.LIFETIME} lifetime · {PRICING.MONTHLY}/mo
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setGateVisible(true)}
                style={styles.premiumBannerBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.premiumBannerBtnText}>Upgrade</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <View style={styles.premiumActive}>
              <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
              <Text style={styles.premiumActiveText}>Premium Active · All features unlocked</Text>
            </View>
          )}

          {/* ── Device Connection ──────────────────────────────── */}
          <SectionCard title="Device Connection" icon="wifi">
            <Row label="Echo Show IP Address">
              <TextInput
                value={ip}
                onChangeText={setIp}
                style={styles.input}
                placeholder="192.168.1.100"
                placeholderTextColor={Colors.gray}
                keyboardType="decimal-pad"
                autoCorrect={false}
              />
            </Row>
            <Row label="Port">
              <TextInput
                value={port}
                onChangeText={setPort}
                style={[styles.input, styles.inputSmall]}
                placeholder="8080"
                placeholderTextColor={Colors.gray}
                keyboardType="number-pad"
              />
            </Row>
            <View style={styles.connectionStatus}>
              <View style={[styles.dot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} />
              <Text style={[styles.statusText, { color: isConnected ? Colors.green : Colors.red }]}>
                {isConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveConnection} activeOpacity={0.8}>
              {testing ? (
                <ActivityIndicator size="small" color={Colors.amazonDark} />
              ) : (
                <Text style={styles.primaryBtnText}>Save & Test Connection</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>
              Install the Echo Show Remote companion server on a device on your local network.
            </Text>
          </SectionCard>

          {/* ── Themes ───────────────────────────────────────────── */}
          <SectionCard title="App Theme" icon="palette">
            <ThemeSelector />
            {!isPremium && (
              <TouchableOpacity onPress={() => setGateVisible(true)} style={styles.unlockHint} activeOpacity={0.8}>
                <MaterialCommunityIcons name="lock" size={13} color="#AA44FF" />
                <Text style={styles.unlockHintText}>Upgrade to unlock 7 premium themes</Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          {/* ── Echo Show Generation ──────────────────────────── */}
          <SectionCard title="Echo Show Model" icon="tablet">
            <View style={styles.genGrid}>
              {GENERATIONS.map(gen => (
                <TouchableOpacity
                  key={gen.id}
                  onPress={() => updateSettings({ echoGeneration: gen.id })}
                  style={[
                    styles.genCard,
                    settings.echoGeneration === gen.id && {
                      borderColor: gen.color,
                      backgroundColor: `${gen.color}22`,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tablet" size={24} color={gen.color} />
                  <Text style={[styles.genLabel, { color: settings.echoGeneration === gen.id ? gen.color : Colors.white }]}>
                    {gen.label}
                  </Text>
                  <Text style={styles.genDesc}>{gen.desc}</Text>
                  {settings.echoGeneration === gen.id && (
                    <MaterialCommunityIcons name="check-circle" size={14} color={gen.color} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* ── Background ───────────────────────────────────── */}
          <SectionCard title="Background" icon="image">
            <View style={styles.bgTypeTabs}>
              {(['default', 'gradient', 'color', 'image'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => updateSettings({ backgroundType: type })}
                  style={[styles.bgTypeTab, settings.backgroundType === type && styles.bgTypeTabActive]}
                >
                  <Text style={[
                    styles.bgTypeTabText,
                    settings.backgroundType === type && styles.bgTypeTabTextActive,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {settings.backgroundType === 'gradient' && (
              <View>
                <Text style={styles.subLabel}>Select gradient</Text>
                <View style={styles.colorGrid}>
                  {BG_PRESETS.map(([a, b], i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => updateSettings({ backgroundGradient: [a, b] })}
                      style={styles.gradientSwatch}
                    >
                      <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                      {JSON.stringify(settings.backgroundGradient) === JSON.stringify([a, b]) && (
                        <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {settings.backgroundType === 'color' && (
              <View>
                <Text style={styles.subLabel}>Select color</Text>
                <View style={styles.colorGrid}>
                  {SOLID_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => updateSettings({ backgroundColor: color })}
                      style={[styles.colorSwatch, { backgroundColor: color }]}
                    >
                      {settings.backgroundColor === color && (
                        <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {settings.backgroundType === 'image' && (
              <View style={styles.imagePickerSection}>
                {settings.backgroundImage && (
                  <View style={styles.imagePicked}>
                    <MaterialCommunityIcons name="image-check" size={28} color={Colors.green} />
                    <Text style={styles.imagePickedText}>Custom image set</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={handlePickImage} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="image-plus" size={18} color={Colors.amazonDark} style={{ marginRight: 6 }} />
                  <Text style={styles.primaryBtnText}>
                    {settings.backgroundImage ? 'Change Image' : 'Choose from Library'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {/* ── Preferences ──────────────────────────────────── */}
          <SectionCard title="Preferences" icon="tune">
            <Row label="Haptic Feedback">
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={v => updateSettings({ hapticsEnabled: v })}
                trackColor={{ false: Colors.darkGray, true: Colors.alexaBlue }}
                thumbColor={Colors.white}
              />
            </Row>
            <Row label="Accessibility Mode">
              <Switch
                value={accessibilityMode}
                onValueChange={v => openPremiumFeature(() => setAccessibilityMode(v))}
                trackColor={{ false: Colors.darkGray, true: Colors.alexaBlue }}
                thumbColor={Colors.white}
              />
            </Row>
            {!isPremium && (
              <Text style={styles.premiumNote}>
                <MaterialCommunityIcons name="lock" size={11} color="#AA44FF" /> Accessibility Mode requires Premium
              </Text>
            )}
          </SectionCard>

          {/* ── Parental Controls ─────────────────────────────── */}
          <SectionCard title="Parental Controls" icon="account-child">
            {!isPremium ? (
              <PremiumLockedRow featureName="Parental Controls" onUnlock={() => setGateVisible(true)} />
            ) : (
              <>
                <Row label="Kid Mode">
                  <Switch
                    value={kidModeActive}
                    onValueChange={setKidMode}
                    trackColor={{ false: Colors.darkGray, true: Colors.amazonOrange }}
                    thumbColor={Colors.white}
                  />
                </Row>
                {kidModeActive && (
                  <View style={styles.kidModeActive}>
                    <MaterialCommunityIcons name="emoticon-happy" size={16} color={Colors.amazonOrange} />
                    <Text style={styles.kidModeText}>Kid Mode is active — restricted content only</Text>
                  </View>
                )}
                <View style={styles.pinSection}>
                  <Text style={styles.pinLabel}>
                    PIN: {parentalPin ? '••••' : 'Not set'}
                  </Text>
                  {pinMode === null ? (
                    <View style={styles.pinBtnRow}>
                      <TouchableOpacity style={styles.pinBtn} onPress={() => setPinMode('set')}>
                        <Text style={styles.pinBtnText}>{parentalPin ? 'Change PIN' : 'Set PIN'}</Text>
                      </TouchableOpacity>
                      {parentalPin && (
                        <TouchableOpacity style={[styles.pinBtn, styles.pinBtnDanger]} onPress={() => setPinMode('remove')}>
                          <Text style={[styles.pinBtnText, { color: Colors.red }]}>Remove PIN</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={styles.pinInputRow}>
                      <TextInput
                        value={pinInput}
                        onChangeText={setPinInput}
                        style={[styles.input, { flex: 1 }]}
                        placeholder={pinMode === 'remove' ? 'Enter current PIN' : 'Enter new PIN (min 4 digits)'}
                        placeholderTextColor={Colors.gray}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                      />
                      <TouchableOpacity
                        onPress={pinMode === 'set' ? handleSetPin : handleRemovePin}
                        style={styles.pinConfirmBtn}
                      >
                        <MaterialCommunityIcons name="check" size={18} color={Colors.amazonDark} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setPinMode(null); setPinInput(''); }}
                        style={styles.pinCancelBtn}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={Colors.gray} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </SectionCard>

          {/* ── Sleep / Wake Scheduler ─────────────────────────── */}
          <SectionCard title="Sleep / Wake Scheduler" icon="clock-time-eight">
            {!isPremium ? (
              <PremiumLockedRow featureName="Sleep Scheduler" onUnlock={() => setGateVisible(true)} />
            ) : (
              <>
                <Row label="Enable Scheduler">
                  <Switch
                    value={sleepSchedule.enabled}
                    onValueChange={v => setSleepSchedule({ ...sleepSchedule, enabled: v })}
                    trackColor={{ false: Colors.darkGray, true: Colors.alexaBlue }}
                    thumbColor={Colors.white}
                  />
                </Row>
                {sleepSchedule.enabled && (
                  <View style={styles.scheduleGrid}>
                    <View style={styles.scheduleItem}>
                      <MaterialCommunityIcons name="weather-night" size={16} color="#4488FF" />
                      <Text style={styles.scheduleLabel}>Sleep</Text>
                      <TextInput
                        value={sleepSchedule.sleepTime}
                        onChangeText={v => setSleepSchedule({ ...sleepSchedule, sleepTime: v })}
                        style={styles.timeInput}
                        placeholder="22:00"
                        placeholderTextColor={Colors.gray}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.scheduleItem}>
                      <MaterialCommunityIcons name="weather-sunny" size={16} color="#FFB300" />
                      <Text style={styles.scheduleLabel}>Wake</Text>
                      <TextInput
                        value={sleepSchedule.wakeTime}
                        onChangeText={v => setSleepSchedule({ ...sleepSchedule, wakeTime: v })}
                        style={styles.timeInput}
                        placeholder="07:00"
                        placeholderTextColor={Colors.gray}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                )}
                <Text style={styles.hint}>Automatically send sleep/wake commands to your Echo Show at scheduled times.</Text>
              </>
            )}
          </SectionCard>

          {/* ── Amazon Shopping ──────────────────────────────────── */}
          <SectionCard title="Amazon Shopping" icon="shopping">
            <Text style={styles.shopDesc}>
              Quick links to Amazon deals and Echo accessories.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.amazonOrange }]}
              onPress={() => Linking.openURL(AMAZON_DEALS_URL)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="tag" size={16} color={Colors.amazonDark} style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Amazon Today's Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: Colors.amazonNavy }]}
              onPress={() => Linking.openURL(AMAZON_ECHO_URL)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="microphone" size={16} color={Colors.white} style={{ marginRight: 6 }} />
              <Text style={[styles.primaryBtnText, { color: Colors.white }]}>Shop Echo Devices</Text>
            </TouchableOpacity>
            <Text style={styles.affiliateDisclosure}>
              Links may include affiliate commissions that support app development.
            </Text>
          </SectionCard>

          {/* ── Widget Setup ─────────────────────────────────────── */}
          <SectionCard title="Home Screen Widget" icon="widgets">
            <View style={styles.widgetInfo}>
              <MaterialCommunityIcons name="information-outline" size={18} color={Colors.alexaBlue} />
              <Text style={styles.widgetInfoText}>
                Add the Echo Show Remote widget to your home screen for instant access to Alexa, volume, and playback controls.
              </Text>
            </View>
            {Platform.OS === 'android' && (
              <View style={styles.widgetSteps}>
                <Text style={styles.widgetStep}>1. Long-press your home screen</Text>
                <Text style={styles.widgetStep}>2. Tap "Widgets"</Text>
                <Text style={styles.widgetStep}>3. Find "Echo Show Remote"</Text>
                <Text style={styles.widgetStep}>4. Drag it to your home screen</Text>
              </View>
            )}
            {Platform.OS === 'ios' && (
              <View style={styles.widgetSteps}>
                <Text style={styles.widgetStep}>1. Long-press your home screen</Text>
                <Text style={styles.widgetStep}>2. Tap the "+" in the top left</Text>
                <Text style={styles.widgetStep}>3. Search "Echo Show Remote"</Text>
                <Text style={styles.widgetStep}>4. Choose widget size and add</Text>
              </View>
            )}
          </SectionCard>

          {/* ── Data ──────────────────────────────────────────────── */}
          <SectionCard title="Data" icon="database">
            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearHistory} activeOpacity={0.8}>
              {historyClearing ? (
                <ActivityIndicator size="small" color={Colors.red} />
              ) : (
                <Text style={styles.dangerBtnText}>Clear Command History</Text>
              )}
            </TouchableOpacity>
          </SectionCard>

          {/* ── About ─────────────────────────────────────────────── */}
          <SectionCard title="About" icon="information">
            <Row label="Version"><Text style={styles.valueText}>1.0.0</Text></Row>
            <Row label="Platform">
              <Text style={styles.valueText}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'} {isTablet ? '(Tablet)' : '(Phone)'}
              </Text>
            </Row>
            <Row label="Status">
              <Text style={[styles.valueText, { color: isPremium ? '#FFD700' : Colors.gray }]}>
                {isPremium ? 'Premium' : 'Free'}
              </Text>
            </Row>
            {isPremium && (
              <TouchableOpacity onPress={() => restore()} style={styles.restoreBtn} activeOpacity={0.8}>
                <Text style={styles.restoreBtnText}>Restore Purchase</Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Echo Show Remote • App Store & Google Play</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} />
    </BackgroundView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PremiumLockedRow({ featureName, onUnlock }: { featureName: string; onUnlock: () => void }) {
  return (
    <TouchableOpacity onPress={onUnlock} style={styles.lockedRow} activeOpacity={0.8}>
      <MaterialCommunityIcons name="lock" size={16} color="#AA44FF" />
      <Text style={styles.lockedRowText}>{featureName} requires Premium</Text>
      <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
    </TouchableOpacity>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon as never} size={18} color={Colors.alexaBlue} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  tabletContent: { paddingHorizontal: 40, maxWidth: 800, alignSelf: 'center', width: '100%' },
  pageTitle: {
    color: Colors.white, fontSize: 28, fontWeight: '800',
    marginBottom: 4, marginTop: 8, letterSpacing: 0.5,
  },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#AA44FF44',
  },
  premiumBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  premiumBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  premiumBannerSub: { color: Colors.gray, fontSize: 11, marginTop: 2 },
  premiumBannerBtn: {
    backgroundColor: '#AA44FF', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  premiumBannerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  premiumActive: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  premiumActiveText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: Colors.amazonNavy, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cardTitle: { color: Colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  rowLabel: { color: Colors.lightGray, fontSize: 14, flex: 1 },
  valueText: { color: Colors.gray, fontSize: 13 },

  // Inputs
  input: {
    backgroundColor: Colors.amazonDark, color: Colors.white, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, flex: 1,
  },
  inputSmall: { maxWidth: 100, flex: undefined },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.alexaBlue, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  primaryBtnText: { color: Colors.amazonDark, fontWeight: '700', fontSize: 14 },
  dangerBtn: {
    borderColor: Colors.red, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  dangerBtnText: { color: Colors.red, fontWeight: '600', fontSize: 14 },

  // Connection
  connectionStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  hint: { color: Colors.gray, fontSize: 11, lineHeight: 16 },

  // Generation grid
  genGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genCard: {
    backgroundColor: Colors.amazonDark, borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: Colors.border, width: '47%', alignItems: 'center', gap: 4,
  },
  genLabel: { color: Colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  genDesc: { color: Colors.gray, fontSize: 11, textAlign: 'center' },
  checkIcon: { position: 'absolute', top: 6, right: 6 },

  // Background
  bgTypeTabs: {
    flexDirection: 'row', backgroundColor: Colors.amazonDark,
    borderRadius: 10, padding: 3, gap: 2,
  },
  bgTypeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  bgTypeTabActive: { backgroundColor: Colors.alexaBlue },
  bgTypeTabText: { color: Colors.gray, fontSize: 13, fontWeight: '600' },
  bgTypeTabTextActive: { color: Colors.amazonDark },
  subLabel: { color: Colors.gray, fontSize: 12, marginBottom: 8, fontWeight: '600' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  gradientSwatch: {
    width: 72, height: 52, borderRadius: 12, borderWidth: 2, borderColor: Colors.border,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  imagePickerSection: { gap: 10 },
  imagePicked: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(29,185,84,0.12)', padding: 10, borderRadius: 10,
  },
  imagePickedText: { color: Colors.green, fontSize: 13, fontWeight: '600' },

  // Theme
  unlockHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(170,68,255,0.1)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#AA44FF33',
  },
  unlockHintText: { color: '#AA44FF', fontSize: 12, fontWeight: '600' },

  // Preferences
  premiumNote: { color: '#AA44FF', fontSize: 11 },

  // Parental
  lockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(170,68,255,0.1)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#AA44FF33',
  },
  lockedRowText: { color: Colors.lightGray, fontSize: 13, flex: 1 },
  kidModeActive: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,153,0,0.12)', padding: 10, borderRadius: 10,
  },
  kidModeText: { color: Colors.amazonOrange, fontSize: 12, fontWeight: '600' },
  pinSection: { gap: 8 },
  pinLabel: { color: Colors.lightGray, fontSize: 13 },
  pinBtnRow: { flexDirection: 'row', gap: 8 },
  pinBtn: {
    backgroundColor: Colors.amazonDark, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  pinBtnDanger: { borderColor: `${Colors.red}44` },
  pinBtnText: { color: Colors.lightGray, fontSize: 13, fontWeight: '600' },
  pinInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pinConfirmBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.alexaBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  pinCancelBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.amazonDark,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },

  // Sleep schedule
  scheduleGrid: { flexDirection: 'row', gap: 12 },
  scheduleItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.amazonDark, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  scheduleLabel: { color: Colors.lightGray, fontSize: 12, fontWeight: '600' },
  timeInput: {
    flex: 1, color: Colors.white, fontSize: 15, fontWeight: '700', textAlign: 'center',
  },

  // Shopping
  shopDesc: { color: Colors.lightGray, fontSize: 13, lineHeight: 18 },
  affiliateDisclosure: { color: Colors.gray, fontSize: 10, lineHeight: 14 },

  // Restore
  restoreBtn: { alignItems: 'center', paddingVertical: 4 },
  restoreBtnText: { color: Colors.gray, fontSize: 13 },

  // Widget
  widgetInfo: {
    flexDirection: 'row', gap: 10, backgroundColor: 'rgba(0,202,255,0.1)',
    padding: 12, borderRadius: 10, alignItems: 'flex-start',
  },
  widgetInfoText: { color: Colors.lightGray, fontSize: 13, flex: 1, lineHeight: 18 },
  widgetSteps: { gap: 6 },
  widgetStep: { color: Colors.gray, fontSize: 13, lineHeight: 20 },

  // Footer
  footer: { alignItems: 'center', paddingTop: 10 },
  footerText: { color: Colors.darkGray, fontSize: 11, textAlign: 'center' },
});
