'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductOption {
  id: string;
  name: string;
  basePrice?: number;
  quantity?: number;
  category?: string;
}

export interface FlashSaleFormData {
  productId: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}

interface FlashSaleFormProps {
  products: ProductOption[];
  onSubmit: (data: FlashSaleFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<FlashSaleFormData>;
  submitLabel?: string;
}

export default function FlashSaleForm({
  products,
  onSubmit,
  loading = false,
  error,
  initialData,
  submitLabel = 'Creer la flash sale',
}: FlashSaleFormProps) {
  const [formData, setFormData] = useState<FlashSaleFormData>({
    productId: initialData?.productId || '',
    discountPct: initialData?.discountPct ?? 10,
    startsAt: initialData?.startsAt || '',
    endsAt: initialData?.endsAt || '',
  });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const selectedProduct = products.find((product) => product.id === formData.productId);
  const previewPrice =
    selectedProduct?.basePrice && formData.discountPct > 0
      ? selectedProduct.basePrice * (1 - formData.discountPct / 100)
      : null;

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.productId) {
      nextErrors.productId = 'Choisissez un produit.';
    }
    if (!formData.startsAt) {
      nextErrors.startsAt = 'La date de debut est requise.';
    }
    if (!formData.endsAt) {
      nextErrors.endsAt = 'La date de fin est requise.';
    }
    if (formData.discountPct < 1 || formData.discountPct > 99) {
      nextErrors.discountPct = 'La remise doit etre entre 1 et 99.';
    }
    if (
      formData.startsAt &&
      formData.endsAt &&
      new Date(formData.endsAt).getTime() <= new Date(formData.startsAt).getTime()
    ) {
      nextErrors.endsAt = 'La date de fin doit etre apres la date de debut.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Produit</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit..."
            className="pl-9"
          />
        </div>
        <select
          value={formData.productId}
          onChange={(event) => setFormData((current) => ({ ...current, productId: event.target.value }))}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-500 focus:outline-none ${
            errors.productId ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <option value="">Selectionner un produit</option>
          {filteredProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {product.quantity || 0} unite(s)
            </option>
          ))}
        </select>
        {errors.productId ? <p className="text-sm text-red-500">{errors.productId}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Remise (%)</label>
          <Input
            type="number"
            min="1"
            max="99"
            value={formData.discountPct}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                discountPct: Number(event.target.value),
              }))
            }
            className={errors.discountPct ? 'border-red-500' : ''}
          />
          {errors.discountPct ? <p className="mt-1 text-sm text-red-500">{errors.discountPct}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Debut</label>
          <Input
            type="datetime-local"
            value={formData.startsAt}
            onChange={(event) => setFormData((current) => ({ ...current, startsAt: event.target.value }))}
            className={errors.startsAt ? 'border-red-500' : ''}
          />
          {errors.startsAt ? <p className="mt-1 text-sm text-red-500">{errors.startsAt}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Fin</label>
          <Input
            type="datetime-local"
            value={formData.endsAt}
            onChange={(event) => setFormData((current) => ({ ...current, endsAt: event.target.value }))}
            className={errors.endsAt ? 'border-red-500' : ''}
          />
          {errors.endsAt ? <p className="mt-1 text-sm text-red-500">{errors.endsAt}</p> : null}
        </div>
      </div>

      {selectedProduct ? (
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
          <p className="mt-1">Prix actuel: {selectedProduct.basePrice?.toLocaleString() || 0}</p>
          {previewPrice !== null ? (
            <p className="mt-1 text-orange-700">
              Prix estime en flash sale: {Math.max(0, previewPrice).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-orange-500 text-white hover:bg-orange-600">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
