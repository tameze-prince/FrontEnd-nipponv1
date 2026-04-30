'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { orderService, type Order } from '@/lib/order-service';

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

function AdminOrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');
    const response = await orderService.getAllOrders(
      undefined,
      0,
      100,
      filterStatus === 'all' ? undefined : filterStatus
    );

    if (!response.success || !response.data) {
      setOrders([]);
      setError(response.error || 'Impossible de charger les commandes.');
    } else {
      setOrders(response.data.data);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void loadOrders();
  }, [filterStatus]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) =>
      [
        order.orderNumber,
        order.city?.name,
        order.cityName,
        order.countryName,
        ...order.items.map((item) => item.productName),
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [orders, searchTerm]);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    const response = await orderService.updateOrderStatus(orderId, status);

    if (!response.success || !response.data) {
      setError(response.error || 'Impossible de changer le statut.');
      return;
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? response.data! : order)));
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Commandes</h1>
            <p className="mt-1 text-gray-600">Liste backend reelle avec filtre statut et mise a jour.</p>
          </div>

          <Button variant="outline" onClick={() => void loadOrders(true)} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Rechercher une commande, une zone ou un produit..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
            />

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as 'all' | Order['status'])}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="CONFIRMED">Confirmee</option>
              <option value="PROCESSING">En preparation</option>
              <option value="DELIVERED">Livree</option>
              <option value="CANCELLED">Annulee</option>
            </select>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Zone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Articles</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Chargement des commandes...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Aucune commande trouvee.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-orange-600">{order.orderNumber}</td>
                      <td className="px-4 py-4 text-gray-700">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4 text-gray-700">
                        {[order.city?.name || order.cityName, order.countryName].filter(Boolean).join(', ') || 'Non renseignee'}
                      </td>
                      <td className="px-4 py-4 text-gray-700">{order.items.length}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{formatMoney(order.totalAmount)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClassName(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(event) => void handleStatusChange(order.id, event.target.value as Order['status'])}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                        >
                          <option value="PENDING">En attente</option>
                          <option value="CONFIRMED">Confirmee</option>
                          <option value="PROCESSING">En preparation</option>
                          <option value="DELIVERED">Livree</option>
                          <option value="CANCELLED">Annulee</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Commandes chargees</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
          </Card>
          <Card className="border-0 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Revenu cumule</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(totalRevenue)}</p>
          </Card>
          <Card className="border-0 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Livrees</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {filteredOrders.filter((order) => order.status === 'DELIVERED').length}
            </p>
          </Card>
          <Card className="border-0 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {filteredOrders.filter((order) => order.status === 'PENDING').length}
            </p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminOrdersPageContent />
    </ProtectedRoute>
  );
}
