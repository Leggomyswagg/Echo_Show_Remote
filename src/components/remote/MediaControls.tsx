import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';
import { RemoteButton } from '../common/RemoteButton';

interface MediaControlsProps {
  compact?: boolean;
}

export function MediaControls({ compact = false }: MediaControlsProps) {
  const btnSize = compact ? 40 : 52;
  const playSize = compact ? 50 : 64;

  return (
    <View style={styles.row}>
      <RemoteButton
        command="rewind"
        icon="rewind-10"
        size={btnSize}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
      />
      <RemoteButton
        command="play_pause"
        icon="play-pause"
        size={playSize}
        bgColor={Colors.amazonOrange}
        color={Colors.amazonDark}
        borderRadius={playSize / 2}
        style={styles.playBtn}
      />
      <RemoteButton
        command="fast_forward"
        icon="fast-forward-10"
        size={btnSize}
        bgColor={Colors.buttonBg}
        borderColor={Colors.border}
        borderWidth={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  playBtn: {
    shadowColor: Colors.amazonOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
