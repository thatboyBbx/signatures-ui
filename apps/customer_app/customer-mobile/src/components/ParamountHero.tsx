import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ParamountPressable } from './ParamountPressable';
import { glassButtonStyle } from './ParamountGlass';
import { AtmosphereVideo } from './AtmosphereVideo';
import { useAtmosphere } from '../context/AtmosphereContext';
import { colors, fonts } from '../theme/theme';
import { useReducedMotion } from './useReducedMotion';

export function ParamountHero({ onOrder }: { onOrder: () => void }) {
  const { width } = useWindowDimensions();
  const { setHeroHeight } = useAtmosphere();
  const reduced = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { entrance.setValue(1); return; }
    entrance.setValue(0);
    const animation = Animated.timing(entrance, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [reduced, entrance]);
  const wide = width >= 700;
  return <View onLayout={event => setHeroHeight(event.nativeEvent.layout.height)} style={[styles.hero, { minHeight: wide ? 430 : 460 }]}>
    <AtmosphereVideo />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['rgba(12,11,10,0.86)', 'rgba(18,16,11,0.48)', 'rgba(21,16,12,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(14,12,10,0.08)', 'transparent', 'rgba(16,14,11,0.85)']} locations={[0, 0.65, 1]} style={StyleSheet.absoluteFill} />
    </View>
    <Animated.View style={[styles.copy, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <Text accessibilityRole="header" style={[styles.title, { fontSize: wide ? 65 : width < 360 ? 40 : 47, lineHeight: wide ? 70 : width < 360 ? 46 : 53 }]}>A little fire.{'\n'}<Text style={styles.accent}>A lot of flavour.</Text></Text>
      <ParamountPressable glassTone="dark" onPress={onOrder} style={styles.order}><Text style={styles.orderText}>EXPLORE THE MENU</Text><Text style={styles.arrow}>↗</Text></ParamountPressable>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  hero: { marginBottom: 28, marginHorizontal: -20, backgroundColor: colors.black, overflow: 'hidden', justifyContent: 'center' },
  copy: { paddingHorizontal: 28, paddingTop: 108, paddingBottom: 70, alignItems: 'flex-start' },
  title: { fontFamily: fonts.heading, color: '#FFF4DF', letterSpacing: -1.5 },
  accent: { fontFamily: fonts.headingItalic, color: colors.gold },
  order: { ...glassButtonStyle, marginTop: 28, alignSelf: 'flex-start' },
  orderText: { fontFamily: fonts.bold, color: '#FFF5E2', fontSize: 11, letterSpacing: 0.7 },
  arrow: { fontFamily: fonts.body, color: '#FFF5E2', fontSize: 23, lineHeight: 25 },
});
