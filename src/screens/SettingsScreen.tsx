import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Switch, TouchableOpacity,
  Alert, Platform, SafeAreaView, StatusBar, ActivityIndicator, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';
import { BackgroundView } from '../components/common/BackgroundView';
import { ThemeSelector } from '../components/premium/ThemeSelector';
import { PremiumGate } from '../components/premium/PremiumGate';
import { LinkAlexaModal } from '../components/alexa/LinkAlexaModal';
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
  ['#131921', '#1A2535'], ['#0D1B2A', '#1B4F72'], ['#1A0533', '#4A148C'], ['#0A1628', '#1E3A5F'],
  ['#1B2631', '#2E4053'], ['#0B3D2E', '#1E8449'], ['#2D1B69', '#11998E'], ['#1C1C1C', '#3D3D3D'],
];
const SOLID_COLORS = ['#131921', '#1A1A2E', '#16213E', '#0F3460', '#1B1B2F', '#162447', '#1F4068', '#1B262C'];
const AMAZON_DEALS_URL = 'https://www.amazon.com/deals?tag=echoremote-20';
const AMAZON_ECHO_URL = 'https://www.amazon.com/s?k=amazon+echo&tag=echoremote-20';

export function SettingsScreen() {
  const { settings, updateSettings, isConnected, checkConnection } = useApp();
  const { isPremium, restore, parentalPin, setParentalPin, kidModeActive, setKidMode, accessibilityMode, setAccessibilityMode, sleepSchedule, setSleepSchedule } = usePremium();
  const [ip, setIp] = useState(settings.deviceIp);
  const [port, setPort] = useState(settings.devicePort);
  const [testing, setTesting] = useState(false);
  const [historyClearing, setHistoryClearing] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [linkAlexaVisible, setLinkAlexaVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState<'set' | 'remove' | null>(null);

  const handleSaveConnection = useCallback(async () => {
    await updateSettings({ deviceIp: ip.trim(), devicePort: port.trim() }); setTesting(true); await checkConnection(); setTesting(false);
  }, [ip, port, updateSettings, checkConnection]);
  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Please allow photo library access to set a background.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) await updateSettings({ backgroundType: 'image', backgroundImage: result.assets[0].uri });
  }, [updateSettings]);
  const handleClearHistory = useCallback(async () => {
    Alert.alert('Clear History', 'Remove all Alexa command history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { setHistoryClearing(true); await Storage.clearHistory(); setHistoryClearing(false); } },
    ]);
  }, []);
  const handleSetPin = () => { if (pinInput.length < 4) { Alert.alert('Invalid PIN', 'PIN must be at least 4 digits.'); return; } setParentalPin(pinInput); setPinInput(''); setPinMode(null); Alert.alert('PIN Set', 'Parental PIN has been set.'); };
  const handleRemovePin = () => { if (pinInput !== parentalPin) { Alert.alert('Wrong PIN', 'The PIN you entered is incorrect.'); return; } setParentalPin(null); setPinInput(''); setPinMode(null); };
  const openPremiumFeature = (feature: () => void) => { if (!isPremium) { setGateVisible(true); return; } feature(); };

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" /><SafeAreaView style={styles.safe}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isTablet && styles.tabletContent]} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Settings</Text>
          {!isPremium ? <LinearGradient colors={['#1A0A35', '#0D0020']} style={styles.premiumBanner}><View style={styles.premiumBannerLeft}><MaterialCommunityIcons name="crown" size={24} color="#FFD700" /><View><Text style={styles.premiumBannerTitle}>Go Premium</Text><Text style={styles.premiumBannerSub}>{PRICING.ANNUAL}/yr · {PRICING.LIFETIME} lifetime · {PRICING.MONTHLY}/mo</Text></View></View><TouchableOpacity onPress={() => setGateVisible(true)} style={styles.premiumBannerBtn}><Text style={styles.premiumBannerBtnText}>Upgrade</Text></TouchableOpacity></LinearGradient> : <View style={styles.premiumActive}><MaterialCommunityIcons name="crown" size={20} color="#FFD700" /><Text style={styles.premiumActiveText}>Premium Active · All features unlocked</Text></View>}
          <SectionCard title="Device Connection" icon="wifi">
            <Row label="Echo Show IP Address"><TextInput value={ip} onChangeText={setIp} style={styles.input} placeholder="192.168.1.100" placeholderTextColor={Colors.gray} keyboardType="decimal-pad" autoCorrect={false} /></Row>
            <Row label="Port"><TextInput value={port} onChangeText={setPort} style={[styles.input, styles.inputSmall]} placeholder="8080" placeholderTextColor={Colors.gray} keyboardType="number-pad" /></Row>
            <View style={styles.connectionStatus}><View style={[styles.dot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} /><Text style={[styles.statusText, { color: isConnected ? Colors.green : Colors.red }]}>{isConnected ? 'Connected' : 'Not connected'}</Text></View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveConnection}>{testing ? <ActivityIndicator size="small" color={Colors.amazonDark} /> : <Text style={styles.primaryBtnText}>Save & Test Connection</Text>}</TouchableOpacity>
            <Text style={styles.hint}>For direct local control, install the companion server on a device on your local network.</Text>
          </SectionCard>
          <SectionCard title="Alexa Skill" icon="microphone">
            <View style={styles.alexaStatusRow}><View style={styles.alexaBadge}><MaterialCommunityIcons name={settings.alexaUserId ? 'check-circle' : 'alert-circle-outline'} size={16} color={settings.alexaUserId ? Colors.green : Colors.amazonOrange} /><Text style={[styles.alexaStatusText, { color: settings.alexaUserId ? Colors.green : Colors.amazonOrange }]}>{settings.alexaUserId ? 'Linked' : 'Not linked'}</Text></View><TouchableOpacity onPress={() => setLinkAlexaVisible(true)} style={styles.alexaLinkBtn}><Text style={styles.alexaLinkBtnText}>{settings.alexaUserId ? 'Manage' : 'Link Alexa'}</Text></TouchableOpacity></View>
            <Text style={styles.hint}>The recommended way to control your Echo devices from anywhere. Requires enabling the "Echo Show Remote" Skill in the Alexa app.</Text>
            <View style={styles.modeSwitch}><TouchableOpacity onPress={() => updateSettings({ backendMode: 'skill' })} style={[styles.modeChip, settings.backendMode === 'skill' && styles.modeChipActive]}><MaterialCommunityIcons name="cloud" size={14} color={settings.backendMode === 'skill' ? Colors.amazonDark : Colors.gray} /><Text style={[styles.modeChipText, settings.backendMode === 'skill' && styles.modeChipTextActive]}>Alexa Skill</Text></TouchableOpacity><TouchableOpacity onPress={() => updateSettings({ backendMode: 'local' })} style={[styles.modeChip, settings.backendMode === 'local' && styles.modeChipActive]}><MaterialCommunityIcons name="lan" size={14} color={settings.backendMode === 'local' ? Colors.amazonDark : Colors.gray} /><Text style={[styles.modeChipText, settings.backendMode === 'local' && styles.modeChipTextActive]}>Local Server</Text></TouchableOpacity></View>
          </SectionCard>
          <SectionCard title="App Theme" icon="palette"><ThemeSelector />{!isPremium && <TouchableOpacity onPress={() => setGateVisible(true)} style={styles.unlockHint}><MaterialCommunityIcons name="lock" size={13} color="#AA44FF" /><Text style={styles.unlockHintText}>Upgrade to unlock 7 premium themes</Text></TouchableOpacity>}</SectionCard>
          <SectionCard title="Echo Show Model" icon="tablet"><View style={styles.genGrid}>{GENERATIONS.map(gen => <TouchableOpacity key={gen.id} onPress={() => updateSettings({ echoGeneration: gen.id })} style={[styles.genCard, settings.echoGeneration === gen.id && { borderColor: gen.color, backgroundColor: `${gen.color}22` }]}><MaterialCommunityIcons name="tablet" size={24} color={gen.color} /><Text style={[styles.genLabel, { color: settings.echoGeneration === gen.id ? gen.color : Colors.white }]}>{gen.label}</Text><Text style={styles.genDesc}>{gen.desc}</Text>{settings.echoGeneration === gen.id && <MaterialCommunityIcons name="check-circle" size={14} color={gen.color} style={styles.checkIcon} />}</TouchableOpacity>)}</View></SectionCard>
          <SectionCard title="Background" icon="image">
            <View style={styles.bgTypeTabs}>{(['default', 'gradient', 'color', 'image'] as const).map(type => <TouchableOpacity key={type} onPress={() => updateSettings({ backgroundType: type })} style={[styles.bgTypeTab, settings.backgroundType === type && styles.bgTypeTabActive]}><Text style={[styles.bgTypeTabText, settings.backgroundType === type && styles.bgTypeTabTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text></TouchableOpacity>)}</View>
            {settings.backgroundType === 'gradient' && <View><Text style={styles.subLabel}>Select gradient</Text><View style={styles.colorGrid}>{BG_PRESETS.map(([a, b], i) => <TouchableOpacity key={i} onPress={() => updateSettings({ backgroundGradient: [a, b] })} style={styles.gradientSwatch}><LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />{JSON.stringify(settings.backgroundGradient) === JSON.stringify([a, b]) && <MaterialCommunityIcons name="check" size={18} color="#fff" />}</TouchableOpacity>)}</View></View>}
            {settings.backgroundType === 'color' && <View><Text style={styles.subLabel}>Select color</Text><View style={styles.colorGrid}>{SOLID_COLORS.map(color => <TouchableOpacity key={color} onPress={() => updateSettings({ backgroundColor: color })} style={[styles.colorSwatch, { backgroundColor: color }]}>{settings.backgroundColor === color && <MaterialCommunityIcons name="check" size={18} color="#fff" />}</TouchableOpacity>)}</View></View>}
            {settings.backgroundType === 'image' && <View style={styles.imagePickerSection}>{settings.backgroundImage && <View style={styles.imagePicked}><MaterialCommunityIcons name="image" size={28} color={Colors.green} /><Text style={styles.imagePickedText}>Custom image set</Text></View>}<TouchableOpacity style={styles.primaryBtn} onPress={handlePickImage}><MaterialCommunityIcons name="image-plus" size={18} color={Colors.amazonDark} /><Text style={styles.primaryBtnText}>{settings.backgroundImage ? 'Change Image' : 'Choose from Library'}</Text></TouchableOpacity></View>}
          </SectionCard>
          <SectionCard title="Preferences" icon="tune"><Row label="Kid Mode"><Switch value={kidModeActive} onValueChange={v => openPremiumFeature(() => setKidMode(v))} /></Row><Row label="Accessibility Mode"><Switch value={accessibilityMode} onValueChange={v => openPremiumFeature(() => setAccessibilityMode(v))} /></Row><Text style={styles.hint}>Accessibility and family controls are available with Premium.</Text></SectionCard>
          <SectionCard title="Privacy & Data" icon="shield-lock"><TouchableOpacity style={styles.secondaryBtn} onPress={handleClearHistory} disabled={historyClearing}>{historyClearing ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.secondaryBtnText}>Clear Command History</Text>}</TouchableOpacity></SectionCard>
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
      <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} /><LinkAlexaModal visible={linkAlexaVisible} onClose={() => setLinkAlexaVisible(false)} />
    </BackgroundView>
  );
}
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) { return <View style={styles.card}><View style={styles.cardHeader}><MaterialCommunityIcons name={icon as never} size={18} color={Colors.alexaBlue} /><Text style={styles.cardTitle}>{title}</Text></View>{children}</View>; }
function Row({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><View style={styles.rowControl}>{children}</View></View>; }
const styles = StyleSheet.create({
  bg: { flex: 1 }, safe: { flex: 1 }, scroll: { flex: 1 }, content: { padding: 16, gap: 14 }, tabletContent: { maxWidth: 800, alignSelf: 'center', width: '100%' }, pageTitle: { color: Colors.white, fontSize: 28, fontWeight: '800', marginBottom: 2 },
  premiumBanner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, premiumBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 }, premiumBannerTitle: { color: Colors.white, fontSize: 16, fontWeight: '800' }, premiumBannerSub: { color: Colors.lightGray, fontSize: 11, marginTop: 3 }, premiumBannerBtn: { backgroundColor: '#FFD700', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 }, premiumBannerBtnText: { color: '#1A0A35', fontWeight: '800' }, premiumActive: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, backgroundColor: '#201500' }, premiumActiveText: { color: '#FFD700', fontWeight: '700' },
  card: { backgroundColor: Colors.amazonNavy, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, gap: 12 }, cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, cardTitle: { color: Colors.white, fontSize: 15, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, rowLabel: { color: Colors.lightGray, flex: 1, fontSize: 13 }, rowControl: { minWidth: 120 }, input: { backgroundColor: Colors.amazonDark, color: Colors.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: Colors.border }, inputSmall: { width: 120 }, connectionStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 8, height: 8, borderRadius: 4 }, statusText: { fontSize: 12, fontWeight: '700' }, primaryBtn: { backgroundColor: Colors.alexaBlue, minHeight: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, primaryBtnText: { color: Colors.amazonDark, fontWeight: '800' }, secondaryBtn: { backgroundColor: Colors.amazonDark, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, secondaryBtnText: { color: Colors.white, fontWeight: '700' }, hint: { color: Colors.gray, fontSize: 11, lineHeight: 17 },
  alexaStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, alexaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, alexaStatusText: { fontWeight: '700', fontSize: 12 }, alexaLinkBtn: { backgroundColor: Colors.alexaBlue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }, alexaLinkBtnText: { color: Colors.amazonDark, fontWeight: '800', fontSize: 12 }, modeSwitch: { flexDirection: 'row', gap: 8 }, modeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.amazonDark }, modeChipActive: { backgroundColor: Colors.alexaBlue }, modeChipText: { color: Colors.gray, fontWeight: '700', fontSize: 12 }, modeChipTextActive: { color: Colors.amazonDark }, unlockHint: { flexDirection: 'row', alignItems: 'center', gap: 6 }, unlockHintText: { color: '#AA44FF', fontSize: 11, fontWeight: '700' },
  genGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, genCard: { width: '31%', minWidth: 110, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.amazonDark }, genLabel: { fontSize: 12, fontWeight: '800', marginTop: 6 }, genDesc: { color: Colors.gray, fontSize: 10, marginTop: 2 }, checkIcon: { position: 'absolute', right: 7, top: 7 },
  bgTypeTabs: { flexDirection: 'row', backgroundColor: Colors.amazonDark, borderRadius: 10, padding: 3, gap: 3 }, bgTypeTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 }, bgTypeTabActive: { backgroundColor: Colors.alexaBlue }, bgTypeTabText: { color: Colors.gray, fontSize: 11, fontWeight: '700' }, bgTypeTabTextActive: { color: Colors.amazonDark }, subLabel: { color: Colors.gray, fontSize: 11, fontWeight: '700', marginBottom: 6 }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, colorSwatch: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, gradientSwatch: { width: 42, height: 42, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, imagePickerSection: { gap: 10 }, imagePicked: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: Colors.amazonDark }, imagePickedText: { color: Colors.lightGray, fontSize: 12, fontWeight: '700' },
});
