'use client';

import { useMemo } from 'react';

interface StockStatusBadgeProps {
  quantity: number;
  variant?: 'compact' | 'full';
  className?: string;
}

export function StockStatusBadge({ 
  quantity, 
  variant = 'full',
  className = ''
}: StockStatusBadgeProps) {
  const status = useMemo(() => {
    if (quantity === 0) return { type: 'out-of-stock', label: 'Rupture de stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 5) return { type: 'low-stock', label: `Stock faible (${quantity})`, color: 'bg-yellow-100 text-yellow-800' };
    return { type: 'in-stock', label: 'En stock', color: 'bg-green-100 text-green-800' };
  }, [quantity]);

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${status.color} ${className}`}>
        {quantity === 0 ? '✕ Rupture' : `✓ ${quantity}`}
      </span>
    );
  }

  return (
    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${status.color} ${className}`}>
      {quantity === 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠</span>
          <span>{status.label}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>
          <span>{status.label}</span>
        </div>
      )}
    </div>
  );
}

interface StockInfoProps {
  quantity: number;
  countryName?: string;
  showCountry?: boolean;
}

export function StockInfo({ 
  quantity, 
  countryName,
  showCountry = false 
}: StockInfoProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-sm">Stock disponible:</span>
        <span className="font-semibold">{quantity} article(s)</span>
      </div>
      {showCountry && countryName && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Localisation:</span>
          <span className="font-semibold">{countryName}</span>
        </div>
      )}
      <StockStatusBadge quantity={quantity} variant="full" className="w-full text-center" />
    </div>
  );
}

interface VariantStockSelectorProps {
  variants: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
  disabled?: boolean;
}

export function VariantStockSelector({
  variants,
  selectedVariantId,
  onSelectVariant,
  disabled = false
}: VariantStockSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Variante:</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelectVariant(variant.id)}
            disabled={disabled || variant.quantity === 0}
            className={`p-3 border-2 rounded-lg transition-all text-sm ${
              selectedVariantId === variant.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${variant.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium">{variant.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {variant.quantity === 0 ? 'Rupture' : `${variant.quantity} dispo`}
            </div>
            <div className="text-xs font-semibold text-blue-600 mt-1">
              {variant.price}€
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface AddToCartButtonProps {
  quantity: number;
  disabled?: boolean;
  onAddToCart: () => void;
  className?: string;
}

export function AddToCartButton({
  quantity,
  disabled = false,
  onAddToCart,
  className = ''
}: AddToCartButtonProps) {
  return (
    <button
      onClick={onAddToCart}
      disabled={disabled || quantity === 0}
      className={`w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors ${className}`}
    >
      {quantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
    </button>
  );
}
