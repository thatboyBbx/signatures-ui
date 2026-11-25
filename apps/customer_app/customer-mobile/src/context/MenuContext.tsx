import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useCheckout } from './CheckoutContext';
import { sampleMenu } from '../sample-data/menu';
import { dishPhoto } from '../sample-data/dishPhotos';
import { API_URL } from '../services/apiConfig';
export type MenuEntry = {
    id: string;
    name: string;
    category: string;
    department: string;
    restaurant: string;
    time: string;
    description: string;
    price: string;
    rating: string;
    image: string;
    available: boolean;
    variants: {
        id: string;
        label: string;
        price: number;
    }[];
};
type MenuStore = {
    menu: MenuEntry[];
    loading: boolean;
    error: string;
    preview: boolean;
    reload: () => unknown;
};
const Context = createContext<MenuStore | null>(null);
export function MenuProvider({ children }: {
    children: ReactNode;
}) {
    const { venue } = useCheckout();
    const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';
    const lastVenue = useRef<string | undefined>(undefined);
    const [menu, setMenu] = useState<MenuEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const reload = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        if (preview) {
            setMenu(sampleMenu.map(item => ({ ...item, department: 'Food', available: true, variants: [] })));
            return;
        }
        if (lastVenue.current !== venue?.code) { setMenu([]); lastVenue.current = venue?.code; }
        if (!venue) {
            setError('Choose a venue to see its menu.');
            return;
        }
        const controller = new AbortController();
        let disposed = false;
        const timeout = setTimeout(() => controller.abort(), 12000);
        setLoading(true);
        setError('');
        void fetch(`${API_URL}/branches/${encodeURIComponent(venue.code)}/menu`, { signal: controller.signal }).then(async (response) => { const json = await response.json(); if (!response.ok || !json.success)
            throw new Error(json.message ?? 'Menu unavailable.'); return json.data as {
            id: string;
            name: string;
            category: string;
            department: string;
            description: string;
            image_url: string;
            price: number;
            available: boolean;
            menu_variants: MenuEntry['variants'];
        }[]; }).then(items => { if (disposed) return; setMenu(items.map(item => ({ ...item, restaurant: venue.name, time: '', rating: '', image: item.image_url || dishPhoto(item.name) || '', price: `$${Number(item.price).toFixed(2)}`, variants: item.menu_variants }))); }).catch(e => { if (!disposed)
            setError(controller.signal.aborted ? 'Menu request timed out. Please retry.' : e instanceof Error ? e.message : 'Menu unavailable. Retry shortly.'); }).finally(() => { clearTimeout(timeout); if (!disposed)
            setLoading(false); });
        return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
    }, [venue?.code, preview, revision]);
    useEffect(() => { if (preview || !venue?.code) return; const interval = setInterval(() => { if (AppState.currentState === 'active') reload(); }, 15000); const subscription = AppState.addEventListener('change', value => { if (value === 'active') reload(); }); return () => { clearInterval(interval); subscription.remove(); }; }, [preview, venue?.code, reload]);
    return <Context.Provider value={{ menu, loading, error, preview, reload }}>{children}</Context.Provider>;
}
export function useMenu() { const value = useContext(Context); if (!value)
    throw new Error('MenuProvider is required.'); return value; }
