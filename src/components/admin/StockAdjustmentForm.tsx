'use client';

import { useState } from 'react';
import { useStockStore } from '@/stores/stock-store';

interface StockAdjustmentFormProps {
  countryId: string;
  variantId: string | null;
  onSuccess?: () => void;
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';

export default function StockAdjustmentForm({
  countryId,
  variantId,
  onSuccess,
}: StockAdjustmentFormProps) {
  const { adjustStock, loading, error } = useStockStore();
  const [formData, setFormData] = useState({
    variantId: variantId || '',
    quantity: 1,
    movementType: 'IN' as MovementType,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await adjustStock({
      variantId: formData.variantId,
      countryId,
      quantity: formData.quantity,
      movementType: formData.movementType,
      reason: formData.reason,
    });

    setFormData({
      variantId: '',
      quantity: 1,
      movementType: 'IN',
      reason: '',
    });

    onSuccess?.();
  };

  const movementTypes = [
    { value: 'IN', label: 'Entrée (Réapprovisionnement)' },
    { value: 'OUT', label: 'Sortie (Vente)' },
    { value: 'ADJUSTMENT', label: 'Ajustement (Correction)' },
    { value: 'RETURN', label: 'Retour (Produit retourné)' },
    { value: 'DAMAGE', label: 'Dégât (Produit endommagé)' },
    { value: 'LOSS', label: 'Perte (Produit perdu)' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Variant ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Variante *
          </label>
          <input
            type="text"
            value={formData.variantId}
            onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
            placeholder="Ex: 123"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            L'ID de la variante de produit à ajuster
          </p>
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de Mouvement *
          </label>
          <select
            value={formData.movementType}
            onChange={(e) =>
              setFormData({
                ...formData,
                movementType: e.target.value as MovementType,
              })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {movementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })
            }
            min="1"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.movementType === 'OUT' || formData.movementType === 'DAMAGE' || formData.movementType === 'LOSS'
              ? 'Quantité à retirer du stock'
              : 'Quantité à ajouter au stock'}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raison (Optionnel)
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Ex: Réapprovisionnement suite à commande du fournisseur"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() =>
              setFormData({
                variantId: '',
                quantity: 1,
                movementType: 'IN',
                reason: '',
              })
            }
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {loading ? 'Traitement...' : 'Ajuster le stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
