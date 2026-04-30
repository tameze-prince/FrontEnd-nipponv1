'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Globe, Loader, Plus, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { LocationForm } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { locationService } from '@/lib/index';

interface City {
  id: string;
  name: string;
  countryId: string;
  taxRate: number;
  shippingCost: number;
  isActive?: boolean;
}

interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  isActive: boolean;
  cities?: City[];
}

export default function AdminLocationPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Country | City | null>(null);
  const [formType, setFormType] = useState<'country' | 'city'>('country');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getCountries();

      if (response.success && response.data) {
        const countriesWithCities = await Promise.all(
          response.data.map(async (country) => {
            const citiesResponse = await locationService.getCities(country.id);
            const cities =
              citiesResponse.success && citiesResponse.data
                ? citiesResponse.data.map((city) => ({
                    id: city.id,
                    name: city.name,
                    countryId: city.countryId,
                    taxRate: 0,
                    shippingCost: 0,
                    isActive: city.isActive,
                  }))
                : [];

            return {
              ...country,
              cities,
            };
          })
        );

        setCountries(countriesWithCities);
      } else {
        setCountries([]);
        setError(response.error || 'Impossible de charger les localisations.');
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      setCountries([]);
      setError('Impossible de charger les localisations.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (
    type: 'country' | 'city',
    location?: Country | City,
    countryId?: string
  ) => {
    setError('');
    setFormType(type);
    setEditingLocation(location || null);
    setSelectedCountryId(countryId || ('countryId' in (location || {}) ? (location as City).countryId : ''));
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setSelectedCountryId('');
  };

  const handleFormSubmit = async (formData: {
    name: string;
    country: string;
    city: string;
    isActive: boolean;
  }) => {
    try {
      setSubmitting(true);
      setError('');

      const response =
        formType === 'country'
          ? editingLocation
            ? await locationService.updateCountry(editingLocation.id, {
                isActive: formData.isActive,
              })
            : await locationService.createCountry({
                name: formData.name.trim(),
                code: formData.country.trim().toUpperCase(),
                currency: 'XAF',
                isActive: formData.isActive,
              })
          : editingLocation && 'countryId' in editingLocation
            ? await locationService.updateCity(editingLocation.countryId, editingLocation.id, {
                isActive: formData.isActive,
              })
            : await locationService.createCity(formData.country, {
                name: formData.city.trim(),
                countryId: formData.country,
                isActive: formData.isActive,
              });

      if (!response.success) {
        setError(response.error || 'Operation echouee.');
        return;
      }

      handleCloseForm();
      await loadLocations();
    } catch (err) {
      console.error('Form submit error:', err);
      setError('Une erreur est survenue pendant la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCountry = async (countryId: string) => {
    if (!confirm('Voulez-vous vraiment desactiver ce pays ?')) {
      return;
    }

    try {
      const response = await locationService.deleteCountry(countryId);

      if (response.success) {
        await loadLocations();
      } else {
        setError(response.error || 'Impossible de supprimer le pays.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur pendant la suppression du pays.');
    }
  };

  const handleDeleteCity = async (countryId: string, cityId: string) => {
    if (!confirm('Voulez-vous vraiment desactiver cette ville ?')) {
      return;
    }

    try {
      const response = await locationService.deleteCity(countryId, cityId);

      if (response.success) {
        await loadLocations();
      } else {
        setError(response.error || 'Impossible de supprimer la ville.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur pendant la suppression de la ville.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Localisation</h1>
            <p className="mt-1 text-gray-600">Gerez les pays et les villes</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenForm('country')}
              className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
              Nouveau pays
            </Button>
            <Button
              onClick={() => handleOpenForm('city')}
              variant="outline"
              className="flex items-center gap-2 border-orange-500 text-orange-500"
            >
              <Plus className="h-5 w-5" />
              Nouvelle ville
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <Loader className="mx-auto h-6 w-6 animate-spin text-orange-500" />
            <p className="mt-2 text-gray-600">Chargement des localisations...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {countries.length > 0 ? (
              countries.map((country) => (
                <Card key={country.id} className="border-0 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <Globe className="h-6 w-6 text-orange-500" />
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {country.name} ({country.code})
                        </h3>
                        <p className="text-sm text-gray-600">
                          {country.currencySymbol} • {country.cities?.length || 0} villes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenForm('country', country)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCountry(country.id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {country.cities && country.cities.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Villes</h4>
                        <Button
                          onClick={() => handleOpenForm('city', undefined, country.id)}
                          size="sm"
                          variant="outline"
                          className="border-orange-500 text-orange-500"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter une ville
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {country.cities.map((city) => (
                          <div
                            key={city.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{city.name}</p>
                              <p className="text-sm text-gray-600">
                                Statut: {city.isActive === false ? 'Inactive' : 'Active'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenForm('city', city)}
                                className="rounded p-1 text-blue-600 hover:bg-blue-100"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCity(country.id, city.id)}
                                className="rounded p-1 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <div className="py-12 text-center">
                <Globe className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg text-gray-500">Aucune localisation configuree</p>
                <p className="mt-1 text-sm text-gray-400">Ajoutez un pays puis ses villes</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-0 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingLocation
                  ? `Modifier ${formType === 'country' ? 'le pays' : 'la ville'}`
                  : `Nouveau ${formType === 'country' ? 'pays' : 'ville'}`}
              </h2>
              <button
                onClick={handleCloseForm}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <LocationForm
                countries={countries.map((country) => ({
                  id: country.id,
                  name: country.name,
                  code: country.code,
                }))}
                initialData={
                  editingLocation
                    ? formType === 'country'
                      ? {
                          name: editingLocation.name,
                          country: 'code' in editingLocation ? editingLocation.code : '',
                          isActive: 'isActive' in editingLocation ? editingLocation.isActive : true,
                        }
                      : {
                          name: editingLocation.name,
                          city: editingLocation.name,
                          country: 'countryId' in editingLocation ? editingLocation.countryId : selectedCountryId,
                          isActive: 'isActive' in editingLocation ? editingLocation.isActive ?? true : true,
                        }
                    : formType === 'city' && selectedCountryId
                      ? {
                          country: selectedCountryId,
                          isActive: true,
                        }
                      : undefined
                }
                isEdit={Boolean(editingLocation)}
                isCountry={formType === 'country'}
                loading={submitting}
                error={error}
                onSubmit={handleFormSubmit}
              />
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
