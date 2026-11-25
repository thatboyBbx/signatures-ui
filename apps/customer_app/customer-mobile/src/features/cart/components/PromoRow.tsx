import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { useCart } from '../../../context/CartContext';
import { validatePromo } from '../../../services/mockApi';
import { colors, fonts, radius } from '../../../theme/theme';

/** One collapsed row; opens to a code field. Validation is mocked (services/mockApi.ts). */
export function PromoRow() {
  const { promo, setPromo, subtotal, discount } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const apply = async () => {
    if (!code.trim() || checking) return;
    setChecking(true); setError('');
    const result = await validatePromo(code, subtotal);
    setChecking(false);
    if (!result.ok) { setError(result.message); return; }
    setPromo(result.promo); setOpen(false); setCode('');
  };

  if (promo) return <View style={styles.row}>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.code}>{promo.code}</Text>
      <Text style={styles.detail}>{discount > 0 ? `−$${discount.toFixed(2)} · ${promo.label}` : `Not applied · ${promo.label}`}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Remove promo code ${promo.code}`} hitSlop={8} onPress={() => setPromo(null)}><Text style={styles.link}>Remove</Text></Pressable>
  </View>;

  return <View style={styles.box}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => { setOpen(value => !value); setError(''); }} style={styles.toggle}>
      <Text style={styles.label}>Promo code</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
    </Pressable>
    {open && <View style={styles.field}>
      <TextInput accessibilityLabel="Promo code" autoCapitalize="characters" autoCorrect={false} autoFocus placeholder="Enter code" placeholderTextColor={colors.textSecondary}
        value={code} onChangeText={value => { setCode(value); setError(''); }} onSubmitEditing={() => void apply()} returnKeyType="done" style={[styles.input, !!error && { borderColor: colors.error }]} />
      <Pressable accessibilityRole="button" disabled={!code.trim() || checking} onPress={() => void apply()} style={[styles.apply, !code.trim() && { opacity: 0.5 }]}>
        {checking ? <ActivityIndicator color={colors.onDark} /> : <Text style={styles.applyText}>Apply</Text>}
      </Pressable>
    </View>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  box: { marginTop: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14 },
  toggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  field: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  input: { flex: 1, minHeight: 46, paddingHorizontal: 14, borderRadius: 23, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 1, color: colors.text },
  apply: { minHeight: 46, minWidth: 84, paddingHorizontal: 18, borderRadius: 23, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onDark },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, paddingBottom: 12, marginTop: -4 },
  row: { marginTop: 12, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ctaBorder, backgroundColor: colors.surface },
  code: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: colors.text },
  detail: { fontFamily: fonts.body, fontSize: 12, color: colors.success },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary, textDecorationLine: 'underline' },
});
