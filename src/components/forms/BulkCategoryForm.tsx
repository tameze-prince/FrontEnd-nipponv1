'use client';

import React, { useState } from 'react';
import { Loader, Plus, X, Copy } from 'lucide-react';
import { validateRequired, validateMinLength } from '@/lib/form-validation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CategoryData {
  name: string;
  description: string;
  image?: File;
  imagePreview?: string;
}

interface BulkCategoryFormProps {
  onSubmit: (categories: CategoryData[]) => Promise<void>;
  loading?: boolean;
  error?: string;
  isEdit?: boolean;
  mode?: 'single' | 'bulk';
}

/**
 * BulkCategoryForm - Create one or multiple categories
 */
export default function BulkCategoryForm({
  onSubmit,
  loading = false,
  error,
  isEdit = false,
  mode = 'single',
}: BulkCategoryFormProps) {
  const defaultCategory: CategoryData = {
    name: '',
    description: '',
  };

  const [categories, setCategories] = useState<CategoryData[]>([defaultCategory]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [showBulkMode, setShowBulkMode] = useState(mode === 'bulk');

  const currentCategory = categories[currentCategoryIndex];

  // Validate single category
  const validateCategory = (category: CategoryData, index: number): boolean => {
    const categoryErrors: Record<string, string> = {};

    if (!validateRequired(category.name)) {
      categoryErrors.name = 'Category name is required';
    }

    if (!validateRequired(category.description)) {
      categoryErrors.description = 'Description is required';
    } else if (!validateMinLength(category.description, 10)) {
      categoryErrors.description = 'Description must be at least 10 characters';
    }

    if (!isEdit && !category.image && index === 0) {
      categoryErrors.image = 'At least one image is required for the first category';
    }

    const newErrors = { ...errors };
    if (Object.keys(categoryErrors).length > 0) {
      newErrors[index] = categoryErrors;
    } else {
      delete newErrors[index];
    }
    setErrors(newErrors);

    return Object.keys(categoryErrors).length === 0;
  };

  // Validate all categories
  const validateAllCategories = (): boolean => {
    let isValid = true;
    categories.forEach((category, index) => {
      if (!validateCategory(category, index)) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleChangeCategory = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    const updatedCategories = [...categories];
    updatedCategories[currentCategoryIndex] = {
      ...updatedCategories[currentCategoryIndex],
      [name]: value,
    };
    setCategories(updatedCategories);

    // Clear error for this field
    if (errors[currentCategoryIndex]?.[name]) {
      const categoryErrors = { ...errors[currentCategoryIndex] };
      delete categoryErrors[name];
      setErrors({
        ...errors,
        [currentCategoryIndex]: categoryErrors,
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files?.[0]) {
      const file = e.currentTarget.files[0];
      const updatedCategories = [...categories];
      updatedCategories[currentCategoryIndex] = {
        ...updatedCategories[currentCategoryIndex],
        image: file,
        imagePreview: URL.createObjectURL(file),
      };
      setCategories(updatedCategories);
    }
  };

  const removeImage = () => {
    const updatedCategories = [...categories];
    updatedCategories[currentCategoryIndex] = {
      ...updatedCategories[currentCategoryIndex],
      image: undefined,
      imagePreview: undefined,
    };
    setCategories(updatedCategories);
  };

  // Add new category
  const addCategory = () => {
    setCategories([...categories, defaultCategory]);
  };

  // Remove category
  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
      if (currentCategoryIndex >= categories.length - 1) {
        setCurrentCategoryIndex(currentCategoryIndex - 1);
      }
    }
  };

  // Copy category
  const copyCategory = (index: number) => {
    const categoryToCopy = categories[index];
    setCategories([
      ...categories,
      {
        ...categoryToCopy,
        name: categoryToCopy.name + ' (Copy)',
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllCategories()) {
      return;
    }

    try {
      await onSubmit(categories);
    } catch (error) {
      console.error('Error submitting categories:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Mode Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Mode de création</h3>
            <p className="text-sm text-gray-600 mt-1">
              {showBulkMode
                ? 'Création de plusieurs catégories'
                : 'Création d\'une catégorie unique'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!showBulkMode ? 'default' : 'outline'}
              onClick={() => {
                if (showBulkMode && categories.length > 1) {
                  setCategories([categories[0]]);
                }
                setShowBulkMode(false);
              }}
              className="px-4"
            >
              Une catégorie
            </Button>
            <Button
              type="button"
              variant={showBulkMode ? 'default' : 'outline'}
              onClick={() => setShowBulkMode(true)}
              className="px-4"
            >
              Plusieurs catégories
            </Button>
          </div>
        </div>
      </Card>

      {/* Category Tabs (if bulk mode) */}
      {showBulkMode && categories.length > 1 && (
        <Card className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentCategoryIndex(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  currentCategoryIndex === index
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Catégorie {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-2 whitespace-nowrap transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </Card>
      )}

      {/* Category Form */}
      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {categories.length > 1
                ? `Catégorie ${currentCategoryIndex + 1} de ${categories.length}`
                : 'Détails de la catégorie'}
            </h2>
            {categories.length > 1 && (
              <p className="text-sm text-gray-600 mt-1">
                {currentCategory.name || 'Nouvelle catégorie'}
              </p>
            )}
          </div>

          {showBulkMode && categories.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyCategory(currentCategoryIndex)}
                title="Copier cette catégorie"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => removeCategory(currentCategoryIndex)}
                title="Supprimer cette catégorie"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la catégorie *
          </label>
          <input
            type="text"
            name="name"
            value={currentCategory.name}
            onChange={handleChangeCategory}
            placeholder="Ex: Manga, Anime, Technologie..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors[currentCategoryIndex]?.name ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors[currentCategoryIndex]?.name && (
            <p className="text-red-500 text-sm mt-1">{errors[currentCategoryIndex].name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={currentCategory.description}
            onChange={handleChangeCategory}
            placeholder="Décrivez cette catégorie..."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
              errors[currentCategoryIndex]?.description ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors[currentCategoryIndex]?.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors[currentCategoryIndex].description}
            </p>
          )}
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image {!isEdit && currentCategoryIndex === 0 && '*'}
          </label>
          {currentCategory.imagePreview ? (
            <div className="relative inline-block">
              <img
                src={currentCategory.imagePreview}
                alt="Category"
                className="h-40 w-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id={`image-${currentCategoryIndex}`}
              />
              <label htmlFor={`image-${currentCategoryIndex}`} className="cursor-pointer">
                <p className="text-gray-600">Cliquez ou glissez une image</p>
              </label>
            </div>
          )}
          {errors[currentCategoryIndex]?.image && (
            <p className="text-red-500 text-sm mt-2">{errors[currentCategoryIndex].image}</p>
          )}
        </div>
      </Card>

      {/* Summary */}
      {showBulkMode && categories.length > 1 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{categories.length} catégories</span> prêtes à être
            créées. Assurez-vous que tous les champs requis sont remplis.
          </p>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" className="px-6">
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="px-6 bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit
            ? 'Mettre à jour'
            : `Créer ${categories.length > 1 ? categories.length + ' catégories' : 'catégorie'}`}
        </Button>
      </div>
    </form>
  );
}
