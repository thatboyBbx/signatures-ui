import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../theme/theme';

type DockProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Text-only dock: three destinations, no icons.
function Dock({ state, descriptors, navigateToTab, insets }: DockProps) {
  const routes = state.routes.filter(r => r.name !== 'deliveries');
  return <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
    {routes.map(route => {
      const focused = state.routes[state.index].key === route.key;
      const title = descriptors[route.key].options.title ?? route.name;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }}
        onPress={() => { if (!focused) navigateToTab(route.key); }}
        style={styles.tab}>
        <View style={[styles.bar, focused && { backgroundColor: colors.espresso }]} />
        <Text style={[styles.label, focused && styles.labelOn]}>{title}</Text>
      </Pressable>;
    })}
  </View>;
}

export default function TabLayout() {
  return <Tabs tabBar={props => <Dock {...props} />} screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: 'Shift' }} />
    <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    <Tabs.Screen name="deliveries" options={{ href: null }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  dock: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', top: 0, left: '30%', right: '30%', height: 3, backgroundColor: 'transparent' },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textSecondary },
  labelOn: { fontFamily: fonts.bold, color: colors.text },
});
