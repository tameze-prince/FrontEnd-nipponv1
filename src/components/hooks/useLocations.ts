'use client';

import { useEffect, useState } from 'react';
import { locationService, type Country, type City } from '@/lib';

interface UseLocationsReturn {
  countries: Country[];
  cities: City[];
  selectedCountry: Country | null;
  selectedCity: City | null;
  isLoading: boolean;
  error: string | null;
  setSelectedCountry: (country: Country | null) => void;
  setSelectedCity: (city: City | null) => void;
  refreshCountries: () => Promise<void>;
  refreshCities: (countryId: number | string) => Promise<void>;
}

/**
 * Hook pour charger pays et villes depuis l'API
 * Gère caching et fallback sur mocks en cas d'erreur
 */
export function useLocations(): UseLocationsReturn {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les pays au montage
  useEffect(() => {
    loadCountries();
  }, []);

  // Charger les villes quand on sélectionne un pays
  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry.id);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  const loadCountries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await locationService.getCountries();

      if (response.success && response.data && response.data.length > 0) {
        setCountries(response.data);
        setError(null);
      } else {
        // Fallback sur mocks si API échoue
        const mockCountries: Country[] = [
          {
            id: '1',
            name: 'Cameroun',
            code: 'CM',
            currency: 'XAF',
            currencySymbol: 'FCFA',
            exchangeRate: 1,
            isActive: true,
          },
          {
            id: '2',
            name: 'RDC',
            code: 'CD',
            currency: 'USD',
            currencySymbol: '$',
            exchangeRate: 1,
            isActive: true,
          },
          {
            id: '3',
            name: 'Gabon',
            code: 'GA',
            currency: 'XAF',
            currencySymbol: 'FCFA',
            exchangeRate: 1,
            isActive: true,
          },
        ];
        setCountries(mockCountries);
        setError('API indisponible, utilisation des données locales');
      }
    } catch (err) {
      console.error('Error loading countries:', err);
      setError('Impossible de charger les pays');
      // Fallback mocks
      setCountries([
        {
          id: '1',
          name: 'Cameroun',
          code: 'CM',
          currency: 'XAF',
          currencySymbol: 'FCFA',
          exchangeRate: 1,
          isActive: true,
        },
        {
          id: '2',
          name: 'RDC',
          code: 'CD',
          currency: 'USD',
          currencySymbol: '$',
          exchangeRate: 1,
          isActive: true,
        },
        {
          id: '3',
          name: 'Gabon',
          code: 'GA',
          currency: 'XAF',
          currencySymbol: 'FCFA',
          exchangeRate: 1,
          isActive: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async (countryId: number | string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await locationService.getCities(String(countryId));

      if (response.success && response.data && response.data.length > 0) {
        setCities(response.data);
        setError(null);
      } else {
        // Fallback sur mocks
        const mockCities: Record<string, City[]> = {
          '1': [
            { id: '101', name: 'Douala', countryId: '1', code: '', isActive: true },
            { id: '102', name: 'Yaoundé', countryId: '1', code: '', isActive: true },
            { id: '103', name: 'Limbé', countryId: '1', code: '', isActive: true },
            { id: '104', name: 'Bafoussam', countryId: '1', code: '', isActive: true },
          ],
          '2': [
            { id: '201', name: 'Kinshasa', countryId: '2', code: '', isActive: true },
            { id: '202', name: 'Lubumbashi', countryId: '2', code: '', isActive: true },
          ],
          '3': [
            { id: '301', name: 'Libreville', countryId: '3', code: '', isActive: true },
            { id: '302', name: 'Port-Gentil', countryId: '3', code: '', isActive: true },
          ],
        };
        setCities(mockCities[String(countryId)] || []);
        setError('Données locales utilisées');
      }
    } catch (err) {
      console.error('Error loading cities:', err);
      setError('Impossible de charger les villes');
      // Fallback mocks
      const mockCities: Record<string, City[]> = {
        '1': [
          { id: '101', name: 'Douala', countryId: '1', code: '', isActive: true },
          { id: '102', name: 'Yaoundé', countryId: '1', code: '', isActive: true },
          { id: '103', name: 'Limbé', countryId: '1', code: '', isActive: true },
          { id: '104', name: 'Bafoussam', countryId: '1', code: '', isActive: true },
        ],
        '2': [
          { id: '201', name: 'Kinshasa', countryId: '2', code: '', isActive: true },
          { id: '202', name: 'Lubumbashi', countryId: '2', code: '', isActive: true },
        ],
        '3': [
          { id: '301', name: 'Libreville', countryId: '3', code: '', isActive: true },
          { id: '302', name: 'Port-Gentil', countryId: '3', code: '', isActive: true },
        ],
      };
      setCities(mockCities[String(countryId)] || []);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCountries = async () => {
    await loadCountries();
  };

  const refreshCities = async (countryId: number | string) => {
    await loadCities(countryId);
  };

  return {
    countries,
    cities,
    selectedCountry,
    selectedCity,
    isLoading,
    error,
    setSelectedCountry,
    setSelectedCity,
    refreshCountries,
    refreshCities,
  };
}
