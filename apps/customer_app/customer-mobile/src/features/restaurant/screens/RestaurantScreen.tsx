import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { ParamountTray } from '../../../components/ParamountTray';
import { useMenu } from '../../../context/MenuContext';
import { DishSkeletons, MenuState, useMenuLoading } from '../../../components/MenuState';
import { MealDealCard } from '../../home/components/HomeExtras';
import { colors, fonts } from '../../../theme/theme';
import { AtmosphereVideo } from '../../../components/AtmosphereVideo';
import { ParamountDock, dockRoutes } from '../../../components/ParamountTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AtmosphereProvider } from '../../../context/AtmosphereContext';
import { IngredientLine, TrayBar, TRAY_BAR_SPACE } from '../../../components/TrayBar';
import { ingredientLine } from '../../../sample-data/dishDetails';
import { useRatings } from '../../../context/RatingsContext';
import { useCart } from '../../../context/CartContext';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

export function RestaurantScreen() {
  const { menu: liveMenu, preview } = useMenu();
  const categories = ['All', ...new Set(liveMenu.map(item => item.category))];
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [category, setCategory] = useState('All');
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const titleSize = Math.min(64, Math.max(44, Math.min(width, 820) * 0.14));
  const insets = useSafeAreaInsets();
  const { dishRating } = useRatings();
  const { itemCount } = useCart();
  const menuLoading = useMenuLoading();
  const menu = liveMenu.filter(item => category === 'All' || item.category === category);
  return <View style={styles.screen}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, itemCount > 0 && { paddingBottom: 130 + TRAY_BAR_SPACE }]}>
      <View style={styles.hero}>
        {/* Real grill footage, continuing from Home's "Explore the menu". Flat scrim, no gradient. */}
        <AtmosphereProvider><AtmosphereVideo variant="grill" /></AtmosphereProvider>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,11,8,0.5)' }]} />
        <SafeAreaView edges={['top']} style={styles.controls}>
          <Pressable accessibilityLabel="Back" style={styles.circle} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={colors.onDark} /></Pressable>
          <ParamountTray onPress={() => navigation.navigate('Cart')} />
        </SafeAreaView>
        <View style={styles.heroCopy}><Text accessibilityRole="header" style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.06) }]}>Our menu.</Text><Text style={styles.titleItalic}>Straight from the fire.</Text></View>
      </View>
      <View style={styles.sheet}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: category === option }} onPress={() => setCategory(option)} style={[styles.chip, category === option && styles.activeChip]}>
            <Text style={[styles.chipText, category === option && styles.activeText]}>{option}</Text>
          </Pressable>)}
        </ScrollView>
        <MenuState /><View style={styles.sectionHeading}><Text style={styles.heading}>{category === 'All' ? 'Signature dishes' : category}</Text><Text style={styles.sample}>{menuLoading ? '' : `${preview ? 'Sample menu' : 'Venue menu'} · ${menu.length} dishes`}</Text></View>
        {(category === 'All' || category === 'Burgers') && <MealDealCard />}
        <View style={styles.grid}>
          {menuLoading && <DishSkeletons variant="grid" count={columns * 2} width={columns === 3 ? '31.8%' : '48.2%'} />}
          {menu.map(item => <Pressable photoMotion key={item.id} accessibilityLabel={`Choose ${item.name}, ${item.price}`} onPress={() => navigation.navigate('FoodDetails', { menuItemId: item.id, name: item.name, price: item.price, image: item.image })}
            style={[styles.card, { width: columns === 3 ? '31.8%' : '48.2%' }]}>
            <Image source={{ uri: item.image }} style={styles.photo} />
            <View style={styles.cardCopy}><Text style={styles.dishName}>{item.name}</Text><IngredientLine dark lines={2} line={ingredientLine(item.name, item.description)} style={{ marginTop: -4 }} /><View style={styles.priceRow}><Text style={styles.price}>{item.price}{(() => { const rating = dishRating(item.name); return rating ? `  ·  ★ ${rating.average.toFixed(1)}` : ''; })()}</Text><View style={styles.add}><Ionicons name="add" size={20} color={colors.text} /></View></View></View>
          </Pressable>)}
        </View>
        {menu.length === 0 && !menuLoading && <View style={styles.empty}><Ionicons name="restaurant-outline" size={28} color={colors.primary} /><Text style={styles.heading}>More to come</Text><Text style={styles.emptyText}>No dishes in this category yet.</Text><Pressable style={styles.chip} onPress={() => setCategory('All')}><Text style={styles.chipText}>Explore all dishes</Text></Pressable></View>}
      </View>
    </ScrollView>
    <TrayBar bottomInset={insets.bottom} onPress={() => navigation.navigate('Checkout')} />
    <ParamountDock bottomInset={insets.bottom} onSelect={index => navigation.popTo('MainTabs', { screen: dockRoutes[index] })} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 130 },
  hero: { height: 360, backgroundColor: colors.black, overflow: 'hidden' },
  controls: { position: 'absolute', left: 20, right: 20, top: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(17,12,8,0.45)', borderWidth: 1, borderColor: 'rgba(233,211,174,0.3)', alignItems: 'center', justifyContent: 'center' },
  titleItalic: { fontFamily: fonts.headingItalic, fontSize: 30, lineHeight: 36, color: colors.gold, marginTop: -4 },
  heroCopy: { position: 'absolute', left: 24, right: 24, bottom: 52, gap: 2 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 9, lineHeight: 16, letterSpacing: 2.2, color: colors.onDark },
  title: { fontFamily: fonts.heading, fontSize: 46, lineHeight: 52, color: colors.onDark },
  subtitle: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.onDark },
  sheet: { marginTop: -25, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 15 },
  categories: { gap: 7, paddingBottom: 8 },
  chip: { minHeight: 44, paddingHorizontal: 17, justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 23 },
  activeChip: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 11, color: colors.text },
  activeText: { color: colors.onDark },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginVertical: 13 },
  heading: { fontFamily: fonts.heading, fontSize: 23, color: colors.text },
  sample: { fontFamily: fonts.body, fontSize: 10, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13 },
  card: { backgroundColor: colors.black, borderRadius: 16, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1.04 },
  cardCopy: { padding: 10, gap: 8 },
  dishName: { fontFamily: fonts.heading, fontSize: 17, color: colors.onDark },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  price: { fontFamily: fonts.medium, fontSize: 13, color: colors.onDark },
  add: { width: 29, height: 29, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 13 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  note: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 22, marginTop: 28, gap: 5 },
  noteTitle: { fontFamily: fonts.headingItalic, fontSize: 25, color: colors.primary },
  noteCopy: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
