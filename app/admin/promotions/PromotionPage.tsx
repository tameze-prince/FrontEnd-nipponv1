'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Edit2, Loader2, Plus, RefreshCw, TicketPercent, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { FlashSaleForm } from '@/components/forms';
import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { productService, promotionService, type FlashSale, type Product } from '@/lib/index';

function getFlashSaleStatus(item: FlashSale) {
  const now = new Date().getTime();
  const startsAt = new Date(item.startsAt).getTime();
  const endsAt = new Date(item.endsAt).getTime();

  if (!item.active || endsAt < now) {
    return { label: 'Terminee', className: 'bg-gray-100 text-gray-700' };
  }
  if (startsAt > now) {
    return { label: 'Programmee', className: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Active', className: 'bg-green-100 text-green-700' };
}

export default function AdminPromotionsPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);

  useEffect(() => {
    void loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError('');

      const [flashSalesResponse, productsResponse] = await Promise.all([
        promotionService.getFlashSales(),
        productService.getProducts({ page: 1, pageSize: 100 }),
      ]);

      if (flashSalesResponse.success && flashSalesResponse.data) {
        setFlashSales(flashSalesResponse.data);
      } else {
        setFlashSales([]);
        setError(flashSalesResponse.error || 'Impossible de charger les flash sales.');
      }

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading flash sales:', err);
      setError('Impossible de charger les flash sales.');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = useMemo(
    () => flashSales.filter((item) => getFlashSaleStatus(item).label === 'Active').length,
    [flashSales]
  );

  const handleOpenCreateForm = () => {
    setEditingFlashSale(null);
    setError('');
    setShowForm(true);
  };

  const handleOpenEditForm = (flashSale: FlashSale) => {
    setEditingFlashSale(flashSale);
    setError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFlashSale(null);
  };

  const handleSubmitFlashSale = async (data: {
    productId: string;
    discountPct: number;
    startsAt: string;
    endsAt: string;
  }) => {
    try {
      setSubmitting(true);
      setError('');

      const response = editingFlashSale
        ? await promotionService.updateFlashSale(editingFlashSale.id, data)
        : await promotionService.createFlashSale(data);

      if (!response.success) {
        setError(
          response.error ||
            (editingFlashSale
              ? 'Impossible de modifier la flash sale.'
              : 'Impossible de creer la flash sale.')
        );
        return;
      }

      toast.success(editingFlashSale ? 'Flash sale mise a jour.' : 'Flash sale creee.');
      handleCloseForm();
      await loadPageData();
    } catch (err) {
      console.error('Flash sale submit error:', err);
      setError(
        editingFlashSale
          ? 'Erreur pendant la modification de la flash sale.'
          : 'Erreur pendant la creation de la flash sale.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    if (!confirm('Desactiver cette flash sale ?')) {
      return;
    }

    const response = await promotionService.deleteFlashSale(id);

    if (!response.success) {
      setError(response.error || 'Impossible de supprimer la flash sale.');
      return;
    }

    toast.success('Flash sale desactivee.');
    await loadPageData();
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Flash sales</h1>
              <p className="mt-1 text-gray-600">Creation et suivi des ventes flash connectes a l&apos;API.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void loadPageData()}
                disabled={loading}
                className="border-orange-200 text-orange-600"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button onClick={handleOpenCreateForm} className="bg-orange-500 text-white hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle flash sale
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border-0 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <TicketPercent className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Total flash sales</p>
                  <p className="text-2xl font-bold text-gray-900">{flashSales.length}</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Actives</p>
                  <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                </div>
              </div>
            </Card>
            <Card className="border-0 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-violet-500" />
                <div>
                  <p className="text-sm text-gray-500">Produits eligibles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-0 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
                <span className="text-gray-600">Chargement des flash sales...</span>
              </div>
            ) : flashSales.length === 0 ? (
              <div className="py-10 text-center text-gray-500">Aucune flash sale pour le moment.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Produit</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Remise</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Periode</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashSales.map((item) => {
                      const status = getFlashSaleStatus(item);

                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-500">Produit #{item.productId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-orange-600">-{item.discountPct}%</td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <div>{new Date(item.startsAt).toLocaleString('fr-FR')}</div>
                            <div>{new Date(item.endsAt).toLocaleString('fr-FR')}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditForm(item)}
                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => void handleDeleteFlashSale(item.id)}
                                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                                title="Desactiver"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {showForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-0 bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingFlashSale ? 'Modifier la flash sale' : 'Nouvelle flash sale'}
                </h2>
                <button onClick={handleCloseForm} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <FlashSaleForm
                  products={products}
                  loading={submitting}
                  error={error}
                  initialData={
                    editingFlashSale
                      ? {
                          productId: editingFlashSale.productId,
                          discountPct: editingFlashSale.discountPct,
                          startsAt: editingFlashSale.startsAt.slice(0, 16),
                          endsAt: editingFlashSale.endsAt.slice(0, 16),
                        }
                      : undefined
                  }
                  submitLabel={editingFlashSale ? 'Mettre a jour la flash sale' : 'Creer la flash sale'}
                  onSubmit={handleSubmitFlashSale}
                />
              </div>
            </Card>
          </div>
        ) : null}
      </AdminLayout>
    </ProtectedRoute>
  );
}
