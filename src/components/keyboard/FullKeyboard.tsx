import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useRef,
} from 'react-native';
import { useHaptics } from '../../hooks/useHaptics';
import { Colors } from '../../utils/colors';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'DEL'],
  ['123', 'SPACE', '.', 'ENTER'],
];

const NUMBER_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['SHIFT', '.', ',', '?', '!', "'", '%', '#', 'DEL'],
  ['ABC', 'SPACE', '.', 'ENTER'],
];

interface KeyProps {
  char: string;
  onPress: (char: string) => void;
  isShift?: boolean;
  keyWidth?: number;
  keyHeight?: number;
}

function Key({ char, onPress, isShift, keyWidth = 34, keyHeight = 42 }: KeyProps) {
  const haptics = useHaptics();
  const scale = new Animated.Value(1);

  const handlePress = useCallback(() => {
    haptics.light();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress(char);
  }, [char, haptics, onPress, scale]);

  const isSpecial = ['SHIFT', 'DEL', '123', 'ABC', 'ENTER', 'SPACE'].includes(char);
  const isEnter = char === 'ENTER';
  const isSpace = char === 'SPACE';
  const isDel = char === 'DEL';

  let bgColor = Colors.buttonBg;
  let textColor = Colors.white;
  let width = keyWidth;

  if (isSpace) { width = keyWidth * 5; bgColor = Colors.amazonBlue; }
  if (isEnter) { width = keyWidth * 2.5; bgColor = Colors.amazonOrange; textColor = Colors.amazonDark; }
  if (isDel) { bgColor = Colors.amazonNavy; }
  if (isShift && (char === 'SHIFT' || char === '123' || char === 'ABC')) {
    bgColor = Colors.alexaBlue; textColor = Colors.amazonDark;
  }

  const displayChar = char === 'SPACE' ? '⎵' : char === 'DEL' ? '⌫' : char === 'SHIFT' ? '⇧' : char;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.key,
          {
            width,
            height: keyHeight,
            backgroundColor: bgColor,
            minWidth: isSpecial ? undefined : keyWidth,
          }
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.keyText, { color: textColor, fontSize: isSpecial ? 11 : 15 }]}>
          {displayChar}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface FullKeyboardProps {
  onInput?: (text: string) => void;
  onEnter?: (text: string) => void;
  compact?: boolean;
}

export function FullKeyboard({ onInput, onEnter, compact = false }: FullKeyboardProps) {
  const [text, setText] = useState('');
  const [isShift, setIsShift] = useState(false);
  const [isNumbers, setIsNumbers] = useState(false);
  const keyWidth = compact ? 30 : 34;
  const keyHeight = compact ? 36 : 42;
  const rows = isNumbers ? NUMBER_ROWS : ROWS;

  const handleKey = useCallback((char: string) => {
    if (char === 'SHIFT') {
      setIsShift(s => !s);
      return;
    }
    if (char === '123') { setIsNumbers(true); return; }
    if (char === 'ABC') { setIsNumbers(false); return; }
    if (char === 'DEL') {
      const next = text.slice(0, -1);
      setText(next);
      onInput?.(next);
      return;
    }
    if (char === 'ENTER') {
      onEnter?.(text);
      setText('');
      return;
    }
    if (char === 'SPACE') {
      const next = text + ' ';
      setText(next);
      onInput?.(next);
      return;
    }
    const letter = isShift ? char.toUpperCase() : char;
    const next = text + letter;
    setText(next);
    onInput?.(next);
    if (isShift) setIsShift(false);
  }, [text, isShift, onInput, onEnter]);

  return (
    <View style={styles.container}>
      {/* Text display */}
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1}>
          {text || <Text style={styles.placeholder}>Start typing...</Text>}
        </Text>
        {text.length > 0 && (
          <View style={styles.cursor} />
        )}
      </View>

      {/* Keys */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(char => (
            <Key
              key={char}
              char={char}
              onPress={handleKey}
              isShift={isShift}
              keyWidth={keyWidth}
              keyHeight={keyHeight}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.amazonNavy,
    borderRadius: 16,
    padding: 10,
    gap: 6,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amazonDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
    minHeight: 40,
    borderWidth: 1,
    borderColor: Colors.alexaBlue,
  },
  displayText: {
    color: Colors.white,
    fontSize: 15,
    flex: 1,
  },
  placeholder: {
    color: Colors.gray,
    fontStyle: 'italic',
  },
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: Colors.alexaBlue,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  key: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  keyText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
