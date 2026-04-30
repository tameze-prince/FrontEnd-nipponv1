'use client';

import { useEffect, useState } from 'react';

import { locationService } from '@/lib/location-service';
import { useStockStore } from '@/stores/stock-store';
import StockAdjustmentForm from './StockAdjustmentForm';
import StockMovementHistory from './StockMovementHistory';

export default function StockManagement() {
  const { stocks, lowStocks, loading, error, fetchStocks, fetchLowStocks, clearError } = useStockStore();
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'adjust' | 'history'>('all');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      const response = await locationService.getCountries();

      if (response.success && response.data) {
        const items = response.data.map((country) => ({ id: String(country.id), name: country.name }));
        setCountries(items);

        if (items[0] && !selectedCountryId) {
          setSelectedCountryId(items[0].id);
        }
      }
    };

    void loadCountries();
  }, [selectedCountryId]);

  useEffect(() => {
    if (selectedCountryId) {
      void fetchStocks(selectedCountryId);
      void fetchLowStocks(selectedCountryId);
    }
  }, [fetchLowStocks, fetchStocks, selectedCountryId]);

  const inStockCount = stocks.filter((stock) => stock.quantity > 5).length;
  const lowStockCount = lowStocks.length;
  const outOfStockCount = stocks.filter((stock) => stock.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
        <select
          value={selectedCountryId}
          onChange={(event) => setSelectedCountryId(event.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selectionner un pays</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span>{error}</span>
          <button onClick={clearError} className="font-bold text-red-500 hover:text-red-700">
            x
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">Total Articles</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stocks.length}</div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow">
          <div className="text-sm font-medium text-green-700">En Stock</div>
          <div className="mt-2 text-3xl font-bold text-green-700">{inStockCount}</div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow">
          <div className="text-sm font-medium text-yellow-700">Stock Faible</div>
          <div className="mt-2 text-3xl font-bold text-yellow-700">{lowStockCount}</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow">
          <div className="text-sm font-medium text-red-700">Rupture</div>
          <div className="mt-2 text-3xl font-bold text-red-700">{outOfStockCount}</div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'all', label: 'Tous les stocks' },
            { id: 'low', label: 'Stock faible' },
            { id: 'adjust', label: 'Ajuster stock' },
            { id: 'history', label: 'Historique' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
            </div>
          ) : null}

          {!loading && activeTab === 'all' ? (
            <div className="space-y-4">
              <h3 className="mb-4 text-lg font-semibold">Tous les articles ({stocks.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-sm font-semibold">Produit</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Variante</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Quantite</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Statut</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Maj</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => (
                      <tr key={stock.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{stock.productName}</td>
                        <td className="px-4 py-3 text-sm">{stock.variantLabel}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{stock.quantity}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              stock.quantity === 0
                                ? 'bg-red-100 text-red-800'
                                : stock.quantity <= 5
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {stock.quantity === 0 ? 'Rupture' : stock.quantity <= 5 ? 'Faible' : 'En stock'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(stock.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setSelectedVariantId(stock.variantId);
                              setActiveTab('adjust');
                            }}
                            className="font-medium text-blue-500 hover:text-blue-700"
                          >
                            Ajuster
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === 'low' ? (
            <div className="space-y-4">
              <h3 className="mb-4 text-lg font-semibold">Articles a reapprovisionner ({lowStocks.length})</h3>
              {lowStocks.length === 0 ? (
                <p className="py-8 text-center text-gray-500">Aucun article en rupture de stock</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold">Produit</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Variante</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Quantite</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStocks.map((stock) => (
                        <tr key={stock.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{stock.productName}</td>
                          <td className="px-4 py-3 text-sm">{stock.variantLabel}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                              {stock.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => {
                                setSelectedVariantId(stock.variantId);
                                setActiveTab('adjust');
                              }}
                              className="font-medium text-blue-500 hover:text-blue-700"
                            >
                              Reapprovisionner
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {!loading && activeTab === 'adjust' ? (
            <StockAdjustmentForm
              countryId={selectedCountryId}
              variantId={selectedVariantId}
              onSuccess={() => {
                setSelectedVariantId(null);
                setActiveTab('all');
              }}
            />
          ) : null}

          {!loading && activeTab === 'history' && selectedVariantId ? (
            <StockMovementHistory variantId={selectedVariantId} countryId={selectedCountryId} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
