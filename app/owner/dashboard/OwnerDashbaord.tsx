'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Globe2, Package, ShoppingCart, Wallet } from 'lucide-react';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { OwnerLayout } from '@/components/shared/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ownerService, type OwnerCountryKpiDetail, type OwnerGlobalKpis } from '@/lib/owner-service';
import { orderService, type Order } from '@/lib/order-service';

type DateRange = '24hours' | '7days' | '30days' | 'all';

function formatMoney(amount: number) {
  return `${amount.toLocaleString()} FCFA`;
}

function formatDate(value?: string) {
  if (!value) return 'Date indisponible';

  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function statusLabel(status: Order['status']) {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmee';
    case 'PROCESSING':
      return 'En preparation';
    case 'SHIPPED':
      return 'Expediee';
    case 'DELIVERED':
      return 'Livree';
    case 'CANCELLED':
      return 'Annulee';
    case 'PENDING':
    default:
      return 'En attente';
  }
}

function statusClassName(status: Order['status']) {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PROCESSING':
      return 'bg-indigo-100 text-indigo-800';
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

function OwnerDashboardContent() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [globalKpis, setGlobalKpis] = useState<OwnerGlobalKpis | null>(null);
  const [countryDetail, setCountryDetail] = useState<OwnerCountryKpiDetail | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadGlobal = async () => {
      setIsLoading(true);
      setError('');

      const response = await ownerService.getGlobalKpis(dateRange);

      if (!active) {
        return;
      }

      if (!response.success || !response.data) {
        setError(response.error || 'Impossible de charger les KPIs owner.');
        setGlobalKpis(null);
        setIsLoading(false);
        return;
      }

      const kpis = response.data;
      setGlobalKpis(kpis);
      setSelectedCountryId((current) => current || kpis.byCountry[0]?.countryId || null);
      setIsLoading(false);
    };

    void loadGlobal();

    return () => {
      active = false;
    };
  }, [dateRange]);

  useEffect(() => {
    if (!selectedCountryId) {
      setCountryDetail(null);
      setRecentOrders([]);
      return;
    }

    let active = true;

    const loadCountryData = async () => {
      const [kpiResponse, ordersResponse] = await Promise.all([
        ownerService.getCountryKpis(selectedCountryId, dateRange),
        orderService.getAllOrders(selectedCountryId, 0, 10),
      ]);

      if (!active) {
        return;
      }

      if (!kpiResponse.success || !ordersResponse.success) {
        setError(kpiResponse.error || ordersResponse.error || 'Impossible de charger les details pays.');
        return;
      }

      setCountryDetail(kpiResponse.data || null);
      setRecentOrders(ordersResponse.data?.data || []);
    };

    void loadCountryData();

    return () => {
      active = false;
    };
  }, [dateRange, selectedCountryId]);

  const selectedCountryName = useMemo(
    () => globalKpis?.byCountry.find((country) => country.countryId === selectedCountryId)?.countryName,
    [globalKpis, selectedCountryId]
  );

  return (
    <OwnerLayout activeTab="dashboard">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard Owner</h1>
            <p className="mt-1 text-gray-600">
              KPIs backend reels, par periode et par pays.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as DateRange)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700"
            >
              <option value="24hours">Dernieres 24h</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="all">Tout</option>
            </select>

            <select
              value={selectedCountryId ?? ''}
              onChange={(event) => setSelectedCountryId(Number(event.target.value))}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700"
            >
              {(globalKpis?.byCountry || []).map((country) => (
                <option key={country.countryId} value={country.countryId}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chiffre d&apos;affaires</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatMoney(globalKpis?.totalRevenue || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commandes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {globalKpis?.totalOrders || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {globalKpis?.totalCustomers || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Globe2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Part owner nette</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatMoney(countryDetail?.ownerRevenue || 0)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedCountryName || 'Pays'} • {countryDetail?.ownerSharePct || 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Pays actifs</h2>
              <Button variant="outline" className="pointer-events-none opacity-70">
                {globalKpis?.byCountry.length || 0} zones
              </Button>
            </div>

            <div className="space-y-3">
              {(globalKpis?.byCountry || []).map((country) => (
                <button
                  key={country.countryId}
                  type="button"
                  onClick={() => setSelectedCountryId(country.countryId)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                    selectedCountryId === country.countryId
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{country.countryName}</p>
                    <p className="text-sm text-gray-500">{country.totalOrders} commandes</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatMoney(country.revenue)}</p>
                </button>
              ))}
              {isLoading && !globalKpis ? (
                <p className="text-sm text-gray-500">Chargement des pays...</p>
              ) : null}
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Commandes recentes {selectedCountryName ? `• ${selectedCountryName}` : ''}
              </h2>
            </div>

            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {isLoading ? 'Chargement...' : 'Aucune commande recente pour cette zone.'}
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {[order.city?.name || order.cityName, order.countryName].filter(Boolean).join(', ') || 'Zone inconnue'}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatMoney(order.totalAmount)}</p>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClassName(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-900">Top produits</h2>
            <div className="space-y-3">
              {(countryDetail?.topProducts || []).map((product) => (
                <div key={product.productId} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="font-medium text-gray-900">{product.productName}</span>
                  <span className="text-sm font-semibold text-gray-700">{product.totalSold} ventes</span>
                </div>
              ))}
              {!countryDetail?.topProducts?.length ? (
                <p className="text-sm text-gray-500">Aucune vente livree sur cette periode.</p>
              ) : null}
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-900">Repartition des statuts</h2>
            <div className="space-y-3">
              {Object.entries(countryDetail?.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="font-medium text-gray-900">{statusLabel(status as Order['status'])}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
              {!Object.keys(countryDetail?.ordersByStatus || {}).length ? (
                <p className="text-sm text-gray-500">Aucune commande sur cette selection.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}

export default function OwnerDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['owner']}>
      <OwnerDashboardContent />
    </ProtectedRoute>
  );
}
