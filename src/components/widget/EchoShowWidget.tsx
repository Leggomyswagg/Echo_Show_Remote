/**
 * Android Home Screen Widget
 * Rendered via @bam.tech/react-native-android-widget
 *
 * This component is intentionally styled with inline primitives only —
 * no StyleSheet, no hooks — because the widget renderer runs in a
 * headless background context without a React Native bridge.
 */
import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from '@bam.tech/react-native-android-widget';

interface EchoShowWidgetProps {
  isConnected?: boolean;
  deviceName?: string;
}

export function EchoShowWidget({ isConnected = false, deviceName = 'Echo Show' }: EchoShowWidgetProps) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#232F3E',
        borderRadius: 20,
        padding: 14,
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <TextWidget
          text="Echo Show Remote"
          style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}
        />
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isConnected ? '#1DB954' : '#888',
          }}
        />
      </FlexWidget>

      {/* Device name */}
      <TextWidget
        text={deviceName}
        style={{ color: '#00CAFF', fontSize: 11, marginTop: 2 }}
      />

      {/* Button grid */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 }}
      >
        <WidgetBtn label="⏮" action="REWIND" />
        <WidgetBtn label="⏯" action="PLAY_PAUSE" highlight />
        <WidgetBtn label="⏭" action="FAST_FORWARD" />
        <WidgetBtn label="🔇" action="MUTE" />
      </FlexWidget>

      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 }}
      >
        <WidgetBtn label="🏠" action="HOME" />
        <WidgetBtn label="◀" action="BACK" />
        <WidgetBtn label="🔊−" action="VOL_DOWN" />
        <WidgetBtn label="🔊+" action="VOL_UP" />
      </FlexWidget>

      {/* Alexa button */}
      <FlexWidget
        style={{
          marginTop: 10,
          backgroundColor: '#00CAFF',
          borderRadius: 12,
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        clickAction="ALEXA_TEXT"
      >
        <TextWidget
          text="🎙  Ask Alexa"
          style={{ color: '#131921', fontSize: 13, fontWeight: '800' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function WidgetBtn({
  label,
  action,
  highlight = false,
}: {
  label: string;
  action: string;
  highlight?: boolean;
}) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        backgroundColor: highlight ? '#FF9900' : '#37475A',
        borderRadius: 10,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      clickAction={action}
    >
      <TextWidget text={label} style={{ fontSize: 16, color: highlight ? '#131921' : '#FFFFFF' }} />
    </FlexWidget>
  );
}
