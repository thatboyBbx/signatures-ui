import { LiveFoodDetails } from './LiveFoodDetails';
import { ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, radius, spacing, fonts } from '../../../theme/theme';
import { sampleMenu } from '../../../sample-data/menu';
import { useCart } from '../../../context/CartContext';
import { haptic } from '../../../components/haptics';
import { useFavourites } from '../../../context/FavouritesContext';
import { useRatings } from '../../../context/RatingsContext';
import { IngredientLine } from '../../../components/TrayBar';
import { dishOptions, ingredientLine } from '../../../sample-data/dishDetails';
import { mockFeatures } from '../../../services/mockFeatures';
import { CustomiseMeal } from '../components/CustomiseMeal';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const sizes = ['Small', 'Medium', 'Large'];

const extras = [
  { id: 'fries', name: 'French fries', price: 2 },
  { id: 'salad', name: 'Fresh salad', price: 1.5 },
  { id: 'drink', name: 'Soft drink', price: 1 },
];

export const sizePrices: Record<string, number> = {
  Small: 0,
  Medium: 1.5,
  Large: 3,
};

export function FoodDetailsScreen() { return process.env.EXPO_PUBLIC_UI_PREVIEW === '1' ? <PreviewFoodDetailsScreen /> : <LiveFoodDetails />; }

function PreviewFoodDetailsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Props['route']>();

  const { name, price, image } = route.params;
  const { addItem } = useCart();
  const { isFavourite, toggle } = useFavourites();
  const favourite = isFavourite(name);
  const dish = sampleMenu.find(item => item.name === name);
  const line = ingredientLine(name, dish?.description);
  const options = mockFeatures.customise && dish ? dishOptions(name, dish.category, dish.description) : { remove: [], add: [] };
  const rating = useRatings().dishRating(name);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  const [selectedSize, setSelectedSize] = useState('Small');
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const basePrice = Number(price.replace('$', ''));
  const addOns = options.add.filter(extra => added.includes(extra.id));
  const extrasTotal = [...extras.filter((extra) => selectedExtras.includes(extra.id)), ...addOns]
    .reduce((total, extra) => total + extra.price, 0);
  const unitPrice = basePrice + sizePrices[selectedSize] + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    const selectedExtraItems = [...extras.filter((extra) =>
      selectedExtras.includes(extra.id),
    ), ...addOns];
    const keptOut = options.remove.filter(item => removed.includes(item));

    addItem({
      id: `${name}-${selectedSize}-${selectedExtraItems.map(extra => extra.id).sort().join('-')}${keptOut.length ? `-no-${keptOut.slice().sort().join('-')}` : ''}`,
      foodId: name,
      name,
      image,
      basePrice,
      size: selectedSize,
      sizePrice: sizePrices[selectedSize],
      extras: selectedExtraItems,
      removed: keptOut.length ? keptOut : undefined,
      quantity,
      unitPrice,
      totalPrice,
    });
    haptic('success');
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Image source={{ uri: image }} style={styles.heroImage} />

          <SafeAreaView style={styles.heroControls} edges={['top']}>
            <Pressable
              accessibilityLabel="Back"
              style={styles.circleButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>

            <Pressable
              style={styles.circleButton}
              accessibilityLabel={favourite ? 'Remove from favourites' : 'Save to favourites'}
              accessibilityState={{ selected: favourite }}
              onPress={() => { toggle({ name, price, image }); haptic(); }}
            >
              <Ionicons
                name={favourite ? 'heart' : 'heart-outline'}
                size={22}
                color={favourite ? '#B4461F' : colors.text}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>

          </View>

          {line ? <IngredientLine line={line} style={styles.ingredients} /> : <Text style={styles.dishSubtitle}>{dish?.category ?? 'SIGNATURE DISH'} · PREPARED YOUR WAY</Text>}
          <Text style={styles.price}>${unitPrice.toFixed(2)}</Text>
          <View style={styles.meta}>
            {rating ? <>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={15} color={colors.primary} />
                <Text style={styles.metaText}>{rating.average.toFixed(1)} ({rating.count})</Text>
              </View>
              <View style={styles.dot} />
            </> : null}

            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>{dish?.time ?? '20–30 min'}</Text>
            </View>

            <View style={styles.dot} />

            <Text style={styles.delivery}>Delivery</Text>
          </View>

          {!line && <Text style={styles.description}>{dish?.description ?? 'A Signatures favourite, prepared your way.'}</Text>}


          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Choose your size</Text>

          <View style={styles.sizeRow}>
            {sizes.map((size) => {
              const selected = selectedSize === size;

              return (
                <Pressable
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  style={[
                    styles.sizeButton,
                    selected && styles.sizeButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selected && styles.sizeTextSelected,
                    ]}
                  >
                    {size}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <CustomiseMeal remove={options.remove} add={options.add} removed={removed} added={added} onRemoved={setRemoved} onAdded={setAdded} />

          <Text style={styles.sectionTitle}>On the side</Text>

          {extras.map((extra) => {
            const selected = selectedExtras.includes(extra.id);

            return (
              <Pressable
                key={extra.id}
                style={styles.extraRow}
                onPress={() =>
                  setSelectedExtras((current) =>
                    selected
                      ? current.filter((id) => id !== extra.id)
                      : [...current, extra.id],
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.extraLeft}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Ionicons name="checkmark" size={15} color={colors.surface} />}
                  </View>
                  <Text style={styles.extraName}>{extra.name}</Text>
                </View>

                <Text style={styles.extraPrice}>+${extra.price.toFixed(2)}</Text>
              </Pressable>
            );
          })}


        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <SafeAreaView style={styles.checkoutArea} edges={['bottom']}>
      <View style={styles.orderBar}>
            <View style={styles.quantityControl}>
              <Pressable
                accessibilityLabel="Decrease quantity"
                disabled={quantity === 1}
                style={styles.quantityButton}
                onPress={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Ionicons name="remove" size={19} color={colors.text} />
              </Pressable>

              <Text style={styles.quantity}>{quantity}</Text>

              <Pressable
                accessibilityLabel="Increase quantity"
                style={styles.quantityButton}
                onPress={() => setQuantity((value) => value + 1)}
              >
                <Ionicons name="add" size={19} color={colors.text} />
              </Pressable>
            </View>

        <Pressable
          style={styles.cartButton}
          onPress={handleAddToCart}
        >
<Text style={styles.cartActionText}>Add to cart</Text>
          <Text style={styles.cartPrice}>${totalPrice.toFixed(2)}</Text>
        </Pressable>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 20,
  },

  hero: {
    height: 310, position: 'relative', backgroundColor: colors.surfaceSecondary, borderBottomLeftRadius: 145, borderBottomRightRadius: 145, overflow: 'hidden',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    padding: 22,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },

  title: {
    fontFamily: fonts.heading, flex: 1, fontSize: 32, lineHeight: 38, color: colors.text,
  },

  price: {
    fontFamily: fonts.semibold, fontSize: 24, color: colors.text, marginTop: 12,
  },

  meta: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  delivery: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '400',
    color: colors.primary,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },

  sectionTitle: {
    fontFamily: fonts.heading, fontSize: 21, color: colors.text, marginTop: 22, marginBottom: 13,
  },

  sectionTitleNoMargin: {
    fontFamily: fonts.heavy,
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
  },

  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  sizeButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sizeButtonSelected: {
    backgroundColor: colors.cta,
    borderColor: colors.ctaBorder,
  },

  sizeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
  },

  sizeTextSelected: {
    color: colors.onDark,
  },

  description: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 16,
  },

  extraRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  extraLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  extraName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },

  extraPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  quantitySection: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantityControl: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.surface, borderRadius: 28, padding: 3,
  },

  quantityButton: {
    width: 40, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },

  quantity: {
    fontFamily: fonts.heavy,
    minWidth: 22,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },

  bottomSpace: {
    height: 110,
  },

  checkoutArea: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },

  cartButton: {
    flex: 1, minHeight: 56, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, borderRadius: 28, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
  },

  cartSmall: {
    fontFamily: fonts.heavy,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 1,
  },

  cartPrice: {
    fontFamily: fonts.heavy, color: colors.gold, fontSize: 17,
  },

  cartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cartActionText: {
    fontFamily: fonts.bold, color: colors.onDark, fontSize: 15, letterSpacing: 0.3,
  },
  ingredients: { marginTop: 9, fontSize: 11, lineHeight: 15 },
  dishSubtitle: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.8, color: colors.textSecondary, marginTop: 8, textTransform: 'uppercase' },
  orderBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },

});


