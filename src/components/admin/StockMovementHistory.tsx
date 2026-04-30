'use client';

import { useEffect } from 'react';
import { useStockStore } from '@/stores/stock-store';

interface StockMovementHistoryProps {
  variantId: string;
  countryId: string;
}

export default function StockMovementHistory({
  variantId,
  countryId,
}: StockMovementHistoryProps) {
  const { movements, loading, fetchMovements } = useStockStore();

  useEffect(() => {
    if (variantId && countryId) {
      fetchMovements(variantId, countryId);
    }
  }, [variantId, countryId, fetchMovements]);

  const getMovementColor = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return 'bg-green-100 text-green-800';
      case 'OUT':
        return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800';
      case 'RETURN':
        return 'bg-purple-100 text-purple-800';
      case 'DAMAGE':
        return 'bg-red-100 text-red-800';
      case 'LOSS':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (movementType: string) => {
    switch (movementType) {
      case 'IN':
        return 'Entrée';
      case 'OUT':
        return 'Sortie';
      case 'ADJUSTMENT':
        return 'Ajustement';
      case 'RETURN':
        return 'Retour';
      case 'DAMAGE':
        return 'Dégât';
      case 'LOSS':
        return 'Perte';
      default:
        return movementType;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun mouvement de stock enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Historique des mouvements</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-2 font-semibold text-sm">Date</th>
              <th className="text-left px-4 py-2 font-semibold text-sm">Type</th>
              <th className="text-left px-4 py-2 font-semibold text-sm">Quantité</th>
              <th className="text-left px-4 py-2 font-semibold text-sm">Utilisateur</th>
              <th className="text-left px-4 py-2 font-semibold text-sm">Raison</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {new Date(movement.createdAt).toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getMovementColor(
                      movement.movementType
                    )}`}
                  >
                    {getMovementLabel(movement.movementType)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  <span
                    className={
                      movement.movementType === 'OUT' ||
                      movement.movementType === 'DAMAGE' ||
                      movement.movementType === 'LOSS'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {movement.movementType === 'OUT' ||
                    movement.movementType === 'DAMAGE' ||
                    movement.movementType === 'LOSS'
                      ? '-'
                      : '+'}
                    {movement.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {movement.user || 'Système'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {movement.reason || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
