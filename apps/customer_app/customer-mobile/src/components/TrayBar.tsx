import { StyleSheet, Text, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { colors, fonts } from '../theme/theme';
import { ParamountPressable } from './ParamountPressable';

/** Height the bar takes above the dock, so screens can pad their scroll content. */
export const TRAY_BAR_SPACE = 70;

/** Solid bar that sits just above the dock once the tray has something in it. */
export function TrayBar({ bottomInset = 0, onPress }: { bottomInset?: number; onPress: () => void }) {
  const { itemCount, subtotal, discount } = useCart();
  if (!itemCount) return null;
  const total = subtotal - discount;
  return <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(14, bottomInset) + 68 + 10 }]}>
    <ParamountPressable accessibilityRole="button" accessibilityLabel={`View tray, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, $${total.toFixed(2)}. Go to checkout`} onPress={onPress} style={styles.bar}>
      <Text style={styles.label}>View tray</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.count}>{itemCount}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.total}>${total.toFixed(2)}</Text>
    </ParamountPressable>
  </View>;
}

/** Short ingredient line in small caps, e.g. BEEF · CHEESE · HOUSE MAYO. */
export function IngredientLine({ line, dark = false, style, lines = 1 }: { line: string; dark?: boolean; style?: object; lines?: number }) {
  if (!line) return null;
  return <Text numberOfLines={lines} style={[styles.ingredients, dark && { color: '#D4C5AD' }, style]}>{line}</Text>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: { width: '92%', maxWidth: 470, minHeight: 56, paddingHorizontal: 22, borderRadius: 28, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  dot: { fontFamily: fonts.bold, fontSize: 15, color: colors.gold },
  count: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  total: { fontFamily: fonts.heavy, fontSize: 17, color: colors.gold },
  ingredients: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase', color: colors.textSecondary },
});
