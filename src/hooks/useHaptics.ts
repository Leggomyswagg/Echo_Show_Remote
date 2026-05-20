import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';

export function useHaptics() {
  const { settings } = useApp();

  const light = useCallback(() => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [settings.hapticsEnabled]);

  const medium = useCallback(() => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [settings.hapticsEnabled]);

  const heavy = useCallback(() => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [settings.hapticsEnabled]);

  const success = useCallback(() => {
    if (settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [settings.hapticsEnabled]);

  const error = useCallback(() => {
    if (settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [settings.hapticsEnabled]);

  return { light, medium, heavy, success, error };
}
