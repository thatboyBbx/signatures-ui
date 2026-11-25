import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useIsFocused,
  useRoute,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { TrackingExperience } from '../components/TrackingExperience';
import { Skeleton } from '../../../components/Skeleton';

import { useOrders } from '../../../context/OrderContext';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { OrderStatus } from '../../../types/order';
import { colors, radius, spacing, fonts } from '../../../theme/theme';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'OrderTracking'
>;

type Navigation =
  NativeStackNavigationProp<RootStackParamList>;

type TimelineStatus = Exclude<
  OrderStatus,
  'cancelled'
>;

const timeline: {
  status: TimelineStatus;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    status: 'confirmed',
    title: 'Order confirmed',
    description:
      'Signatures has received your order.',
    icon: 'checkmark',
  },
  {
    status: 'preparing',
    title: 'Preparing your food',
    description:
      'The kitchen is preparing your order.',
    icon: 'restaurant-outline',
  },
  {
    status: 'ready',
    title: 'Ready',
    description:
      'Your food is packed and ready.',
    icon: 'bag-check-outline',
  },
  {
    status: 'awaiting_driver',
    title: 'Finding a driver',
    description:
      'We are finding a nearby driver for you.',
    icon: 'search-outline',
  },
  {
    status: 'driver_assigned',
    title: 'Driver assigned',
    description:
      'A driver has been assigned to your delivery.',
    icon: 'person-outline',
  },
  {
    status: 'heading_to_restaurant',
    title: 'Heading to restaurant',
    description:
      'Your driver is travelling to Signatures.',
    icon: 'navigate-outline',
  },
  {
    status: 'arrived_at_restaurant',
    title: 'At the restaurant',
    description:
      'Your driver has arrived to collect the order.',
    icon: 'restaurant-outline',
  },
  {
    status: 'picked_up',
    title: 'Picked up',
    description:
      'Your driver has collected your order.',
    icon: 'bag-check-outline',
  },
  {
    status: 'on_the_way',
    title: 'On the way',
    description:
      'Your driver is heading to your address.',
    icon: 'bicycle-outline',
  },
  {
    status: 'delivered',
    title: 'Delivered',
    description:
      'Your order has arrived. Enjoy!',
    icon: 'home-outline',
  },
];

const statusOrder: TimelineStatus[] = [
  'confirmed',
  'preparing',
  'ready',
  'awaiting_driver',
  'driver_assigned',
  'heading_to_restaurant',
  'arrived_at_restaurant',
  'picked_up',
  'on_the_way',
  'delivered',
];

function getHeroMessage(status: OrderStatus) {
  switch (status) {
    case 'confirmed':
      return 'Your order has been confirmed.';
    case 'preparing':
      return 'The kitchen is preparing your food.';
    case 'ready':
      return 'Your order is ready for collection.';
    case 'awaiting_driver':
      return 'We are finding a driver nearby.';
    case 'driver_assigned':
      return 'A driver has been assigned.';
    case 'heading_to_restaurant':
      return 'Your driver is heading to Signatures.';
    case 'arrived_at_restaurant':
      return 'Your driver is collecting the order.';
    case 'picked_up':
      return 'Your order has been picked up.';
    case 'on_the_way':
      return 'Your order is on the way.';
    case 'delivered':
      return 'Your order has been delivered.';
    case 'cancelled':
      return 'This order was cancelled.';
  }
}

export function OrderTrackingScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Props['route']>();
  const focused = useIsFocused();

  const {
    getOrder,
    refreshOrder,
    loading,
    addOrder,
  } = useOrders();
  const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';
  const [refreshError, setRefreshError] =
    useState<string | null>(null);

  const order = getOrder(route.params.orderId);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const manualRefresh = async () => {
    if (refreshing) return;
    if (preview) { setUpdatedAt(new Date()); return; }
    setRefreshing(true);
    try {
      await refreshOrder(route.params.orderId);
      setRefreshError(null);
      setUpdatedAt(new Date());
    } catch {
      setRefreshError('Could not refresh your order. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (preview) { setUpdatedAt(new Date()); return; }
    if (!focused) return;

    const syncOrder = async () => {
      try {
        await refreshOrder(route.params.orderId);

        if (!cancelled) {
          setRefreshError(null);
          setUpdatedAt(new Date());
        }
      } catch (error) {
        console.error(
          'Failed to refresh order tracking:',
          error,
        );

        if (!cancelled) {
          setRefreshError(
            'Live updates are temporarily unavailable.',
          );
        }
      }
    };

    void syncOrder();

    const interval = setInterval(
      () => { if (AppState.currentState === 'active') void syncOrder(); },
      15000,
    );

    const appStateSubscription =
      AppState.addEventListener(
        'change',
        (state) => {
          if (state === 'active') {
            void syncOrder();
          }
        },
      );

    return () => {
      cancelled = true;
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [route.params.orderId, focused]);

  if (!order && loading) {
    // Dark skeleton so the cinematic screen never flashes a white spinner while loading.
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0B08', padding: 20, paddingTop: 80, gap: 16 }}>
        <View style={{ width: '100%', maxWidth: 620, alignSelf: 'center', gap: 16 }}>
          <Skeleton tone="dark" width={150} height={28} radius={14} />
          <Skeleton tone="dark" width="70%" height={40} radius={10} />
          <Skeleton tone="dark" width="55%" height={16} />
          <View style={{ height: 120 }} />
          <Skeleton tone="dark" height={92} radius={24} />
          <Skeleton tone="dark" height={190} radius={24} />
          <Skeleton tone="dark" height={84} radius={24} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Track order
          </Text>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.notFound}>
          {loading ? (
            <>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.notFoundTitle}>
                Loading your order...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="receipt-outline"
                size={40}
                color={colors.primary}
              />

              <Text style={styles.notFoundTitle}>
                Order not found
              </Text>

              <Pressable
                style={styles.retryButton}
                accessibilityRole="button"
                disabled={refreshing}
                onPress={() => void manualRefresh()}
              >
                <Text style={styles.retryButtonText}>
                  {refreshing ? 'Refreshing…' : 'Try again'}
                </Text>
              </Pressable>
              {refreshError && <Text accessibilityRole="alert" style={styles.syncWarningText}>{refreshError}</Text>}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return <TrackingExperience order={order} refreshing={refreshing} onRefresh={() => void manualRefresh()}
    updatedAt={updatedAt} refreshError={refreshError} preview={preview} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  stageContainer: { backgroundColor: '#140E0A' },
  stageButton: { backgroundColor: 'rgba(20,14,10,0.55)', borderColor: 'rgba(233,211,174,0.35)' },
  stageHeaderTitle: { color: colors.onDark },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, minHeight: 600 },
  sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  statusCard: { marginTop: 6, padding: 18, gap: 10, borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statusEyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.primary },
  statusMessage: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text },
  statusTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' },
  statusFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  previewPanel: { marginTop: 14, padding: 14, gap: 10, borderRadius: radius.xxl, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },

  safeArea: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
  },

  placeholder: {
    width: 44,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  heroCard: {
    marginTop: 10,
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.black,
  },

  heroTop: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroLabel: {
    fontFamily: fonts.heavy,
    color: colors.gold,
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 1.2,
  },

  heroTime: {
    fontFamily: fonts.heavy,
    marginTop: 4,
    color: colors.surface,
    fontSize: 28,
    fontWeight: '400',
  },

  deliveryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroMessage: {
    fontFamily: fonts.body,
    marginTop: 16,
    color: '#D6C5B0',
    fontSize: 13,
  },

  progressTrack: {
    height: 5,
    marginTop: 18,
    borderRadius: 3,
    backgroundColor: '#433323',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  orderId: {
    fontFamily: fonts.bold,
    marginTop: 12,
    color: '#C9B69B',
    fontSize: 10,
    fontWeight: '400',
  },

  syncWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  syncWarningText: {
    fontFamily: fonts.body,
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  sectionTitle: {
    fontFamily: fonts.heading,
    marginTop: 27,
    marginBottom: 13,
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
  },

  timelineCard: {
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  timelineRow: {
    flexDirection: 'row',
  },

  timelineIndicator: {
    width: 42,
    alignItems: 'center',
  },

  timelineCircle: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineCircleComplete: {
    backgroundColor: colors.primary,
  },

  timelineCircleCurrent: {
    borderWidth: 4,
    borderColor: colors.border,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 39,
    backgroundColor: colors.border,
  },

  timelineLineComplete: {
    backgroundColor: colors.primary,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingTop: 6,
  },

  timelineContentSpacing: {
    paddingBottom: 25,
  },

  timelineTitle: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },

  timelineTitleInactive: {
    color: colors.textSecondary,
  },

  timelineDescription: {
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  currentBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },

  currentBadgeText: {
    fontFamily: fonts.heavy,
    fontSize: 8,
    fontWeight: '400',
    letterSpacing: 0.8,
    color: colors.primary,
  },

  driverCard: {
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },

  driverContent: {
    flex: 1,
    marginLeft: 12,
  },

  driverName: {
    fontFamily: fonts.heavy,
    color: colors.text,
    fontSize: 15,
    fontWeight: '400',
  },

  driverMeta: {
    fontFamily: fonts.body,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  driverLiveBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E8EDDF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  driverLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  driverLiveText: {
    fontFamily: fonts.heavy,
    color: colors.success,
    fontSize: 8,
    fontWeight: '400',
    letterSpacing: 0.7,
  },

  infoCard: {
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoLabel: {
    fontFamily: fonts.heavy,
    fontSize: 8,
    fontWeight: '400',
    letterSpacing: 1,
    color: colors.textSecondary,
  },

  infoTitle: {
    fontFamily: fonts.heavy,
    marginTop: 3,
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
  },

  infoDescription: {
    fontFamily: fonts.body,
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
  },

  infoDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: colors.border,
  },

  summaryCard: {
    padding: 17,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },

  quantityBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    fontWeight: '400',
    color: colors.primary,
  },

  itemInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  itemName: {
    fontFamily: fonts.heavy,
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
  },

  itemOptions: {
    fontFamily: fonts.body,
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSecondary,
  },

  itemPrice: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },

  priceRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  priceLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },

  priceValue: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },

  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14,
  },

  totalLabel: {
    fontFamily: fonts.heavy,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
  },

  totalValue: {
    fontFamily: fonts.heavy,
    fontSize: 17,
    fontWeight: '400',
    color: colors.primary,
  },

  devControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  devButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  devButtonActive: {
    backgroundColor: colors.cta,
    borderColor: colors.ctaBorder,
  },

  devButtonText: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  devButtonTextActive: {
    color: colors.surface,
  },
  cancelledCard: {
    marginTop: 24,
    padding: 18,
    flexDirection: 'row',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelledContent: {
    flex: 1,
    marginLeft: 12,
  },

  cancelledTitle: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },

  cancelledDescription: {
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notFoundTitle: {
    fontFamily: fonts.heavy,
    marginTop: 14,
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.cta,
  },

  retryButtonText: {
    fontFamily: fonts.heavy,
    color: colors.surface,
    fontSize: 12,
    fontWeight: '400',
  },

  bottomSpace: {
    height: 45,
  },
});
