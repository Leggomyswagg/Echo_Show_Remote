import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useOrientation } from '../hooks/useOrientation';
import { BackgroundView } from '../components/common/BackgroundView';
import { DPad } from '../components/remote/DPad';
import { MediaControls } from '../components/remote/MediaControls';
import { VolumeControls } from '../components/remote/VolumeControls';
import { ActionButtons, TopControls } from '../components/remote/ActionButtons';
import { AlexaButton } from '../components/remote/AlexaButton';
import { SmartAppRow } from '../components/remote/SmartAppRow';
import { FullKeyboard } from '../components/keyboard/FullKeyboard';
import { AlexaCommandModal } from '../components/alexa/AlexaCommandModal';
import { ConnectionBadge, GenerationBadge } from '../components/common/ConnectionBadge';
import { Colors } from '../utils/colors';

export function RemoteScreen() {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';
  const [alexaModalVisible, setAlexaModalVisible] = useState(false);

  const openAlexa = useCallback(() => setAlexaModalVisible(true), []);
  const closeAlexa = useCallback(() => setAlexaModalVisible(false), []);

  return (
    <BackgroundView style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Echo Show</Text>
            <GenerationBadge />
          </View>
          <ConnectionBadge />
        </View>

        {isLandscape ? (
          <LandscapeLayout onAlexaPress={openAlexa} />
        ) : (
          <PortraitLayout onAlexaPress={openAlexa} />
        )}

      </SafeAreaView>

      <AlexaCommandModal visible={alexaModalVisible} onClose={closeAlexa} />
    </BackgroundView>
  );
}

/* ─── Portrait Layout ─────────────────────────────────── */
function PortraitLayout({ onAlexaPress }: { onAlexaPress: () => void }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.portraitContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top system controls */}
      <Section>
        <TopControls />
      </Section>

      {/* D-Pad + Volume side-by-side */}
      <View style={styles.centerRow}>
        <DPad size={180} />
        <VolumeControls />
      </View>

      {/* Navigation actions */}
      <Section>
        <ActionButtons />
      </Section>

      {/* Media controls */}
      <Section label="Playback">
        <MediaControls />
      </Section>

      {/* Alexa button — center hero */}
      <Section label="Alexa">
        <View style={styles.alexaSection}>
          <AlexaButton onPress={onAlexaPress} />
        </View>
      </Section>

      {/* Smart apps */}
      <Section label="Apps & Shortcuts">
        <SmartAppRow />
      </Section>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

/* ─── Landscape Layout ────────────────────────────────── */
function LandscapeLayout({ onAlexaPress }: { onAlexaPress: () => void }) {
  return (
    <View style={styles.landscapeWrapper}>
      {/* Left column: mini remote */}
      <View style={styles.landscapeLeft}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.landscapeLeftContent}>
          <TopControls compact />
          <View style={{ height: 10 }} />
          <View style={styles.centerRow}>
            <DPad size={130} compact />
            <VolumeControls compact />
          </View>
          <View style={{ height: 10 }} />
          <ActionButtons compact />
          <View style={{ height: 10 }} />
          <MediaControls compact />
          <View style={{ height: 10 }} />
          <AlexaButton onPress={onAlexaPress} compact style={styles.compactAlexa} />
          <View style={{ height: 10 }} />
          <SmartAppRow compact />
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Right column: keyboard */}
      <View style={styles.landscapeRight}>
        <Text style={styles.keyboardLabel}>Keyboard</Text>
        <FullKeyboard compact />
      </View>
    </View>
  );
}

/* ─── Helper ──────────────────────────────────────────── */
function Section({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <View style={styles.section}>
      {label && <Text style={styles.sectionLabel}>{label}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  portraitContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  section: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  alexaSection: {
    paddingVertical: 10,
  },
  bottomPad: { height: 20 },

  // Landscape
  landscapeWrapper: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  landscapeLeft: {
    width: '42%',
  },
  landscapeLeftContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 10,
    opacity: 0.5,
  },
  landscapeRight: {
    flex: 1,
    paddingTop: 4,
    paddingLeft: 8,
  },
  keyboardLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  compactAlexa: {
    paddingVertical: 4,
  },
});
