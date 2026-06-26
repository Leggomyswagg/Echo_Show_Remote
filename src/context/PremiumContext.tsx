import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PremiumStorage, purchaseOneTime, purchaseMonthly, restorePurchases,
} from '../utils/premiumFeatures';
import { THEMES, AppTheme } from '../utils/themes';

const THEME_KEY = 'selected_theme_v1';
const PIN_KEY = 'parental_pin_v1';
const SLEEP_KEY = 'sleep_schedule_v1';
const ACCESSIBILITY_KEY = 'accessibility_mode_v1';

export interface SleepSchedule {
  enabled: boolean;
  sleepTime: string;  // "HH:MM"
  wakeTime: string;   // "HH:MM"
}

interface PremiumContextValue {
  isPremium: boolean;
  selectedThemeId: string;
  currentTheme: AppTheme;
  setTheme: (id: string) => Promise<void>;
  buyOneTime: () => Promise<boolean>;
  buyMonthly: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  setPremium: (val: boolean) => Promise<void>;
  // Parental controls
  parentalPin: string | null;
  setParentalPin: (pin: string | null) => Promise<void>;
  kidModeActive: boolean;
  setKidMode: (val: boolean) => void;
  // Accessibility
  accessibilityMode: boolean;
  setAccessibilityMode: (val: boolean) => Promise<void>;
  // Sleep scheduler
  sleepSchedule: SleepSchedule;
  setSleepSchedule: (s: SleepSchedule) => Promise<void>;
}

const DEFAULT_SLEEP: SleepSchedule = {
  enabled: false, sleepTime: '22:00', wakeTime: '07:00',
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState('default');
  const [parentalPin, setParentalPinState] = useState<string | null>(null);
  const [kidModeActive, setKidModeActive] = useState(false);
  const [accessibilityMode, setAccessibilityModeState] = useState(false);
  const [sleepSchedule, setSleepScheduleState] = useState<SleepSchedule>(DEFAULT_SLEEP);

  useEffect(() => {
    Promise.all([
      PremiumStorage.getIsPremium(),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(PIN_KEY),
      AsyncStorage.getItem(ACCESSIBILITY_KEY),
      AsyncStorage.getItem(SLEEP_KEY),
    ]).then(([prem, theme, pin, a11y, sleep]) => {
      if (prem) setIsPremiumState(true);
      if (theme && THEMES[theme]) setSelectedThemeId(theme);
      if (pin) setParentalPinState(pin);
      if (a11y === 'true') setAccessibilityModeState(true);
      if (sleep) {
        try { setSleepScheduleState(JSON.parse(sleep)); } catch {}
      }
    });
  }, []);

  const setTheme = useCallback(async (id: string) => {
    if (THEMES[id]) {
      setSelectedThemeId(id);
      await AsyncStorage.setItem(THEME_KEY, id);
    }
  }, []);

  const buyOneTime = useCallback(async () => {
    const ok = await purchaseOneTime();
    if (ok) setIsPremiumState(true);
    return ok;
  }, []);

  const buyMonthly = useCallback(async () => {
    const ok = await purchaseMonthly();
    if (ok) setIsPremiumState(true);
    return ok;
  }, []);

  const restore = useCallback(async () => {
    const ok = await restorePurchases();
    if (ok) setIsPremiumState(true);
    return ok;
  }, []);

  const setPremium = useCallback(async (val: boolean) => {
    setIsPremiumState(val);
    await PremiumStorage.setIsPremium(val);
  }, []);

  const setParentalPin = useCallback(async (pin: string | null) => {
    setParentalPinState(pin);
    if (pin) await AsyncStorage.setItem(PIN_KEY, pin);
    else await AsyncStorage.removeItem(PIN_KEY);
  }, []);

  const setAccessibilityMode = useCallback(async (val: boolean) => {
    setAccessibilityModeState(val);
    await AsyncStorage.setItem(ACCESSIBILITY_KEY, String(val));
  }, []);

  const setSleepSchedule = useCallback(async (s: SleepSchedule) => {
    setSleepScheduleState(s);
    await AsyncStorage.setItem(SLEEP_KEY, JSON.stringify(s));
  }, []);

  const currentTheme = isPremium && THEMES[selectedThemeId]
    ? THEMES[selectedThemeId]
    : THEMES['default'];

  return (
    <PremiumContext.Provider value={{
      isPremium,
      selectedThemeId: currentTheme.id,
      currentTheme,
      setTheme,
      buyOneTime,
      buyMonthly,
      restore,
      setPremium,
      parentalPin,
      setParentalPin,
      kidModeActive,
      setKidMode: setKidModeActive,
      accessibilityMode,
      setAccessibilityMode,
      sleepSchedule,
      setSleepSchedule,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
