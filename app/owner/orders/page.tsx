'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { orderService, type Order } from '@/lib/order-service';

type OwnerOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OwnerOrderStatus | 'ALL'>('PENDING');

  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getAllOrders(undefined, 0, 50);

      if (response.success && response.data) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.error || 'Erreur lors du chargement des commandes');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OwnerOrderStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);

      if (!response.success) {
        toast.error(response.error || 'Erreur lors de la mise a jour');
        return;
      }

      toast.success('Statut mis a jour');
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const getStatusBadgeColor = (status: OwnerOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filter === 'ALL' ? orders : orders.filter((order) => order.status === filter);

  return (
    <ProtectedRoute requiredRoles={['owner']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
            <p className="text-gray-600">Gerez les commandes visibles pour votre compte owner</p>
          </div>

          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as OwnerOrderStatus | 'ALL')}
                className={`px-4 py-2 font-medium transition-colors ${
                  filter === status
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">Chargement...</CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                Aucune commande trouvee
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          Zone: {[order.city?.name || order.cityName, order.countryName].filter(Boolean).join(', ') || 'Non renseignee'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: {order.totalAmount.toLocaleString()} FCFA
                        </p>
                        <div className="mt-2">
                          <Badge className={getStatusBadgeColor(order.status as OwnerOrderStatus)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {order.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => void handleStatusUpdate(order.id, 'CONFIRMED')}
                            className="bg-blue-600"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Confirmer
                          </Button>
                        )}
                        {(order.status === 'CONFIRMED' || order.status === 'PENDING') && (
                          <Button
                            size="sm"
                            onClick={() => void handleStatusUpdate(order.id, 'SHIPPED')}
                            className="bg-purple-600"
                          >
                            <Truck className="mr-1 h-4 w-4" />
                            Expedier
                          </Button>
                        )}
                        {order.status === 'SHIPPED' && (
                          <Button
                            size="sm"
                            onClick={() => void handleStatusUpdate(order.id, 'DELIVERED')}
                            className="bg-green-600"
                          >
                            <Package className="mr-1 h-4 w-4" />
                            Livrer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
