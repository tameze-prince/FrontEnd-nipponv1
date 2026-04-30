'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { productService, type Product } from '@/lib/product-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';

export default function OwnerProductsPage() {
  const { user } = useAuthStore();
  const { selectedCountry, selectedCity } = useLocationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const cityMismatch =
    user?.cityId &&
    selectedCity?.id &&
    user.cityId !== String(selectedCity.id);

  useEffect(() => {
    void loadProducts();
  }, [selectedCountry, selectedCity]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getProducts({
        page: 1,
        pageSize: 50,
        countryId: selectedCountry?.id?.toString(),
        cityId: selectedCity?.id?.toString(),
      });

      if (response.success && response.data) {
        setProducts(response.data.data || []);
      } else {
        toast.error(response.error || 'Erreur lors du chargement des produits');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cityMismatch) {
      setFilteredProducts([]);
      return;
    }

    const query = searchTerm.trim().toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) || product.slug?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [cityMismatch, products, searchTerm]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce produit ?')) return;

    try {
      await productService.deleteProduct(productId);
      toast.success('Produit supprime');
      setProducts((current) => current.filter((product) => product.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <ProtectedRoute requiredRoles={['owner']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
              <p className="text-gray-600">Produits disponibles pour votre pays actif</p>
            </div>
            <Button asChild>
              <a href="/owner/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Produit
              </a>
            </Button>
          </div>

          <div className="mb-6">
            {user?.city ? (
              <div className={`mb-4 rounded-lg border p-4 text-sm ${cityMismatch ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
                {cityMismatch
                  ? `Votre compte owner est rattache a ${user.city}. Selectionnez cette meme ville pour afficher les produits.`
                  : `Ville owner: ${user.city}${selectedCountry ? ` • pays actif: ${selectedCountry.name}` : ''}${selectedCity ? ` • ville active: ${selectedCity.name}` : ''}`}
              </div>
            ) : null}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Chercher un produit..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">Chargement...</CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                {cityMismatch ? 'Aucun produit visible pour cette ville' : 'Aucun produit trouve'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Slug: {product.slug}</p>
                        <p className="text-sm text-gray-600">
                          Prix: {(product.basePrice ?? product.price).toLocaleString()} XOF
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={`/owner/products/${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
