'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Package, ShoppingCart, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { orderService, type Order } from '@/lib/order-service';
import { productService } from '@/lib/product-service';
import { userService } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type DateRange = '24hours' | '7days' | '30days' | 'all';

function formatMoney(value: number) {
  return `${value.toLocaleString()} FCFA`;
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

function inRange(date: string | undefined, range: DateRange) {
  if (!date || range === 'all') return true;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return true;

  const now = Date.now();
  const days = range === '24hours' ? 1 : range === '30days' ? 30 : 7;
  return target >= now - days * 24 * 60 * 60 * 1000;
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

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      const [ordersResponse, usersResponse, productsResponse] = await Promise.all([
        orderService.getAllOrders(undefined, 0, 50),
        userService.getUsers(undefined, 1, 50),
        productService.getProducts({ page: 1, pageSize: 50 }),
      ]);

      if (!active) {
        return;
      }

      if (!ordersResponse.success || !usersResponse.success || !productsResponse.success) {
        setError(
          ordersResponse.error || usersResponse.error || productsResponse.error || 'Chargement impossible.'
        );
        setIsLoading(false);
        return;
      }

      setOrders(ordersResponse.data?.data || []);
      setUserCount(usersResponse.data?.pagination.total || 0);
      setProductCount(productsResponse.data?.pagination.total || 0);
      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) => inRange(order.createdAt, dateRange)),
    [dateRange, orders]
  );

  const revenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageBasket = filteredOrders.length ? revenue / filteredOrders.length : 0;
  const recentOrders = filteredOrders.slice(0, 5);
  const statusSummary = Object.entries(
    filteredOrders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {})
  );
  const revenueByDay = Object.values(
    filteredOrders.reduce<Record<string, { date: string; revenue: number; orders: number }>>((acc, order) => {
      const date = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        : 'Sans date';
      acc[date] = acc[date] || { date, revenue: 0, orders: 0 };
      acc[date].revenue += order.totalAmount;
      acc[date].orders += 1;
      return acc;
    }, {})
  ).slice(-10);
  const statusChartData = statusSummary.map(([status, count]) => ({
    status: statusLabel(status as Order['status']),
    count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="mt-1 text-gray-600">Vue reelle des commandes, utilisateurs et produits.</p>
        </div>

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
              <p className="text-sm text-gray-600">Revenu</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatMoney(revenue)}</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commandes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{userCount}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{productCount}</p>
              <p className="mt-1 text-xs text-gray-500">Panier moyen: {formatMoney(averageBasket)}</p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Evolution du revenu</h2>
              <p className="text-sm text-gray-500">Basee sur les commandes retournees par le backend.</p>
            </div>
          </div>

          <div className="h-72">
            {revenueByDay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                {isLoading ? 'Chargement du graphique...' : 'Aucune donnee disponible.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Statuts des commandes</h2>
            <Button asChild variant="outline">
              <Link href="/admin/orders">Voir les commandes</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {statusSummary.length === 0 ? (
              <p className="text-sm text-gray-500">{isLoading ? 'Chargement...' : 'Aucune commande.'}</p>
            ) : (
              statusSummary.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{statusLabel(status as Order['status'])}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 h-56">
            {statusChartData.length === 0 ? null : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Commandes recentes</h2>
            <Button asChild variant="outline">
              <Link href="/admin/orders">Ouvrir la liste</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">{isLoading ? 'Chargement...' : 'Aucune commande recente.'}</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
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
    </div>
  );
}
