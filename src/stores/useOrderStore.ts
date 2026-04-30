import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CartItem } from '@/stores/useCartStore';

export interface LastOrderSnapshot {
  orderId: string;
  orderNumber?: string;
  createdAt: string;
  countryId?: number;
  cityId?: number;
  countryName?: string;
  cityName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  district: string;
  note: string;
  locationLabel: string;
  paymentMethod: 'mobile-money' | 'retrieve' | 'cod';
  subtotal: number;
  shipping: number;
  total: number;
  currencySymbol: string;
  items: CartItem[];
}

interface OrderState {
  lastOrder: LastOrderSnapshot | null;
  setLastOrder: (order: LastOrderSnapshot) => void;
  clearLastOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    {
      name: 'nipponhub-last-order-storage',
    }
  )
);
