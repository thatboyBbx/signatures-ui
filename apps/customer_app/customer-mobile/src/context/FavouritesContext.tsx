import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Favourite = { key: string; name: string; price: string; image: string; menuItemId?: string };

type Value = {
  favourites: Favourite[];
  isFavourite: (name: string) => boolean;
  toggle: (item: Omit<Favourite, 'key'>) => void;
};

const Context = createContext<Value | null>(null);
const keyFor = (name: string) => name.trim().toLocaleLowerCase();

/** Favourite dishes, kept on this device per customer. Keyed by dish name so they survive menu reloads. */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth();
  const storageKey = customer ? `signatures:favourites:${customer.id}` : null;
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  useEffect(() => {
    setFavourites([]);
    if (!storageKey) return;
    let live = true;
    void AsyncStorage.getItem(storageKey).then(raw => { if (live && raw) setFavourites(JSON.parse(raw) as Favourite[]); }).catch(() => undefined);
    return () => { live = false; };
  }, [storageKey]);
  const toggle = useCallback((item: Omit<Favourite, 'key'>) => {
    setFavourites(current => {
      const key = keyFor(item.name);
      const next = current.some(entry => entry.key === key) ? current.filter(entry => entry.key !== key) : [{ ...item, key }, ...current];
      if (storageKey) void AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [storageKey]);
  const value = useMemo(() => ({ favourites, toggle, isFavourite: (name: string) => favourites.some(entry => entry.key === keyFor(name)) }), [favourites, toggle]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useFavourites() {
  const value = useContext(Context);
  if (!value) throw new Error('FavouritesProvider is required.');
  return value;
}
