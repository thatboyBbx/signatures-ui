import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ParamountDock, dockRoutes } from './ParamountTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParamountPressable as Pressable } from './ParamountPressable';
import { colors, fonts } from '../theme/theme';

const walnut = require('../../assets/paramount/walnut-grain.webp');

/** Cream page with the Paramount serif heading and a back button: the shell for account pages. */
export function ParamountSubPage({ eyebrow, title, italic, children, tab = 3 }: { eyebrow: string; title: string; italic?: string; children: ReactNode; tab?: number }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={21} color={colors.text} />
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {italic ? <Text style={styles.italic}>{italic}</Text> : null}
      <View style={{ height: 18 }} />
      {children}
    </ScrollView>
    <ParamountDock selectedIndex={tab} bottomInset={insets.bottom} onSelect={index => navigation.popTo('MainTabs', { screen: dockRoutes[index] })} />
  </SafeAreaView>;
}

/** Walnut panel used for the key card on each page. */
export function WoodPanel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.wood, style]}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={walnut} resizeMode="repeat" style={{ width: '100%', height: '100%', opacity: 0.3 }} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(24,17,12,0.4)' }]} />
    </View>
    {children}
  </View>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ icon, label, value, onPress, last, right }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; last?: boolean; right?: ReactNode;
}) {
  const body = <>
    <View style={styles.rowIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
    {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /> : null)}
  </>;
  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, !last && styles.rowBorder]}>{body}</Pressable>
    : <View style={[styles.row, !last && styles.rowBorder]}>{body}</View>;
}

export function ToggleRow({ icon, label, detail, value, onChange, last }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; detail: string; value: boolean; onChange: (value: boolean) => void; last?: boolean;
}) {
  return <View style={[styles.row, !last && styles.rowBorder]}>
    <View style={styles.rowIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View>
    <View style={{ flex: 1, gap: 3 }}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowDetail}>{detail}</Text></View>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} {...({ activeThumbColor: colors.surface } as object)} />
  </View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export const subPageStyles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.textSecondary, marginTop: 10, paddingHorizontal: 4 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: 20, paddingTop: 8 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 130, width: '100%', maxWidth: 620, alignSelf: 'center' },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.8, color: colors.primary },
  title: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 46, color: colors.text, marginTop: 6 },
  italic: { fontFamily: fonts.headingItalic, fontSize: 22, lineHeight: 28, color: colors.primary, marginTop: -2 },
  wood: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#302116', borderWidth: 1, borderColor: '#A5885D', padding: 20 },
  card: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  rowValue: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  rowDetail: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  section: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.6, color: colors.primary, marginTop: 24, marginBottom: 10 },
});
