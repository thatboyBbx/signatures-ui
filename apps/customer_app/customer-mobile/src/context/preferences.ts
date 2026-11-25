import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Small device-local preferences (notifications choices, haptics). */
export type Preferences = { orderUpdates: boolean; riderArriving: boolean; offers: boolean; haptics: boolean };
const KEY = 'signatures:preferences';
const defaults: Preferences = { orderUpdates: true, riderArriving: true, offers: false, haptics: true };
let current: Preferences = defaults;
const listeners = new Set<(value: Preferences) => void>();
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  void AsyncStorage.getItem(KEY).then(raw => {
    if (!raw) return;
    current = { ...defaults, ...(JSON.parse(raw) as Partial<Preferences>) };
    listeners.forEach(listener => listener(current));
  }).catch(() => undefined);
}

export function getPreferences() { load(); return current; }

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  current = { ...current, [key]: value };
  listeners.forEach(listener => listener(current));
  void AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => undefined);
}

export function usePreferences() {
  const [value, setValue] = useState(getPreferences());
  useEffect(() => { listeners.add(setValue); return () => { listeners.delete(setValue); }; }, []);
  return value;
}
