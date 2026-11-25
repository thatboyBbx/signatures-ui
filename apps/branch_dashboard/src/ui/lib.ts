import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../operations/api';
import type { Order, OrderDelivery } from '../operations/api';

/* ---------- formatting ---------- */

export const shortCode = (orderNumber: string) => orderNumber.slice(-4).toUpperCase();

export const branchLabel = (name: string) => name.replace(/^paramount(\s+signature)?\s*[·\-–|]\s*/i, '').trim() || name;

export const clock = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'Africa/Harare' }).format(new Date(iso));

export const dayTime = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }).format(new Date(iso));

export function timer(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h ? `${h}h ${String(m).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

export const firstName = (name: string) => {
    const [first, last] = name.trim().split(/\s+/);
    return last ? `${first} ${last[0]}.` : first;
};

export const itemCount = (order: Order) => order.order_items.reduce((sum, item) => sum + item.quantity, 0);

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const eventNames: Record<string, string> = {
    confirmed: 'Placed', preparing: 'Accepted', ready: 'Ready', awaiting_driver: 'Driver requested',
    driver_assigned: 'Driver accepted', heading_to_restaurant: 'Driver coming', arrived_at_restaurant: 'Driver at the counter',
    picked_up: 'Collected by driver', on_the_way: 'On the way', delivered: 'Delivered', completed: 'Handed over',
    cancelled: 'Cancelled', rejected: 'Rejected',
};
export const eventName = (status: string) => eventNames[status] ?? status.replaceAll('_', ' ');

const statusNames: Record<string, string> = {
    confirmed: 'New', preparing: 'Preparing', ready: 'Ready', awaiting_driver: 'Finding a driver', driver_assigned: 'Driver assigned',
    on_the_way: 'On the way', delivered: 'Delivered', completed: 'Collected', cancelled: 'Cancelled', rejected: 'Rejected',
};
export const statusName = (status: string) => statusNames[status] ?? status.replaceAll('_', ' ');

const deliveryNames: Record<string, string> = {
    awaiting_driver: 'Finding a driver', heading_to_restaurant: 'Coming', arrived_at_restaurant: 'At the counter',
    picked_up: 'Collected', on_the_way: 'On the road', delivered: 'Delivered',
};
export const deliveryName = (status: string) => deliveryNames[status] ?? status.replaceAll('_', ' ');

/* ---------- order timing ---------- */

export const deliveryOf = (order: Order): OrderDelivery | null => {
    const d = order.deliveries;
    if (!d) return null;
    return Array.isArray(d) ? d[0] ?? null : d;
};

/** When the order entered one of these statuses most recently (falls back to placement). */
export function since(order: Order, statuses: string[]) {
    const hits = (order.order_events ?? []).filter(e => statuses.includes(e.status)).map(e => e.created_at).sort();
    return hits.at(-1) ?? order.created_at;
}

export type Stage = 'new' | 'preparing' | 'ready' | 'driver_search' | 'driver_coming' | 'driver_here' | 'driver_collected';

export function stageOf(order: Order): Stage {
    if (order.status === 'confirmed') return 'new';
    if (order.status === 'preparing') return 'preparing';
    if (order.status === 'ready') return 'ready';
    const delivery = deliveryOf(order);
    if (order.status === 'awaiting_driver' || !delivery || delivery.status === 'awaiting_driver') return 'driver_search';
    if (delivery.status === 'arrived_at_restaurant') return 'driver_here';
    if (delivery.status === 'picked_up') return 'driver_collected';
    return 'driver_coming';
}

const stageEvents: Record<Stage, string[]> = {
    new: ['confirmed'], preparing: ['preparing'], ready: ['ready'], driver_search: ['awaiting_driver'],
    driver_coming: ['driver_assigned'], driver_here: ['arrived_at_restaurant'], driver_collected: ['picked_up'],
};
export const stageStart = (order: Order) => since(order, stageEvents[stageOf(order)]);

/** Minutes before a ticket shows as "getting late" and "late". */
const thresholds: Partial<Record<Stage, [number, number]>> = {
    new: [1, 3], preparing: [15, 25], ready: [10, 20], driver_search: [5, 10], driver_here: [3, 6],
};

export function urgency(order: Order, now: number): 'ok' | 'warn' | 'late' {
    const limits = thresholds[stageOf(order)];
    if (!limits) return 'ok';
    const minutes = (now - new Date(stageStart(order)).getTime()) / 60000;
    return minutes >= limits[1] ? 'late' : minutes >= limits[0] ? 'warn' : 'ok';
}

/* ---------- live data ---------- */

export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(id); }, [intervalMs]);
    return now;
}

export type Resource<T> = {
    data: T | null; count: number; error: string; loading: boolean; updated: number; load: () => Promise<void>;
    setData: (update: (current: T | null) => T | null) => void;
};

/** Polls a path. Keeps the last good data when a refresh fails, so the screen can say it is stale. */
export function useResource<T>(path: string, everyMs = 15000, fetcher?: () => Promise<{ data: T; count?: number }>): Resource<T> {
    const [data, setDataState] = useState<T | null>(null);
    const [count, setCount] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [updated, setUpdated] = useState(0);
    const generation = useRef(0);
    const fetchRef = useRef(fetcher);
    useEffect(() => { fetchRef.current = fetcher; });
    const load = useCallback(async () => {
        const id = ++generation.current;
        try {
            const result = fetchRef.current ? await fetchRef.current() : await api<T>(path);
            if (id !== generation.current) return;
            setDataState(result.data);
            setCount(result.count ?? 0);
            setError('');
            setUpdated(Date.now());
        }
        catch (e) {
            if (id === generation.current) setError((e as Error).message);
        }
        finally {
            if (id === generation.current) setLoading(false);
        }
    }, [path]);
    useEffect(() => {
        const first = setTimeout(() => void load(), 0);
        const refresh = () => { if (!document.hidden) void load(); };
        const interval = setInterval(refresh, everyMs);
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => { clearTimeout(first); clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
    }, [load, everyMs]);
    const setData = useCallback((update: (current: T | null) => T | null) => setDataState(update), []);
    return { data, count, error, loading, updated, load, setData };
}

/** All active orders: the API pages by 25, so keep reading until the count is covered. */
export async function fetchActiveOrders() {
    const first = await api<Order[]>('/orders?history=0&page=0');
    const all = [...first.data];
    const total = first.count ?? all.length;
    for (let page = 1; all.length < total && page < 8; page++) {
        const next = await api<Order[]>(`/orders?history=0&page=${page}`);
        if (!next.data.length) break;
        all.push(...next.data);
    }
    return { data: all, count: total };
}

/* ---------- storage (best effort) ---------- */

export function readStore<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
    catch { return fallback; }
}
export function writeStore(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* storage unavailable: keep in memory only */ }
}

/* ---------- sound ---------- */

let audio: AudioContext | null = null;

export function unlockSound() {
    try {
        audio ??= new AudioContext();
        if (audio.state === 'suspended') void audio.resume();
    }
    catch { /* no audio on this device */ }
}

export const soundReady = () => audio?.state === 'running';

/** Two short, clear tones. Plays only once the browser has allowed audio. */
export function chime() {
    if (!audio || audio.state !== 'running') return false;
    const start = audio.currentTime;
    [[880, 0], [1175, 0.22]].forEach(([freq, offset]) => {
        const osc = audio!.createOscillator();
        const gain = audio!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.5, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.2);
        osc.connect(gain).connect(audio!.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.22);
    });
    return true;
}
