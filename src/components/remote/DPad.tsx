import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { useApp } from '../../context/AppContext';
import { useHaptics } from '../../hooks/useHaptics';

interface DPadProps {
  size?: number;
  compact?: boolean;
}

export function DPad({ size = 170, compact = false }: DPadProps) {
  const { sendCommand } = useApp();
  const haptics = useHaptics();
  const btnSize = compact ? 38 : 48;
  const centerSize = compact ? 50 : 64;
  const iconSize = compact ? 18 : 24;

  const send = (cmd: Parameters<typeof sendCommand>[0]) => {
    haptics.light();
    sendCommand(cmd);
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Up */}
      <View style={[styles.upBtn, { top: 0, left: (size - btnSize) / 2 }]}>
        <TouchableOpacity
          onPress={() => send('up')}
          style={[styles.arrowBtn, { width: btnSize, height: btnSize, borderRadius: 8 }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-up" size={iconSize + 4} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Down */}
      <View style={[styles.downBtn, { bottom: 0, left: (size - btnSize) / 2 }]}>
        <TouchableOpacity
          onPress={() => send('down')}
          style={[styles.arrowBtn, { width: btnSize, height: btnSize, borderRadius: 8 }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-down" size={iconSize + 4} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Left */}
      <View style={[styles.leftBtn, { left: 0, top: (size - btnSize) / 2 }]}>
        <TouchableOpacity
          onPress={() => send('left')}
          style={[styles.arrowBtn, { width: btnSize, height: btnSize, borderRadius: 8 }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={iconSize + 4} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Right */}
      <View style={[styles.rightBtn, { right: 0, top: (size - btnSize) / 2 }]}>
        <TouchableOpacity
          onPress={() => send('right')}
          style={[styles.arrowBtn, { width: btnSize, height: btnSize, borderRadius: 8 }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-right" size={iconSize + 4} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Center OK */}
      <View style={[styles.center, {
        left: (size - centerSize) / 2,
        top: (size - centerSize) / 2,
      }]}>
        <TouchableOpacity
          onPress={() => send('select')}
          onLongPress={() => { haptics.medium(); sendCommand('menu'); }}
          style={[styles.centerBtn, { width: centerSize, height: centerSize }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="checkbox-blank-circle" size={compact ? 10 : 14} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Ring decoration */}
      <View style={[styles.ring, {
        width: size,
        height: size,
        borderRadius: size / 2,
      }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.border,
    opacity: 0.3,
  },
  upBtn: { position: 'absolute' },
  downBtn: { position: 'absolute' },
  leftBtn: { position: 'absolute' },
  rightBtn: { position: 'absolute' },
  center: { position: 'absolute' },
  arrowBtn: {
    backgroundColor: Colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  centerBtn: {
    backgroundColor: Colors.amazonBlue,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.alexaBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
