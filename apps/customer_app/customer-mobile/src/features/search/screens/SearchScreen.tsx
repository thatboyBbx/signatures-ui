import { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, fonts } from '../../../theme/theme';
import { useMenu } from '../../../context/MenuContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { branchName } from '../../../services/venuesApi';
import { DishSkeletons, MenuState, useMenuLoading } from '../../../components/MenuState';
import { IngredientLine } from '../../../components/TrayBar';
import { ingredientLine } from '../../../sample-data/dishDetails';
import { useRatings } from '../../../context/RatingsContext';
import type { MainTabParamList, RootStackParamList } from '../../../navigation/AppNavigator';

const sortOptions = ['Popular', 'Price: low to high', 'Price: high to low'] as const;

export function SearchScreen() {
  const { menu: liveMenu, preview } = useMenu();
  const categories = ['All', ...new Set(liveMenu.map(item => item.category))];
  const { venue } = useCheckout();
  const { dishRating } = useRatings();
  const menuLoading = useMenuLoading();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Search'>>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<typeof sortOptions[number]>('Popular');
  useEffect(() => {
    if (route.params) {
      setQuery(route.params.query ?? '');
      setCategory(route.params.category ?? 'All');
      setShowFilters(route.params.filters ?? false);
    }
  }, [route.params]);
  const term = query.trim().toLocaleLowerCase();
  const results = liveMenu.filter(item =>
    (category === 'All' || item.category === category) &&
    `${item.name} ${item.restaurant} ${item.description} ${item.category}`.toLocaleLowerCase().includes(term)
  ).sort((a, b) => sort === 'Popular' ? (dishRating(b.name)?.average ?? 0) - (dishRating(a.name)?.average ?? 0) :
    (Number(a.price.slice(1)) - Number(b.price.slice(1))) * (sort === 'Price: low to high' ? 1 : -1));
  const reset = () => { setQuery(''); setCategory('All'); setSort('Popular'); };
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <MenuState /><Text style={styles.eyebrow}>DISCOVER</Text>
        <Text style={styles.title}>Find your next meal</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color={colors.textSecondary} />
            <TextInput accessibilityLabel="Search meals and restaurants" style={styles.input} value={query} onChangeText={setQuery}
              placeholder="Search food, restaurants..." placeholderTextColor={colors.textSecondary} returnKeyType="search" />
            {query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={12} onPress={() => setQuery('')}>
              <Ionicons name="close-circle-outline" size={23} color={colors.text} />
            </Pressable>}
          </View>
          <Pressable accessibilityLabel="Sort results" accessibilityState={{ expanded: showFilters }} style={styles.filterButton} onPress={() => setShowFilters(value => !value)}>
            <Ionicons name="options-outline" size={23} color={colors.surface} />
          </Pressable>
        </View>
        {showFilters && <View style={{ gap: 8, marginTop: 16 }}>
          <Text style={styles.emptyTitle}>Sort by</Text>
          {sortOptions.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: sort === option }}
            onPress={() => setSort(option)} style={[styles.category, sort === option && styles.categoryActive]}>
            <Text style={[styles.categoryText, sort === option && styles.categoryTextActive]}>{option}</Text>
          </Pressable>)}
        </View>}
        <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map(option => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: category === option }}
            onPress={() => setCategory(option)} style={[styles.category, category === option && styles.categoryActive]}>
            <Text style={[styles.categoryText, category === option && styles.categoryTextActive]}>{option}</Text>
          </Pressable>)}
        </ScrollView>
        <Text style={[styles.emptyDescription, { textAlign: 'left', marginBottom: 16 }]} accessibilityLiveRegion="polite">
          {menuLoading ? ' ' : `${results.length} ${results.length === 1 ? 'meal' : 'meals'} · ${preview ? 'Sample menu' : 'Venue menu'}`}
        </Text>
        {menuLoading && <DishSkeletons variant="list" count={5} />}
        {results.map(item => <Pressable key={item.id} photoMotion accessibilityLabel={`${item.name}, ${item.price}, view details`}
          onPress={() => navigation.navigate('FoodDetails', { menuItemId: item.id, name: item.name, price: item.price, image: item.image })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <Image source={{ uri: item.image }} style={{ width: 76, height: 76, borderRadius: radius.md }} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={[styles.emptyTitle, { textAlign: 'left' }]}>{item.name}</Text>
            <IngredientLine line={ingredientLine(item.name, item.description)} />
            <Text style={styles.categoryText}>{branchName(venue?.name ?? item.restaurant)} · {item.category}</Text>
            <Text style={styles.categoryText}>{item.price}{(() => { const rating = dishRating(item.name); return rating ? ` · ★ ${rating.average.toFixed(1)}` : ''; })()}</Text>
          </View>
        </Pressable>)}
        {results.length === 0 && !menuLoading && <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={30} color={colors.primary} />
          <Text style={styles.emptyTitle}>No matching meals</Text>
          <Text style={styles.emptyDescription}>Try another search or category.</Text>
          <Pressable onPress={reset} style={[styles.category, { marginTop: 20 }]}><Text style={styles.categoryText}>Clear search and filters</Text></Pressable>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  eyebrow: {
    fontFamily: fonts.heavy,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1.4,
  },

  title: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400',
    marginTop: 7,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
  },

  searchBox: {
    flex: 1,
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  input: {
    fontFamily: fonts.body,
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
  },

  filterButton: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categories: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingRight: spacing.xl,
  },

  category: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryActive: {
    backgroundColor: colors.cta,
    borderColor: colors.ctaBorder,
  },

  categoryText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
  },

  categoryTextActive: {
    color: colors.surface,
  },

  emptyState: {
    flex: 1,
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
  },

  emptyDescription: {
    fontFamily: fonts.body,
    marginTop: 8,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
