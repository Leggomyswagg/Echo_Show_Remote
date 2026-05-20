import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';
import { RemoteButton } from '../common/RemoteButton';

interface VolumeControlsProps {
  compact?: boolean;
  horizontal?: boolean;
}

export function VolumeControls({ compact = false, horizontal = false }: VolumeControlsProps) {
  const btnSize = compact ? 40 : 48;

  if (horizontal) {
    return (
      <View style={styles.horizontal}>
        <RemoteButton
          command="volume_down"
          icon="volume-minus"
          size={btnSize}
          bgColor={Colors.buttonBg}
          borderColor={Colors.border}
          borderWidth={1}
        />
        <RemoteButton
          command="mute"
          icon="volume-off"
          size={btnSize}
          bgColor={Colors.amazonBlue}
          borderColor={Colors.border}
          borderWidth={1}
          style={styles.muteH}
        />
        <RemoteButton
          command="volume_up"
          icon="volume-plus"
          size={btnSize}
          bgColor={Colors.buttonBg}
          borderColor={Colors.border}
          borderWidth={1}
        />
      </View>
    );
  }

  return (
    <View style={styles.vertical}>
      <RemoteButton
        command="volume_up"
        icon="volume-plus"
        size={btnSize}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={12}
      />
      <RemoteButton
        command="mute"
        icon="volume-off"
        size={btnSize - 4}
        bgColor={Colors.amazonBlue}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={10}
        style={styles.mute}
      />
      <RemoteButton
        command="volume_down"
        icon="volume-minus"
        size={btnSize}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
        borderRadius={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: {
    alignItems: 'center',
    gap: 8,
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mute: {
    marginVertical: 2,
  },
  muteH: {
    marginHorizontal: 2,
  },
});
