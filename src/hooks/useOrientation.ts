import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    const { width, height } = Dimensions.get('window');
    return width > height ? 'landscape' : 'portrait';
  });

  useEffect(() => {
    const update = ({ window }: { window: { width: number; height: number } }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };

    const sub = Dimensions.addEventListener('change', update);

    const subOrientation = ScreenOrientation.addOrientationChangeListener(event => {
      const o = event.orientationInfo.orientation;
      if (
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      ) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    });

    return () => {
      sub.remove();
      ScreenOrientation.removeOrientationChangeListener(subOrientation);
    };
  }, []);

  return orientation;
}
