import { Text, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCart } from '../context/CartContext';
import { colors, fonts } from '../theme/theme';
import { ParamountPressable } from './ParamountPressable';

export function ParamountTray({ onPress, light = false }: { onPress: () => void; light?: boolean }) {
  const { itemCount } = useCart();
  return <ParamountPressable onPress={onPress} accessibilityLabel={`Your serving tray, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} style={[styles.tray, light && { borderColor: 'rgba(48,37,28,0.25)', backgroundColor: 'rgba(244,238,227,0.16)' }]}>
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={light ? colors.text : colors.navigationText} strokeWidth={1.35}>
      <Path d="M3 18h18M5 16a7 7 0 0 1 14 0H5ZM12 8V5m-2 0h4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <View style={styles.badge}><Text style={styles.count}>{itemCount}</Text></View>
  </ParamountPressable>;
}
const styles = StyleSheet.create({
  tray: { width: 52, height: 44, borderRadius: 22, backgroundColor: 'rgba(233,211,174,0.07)', borderWidth: 1, borderColor: 'rgba(233,211,174,0.23)', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -1, top: -2, borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 4, backgroundColor: '#D7BD91', alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fonts.semibold, color: colors.text, fontSize: 9 },
});
