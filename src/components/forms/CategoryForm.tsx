'use client';

import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategoryFormData {
  name: string;
  slug: string;
  image?: File;
}

interface CategoryFormProps {
  categories?: Array<{ id: string; name: string }>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<CategoryFormData>;
  isEdit?: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoryForm({
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || (initialData?.name ? slugify(initialData.name) : ''),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Le nom de la categorie est requis.';
    }

    if (!isEdit && !formData.slug.trim()) {
      nextErrors.slug = 'Le slug est requis.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'name' && !isEdit ? { slug: slugify(value) } : {}),
    }));

    if (errors[name]) {
      setErrors((previous) => {
        const updated = { ...previous };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));

    const reader = new FileReader();
    reader.onload = (loadEvent) => setPreviewImage(loadEvent.target?.result as string);
    reader.readAsDataURL(file);
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

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
          Nom de la categorie *
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Figurines"
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700">
          Slug *
        </label>
        <input
          id="slug"
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          disabled={isEdit}
          placeholder="figurines"
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            isEdit ? 'cursor-not-allowed bg-gray-100' : ''
          } ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
        <p className="mt-1 text-xs text-gray-500">
          {isEdit
            ? "Le backend ne permet pas de modifier le slug apres creation."
            : 'Le slug est genere automatiquement a partir du nom.'}
        </p>
      </div>

      <div>
        <label htmlFor="image" className="mb-2 block text-sm font-medium text-gray-700">
          Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
        />

        {previewImage && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Preview" className="h-32 w-32 rounded object-cover" />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 font-medium text-white hover:bg-orange-600"
      >
        {loading && <Loader size={20} className="animate-spin" />}
        {loading ? 'Enregistrement...' : isEdit ? 'Mettre a jour la categorie' : 'Creer la categorie'}
      </Button>
    </form>
  );
}
