// src/stores/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productSlug?: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  currencySymbol: string;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(
            item => item.productId === newItem.productId && 
                   item.variantId === newItem.variantId
          );

          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.productId === newItem.productId && 
                item.variantId === newItem.variantId
                  ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                  : item
              )
            };
          } else {
            return {
              items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }]
            };
          }
        });
      },

      removeFromCart: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            item => !(item.productId === productId && item.variantId === variantId)
          )
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map(item =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'nipponhub-cart-storage',
    }
  )
);
