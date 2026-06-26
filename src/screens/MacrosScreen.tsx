import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, TextInput, Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundView } from '../components/common/BackgroundView';
import { PremiumGate } from '../components/premium/PremiumGate';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useHaptics } from '../hooks/useHaptics';
import { EchoCommand } from '../utils/echoControl';
import { Colors } from '../utils/colors';

export interface MacroStep {
  command: EchoCommand | 'alexa_text';
  text?: string;
  delay: number;
}

export interface Macro {
  id: string;
  name: string;
  icon: string;
  color: string;
  steps: MacroStep[];
  isBuiltIn?: boolean;
}

const MACROS_KEY = 'macros_v1';

const BUILT_IN_MACROS: Macro[] = [
  {
    id: 'movie_night', name: 'Movie Night', icon: 'movie', color: '#AA44FF', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Dim living room lights to 30%', delay: 500 },
      { command: 'alexa_text', text: 'Play Prime Video', delay: 1000 },
      { command: 'volume_up', delay: 200 },
      { command: 'volume_up', delay: 200 },
      { command: 'do_not_disturb', delay: 300 },
    ],
  },
  {
    id: 'sleep_mode', name: 'Sleep Mode', icon: 'weather-night', color: '#4488FF', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Turn off all lights', delay: 500 },
      { command: 'alexa_text', text: 'Set thermostat to 68 degrees', delay: 800 },
      { command: 'alexa_text', text: 'Play sleep sounds', delay: 1000 },
      { command: 'volume_down', delay: 200 },
      { command: 'volume_down', delay: 200 },
    ],
  },
  {
    id: 'morning_routine', name: 'Good Morning', icon: 'weather-sunny', color: '#FFB300', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Good morning', delay: 500 },
      { command: 'alexa_text', text: 'Turn on lights to 80%', delay: 800 },
      { command: 'alexa_text', text: 'Play morning playlist', delay: 1000 },
    ],
  },
  {
    id: 'music_mode', name: 'Music Mode', icon: 'music', color: '#1DB954', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Play my music', delay: 500 },
      { command: 'alexa_text', text: 'Set lights to party mode', delay: 800 },
      { command: 'volume_up', delay: 200 },
      { command: 'volume_up', delay: 200 },
      { command: 'volume_up', delay: 200 },
    ],
  },
  {
    id: 'kid_mode', name: 'Kid Mode', icon: 'emoticon-happy', color: '#FF6B35', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Open Amazon Kids', delay: 500 },
      { command: 'do_not_disturb', delay: 300 },
      { command: 'alexa_text', text: 'Volume set to 30%', delay: 500 },
    ],
  },
  {
    id: 'focus_mode', name: 'Focus Mode', icon: 'brain', color: '#00CAFF', isBuiltIn: true,
    steps: [
      { command: 'alexa_text', text: 'Play focus music', delay: 500 },
      { command: 'do_not_disturb', delay: 300 },
      { command: 'alexa_text', text: 'Set lights to cool white', delay: 600 },
    ],
  },
];

const AVAILABLE_COMMANDS: Array<{ cmd: EchoCommand; label: string; icon: string }> = [
  { cmd: 'play_pause', label: 'Play/Pause', icon: 'play-pause' },
  { cmd: 'volume_up', label: 'Volume Up', icon: 'volume-high' },
  { cmd: 'volume_down', label: 'Volume Down', icon: 'volume-low' },
  { cmd: 'mute', label: 'Mute', icon: 'volume-mute' },
  { cmd: 'home', label: 'Home', icon: 'home' },
  { cmd: 'back', label: 'Back', icon: 'arrow-left' },
  { cmd: 'do_not_disturb', label: 'Do Not Disturb', icon: 'bell-off' },
  { cmd: 'rewind', label: 'Rewind', icon: 'rewind' },
  { cmd: 'fast_forward', label: 'Fast Forward', icon: 'fast-forward' },
];

const ICON_COLORS = ['#AA44FF', '#4488FF', '#FFB300', '#1DB954', '#FF6B35', '#00CAFF', '#FF4466', '#FF9900'];
const ICONS = ['star', 'rocket', 'heart', 'lightning-bolt', 'fire', 'flash', 'cog', 'palette'];

export function MacrosScreen() {
  const { sendCommand, sendAlexaText } = useApp();
  const { isPremium } = usePremium();
  const haptics = useHaptics();
  const [customMacros, setCustomMacros] = useState<Macro[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [gateVisible, setGateVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(ICONS[0]);
  const [newColor, setNewColor] = useState(ICON_COLORS[0]);
  const [newSteps, setNewSteps] = useState<MacroStep[]>([]);
  const [newAlexaText, setNewAlexaText] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(MACROS_KEY).then(raw => {
      if (raw) {
        try { setCustomMacros(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const saveCustom = async (macros: Macro[]) => {
    setCustomMacros(macros);
    await AsyncStorage.setItem(MACROS_KEY, JSON.stringify(macros));
  };

  const runMacro = async (macro: Macro) => {
    if (!isPremium && !macro.isBuiltIn) {
      setGateVisible(true);
      return;
    }
    haptics.medium();
    setRunning(macro.id);
    for (const step of macro.steps) {
      if (step.delay > 0) {
        await new Promise(r => setTimeout(r, step.delay));
      }
      if (step.command === 'alexa_text' && step.text) {
        await sendAlexaText(step.text);
      } else if (step.command !== 'alexa_text') {
        await sendCommand(step.command);
      }
    }
    haptics.success();
    setRunning(null);
  };

  const deleteMacro = (id: string) => {
    Alert.alert('Delete Macro', 'Remove this macro?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => saveCustom(customMacros.filter(m => m.id !== id)),
      },
    ]);
  };

  const createMacro = async () => {
    if (!newName.trim()) return;
    const macro: Macro = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      steps: newSteps,
    };
    await saveCustom([...customMacros, macro]);
    setCreateVisible(false);
    setNewName('');
    setNewSteps([]);
  };

  const addStep = (cmd: EchoCommand) => {
    setNewSteps(s => [...s, { command: cmd, delay: 500 }]);
  };

  const addAlexaStep = () => {
    if (!newAlexaText.trim()) return;
    setNewSteps(s => [...s, { command: 'alexa_text', text: newAlexaText.trim(), delay: 800 }]);
    setNewAlexaText('');
  };

  if (!isPremium) {
    return (
      <BackgroundView style={styles.bg}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.lockedCenter}>
            <LinearGradient colors={['#0D0020', '#1A0040']} style={styles.lockedCard}>
              <MaterialCommunityIcons name="lightning-bolt" size={52} color="#AA44FF" />
              <Text style={styles.lockedTitle}>Macros & Scenes</Text>
              <Text style={styles.lockedDesc}>
                Create multi-step automations: Movie Night, Sleep Mode, Morning Routine, and custom scenes with a single tap.
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
        <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} featureName="Macros & Scenes" />
      </BackgroundView>
    );
  }

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#AA44FF" />
            <Text style={styles.headerTitle}>Macros</Text>
          </View>
          <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.addBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={18} color="#AA44FF" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionLabel}>Built-in Scenes</Text>
          <View style={styles.grid}>
            {BUILT_IN_MACROS.map(macro => (
              <MacroCard
                key={macro.id}
                macro={macro}
                running={running === macro.id}
                onRun={() => runMacro(macro)}
              />
            ))}
          </View>

          {customMacros.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>My Macros</Text>
              <View style={styles.grid}>
                {customMacros.map(macro => (
                  <MacroCard
                    key={macro.id}
                    macro={macro}
                    running={running === macro.id}
                    onRun={() => runMacro(macro)}
                    onDelete={() => deleteMacro(macro.id)}
                  />
                ))}
              </View>
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Create macro modal */}
      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Macro</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  style={styles.input}
                  placeholder="My Macro"
                  placeholderTextColor={Colors.gray}
                />

                <Text style={styles.fieldLabel}>Color</Text>
                <View style={styles.colorRow}>
                  {ICON_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotSelected]}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Icon</Text>
                <View style={styles.iconRow}>
                  {ICONS.map(ic => (
                    <TouchableOpacity
                      key={ic}
                      onPress={() => setNewIcon(ic)}
                      style={[styles.iconBtn, newIcon === ic && { borderColor: newColor }]}
                    >
                      <MaterialCommunityIcons name={ic as never} size={20} color={newIcon === ic ? newColor : Colors.gray} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Steps ({newSteps.length})</Text>
                {newSteps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <MaterialCommunityIcons name="circle-small" size={18} color={newColor} />
                    <Text style={styles.stepText} numberOfLines={1}>
                      {step.command === 'alexa_text' ? `Alexa: "${step.text}"` : step.command}
                    </Text>
                    <TouchableOpacity onPress={() => setNewSteps(s => s.filter((_, j) => j !== i))}>
                      <MaterialCommunityIcons name="close" size={16} color={Colors.gray} />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.fieldLabel}>Add Command</Text>
                <View style={styles.commandGrid}>
                  {AVAILABLE_COMMANDS.map(c => (
                    <TouchableOpacity
                      key={c.cmd}
                      onPress={() => addStep(c.cmd)}
                      style={styles.commandChip}
                    >
                      <MaterialCommunityIcons name={c.icon as never} size={14} color={Colors.alexaBlue} />
                      <Text style={styles.commandChipText}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Alexa Command</Text>
                <View style={styles.alexaRow}>
                  <TextInput
                    value={newAlexaText}
                    onChangeText={setNewAlexaText}
                    style={[styles.input, { flex: 1 }]}
                    placeholder="e.g. Turn on the lights"
                    placeholderTextColor={Colors.gray}
                  />
                  <TouchableOpacity onPress={addAlexaStep} style={styles.addStepBtn}>
                    <MaterialCommunityIcons name="plus" size={20} color={Colors.amazonDark} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={createMacro}
                  style={[styles.createBtn, { backgroundColor: newColor }]}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={newIcon as never} size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Macro</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PremiumGate visible={gateVisible} onClose={() => setGateVisible(false)} featureName="Macros" />
    </BackgroundView>
  );
}

function MacroCard({
  macro, running, onRun, onDelete,
}: {
  macro: Macro;
  running: boolean;
  onRun: () => void;
  onDelete?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onRun}
      onLongPress={onDelete}
      style={[styles.card, { borderColor: `${macro.color}44` }]}
      activeOpacity={0.8}
      disabled={running}
    >
      <View style={[styles.cardIcon, { backgroundColor: `${macro.color}22` }]}>
        {running ? (
          <ActivityIndicator size="small" color={macro.color} />
        ) : (
          <MaterialCommunityIcons name={macro.icon as never} size={24} color={macro.color} />
        )}
      </View>
      <Text style={styles.cardName} numberOfLines={2}>{macro.name}</Text>
      <Text style={styles.cardSteps}>{macro.steps.length} steps</Text>
      {running && <Text style={styles.runningText}>Running...</Text>}
    </TouchableOpacity>
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
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: '#AA44FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: '#AA44FF', fontSize: 13, fontWeight: '600' },

  content: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  sectionLabel: {
    color: Colors.gray, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  card: {
    width: '47%', backgroundColor: Colors.amazonNavy, borderRadius: 16,
    padding: 14, borderWidth: 1, gap: 8, alignItems: 'center',
  },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardName: { color: Colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  cardSteps: { color: Colors.gray, fontSize: 11 },
  runningText: { color: Colors.alexaBlue, fontSize: 11, fontWeight: '600' },

  // Locked state
  lockedCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockedCard: {
    borderRadius: 24, padding: 32, alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#AA44FF44',
  },
  lockedTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  lockedDesc: { color: Colors.gray, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#AA44FF', borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  unlockBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.amazonNavy, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', borderWidth: 1, borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  modalContent: { padding: 16, gap: 12 },

  fieldLabel: { color: Colors.gray, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.amazonDark, color: Colors.white,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },

  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 2.5, borderColor: '#fff' },

  iconRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.amazonDark, borderWidth: 1.5, borderColor: Colors.border,
  },

  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.amazonDark, borderRadius: 10, padding: 10,
  },
  stepText: { color: Colors.lightGray, fontSize: 12, flex: 1 },

  commandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  commandChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.amazonDark, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  commandChipText: { color: Colors.lightGray, fontSize: 11, fontWeight: '600' },

  alexaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addStepBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.alexaBlue,
    alignItems: 'center', justifyContent: 'center',
  },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 8,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
