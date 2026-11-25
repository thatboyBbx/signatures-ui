import { Text, View, type DimensionValue } from 'react-native';
import { Skeleton } from './Skeleton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useMenu } from '../context/MenuContext';
import { useCheckout } from '../context/CheckoutContext';
import { ParamountPressable } from './ParamountPressable';
import { colors, fonts } from '../theme/theme';
export function MenuState() {
    const { loading, error, reload, preview, menu } = useMenu();
    const { venue } = useCheckout();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    if (preview) return null;
    // Loading is shown by the skeleton cards (DishSkeletons), not a text line.
    const message = loading ? '' : error || (!menu.length ? 'No menu items at this venue yet.' : '');
    if (!message)
        return null;
    return <View style={{ paddingVertical: 14, gap: 10 }}><Text accessibilityRole={error ? 'alert' : 'text'} style={{ color: colors.textSecondary, fontFamily: fonts.body }}>{message}</Text>{!preview && (!!error || !venue) && <ParamountPressable onPress={() => venue ? reload() : navigation.navigate('Venue')} style={{ paddingVertical: 14 }}><Text style={{ fontFamily: fonts.bold, color: colors.text }}>{venue ? 'Retry menu' : 'Choose venue'}</Text></ParamountPressable>}</View>;
}

/** True while the first menu for a venue is loading (nothing to show yet). */
export function useMenuLoading() {
    const { loading, preview, menu } = useMenu();
    return !preview && loading && !menu.length;
}

/** Placeholder dish cards shaped like the real ones: Home carousel, menu grid or search list. */
export function DishSkeletons({ variant, count = 4, width }: { variant: 'carousel' | 'grid' | 'list'; count?: number; width?: DimensionValue }) {
    const cards = Array.from({ length: count }, (_, index) => index);
    if (variant === 'carousel') return <>{cards.map(index => <View key={index} accessibilityLabel={index === 0 ? 'Loading menu' : undefined} style={{ width: 236, borderRadius: 19, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <Skeleton height={172} radius={0} />
        <View style={{ padding: 12, gap: 9 }}><Skeleton width="70%" height={18} /><Skeleton width="55%" height={10} /><Skeleton width="30%" height={14} /></View>
    </View>)}</>;
    if (variant === 'grid') return <>{cards.map(index => <View key={index} accessibilityLabel={index === 0 ? 'Loading menu' : undefined} style={{ width: width ?? '48.2%', borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface }}>
        <View style={{ aspectRatio: 1.04 }}><Skeleton height="100%" radius={0} /></View>
        <View style={{ padding: 10, gap: 8 }}><Skeleton width="80%" height={17} /><Skeleton width="60%" height={10} /><Skeleton width="35%" height={13} /></View>
    </View>)}</>;
    return <>{cards.map(index => <View key={index} accessibilityLabel={index === 0 ? 'Loading menu' : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: colors.surface }}>
        <Skeleton width={76} height={76} radius={4} />
        <View style={{ flex: 1, gap: 8 }}><Skeleton width="65%" height={18} /><Skeleton width="50%" height={10} /><Skeleton width="30%" height={12} /></View>
    </View>)}</>;
}
