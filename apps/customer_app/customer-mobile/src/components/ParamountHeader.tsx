import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors, fonts } from '../theme/theme';
import { ParamountMark } from './ParamountMark';
import { ParamountTray } from './ParamountTray';
import { BraaiWood } from './BraaiWood';
import { useAtmosphere } from '../context/AtmosphereContext';

export function ParamountHeader({ onCart }: { onCart: () => void }) {
  const { onHome, lightHeader } = useAtmosphere();
  const light = !onHome || lightHeader;
  const ink = light ? colors.text : colors.onDark;
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: light ? 'rgba(244,238,227,0.24)' : 'rgba(19,16,13,0.08)' }]}>
    <BlurView intensity={8} tint={light ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
    <BraaiWood />
    <View style={styles.header}>
      <View style={styles.logo}><ParamountMark size={32} color={ink} /></View>
      <View style={styles.brand} accessibilityLabel="Paramount Signature"><Text style={[styles.name, { color: ink }]}>Paramount</Text><Text style={[styles.signature, { color: ink }]}>Signature</Text></View>
      <ParamountTray onPress={onCart} light={light} />
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { position: 'absolute', zIndex: 30, top: 0, left: 0, right: 0, backgroundColor: 'rgba(19,16,13,0.16)', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(233,211,174,0.12)' },
  header: { minHeight: 66, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(20,16,12,0.025)' },
  logo: { width: 32, alignItems: 'center' },
  brand: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 28, letterSpacing: -0.5 },
  signature: { fontFamily: fonts.headingItalic, fontSize: 16, lineHeight: 19, marginTop: -4, letterSpacing: 0.35 },
});
