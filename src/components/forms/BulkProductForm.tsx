'use client';

import React, { useState } from 'react';
import { Copy, Loader, Plus, Trash2, X } from 'lucide-react';
import { validatePrice, validateRequired } from '@/lib/form-validation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProductVariant {
  label: string;
  extraPrice: number;
  imageUrl: string;
  initialStock: number;
}

export interface SingleProductFormData {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  franchiseId?: string;
  sku: string;
  barcode?: string;
  stock: number;
  minStock: number;
  stockCountryId?: string;
  colors: string[];
  sizes: string[];
  weight?: number;
  dimensions?: string;
  images: File[];
  variants: ProductVariant[];
}

interface BulkProductFormProps {
  categories: Array<{ id: string; name: string }>;
  franchises?: Array<{ id: string; name: string }>;
  onSubmit: (products: SingleProductFormData[]) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<SingleProductFormData>;
  isEdit?: boolean;
  mode?: 'single' | 'bulk';
}

function createDefaultProduct(
  initialData?: Partial<SingleProductFormData>
): SingleProductFormData {
  return {
    name: '',
    description: '',
    price: 0,
    salePrice: undefined,
    categoryId: '',
    franchiseId: '',
    sku: '',
    barcode: '',
    stock: 0,
    minStock: 10,
    stockCountryId: '',
    colors: [],
    sizes: [],
    weight: undefined,
    dimensions: '',
    images: [],
    variants: [],
    ...initialData,
  };
}

export default function BulkProductForm({
  categories,
  franchises = [],
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
  mode = 'single',
}: BulkProductFormProps) {
  const isBulkMode = mode === 'bulk' && !isEdit;
  const [products, setProducts] = useState<SingleProductFormData[]>([
    createDefaultProduct(initialData),
  ]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [colorInputs, setColorInputs] = useState<Record<number, string>>({});
  const [sizeInputs, setSizeInputs] = useState<Record<number, string>>({});

  const validateProduct = (product: SingleProductFormData, index: number) => {
    const productErrors: Record<string, string> = {};

    if (!validateRequired(product.name)) {
      productErrors.name = 'Le nom du produit est requis.';
    }

    if (!validatePrice(product.price)) {
      productErrors.price = 'Le prix doit etre superieur a 0.';
    }

    if (!validateRequired(product.categoryId)) {
      productErrors.categoryId = 'La categorie est requise.';
    }

    if (product.salePrice !== undefined && product.salePrice !== null && product.salePrice !== 0) {
      if (!validatePrice(product.salePrice)) {
        productErrors.salePrice = 'Le prix promo doit etre superieur a 0.';
      } else if (product.salePrice >= product.price) {
        productErrors.salePrice = 'Le prix promo doit rester inferieur au prix normal.';
      }
    }

    if (product.stock < 0) {
      productErrors.stock = 'Le stock ne peut pas etre negatif.';
    }

    setErrors((previous) => {
      const next = { ...previous };
      if (Object.keys(productErrors).length > 0) {
        next[index] = productErrors;
      } else {
        delete next[index];
      }
      return next;
    });

    return Object.keys(productErrors).length === 0;
  };

  const validateAllProducts = () => {
    let isValid = true;

    products.forEach((product, index) => {
      if (!validateProduct(product, index)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const updateProduct = <K extends keyof SingleProductFormData>(
    productIndex: number,
    field: K,
    value: SingleProductFormData[K]
  ) => {
    setProducts((previous) =>
      previous.map((product, index) =>
        index === productIndex
          ? {
              ...product,
              [field]: value,
            }
          : product
      )
    );

    if (errors[productIndex]?.[String(field)]) {
      setErrors((previous) => {
        const next = { ...previous };
        const productErrors = { ...(next[productIndex] || {}) };
        delete productErrors[String(field)];

        if (Object.keys(productErrors).length === 0) {
          delete next[productIndex];
        } else {
          next[productIndex] = productErrors;
        }

        return next;
      });
    }
  };

  const handleFieldChange = (
    productIndex: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.currentTarget;

    const numericFields = new Set(['price', 'salePrice', 'stock', 'minStock', 'weight']);
    const nextValue = numericFields.has(name)
      ? (value === '' ? undefined : Number(value))
      : value;

    updateProduct(
      productIndex,
      name as keyof SingleProductFormData,
      nextValue as SingleProductFormData[keyof SingleProductFormData]
    );
  };

  const handleImageUpload = (
    productIndex: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.currentTarget.files || []);

    if (files.length === 0) {
      return;
    }

    updateProduct(productIndex, 'images', [...products[productIndex].images, ...files]);
    event.currentTarget.value = '';
  };

  const removeImage = (productIndex: number, imageIndex: number) => {
    updateProduct(
      productIndex,
      'images',
      products[productIndex].images.filter((_, index) => index !== imageIndex)
    );
  };

  const addTag = (productIndex: number, type: 'colors' | 'sizes') => {
    const value =
      type === 'colors' ? colorInputs[productIndex]?.trim() : sizeInputs[productIndex]?.trim();

    if (!value) {
      return;
    }

    const currentValues = products[productIndex][type];

    if (!currentValues.includes(value)) {
      updateProduct(productIndex, type, [...currentValues, value]);
    }

    if (type === 'colors') {
      setColorInputs((previous) => ({ ...previous, [productIndex]: '' }));
    } else {
      setSizeInputs((previous) => ({ ...previous, [productIndex]: '' }));
    }
  };

  const removeTag = (productIndex: number, type: 'colors' | 'sizes', value: string) => {
    updateProduct(
      productIndex,
      type,
      products[productIndex][type].filter((item) => item !== value)
    );
  };

  const addVariant = (productIndex: number) => {
    updateProduct(productIndex, 'variants', [
      ...products[productIndex].variants,
      { label: '', extraPrice: 0, imageUrl: '', initialStock: 0 },
    ]);
  };

  const updateVariant = <K extends keyof ProductVariant>(
    productIndex: number,
    variantIndex: number,
    field: K,
    value: ProductVariant[K]
  ) => {
    const updatedVariants = products[productIndex].variants.map((variant, index) =>
      index === variantIndex ? { ...variant, [field]: value } : variant
    );
    updateProduct(productIndex, 'variants', updatedVariants);
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    updateProduct(
      productIndex,
      'variants',
      products[productIndex].variants.filter((_, index) => index !== variantIndex)
    );
  };

  const addProduct = () => {
    setProducts((previous) => [...previous, createDefaultProduct()]);
  };

  const duplicateProduct = (productIndex: number) => {
    const source = products[productIndex];

    setProducts((previous) => [
      ...previous,
      {
        ...source,
        name: source.name ? `${source.name} copie` : '',
        sku: source.sku ? `${source.sku}-copy` : '',
        images: [...source.images],
        colors: [...source.colors],
        sizes: [...source.sizes],
        variants: [...source.variants],
      },
    ]);
  };

  const removeProduct = (productIndex: number) => {
    if (products.length === 1) {
      return;
    }

    setProducts((previous) => previous.filter((_, index) => index !== productIndex));
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous)
          .filter(([index]) => Number(index) !== productIndex)
          .map(([index, value]) => [Number(index) > productIndex ? Number(index) - 1 : Number(index), value])
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateAllProducts()) {
      return;
    }

    await onSubmit(products);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {products.map((product, productIndex) => (
        <Card key={`product-form-${productIndex}`} className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isBulkMode ? `Produit ${productIndex + 1}` : 'Details du produit'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {product.name || 'Renseignez les informations du produit.'}
              </p>
            </div>

            {isBulkMode && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => duplicateProduct(productIndex)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeProduct(productIndex)}
                  disabled={products.length === 1}
                  className="flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nom du produit *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={(event) => handleFieldChange(productIndex, event)}
                placeholder="Ex: Figurine Luffy Gear 5"
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors[productIndex]?.name ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors[productIndex]?.name && (
                <p className="mt-1 text-sm text-red-500">{errors[productIndex].name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={product.sku}
                onChange={(event) => handleFieldChange(productIndex, event)}
                placeholder="Optionnel"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optionnel avec l'API actuelle. Vous pouvez le laisser vide.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Categorie *
              </label>
              <select
                name="categoryId"
                value={product.categoryId}
                onChange={(event) => handleFieldChange(productIndex, event)}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors[productIndex]?.categoryId ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Selectionner une categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors[productIndex]?.categoryId && (
                <p className="mt-1 text-sm text-red-500">{errors[productIndex].categoryId}</p>
              )}
            </div>

            {franchises.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Franchise
                </label>
                <select
                  name="franchiseId"
                  value={product.franchiseId || ''}
                  onChange={(event) => handleFieldChange(productIndex, event)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Aucune</option>
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prix *
              </label>
              <input
                type="number"
                name="price"
                value={product.price || ''}
                onChange={(event) => handleFieldChange(productIndex, event)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors[productIndex]?.price ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors[productIndex]?.price && (
                <p className="mt-1 text-sm text-red-500">{errors[productIndex].price}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prix promo
              </label>
              <input
                type="number"
                name="salePrice"
                value={product.salePrice || ''}
                onChange={(event) => handleFieldChange(productIndex, event)}
                placeholder="Optionnel"
                step="0.01"
                min="0"
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors[productIndex]?.salePrice ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors[productIndex]?.salePrice && (
                <p className="mt-1 text-sm text-red-500">{errors[productIndex].salePrice}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock initial
              </label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={(event) => handleFieldChange(productIndex, event)}
                min="0"
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors[productIndex]?.stock ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors[productIndex]?.stock && (
                <p className="mt-1 text-sm text-red-500">{errors[productIndex].stock}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Utilise pour un produit sans variantes. Les variantes peuvent avoir leur propre stock plus bas.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock minimum
              </label>
              <input
                type="number"
                name="minStock"
                value={product.minStock}
                onChange={(event) => handleFieldChange(productIndex, event)}
                min="0"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={product.description}
              onChange={(event) => handleFieldChange(productIndex, event)}
              placeholder="Optionnel"
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              La description n'est pas obligatoire pour l'API, mais elle est recommandee.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Images
            </label>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-orange-500">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => handleImageUpload(productIndex, event)}
                className="hidden"
                id={`images-${productIndex}`}
              />
              <label htmlFor={`images-${productIndex}`} className="cursor-pointer text-gray-600">
                Cliquer pour ajouter une ou plusieurs images
              </label>
            </div>

            {product.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {product.images.map((image, imageIndex) => (
                  <div key={`${image.name}-${imageIndex}`} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${imageIndex + 1}`}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(productIndex, imageIndex)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Variantes
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => addVariant(productIndex)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer variante
              </Button>
            </div>
            {product.variants.length > 0 && (
              <div className="space-y-2">
                {product.variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="space-y-3 rounded-lg border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
                      <input
                        type="text"
                        placeholder="Libelle ex: Noir / XL"
                        value={variant.label}
                        onChange={(e) => updateVariant(productIndex, variantIndex, 'label', e.target.value)}
                        className="rounded border px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Surcout"
                        min="0"
                        step="0.01"
                        value={variant.extraPrice}
                        onChange={(e) => updateVariant(productIndex, variantIndex, 'extraPrice', Number(e.target.value || 0))}
                        className="rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto] md:items-start">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="URL image variante (optionnel)"
                          value={variant.imageUrl}
                          onChange={(e) => updateVariant(productIndex, variantIndex, 'imageUrl', e.target.value)}
                          className="w-full rounded border px-3 py-2 text-sm"
                        />
                        {variant.imageUrl ? (
                          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={variant.imageUrl} alt={variant.label || 'Variante'} className="h-12 w-12 rounded object-cover" />
                            <span className="text-xs text-gray-500">Apercu image variante</span>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Stock initial"
                          min="0"
                          value={variant.initialStock}
                          onChange={(e) => updateVariant(productIndex, variantIndex, 'initialStock', Number(e.target.value || 0))}
                          className="w-full rounded border px-3 py-2 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariant(productIndex, variantIndex)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
                      Prix final estime: {(product.price + (variant.extraPrice || 0)).toFixed(2)} | Stock initial variante:{' '}
                      {variant.initialStock || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Couleurs
              </label>
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  value={colorInputs[productIndex] || ''}
                  onChange={(event) =>
                    setColorInputs((previous) => ({
                      ...previous,
                      [productIndex]: event.currentTarget.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag(productIndex, 'colors');
                    }
                  }}
                  placeholder="Ex: Noir"
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Button type="button" onClick={() => addTag(productIndex, 'colors')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <div
                      key={`${productIndex}-${color}`}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                    >
                      <span className="text-sm">{color}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(productIndex, 'colors', color)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tailles
              </label>
              <div className="mb-2 flex gap-2">
                <input
                  type="text"
                  value={sizeInputs[productIndex] || ''}
                  onChange={(event) =>
                    setSizeInputs((previous) => ({
                      ...previous,
                      [productIndex]: event.currentTarget.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag(productIndex, 'sizes');
                    }
                  }}
                  placeholder="Ex: XL"
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Button type="button" onClick={() => addTag(productIndex, 'sizes')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <div
                      key={`${productIndex}-${size}`}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                    >
                      <span className="text-sm">{size}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(productIndex, 'sizes', size)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {isBulkMode && (
        <Card className="border-dashed p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Creation multiple</h3>
              <p className="mt-1 text-sm text-gray-600">
                Ajoutez autant de produits que voulu avant de lancer l'envoi.
              </p>
            </div>
            <Button type="button" onClick={addProduct} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un autre produit
            </Button>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit
            ? 'Mettre a jour le produit'
            : products.length > 1
              ? `Creer ${products.length} produits`
              : 'Creer le produit'}
        </Button>
      </div>
    </form>
  );
}
