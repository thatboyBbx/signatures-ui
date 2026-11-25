import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Animated, AppState, Easing, Image, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtmosphere } from '../context/AtmosphereContext';
import { useReducedMotion } from './useReducedMotion';

export function BraaiWood() {
  const focused = useIsFocused();
  const { paused } = useAtmosphere();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const smoke = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!focused || !foreground || paused || reduced) return;
    const native = Platform.OS !== 'web';
    const drift = Animated.loop(Animated.timing(smoke, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: native }));
    const embers = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(glow, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    drift.start(); embers.start();
    return () => { drift.stop(); embers.stop(); smoke.setValue(0); glow.setValue(0); };
  }, [focused, foreground, paused, reduced, smoke, glow]);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.surface}>
    <Image source={require('../../assets/paramount/walnut-grain.webp')} resizeMode="repeat" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.14 }]} />
    <LinearGradient colors={['rgba(14,11,9,0.04)', 'rgba(31,17,10,0.12)']} style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: reduced ? 0.17 : glow.interpolate({ inputRange: [0, 1], outputRange: [0.13, 0.38] }) }]}>
      <LinearGradient colors={['transparent', 'rgba(210,89,28,0.28)', 'rgba(246,137,49,0.66)']} locations={[0, 0.72, 1]} style={StyleSheet.absoluteFill} />
      {[12, 36, 65, 84].map((left, index) => <View key={left} style={{ position: 'absolute', bottom: index % 2 ? 3 : 0, left: `${left}%`, width: index % 2 ? 27 : 47, height: 1, backgroundColor: '#C76F36', opacity: 0.8 }} />)}
    </Animated.View>
    {!reduced && [0, 1].map(index => {
      const phase = Animated.modulo(Animated.add(smoke, index * 0.47), 1);
      return <Animated.View key={index} style={[styles.smoke, {
        left: index ? '25%' : '-30%',
        opacity: phase.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, index ? 0.32 : 0.46, 0.2, 0] }),
        transform: [{ translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [index ? 35 : 0, index ? -55 : 80] }) }, { translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [30, -70] }) }, { scale: phase.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] }) }],
      }]}><Image source={require('../../assets/paramount/wood-smoke.png')} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', tintColor: '#100D0B' }]} /></Animated.View>;
    })}
    <LinearGradient pointerEvents="none" colors={['rgba(255,244,221,0.1)', 'rgba(255,244,221,0.015)', 'transparent', 'rgba(255,231,185,0.035)']} locations={[0, 0.18, 0.55, 1]} style={StyleSheet.absoluteFill} />
  </View>;
}

const styles = StyleSheet.create({
  surface: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(27,19,14,0.12)', overflow: 'hidden' },
  smoke: { position: 'absolute', bottom: -25, width: '125%', height: 150 },
});
