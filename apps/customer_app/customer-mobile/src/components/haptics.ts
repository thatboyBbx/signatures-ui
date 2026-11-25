import { Platform } from 'react-native';
import { getPreferences } from '../context/preferences';

/**
 * Light tactile feedback for add-to-cart and order-stage changes.
 * Web: uses the Vibration API where the browser supports it (Android Chrome).
 * Native: install `expo-haptics` (npx expo install expo-haptics), then replace the body of
 * `nativeTap` with: `void Haptics.impactAsync(kind === 'success' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);`
 */
function nativeTap(_kind: 'light' | 'success') { /* enabled once expo-haptics is installed */ }

export function haptic(kind: 'light' | 'success' = 'light') {
  if (!getPreferences().haptics) return;
  if (Platform.OS === 'web') {
    const nav = (globalThis as { navigator?: { vibrate?: (pattern: number | number[]) => boolean } }).navigator;
    nav?.vibrate?.(kind === 'success' ? [12, 40, 18] : 10);
    return;
  }
  nativeTap(kind);
}
