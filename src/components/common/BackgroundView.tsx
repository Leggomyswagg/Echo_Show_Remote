import React, { ReactNode } from 'react';
import { StyleSheet, View, ImageBackground, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../utils/colors';

interface BackgroundViewProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function BackgroundView({ children, style }: BackgroundViewProps) {
  const { settings } = useApp();
  const theme = useTheme();

  const inner = (
    <View style={[StyleSheet.absoluteFill, style]}>
      {children}
    </View>
  );

  if (settings.backgroundType === 'image' && settings.backgroundImage) {
    return (
      <ImageBackground
        source={{ uri: settings.backgroundImage }}
        style={[styles.container, style]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        {children}
      </ImageBackground>
    );
  }

  if (settings.backgroundType === 'gradient' && settings.backgroundGradient.length >= 2) {
    return (
      <LinearGradient
        colors={settings.backgroundGradient as [string, string, ...string[]]}
        style={[styles.container, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  if (settings.backgroundType === 'color') {
    return (
      <View style={[styles.container, { backgroundColor: settings.backgroundColor }, style]}>
        {children}
      </View>
    );
  }

  // Default: use active theme gradient
  const [c1, c2] = theme.colors.bgGradient;
  return (
    <LinearGradient
      colors={[c1, c2]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {inner}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
