import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, touch, typography } from '../theme/theme';
import { useDriver } from './DriverProvider';

export { colors };

/* ---------- Text ---------- */
type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; lines?: number };
export const Label = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} style={[typography.label, style]}>{children}</Text>;
export const Body = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} style={[typography.body, style]}>{children}</Text>;
export const Muted = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} style={[typography.body, { color: colors.textSecondary }, style]}>{children}</Text>;
export const Value = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} style={[typography.value, style]}>{children}</Text>;
export const Heading = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} accessibilityRole="header" style={[typography.heading, style]}>{children}</Text>;
export const Title = ({ children, style, lines }: TextProps) => <Text numberOfLines={lines} accessibilityRole="header" style={[typography.title, style]}>{children}</Text>;
export const Amount = ({ children, style }: TextProps) => <Text style={[typography.amount, { fontVariant: ['tabular-nums'] }, style]}>{children}</Text>;

/* ---------- Layout ---------- */
export function Screen({ children, footer, scroll = true }: { children: ReactNode; footer?: ReactNode; scroll?: boolean }) {
  const store = useDriver();
  const body = <View style={styles.content}>{children}</View>;
  return <SafeAreaView style={styles.screen} edges={['top']}>
    {store.offline && <View style={styles.banner}><Text style={styles.bannerText}>No connection · retrying. Your last step is kept.</Text></View>}
    {!!store.error && <View style={styles.banner}><Text accessibilityRole="alert" style={styles.bannerText}>{store.error}</Text></View>}
    {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{body}</ScrollView> : body}
    {footer && <View style={styles.footer}>{footer}</View>}
  </SafeAreaView>;
}

export const Section = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ gap: spacing.sm }, style]}>{children}</View>;
export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.row, style]}>{children}</View>;
export const Rule = () => <View style={styles.rule} />;
export const Panel = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.panel, style]}>{children}</View>;

/* ---------- Buttons ---------- */
type ButtonProps = { children: string; onPress: () => unknown; disabled?: boolean; variant?: 'primary' | 'secondary' | 'quiet'; style?: StyleProp<ViewStyle> };
export function Button({ children, onPress, disabled = false, variant = 'primary', style }: ButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void onPress()}
    style={({ pressed }) => [styles.button, styles[variant], pressed && variant === 'primary' && { backgroundColor: colors.espressoPressed }, pressed && variant !== 'primary' && { opacity: 0.7 }, disabled && styles.disabled, style]}>
    <Text style={[styles.buttonText, variant !== 'primary' && { color: colors.text }, disabled && variant === 'primary' && { color: colors.onDarkMuted }]}>{children}</Text>
  </Pressable>;
}

// Inline action on an address row: plain text, full touch height, no icon.
export function LinkButton({ children, onPress, disabled }: { children: string; onPress: () => unknown; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void onPress()} hitSlop={6}
    style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }, disabled && { opacity: 0.4 }]}>
    <Text style={styles.linkText}>{children}</Text>
  </Pressable>;
}

const THUMB = 52;
// Swipe-to-confirm: cannot fire from a bump. Screen readers get a plain "activate" action.
export function SwipeAction({ label, onConfirm, disabled = false, busy = false }: { label: string; onConfirm: () => unknown; disabled?: boolean; busy?: boolean }) {
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const max = Math.max(1, width - THUMB - 8);
  // Latest values for the gesture callbacks, kept outside render.
  const live = useRef({ max, locked: disabled || busy, confirm: onConfirm });
  useLayoutEffect(() => { live.current = { max, locked: disabled || busy, confirm: onConfirm }; });
  useEffect(() => { if (!busy) Animated.timing(x, { toValue: 0, duration: 160, useNativeDriver: false }).start(); }, [busy, x]);
  // `live` is read only inside gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => {
    const reset = () => Animated.timing(x, { toValue: 0, duration: 160, useNativeDriver: false }).start();
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !live.current.locked,
      onMoveShouldSetPanResponder: (_, g) => !live.current.locked && Math.abs(g.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), live.current.max)),
      onPanResponderRelease: (_, g) => {
        if (g.dx >= live.current.max * 0.85) {
          Animated.timing(x, { toValue: live.current.max, duration: 100, useNativeDriver: false }).start();
          void live.current.confirm();
        } else reset();
      },
      onPanResponderTerminate: () => reset(),
    });
  });
  const fade = x.interpolate({ inputRange: [0, max * 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
  return <View onLayout={e => setWidth(e.nativeEvent.layout.width)} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: disabled || busy }} accessibilityActions={[{ name: 'activate' }]}
    onAccessibilityAction={() => { if (!disabled && !busy) void onConfirm(); }}
    style={[styles.track, (disabled) && styles.disabled]}>
    <Animated.Text style={[styles.trackText, { opacity: busy ? 1 : fade }]}>{busy ? 'Confirming…' : label}</Animated.Text>
    {!busy && <Animated.View {...responder.panHandlers} style={[styles.thumb, { transform: [{ translateX: x }] }]}>
      <Text style={styles.thumbText}>›</Text>
    </Animated.View>}
  </View>;
}

// Press-and-hold to confirm. Used once: cash collected + delivered.
export function HoldAction({ label, onConfirm, disabled = false, busy = false, ms = 1200 }: { label: string; onConfirm: () => unknown; disabled?: boolean; busy?: boolean; ms?: number }) {
  const [fill] = useState(() => new Animated.Value(0));
  const [holding, setHolding] = useState(false);
  const start = () => {
    if (disabled || busy) return;
    setHolding(true);
    Animated.timing(fill, { toValue: 1, duration: ms, useNativeDriver: false }).start(({ finished }) => {
      setHolding(false);
      if (finished) void onConfirm();
    });
  };
  const stop = () => { fill.stopAnimation(); Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start(); };
  useEffect(() => { if (!busy) fill.setValue(0); }, [busy, fill]);
  return <Pressable onPressIn={start} onPressOut={stop} disabled={disabled || busy} accessibilityRole="button" accessibilityLabel={label}
    accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={() => { if (!disabled && !busy) void onConfirm(); }}
    style={[styles.track, disabled && styles.disabled]}>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.success, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    <Text style={styles.trackText}>{busy ? 'Confirming…' : holding ? 'Keep holding' : label}</Text>
  </Pressable>;
}

/* ---------- Bits ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return <View accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`} style={{ flexDirection: 'row', gap: 6 }}>
    {steps.map((step, i) => <View key={step} style={{ flex: 1, gap: 6 }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= current ? colors.espresso : colors.border }} />
      <Text style={[typography.label, i === current && { color: colors.text, fontFamily: fonts.bold }]}>{step}</Text>
    </View>)}
  </View>;
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <View style={styles.segmented} accessibilityRole="tablist">
    {options.map(o => <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: o.value === value }} onPress={() => onChange(o.value)}
      style={[styles.segment, o.value === value && styles.segmentOn]}>
      <Text style={[typography.label, o.value === value && { color: colors.text, fontFamily: fonts.bold }]}>{o.label}</Text>
    </Pressable>)}
  </View>;
}

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={styles.choice}>
    <View style={[styles.box, { borderRadius: radius.pill }, selected && { borderColor: colors.espresso, borderWidth: 7 }]} />
    <Body style={{ flex: 1 }}>{label}</Body>
  </Pressable>;
}

export function Check({ label, detail, checked, onPress }: { label: string; detail?: string; checked: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={styles.choice}>
    <View style={[styles.box, checked && { backgroundColor: colors.espresso, borderColor: colors.espresso }]}>
      {checked && <Text style={{ color: colors.onDark, fontFamily: fonts.bold, fontSize: 14, lineHeight: 16 }}>✓</Text>}
    </View>
    <View style={{ flex: 1 }}>
      <Body style={checked ? { color: colors.textSecondary } : undefined}>{label}</Body>
      {!!detail && <Label>{detail}</Label>}
    </View>
  </Pressable>;
}

export function Sheet({ visible, onClose, children, footer }: { visible: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={{ padding: spacing.xxl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        {footer && <View style={[styles.footer, { borderTopWidth: 0 }]}>{footer}</View>}
      </SafeAreaView>
    </View>
  </Modal>;
}

export function Field({ title, value, onChangeText, password = false, email = false, phone = false }: { title: string; value: string; onChangeText: (v: string) => void; password?: boolean; email?: boolean; phone?: boolean }) {
  return <View style={{ gap: 6 }}>
    <Label>{title}</Label>
    <TextInput accessibilityLabel={title} value={value} onChangeText={onChangeText} secureTextEntry={password}
      autoCapitalize={email || password ? 'none' : 'words'} keyboardType={email ? 'email-address' : phone ? 'phone-pad' : 'default'}
      autoComplete={password ? 'current-password' : email ? 'email' : phone ? 'tel' : 'off'} style={styles.input} placeholderTextColor={colors.textSecondary} />
  </View>;
}

export const ErrorText = ({ message }: { message: string }) => message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xxl, paddingBottom: spacing.xxxl, gap: spacing.xxl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm, width: '100%', maxWidth: 560, alignSelf: 'center' },
  banner: { backgroundColor: colors.errorSurface, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  bannerText: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.error, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: touch.action - 4, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.espresso },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  quiet: { backgroundColor: 'transparent', minHeight: touch.min },
  disabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onDark, textAlign: 'center' },
  link: { minHeight: touch.min, justifyContent: 'center', paddingRight: spacing.lg },
  linkText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textDecorationLine: 'underline' },
  track: { height: touch.action, borderRadius: radius.md, backgroundColor: colors.espresso, justifyContent: 'center', overflow: 'hidden' },
  trackText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onDark, textAlign: 'center', paddingHorizontal: THUMB + 12 },
  thumb: { position: 'absolute', left: 4, top: 4, width: THUMB, height: THUMB, borderRadius: radius.md - 1, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontFamily: fonts.bold, fontSize: 38, lineHeight: 40, color: colors.espresso, marginTop: -4 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md - 1 },
  segmentOn: { backgroundColor: colors.surface },
  choice: { minHeight: touch.min + 4, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  box: { width: 24, height: 24, borderWidth: 2, borderColor: colors.textSecondary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '92%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, minHeight: 52, fontFamily: fonts.body, fontSize: 16, backgroundColor: colors.surface, color: colors.text },
  error: { color: colors.error, backgroundColor: colors.errorSurface, borderRadius: radius.md, padding: spacing.md, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
});
