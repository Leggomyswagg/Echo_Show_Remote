/**
 * Android widget task handler.
 * Registered as the background handler for @bam.tech/react-native-android-widget.
 * Each clickAction fired from EchoShowWidget arrives here.
 */
import { WidgetTaskHandlerProps, WidgetInfo } from '@bam.tech/react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTION_COMMAND: Record<string, string> = {
  PLAY_PAUSE: 'play_pause',
  REWIND: 'rewind',
  FAST_FORWARD: 'fast_forward',
  MUTE: 'mute',
  VOL_UP: 'volume_up',
  VOL_DOWN: 'volume_down',
  HOME: 'home',
  BACK: 'back',
};

async function sendWidgetCommand(command: string): Promise<void> {
  try {
    const ip = (await AsyncStorage.getItem('device_ip')) ?? '192.168.1.100';
    const port = (await AsyncStorage.getItem('device_port')) ?? '8080';
    await fetch(`http://${ip}:${port}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
  } catch { /* device unreachable — ignore */ }
}

// This function is the default export registered in app.json as the widget task handler.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetAction, widgetInfo } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      // Re-render the widget with current state
      const { renderWidget } = await import('./renderWidget');
      await renderWidget(widgetInfo as WidgetInfo);
      break;
    }
    case 'WIDGET_DELETED':
      break;
    case 'CLICK': {
      const { clickAction } = props as { clickAction: string };
      if (clickAction === 'OPEN_APP') break; // system handles app open
      if (clickAction === 'ALEXA_TEXT') break; // opens app to Alexa tab
      const cmd = ACTION_COMMAND[clickAction];
      if (cmd) await sendWidgetCommand(cmd);
      break;
    }
    default:
      break;
  }
}
