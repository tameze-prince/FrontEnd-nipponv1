'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { locationService } from '@/lib/location-service';
import { stockService } from '@/lib/stock-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';

interface StockItem {
  id: string;
  variantId?: string;
  productName: string;
  variantLabel: string;
  countryName: string;
  quantity: number;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  variantLabel: string;
  productName: string;
  quantity: number;
  movementType: string;
  reason?: string;
  createdAt: string;
}

export default function AdminStockPage() {
  const { user } = useAuthStore();
  const { selectedCountry, selectedCity } = useLocationStore();
  const [stocksList, setStocksList] = useState<StockItem[]>([]);
  const [movementsList, setMovementsList] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const isOwner = user?.role === 'owner';
  const ownerCityMismatch =
    isOwner &&
    user?.cityId &&
    selectedCity?.id &&
    user.cityId !== String(selectedCity.id);

  useEffect(() => {
    const loadCountries = async () => {
      const response = await locationService.getCountries();

      if (response.success && response.data) {
        setCountries(response.data.map((country) => ({ id: String(country.id), name: country.name })));
      } else {
        setCountries([]);
        toast.error(response.error || 'Impossible de charger les pays');
      }

      if (selectedCountry?.id) {
        setSelectedCountryId(selectedCountry.id.toString());
      }
    };

    void loadCountries();
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountryId) {
      setStocksList([]);
      setMovementsList([]);
      setIsLoading(false);
      return;
    }

    const loadStocks = async () => {
      if (ownerCityMismatch) {
        setStocksList([]);
        setMovementsList([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await stockService.getStocksByCountry(selectedCountryId, selectedCity?.id?.toString());

        if (response.success && response.data) {
          setStocksList(response.data as StockItem[]);
        } else {
          setError(response.error || 'Impossible de charger le stock');
          setStocksList([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        toast.error(`Erreur lors du chargement du stock: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStocks();
  }, [ownerCityMismatch, selectedCountryId]);

  useEffect(() => {
    if (stocksList.length === 0 || !selectedCountryId) {
      setMovementsList([]);
      return;
    }

    const loadMovements = async () => {
      const firstStock = stocksList[0];

      if (!firstStock) {
        return;
      }

      const response = await stockService.getStockMovements(
        firstStock.variantId || firstStock.id.split('-')[0],
        selectedCountryId,
        selectedCity?.id?.toString()
      );

      if (response.success && response.data) {
        setMovementsList(response.data as StockMovement[]);
      } else {
        setMovementsList([]);
      }
    };

    void loadMovements();
  }, [selectedCity?.id, selectedCountryId, stocksList]);

  const handleRefresh = async () => {
    if (!selectedCountryId) return;

    setIsLoading(true);
    const response = await stockService.getStocksByCountry(selectedCountryId, selectedCity?.id?.toString());

    if (response.success && response.data) {
      setStocksList(response.data as StockItem[]);
      toast.success('Stock mis a jour');
    } else {
      toast.error(response.error || 'Erreur lors de la mise a jour');
    }

    setIsLoading(false);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Rupture', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
    if (quantity < 5) {
      return { label: `${quantity} unite(s)`, color: 'bg-amber-100 text-amber-800', icon: AlertCircle };
    }
    return { label: `${quantity} unites`, color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: 'Reapprovisionnement',
      OUT: 'Vente',
      ADJUSTMENT: 'Correction',
      RETURN: 'Retour client',
      DAMAGE: 'Endommage',
      LOSS: 'Perdu',
    };
    return labels[type] || type;
  };

  const getMovementColor = (type: string) => {
    const colors: Record<string, string> = {
      IN: 'bg-green-100 text-green-800',
      OUT: 'bg-red-100 text-red-800',
      ADJUSTMENT: 'bg-blue-100 text-blue-800',
      RETURN: 'bg-purple-100 text-purple-800',
      DAMAGE: 'bg-orange-100 text-orange-800',
      LOSS: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion Stock</h1>
            <p className="mt-1 text-gray-600">Gerez le stock en temps reel depuis l&apos;API</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              {isOwner && user?.city ? (
                <div className={`mb-4 rounded-lg border p-4 text-sm ${ownerCityMismatch ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
                  {ownerCityMismatch
                    ? `Le owner est rattache a ${user.city}. Choisissez cette ville pour consulter le stock.`
                    : `Ville owner: ${user.city}${selectedCity ? ` • ville active: ${selectedCity.name}` : ''}`}
                </div>
              ) : null}
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Selectionner un pays
              </label>
              <select
                value={selectedCountryId}
                onChange={(event) => setSelectedCountryId(event.target.value)}
                disabled={isOwner}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">-- Selectionner un pays --</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {error ? (
          <Card className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        ) : null}

        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Stock actuel</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
              <span className="text-gray-600">Chargement du stock...</span>
            </div>
          ) : stocksList.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Aucun stock disponible pour ce pays.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Produit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Variante</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Pays</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Quantite</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Mis a jour</th>
                  </tr>
                </thead>
                <tbody>
                  {stocksList.map((item) => {
                    const status = getStockStatus(item.quantity);
                    const StatusIcon = status.icon;

                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-gray-900">{item.productName}</td>
                        <td className="px-4 py-4 text-gray-700">{item.variantLabel}</td>
                        <td className="px-4 py-4 text-gray-700">{item.countryName}</td>
                        <td className="px-4 py-4">
                          <span className={`flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Historique des mouvements</h2>

          {movementsList.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Aucun mouvement pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Produit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Variante</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Quantite</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Raison</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-gray-900">{item.productName}</td>
                      <td className="px-4 py-4 text-gray-700">{item.variantLabel}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getMovementColor(item.movementType)}`}>
                          {getMovementTypeLabel(item.movementType)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <span className={item.quantity > 0 ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                          {item.quantity > 0 ? '+' : ''}
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{item.reason || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
