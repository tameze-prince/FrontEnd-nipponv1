'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { locationService, type Country, type City } from '@/lib';
import { useLocationStore } from '@/stores/useLocationStore';
import { toast } from 'sonner';

/**
 * Composant de sélection initialiale géolocalisation
 * Affiche un modal obligatoire si aucun pays/ville n'est sélectionné
 */
export default function InitialLocationModal() {
  const router = useRouter();
  const { selectedCountry, selectedCity, setCountry, setCity, hasHydrated } = useLocationStore();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountryLocal, setSelectedCountryLocal] = useState<Country | null>(null);
  const [selectedCityLocal, setSelectedCityLocal] = useState<City | null>(null);
  const isOpen = hasHydrated && (!selectedCountry || !selectedCity);

  async function loadCountries() {
    setIsLoading(true);
    try {
      const response = await locationService.getCountries();
      if (response.success && response.data) {
        setCountries(response.data);
      } else {
        toast.error('Erreur lors du chargement des pays');
      }
    } catch (err) {
      console.error('Error loading countries:', err);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    queueMicrotask(() => {
      void loadCountries();
    });
  }, [isOpen]);

  const handleCountrySelect = async (country: Country) => {
    setSelectedCountryLocal(country);
    setSelectedCityLocal(null);
    setCities([]);

    // Charger les villes
    try {
      const response = await locationService.getCities(country.id);
      if (response.success && response.data) {
        setCities(response.data);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
      toast.error('Erreur lors du chargement des villes');
    }
  };

  const handleCitySelect = (city: City) => {
    setSelectedCityLocal(city);
  };

  const handleConfirm = () => {
    if (!selectedCountryLocal || !selectedCityLocal) {
      toast.error('Veuillez sélectionner un pays et une ville');
      return;
    }

    setCountry({
      id: Number(selectedCountryLocal.id),
      name: selectedCountryLocal.name,
      code: selectedCountryLocal.code,
      currency: selectedCountryLocal.currency,
      currencySymbol: selectedCountryLocal.currencySymbol,
    });
    setCity({
      id: Number(selectedCityLocal.id),
      name: selectedCityLocal.name,
      countryId: Number(selectedCityLocal.countryId),
    });

    toast.success('Localisation enregistrée', {
      description: `${selectedCityLocal.name}, ${selectedCountryLocal.name}`,
    });

    // Rediriger vers produits
    router.push('/products');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden border-0 bg-white shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-orange-600" />

        <CardHeader className="space-y-4 pt-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            <Globe className="h-3 w-3" />
            Bienvenue
          </div>

          <CardTitle className="text-4xl font-black text-slate-950">
            Où êtes-vous situé?
          </CardTitle>

          <CardDescription className="text-base text-slate-600">
            Sélectionnez votre pays et votre ville pour découvrir les produits disponibles dans
            votre région avec les prix et devises locales.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pb-8">
          {/* Sélection pays */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Pays</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Chargement des pays...
                </div>
              ) : countries.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Aucun pays disponible
                </div>
              ) : (
                countries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => handleCountrySelect(country)}
                    className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition ${
                      selectedCountryLocal?.id === country.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                    }`}
                  >
                    <div className="font-bold">{country.name}</div>
                    <div className="text-xs text-slate-500">{country.code}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sélection ville */}
          {selectedCountryLocal && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">
                Villes en {selectedCountryLocal.name}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {cities.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    Aucune ville disponible
                  </div>
                ) : (
                  cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className={`rounded-xl border-2 px-4 py-3 text-left font-medium transition ${
                        selectedCityLocal?.id === city.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {city.name}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Infos supplémentaires */}
          {selectedCountryLocal && selectedCityLocal && (
            <div className="space-y-3 rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-sm text-slate-300">
                📍 Vous avez choisi: <span className="font-bold">{selectedCityLocal.name}</span>,{' '}
                <span className="font-bold">{selectedCountryLocal.name}</span>
              </p>
              <p className="text-sm text-slate-300">
                💱 Devise: <span className="font-bold">{selectedCountryLocal.currencySymbol}</span>
              </p>
              <p className="text-xs text-slate-400">
                Vous pouvez changer cela à tout moment depuis le sélecteur de localisation en
                haut du site.
              </p>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!selectedCountryLocal || !selectedCityLocal}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Continuer vers le catalogue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
