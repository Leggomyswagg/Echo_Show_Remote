import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../utils/colors';
import { useHaptics } from '../../hooks/useHaptics';

interface AlexaButtonProps {
  onPress: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

export function AlexaButton({ onPress, compact = false, style }: AlexaButtonProps) {
  const haptics = useHaptics();
  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handlePressIn = useCallback(() => {
    startPulse();
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
  }, [scale, startPulse]);

  const handlePressOut = useCallback(() => {
    pulse.stopAnimation();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  }, [scale, pulse]);

  const handlePress = useCallback(() => {
    haptics.heavy();
    onPress();
  }, [haptics, onPress]);

  const btnSize = compact ? 70 : 90;
  const iconSize = compact ? 28 : 36;

  return (
    <View style={[styles.container, style]}>
      {/* Pulse rings */}
      <Animated.View style={[
        styles.pulseRing,
        {
          width: btnSize + 30,
          height: btnSize + 30,
          borderRadius: (btnSize + 30) / 2,
          transform: [{ scale: pulse }],
        }
      ]} />
      <Animated.View style={[
        styles.pulseRing2,
        {
          width: btnSize + 15,
          height: btnSize + 15,
          borderRadius: (btnSize + 15) / 2,
          transform: [{ scale: pulse }],
        }
      ]} />

      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
          style={styles.touchArea}
        >
          <LinearGradient
            colors={['#00E5FF', '#00CAFF', '#0095C5']}
            style={[styles.btn, { width: btnSize, height: btnSize, borderRadius: btnSize / 2 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons
              name="microphone-outline"
              size={iconSize}
              color={Colors.amazonDark}
            />
            {!compact && (
              <Text style={styles.label}>Alexa</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {!compact && (
        <Text style={styles.hint}>Tap to type a command</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchArea: {
    alignItems: 'center',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.alexaBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  label: {
    color: Colors.amazonDark,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 1,
  },
  hint: {
    color: Colors.alexaBlue,
    fontSize: 11,
    marginTop: 8,
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: Colors.alexaBlue,
    opacity: 0.08,
  },
  pulseRing2: {
    position: 'absolute',
    backgroundColor: Colors.alexaBlue,
    opacity: 0.12,
  },
});
