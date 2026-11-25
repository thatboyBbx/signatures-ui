import { useAtmosphere } from '../../../context/AtmosphereContext';
import { useReducedMotion } from '../../../components/useReducedMotion';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParamountHero } from '../../../components/ParamountHero';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { useCheckout } from '../../../context/CheckoutContext';
import { branchName, branchPlace } from '../../../services/venuesApi';
import { useMenu } from '../../../context/MenuContext';
import { DishSkeletons, MenuState, useMenuLoading } from '../../../components/MenuState';
import { IngredientLine, TrayBar, TRAY_BAR_SPACE } from '../../../components/TrayBar';
import { ingredientLine } from '../../../sample-data/dishDetails';
import { useRatings } from '../../../context/RatingsContext';
import { useCart } from '../../../context/CartContext';
import { ReorderStrip } from '../components/HomeExtras';
import { colors, fonts } from '../../../theme/theme';
import type { RootStackParamList, MainTabParamList } from '../../../navigation/AppNavigator';

type Navigation = CompositeNavigationProp<BottomTabNavigationProp<MainTabParamList, 'Home'>, NativeStackNavigationProp<RootStackParamList>>;

export function HomeScreen() {
  const { menu: liveMenu } = useMenu();
  const navigation = useNavigation<Navigation>();
  const { venue } = useCheckout();
  const { setScrolled, scrollY, heroHeight, setLightHeader } = useAtmosphere();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [venueWidth, setVenueWidth] = useState(0);
  const venueTitleFontSize = venue ? Math.min(56, Math.max(40, venueWidth * 0.13)) : Math.min(34, Math.max(26, venueWidth * 0.08));
  const discover = (searchQuery = '') => navigation.navigate('Search', { query: searchQuery });
  const { dishRating } = useRatings();
  const { itemCount } = useCart();
  const menuLoading = useMenuLoading();
  const featuredMenu = [...liveMenu].sort((a, b) => (dishRating(b.name)?.average ?? 0) - (dishRating(a.name)?.average ?? 0));
  return <View style={styles.screen}>
    <ScrollView onScroll={event => { const offset = event.nativeEvent.contentOffset.y; scrollY.setValue(offset); setScrolled(offset >= heroHeight - 66 - insets.top); setLightHeader(offset >= heroHeight - 12 - insets.top); }} scrollEventThrottle={16} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, itemCount > 0 && { paddingBottom: 110 + TRAY_BAR_SPACE }]}>
      <View style={{ paddingHorizontal: 20, backgroundColor: colors.black }}><ParamountHero onOrder={() => navigation.navigate('Restaurant')} /></View>
      <View style={{ backgroundColor: colors.black, marginTop: -28 }}>
      <Animated.View style={[styles.sheet, !reduced && { transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 280], outputRange: [18, 0], extrapolate: 'clamp' }) }] }]}>
        <View style={styles.handle} />
        <ReorderStrip onDone={() => navigation.navigate('Cart')} />
        <Pressable accessibilityLabel={venue ? `Change branch, ${venue.name}` : 'Choose your branch'} style={styles.venueCard} onLayout={event => setVenueWidth(event.nativeEvent.layout.width)} onPress={() => navigation.navigate('Venue')}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={require('../../../../assets/paramount/walnut-grain.webp')} resizeMode="repeat" style={{ width: '100%', height: '100%', opacity: 0.24 }} /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(24,17,12,0.4)' }]} /></View>
          <View style={styles.venueCopy}>
            <Text style={styles.venueEyebrow}>{venue ? 'YOUR SELECTED BRANCH' : 'START HERE'}</Text>
            <Text numberOfLines={1} style={[styles.venueTitle, { fontSize: venueTitleFontSize, lineHeight: Math.ceil(venueTitleFontSize * 1.05) }]}>{venue ? branchName(venue.name) : 'Choose a branch'}</Text>
            <Text numberOfLines={1} style={[styles.venueDetail, venue && styles.venuePlace]}>{venue ? branchPlace(venue) || 'View this branch' : 'Find a nearby kitchen and see its menu'}</Text>
          </View>
          <View style={styles.venueArrow}><Ionicons name="arrow-forward" size={19} color={colors.onDark} /></View>
        </Pressable>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}><Ionicons name="search-outline" size={21} color={colors.textSecondary} />
            <TextInput accessibilityLabel="Search meals" style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={() => discover(query)} returnKeyType="search" placeholder="What are you craving?" placeholderTextColor={colors.textSecondary} />
          </View>
        </View>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIntro}><Text accessibilityRole="header" numberOfLines={1} style={styles.heading}>Our favourites</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="View the full menu" onPress={() => navigation.navigate('Restaurant')} style={styles.fullMenu}><Text style={styles.fullMenuText}>View menu</Text><Ionicons name="arrow-forward" size={17} color={colors.onDark} /></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishes}>
          <MenuState />{menuLoading && <DishSkeletons variant="carousel" count={3} />}{featuredMenu.map((item, index) => <Pressable photoMotion key={item.id} accessibilityLabel={`View ${item.name}`} style={styles.dish} onPress={() => navigation.navigate('FoodDetails', { menuItemId: item.id, name: item.name, price: item.price, image: item.image })}>
            <View style={styles.dishPhotoWrap}><Image source={{ uri: item.image }} style={styles.dishImage} /><View style={styles.dishTag}><Text style={styles.dishTagText}>{index === 0 ? 'A SIGNATURE PICK' : item.category.toUpperCase()}</Text></View><View style={styles.dishAdd}><Ionicons name="arrow-forward" size={18} color={colors.text} /></View></View>
            <View style={styles.dishCopy}><View style={{ gap: 4 }}><Text style={styles.dishName}>{item.name}</Text><IngredientLine line={ingredientLine(item.name, item.description)} /></View><View style={styles.priceRow}><Text style={styles.price}>{item.price}</Text>{(() => { const rating = dishRating(item.name); return rating ? <Text style={styles.caption}>★ {rating.average.toFixed(1)}</Text> : null; })()}</View></View>
          </Pressable>)}
        </ScrollView>
        <View style={{ height: 24 }} />
        <Pressable photoMotion accessibilityLabel="Enter The Bar, cocktails and mocktails" style={styles.restaurant} onPress={() => navigation.navigate('Bar')}>
          <Image source={require('../../../../assets/paramount/bar-drinks.jpg')} style={styles.restaurantImage} /><View style={styles.restaurantCopy}><View style={styles.restaurantDetails}><Text style={styles.restaurantCuisine}>A CHANGE OF PACE</Text><Text style={styles.restaurantTitle}>THE BAR.</Text><Text style={styles.restaurantCuisine}>COCKTAILS / MOCKTAILS</Text></View><Ionicons name="arrow-forward" size={30} color="#D7BB7E" /></View>
        </Pressable>
      </Animated.View>
      </View>
    </ScrollView>
    <TrayBar bottomInset={insets.bottom} onPress={() => navigation.navigate('Checkout')} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 110 },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.background },
  handle: { width: 34, height: 3, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  venueCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 22, paddingVertical: 17, marginBottom: 22, borderRadius: 22, backgroundColor: '#302116', borderWidth: 1, borderColor: '#A5885D', overflow: 'hidden' },
  venueIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(234,227,214,0.13)', borderWidth: 1, borderColor: '#C6A77E80', alignItems: 'center', justifyContent: 'center' },
  venueCopy: { flex: 1, minWidth: 0, gap: 6 },
  venueEyebrow: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 14, letterSpacing: 1.6, color: '#E4CC9E' },
  // Brand pairing from the hero: DM Serif Display for the branch, gold italic for the place.
  venueTitle: { fontFamily: fonts.heading, color: colors.onDark, letterSpacing: -0.5, includeFontPadding: false },
  venuePlace: { fontFamily: fonts.headingItalic, fontSize: 20, lineHeight: 24, color: colors.gold },
  venueDetail: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#D4C5AD' },
  venueArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  caption: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  searchRow: { marginBottom: 28 },
  searchBox: { width: '100%', minHeight: 54, backgroundColor: colors.surface, borderRadius: 27, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  sectionIntro: { flex: 1 },
  sectionEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.6, color: colors.primary },
  heading: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 30, color: colors.text },
  sectionNote: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textSecondary },
  fullMenu: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 24, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder },
  fullMenuText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  link: { fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
  dishes: { gap: 13, paddingRight: 20 },
  dish: { width: 236, borderRadius: 19, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  dishPhotoWrap: { height: 172, backgroundColor: colors.black, overflow: 'hidden' },
  dishImage: { width: '100%', height: '100%' },
  dishTag: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13, backgroundColor: 'rgba(25,19,15,0.82)' },
  dishTagText: { fontFamily: fonts.semibold, fontSize: 8, letterSpacing: 1, color: '#F4EEDF' },
  dishAdd: { position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dishCopy: { padding: 12, gap: 9 },
  dishName: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  restaurant: { borderRadius: 2, backgroundColor: '#19140F', borderWidth: 1, borderColor: '#5D4F3B', overflow: 'hidden', marginBottom: 15 },
  restaurantImage: { width: '100%', height: 175 },
  restaurantCopy: { paddingHorizontal: 18, paddingVertical: 18, gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restaurantDetails: { flex: 1, minWidth: 0, gap: 8 },
  restaurantTitle: { fontFamily: fonts.heavy, fontSize: 48, lineHeight: 50, color: '#F4EEDF', letterSpacing: -2 },
  restaurantCuisine: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.8, color: '#D7BB7E' },
});
