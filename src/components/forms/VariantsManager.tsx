'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { productService, type ProductVariant } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface VariantsManagerProps {
  productId: string;
  variants: ProductVariant[];
  onVariantsUpdated: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

interface VariantForm {
  label: string;
  extraPrice: string;
}

export function VariantsManager({
  productId,
  variants,
  onVariantsUpdated,
  disabled = false,
}: VariantsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<VariantForm>({ label: '', extraPrice: '0' });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddVariant = async () => {
    if (!form.label.trim()) {
      toast.error('Le label de la variante est requis.');
      return;
    }

    try {
      setLoading(true);

      const response = await productService.addVariant(productId, {
        label: form.label,
        extraPrice: parseFloat(form.extraPrice || '0'),
      });

      if (!response.success) {
        toast.error(response.error || 'Impossible d\'ajouter la variante.');
        return;
      }

      toast.success('Variante ajoutée avec succès.');
      setForm({ label: '', extraPrice: '0' });
      setShowAddForm(false);

      if (response.data) {
        onVariantsUpdated([...variants, response.data]);
      }
    } catch (error) {
      console.error('Error adding variant:', error);
      toast.error('Erreur lors de l\'ajout de la variante.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      return;
    }

    try {
      setDeletingId(variantId);

      const response = await productService.deleteVariant(variantId);

      if (!response.success) {
        toast.error(response.error || 'Impossible de supprimer la variante.');
        return;
      }

      toast.success('Variante supprimée avec succès.');
      onVariantsUpdated(variants.filter((v) => v.id !== variantId));
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Erreur lors de la suppression de la variante.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Variantes de produit</h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une variante
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label *
              </label>
              <Input
                type="text"
                placeholder="ex: Rouge, XL, 64GB"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix supplémentaire (XAF)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={form.extraPrice}
                onChange={(e) => setForm({ ...form, extraPrice: e.target.value })}
                disabled={loading}
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleAddVariant}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Ajouter
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setForm({ label: '', extraPrice: '0' });
              }}
              variant="outline"
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune variante pour le moment.</p>
          <p className="text-sm mt-2">Ajoutez une variante pour offrir plus d\'options aux clients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{variant.label}</p>
                {variant.price ? (
                  <p className="text-sm text-gray-500">
                    Prix: {variant.price.toLocaleString('fr-FR')} XAF
                  </p>
                ) : null}
              </div>

              <button
                onClick={() => handleDeleteVariant(variant.id)}
                disabled={deletingId === variant.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === variant.id ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          💡 <strong>Conseil:</strong> Les variantes permettent aux clients de choisir différentes options
          (couleur, taille, etc.). Le prix supplémentaire s\'ajoute au prix de base du produit.
        </p>
      </div>
    </Card>
  );
}
