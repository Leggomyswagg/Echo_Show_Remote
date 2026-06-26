import { usePremium } from './PremiumContext';
import { AppTheme } from '../utils/themes';

export function useTheme(): AppTheme {
  const { currentTheme } = usePremium();
  return currentTheme;
}
