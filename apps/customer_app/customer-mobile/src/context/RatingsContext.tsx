import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { sendRating } from '../services/mockApi';
import type { Order } from '../types/order';
import { mealDeals } from '../sample-data/mealDeals';

export type OrderRating = { orderId: string; score: number; note?: string; dishes: string[]; at: string };

type Value = {
  ratingFor: (orderId: string) => OrderRating | undefined;
  rate: (order: Order, score: number, note?: string) => void;
  /** Average score across rated orders that contained this dish, or null when nobody has rated it. */
  dishRating: (name: string) => { average: number; count: number } | null;
};

const Context = createContext<Value | null>(null);
const keyFor = (name: string) => name.trim().toLocaleLowerCase();

/**
 * Order ratings (mock). Kept on this device and sent to the mock endpoint; once the API stores
 * ratings, dishRating should come from the menu's own averages instead.
 */
export function RatingsProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth();
  const storageKey = customer ? `signatures:ratings:${customer.id}` : null;
  const [ratings, setRatings] = useState<OrderRating[]>([]);
  useEffect(() => {
    setRatings([]);
    if (!storageKey) return;
    let live = true;
    void AsyncStorage.getItem(storageKey).then(raw => { if (live && raw) setRatings(JSON.parse(raw) as OrderRating[]); }).catch(() => undefined);
    return () => { live = false; };
  }, [storageKey]);
  const rate = useCallback((order: Order, score: number, note?: string) => {
    const entry: OrderRating = { orderId: order.id, score, note: note?.trim() || undefined, dishes: [...new Set(order.items.map(item => mealDeals.find(deal => deal.id === item.foodId)?.dish ?? item.name))], at: new Date().toISOString() };
    setRatings(current => {
      const next = [entry, ...current.filter(item => item.orderId !== order.id)];
      if (storageKey) void AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
    void sendRating({ orderId: order.id, score, note: entry.note });
  }, [storageKey]);
  const value = useMemo<Value>(() => ({
    rate,
    ratingFor: orderId => ratings.find(item => item.orderId === orderId),
    dishRating: name => {
      const key = keyFor(name);
      const scores = ratings.filter(item => item.dishes.some(dish => keyFor(dish) === key)).map(item => item.score);
      return scores.length ? { average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10, count: scores.length } : null;
    },
  }), [ratings, rate]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRatings() {
  const value = useContext(Context);
  if (!value) throw new Error('RatingsProvider is required.');
  return value;
}
