import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREMIUM_FEATURE_LIST = [
  'themes', 'fire_tv', 'macros', 'smart_home', 'now_playing',
  'parental_controls', 'drop_in', 'announcement', 'sleep_scheduler',
  'accessibility_mode', 'widget_customization', 'amazon_affiliate',
] as const;

export type PremiumFeature = typeof PREMIUM_FEATURE_LIST[number];

export const PRICING = {
  MONTHLY: '$1.99',
  ANNUAL: '$9.99',
  LIFETIME: '$19.99',
};

const PREMIUM_KEY = 'is_premium_v1';

export const PremiumStorage = {
  async getIsPremium(): Promise<boolean> {
    try { return (await AsyncStorage.getItem(PREMIUM_KEY)) === 'true'; }
    catch { return false; }
  },
  async setIsPremium(val: boolean): Promise<void> {
    try { await AsyncStorage.setItem(PREMIUM_KEY, String(val)); } catch {}
  },
};

// Stub IAP — replace with expo-in-app-purchases or react-native-iap
export async function purchaseLifetime(): Promise<boolean> {
  await PremiumStorage.setIsPremium(true);
  return true;
}

export async function purchaseAnnual(): Promise<boolean> {
  await PremiumStorage.setIsPremium(true);
  return true;
}

export async function purchaseMonthly(): Promise<boolean> {
  await PremiumStorage.setIsPremium(true);
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  // Real restore logic would check with the store
  return false;
}
