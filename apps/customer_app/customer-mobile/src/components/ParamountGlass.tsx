import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';

/** Supplied honey-wood glass button; navigation retains the dark walnut material. */
export function ParamountGlass({ navigation = false }: { navigation?: boolean }) {
  if (!navigation) return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: 'hidden' }]}>
    <BlurView intensity={12} tint="default" style={StyleSheet.absoluteFill} />
    <Image accessible={false} source={require('../../assets/paramount/honey-wood-glass-button.png')} resizeMode="stretch"
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.18 }]} />
    <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,249,234,0.015)', 'rgba(255,255,255,0.015)', 'rgba(255,247,227,0.06)']}
      locations={[0, 0.32, 0.62, 1]} style={StyleSheet.absoluteFill} />
  </View>;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
    <Image source={require('../../assets/paramount/walnut-grain.webp')} resizeMode="repeat"
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.24 }]} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,13,0.55)' }]} />
    {Platform.OS === 'android' && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,13,0.24)' }]} />}
  </View>;
}

/** Reflections sit above the lettering so it reads beneath a clear curved surface. */
export function ParamountGlassCoat() {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { zIndex: 2, borderRadius: 999, overflow: 'hidden' }]}>
    <LinearGradient colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.015)', 'rgba(255,239,208,0.13)']}
      locations={[0, 0.38, 0.55, 1]} style={StyleSheet.absoluteFill} />
    <View style={[StyleSheet.absoluteFill, { borderRadius: 999, borderWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.65)', borderBottomColor: 'rgba(255,238,202,0.5)',
      borderLeftColor: 'rgba(255,249,235,0.45)', borderRightColor: 'rgba(255,249,235,0.45)' }]} />
    <View style={{ position: 'absolute', left: 14, right: 14, top: 3, height: 1, backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 999 }} />
  </View>;
}

export const glassButtonStyle = {
  minHeight: 52, paddingHorizontal: 20, paddingVertical: 14,
  borderWidth: 0, borderRadius: 999,
  overflow: 'hidden' as const, backgroundColor: colors.black,
  alignItems: 'center' as const, justifyContent: 'space-between' as const,
  flexDirection: 'row' as const, gap: 18,
};
