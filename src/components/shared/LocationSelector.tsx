'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Globe, MapPin, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocationStore } from '@/stores/useLocationStore';
import type { City, Country } from '@/types/location';

const countries: Country[] = [
  { id: 1, name: 'Cameroun', code: 'CM', currency: 'FCFA', currencySymbol: 'FCFA' },
  { id: 2, name: 'RDC', code: 'CD', currency: 'USD', currencySymbol: '$' },
  { id: 3, name: 'Gabon', code: 'GA', currency: 'FCFA', currencySymbol: 'FCFA' },
];

const citiesByCountry: Record<number, City[]> = {
  1: [
    { id: 101, name: 'Douala', countryId: 1 },
    { id: 102, name: 'Yaounde', countryId: 1 },
    { id: 103, name: 'Limbe', countryId: 1 },
    { id: 104, name: 'Bafoussam', countryId: 1 },
  ],
  2: [
    { id: 201, name: 'Kinshasa', countryId: 2 },
    { id: 202, name: 'Lubumbashi', countryId: 2 },
  ],
  3: [
    { id: 301, name: 'Libreville', countryId: 3 },
    { id: 302, name: 'Port-Gentil', countryId: 3 },
  ],
};

export default function LocationSelector() {
  const {
    selectedCountry,
    selectedCity,
    hasHydrated,
    setCountry,
    setCity,
  } = useLocationStore();

  const [showModal, setShowModal] = useState(false);

  const needsLocation = hasHydrated && (!selectedCountry || !selectedCity);
  const availableCities = selectedCountry ? citiesByCountry[selectedCountry.id] ?? [] : [];
  const modalOpen = needsLocation || showModal;

  const highlightedCities = useMemo(() => {
    if (!selectedCountry) return [];
    return (citiesByCountry[selectedCountry.id] ?? []).slice(0, 3);
  }, [selectedCountry]);

  const handleCountryChange = (value: string) => {
    const nextCountry = countries.find((country) => country.id === Number(value));
    if (!nextCountry) return;

    setCountry(nextCountry);
  };

  const handleCityChange = (value: string) => {
    const nextCity = availableCities.find((city) => city.id === Number(value));
    if (!nextCity) return;

    setCity(nextCity);
  };

  const handleValidate = () => {
    if (!selectedCountry || !selectedCity) return;

    setShowModal(false);
    toast.success('Localisation enregistree', {
      description: `${selectedCity.name}, ${selectedCountry.name} - devise ${selectedCountry.currencySymbol}`,
    });
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        variant={selectedCountry && selectedCity ? 'outline' : 'default'}
        className={
          selectedCountry && selectedCity
            ? 'rounded-full border-orange-200 bg-orange-50 text-slate-700 hover:bg-orange-100'
            : 'rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95'
        }
      >
        {selectedCountry && selectedCity ? (
          <>
            <MapPin className="mr-2 h-4 w-4 text-orange-500" />
            {selectedCity.name}, {selectedCountry.name}
          </>
        ) : (
          <>
            <Globe className="mr-2 h-4 w-4" />
            Choisir ma ville
          </>
        )}
      </Button>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <Card className="relative w-full max-w-xl overflow-hidden border-0 bg-white shadow-2xl shadow-slate-950/20">
            {selectedCountry && selectedCity && !needsLocation ? (
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
                aria-label="Fermer la fenetre de localisation"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <div className="h-2 w-full bg-[linear-gradient(90deg,#ff8c42,#ffd2b0,#ff8c42)]" />

            <CardHeader className="space-y-3 pt-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-orange-700 uppercase">
                <Globe className="h-3.5 w-3.5" />
                Localisation
              </div>

              <CardTitle className="text-3xl font-black tracking-tight text-slate-950">
                Choisissez votre pays et votre ville
              </CardTitle>

              <CardDescription className="max-w-lg text-sm leading-6 text-slate-600">
                On s&apos;en sert pour afficher les bons produits, la bonne devise et le stock
                disponible pres de chez vous.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Pays</label>
                  <Select
                    value={selectedCountry ? String(selectedCountry.id) : ''}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Selectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ville</label>
                  <Select
                    value={selectedCity ? String(selectedCity.id) : ''}
                    onValueChange={handleCityChange}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Selectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city.id} value={String(city.id)}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {highlightedCities.length > 0 ? (
                <div className="space-y-3 rounded-3xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-xs font-semibold tracking-[0.2em] text-orange-700 uppercase">
                    Villes populaires
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {highlightedCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => setCity(city)}
                        className="rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 rounded-3xl bg-slate-950 p-4 text-white md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Produits</p>
                  <p className="mt-2 text-sm text-slate-300">Catalogue adapte a votre zone.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Prix</p>
                  <p className="mt-2 text-sm text-slate-300">Devise locale visible des le depart.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Stock</p>
                  <p className="mt-2 text-sm text-slate-300">Disponibilite plus credible par ville.</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleValidate}
                disabled={!selectedCountry || !selectedCity}
                className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-base font-semibold text-white shadow-lg shadow-orange-200 hover:opacity-95"
              >
                Valider ma localisation
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
