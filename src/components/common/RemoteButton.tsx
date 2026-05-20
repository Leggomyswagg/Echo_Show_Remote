import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { useHaptics } from '../../hooks/useHaptics';
import { EchoCommand } from '../../utils/echoControl';
import { useApp } from '../../context/AppContext';

type IconFamily = 'mci' | 'ion' | 'fa5';

interface RemoteButtonProps {
  command?: EchoCommand;
  label?: string;
  icon?: string;
  iconFamily?: IconFamily;
  iconSize?: number;
  size?: number;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  glowing?: boolean;
  payload?: Record<string, unknown>;
}

export function RemoteButton({
  command,
  label,
  icon,
  iconFamily = 'mci',
  iconSize = 22,
  size = 52,
  color = Colors.white,
  bgColor = Colors.buttonBg,
  borderColor,
  borderWidth = 0,
  borderRadius,
  style,
  labelStyle,
  disabled = false,
  onPress,
  onLongPress,
  glowing = false,
  payload,
}: RemoteButtonProps) {
  const { sendCommand } = useApp();
  const haptics = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    haptics.light();
    if (onPress) {
      onPress();
    } else if (command) {
      sendCommand(command, payload);
    }
  }, [haptics, onPress, command, sendCommand, payload]);

  const handleLongPress = useCallback(() => {
    haptics.medium();
    onLongPress?.();
  }, [haptics, onLongPress]);

  const renderIcon = () => {
    if (!icon) return null;
    const props = { name: icon as never, size: iconSize, color };
    switch (iconFamily) {
      case 'ion': return <Ionicons {...props} />;
      case 'fa5': return <FontAwesome5 {...props} />;
      default: return <MaterialCommunityIcons {...props} />;
    }
  };

  const br = borderRadius ?? size / 2;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {glowing && (
        <View style={[styles.glow, {
          width: size + 20,
          height: size + 20,
          borderRadius: br + 10,
          marginTop: -(size + 20) / 2,
          marginLeft: -(size + 20) / 2,
          position: 'absolute',
          top: '50%',
          left: '50%',
        }]} />
      )}
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: br,
            backgroundColor: disabled ? Colors.darkGray : bgColor,
            borderColor: borderColor ?? 'transparent',
            borderWidth,
          },
        ]}
      >
        {renderIcon()}
        {label !== undefined && (
          <Text style={[styles.label, { color, fontSize: size < 44 ? 10 : 12 }, labelStyle]}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  label: {
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  glow: {
    backgroundColor: Colors.alexaBlue,
    opacity: 0.15,
  },
});
