import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { useApp } from '../../context/AppContext';
import { useHaptics } from '../../hooks/useHaptics';

const QUICK_COMMANDS = [
  'Play music',
  'Pause',
  'Next song',
  'Volume up',
  'Turn off lights',
  'Turn on lights',
  'What\'s the weather?',
  'Set a timer for 10 minutes',
  'Add milk to my shopping list',
  'Show me my calendar',
  'Call home',
  'Play Amazon Prime Video',
  'Open Netflix',
  'Show security cameras',
  'Good morning',
  'Good night',
];

interface AlexaCommandModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AlexaCommandModal({ visible, onClose }: AlexaCommandModalProps) {
  const { sendAlexaText, commandHistory } = useApp();
  const haptics = useHaptics();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSend = useCallback(async (command?: string) => {
    const cmd = (command ?? text).trim();
    if (!cmd) return;
    haptics.medium();
    setSending(true);
    setFeedback(null);
    const result = await sendAlexaText(cmd);
    setSending(false);
    setFeedback({ ok: result.success, msg: result.success ? 'Sent to Alexa!' : (result.message ?? 'Failed') });
    if (result.success) {
      setText('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    } else {
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [text, haptics, sendAlexaText, onClose]);

  const allSuggestions = [
    ...commandHistory.slice(0, 5).map(c => ({ cmd: c, isHistory: true })),
    ...QUICK_COMMANDS
      .filter(c => !commandHistory.includes(c))
      .map(c => ({ cmd: c, isHistory: false })),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvContainer}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.alexaIndicator} />
              <Text style={styles.title}>Ask Alexa</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.lightGray} />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="microphone-outline"
                size={22}
                color={Colors.alexaBlue}
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="Type a command..."
                placeholderTextColor={Colors.gray}
                style={styles.input}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!sending}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!text.trim() || sending}
                style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={Colors.amazonDark} />
                ) : (
                  <MaterialCommunityIcons name="send" size={20} color={Colors.amazonDark} />
                )}
              </TouchableOpacity>
            </View>

            {/* Feedback */}
            {feedback && (
              <View style={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackErr]}>
                <MaterialCommunityIcons
                  name={feedback.ok ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={feedback.ok ? Colors.green : Colors.red}
                />
                <Text style={[styles.feedbackText, { color: feedback.ok ? Colors.green : Colors.red }]}>
                  {feedback.msg}
                </Text>
              </View>
            )}

            {/* Quick commands */}
            <Text style={styles.sectionLabel}>
              {commandHistory.length > 0 ? 'Recent & Quick Commands' : 'Quick Commands'}
            </Text>
            <FlatList
              data={allSuggestions}
              keyExtractor={item => item.cmd}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSend(item.cmd)}
                  style={styles.suggestion}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.isHistory ? 'history' : 'lightning-bolt'}
                    size={14}
                    color={item.isHistory ? Colors.gray : Colors.alexaBlue}
                    style={styles.suggIcon}
                  />
                  <Text style={styles.suggText}>{item.cmd}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggList}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kvContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.amazonNavy,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  alexaIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.alexaBlue,
    marginRight: 10,
    shadowColor: Colors.alexaBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  title: {
    flex: 1,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: Colors.amazonBlue,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.alexaBlue,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    paddingVertical: 12,
  },
  sendBtn: {
    backgroundColor: Colors.alexaBlue,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  feedbackOk: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
  },
  feedbackErr: {
    backgroundColor: 'rgba(232, 39, 44, 0.15)',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  suggList: {
    maxHeight: 220,
    paddingHorizontal: 16,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: Colors.amazonDark,
  },
  suggIcon: {
    marginRight: 10,
  },
  suggText: {
    color: Colors.white,
    fontSize: 14,
  },
});
