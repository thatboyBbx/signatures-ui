import { NativeModules, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
export type Session = {
    accessToken: string;
    refreshToken: string;
};
export type Driver = {
    id: string;
    full_name: string;
    phone: string;
    is_online: boolean;
    status: string;
    driver_code: string;
};
export type Identity = {
    role: string;
    email: string;
    branch: {
        id: string;
        name: string;
        address: string;
        phone: string;
    };
    driver: Driver;
};
export type Delivery = {
    id: string;
    status: string;
    earnings: number;
    driver_earnings: number;
    delivery_address: string;
    created_at: string;
    delivered_at: string | null;
    accepted_at?: string | null;
    picked_up_at?: string | null;
    distance_km?: number | null;
    estimated_minutes?: number | null;
    orders: {
        order_number: string;
        customer_name: string;
        customer_phone: string | null;
        total: number;
        subtotal?: number;
        delivery_fee?: number;
        notes?: string | null;
        payment_method?: string;
        branches: {
            name: string;
            address: string;
        };
        order_items: {
            id: string;
            quantity: number;
            item_name: string;
            variant_name: string;
        }[];
    };
};
export type Earnings = {
    today: number;
    week: number;
    todayCount: number;
    weekCount: number;
    allTime: number;
};
const host = (NativeModules.SourceCode?.scriptURL as string | undefined)?.match(/^[a-z]+:\/\/([^/:]+)/i)?.[1];
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? `http://${Platform.OS === 'web' ? 'localhost' : host ?? 'localhost'}:4000/api`;
let session: Session | null = null;
let expired = () => { };
let renewing: Promise<void> | null = null;
export const onExpired = (handler: () => void) => { expired = handler; };
async function remember(value: Session | null) { session = value; if (Platform.OS !== 'web') {
    if (value)
        await SecureStore.setItemAsync('paramount-session', JSON.stringify(value));
    else
        await SecureStore.deleteItemAsync('paramount-session');
} }
export async function restoreSession() { if (Platform.OS !== 'web') {
    const saved = await SecureStore.getItemAsync('paramount-session');
    if (saved) {
        try {
            session = JSON.parse(saved);
            await refreshSession();
            return true;
        }
        catch {
            await remember(null);
        }
    }
} return false; }
export async function login(email: string, password: string) {
    const response = await request(`${API_URL}/auth/sign-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const json = await response.json();
    if (!response.ok || !json.success)
        throw new Error(json.message ?? 'Could not sign in.');
    await remember(json.data.session);
}
export async function logout() { const token = session?.accessToken; await remember(null); if (token)
    await request(`${API_URL}/auth/sign-out`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { }); }
async function refreshSession() { const response = await request(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session?.refreshToken }) }); const json = await response.json(); if (!response.ok || !json.success)
    throw new Error('Session expired.'); await remember(json.data.session); }
export async function api<T>(path: string, body?: unknown, method = 'GET', retry = true): Promise<T> {
    const response = await request(`${API_URL}/ops${path}`, { method, headers: { Authorization: `Bearer ${session?.accessToken ?? ''}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (response.status === 401 && retry && session) {
        try {
            renewing ??= refreshSession().finally(() => { renewing = null; });
            await renewing;
            return await api<T>(path, body, method, false);
        }
        catch {
            await remember(null);
            expired();
            throw new Error('Your session expired. Sign in again.');
        }
    }
    const json = await response.json();
    if (!response.ok || !json.success) {
        if (response.status === 401) {
            await remember(null);
            expired();
        }
        throw new Error(json.message ?? 'Request failed. Please retry.');
    }
    return json.data;
}
export const money = (value: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
export const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
async function request(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    }
    catch {
        throw new Error(controller.signal.aborted ? 'The request timed out. Check your connection and retry.' : 'Could not reach the service. Check your connection and retry.');
    }
    finally {
        clearTimeout(timer);
    }
}
