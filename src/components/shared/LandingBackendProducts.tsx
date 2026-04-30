'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductVisual from '@/components/shared/ProductVisual';
import { productService, type Product } from '@/lib/product-service';
import { useCartStore } from '@/stores/useCartStore';
import { useLocationStore } from '@/stores/useLocationStore';

function formatMoney(value: number, symbol: string) {
  return `${symbol} ${value.toLocaleString()}`;
}

export function LandingBackendProducts() {
  const { selectedCountry } = useLocationStore();
  const { addToCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setIsLoading(true);
      const [featuredResponse, flashResponse] = await Promise.all([
        productService.getFeaturedProducts(4),
        productService.getFlashSaleProducts(3),
      ]);

      if (!active) {
        return;
      }

      setProducts(featuredResponse.success && featuredResponse.data ? featuredResponse.data : []);
      setFlashSales(flashResponse.success && flashResponse.data ? flashResponse.data : []);
      setIsLoading(false);
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [selectedCountry?.id]);

  const handleAddToCart = (product: Product) => {
    const variant = product.variants[0];

    if (!variant) {
      toast.error('Aucune variante disponible pour ce produit');
      return;
    }

    addToCart({
      productId: product.id,
      productSlug: product.slug,
      variantId: variant.id,
      variantLabel: variant.name,
      name: product.name,
      price: variant.price,
      currencySymbol: selectedCountry?.currencySymbol ?? 'FCFA',
      image: product.mainImage || product.name,
    });

    toast.success('Produit ajoute au panier', {
      description: product.name,
    });
  };

  const visibleProducts = products.length > 0 ? products : flashSales;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-orange-700 uppercase">
            Catalogue live
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Produits disponibles depuis le backend
          </h2>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-full border-orange-200 bg-white">
          <Link href="/products">Ouvrir tout le catalogue</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
              <CardContent className="space-y-5 pt-6">
                <div className="h-6 w-24 rounded-full bg-slate-100" />
                <div className="h-36 rounded-[1.5rem] bg-slate-100" />
                <div className="h-6 w-3/4 rounded bg-slate-100" />
                <div className="h-10 rounded-full bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <Card className="mt-8 rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Aucun produit backend disponible pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <Card
              key={product.id}
              className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40 transition-transform duration-300 hover:-translate-y-1"
            >
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full border-orange-200 text-orange-700">
                    {product.isFlashSale ? 'Flash sale' : product.badge}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{product.rating > 0 ? product.rating : 'New'}</span>
                  </div>
                </div>

                <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[1.5rem]">
                  <ProductVisual
                    src={product.mainImage}
                    alt={product.name}
                    className="h-48 w-full rounded-[1.5rem] object-cover"
                    fallbackClassName="h-48 w-full rounded-[1.5rem] border border-dashed border-orange-200/80"
                  />
                </Link>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{product.category || 'NipponHub'}</p>
                    <p className="text-2xl font-black text-slate-950">
                      {formatMoney(product.price, selectedCountry?.currencySymbol ?? 'FCFA')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.stock} en stock
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>

                <Button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
