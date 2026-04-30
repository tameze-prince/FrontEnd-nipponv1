import { create } from 'zustand';
import { stockService } from '@/lib/stock-service';

export interface StockState {
  countryId: string | null;
  stocks: Array<{
    id: string;
    variantId: string;
    variantLabel: string;
    productName: string;
    productId: string;
    countryId: string;
    countryName: string;
    quantity: number;
    updatedAt: string;
  }>;
  lowStocks: Array<{
    id: string;
    variantId: string;
    variantLabel: string;
    productName: string;
    productId: string;
    countryId: string;
    countryName: string;
    quantity: number;
    updatedAt: string;
  }>;
  movements: Array<{
    id: string;
    variantId: string;
    countryId: string;
    variantLabel: string;
    productName: string;
    quantity: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';
    reason?: string;
    user?: string;
    createdAt: string;
  }>;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;

  // Actions
  setCountry: (countryId: string) => void;
  fetchStocks: (countryId: string) => Promise<void>;
  fetchLowStocks: (countryId: string) => Promise<void>;
  fetchMovements: (variantId: string, countryId: string) => Promise<void>;
  adjustStock: (request: {
    variantId: string | number;
    countryId: string | number;
    quantity: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';
    reason?: string;
  }) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  countryId: null,
  stocks: [],
  lowStocks: [],
  movements: [],
  loading: false,
  error: null,
  lastUpdate: null,

  setCountry: (countryId: string) => {
    set({ countryId });
  },

  fetchStocks: async (countryId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await stockService.getStocksByCountry(countryId);
      if (response.success && response.data) {
        set({
          stocks: response.data,
          lastUpdate: new Date().toISOString(),
        });
      } else {
        set({ error: response.message || 'Failed to fetch stocks' });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'An error occurred fetching stocks',
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchLowStocks: async (countryId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await stockService.getLowStocksByCountry(countryId);
      if (response.success && response.data) {
        set({
          lowStocks: response.data,
          lastUpdate: new Date().toISOString(),
        });
      } else {
        set({ error: response.message || 'Failed to fetch low stocks' });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'An error occurred fetching low stocks',
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchMovements: async (variantId: string, countryId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await stockService.getStockMovements(variantId, countryId);
      if (response.success && response.data) {
        set({
          movements: response.data,
          lastUpdate: new Date().toISOString(),
        });
      } else {
        set({ error: response.message || 'Failed to fetch movements' });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'An error occurred fetching movements',
      });
    } finally {
      set({ loading: false });
    }
  },

  adjustStock: async (request) => {
    set({ loading: true, error: null });
    try {
      const response = await stockService.adjustStock(request);
      if (response.success) {
        // Refresh stocks after adjustment
        const state = get();
        if (state.countryId) {
          await state.fetchStocks(state.countryId);
        }
      } else {
        set({ error: response.message || 'Failed to adjust stock' });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'An error occurred adjusting stock',
      });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      countryId: null,
      stocks: [],
      lowStocks: [],
      movements: [],
      loading: false,
      error: null,
      lastUpdate: null,
    });
  },
}));
