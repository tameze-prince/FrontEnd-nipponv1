'use client';

import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationFormData {
  name: string;
  country: string;
  city: string;
  isActive: boolean;
}

interface LocationFormProps {
  onSubmit: (data: LocationFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<LocationFormData>;
  isEdit?: boolean;
  isCountry?: boolean;
  countries?: Array<{ id: string; name: string; code: string }>;
}

export default function LocationForm({
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
  isCountry = false,
  countries = [],
}: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (isCountry) {
      if (!formData.name.trim()) {
        nextErrors.name = 'Le nom du pays est requis.';
      }

      if (!formData.country.trim()) {
        nextErrors.country = 'Le code pays est requis.';
      }
    } else {
      if (!formData.country.trim()) {
        nextErrors.country = 'Le pays est requis.';
      }

      if (!formData.city.trim()) {
        nextErrors.city = 'Le nom de la ville est requis.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.currentTarget;
    const nextValue =
      type === 'checkbox'
        ? String((event.currentTarget as HTMLInputElement).checked)
        : name === 'country' && isCountry
          ? value.toUpperCase()
          : value;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? (event.currentTarget as HTMLInputElement).checked
          : nextValue,
    }));

    if (errors[name]) {
      setErrors((previous) => {
        const updated = { ...previous };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {isCountry ? (
        <>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              Nom du pays *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isEdit}
              placeholder="Ex: Cameroun"
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isEdit ? 'cursor-not-allowed bg-gray-100' : ''
              } ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="country" className="mb-2 block text-sm font-medium text-gray-700">
              Code pays *
            </label>
            <input
              id="country"
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isEdit}
              placeholder="Ex: CM"
              maxLength={3}
              className={`w-full rounded-lg border px-4 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isEdit ? 'cursor-not-allowed bg-gray-100' : ''
              } ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                Avec l'API actuelle, seul le statut peut etre modifie apres creation.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="country" className="mb-2 block text-sm font-medium text-gray-700">
              Pays *
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isEdit}
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isEdit ? 'cursor-not-allowed bg-gray-100' : ''
              } ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Selectionner un pays</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country}</p>}
          </div>

          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
              Nom de la ville *
            </label>
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isEdit}
              placeholder="Ex: Douala"
              className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                isEdit ? 'cursor-not-allowed bg-gray-100' : ''
              } ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                Avec l'API actuelle, seul le statut peut etre modifie apres creation.
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded text-orange-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Activer immediatement
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 font-medium text-white hover:bg-orange-600"
      >
        {loading && <Loader size={20} className="animate-spin" />}
        {loading ? 'Enregistrement...' : isEdit ? 'Mettre a jour' : 'Creer'}
      </Button>
    </form>
  );
}
