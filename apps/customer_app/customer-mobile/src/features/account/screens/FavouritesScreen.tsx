import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFavourites } from '../../../context/FavouritesContext';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { ParamountSubPage, WoodPanel } from '../../../components/ParamountSubPage';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, fonts } from '../../../theme/theme';

export function FavouritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { favourites, toggle } = useFavourites();
  return <ParamountSubPage eyebrow="SAVED FOR LATER" title="Favourites" italic="The ones worth repeating.">
    {favourites.length === 0 ? <WoodPanel style={styles.empty}>
      <Ionicons name="heart-outline" size={30} color={colors.gold} />
      <Text style={styles.emptyTitle}>Nothing saved yet</Text>
      <Text style={styles.emptyBody}>Tap the heart on any dish to keep it here.</Text>
      <Pressable accessibilityRole="button" style={styles.emptyButton} onPress={() => navigation.navigate('Restaurant')}>
        <Text style={styles.emptyButtonText}>Browse the menu</Text><Ionicons name="arrow-forward" size={17} color={colors.onDark} />
      </Pressable>
    </WoodPanel> : <View style={styles.grid}>
      {favourites.map(item => <Pressable key={item.key} photoMotion accessibilityLabel={`${item.name}, ${item.price}`} style={styles.card}
        onPress={() => navigation.navigate('FoodDetails', { menuItemId: item.menuItemId, name: item.name, price: item.price, image: item.image })}>
        {item.image ? <Image source={{ uri: item.image }} style={styles.photo} /> : <View style={[styles.photo, styles.photoEmpty]}><Ionicons name="restaurant" size={26} color={colors.gold} /></View>}
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name} from favourites`} style={styles.heart} onPress={() => toggle(item)}>
          <Ionicons name="heart" size={18} color="#B4461F" />
        </Pressable>
        <View style={styles.copy}><Text numberOfLines={2} style={styles.name}>{item.name}</Text><Text style={styles.price}>{item.price}</Text></View>
      </Pressable>)}
    </View>}
  </ParamountSubPage>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, paddingVertical: 34 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 26, color: colors.onDark },
  emptyBody: { fontFamily: fonts.body, fontSize: 13, color: '#D4C5AD', textAlign: 'center' },
  emptyButton: { marginTop: 8, minHeight: 48, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary },
  emptyButtonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: { width: '48.3%', borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  photo: { width: '100%', height: 140 },
  photoEmpty: { backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  heart: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  copy: { padding: 12, gap: 6 },
  name: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 22, color: colors.text },
  price: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
});
