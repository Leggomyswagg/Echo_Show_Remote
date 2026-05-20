import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../utils/colors';
import { RemoteButton } from '../common/RemoteButton';

interface SmartAppRowProps {
  compact?: boolean;
}

const APPS = [
  { command: 'prime_video' as const, icon: 'television-play', color: '#00A8E1' },
  { command: 'netflix' as const, icon: 'netflix', color: '#E50914' },
  { command: 'disney_plus' as const, icon: 'television-shimmer', color: '#1133A5' },
  { command: 'hulu' as const, icon: 'television', color: '#1CE783' },
  { command: 'spotify' as const, icon: 'spotify', color: '#1DB954' },
  { command: 'amazon_music' as const, icon: 'music', color: '#FF9900' },
  { command: 'youtube' as const, icon: 'youtube', color: '#FF0000' },
  { command: 'twitch' as const, icon: 'twitch', color: '#9146FF' },
] as const;

const SMART_SHORTCUTS = [
  { command: 'smart_home' as const, icon: 'home-automation', color: Colors.alexaBlue, label: 'Smart Home' },
  { command: 'shopping' as const, icon: 'cart', color: Colors.amazonOrange, label: 'Shop' },
  { command: 'calendar' as const, icon: 'calendar', color: '#4CAF50', label: 'Calendar' },
  { command: 'communication' as const, icon: 'phone', color: '#9C27B0', label: 'Calls' },
] as const;

export function SmartAppRow({ compact = false }: SmartAppRowProps) {
  const size = compact ? 40 : 48;
  const borderRadius = 12;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.appsRow}
      >
        {APPS.map(app => (
          <RemoteButton
            key={app.command}
            command={app.command}
            icon={app.icon}
            size={size}
            bgColor={`${app.color}22`}
            borderColor={app.color}
            borderWidth={1.5}
            borderRadius={borderRadius}
            color={app.color}
            iconSize={compact ? 18 : 22}
            style={styles.appBtn}
          />
        ))}
      </ScrollView>

      <View style={styles.shortcutsRow}>
        {SMART_SHORTCUTS.map(s => (
          <RemoteButton
            key={s.command}
            command={s.command}
            icon={s.icon}
            label={s.label}
            size={compact ? 44 : 52}
            bgColor={`${s.color}22`}
            borderColor={s.color}
            borderWidth={1}
            borderRadius={10}
            color={s.color}
            iconSize={compact ? 16 : 20}
            style={styles.shortcutBtn}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  appsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  appBtn: {
    marginHorizontal: 0,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  shortcutBtn: {},
});
