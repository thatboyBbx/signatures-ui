import { ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOrders } from '../../../context/OrderContext';
import { makePreviewOrder, PREVIEW_ORDER_ID } from '../../../sample-data/previewOrder';
import { useReorder } from '../useReorder';
import { branchName } from '../../../services/venuesApi';
import { Skeleton } from '../../../components/Skeleton';
import { useState } from 'react';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { Order, OrderStatus } from '../../../types/order';
import { colors, radius, spacing, fonts } from '../../../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'confirmed':
      return 'Order confirmed';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'awaiting_driver':
      return 'Finding driver';
    case 'driver_assigned':
      return 'Driver assigned';
    case 'heading_to_restaurant':
      return 'Heading to restaurant';
    case 'arrived_at_restaurant':
      return 'At restaurant';
    case 'picked_up':
      return 'Picked up';
    case 'on_the_way':
      return 'On the way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Order received';
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'confirmed':
      return 'checkmark-circle-outline' as const;
    case 'preparing':
      return 'restaurant-outline' as const;
    case 'ready':
      return 'bag-check-outline' as const;
    case 'awaiting_driver':
      return 'search-outline' as const;
    case 'driver_assigned':
      return 'person-outline' as const;
    case 'heading_to_restaurant':
      return 'navigate-outline' as const;
    case 'arrived_at_restaurant':
      return 'restaurant-outline' as const;
    case 'picked_up':
      return 'bag-check-outline' as const;
    case 'on_the_way':
      return 'bicycle-outline' as const;
    case 'delivered':
      return 'checkmark-done-circle-outline' as const;
    case 'cancelled':
      return 'close-circle-outline' as const;
    default:
      return 'receipt-outline' as const;
  }
}

function OrderCard({
  order,
  onPress,
  onReorder,
}: {
  order: Order;
  onPress: () => void;
  onReorder?: () => void;
}) {
  const previewImage = order.items[0]?.image;

  return (
    <Pressable
      style={styles.orderCard}
      onPress={onPress}
    >
      <View style={styles.orderTop}>
        <View style={styles.restaurantBlock}>
          <View style={styles.restaurantIcon}>
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.restaurantText}>
            <Text
              style={styles.restaurantName}
              numberOfLines={1}
            >
              {branchName(order.restaurantName)}
            </Text>

            <Text style={styles.orderNumber}>
              {order.id}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.orderBody}>
        {previewImage ? (
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.previewFallback}>
            <Ionicons
              name="fast-food-outline"
              size={24}
              color={colors.primary}
            />
          </View>
        )}

        <View style={styles.orderDetails}>
          <Text
            style={styles.itemsText}
            numberOfLines={2}
          >
            {order.items
              .map(
                (item) =>
                  `${item.quantity}× ${item.name}`,
              )
              .join(', ')}
          </Text>

          <Text style={styles.orderMeta}>
            {order.itemCount}{' '}
            {order.itemCount === 1
              ? 'item'
              : 'items'}{' '}
            • ${order.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={getStatusIcon(order.status)}
              size={17}
              color={colors.primary}
            />
          </View>

          <View>
            <Text style={styles.statusLabel}>
              {order.orderType === 'pickup' && order.status === 'delivered' ? 'Collected' : getStatusLabel(order.status)}
            </Text>

            {order.status !== 'delivered' &&
              order.status !== 'cancelled' && (
                <Text style={styles.statusHint}>
                  {order.orderType === 'pickup' ? 'Branch collection' : 'Follow delivery updates'}
                </Text>
              )}
          </View>
        </View>

        {order.status !== 'delivered' &&
          order.status !== 'cancelled' && (
            <Text style={styles.trackText}>
              Track
            </Text>
          )}

        {order.status === 'delivered' && onReorder && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Reorder ${order.id}`} style={styles.reorderButton} onPress={onReorder}>
            <Ionicons name="repeat" size={15} color={colors.onDark} />
            <Text style={styles.reorderText}>Reorder</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export function OrdersScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    orders,
    loading,
    loadError,
    reloadOrders,
    lastUpdated,
    addOrder,
  } = useOrders();
  const reorder = useReorder();
  const [reorderNote, setReorderNote] = useState<string | null>(null);
  const doReorder = (order: Order) => {
    const result = reorder(order);
    if (!result.added) { setReorderNote(`None of the items from ${order.id} are on the menu right now.`); return; }
    setReorderNote(result.missing.length ? `Added to your tray. Not available today: ${result.missing.join(', ')}.` : null);
    navigation.navigate('Cart');
  };

  const activeOrders = orders.filter(
    (order) =>
      order.status !== 'delivered' &&
      order.status !== 'cancelled',
  );

  const pastOrders = orders.filter(
    (order) =>
      order.status === 'delivered' ||
      order.status === 'cancelled',
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              SIGNATURES
            </Text>

            <Text style={styles.title}>
              Your orders
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="receipt-outline"
              size={23}
              color={colors.text}
            />
          </View>
        </View>

        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><Text style={{fontFamily:fonts.body,fontSize:10,color:colors.textSecondary}}>{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString('en-GB',{timeZone:'Africa/Harare'})}` : ''}</Text><Pressable accessibilityLabel="Refresh orders" style={{padding:14}} onPress={reloadOrders}><Text style={{fontFamily:fonts.bold}}>Refresh</Text></Pressable></View>
        {reorderNote && <Text accessibilityRole="alert" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.primary, marginBottom: 12 }}>{reorderNote}</Text>}
        {loadError && orders.length > 0 && <Text accessibilityRole="alert" style={{color:colors.error}}>{loadError} Showing the last saved update.</Text>}
        {loading && orders.length === 0 ? (
          <View accessibilityLabel="Loading your orders" style={{ gap: 14 }}>
            {[0, 1, 2].map(index => <View key={index} style={[styles.orderCard, { gap: 14 }]}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Skeleton width={40} height={40} radius={20} />
                <View style={{ flex: 1, gap: 8 }}><Skeleton width="60%" height={14} /><Skeleton width="35%" height={10} /></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Skeleton width={64} height={64} radius={12} />
                <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}><Skeleton width="85%" height={12} /><Skeleton width="45%" height={12} /></View>
              </View>
            </View>)}
          </View>
        ) : loadError && orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Orders unavailable
            </Text>

            <Text style={styles.emptyDescription}>
              {loadError}
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No orders yet
            </Text>

            <Text style={styles.emptyDescription}>
              Once you place an order, you&apos;ll
              be able to follow its progress here.
            </Text>

            <Pressable
              style={styles.orderFoodButton}
              onPress={() =>
                navigation.navigate('Restaurant')
              }
            >
              <Text
                style={styles.orderFoodButtonText}
              >
                Order something
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.surface}
              />
            </Pressable>

            {process.env.EXPO_PUBLIC_UI_PREVIEW === '1' && <Pressable
              accessibilityRole="button"
              style={styles.previewTrackingButton}
              onPress={() => {
                addOrder(makePreviewOrder());
                navigation.navigate('OrderTracking', { orderId: PREVIEW_ORDER_ID });
              }}
            >
              <Ionicons name="navigate-outline" size={17} color={colors.primary} />
              <Text style={styles.previewTrackingText}>Preview live tracking</Text>
            </Pressable>}
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Active orders
                  </Text>

                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>
                      {activeOrders.length}
                    </Text>
                  </View>
                </View>

                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() =>
                      navigation.navigate(
                        'OrderTracking',
                        {
                          orderId: order.id,
                        },
                      )
                    }
                  />
                ))}
              </View>
            )}

            {pastOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Order history
                </Text>

                {pastOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onReorder={() => doReorder(order)}
                    onPress={() =>
                      navigation.navigate(
                        'OrderTracking',
                        {
                          orderId: order.id,
                        },
                      )
                    }
                  />
                ))}
              </View>
            )}

            <View style={styles.bottomSpace} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 110,
  },

  header: {
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    fontFamily: fonts.heavy,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 1.6,
    color: colors.primary,
  },

  title: {
    fontFamily: fonts.heading,
    marginTop: 5,
    fontSize: 29,
    fontWeight: '400',
    color: colors.text,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginTop: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 13,
  },

  activeBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  activeBadgeText: {
    fontFamily: fonts.heavy,
    color: colors.surface,
    fontSize: 11,
    fontWeight: '400',
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 14,
  },

  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  restaurantBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  restaurantIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restaurantText: {
    flex: 1,
    marginLeft: 11,
  },

  restaurantName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },

  orderNumber: {
    fontFamily: fonts.body,
    marginTop: 3,
    fontSize: 10,
    color: colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  orderBody: {
    flexDirection: 'row',
  },

  previewImage: {
    width: 74,
    height: 74,
    borderRadius: radius.lg,
  },

  previewFallback: {
    width: 74,
    height: 74,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderDetails: {
    flex: 1,
    marginLeft: 13,
    justifyContent: 'center',
  },

  itemsText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: colors.text,
  },

  orderMeta: {
    fontFamily: fonts.bold,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  statusRow: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  statusLabel: {
    fontFamily: fonts.heavy,
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
  },

  statusHint: {
    fontFamily: fonts.body,
    marginTop: 2,
    fontSize: 10,
    color: colors.textSecondary,
  },

  trackText: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    fontWeight: '400',
    color: colors.primary,
  },

  empty: {
    minHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontFamily: fonts.heading,
    marginTop: 21,
    fontSize: 21,
    fontWeight: '400',
    color: colors.text,
  },

  emptyDescription: {
    fontFamily: fonts.body,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  orderFoodButton: {
    minHeight: 52,
    marginTop: 23,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  orderFoodButtonText: {
    fontFamily: fonts.heavy,
    color: colors.surface,
    fontSize: 13,
    fontWeight: '400',
  },

  bottomSpace: {
    height: 20,
  },
  previewTrackingButton: { marginTop: 12, minHeight: 46, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewTrackingText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  reorderButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder },
  reorderText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onDark },
});
