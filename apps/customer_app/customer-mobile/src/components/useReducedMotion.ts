import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

let reduced = Platform.OS === 'web' && typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : true;
const listeners = new Set<() => void>();
let subscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined;
let removeWebListener: (() => void) | undefined;

function update(value: boolean) {
  reduced = value;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const change = () => update(query.matches);
      query.addEventListener('change', change);
      removeWebListener = () => query.removeEventListener('change', change);
      change();
    } else {
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
      void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(true));
    }
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { subscription?.remove(); subscription = undefined; removeWebListener?.(); removeWebListener = undefined; }
  };
}

/** One native preference listener shared by the hero and every press target. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => reduced, () => true);
}
