import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TouchableWithoutFeedback, ActivityIndicator, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePremium } from '../../context/PremiumContext';
import { Colors } from '../../utils/colors';
import { PRICING } from '../../utils/premiumFeatures';

interface Props {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

const FEATURE_LIST = [
  'Premium Themes (8 themes)',
  'Fire TV / Fire Stick Remote',
  'Smart Home Dashboard',
  'Macro / Scene Buttons',
  'Now Playing Screen',
  'Parental Controls & Kid Mode',
  'Drop In / Intercom',
  'Announcement Broadcast',
  'Sleep / Wake Scheduler',
  'Accessibility Mode',
  'Widget Customization',
  'Amazon Shopping Shortcuts',
];

export function PremiumGate({ visible, onClose, featureName }: Props) {
  const { buyLifetime, buyAnnual, buyMonthly, restore } = usePremium();
  const [loading, setLoading] = useState<'lifetime' | 'annual' | 'monthly' | 'restore' | null>(null);

  const unlockAlert = () =>
    Alert.alert('Welcome to Premium!', 'All features are now unlocked.', [
      { text: "Let's Go!", onPress: onClose },
    ]);

  const handleLifetime = async () => {
    setLoading('lifetime');
    const ok = await buyLifetime();
    setLoading(null);
    if (ok) unlockAlert();
  };

  const handleAnnual = async () => {
    setLoading('annual');
    const ok = await buyAnnual();
    setLoading(null);
    if (ok) unlockAlert();
  };

  const handleMonthly = async () => {
    setLoading('monthly');
    const ok = await buyMonthly();
    setLoading(null);
    if (ok) unlockAlert();
  };

  const handleRestore = async () => {
    setLoading('restore');
    const ok = await restore();
    setLoading(null);
    if (ok) {
      Alert.alert('Restored!', 'Your purchase has been restored.');
      onClose();
    } else {
      Alert.alert('No Purchase Found', 'No previous purchase was found for this account.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
      </TouchableWithoutFeedback>

      <View style={styles.centerer} pointerEvents="box-none">
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1A0A35', '#0D0020']}
            style={StyleSheet.absoluteFill}
            borderRadius={24}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.crownBg}>
              <MaterialCommunityIcons name="crown" size={28} color="#FFD700" />
            </View>
            <Text style={styles.title}>Echo Remote Premium</Text>
            {featureName && (
              <Text style={styles.subtitle}>Unlock <Text style={styles.featureHighlight}>{featureName}</Text> and more</Text>
            )}
          </View>

          {/* Feature list */}
          <View style={styles.features}>
            {FEATURE_LIST.map(f => (
              <View key={f} style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#AA44FF" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Annual — hero option */}
          <View style={styles.bestValueWrapper}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>MOST POPULAR</Text>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAnnual}
              activeOpacity={0.85}
              disabled={loading !== null}
            >
              <LinearGradient
                colors={['#AA44FF', '#7B00FF']}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
              />
              {loading === 'annual' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{PRICING.ANNUAL} / year</Text>
                  <Text style={styles.primaryBtnSub}>Under $1/month · Cancel anytime</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Lifetime + Monthly row */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleLifetime}
              activeOpacity={0.85}
              disabled={loading !== null}
            >
              {loading === 'lifetime' ? (
                <ActivityIndicator color="#AA44FF" />
              ) : (
                <>
                  <Text style={styles.secondaryBtnText}>{PRICING.LIFETIME}</Text>
                  <Text style={styles.secondaryBtnSub}>Lifetime access</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleMonthly}
              activeOpacity={0.85}
              disabled={loading !== null}
            >
              {loading === 'monthly' ? (
                <ActivityIndicator color="#AA44FF" />
              ) : (
                <>
                  <Text style={styles.secondaryBtnText}>{PRICING.MONTHLY} / mo</Text>
                  <Text style={styles.secondaryBtnSub}>Monthly</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Restore + close */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore} disabled={loading !== null}>
              <Text style={styles.restoreText}>
                {loading === 'restore' ? 'Restoring...' : 'Restore Purchase'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#AA44FF44',
    padding: 24,
    gap: 16,
  },
  header: { alignItems: 'center', gap: 8 },
  crownBg: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(170,68,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { color: Colors.gray, fontSize: 14, textAlign: 'center' },
  featureHighlight: { color: '#AA44FF', fontWeight: '700' },

  features: {
    backgroundColor: 'rgba(170,68,255,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: '#DDAAFF', fontSize: 13 },

  bestValueWrapper: { gap: 0 },
  bestValueBadge: {
    alignSelf: 'center', backgroundColor: '#FFD700',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: -1, zIndex: 1,
  },
  bestValueText: { color: '#1A0A35', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  primaryBtn: {
    height: 64, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', gap: 2,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  primaryBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1, height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#AA44FF',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  secondaryBtnText: { color: '#AA44FF', fontSize: 15, fontWeight: '700' },
  secondaryBtnSub: { color: Colors.gray, fontSize: 11 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restoreText: { color: Colors.gray, fontSize: 13 },
  closeBtn: { padding: 4 },
});
