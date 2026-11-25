import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { setPreference, usePreferences } from '../../../context/preferences';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Card, ParamountSubPage, Row, SectionLabel, ToggleRow, subPageStyles } from '../../../components/ParamountSubPage';
import { useReducedMotion } from '../../../components/useReducedMotion';
import { colors, fonts } from '../../../theme/theme';

export function SettingsScreen() {
  const prefs = usePreferences();
  const reduced = useReducedMotion();
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  return <ParamountSubPage eyebrow="YOUR ACCOUNT" title="Settings" italic="Make it yours.">
    <SectionLabel>EXPERIENCE</SectionLabel>
    <Card>
      <ToggleRow icon="phone-portrait-outline" label="Haptic feedback" detail="A light tap when you add to your tray or your order moves on." value={prefs.haptics} onChange={value => setPreference('haptics', value)} />
      <Row icon="film-outline" label="Motion & video" value={reduced ? 'Reduced — following your device setting' : 'Full — videos and animation play'} last />
    </Card>
    <Text style={subPageStyles.note}>To pause hero videos and animation, turn on Reduce Motion in your phone's accessibility settings.</Text>
    <SectionLabel>ABOUT</SectionLabel>
    <Card>
      <Row icon="restaurant-outline" label="Signatures" value="Paramount Signature · Harare" />
      <Row icon="information-circle-outline" label="App version" value="1.0.0" last />
    </Card>
    <SectionLabel>SESSION</SectionLabel>
    {!confirming ? <Pressable accessibilityRole="button" style={styles.logout} onPress={() => setConfirming(true)}>
      <Ionicons name="log-out-outline" size={20} color={colors.error} /><Text style={styles.logoutText}>Log out</Text>
    </Pressable> : <View style={styles.confirm}>
      <Text style={styles.confirmTitle}>Log out of Signatures?</Text>
      <Text style={styles.confirmBody}>You'll need to log in again to see your orders.</Text>
      <View style={styles.confirmRow}>
        <Pressable accessibilityRole="button" style={[styles.confirmButton, styles.cancel]} onPress={() => setConfirming(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" style={[styles.confirmButton, styles.danger]} onPress={() => { void signOut().catch(e => setError(e instanceof Error ? e.message : 'Please try again.')); }}><Text style={styles.dangerText}>Log out</Text></Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>}
  </ParamountSubPage>;
}

const styles = StyleSheet.create({
  logout: { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.error },
  confirm: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, gap: 8 },
  confirmTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  confirmBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  confirmButton: { flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancel: { borderWidth: 1, borderColor: colors.border },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  danger: { backgroundColor: colors.error },
  dangerText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.error },
});
