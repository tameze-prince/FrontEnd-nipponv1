'use client';

import React, { useEffect, useState } from 'react';
import { Edit2, Image as ImageIcon, Loader, Plus, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { FranchiseForm } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { franchiseService } from '@/lib/index';

interface Franchise {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  logo?: string;
  logoUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  productsCount?: number;
}

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFranchises();
  }, []);

  const loadFranchises = async () => {
    try {
      setLoading(true);
      const response = await franchiseService.getFranchises();

      if (response.success && response.data) {
        setFranchises(response.data.data as Franchise[]);
      } else {
        setFranchises([]);
        setError(response.error || 'Impossible de charger les franchises.');
      }
    } catch (err) {
      console.error('Error loading franchises:', err);
      setFranchises([]);
      setError('Impossible de charger les franchises.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (franchise?: Franchise) => {
    setError('');
    setEditingFranchise(franchise || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFranchise(null);
  };

  const handleFormSubmit = async (formData: { name: string; slug: string; logo?: File }) => {
    try {
      setSubmitting(true);
      setError('');

      const response = editingFranchise
        ? await franchiseService.updateFranchise(editingFranchise.id, formData)
        : await franchiseService.createFranchise(formData);

      if (!response.success) {
        setError(response.error || 'Operation echouee.');
        return;
      }

      handleCloseForm();
      await loadFranchises();
    } catch (err) {
      console.error('Form submit error:', err);
      setError('Une erreur est survenue pendant la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFranchise = async (franchiseId: string) => {
    if (!confirm('Voulez-vous vraiment desactiver cette franchise ?')) {
      return;
    }

    try {
      const response = await franchiseService.deleteFranchise(franchiseId);

      if (response.success) {
        await loadFranchises();
      } else {
        setError(response.error || 'Impossible de supprimer la franchise.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur pendant la suppression de la franchise.');
    }
  };

  const totalProducts = franchises.reduce((accumulator, franchise) => accumulator + (franchise.productsCount || 0), 0);
  const activeFranchises = franchises.filter((franchise) => franchise.isActive).length;
  const mostPopular =
    franchises.length > 0
      ? franchises.reduce((previous, current) =>
          (previous.productsCount || 0) > (current.productsCount || 0) ? previous : current
        )
      : null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Franchises</h1>
            <p className="mt-1 text-gray-600">Gerez les franchises et univers de produits</p>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
            Nouvelle franchise
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="border-0 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Total franchises</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{franchises.length}</p>
            <p className="mt-2 text-xs text-green-600">{activeFranchises} actives</p>
          </Card>
          <Card className="border-0 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Total produits</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalProducts}</p>
          </Card>
          <Card className="border-0 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Franchise populaire</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{mostPopular?.name || 'N/A'}</p>
            <p className="mt-2 text-xs text-orange-600">{mostPopular?.productsCount || 0} produits</p>
          </Card>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader className="mx-auto h-6 w-6 animate-spin text-orange-500" />
            <p className="mt-2 text-gray-600">Chargement des franchises...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {franchises.length > 0 ? (
              franchises.map((franchise) => (
                <Card
                  key={franchise.id}
                  className="border-0 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                      {franchise.imageUrl || franchise.logoUrl || franchise.logo ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={franchise.imageUrl || franchise.logoUrl || franchise.logo}
                            alt={franchise.name}
                            className="h-full w-full object-cover"
                          />
                        </>
                      ) : (
                        <span className="text-3xl">{franchise.icon || 'F'}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenForm(franchise)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFranchise(franchise.id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{franchise.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {franchise.slug || 'Slug non renseigne'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-orange-600">{franchise.productsCount || 0}</span> produits
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        franchise.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {franchise.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg text-gray-500">Aucune franchise configuree</p>
                <p className="mt-1 text-sm text-gray-400">Ajoutez une franchise pour commencer</p>
              </div>
            )}

            <Card className="flex min-h-64 cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 shadow-sm transition hover:border-orange-500">
              <button onClick={() => handleOpenForm()} className="text-center">
                <Plus className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                <p className="font-medium text-gray-600">Ajouter une franchise</p>
              </button>
            </Card>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-0 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingFranchise ? 'Modifier la franchise' : 'Nouvelle franchise'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <FranchiseForm
                initialData={
                  editingFranchise
                    ? {
                        name: editingFranchise.name,
                        slug: editingFranchise.slug || '',
                      }
                    : undefined
                }
                isEdit={Boolean(editingFranchise)}
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
