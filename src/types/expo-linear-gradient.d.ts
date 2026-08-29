declare module 'expo-linear-gradient' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export interface LinearGradientProps extends ViewProps {
    colors: readonly string[];
    locations?: readonly number[] | null;
    start?: { x: number; y: number } | null;
    end?: { x: number; y: number } | null;
    dither?: boolean;
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}
