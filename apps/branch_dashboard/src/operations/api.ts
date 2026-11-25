const preview = import.meta.env.VITE_UI_PREVIEW === '1';
export type Session = {
    accessToken: string;
    refreshToken: string;
};
export type Branch = {
    id: string;
    code: string;
    name: string;
    address: string;
    phone: string;
    accepting_orders: boolean;
    is_open: boolean;
};
export type Identity = {
    role: 'staff' | 'driver';
    branch: Branch;
    email: string;
};
export type MenuItem = {
    id: string;
    name: string;
    department: 'Food' | 'Drinks';
    category: string;
    description: string;
    image_url: string;
    price: number;
    available: boolean;
    menu_variants: {
        id?: string;
        label: string;
        price: number;
    }[];
};
export type OrderDelivery = {
    id: string;
    status: string;
    driver_id: string | null;
    created_at?: string;
    accepted_at?: string | null;
    picked_up_at?: string | null;
    drivers?: {
        id: string;
        full_name: string;
        driver_code: string;
    } | null;
};
export type Order = {
    id: string;
    order_number: string;
    subtotal?: number;
    delivery_fee?: number;
    deliveries?: OrderDelivery | OrderDelivery[] | null;
    customer_name: string;
    customer_phone: string;
    status: string;
    order_type: string;
    total: number;
    payment_status: string;
    notes: string;
    delivery_address: string;
    created_at: string;
    order_items: {
        id: string;
        item_name: string;
        variant_name: string;
        quantity: number;
        total_price: number;
    }[];
    order_events: {
        id: string;
        status: string;
        created_at: string;
    }[];
};
export type Driver = {
    id: string;
    driver_code: string;
    full_name: string;
    phone: string;
    is_online: boolean;
    status: string;
};
export type Delivery = {
    id: string;
    status: string;
    driver_id: string | null;
    created_at?: string;
    accepted_at?: string | null;
    picked_up_at?: string | null;
    orders: Order;
};
export const baseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');
let session: Session | null = null;
let onExpired = () => { };
let refresh: Promise<void> | null = null;
export const setExpiredHandler = (handler: () => void) => { onExpired = handler; };
export const clearSession = () => { session = null; };
export async function signIn(email: string, password: string) {
    if (preview) {
        session = { accessToken: 'preview', refreshToken: 'preview' };
        return;
    }
    const response = await request(`${baseUrl}/auth/sign-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const json = await response.json();
    if (!response.ok || !json.success)
        throw new Error(json.message ?? 'Sign-in failed.');
    session = json.data.session;
}
export async function signOut() {
    const token = session?.accessToken;
    session = null;
    if (token)
        await request(`${baseUrl}/auth/sign-out`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
}
async function renew() {
    if (!session)
        throw new Error('Please sign in again.');
    const response = await request(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.refreshToken }) });
    const json = await response.json();
    if (!response.ok || !json.success)
        throw new Error('Your session expired. Please sign in again.');
    session = json.data.session;
}
export async function api<T>(path: string, body?: unknown, method = 'GET', retry = true): Promise<{
    data: T;
    count?: number;
}> {
    if (preview)
        return (await import('./preview')).previewApi<T>(path, body, method);
    const response = await request(`${baseUrl}/ops${path}`, { method, headers: { Authorization: `Bearer ${session?.accessToken ?? ''}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (response.status === 401 && retry && session) {
        try {
            refresh ??= renew().finally(() => { refresh = null; });
            await refresh;
            return await api<T>(path, body, method, false);
        }
        catch {
            clearSession();
            onExpired();
            throw new Error('Your session expired. Please sign in again.');
        }
    }
    const json = await response.json();
    if (!response.ok || !json.success) {
        if (response.status === 401) {
            clearSession();
            onExpired();
        }
        throw new Error(json.message ?? 'Could not complete this request. Retry shortly.');
    }
    return json;
}
export const money = (value: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
export const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, v => v.toUpperCase());
export const time = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Harare' }).format(new Date(value));
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
