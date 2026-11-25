import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../../context/OrderContext';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { useReducedMotion } from '../../../components/useReducedMotion';
import { haptic } from '../../../components/haptics';
import { branchName } from '../../../services/venuesApi';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, fonts } from '../../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;
const walnut = require('../../../../assets/paramount/walnut-grain.webp');
const AUTO_MS = 5200;
const native = Platform.OS !== 'web';

/** Flame flares, settles into a brass seal with a tick, then hands over to live tracking. */
export function OrderConfirmationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { getOrder } = useOrders();
  const reduced = useReducedMotion();
  const order = getOrder(route.params.orderId);
  const pickup = order?.orderType === 'pickup';
  const flare = useRef(new Animated.Value(0)).current;
  const seal = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [stayed, setStayed] = useState(false);
  const goTrack = () => navigation.replace('OrderTracking', { orderId: route.params.orderId });

  useEffect(() => {
    haptic('success');
    if (reduced) { flare.setValue(1); seal.setValue(1); copy.setValue(1); return; }
    const sequence = Animated.sequence([
      Animated.timing(flare, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
      Animated.parallel([
        Animated.spring(seal, { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: native }),
        Animated.timing(copy, { toValue: 1, duration: 520, delay: 120, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      ]),
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [reduced, flare, seal, copy]);

  useEffect(() => {
    if (stayed) { progress.stopAnimation(); return; }
    const run = Animated.timing(progress, { toValue: 1, duration: AUTO_MS, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => { if (finished) goTrack(); });
    return () => run.stop();
  }, [stayed]);

  const flameScale = flare.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.35, 0.9] });
  const flameOpacity = Animated.add(flare.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), seal.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }));

  return <SafeAreaView style={styles.screen}>
    <View style={styles.content}>
      <Text style={styles.eyebrow}>{order ? `ORDER ${order.id}` : 'ORDER PLACED'}</Text>

      <View style={styles.ticket}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={walnut} resizeMode="repeat" style={{ width: '100%', height: '100%', opacity: 0.32 }} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(24,17,12,0.4)' }]} />
        </View>

        <View style={styles.sealStage}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: flameOpacity, transform: [{ scale: flameScale }] }]}>
            <Ionicons name="flame" size={70} color="#F0A35A" />
          </Animated.View>
          <Animated.View style={[styles.seal, { opacity: seal, transform: [{ scale: seal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
            <Ionicons name="checkmark" size={44} color={colors.onGold} />
          </Animated.View>
        </View>

        <Animated.View style={{ alignItems: 'center', opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text accessibilityRole="header" style={styles.title}>Order confirmed.</Text>
          <Text style={styles.italic}>{pickup ? 'We’ll have it ready.' : 'It’s on the fire.'}</Text>
          {order && <View style={styles.facts}>
            <Fact label={pickup ? 'COLLECT FROM' : 'FROM'} value={branchName(order.restaurantName)} />
            <View style={styles.factRule} />
            <Fact label="ITEMS" value={`${order.itemCount}`} />
            <View style={styles.factRule} />
            <Fact label="TOTAL" value={`$${order.total.toFixed(2)}`} />
          </View>}
        </Animated.View>
      </View>

      <Text style={styles.description}>
        {pickup ? 'Your branch has your order. We’ll tell you the moment it’s ready to collect.' : 'Your branch has your order. Follow it from the grill to your door.'}
      </Text>
    </View>

    <View style={styles.actions}>
      <Pressable accessibilityRole="button" style={styles.track} onPress={goTrack}>
        {!stayed && <Animated.View pointerEvents="none" style={[styles.trackFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />}
        <Text style={styles.trackText}>{stayed ? 'Track your order' : 'Opening live tracking…'}</Text>
        <Ionicons name="arrow-forward" size={19} color={colors.onDark} />
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.home} onPress={() => { setStayed(true); navigation.navigate('MainTabs'); }}>
        <Text style={styles.homeText}>Back to home</Text>
      </Pressable>
      {!stayed && <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setStayed(true)}><Text style={styles.stay}>Stay on this page</Text></Pressable>}
    </View>
  </SafeAreaView>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text numberOfLines={1} style={styles.factValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 18 },
  center: { alignItems: 'center', justifyContent: 'center' },
  eyebrow: { textAlign: 'center', fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.8, color: colors.primary },
  ticket: { borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: '#A5885D', backgroundColor: '#302116', paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center', gap: 18 },
  sealStage: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  seal: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.gold, borderWidth: 3, borderColor: '#E9D8BA', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  title: { fontFamily: fonts.heading, fontSize: 38, lineHeight: 44, color: colors.onDark, textAlign: 'center' },
  italic: { fontFamily: fonts.headingItalic, fontSize: 24, lineHeight: 30, color: colors.gold, textAlign: 'center' },
  facts: { marginTop: 22, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(198,167,126,0.35)' },
  fact: { flex: 1, alignItems: 'center', gap: 4 },
  factRule: { width: 1, height: 30, backgroundColor: 'rgba(198,167,126,0.35)' },
  factLabel: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.5, color: '#E4CC9E' },
  factValue: { fontFamily: fonts.heading, fontSize: 20, color: colors.onDark },
  description: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 10 },
  actions: { paddingHorizontal: 22, paddingBottom: 18, gap: 10, width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center' },
  track: { alignSelf: 'stretch', minHeight: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  trackFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(198,167,126,0.28)' },
  trackText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  home: { alignSelf: 'stretch', minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  homeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  stay: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, textDecorationLine: 'underline', paddingVertical: 4 },
});
