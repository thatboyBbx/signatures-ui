import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Venue } from '../services/venuesApi';

export type DeliveryAddress = {
  id: string;
  label: string;
  address: string;
};

export type PaymentMethod = {
  id: string;
  label: string;
  detail: string;
  icon: 'cash-outline' | 'card-outline' | 'phone-portrait-outline';
};

type CheckoutContextValue = {
  venue: Venue | null;
  setVenue: (venue: Venue) => void;
  address: DeliveryAddress | null;
  paymentMethod: PaymentMethod | null;

  setAddress: (address: DeliveryAddress) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  resetCheckout: () => void;
};

const CheckoutContext =
  createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { clearCart } = useCart();
  const { customer } = useAuth();
  const [venue, updateVenue] = useState<Venue | null>(null);
  const [address, setAddress] =
    useState<DeliveryAddress | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const setVenue = (next: Venue) => { if (venue?.code !== next.code) clearCart(); updateVenue(next); };
  useEffect(() => { updateVenue(null); setAddress(null); setPaymentMethod(null); }, [customer?.id]);
  const resetCheckout = () => {
    setAddress(null);
    setPaymentMethod(null);
  };

  return (
    <CheckoutContext.Provider
      value={{
        venue,
        setVenue,
        address,
        paymentMethod,
        setAddress,
        setPaymentMethod,
        resetCheckout,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);

  if (!context) {
    throw new Error(
      'useCheckout must be used inside CheckoutProvider',
    );
  }

  return context;
}
