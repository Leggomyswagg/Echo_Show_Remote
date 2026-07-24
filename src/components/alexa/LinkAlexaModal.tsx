import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Linking, Alert, TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../utils/colors';

/**
 * Alexa Skill linking flow:
 *   1. User taps "Link Alexa" — deep-links to alexa.amazon.com/spa/index.html#skills/entity/...
 *   2. In the Alexa app, they Enable Skill + Link Account
 *   3. Amazon's account-linking flow hits our /api/alexa/link-account
 *   4. We generate a userId + display it as a pairing code
 *   5. User pastes the pairing code here to attach it to this device
 */

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SKILL_URL = 'https://alexa.amazon.com/spa/index.html#skills/entity/echo-show-remote';
const CLOUD_URL = 'https://echo-show-remote.vercel.app';

export function LinkAlexaModal({ visible, onClose }: Props) {
  const { updateSettings, settings } = useApp();
  const [step, setStep] = useState<'intro' | 'code' | 'success'>('intro');
  const [pairingCode, setPairingCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(settings.alexaUserId ? 'success' : 'intro');
      setPairingCode('');
    }
  }, [visible, settings.alexaUserId]);

  const openAlexaApp = useCallback(() => {
    Linking.openURL(SKILL_URL).catch(() => {
      Alert.alert(
        'Open Alexa App',
        'Please open the Alexa app manually, then search for "Echo Show Remote" in Skills & Games and tap Enable.'
      );
    });
    setStep('code');
  }, []);

  const verifyPairingCode = async () => {
    const code = pairingCode.trim();
    if (code.length < 6) {
      Alert.alert('Invalid code', 'Please enter the pairing code shown after linking.');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`${CLOUD_URL}/api/alexa/verify-pairing?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setVerifying(false);
      if (data.userId) {
        await updateSettings({ alexaUserId: data.userId, backendMode: 'skill' });
        setStep('success');
      } else {
        Alert.alert('Not linked yet', data.error ?? 'Pairing code not found. Complete Alexa Skill linking first.');
      }
    } catch {
      setVerifying(false);
      Alert.alert('Connection error', 'Could not reach the pairing server. Check your internet connection.');
    }
  };

  const unlink = () => {
    Alert.alert('Unlink Alexa?', 'You\'ll need to link again to control your Echo devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          await updateSettings({ alexaUserId: null });
          setStep('intro');
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={styles.centerer} pointerEvents="box-none">
        <View style={styles.sheet}>
          <LinearGradient colors={['#001A2E', '#003A5C']} style={StyleSheet.absoluteFill} borderRadius={24} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.alexaCircle}>
              <MaterialCommunityIcons name="microphone" size={28} color="#fff" />
            </View>
            <Text style={styles.title}>
              {step === 'success' ? 'Alexa Linked' : 'Link Your Alexa Account'}
            </Text>
          </View>

          {step === 'intro' && (
            <>
              <Text style={styles.body}>
                To control your Echo devices, enable the Echo Show Remote Skill in the Alexa app and link your account.
              </Text>
              <View style={styles.steps}>
                {['Tap "Enable Skill" below', 'Sign in with Amazon in the Alexa app', 'Come back and paste the pairing code'].map((s, i) => (
                  <View key={i} style={styles.step}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                    <Text style={styles.stepText}>{s}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={openAlexaApp} activeOpacity={0.85}>
                <MaterialCommunityIcons name="open-in-new" size={16} color="#001A2E" />
                <Text style={styles.primaryBtnText}>Enable Skill in Alexa App</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={styles.body}>
                After linking in the Alexa app, you'll see a 6-digit pairing code. Enter it here to finish setup.
              </Text>
              <TextInput
                value={pairingCode}
                onChangeText={t => setPairingCode(t.toUpperCase())}
                style={styles.codeInput}
                placeholder="ABC123"
                placeholderTextColor={Colors.gray}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={verifyPairingCode}
                activeOpacity={0.85}
                disabled={verifying}
              >
                {verifying
                  ? <ActivityIndicator color="#001A2E" />
                  : <Text style={styles.primaryBtnText}>Verify & Finish</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('intro')} style={styles.backLink}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons name="check-circle" size={60} color={Colors.green} />
              </View>
              <Text style={styles.body}>
                Your Alexa account is linked. Every command from this app now goes through the Alexa Skill to your Echo devices.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={unlink} style={styles.unlinkBtn}>
                <Text style={styles.unlinkText}>Unlink Alexa Account</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color={Colors.gray} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: {
    width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: '#00CAFF44', padding: 24, gap: 16,
  },
  header: { alignItems: 'center', gap: 10 },
  alexaCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#00CAFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00CAFF', shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  body: { color: '#AAE8FF', fontSize: 14, lineHeight: 20, textAlign: 'center' },

  steps: { gap: 10, marginVertical: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,202,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#00CAFF', fontSize: 12, fontWeight: '800' },
  stepText: { color: '#fff', fontSize: 13, flex: 1 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, backgroundColor: '#00CAFF',
  },
  primaryBtnText: { color: '#001A2E', fontSize: 15, fontWeight: '800' },

  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center',
    letterSpacing: 4, borderWidth: 1, borderColor: 'rgba(0,202,255,0.3)',
    fontFamily: 'monospace',
  },
  backLink: { alignItems: 'center', paddingTop: 4 },
  backLinkText: { color: Colors.gray, fontSize: 13 },

  successIcon: { alignItems: 'center', marginVertical: 8 },
  unlinkBtn: { alignItems: 'center', paddingTop: 4 },
  unlinkText: { color: Colors.red, fontSize: 13, fontWeight: '600' },

  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 6 },
});
