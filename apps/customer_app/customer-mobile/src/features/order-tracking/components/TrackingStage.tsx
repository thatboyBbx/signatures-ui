import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { AtmosphereVideo } from '../../../components/AtmosphereVideo';
import { useReducedMotion } from '../../../components/useReducedMotion';
import { AtmosphereProvider } from '../../../context/AtmosphereContext';
import type { OrderStatus } from '../../../types/order';
import { colors, fonts } from '../../../theme/theme';

export type TrackingPhase = 'kitchen' | 'handover' | 'road' | 'done' | 'cancelled';

export const ember = { hot: '#E8803A', deep: '#B4461F', dark: '#5C1D0F', glow: 'rgba(232,128,58,0.55)' };

const kitchen: OrderStatus[] = ['confirmed', 'preparing', 'awaiting_driver'];
const handover: OrderStatus[] = ['ready', 'driver_assigned', 'heading_to_restaurant', 'arrived_at_restaurant', 'picked_up'];

/** The stage follows the order: grill while cooking, packing at handover, the night map on the road. */
export function trackingPhase(status: OrderStatus, pickup: boolean): TrackingPhase {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'delivered') return 'done';
  if (status === 'on_the_way') return pickup ? 'handover' : 'road';
  if (kitchen.includes(status)) return 'kitchen';
  if (handover.includes(status)) return 'handover';
  return 'kitchen';
}

export function Pulse({ color, size = 10, spread = 2.8 }: { color: string; size?: number; spread?: number }) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { value.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [reduced, value]);
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color,
      opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
      transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, spread] }) }] }} />
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
  </View>;
}

/** A few sparks drifting up from the grill. */
function Embers() {
  const reduced = useReducedMotion();
  const sparks = useMemo(() => Array.from({ length: 9 }, (_, index) => ({
    left: `${8 + ((index * 37) % 86)}%` as const, size: 2 + (index % 3), delay: index * 520, duration: 3600 + (index % 4) * 700,
    value: new Animated.Value(0),
  })), []);
  useEffect(() => {
    if (reduced) return;
    const loops = sparks.map(spark => Animated.loop(Animated.sequence([
      Animated.delay(spark.delay),
      Animated.timing(spark.value, { toValue: 1, duration: spark.duration, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(spark.value, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
    ])));
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [reduced, sparks]);
  if (reduced) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {sparks.map((spark, index) => <Animated.View key={index} style={{ position: 'absolute', bottom: '18%', left: spark.left,
      width: spark.size, height: spark.size, borderRadius: spark.size, backgroundColor: '#FFB46B',
      shadowColor: ember.hot, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
      opacity: spark.value.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 0.6, 0] }),
      transform: [{ translateY: spark.value.interpolate({ inputRange: [0, 1], outputRange: [0, -260] }) },
        { translateX: spark.value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 ? 14 : -14, 4] }) }] }} />)}
  </View>;
}

// Night-city canvas, 400×560. Streets run on these centre lines; the route follows them.
const W = 400, H = 560;
const streetsX = [50, 150, 250, 350];
const streetsY = [60, 150, 240, 330, 420, 510];
// Kept in the upper-middle of the canvas so the headline at the bottom of the stage never covers it.
const route: [number, number][] = [[150, 390], [150, 330], [250, 330], [250, 240], [150, 240], [150, 150], [334, 150]];
const segLengths = route.slice(1).map((point, index) => Math.hypot(point[0] - route[index][0], point[1] - route[index][1]));
const routeLength = segLengths.reduce((a, b) => a + b, 0);
const routePath = `M${route.map(point => point.join(',')).join(' L')}`;

function pointAt(progress: number): [number, number] {
  let distance = Math.max(0, Math.min(1, progress)) * routeLength;
  for (let index = 0; index < segLengths.length; index++) {
    if (distance <= segLengths[index]) {
      const [x1, y1] = route[index]; const [x2, y2] = route[index + 1];
      const t = segLengths[index] ? distance / segLengths[index] : 0;
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    }
    distance -= segLengths[index];
  }
  return route[route.length - 1];
}

/** Deterministic blocks of buildings between the streets, drawn as simple extruded boxes. */
const buildings = (() => {
  const xs = [-30, ...streetsX, 430];
  const ys = [-30, ...streetsY, 590];
  const list: { x: number; y: number; w: number; h: number; lift: number; tone: number; park: boolean }[] = [];
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + 15, x1 = xs[i + 1] - 15, y0 = ys[j] + 15, y1 = ys[j + 1] - 15;
    if (x1 - x0 < 10 || y1 - y0 < 10) continue;
    if (rand() < 0.12) { list.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, lift: 0, tone: 0, park: true }); continue; }
    const split = rand() < 0.5;
    const cut = 0.4 + rand() * 0.2;
    const parts = split
      ? [[x0, y0, (x1 - x0) * cut - 4, y1 - y0], [x0 + (x1 - x0) * cut + 4, y0, (x1 - x0) * (1 - cut) - 4, y1 - y0]]
      : [[x0, y0, x1 - x0, (y1 - y0) * cut - 4], [x0, y0 + (y1 - y0) * cut + 4, x1 - x0, (y1 - y0) * (1 - cut) - 4]];
    for (const [x, y, w, h] of parts) list.push({ x, y, w, h, lift: 4 + Math.round(rand() * 8), tone: rand(), park: false });
  }
  return list;
})();

function NightMap({ progress, minutes, width, height }: { progress: number; minutes?: number; width: number; height: number }) {
  const reduced = useReducedMotion();
  const [dash, setDash] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setDash(value => (value + 1.2) % 24), 50);
    return () => clearInterval(timer);
  }, [reduced]);
  // Same maths as preserveAspectRatio="xMidYMid slice", so overlays line up with the SVG.
  const scale = Math.max(width / W, height / H);
  const offsetX = (width - W * scale) / 2;
  const offsetY = (height - H * scale) / 2;
  const toScreen = ([x, y]: [number, number]) => ({ left: offsetX + x * scale, top: offsetY + y * scale });
  const [riderX, riderY] = pointAt(progress);
  const rider = toScreen([riderX, riderY]);
  const home = toScreen(route[route.length - 1]);
  const venue = toScreen(route[0]);
  const travelled = progress * routeLength;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#120D0A" />
      {streetsX.map(x => <Rect key={`sx${x}`} x={x - 11} y={-50} width={22} height={H + 100} fill="#1A1410" />)}
      {streetsY.map(y => <Rect key={`sy${y}`} x={-50} y={y - 11} width={W + 100} height={22} fill="#1A1410" />)}
      {buildings.map((b, index) => b.park
        ? <Rect key={index} x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill="#151A12" />
        : <G key={index}>
          <Rect x={b.x + 3} y={b.y + 3} width={b.w} height={b.h} rx={3} fill="#0A0705" />
          <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill={b.tone > 0.6 ? '#2A2019' : b.tone > 0.3 ? '#241B15' : '#201812'} />
          <Rect x={b.x} y={b.y} width={b.w} height={Math.min(b.lift, b.h)} rx={3} fill="rgba(233,211,174,0.06)" />
        </G>)}
      <Path d={routePath} stroke={ember.hot} strokeOpacity={0.16} strokeWidth={26} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Path d={routePath} stroke={ember.hot} strokeOpacity={0.32} strokeWidth={13} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Path d={routePath} stroke="#FFC27A" strokeWidth={3} fill="none" strokeDasharray="3 9" strokeDashoffset={-dash} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={routePath} stroke={ember.hot} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${travelled} ${routeLength}`} />
    </Svg>
    <View style={[styles.venueDot, { left: venue.left - 9, top: venue.top - 9 }]}><Ionicons name="flame" size={10} color={colors.onDark} /></View>
    <View style={[styles.marker, { left: home.left - 22, top: home.top - 22 }]}>
      <View style={styles.homePin}><Ionicons name="home" size={18} color={colors.onGold} /></View>
    </View>
    <View style={[styles.marker, { left: rider.left - 22, top: rider.top - 22 }]}>
      <View style={styles.riderPin}><Ionicons name="bicycle" size={20} color="#FFF4DF" /></View>
    </View>
    {minutes ? <View style={[styles.etaBubble, { left: Math.min(width - 128, Math.max(12, rider.left + 26)), top: Math.max(8, rider.top - 64) }]}>
      <Text style={styles.etaBubbleLabel}>ARRIVING IN</Text>
      <Text style={styles.etaBubbleValue}>{minutes} min</Text>
    </View> : null}
  </View>;
}

const phaseCopy: Record<TrackingPhase, { tag: string; icon: keyof typeof Ionicons.glyphMap }> = {
  kitchen: { tag: 'LIVE · IN THE KITCHEN', icon: 'flame' },
  handover: { tag: 'LIVE · PACKED & SEALED', icon: 'bag-check' },
  road: { tag: 'LIVE · ON THE ROAD', icon: 'navigate' },
  done: { tag: 'DELIVERED · ENJOY', icon: 'checkmark-circle' },
  cancelled: { tag: 'ORDER CLOSED', icon: 'close-circle' },
};

export function TrackingStage({ phase, title, subtitle, progress, minutesLeft, height, contentTop, contentBottom, scrollY }: {
  phase: TrackingPhase; title: string; subtitle?: string; progress: number; minutesLeft?: number;
  height: number; contentTop: number; contentBottom: number; scrollY?: Animated.Value;
}) {
  // As the cards scroll up over the stage, the headline fades and lifts away instead of being cut off mid-line.
  const copyFade = scrollY ? {
    opacity: scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' }),
    transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, -28], extrapolate: 'clamp' }) }],
  } : null;
  const [width, setWidth] = useState(0);
  const variant = phase === 'kitchen' ? 'grill' : 'delivery';
  return <View pointerEvents="none" style={[styles.stage, { height }]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    {phase === 'road'
      ? width > 0 && <NightMap progress={progress} minutes={minutesLeft} width={width} height={height} />
      : <AtmosphereProvider><AtmosphereVideo key={variant} variant={variant} active={phase !== 'cancelled'} /></AtmosphereProvider>}
    {phase === 'kitchen' && <Embers />}
    {/* Flat scrim (no gradient) so the headline stays legible over video and map. */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: phase === 'road' ? 'rgba(15,11,8,0.25)' : 'rgba(15,11,8,0.42)' }]} />
    <View style={[styles.stageContent, { top: contentTop, bottom: contentBottom }]}>
      <View style={styles.stageInner}>
        <View style={{ flex: 1 }} />
        <Animated.View style={[{ gap: 8 }, copyFade]}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#0F0B08', overflow: 'hidden' },
  stageContent: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  stageInner: { flex: 1, width: '100%', maxWidth: 620, paddingHorizontal: 22, gap: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(15,11,8,0.6)', borderWidth: 1, borderColor: 'rgba(232,128,58,0.45)' },
  tag: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: '#F3D9B5' },
  title: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 44, color: colors.onDark, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: 'rgba(255,244,223,0.82)' },
  venueDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: ember.deep, borderWidth: 2, borderColor: '#FFC27A', alignItems: 'center', justifyContent: 'center' },
  marker: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  markerPulse: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  homePin: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E9D8BA', borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  riderPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: ember.deep, borderWidth: 2, borderColor: '#FFC27A', alignItems: 'center', justifyContent: 'center', shadowColor: ember.hot, shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  etaBubble: { position: 'absolute', width: 116, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(15,11,8,0.88)', borderWidth: 1, borderColor: 'rgba(232,128,58,0.5)' },
  etaBubbleLabel: { fontFamily: fonts.bold, fontSize: 8, letterSpacing: 1.4, color: 'rgba(243,217,181,0.75)' },
  etaBubbleValue: { fontFamily: fonts.heavy, fontSize: 17, color: '#FFC27A' },
});
