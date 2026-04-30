'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Loader, Plus, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { CategoryForm } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { categoryService } from '@/lib/index';

interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  icon?: string;
  slug?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();

      if (response.success && response.data) {
        setCategories(response.data.data as Category[]);
      } else {
        setCategories([]);
        setError(response.error || 'Impossible de charger les categories.');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
      setError('Impossible de charger les categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenForm = (category?: Category) => {
    setError('');
    setEditingCategory(category || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleFormSubmit = async (formData: { name: string; slug: string; image?: File }) => {
    try {
      setSubmitting(true);
      setError('');

      const response = editingCategory
        ? await categoryService.updateCategory(editingCategory.id, formData)
        : await categoryService.createCategory(formData);

      if (!response.success) {
        setError(response.error || 'Operation echouee.');
        return;
      }

      handleCloseForm();
      await loadCategories();
    } catch (err) {
      console.error('Category submit error:', err);
      setError('Une erreur est survenue pendant la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Voulez-vous vraiment desactiver cette categorie ?')) {
      return;
    }

    try {
      const response = await categoryService.deleteCategory(categoryId);

      if (response.success) {
        await loadCategories();
      } else {
        setError(response.error || 'Impossible de supprimer la categorie.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur pendant la suppression de la categorie.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Categories</h1>
            <p className="mt-1 text-gray-600">Gerez les categories de produits</p>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
            Nouvelle categorie
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <Loader className="mx-auto h-6 w-6 animate-spin text-orange-500" />
            <p className="mt-2 text-gray-600">Chargement des categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Card
                  key={category.id}
                  className="border-0 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="text-4xl">{category.icon || 'C'}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(category)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{category.slug || 'Slug non renseigne'}</p>
                  {category.productCount !== undefined && (
                    <p className="mt-3 text-sm font-medium text-orange-600">{category.productCount} produits</p>
                  )}
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-lg text-gray-500">Aucune categorie. Creez-en une pour commencer.</p>
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
                {editingCategory ? 'Modifier la categorie' : 'Nouvelle categorie'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <CategoryForm
                categories={categories.filter((category) => category.id !== editingCategory?.id)}
                initialData={editingCategory || undefined}
                isEdit={Boolean(editingCategory)}
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
