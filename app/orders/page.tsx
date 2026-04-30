'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Calendar, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { orderService, type Order } from '@/lib';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmee' },
  PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'En preparation' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Expediee' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livree' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulee' },
};

export default function MyOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const { selectedCountry } = useLocationStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currencySymbol = selectedCountry?.currencySymbol || 'FCFA';

  async function loadOrders() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getMyOrders();

      if (response.success && response.data) {
        setOrders(response.data.data);
      } else {
        setError(response.error || 'Impossible de charger les commandes');
        toast.error('Erreur lors du chargement des commandes');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Erreur de connexion');
      toast.error('Impossible de charger les commandes');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(() => {
        void loadOrders();
      });
    }
  }, [isAuthenticated]);

  return (
    <ProtectedRoute requiredRoles={['customer', 'admin', 'owner', 'partner']}>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Mes commandes</h1>
            <p className="mt-2 text-slate-600">
              Suivez l&apos;etat de vos commandes et consultez les details.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
              <p className="mt-4 text-slate-600">Chargement de vos commandes...</p>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-start gap-4 py-6">
                <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Erreur</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <Button
                    type="button"
                    onClick={() => void loadOrders()}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Reessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">Aucune commande</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-600">
                  Vous n&apos;avez pas encore passe de commande. Explorez notre catalogue pour
                  decouvrir nos produits.
                </p>
                <Link href="/products" className="mt-6">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                    Commencer a explorer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = statusColors[order.status] || statusColors.PENDING;

                return (
                  <Card key={order.id} className="overflow-hidden transition hover:shadow-lg">
                    <div className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {order.orderNumber}
                          </h3>
                          <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>

                          {(order.city?.name || order.countryName) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {[order.city?.name || order.cityName, order.countryName]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div>
                          <p className="text-sm text-slate-600">Total</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {order.totalAmount.toLocaleString()} {currencySymbol}
                          </p>
                        </div>

                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            Voir details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8">
            <Link href="/products">
              <Button variant="outline" className="w-full md:w-auto">
                Continuer vos achats
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
