import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { useApp } from '../../context/AppContext';

export function ConnectionBadge() {
  const { isConnected, checkConnection, settings } = useApp();

  return (
    <TouchableOpacity onPress={checkConnection} style={styles.badge} activeOpacity={0.8}>
      <View style={[styles.dot, { backgroundColor: isConnected ? Colors.green : Colors.red }]} />
      <MaterialCommunityIcons
        name={isConnected ? 'wifi' : 'wifi-off'}
        size={14}
        color={isConnected ? Colors.green : Colors.gray}
      />
      <Text style={[styles.text, { color: isConnected ? Colors.green : Colors.gray }]}>
        {isConnected ? `${settings.deviceIp}` : 'Not connected'}
      </Text>
    </TouchableOpacity>
  );
}

const GENERATIONS: Record<string, string> = {
  show5: 'Show 5',
  show8: 'Show 8',
  show10: 'Show 10',
  show15: 'Show 15',
  show21: 'Show 21',
};

export function GenerationBadge() {
  const { settings } = useApp();
  const label = GENERATIONS[settings.echoGeneration] ?? 'Echo Show';
  const color = (Colors.echoGenerations as Record<string, string>)[settings.echoGeneration] ?? Colors.alexaBlue;

  return (
    <View style={[styles.genBadge, { borderColor: color }]}>
      <MaterialCommunityIcons name="tablet" size={12} color={color} />
      <Text style={[styles.genText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.amazonNavy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
  genBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.amazonNavy,
  },
  genText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
