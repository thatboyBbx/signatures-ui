import { useAuth } from './AuthContext';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { CartItem } from '../types/cart';
import { promoDiscount, type Promo } from '../services/mockApi';

type CartContextValue = {
  items: CartItem[];

  itemCount: number;
  subtotal: number;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;

  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;

  clearCart: () => void;

  /** Promo code (mock until the API validates codes). */
  promo: Promo | null;
  discount: number;
  setPromo: (promo: Promo | null) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<Promo | null>(null);
  const { customer } = useAuth();
  useEffect(() => { setItems([]); setPromo(null); }, [customer?.id]);
  useEffect(() => { if (!items.length) setPromo(null); }, [items.length]);

  const addItem = (item: CartItem) => {
    setItems((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);

      if (!existing) {
        return [...current, item];
      }

      return current.map((cartItem) => {
        if (cartItem.id !== item.id) {
          return cartItem;
        }

        const quantity = cartItem.quantity + item.quantity;

        return {
          ...cartItem,
          quantity,
          totalPrice: cartItem.unitPrice * quantity,
        };
      });
    });
  };

  const removeItem = (id: string) => {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const increaseQuantity = (id: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const quantity = item.quantity + 1;

        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity,
        };
      }),
    );
  };

  const decreaseQuantity = (id: string) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;

          const quantity = item.quantity - 1;

          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromo(null);
  };

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.totalPrice,
        0,
      ),
    [items],
  );

  const discount = promoDiscount(promo, subtotal);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        promo,
        discount,
        setPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}