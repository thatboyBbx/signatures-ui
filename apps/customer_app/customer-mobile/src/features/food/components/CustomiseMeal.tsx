import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import type { CartExtra } from '../../../types/cart';
import { colors, fonts, radius } from '../../../theme/theme';

const toggle = <T,>(list: T[], value: T) => list.includes(value) ? list.filter(item => item !== value) : [...list, value];
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Customise meal": ingredients to leave out (chips) and paid add-ons (rows). Options come from a mock until the API has modifiers. */
export function CustomiseMeal({ remove, add, removed, added, onRemoved, onAdded }: {
  remove: string[]; add: CartExtra[]; removed: string[]; added: string[];
  onRemoved: (next: string[]) => void; onAdded: (next: string[]) => void;
}) {
  if (!remove.length && !add.length) return null;
  return <View>
    <Text style={styles.title}>Customise meal</Text>
    {remove.length > 0 && <View style={styles.chips}>
      {remove.map(item => {
        const on = removed.includes(item);
        return <Pressable key={item} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => onRemoved(toggle(removed, item))} style={[styles.chip, on && styles.chipOn]}>
          <Text style={[styles.chipText, on && styles.chipTextOn]}>No {item}</Text>
        </Pressable>;
      })}
    </View>}
    {add.map(extra => {
      const on = added.includes(extra.id);
      return <Pressable key={extra.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => onAdded(toggle(added, extra.id))} style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={[styles.box, on && styles.boxOn]}>{on && <Ionicons name="checkmark" size={15} color={colors.surface} />}</View>
          <Text style={styles.rowName}>{capital(extra.name)}</Text>
        </View>
        <Text style={styles.rowPrice}>+${extra.price.toFixed(2)}</Text>
      </Pressable>;
    })}
  </View>;
}

/** Cart line: "Medium · Extra cheese · No onions". */
export function optionSummary(size: string | undefined, extras: CartExtra[], removed?: string[]) {
  return [size, ...extras.map(extra => extra.name), ...(removed ?? []).map(item => `No ${item}`)].filter(Boolean).join(' · ');
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 21, color: colors.text, marginTop: 22, marginBottom: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: { minHeight: 40, paddingHorizontal: 15, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.cta, borderColor: colors.ctaBorder },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.onDark },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rowName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  rowPrice: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary },
});
