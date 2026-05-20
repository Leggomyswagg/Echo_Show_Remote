import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const isTablet = SCREEN_W >= 768 || SCREEN_H >= 768;
export const isIpad = Platform.OS === 'ios' && isTablet;
export const isAndroidTablet = Platform.OS === 'android' && isTablet;

export const isSmallPhone = SCREEN_W < 375;
export const isLargePhone = SCREEN_W >= 414;

// Scale a size relative to 375pt base
export function s(size: number): number {
  const scale = SCREEN_W / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

// Scale vertically relative to 812pt base
export function vs(size: number): number {
  const scale = SCREEN_H / 812;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

// Moderate scale (less aggressive than s())
export function ms(size: number, factor = 0.5): number {
  return Math.round(size + (s(size) - size) * factor);
}

export function tabletScale(size: number): number {
  return isTablet ? size * 1.3 : size;
}

export function getRemoteLayout(width: number, height: number) {
  const landscape = width > height;
  const tablet = width >= 768;
  return {
    landscape,
    tablet,
    dpadSize: tablet ? (landscape ? 200 : 220) : landscape ? 130 : 180,
    buttonSize: tablet ? 56 : landscape ? 40 : 48,
    playButtonSize: tablet ? 72 : landscape ? 50 : 64,
    keyWidth: tablet ? 42 : landscape ? 30 : 34,
    keyHeight: tablet ? 48 : landscape ? 36 : 42,
    fontSize: tablet ? 16 : 14,
    iconSize: tablet ? 26 : 22,
  };
}

export { SCREEN_W, SCREEN_H };
