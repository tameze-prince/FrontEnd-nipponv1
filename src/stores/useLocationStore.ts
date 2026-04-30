// store/useLocationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Country, City } from '@/types/location';

interface LocationState {
  selectedCountry: Country | null;
  selectedCity: City | null;
  hasHydrated: boolean;

  setCountry: (country: Country) => void;
  setCity: (city: City) => void;
  clearLocation: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCountry: null,
      selectedCity: null,
      hasHydrated: false,

      setCountry: (country) => set({ selectedCountry: country, selectedCity: null }),
      setCity: (city) => set({ selectedCity: city }),
      clearLocation: () => set({ selectedCountry: null, selectedCity: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nipponhub-location-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
