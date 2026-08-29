// TypeScript compatibility shims for the Expo 51 dependency set.
// Runtime behavior is unchanged; these declarations cover props/types that
// are valid in the native/web implementations but missing from older typings.

declare module 'expo-linear-gradient' {
  interface LinearGradientProps {
    borderRadius?: number;
  }
}

declare module '@bam.tech/react-native-android-widget' {
  export const FlexWidget: any;
  export const TextWidget: any;
  export const ImageWidget: any;
  export const PressableWidget: any;
  export const SwitchWidget: any;
  export const ScrollWidget: any;
  export const ListWidget: any;
  export const WidgetPreview: any;
  export const requestWidgetUpdate: any;
  export const registerWidgetTaskHandler: any;
}
