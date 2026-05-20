import React from 'react';
import { WidgetInfo, registerWidget } from '@bam.tech/react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EchoShowWidget } from './EchoShowWidget';

export async function renderWidget(widgetInfo: WidgetInfo): Promise<void> {
  const ip = (await AsyncStorage.getItem('device_ip')) ?? '192.168.1.100';
  const port = (await AsyncStorage.getItem('device_port')) ?? '8080';

  let connected = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(`http://${ip}:${port}/ping`, { signal: ctrl.signal });
    clearTimeout(t);
    connected = r.ok;
  } catch { /* offline */ }

  await registerWidget(
    widgetInfo,
    React.createElement(EchoShowWidget, { isConnected: connected, deviceName: 'Echo Show' })
  );
}
