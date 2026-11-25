import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { api, login, logout, onExpired, restoreSession } from './api';
import type { Delivery, Earnings, Identity } from './api';
import { previewAvailable, previewCompleted, previewEarnings, previewIdentity } from './preview';

export const PREVIEW = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';

// Next backend status for each active status (mirrors ops_driver_action).
export const NEXT: Record<string, string> = {
  heading_to_restaurant: 'arrived_at_restaurant',
  arrived_at_restaurant: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered',
};

type Store = {
  identity: Identity | null;
  available: Delivery[];
  active: Delivery[];
  completed: Delivery[];
  earnings: Earnings | null;
  error: string;
  offline: boolean;
  updated: string;
  loading: boolean;
  starting: boolean;
  finished: Delivery | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setOnline: (value: boolean) => Promise<void>;
  accept: (job: Delivery) => Promise<void>;
  advance: (job: Delivery, cashCollected?: boolean) => Promise<void>;
  decline: (id: string) => void;
  saveProfile: (changes: { full_name: string; phone: string }) => Promise<void>;
  clearFinished: () => void;
};

const Context = createContext<Store | null>(null);
const isNetwork = (message: string) => /reach the service|timed out/i.test(message);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(PREVIEW ? previewIdentity : null);
  const [available, setAvailable] = useState<Delivery[]>(PREVIEW ? previewAvailable : []);
  const [active, setActive] = useState<Delivery[]>([]);
  const [completed, setCompleted] = useState<Delivery[]>(PREVIEW ? previewCompleted : []);
  const [earnings, setEarnings] = useState<Earnings | null>(PREVIEW ? previewEarnings(previewCompleted) : null);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [updated, setUpdated] = useState(PREVIEW ? new Date().toISOString() : '');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(!PREVIEW);
  const [declined, setDeclined] = useState<string[]>([]);
  const [finished, setFinished] = useState<Delivery | null>(null);
  const inFlight = useRef(false);
  const epoch = useRef(0);

  const clear = useCallback(() => {
    epoch.current++;
    setIdentity(null); setAvailable([]); setActive([]); setCompleted([]); setEarnings(null);
    setUpdated(''); setDeclined([]); setFinished(null);
  }, []);

  useEffect(() => {
    if (PREVIEW) return;
    onExpired(() => { clear(); setError('Your session expired. Sign in again.'); });
    let mounted = true;
    void restoreSession().then(async (restored) => {
      if (restored && mounted) {
        const me = await api<Identity>('/me');
        if (me.role !== 'driver' || !me.driver) { await logout(); return; }
        setIdentity(me);
      }
    }).catch(() => setError('Could not restore your session. Sign in again.')).finally(() => { if (mounted) setStarting(false); });
    return () => { mounted = false; onExpired(() => { }); };
  }, [clear]);

  const driverId = identity?.driver?.id;
  const refresh = useCallback(async () => {
    if (PREVIEW) { setUpdated(new Date().toISOString()); return; }
    if (!driverId || inFlight.current) return;
    inFlight.current = true;
    const current = epoch.current;
    setLoading(true);
    try {
      const [me, availableJobs, activeJobs, completedJobs, totals] = await Promise.all([
        api<Identity>('/me'),
        api<Delivery[]>('/driver/deliveries?kind=available'),
        api<Delivery[]>('/driver/deliveries?kind=active'),
        api<Delivery[]>('/driver/deliveries?kind=completed'),
        api<Earnings>('/driver/earnings'),
      ]);
      if (current !== epoch.current) return;
      setIdentity(me); setAvailable(availableJobs); setActive(activeJobs); setCompleted(completedJobs); setEarnings(totals);
      setUpdated(new Date().toISOString()); setError(''); setOffline(false);
    } catch (e) {
      if (current !== epoch.current) return;
      const message = (e as Error).message;
      setOffline(isNetwork(message));
      setError(isNetwork(message) ? '' : message);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (!driverId || PREVIEW) return;
    const initial = setTimeout(() => void refresh(), 0);
    const interval = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 15000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { clearTimeout(initial); clearInterval(interval); subscription.remove(); };
  }, [driverId, refresh]);

  const signIn = async (email: string, password: string) => {
    if (PREVIEW) { setIdentity(previewIdentity); setAvailable(previewAvailable); setCompleted(previewCompleted); setEarnings(previewEarnings(previewCompleted)); return; }
    await login(email, password);
    try {
      const me = await api<Identity>('/me');
      if (me.role !== 'driver' || !me.driver) throw new Error('Use an invited driver account. Staff use the branch dashboard.');
      epoch.current++; setError(''); setIdentity(me);
    } catch (e) { await logout(); throw e; }
  };
  const signOut = async () => { clear(); setError(''); if (!PREVIEW) await logout(); };

  const setOnline = async (value: boolean) => {
    if (PREVIEW) { setIdentity(i => i && { ...i, driver: { ...i.driver, is_online: value } }); return; }
    await api('/driver/profile', { is_online: value }, 'PATCH');
    await refresh();
  };

  const saveProfile = async (changes: { full_name: string; phone: string }) => {
    if (PREVIEW) { setIdentity(i => i && { ...i, driver: { ...i.driver, ...changes } }); return; }
    await api('/driver/profile', changes, 'PATCH');
    await refresh();
  };

  const accept = async (job: Delivery) => {
    if (PREVIEW) {
      const now = new Date().toISOString();
      setAvailable(list => list.filter(j => j.id !== job.id));
      setActive([{ ...job, status: 'heading_to_restaurant', accepted_at: now }]);
      setIdentity(i => i && { ...i, driver: { ...i.driver, status: 'busy' } });
      return;
    }
    await api(`/driver/deliveries/${job.id}/accept`, {}, 'POST');
    await refresh();
  };

  const advance = async (job: Delivery, cashCollected = false) => {
    const next = NEXT[job.status];
    if (!next) return;
    if (PREVIEW) {
      const now = new Date().toISOString();
      const moved: Delivery = { ...job, status: next, picked_up_at: next === 'picked_up' ? now : job.picked_up_at, delivered_at: next === 'delivered' ? now : job.delivered_at };
      if (next === 'delivered') {
        const all = [moved, ...completed];
        setActive([]); setCompleted(all); setEarnings(previewEarnings(all)); setFinished(moved);
        setIdentity(i => i && { ...i, driver: { ...i.driver, status: 'available' } });
      } else setActive([moved]);
      return;
    }
    await api(`/driver/deliveries/${job.id}/status`, { status: next, cashCollected }, 'PATCH');
    if (next === 'delivered') setFinished({ ...job, status: 'delivered', delivered_at: new Date().toISOString() });
    await refresh();
  };

  const decline = (id: string) => setDeclined(list => [...list, id]);
  const clearFinished = () => setFinished(null);
  const visible = useMemo(() => available.filter(j => !declined.includes(j.id)), [available, declined]);

  return <Context.Provider value={{
    identity, available: visible, active, completed, earnings, error, offline, updated, loading, starting, finished,
    refresh, signIn, signOut, setOnline, accept, advance, decline, saveProfile, clearFinished,
  }}>{children}</Context.Provider>;
}

export function useDriver() {
  const context = useContext(Context);
  if (!context) throw new Error('DriverProvider is required.');
  return context;
}
