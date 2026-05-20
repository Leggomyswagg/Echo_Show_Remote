import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';
import { RemoteButton } from '../common/RemoteButton';

interface ActionButtonsProps {
  compact?: boolean;
}

export function ActionButtons({ compact = false }: ActionButtonsProps) {
  const size = compact ? 38 : 46;

  return (
    <View style={styles.row}>
      <RemoteButton
        command="back"
        icon="arrow-left"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="home"
        icon="home"
        size={size}
        bgColor={Colors.amazonBlue}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="menu"
        icon="dots-horizontal"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="settings"
        icon="cog"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
    </View>
  );
}

export function TopControls({ compact = false }: ActionButtonsProps) {
  const size = compact ? 36 : 42;

  return (
    <View style={styles.topRow}>
      <RemoteButton
        command="power"
        icon="power"
        size={size}
        bgColor={Colors.powerRed}
        borderRadius={10}
        color={Colors.white}
      />
      <RemoteButton
        command="brightness_up"
        icon="brightness-6"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="brightness_down"
        icon="brightness-4"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="microphone"
        icon="microphone"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="camera"
        icon="camera"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
      <RemoteButton
        command="do_not_disturb"
        icon="bell-off"
        size={size}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
});
