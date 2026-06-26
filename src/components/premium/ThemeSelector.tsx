import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePremium } from '../../context/PremiumContext';
import { PremiumGate } from './PremiumGate';
import { THEMES, THEME_ORDER } from '../../utils/themes';
import { Colors } from '../../utils/colors';

export function ThemeSelector() {
  const { isPremium, selectedThemeId, setTheme } = usePremium();
  const [gateVisible, setGateVisible] = useState(false);

  const handleSelect = async (id: string) => {
    const theme = THEMES[id];
    if (!theme) return;
    if (theme.premium && !isPremium) {
      setGateVisible(true);
      return;
    }
    await setTheme(id);
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.row}>
          {THEME_ORDER.map(id => {
            const theme = THEMES[id];
            const isSelected = selectedThemeId === id;
            const locked = theme.premium && !isPremium;

            return (
              <TouchableOpacity
                key={id}
                onPress={() => handleSelect(id)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
              >
                <LinearGradient
                  colors={theme.preview}
                  style={styles.preview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {locked && (
                    <View style={styles.lockOverlay}>
                      <MaterialCommunityIcons name="lock" size={18} color="#fff" />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.cardBottom}>
                  <Text style={[styles.themeName, isSelected && { color: '#fff' }]} numberOfLines={1}>
                    {theme.name}
                  </Text>
                  {theme.premium ? (
                    <View style={styles.premBadge}>
                      <MaterialCommunityIcons name="crown" size={9} color="#FFD700" />
                      <Text style={styles.premText}>PRO</Text>
                    </View>
                  ) : (
                    <Text style={styles.freeText}>Free</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <PremiumGate
        visible={gateVisible}
        onClose={() => setGateVisible(false)}
        featureName="Premium Themes"
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -16 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 4 },

  card: {
    width: 96,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.amazonDark,
  },
  cardSelected: {
    borderColor: Colors.alexaBlue,
    shadowColor: Colors.alexaBlue,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },

  preview: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,202,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBottom: {
    padding: 8,
    gap: 3,
  },
  themeName: { color: Colors.lightGray, fontSize: 11, fontWeight: '600' },
  premBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(170,68,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  premText: { color: '#FFD700', fontSize: 9, fontWeight: '800' },
  freeText: { color: Colors.green, fontSize: 10, fontWeight: '600' },
});
