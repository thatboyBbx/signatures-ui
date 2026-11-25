import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { useCheckout } from '../../../context/CheckoutContext';
import { branchName, branchPlace, getVenues, previewVenues, venueHours, type Venue } from '../../../services/venuesApi';
import { Skeleton } from '../../../components/Skeleton';
import { ParamountDock, dockRoutes } from '../../../components/ParamountTabBar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, fonts } from '../../../theme/theme';

export function VenueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { venue, setVenue } = useCheckout();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';
  useEffect(() => {
    if (preview) {
      setVenues(previewVenues);
      setLoading(false);
      setError(false);
      return;
    }
    let mounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    setLoading(true); setError(false);
    void getVenues(controller.signal).then(data => { if (mounted) setVenues(data); }).catch(() => { if (mounted) setError(true); }).finally(() => { clearTimeout(timeout); if (mounted) setLoading(false); });
    return () => { mounted = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt, preview]);
  return <SafeAreaView style={styles.screen}>
    <View style={styles.top}><Pressable accessibilityLabel="Back" style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.topLabel}>OUR VENUES</Text><View style={{ width: 44 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>Find your spot.</Text>
      {preview && <Text style={styles.previewNote}>Preview locations — confirm branch details before live ordering.</Text>}
      {loading && <View accessibilityLabel="Loading venues" style={{ gap: 16 }}>{[0, 1, 2].map(index => <View key={index} style={styles.venue}><Skeleton width={44} height={44} radius={22} /><View style={{ flex: 1, gap: 9 }}><Skeleton width="70%" height={20} /><Skeleton width="40%" height={12} /></View></View>)}</View>}
      {!loading && error && <View style={styles.state}><Ionicons name="storefront-outline" size={32} color={colors.primary} /><Text style={styles.stateTitle}>Venues unavailable</Text><Text accessibilityRole="alert" style={styles.body}>We couldn’t load locations. Please try again.</Text><Pressable style={styles.retry} onPress={() => setAttempt(value => value + 1)}><Text style={styles.retryText}>Try again</Text></Pressable></View>}
      {!loading && !error && venues.length === 0 && <View style={styles.state}><Text style={styles.stateTitle}>No venues listed yet</Text><Pressable style={styles.retry} onPress={() => setAttempt(value => value + 1)}><Text style={styles.retryText}>Refresh</Text></Pressable></View>}
      {!loading && !error && venues.map(item => {
        const available = item.is_open && item.accepting_orders;
        const selected = item.id === venue?.id;
        const hours = venueHours(item.hours);
        const place = branchPlace(item);
        return <Pressable key={item.id} disabled={!available} accessibilityLabel={`${branchName(item.name)}, ${available ? 'select venue' : item.is_open ? 'not accepting orders' : 'closed'}`} accessibilityState={{ selected }} onPress={() => { setVenue(item); navigation.goBack(); }} style={[styles.venue, selected && styles.venueSelected]}>
          <View style={styles.venueTop}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.venueName}>{branchName(item.name)}</Text>
              {place ? <Text style={styles.place}>{place}</Text> : <Text style={styles.place}>{item.city}</Text>}
            </View>
            <View style={[styles.select, selected && styles.selectOn]}>
              <Ionicons name={selected ? 'checkmark' : 'arrow-forward'} size={19} color={selected ? colors.onDark : colors.primary} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.badge}>
              <View style={[styles.dot, { backgroundColor: !available ? colors.error : hours.open === false ? colors.warning : colors.success }]} />
              <Text style={styles.badgeText}>{!available ? (item.is_open ? 'Orders paused' : 'Closed') : hours.open === false ? 'Closed now · order ahead' : hours.open ? 'Open now' : 'Accepting orders'}</Text>
            </View>
            {hours.label ? <View style={styles.badge}><Ionicons name="time-outline" size={13} color={colors.textSecondary} /><Text style={styles.badgeText}>{hours.label}</Text></View> : null}
          </View>
          {(item.phone || item.mapQuery) && <View style={styles.actions}>
            {item.phone && <Pressable accessibilityRole="link" accessibilityLabel={`Call ${branchName(item.name)}`} style={styles.action} onPress={() => void Linking.openURL(`tel:${item.phone!.replace(/\s/g, '')}`)}>
              <Ionicons name="call-outline" size={15} color={colors.primary} /><Text style={styles.actionText}>{item.phone}</Text>
            </Pressable>}
            {item.mapQuery && <Pressable accessibilityRole="link" accessibilityLabel={`Directions to ${branchName(item.name)}`} style={styles.action} onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery!)}`)}>
              <Ionicons name="navigate-outline" size={15} color={colors.primary} /><Text style={styles.actionText}>Directions</Text>
            </Pressable>}
          </View>}
          {!item.hours && !item.phone && <Text style={styles.unlisted}>Branch details coming soon.</Text>}
        </Pressable>;
      })}
    </ScrollView>
    <ParamountDock bottomInset={insets.bottom} onSelect={index => navigation.popTo('MainTabs', { screen: dockRoutes[index] })} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  topLabel: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: colors.primary },
  content: { padding: 22, gap: 16, paddingBottom: 130 },
  title: { fontFamily: fonts.heading, fontSize: 38, color: colors.text, marginBottom: 12 },
  previewNote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textSecondary, marginTop: -18, marginBottom: 8 },
  venue: { padding: 20, gap: 14, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  venueSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  venueTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  place: { fontFamily: fonts.headingItalic, fontSize: 17, lineHeight: 22, color: colors.primary },
  select: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  selectOn: { backgroundColor: colors.cta, borderColor: colors.ctaBorder },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: fonts.medium, fontSize: 11, color: colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.surfaceSecondary },
  actionText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  unlisted: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  venueName: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 36, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  status: { fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
  state: { minHeight: 230, justifyContent: 'center', alignItems: 'center', gap: 14 },
  stateTitle: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  retry: { minHeight: 46, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 23, backgroundColor: colors.primary },
  retryText: { fontFamily: fonts.medium, fontSize: 13, color: colors.onDark },
});
