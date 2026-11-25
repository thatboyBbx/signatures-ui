import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { useCart } from '../../../context/CartContext';
import { useOrders } from '../../../context/OrderContext';
import { haptic } from '../../../components/haptics';
import { makePreviewOrder } from '../../../sample-data/previewOrder';
import { mealDeals, type MealDeal } from '../../../sample-data/mealDeals';
import { mockFeatures } from '../../../services/mockFeatures';
import { useReorder } from '../../orders/useReorder';
import { colors, fonts } from '../../../theme/theme';
import type { Order } from '../../../types/order';

const walnut = require('../../../../assets/paramount/walnut-grain.webp');
const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';

/** "Signature Beef Burger, 2× Chicken Wings" */
const summarise = (order: Order) => order.items.map(item => item.quantity > 1 ? `${item.quantity}× ${item.name}` : item.name).join(', ');

/** Returning customers: their last delivered order, one tap to put it back in the tray. */
export function ReorderStrip({ onDone }: { onDone: () => void }) {
  const { orders } = useOrders();
  const reorder = useReorder();
  const [note, setNote] = useState<string | null>(null);
  // Newest delivered order; the preview falls back to the sample order so the strip can be reviewed.
  const last = orders.filter(order => order.status === 'delivered').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    ?? (preview ? { ...makePreviewOrder(), status: 'delivered' as const } : undefined);
  if (!last || !last.items.length) return null;
  const run = () => {
    const result = reorder(last);
    if (!result.added) { setNote('Those dishes aren’t on today’s menu.'); return; }
    setNote(result.missing.length ? `Not available today: ${result.missing.join(', ')}.` : null);
    onDone();
  };
  return <View style={styles.reorderWrap}>
    <View style={styles.reorder}>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.eyebrow}>YOUR LAST ORDER</Text>
        <Text numberOfLines={2} style={styles.reorderItems}>{summarise(last)}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Reorder ${summarise(last)}`} onPress={run} style={styles.reorderButton}>
        <Text style={styles.reorderButtonText}>Reorder</Text>
      </Pressable>
    </View>
    {note && <Text accessibilityRole="alert" style={styles.note}>{note}</Text>}
  </View>;
}

/** One flat walnut card for a combo the branch already sells. Hidden until the branch confirms it (preview shows the mock). */
export function MealDealCard() {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const deal = mealDeals.find(entry => entry.confirmedByBranch || mockFeatures.mealDeals);
  if (!deal) return null;
  const add = (item: MealDeal) => {
    addItem({ id: item.id, foodId: item.id, name: `${item.dish} meal deal`, image: item.image, basePrice: item.price, size: 'Meal deal', sizePrice: 0,
      extras: item.items, quantity: 1, unitPrice: item.price, totalPrice: item.price });
    haptic('success');
    setAdded(true);
  };
  return <View style={styles.deal}>
    <Image pointerEvents="none" source={walnut} resizeMode="repeat" style={[StyleSheet.absoluteFill, styles.grain]} />
    <Image source={{ uri: deal.image }} style={styles.dealPhoto} />
    <View style={styles.dealCopy}>
      <Text style={styles.dealEyebrow}>MEAL DEAL</Text>
      <Text style={styles.dealTitle}>{deal.title}</Text>
      <Text style={styles.dealSave}>Save ${(deal.regular - deal.price).toFixed(2).replace(/\.00$/, '')}</Text>
      <View style={styles.dealBottom}>
        <Text style={styles.dealPrice}>${deal.price.toFixed(2)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Add ${deal.title} to tray, $${deal.price.toFixed(2)}`} onPress={() => add(deal)} style={styles.dealButton}>
          <Text style={styles.dealButtonText}>{added ? 'Added' : 'Add'}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  reorderWrap: { marginBottom: 16, gap: 6 },
  reorder: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8, paddingVertical: 8, borderRadius: 34, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.6, color: colors.primary },
  reorderItems: { fontFamily: fonts.heading, fontSize: 17, lineHeight: 22, color: colors.text },
  reorderButton: { minHeight: 48, paddingHorizontal: 20, borderRadius: 24, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, justifyContent: 'center' },
  reorderButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onDark },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, paddingHorizontal: 18 },
  deal: { flexDirection: 'row', minHeight: 150, borderRadius: 22, overflow: 'hidden', backgroundColor: '#302116', borderWidth: 1, borderColor: '#A5885D', marginBottom: 16 },
  grain: { width: '100%', height: '100%', opacity: 0.2 },
  dealPhoto: { width: '38%', minHeight: 150 },
  dealCopy: { flex: 1, padding: 16, gap: 3 },
  dealEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.6, color: '#E4CC9E' },
  dealTitle: { fontFamily: fonts.heading, fontSize: 21, lineHeight: 25, color: colors.onDark },
  dealSave: { fontFamily: fonts.headingItalic, fontSize: 17, lineHeight: 22, color: colors.gold },
  dealBottom: { marginTop: 'auto', paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dealPrice: { fontFamily: fonts.heavy, fontSize: 18, color: colors.onDark },
  dealButton: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: colors.gold, justifyContent: 'center' },
  dealButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onGold },
});
