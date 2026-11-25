import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

/** Soft pulsing placeholder block. `tone` matches the surface it sits on, so loading never flashes white. */
export function Skeleton({ width = '100%', height = 14, radius = 8, tone = 'light', style }: {
  width?: DimensionValue; height?: DimensionValue; radius?: number; tone?: 'light' | 'dark'; style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { pulse.setValue(0.5); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{
    width, height, borderRadius: radius,
    backgroundColor: tone === 'dark' ? 'rgba(233,211,174,0.10)' : 'rgba(121,82,56,0.13)',
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
  }, style]} />;
}
