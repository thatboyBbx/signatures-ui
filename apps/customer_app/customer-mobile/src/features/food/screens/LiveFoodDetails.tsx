import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useMenu } from '../../../context/MenuContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { useCart } from '../../../context/CartContext';
import { useFavourites } from '../../../context/FavouritesContext';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { MenuState } from '../../../components/MenuState';
import { Skeleton } from '../../../components/Skeleton';
import { haptic } from '../../../components/haptics';
import { branchName } from '../../../services/venuesApi';
import { colors, fonts, radius } from '../../../theme/theme';
import { IngredientLine } from '../../../components/TrayBar';
import { dishOptions, ingredientLine } from '../../../sample-data/dishDetails';
import { mockFeatures } from '../../../services/mockFeatures';
import { CustomiseMeal } from '../components/CustomiseMeal';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodDetails'>;

/** Live menu item: same layout as the designed preview, driven by the branch menu and its variants. */
export function LiveFoodDetails() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { menu, loading } = useMenu();
  const { venue } = useCheckout();
  const { addItem } = useCart();
  const { isFavourite, toggle } = useFavourites();
  const [variantId, setVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const item = menu.find(entry => entry.id === route.params.menuItemId);
  const base = Number(item?.price.replace('$', '') ?? route.params.price.replace('$', ''));
  const options = item ? [{ id: '', label: 'Standard', price: base }, ...item.variants] : [];
  const variant = item?.variants.find(entry => entry.id === variantId);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  // Off in live until the API carries modifiers (services/mockFeatures.ts).
  const custom = mockFeatures.customise && item ? dishOptions(item.name, item.category, item.description) : { remove: [], add: [] };
  const addOns = custom.add.filter(extra => added.includes(extra.id));
  const keptOut = custom.remove.filter(entry => removed.includes(entry));
  const line = item ? ingredientLine(item.name, item.description) : '';
  const unitPrice = (variant ? Number(variant.price) : base) + addOns.reduce((total, extra) => total + extra.price, 0);
  const image = item?.image || route.params.image;
  const name = item?.name ?? route.params.name;
  const favourite = isFavourite(name);
  const canAdd = Boolean(item?.available && venue);

  const add = () => {
    if (!item || !venue) return;
    addItem({ id: `${item.id}:${variantId}${addOns.length ? `:${addOns.map(extra => extra.id).sort().join('-')}` : ''}${keptOut.length ? `:no-${keptOut.slice().sort().join('-')}` : ''}`, foodId: item.id, menuItemId: item.id, variantId: variantId || undefined, branchCode: venue.code,
      name: item.name, image: item.image, basePrice: unitPrice, size: variant?.label ?? 'Standard', sizePrice: 0, extras: addOns, removed: keptOut.length ? keptOut : undefined,
      quantity, unitPrice, totalPrice: unitPrice * quantity });
    haptic('success');
    navigation.navigate('Cart');
  };

  return <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <View style={styles.hero}>
        {image ? <Image source={{ uri: image }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.heroEmpty]}><Ionicons name="restaurant" size={44} color={colors.gold} /></View>}
        <SafeAreaView style={styles.heroControls} edges={['top']}>
          <Pressable accessibilityLabel="Back" style={styles.circle} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <Pressable accessibilityLabel={favourite ? 'Remove from favourites' : 'Save to favourites'} accessibilityState={{ selected: favourite }} style={styles.circle}
            onPress={() => { toggle({ name, price: `$${base.toFixed(2)}`, image, menuItemId: item?.id }); haptic(); }}>
            <Ionicons name={favourite ? 'heart' : 'heart-outline'} size={22} color={favourite ? '#B4461F' : colors.text} />
          </Pressable>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <MenuState />
        {!item && loading ? <View style={{ gap: 12 }}><Skeleton width="70%" height={34} /><Skeleton width="40%" height={14} /><Skeleton height={60} /></View>
        : !item ? <View style={styles.missing}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.description}>This dish isn't on the current menu. Return to the menu to see what's available today.</Text>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => navigation.navigate('Restaurant')}><Text style={styles.secondaryText}>Back to the menu</Text></Pressable>
        </View> : <>
          <Text style={styles.title}>{item.name}</Text>
          {line ? <IngredientLine line={line} style={{ marginTop: 9, fontSize: 11, lineHeight: 15 }} /> : <Text style={styles.subtitle}>{item.category.toUpperCase()} · PREPARED YOUR WAY</Text>}
          <Text style={styles.price}>${unitPrice.toFixed(2)}</Text>
          {venue && <View style={styles.meta}><Ionicons name="storefront-outline" size={15} color={colors.textSecondary} /><Text style={styles.metaText}>From {branchName(venue.name)}</Text></View>}
          {!line && !!item.description && <Text style={styles.description}>{item.description}</Text>}
          {!item.available && <View style={styles.notice}><Ionicons name="time-outline" size={18} color={colors.warning} /><Text style={styles.noticeText}>Not available right now. Check back soon.</Text></View>}
          {options.length > 1 && <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Choose an option</Text>
            <View style={styles.optionWrap}>
              {options.map(option => {
                const selected = option.id === variantId;
                return <Pressable key={option.id || 'standard'} accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected }}
                  onPress={() => setVariant(option.id)} style={[styles.option, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                  <Text style={[styles.optionPrice, selected && styles.optionLabelSelected]}>${Number(option.price).toFixed(2)}</Text>
                </Pressable>;
              })}
            </View>
          </>}
          <CustomiseMeal remove={custom.remove} add={custom.add} removed={removed} added={added} onRemoved={setRemoved} onAdded={setAdded} />
          {!venue && <Pressable accessibilityRole="button" style={styles.venuePrompt} onPress={() => navigation.navigate('Venue')}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            <Text style={styles.venuePromptText}>Choose a branch to order this dish</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </Pressable>}
        </>}
      </View>
    </ScrollView>

    {item && <SafeAreaView style={styles.checkoutArea} edges={['bottom']}>
      <View style={styles.orderBar}>
        <View style={styles.quantityControl}>
          <Pressable accessibilityLabel="Decrease quantity" disabled={quantity <= 1} style={styles.quantityButton} onPress={() => setQuantity(value => Math.max(1, value - 1))}><Ionicons name="remove" size={19} color={colors.text} /></Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable accessibilityLabel="Increase quantity" disabled={quantity >= 99} style={styles.quantityButton} onPress={() => setQuantity(value => Math.min(99, value + 1))}><Ionicons name="add" size={19} color={colors.text} /></Pressable>
        </View>
        <Pressable accessibilityRole="button" disabled={!canAdd} style={styles.cartButton} onPress={add}>
          <Text style={styles.cartText}>{!item.available ? 'Unavailable' : !venue ? 'Choose a branch' : 'Add to cart'}</Text>
          <Text style={styles.cartPrice}>${(unitPrice * quantity).toFixed(2)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { height: 310, backgroundColor: colors.surfaceSecondary, borderBottomLeftRadius: 145, borderBottomRightRadius: 145, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#302116' },
  heroControls: { position: 'absolute', left: 20, right: 20, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 22, width: '100%', maxWidth: 620, alignSelf: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 40, color: colors.text },
  subtitle: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.8, color: colors.textSecondary, marginTop: 8 },
  price: { fontFamily: fonts.semibold, fontSize: 24, color: colors.text, marginTop: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary },
  description: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 16 },
  notice: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  noticeText: { fontFamily: fonts.medium, fontSize: 13, color: colors.warning },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 21, color: colors.text, marginBottom: 13 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexGrow: 1, minWidth: '30%', minHeight: 58, paddingHorizontal: 14, borderRadius: 29, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  optionSelected: { backgroundColor: colors.cta, borderColor: colors.ctaBorder },
  optionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  optionPrice: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSecondary },
  optionLabelSelected: { color: colors.onDark },
  venuePrompt: { marginTop: 22, minHeight: 56, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  venuePromptText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  missing: { gap: 14 },
  secondary: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 20, borderRadius: 24, justifyContent: 'center', backgroundColor: colors.cta },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  checkoutArea: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  orderBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10, width: '100%', maxWidth: 620, alignSelf: 'center' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.surface, borderRadius: 28, padding: 3 },
  quantityButton: { width: 40, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quantity: { fontFamily: fonts.heavy, minWidth: 22, textAlign: 'center', fontSize: 16, color: colors.text },
  cartButton: { flex: 1, minHeight: 56, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, borderRadius: 28, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cartText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  cartPrice: { fontFamily: fonts.heavy, fontSize: 17, color: colors.gold },
});
