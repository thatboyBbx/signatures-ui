import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, AppState, Easing, Image, Platform, Pressable, StyleSheet, Text, View, type ImageProps, type PressableProps, type StyleProp, type TextStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useOptionalAtmosphere } from '../context/AtmosphereContext';
import { colors, motion } from '../theme/theme';
import { useReducedMotion } from './useReducedMotion';
import { ParamountGlass, ParamountGlassCoat } from './ParamountGlass';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PhotoMotion = createContext<Animated.AnimatedAddition | null>(null);

// Keep labels and icons readable on the light supplied material, including nested totals.
function woodButtonContent(children: ReactNode, dark: boolean): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<{ children?: ReactNode; color?: string; style?: StyleProp<TextStyle> }>(child)) return child;
    const props: { children?: ReactNode; color?: string; style?: StyleProp<TextStyle> } = {};
    const color = dark ? '#E8D9C0' : colors.woodButtonText;
    if (child.type === Text) props.style = [child.props.style, { color,
      textShadowColor: dark ? 'rgba(20,12,5,0.85)' : 'rgba(255,249,232,0.85)',
      textShadowOffset: { width: 0, height: dark ? -1 : 1 }, textShadowRadius: 0.7 }];
    if (child.props.color !== undefined) props.color = color;
    if (child.props.children !== undefined) props.children = woodButtonContent(child.props.children, dark);
    return cloneElement(child, props);
  });
}

export function ParamountPhoto({ style, ...props }: ImageProps) {
  const progress = useContext(PhotoMotion);
  if (!progress) return <Image {...props} style={style} />;
  return <View style={[style, { overflow: 'hidden' }]}><Animated.Image {...props} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', transform: [
    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.17] }) },
    { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-1.2deg'] }) },
  ] }]} /></View>;
}

/** Shared touch feedback and the reference's photo zoom/lift without replacing actions. */
export function ParamountPressable({ style, onPressIn, onPressOut, onHoverIn, onHoverOut,
  onFocus, onBlur, disabled, photoMotion = false, glassTone = 'light', children, ...props }: PressableProps & { photoMotion?: boolean; glassTone?: 'light' | 'dark' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const photo = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const photoProgress = useMemo(() => Animated.add(photo, drift), [photo, drift]);
  const focusedScreen = useIsFocused();
  const atmosphere = useOptionalAtmosphere();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const expansion = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!photoMotion) return;
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, [photoMotion]);
  useEffect(() => {
    if (!photoMotion || !focusedScreen || !foreground || reduceMotion || atmosphere?.paused) { drift.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 0.34, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(drift, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    animation.start();
    return () => { animation.stop(); drift.setValue(0); };
  }, [photoMotion, focusedScreen, foreground, reduceMotion, atmosphere?.paused, drift]);
  useEffect(() => () => { scale.stopAnimation(); photo.stopAnimation(); expansion.stopAnimation(); }, [scale, photo, expansion]);
  useEffect(() => {
    if (photoMotion) return;
    const animation = Animated.spring(scale, { toValue: !reduceMotion && !disabled && (hovered || focused) ? 1.025 : 1,
      damping: 18, stiffness: 210, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [hovered, focused, disabled, reduceMotion, photoMotion, scale]);
  useEffect(() => {
    if (!photoMotion) return;
    const animation = Animated.timing(expansion, { toValue: !reduceMotion && (hovered || focused) ? 1 : 0,
      duration: reduceMotion ? 0 : 700, easing: Easing.bezier(0.16, 0.75, 0.17, 1), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [hovered, focused, reduceMotion, expansion, photoMotion]);
  useEffect(() => {
    if (!photoMotion) return;
    const animation = Animated.timing(photo, { toValue: !reduceMotion && (hovered || focused || pressed) ? 1 : 0,
      duration: reduceMotion ? 0 : motion.photo, easing: Easing.bezier(0.16, 0.75, 0.17, 1), useNativeDriver: Platform.OS !== 'web' });
    animation.start(); return () => animation.stop();
  }, [hovered, focused, pressed, reduceMotion, photo, photoMotion]);
  const animate = (value: number) => {
    scale.stopAnimation();
    Animated.timing(scale, { toValue: value, duration: reduceMotion ? 0 : motion.press,
      easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const resolved = typeof style === 'function' ? style({ pressed }) : style;
  const flattened = StyleSheet.flatten(resolved);
  const material = !photoMotion && flattened?.backgroundColor === colors.black;
  const content = typeof children === 'function' ? children({ pressed }) : children;
  return (
    <AnimatedPressable {...props} disabled={disabled} hitSlop={props.hitSlop ?? 5}
      accessibilityRole={props.accessibilityRole ?? (props.onPress || props.onLongPress ? 'button' : undefined)}
      accessibilityState={{ ...props.accessibilityState, disabled: Boolean(disabled) }}
      onPressIn={event => { setPressed(true); if (!disabled) animate(0.98); onPressIn?.(event); }}
      onPressOut={event => { setPressed(false); animate(1); onPressOut?.(event); }}
      onHoverIn={event => { setHovered(true); onHoverIn?.(event); }}
      onHoverOut={event => { setHovered(false); onHoverOut?.(event); }}
      onFocus={event => { setFocused(true); onFocus?.(event); }}
      onBlur={event => { setFocused(false); onBlur?.(event); }}
      style={[resolved, material && { borderWidth: 0, borderRadius: 999, overflow: 'hidden', backgroundColor: 'transparent' },
        photoMotion && Platform.OS === 'web' && typeof flattened?.width === 'number' && { width: expansion.interpolate({ inputRange: [0, 1], outputRange: [flattened.width, flattened.width * 1.2] }) },
        { transform: [{ scale }, { translateY: photoMotion ? photo.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) : 0 }], opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }]}>
      {material && <ParamountGlass />}
      <PhotoMotion.Provider value={photoMotion ? photoProgress : null}>
        {material ? woodButtonContent(content, glassTone === 'dark') : content}
      </PhotoMotion.Provider>
      {material && <ParamountGlassCoat />}
    </AnimatedPressable>
  );
}
