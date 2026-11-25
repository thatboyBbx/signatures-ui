import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme/theme';
import { ParamountPressable } from './ParamountPressable';
import { useReducedMotion } from './useReducedMotion';
import { MetallicEdge } from './MetallicEdge';

const icons = { Home: 'home-outline', Search: 'search-outline', Orders: 'receipt-outline', Profile: 'person-outline' } as const;

export function ParamountTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return <ParamountDock selectedIndex={state.index} bottomInset={insets.bottom} onSelect={index => {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  }} onLongPress={index => navigation.emit({ type: 'tabLongPress', target: state.routes[index].key })} />;
}

export const dockRoutes = ['Home', 'Search', 'Orders', 'Profile'] as const;

/** Shared real navigation dock, also available on the Bar stack screen. */
export function ParamountDock({ selectedIndex = -1, bottomInset = 0, onSelect, onLongPress, square = false }: { selectedIndex?: number; bottomInset?: number; onSelect: (index: number) => void; onLongPress?: (index: number) => void; square?: boolean }) {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(68);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const focused = useIsFocused();
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => setForeground(next === 'active'));
    return () => subscription.remove();
  }, []);
  const position = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const cell = (width - 12) / dockRoutes.length;
  useEffect(() => {
    const destination = Math.max(0, cell * selectedIndex);
    if (reduced || !width) { position.setValue(destination); return; }
    const animation = Animated.spring(position, { toValue: destination, damping: 22, stiffness: 190, mass: 0.8, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [cell, selectedIndex, reduced, position, width]);
  return <View accessibilityRole="tablist" style={[styles.bar, square && styles.squareBar, { bottom: Math.max(14, bottomInset) }]} onLayout={event => { setWidth(event.nativeEvent.layout.width); setHeight(event.nativeEvent.layout.height); }}>
    <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
    <Image pointerEvents="none" source={require('../../assets/paramount/walnut-grain.webp')} resizeMode="repeat" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.85 }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,16,10,0.68)' }]} />
    {width > 0 && selectedIndex >= 0 && <Animated.View pointerEvents="none" style={[styles.selection, square && styles.squareSelection, { width: Math.max(0, cell), transform: [{ translateX: position }] }]} />}
    {dockRoutes.map((label, index) => {
      const selected = selectedIndex === index;
      return <ParamountPressable key={label} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} aria-selected={selected} style={styles.item}
        onPress={() => onSelect(index)} onLongPress={() => onLongPress?.(index)}>
        <Ionicons name={icons[label as keyof typeof icons] ?? 'ellipse-outline'} size={21} color={selected ? colors.text : colors.navigationText} />
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      </ParamountPressable>;
    })}
    {!square && <MetallicEdge width={width} height={height} active={focused && foreground} />}
  </View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', alignSelf: 'center', width: '92%', maxWidth: 470, minHeight: 68, padding: 6, flexDirection: 'row', borderRadius: 35, overflow: 'hidden', backgroundColor: 'rgba(29,23,18,0.88)', borderWidth: 1, borderColor: 'transparent', shadowColor: colors.black, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  selection: { position: 'absolute', left: 5, top: 5, bottom: 5, borderRadius: 29, backgroundColor: '#E9D8BA' },
  // Bar variant: hard square edges and a solid brass frame.
  squareBar: { borderRadius: 0, borderWidth: 2, borderColor: '#C6A77E' },
  squareSelection: { borderRadius: 0 },
  item: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.navigationText },
  selectedLabel: { color: colors.text, fontFamily: fonts.semibold },
});
