'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Layers3, Loader, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { BulkProductForm } from '@/components/forms';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { categoryService, franchiseService, productService, stockService, type Product, type VariantInput } from '@/lib/index';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';

interface ProductFormPayload {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  franchiseId?: string;
  sku: string;
  stock: number;
  minStock: number;
  stockCountryId?: string;
  colors: string[];
  sizes: string[];
  images: File[];
  variants: Array<{ label: string; extraPrice: number; imageUrl: string; initialStock: number }>;
}

interface VariantDraft {
  label: string;
  extraPrice: string;
  imageUrl: string;
  initialStock: string;
}

const createVariantDraft = (): VariantDraft => ({
  label: '',
  extraPrice: '0',
  imageUrl: '',
  initialStock: '0',
});

function AdminProductsPageContent() {
  const { user } = useAuthStore();
  const { selectedCountry, selectedCity } = useLocationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [franchises, setFranchises] = useState<Array<{ id: string; name: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([createVariantDraft()]);
  const [variantSubmitting, setVariantSubmitting] = useState(false);

  const isOwner = user?.role === 'owner';
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await productService.getProducts({
        page: 1,
        pageSize: 100,
        countryId: isOwner ? selectedCountry?.id?.toString() : undefined,
        cityId: isOwner ? selectedCity?.id?.toString() : undefined,
      });

      if (response.success && response.data) {
        setProducts(response.data.data as Product[]);
        return;
      }

      setProducts([]);
      setError(response.error || 'Impossible de charger les produits.');
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      setError('Impossible de charger les produits.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.success && response.data ? response.data.data : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  const loadFranchises = async () => {
    try {
      const response = await franchiseService.getFranchises();
      setFranchises(response.success && response.data ? response.data.data : []);
    } catch (err) {
      console.error('Error loading franchises:', err);
      setFranchises([]);
    }
  };

  const ownerCityMismatch =
    isOwner &&
    user?.cityId &&
    selectedCity?.id &&
    user.cityId !== String(selectedCity.id);

  useEffect(() => {
    void loadProducts();
  }, [selectedCity?.id, selectedCountry?.id, user?.role]);

  useEffect(() => {
    void loadCategories();
    void loadFranchises();
  }, []);


  const handleOpenForm = (product?: Product) => {
    setError('');
    setEditingProduct(product || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (formData: ProductFormPayload[]) => {
    try {
      setSubmitting(true);
      setError('');

      const payloadWithCountry = formData.map((item) => ({
        ...item,
        stockCountryId: item.stockCountryId || selectedCountry?.id?.toString(),
      }));

      const response = editingProduct
        ? await productService.updateProduct(editingProduct.id, payloadWithCountry[0])
        : payloadWithCountry.length > 1
          ? await productService.createProducts(payloadWithCountry)
          : await productService.createProduct(payloadWithCountry[0]);

      if (!response.success) {
        setError(response.error || 'Operation echouee.');
        return;
      }

      if (!editingProduct && selectedCountry?.id) {
        const createdProducts = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];

        await Promise.all(
          createdProducts.flatMap((createdProduct, productIndex) =>
            (payloadWithCountry[productIndex]?.variants || [])
              .filter((variant) => variant.initialStock > 0)
              .map(async (variant) => {
                const createdVariant = createdProduct.variants.find(
                  (item) => (item.label || item.name) === variant.label
                );

                if (!createdVariant) {
                  return;
                }

                await stockService.adjustStock({
                  variantId: createdVariant.id,
                  countryId: selectedCountry.id,
                  quantity: variant.initialStock,
                  movementType: 'IN',
                  reason: 'Stock initial variante',
                });
              })
          )
        );
      }

      toast.success(editingProduct ? 'Produit mis a jour.' : 'Produit cree.');
      handleCloseForm();
      await loadProducts();
    } catch (err) {
      console.error('Form submit error:', err);
      setError('Une erreur est survenue pendant la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Voulez-vous vraiment desactiver ce produit ?')) {
      return;
    }

    try {
      const response = await productService.deleteProduct(productId);

      if (response.success) {
        toast.success('Produit desactive.');
        await loadProducts();
      } else {
        setError(response.error || 'Impossible de supprimer le produit.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur pendant la suppression du produit.');
    }
  };

  const filteredProducts = useMemo(() => {
    if (ownerCityMismatch) {
      return [];
    }

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [filterCategory, ownerCityMismatch, products, searchTerm]);

  const handleOpenVariantModal = (product: Product) => {
    setVariantModalProduct(product);
    setVariantDrafts([createVariantDraft()]);
  };

  const handleCloseVariantModal = () => {
    setVariantModalProduct(null);
    setVariantDrafts([createVariantDraft()]);
  };

  const handleVariantDraftChange = (index: number, field: keyof VariantDraft, value: string) => {
    setVariantDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index
          ? {
              ...draft,
              [field]: value,
            }
          : draft
      )
    );
  };

  const handleCreateVariants = async () => {
    if (!variantModalProduct) {
      return;
    }

    const payload: VariantInput[] = variantDrafts
      .map((draft) => ({
        label: draft.label.trim(),
        extraPrice: Number(draft.extraPrice || 0),
        imageUrl: draft.imageUrl.trim() || undefined,
      }))
      .filter((draft) => draft.label);

    if (payload.length === 0) {
      setError('Ajoutez au moins une variante avec un libelle.');
      return;
    }

    try {
      setVariantSubmitting(true);
      setError('');

      const response = await productService.addVariants(variantModalProduct.id, payload);

      if (!response.success) {
        setError(response.error || 'Impossible de creer les variantes.');
        return;
      }

      if (selectedCountry?.id && response.data) {
        await Promise.all(
          response.data.map((variant, index) => {
            const initialStock = Number(variantDrafts[index]?.initialStock || 0);

            if (initialStock <= 0) {
              return Promise.resolve();
            }

            return stockService.adjustStock({
              variantId: variant.id,
              countryId: selectedCountry.id,
              quantity: initialStock,
              movementType: 'IN',
              reason: 'Stock initial variante',
            });
          })
        );
      }

      toast.success(`${payload.length} variante(s) ajoutee(s).`);
      await loadProducts();
      handleCloseVariantModal();
    } catch (err) {
      console.error('Create variants error:', err);
      setError('Une erreur est survenue pendant la creation des variantes.');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Supprimer cette variante ?')) {
      return;
    }

    const response = await productService.deleteVariant(variantId);

    if (!response.success) {
      setError(response.error || 'Impossible de supprimer la variante.');
      return;
    }

    toast.success('Variante supprimee.');
    await loadProducts();

    if (variantModalProduct) {
      const refreshed = await productService.getProducts({
        page: 1,
        pageSize: 100,
        countryId: isOwner ? selectedCountry?.id?.toString() : undefined,
        cityId: isOwner ? selectedCity?.id?.toString() : undefined,
      });
      const updatedProduct =
        refreshed.success && refreshed.data
          ? refreshed.data.data.find((product) => product.id === variantModalProduct.id) || null
          : null;
      setVariantModalProduct(updatedProduct);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Produits</h1>
            <p className="mt-1 text-gray-600">
              {isOwner
                ? 'Produits en stock visibles pour votre pays actif'
                : 'Tous les produits disponibles en base'}
            </p>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
            Ajouter un produit
          </Button>
        </div>

        {isOwner && user?.city ? (
          <div className={`rounded-lg border p-4 text-sm ${ownerCityMismatch ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {ownerCityMismatch
              ? `Le compte owner est rattache a ${user.city}. Selectionnez cette ville pour voir les produits du stock.`
              : `Ville owner detectee: ${user.city}${selectedCity ? ` • ville active: ${selectedCity.name}` : ''}`}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher un produit..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Toutes les categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="py-8 text-center">
              <Loader className="mx-auto h-6 w-6 animate-spin text-orange-500" />
              <p className="mt-2 text-gray-600">Chargement des produits...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Produit</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Categorie</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Prix</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Stock</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Variantes</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image} alt={product.name} className="h-10 w-10 rounded object-cover" />
                            ) : null}
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{product.category}</td>
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          {product.salePrice ? (
                            <div>
                              <span className="text-gray-500 line-through">{product.basePrice}</span>
                              <span className="ml-2 text-orange-600">{product.salePrice}</span>
                            </div>
                          ) : (
                            product.basePrice
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              (product.quantity || 0) === 0
                                ? 'bg-red-100 text-red-800'
                                : (product.quantity || 0) < 10
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {product.quantity || 0} unites
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {product.variants?.length || 0}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenForm(product)}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenVariantModal(product)}
                              className="rounded-lg p-2 text-violet-600 transition-colors hover:bg-violet-50"
                              title="Gerer les variantes"
                            >
                              <Layers3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => void handleDeleteProduct(product.id)}
                              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {ownerCityMismatch
                          ? 'Aucun produit visible tant que la ville active ne correspond pas a celle du owner.'
                          : 'Aucun produit trouve.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border-0 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button onClick={handleCloseForm} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <BulkProductForm
                categories={categories}
                franchises={franchises}
                initialData={
                  editingProduct
                    ? {
                        name: editingProduct.name,
                        description: editingProduct.description || '',
                        price: editingProduct.basePrice || editingProduct.price,
                        salePrice: editingProduct.salePrice,
                        categoryId:
                          categories.find((category) => category.name === editingProduct.category)?.id || '',
                        franchiseId:
                          franchises.find((franchise) => franchise.name === editingProduct.franchise)?.id || '',
                        sku: '',
                        stock: editingProduct.quantity || 0,
                        minStock: 10,
                        stockCountryId: selectedCountry?.id?.toString(),
                        colors: [],
                        sizes: [],
                        images: [],
                        variants: [],
                      }
                    : {
                        stockCountryId: selectedCountry?.id?.toString(),
                      }
                }
                isEdit={Boolean(editingProduct)}
                loading={submitting}
                error={error}
                mode={editingProduct ? 'single' : 'bulk'}
                onSubmit={handleFormSubmit}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {variantModalProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-0 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Variantes</h2>
                <p className="mt-1 text-sm text-gray-600">{variantModalProduct.name}</p>
              </div>
              <button onClick={handleCloseVariantModal} className="rounded-lg p-1 transition-colors hover:bg-gray-100">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Variantes existantes</h3>
                {variantModalProduct.variants?.length ? (
                  <div className="space-y-2">
                    {variantModalProduct.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center gap-3">
                          {variant.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={variant.image} alt={variant.label || variant.name} className="h-12 w-12 rounded object-cover" />
                          ) : null}
                          <div>
                            <p className="font-medium text-gray-900">{variant.label || variant.name}</p>
                            <p className="text-sm text-gray-500">
                              Prix: {variant.price} • Stock: {variant.stockQuantity || 0}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => void handleDeleteVariant(variant.id)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune variante active sur ce produit.</p>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Ajouter plusieurs variantes</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVariantDrafts((current) => [...current, createVariantDraft()])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une ligne
                  </Button>
                </div>

                <div className="space-y-3">
                  {variantDrafts.map((draft, index) => (
                    <div key={`variant-draft-${index}`} className="space-y-3 rounded-lg border border-gray-200 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_2fr_1fr_auto]">
                        <Input
                          placeholder="Libelle ex: Noir / XL"
                          value={draft.label}
                          onChange={(event) => handleVariantDraftChange(index, 'label', event.target.value)}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Surcout"
                          value={draft.extraPrice}
                          onChange={(event) => handleVariantDraftChange(index, 'extraPrice', event.target.value)}
                        />
                        <Input
                          placeholder="URL image variante (optionnel)"
                          value={draft.imageUrl}
                          onChange={(event) => handleVariantDraftChange(index, 'imageUrl', event.target.value)}
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="Stock initial"
                          value={draft.initialStock}
                          onChange={(event) => handleVariantDraftChange(index, 'initialStock', event.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setVariantDrafts((current) =>
                              current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)
                            )
                          }
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr] md:items-center">
                        {draft.imageUrl ? (
                          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={draft.imageUrl} alt={draft.label || 'Nouvelle variante'} className="h-12 w-12 rounded object-cover" />
                            <span className="text-xs text-gray-500">Apercu image</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Aucune image variante</div>
                        )}

                        <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
                          Prix final estime: {((variantModalProduct.basePrice || variantModalProduct.price) + Number(draft.extraPrice || 0)).toFixed(2)}
                          {' '}| Stock initial: {Number(draft.initialStock || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void handleCreateVariants()}
                    disabled={variantSubmitting}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {variantSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Creer les variantes
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminProductsPageContent />
    </ProtectedRoute>
  );
}
