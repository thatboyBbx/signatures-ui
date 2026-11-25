import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { ParamountPressable as Pressable, ParamountPhoto as Image } from '../../../components/ParamountPressable';
import { haptic } from '../../../components/haptics';
import { useOrders } from '../../../context/OrderContext';
import { branchName } from '../../../services/venuesApi';
import { useReorder } from '../../orders/useReorder';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { Order, OrderStatus } from '../../../types/order';
import { colors, fonts } from '../../../theme/theme';
import { ember, TrackingStage, trackingPhase, type TrackingPhase } from './TrackingStage';
import { RateOrder } from './RateOrder';
import { mockFeatures } from '../../../services/mockFeatures';
import { optionSummary } from '../../food/components/CustomiseMeal';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Notice = { kind: 'late' | 'reassigned'; title: string; body: string };

const ink = '#0F0B08';
const glassBorder = 'rgba(233,211,174,0.14)';
const cream = '#F3E6CF';
const soft = 'rgba(243,230,207,0.62)';

/** Counts down locally from the latest estimate and restarts whenever the estimate changes. */
function useCountdown(minutes: number | undefined, active: boolean) {
  const [left, setLeft] = useState(minutes ? minutes * 60 : 0);
  useEffect(() => { setLeft(minutes ? minutes * 60 : 0); }, [minutes]);
  useEffect(() => {
    if (!minutes || !active) return;
    const timer = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [minutes, active]);
  return left;
}

function stepIndex(status: OrderStatus, pickup: boolean) {
  if (status === 'cancelled') return -1;
  if (status === 'confirmed') return 0;
  if (status === 'delivered') return 3;
  if (pickup) return status === 'ready' || status === 'on_the_way' ? 2 : 1;
  if (status === 'preparing' || status === 'ready' || status === 'awaiting_driver') return 1;
  return 2;
}

function Glass({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.glass, style]}>
    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(28,20,14,0.72)' }]} />
    {children}
  </View>;
}

function EtaRing({ fraction, minutes, seconds }: { fraction: number; minutes: number; seconds: number }) {
  const size = 132, stroke = 9, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(233,211,174,0.12)" strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={ember.hot} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={`${c * Math.max(0.02, fraction)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
    <Text style={styles.ringValue}>{minutes.toString().padStart(2, '0')}<Text style={styles.ringColon}>:</Text>{seconds.toString().padStart(2, '0')}</Text>
    <Text style={styles.ringLabel}>MIN · SEC</Text>
  </View>;
}

const statusCard: Record<TrackingPhase, { title: string; caption: string; icon: keyof typeof Ionicons.glyphMap; colors: [string, string, string] }> = {
  kitchen: { title: 'Hot & fresh', caption: 'STRAIGHT OFF THE GRILL', icon: 'flame', colors: [ember.hot, ember.deep, ember.dark] },
  handover: { title: 'Packed & sealed', caption: 'READY FOR THE ROAD', icon: 'bag-check', colors: ['#C99A5B', '#8A5A2E', '#3B2413'] },
  road: { title: 'On its way', caption: 'YOUR ORDER IS ON THE ROAD', icon: 'bicycle', colors: [ember.hot, ember.deep, ember.dark] },
  done: { title: 'Delivered', caption: 'ENJOY YOUR MEAL', icon: 'checkmark-done', colors: ['#7E8B4E', '#4C5A2B', '#232A14'] },
  cancelled: { title: 'Cancelled', caption: 'THIS ORDER IS CLOSED', icon: 'close', colors: ['#6B4A3A', '#3F2A20', '#1E1410'] },
};

export function TrackingExperience({ order, refreshing, onRefresh, updatedAt, refreshError, preview }: {
  order: Order; refreshing: boolean; onRefresh: () => void; updatedAt: Date | null; refreshError: string | null; preview: boolean;
}) {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { addOrder } = useOrders();
  const reorder = useReorder();
  const pickup = order.orderType === 'pickup';
  const phase = trackingPhase(order.status, pickup);
  const live = phase !== 'done' && phase !== 'cancelled';
  const left = useCountdown(live ? order.estimatedMinutes : undefined, live);
  const total = (order.estimatedMinutes ?? 0) * 60;
  const fraction = total ? 1 - left / total : 0;
  const current = stepIndex(order.status, pickup);
  const steps = pickup ? ['Confirmed', 'Preparing', 'Ready', 'Collected'] : ['Confirmed', 'Preparing', 'On the way', 'Delivered'];
  const headline = order.items[0]?.name;
  const driverName = order.driver?.name;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [contactNote, setContactNote] = useState(false);
  const [reorderNote, setReorderNote] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Spot a slipping estimate or a new driver between updates, and say so plainly.
  const previous = useRef({ eta: order.estimatedMinutes, driverId: order.driver?.id, at: Date.now(), status: order.status });
  useEffect(() => {
    const before = previous.current;
    const elapsed = (Date.now() - before.at) / 60000;
    if (order.driver?.id && before.driverId && order.driver.id !== before.driverId) {
      setNotice({ kind: 'reassigned', title: 'New rider assigned', body: `${order.driver.name} is now bringing your order. Your arrival time has been updated.` });
      haptic();
    } else if (live && order.estimatedMinutes && before.eta && order.estimatedMinutes > before.eta - elapsed + 3) {
      setNotice({ kind: 'late', title: 'Running a little late', body: `Sorry — it's busier than expected. New estimate: about ${order.estimatedMinutes} min.` });
      haptic();
    }
    if (before.status !== order.status) haptic('success');
    previous.current = { eta: order.estimatedMinutes, driverId: order.driver?.id, at: Date.now(), status: order.status };
  }, [order.estimatedMinutes, order.driver?.id, order.status]);

  const title = phase === 'kitchen' ? 'On the grill.' : phase === 'handover' ? (pickup ? 'Ready to collect.' : 'Packed & sealed.')
    : phase === 'road' ? 'Heading your way.' : phase === 'done' ? (pickup ? 'Collected.' : 'Delivered.') : 'Cancelled.';
  const subtitle = phase === 'kitchen' ? (headline ? `Your ${headline}${order.items.length > 1 ? ` and ${order.items.length - 1} more ${order.items.length > 2 ? 'dishes' : 'dish'}` : ''} ${order.items.length > 1 ? 'are' : 'is'} being cooked now.` : 'The kitchen is cooking your order.')
    : phase === 'handover' ? (pickup ? 'Your order is waiting at the counter.' : driverName ? `Handing over to ${driverName}.` : 'Waiting for your rider to collect.')
    : phase === 'road' ? `${driverName ?? 'Your rider'} is riding to ${order.address.label || 'you'}.`
    : phase === 'done' ? 'Thanks for ordering from Signatures.' : 'This order is no longer active.';

  const headerBottom = insets.top + 64;
  const stageHeight = phase === 'road' ? Math.min(820, Math.max(600, screenHeight * 0.82)) : Math.min(620, Math.max(470, screenHeight * 0.68));
  const overlap = 28;
  const arrival = new Date(Date.now() + left * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const card = statusCard[phase];

  const doReorder = () => {
    const result = reorder(order);
    if (!result.added) { setReorderNote(`None of these items are on the menu right now${result.missing.length ? `: ${result.missing.join(', ')}` : ''}.`); return; }
    if (result.missing.length) setReorderNote(`Added to your tray. Not available today: ${result.missing.join(', ')}.`);
    navigation.navigate('Cart');
  };

  const riderStages: OrderStatus[] = ['ready', 'awaiting_driver', 'driver_assigned', 'heading_to_restaurant', 'arrived_at_restaurant', 'picked_up', 'on_the_way', 'delivered'];
  const previewStatuses: OrderStatus[] = ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

  return <View style={styles.root}>
    <StatusBar style="light" />
    <TrackingStage phase={phase} title={title} subtitle={subtitle} progress={Math.min(0.94, Math.max(0.06, fraction))}
      minutesLeft={live && order.estimatedMinutes ? Math.max(1, Math.ceil(left / 60)) : undefined}
      height={stageHeight} contentTop={headerBottom + 4} contentBottom={overlap + 26} scrollY={scrollY} />

    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: ink, opacity: scrollY.interpolate({ inputRange: [Math.max(0, stageHeight - overlap - headerBottom - 40), Math.max(1, stageHeight - overlap - headerBottom)], outputRange: [0, 1], extrapolate: 'clamp' }) }]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.circle} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={21} color={cream} />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Track order</Text>
        <Text style={styles.headerSub}>{order.id}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh order status" accessibilityState={{ busy: refreshing }} disabled={refreshing} style={styles.circle} onPress={onRefresh}>
        <Ionicons name="refresh" size={20} color={cream} />
      </Pressable>
    </View>

    <Animated.ScrollView style={StyleSheet.absoluteFill} showsVerticalScrollIndicator={false} scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' })}
      contentContainerStyle={{ paddingTop: Math.max(140, stageHeight - overlap), paddingBottom: insets.bottom + 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ember.hot} />}>
      <View style={styles.sheet}>
        <View style={styles.sheetInner}>

          {notice && <View accessibilityLiveRegion="polite" style={[styles.notice, notice.kind === 'late' ? styles.noticeLate : styles.noticeRider]}>
            <View style={{ flex: 1, gap: 3 }}><Text style={styles.noticeTitle}>{notice.title}</Text><Text style={styles.noticeBody}>{notice.body}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10} onPress={() => setNotice(null)}><Ionicons name="close" size={18} color={soft} /></Pressable>
          </View>}

          <View style={[styles.statusCard, { backgroundColor: card.colors[1] }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{card.title}</Text>
              <Text style={styles.statusCaption}>{card.caption}</Text>
            </View>
          </View>

          {phase !== 'cancelled' && <Glass style={styles.etaCard}>
            {live && order.estimatedMinutes ? <View style={styles.etaRow}>
              <EtaRing fraction={fraction} minutes={Math.floor(left / 60)} seconds={left % 60} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.eyebrow}>{pickup ? 'READY BY' : 'ARRIVING BY'}</Text>
                <Text style={styles.arrival}>{arrival}</Text>
                <Text style={styles.muted}>{pickup ? 'Collect from the counter when ready.' : `Delivering to ${order.address.label || 'your address'}`}</Text>
              </View>
            </View> : <View style={styles.etaRow}>
              <View style={styles.doneBadge}><Ionicons name={phase === 'done' ? 'checkmark' : 'time-outline'} size={34} color={ink} /></View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.eyebrow}>{phase === 'done' ? (pickup ? 'COLLECTED' : 'DELIVERED') : 'LIVE ORDER UPDATES'}</Text>
                <Text style={styles.arrival}>{phase === 'done' ? 'Enjoy your meal' : 'Estimate coming up'}</Text>
              </View>
            </View>}
            <View style={styles.stepper}>
              {steps.map((step, index) => {
                const done = index <= current;
                const active = index === current && live;
                return <View key={step} style={styles.step}>
                  <View style={styles.stepTrack}>
                    {index > 0 && <View style={[styles.stepLine, index <= current && styles.stepLineDone]} />}
                    <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                      {active ? <View style={styles.activeDot} /> : done ? <Ionicons name="checkmark" size={12} color={ink} /> : null}
                    </View>
                  </View>
                  <Text numberOfLines={1} style={[styles.stepLabel, done && styles.stepLabelDone]}>{step}</Text>
                </View>;
              })}
            </View>
          </Glass>}

          {!pickup && phase !== 'cancelled' && <Glass style={styles.riderCard}>
            {order.driver ? <>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{order.driver.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={2} style={styles.riderName}>{order.driver.name}</Text>
                <Text numberOfLines={1} style={styles.muted}>Your rider · {order.driver.code}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Message ${order.driver.name}`} style={styles.contact} onPress={() => setContactNote(value => !value)}><Ionicons name="chatbubble-ellipses" size={18} color={cream} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Call ${order.driver.name}`} style={[styles.contact, styles.contactHot]} onPress={() => setContactNote(value => !value)}><Ionicons name="call" size={18} color="#FFF4DF" /></Pressable>
            </> : <>
              <View style={[styles.avatarRing, { backgroundColor: 'rgba(233,211,174,0.1)' }]}><View style={styles.activeDot} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.riderName}>Finding your rider</Text>
                <Text style={styles.muted}>We'll match a nearby rider as your food is packed.</Text>
              </View>
            </>}
          </Glass>}
          {contactNote && <Text style={styles.note}>Calling and messaging your rider will switch on once the driver app shares contact details.</Text>}

          <Glass style={styles.orderCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 3 }}><Text style={styles.eyebrow}>YOUR ORDER</Text><Text numberOfLines={2} style={styles.venue}>{branchName(order.restaurantName)}</Text></View>
              <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
            </View>
            {order.items.map(item => <View key={item.id} style={styles.itemRow}>
              {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbEmpty]}><Ionicons name="restaurant" size={18} color={colors.gold} /></View>}
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
                {!!optionSummary(item.size, item.extras, item.removed) && <Text style={styles.muted}>{optionSummary(item.size, item.extras, item.removed)}</Text>}
              </View>
              <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
            </View>)}
            <View style={styles.rule} />
            <View style={styles.rowBetween}><Text style={styles.muted}>Subtotal</Text><Text style={styles.value}>${order.subtotal.toFixed(2)}</Text></View>
            {!!order.discount && <View style={styles.rowBetween}><Text style={styles.muted}>Promo</Text><Text style={styles.value}>−${order.discount.toFixed(2)}</Text></View>}
            <View style={styles.rowBetween}><Text style={styles.muted}>{pickup ? 'Collection' : 'Delivery'}</Text><Text style={styles.value}>{order.deliveryFee ? `$${order.deliveryFee.toFixed(2)}` : 'Free'}</Text></View>
            <View style={styles.rule} />
            <View style={styles.infoRow}>
              <View style={{ flex: 1, gap: 2 }}><Text style={styles.eyebrow}>{pickup ? 'COLLECT FROM' : 'DELIVERING TO'}</Text><Text style={styles.value}>{order.address.label}</Text><Text style={styles.muted}>{order.address.address}</Text></View></View>
            <View style={styles.infoRow}>
              <View style={{ flex: 1, gap: 2 }}><Text style={styles.eyebrow}>PAYMENT</Text><Text style={styles.value}>{order.paymentMethod.label}</Text><Text style={styles.muted}>{order.paymentMethod.detail}</Text></View></View>
          </Glass>

          {phase === 'done' && <>
            {mockFeatures.ratings && <RateOrder order={order} />}
            <Pressable accessibilityRole="button" style={styles.reorder} onPress={doReorder}>
              <Text style={styles.reorderText}>Order this again</Text>
            </Pressable>
            {reorderNote && <Text accessibilityRole="alert" style={styles.note}>{reorderNote}</Text>}
          </>}

          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showSteps }} style={styles.stepsToggle} onPress={() => setShowSteps(value => !value)}>
            <Text style={styles.value}>Every step</Text>
            <Ionicons name={showSteps ? 'chevron-up' : 'chevron-down'} size={18} color={soft} />
          </Pressable>
          {showSteps && <Glass style={styles.timeline}>
            {(pickup ? ['Order confirmed', 'In the kitchen', 'Ready at the counter', 'Collected'] : ['Order confirmed', 'In the kitchen', 'Packed & handed to rider', 'On the road', 'Delivered']).map((label, index, all) => {
              const reached = pickup ? index <= current : index <= (current <= 1 ? current : current === 2 ? (phase === 'road' ? 3 : 2) : 4);
              return <View key={label} style={styles.timelineRow}>
                <View style={[styles.timelineDot, reached && styles.timelineDotOn]} />
                {index < all.length - 1 && <View style={[styles.timelineLine, reached && styles.timelineLineOn]} />}
                <Text style={[styles.timelineText, reached && { color: cream }]}>{label}</Text>
              </View>;
            })}
          </Glass>}

          <Text accessibilityLiveRegion="polite" style={styles.updated}>
            {refreshing ? 'Checking for updates…' : updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · pull down to refresh` : 'Checking order status…'}
          </Text>
          {refreshError && <Text accessibilityRole="alert" style={styles.note}>{refreshError} Showing the last saved update.</Text>}

          {preview && <View style={styles.previewPanel}>
            <Text style={styles.eyebrow}>UI PREVIEW · TRY EACH STAGE</Text>
            <View style={styles.chips}>
              {previewStatuses.map(status => <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected: order.status === status }}
                onPress={() => addOrder({ ...order, status, estimatedMinutes: status === 'delivered' || status === 'cancelled' ? undefined : status === 'on_the_way' ? 12 : 25,
                  // Live, the driver arrives with the next poll once the driver app accepts. The preview has no poll, so the stage decides.
                  driver: pickup || !riderStages.includes(status) ? undefined : order.driver ?? { id: 'preview-driver', code: 'DRV-07', name: 'Sample Driver', status: 'assigned' } })}
                style={[styles.chip, order.status === status && styles.chipOn]}>
                <Text style={[styles.chipText, order.status === status && styles.chipTextOn]}>{status.replace(/_/g, ' ')}</Text>
              </Pressable>)}
            </View>
            <View style={styles.chips}>
              <Pressable accessibilityRole="button" style={styles.chip} onPress={() => addOrder({ ...order, estimatedMinutes: Math.ceil(left / 60) + 10 })}><Text style={styles.chipText}>simulate delay</Text></Pressable>
              <Pressable accessibilityRole="button" style={styles.chip} onPress={() => addOrder({ ...order, driver: order.driver?.id === 'preview-driver-2'
                ? { id: 'preview-driver', code: 'DRV-07', name: 'Sample Driver', status: 'assigned' }
                : { id: 'preview-driver-2', code: 'DRV-12', name: 'Second Sample Rider', status: 'assigned' } })}><Text style={styles.chipText}>reassign rider</Text></Pressable>
            </View>
          </View>}
        </View>
      </View>
    </Animated.ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ink },
  header: { position: 'absolute', zIndex: 5, top: 0, left: 0, right: 0, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.heading, fontSize: 20, color: cream },
  headerSub: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.4, color: soft, marginTop: 1 },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,11,8,0.55)', borderWidth: 1, borderColor: 'rgba(233,211,174,0.28)' },
  sheet: { minHeight: 700, backgroundColor: ink, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetInner: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 6, gap: 14 },
  glass: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, padding: 18 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15, borderRadius: 18, borderWidth: 1 },
  noticeLate: { backgroundColor: 'rgba(180,70,31,0.22)', borderColor: 'rgba(232,128,58,0.55)' },
  noticeRider: { backgroundColor: 'rgba(198,167,126,0.14)', borderColor: 'rgba(198,167,126,0.5)' },
  noticeTitle: { fontFamily: fonts.bold, fontSize: 14, color: cream },
  noticeBody: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: soft },
  statusCard: { minHeight: 84, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16 },
  statusIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,244,223,0.16)', borderWidth: 1, borderColor: 'rgba(255,244,223,0.35)' },
  statusTitle: { fontFamily: fonts.heavy, fontSize: 26, letterSpacing: -0.6, color: '#FFF4DF' },
  statusCaption: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: 'rgba(255,244,223,0.82)', marginTop: 2 },
  etaCard: { gap: 20 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringValue: { fontFamily: fonts.heavy, fontSize: 30, letterSpacing: -1, color: cream, fontVariant: ['tabular-nums'] },
  ringColon: { color: ember.hot },
  ringLabel: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 1.6, color: soft, marginTop: 2 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.gold },
  arrival: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 36, color: cream },
  muted: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: soft },
  doneBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 8 },
  stepTrack: { width: '100%', height: 22, alignItems: 'center', justifyContent: 'center' },
  stepLine: { position: 'absolute', left: '-50%', right: '50%', height: 3, borderRadius: 2, backgroundColor: 'rgba(233,211,174,0.14)' },
  stepLineDone: { backgroundColor: ember.hot },
  stepDot: { zIndex: 1, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(233,211,174,0.3)', backgroundColor: ink, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: '#FFC27A', borderColor: '#FFC27A' },
  stepDotActive: { backgroundColor: ember.deep, borderColor: '#FFC27A' },
  stepLabel: { fontFamily: fonts.medium, fontSize: 10, color: 'rgba(243,230,207,0.45)' },
  stepLabelDone: { color: cream, fontFamily: fonts.semibold },
  riderCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  avatarRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF4DF' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2B1E14', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heavy, fontSize: 17, color: '#FFC27A' },
  riderName: { fontFamily: fonts.bold, fontSize: 16, color: cream },
  contact: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(233,211,174,0.1)', borderWidth: 1, borderColor: glassBorder },
  contactHot: { backgroundColor: ember.deep, borderColor: 'rgba(255,194,122,0.6)' },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: soft, paddingHorizontal: 4 },
  orderCard: { gap: 13 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  venue: { fontFamily: fonts.heading, fontSize: 20, color: cream },
  orderTotal: { fontFamily: fonts.heavy, fontSize: 22, color: '#FFC27A' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  thumbEmpty: { backgroundColor: 'rgba(233,211,174,0.08)', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: fonts.semibold, fontSize: 14, color: cream },
  itemPrice: { fontFamily: fonts.bold, fontSize: 13, color: cream },
  value: { fontFamily: fonts.semibold, fontSize: 13, color: cream },
  rule: { height: 1, backgroundColor: glassBorder },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(198,167,126,0.12)', alignItems: 'center', justifyContent: 'center' },
  reorder: { minHeight: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: ember.deep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  reorderText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFF4DF' },
  stepsToggle: { minHeight: 48, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, borderColor: glassBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeline: { gap: 0, paddingVertical: 14 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 38 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(233,211,174,0.3)' },
  timelineDotOn: { backgroundColor: ember.hot, borderColor: ember.hot },
  timelineLine: { position: 'absolute', left: 5, top: 26, width: 2, height: 24, backgroundColor: 'rgba(233,211,174,0.14)' },
  timelineLineOn: { backgroundColor: ember.hot },
  timelineText: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(243,230,207,0.45)' },
  updated: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(243,230,207,0.45)', textAlign: 'center' },
  previewPanel: { padding: 14, gap: 10, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(233,211,174,0.25)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(233,211,174,0.25)' },
  chipOn: { backgroundColor: ember.deep, borderColor: '#FFC27A' },
  chipText: { fontFamily: fonts.semibold, fontSize: 11, color: soft, textTransform: 'capitalize' },
  chipTextOn: { color: '#FFF4DF' },
});
