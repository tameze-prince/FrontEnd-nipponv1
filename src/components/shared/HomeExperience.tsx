'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Flame,
  Globe2,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Star,
} from 'lucide-react';

import ProductVisual from '@/components/shared/ProductVisual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { categoryService, type Category } from '@/lib/category-service';
import { franchiseService, type Franchise } from '@/lib/franchise-service';
import { productService, type Product } from '@/lib/product-service';
import { useLocationStore } from '@/stores/useLocationStore';

function formatMoney(value: number, symbol: string) {
  return `${symbol} ${value.toLocaleString()}`;
}

export default function HomeExperience() {
  const { selectedCountry } = useLocationStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<Product[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      setIsLoading(true);

      const [categoriesResponse, featuredResponse, flashResponse, franchiseResponse] =
        await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(8),
          productService.getFlashSaleProducts(6),
          franchiseService.getFranchises(1, 6),
        ]);

      if (!active) {
        return;
      }

      setCategories(categoriesResponse.success && categoriesResponse.data ? categoriesResponse.data.data : []);
      setFeaturedProducts(featuredResponse.success && featuredResponse.data ? featuredResponse.data : []);
      setFlashSales(flashResponse.success && flashResponse.data ? flashResponse.data : []);
      setFranchises(
        franchiseResponse.success && franchiseResponse.data ? franchiseResponse.data.data : []
      );
      setIsLoading(false);
    };

    void loadHomeData();

    return () => {
      active = false;
    };
  }, [selectedCountry?.id]);

  const currencySymbol = selectedCountry?.currencySymbol ?? 'FCFA';
  const headlineFlashSale = flashSales[0];
  const dynamicHighlights = useMemo(
    () => [
      {
        title: 'Categories actives',
        value: String(categories.length),
        description: 'Catalogue charge depuis l API categorie.',
      },
      {
        title: 'Produits visibles',
        value: String(featuredProducts.length),
        description: 'Selection produit reelle sur la landing page.',
      },
      {
        title: 'Flash sales',
        value: String(flashSales.length),
        description: 'Promotions actives remontees par le backend.',
      },
    ],
    [categories.length, featuredProducts.length, flashSales.length]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e8,transparent_35%),radial-gradient(circle_at_top_right,#ffe0c7,transparent_20%),linear-gradient(180deg,#fffdfb_0%,#fff8f2_45%,#ffffff_100%)] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-10 -z-10 h-72 bg-[radial-gradient(circle,#ffcfac_0%,transparent_60%)] blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="space-y-8">
            <Badge className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 hover:bg-orange-100">
              Catalogue live NipponHub
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Produits, categories et ventes flash relies directement a votre API.
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                La landing affiche maintenant les vrais produits, leurs images, leurs categories
                et les liens vers les fiches detail produit.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] px-6 text-white shadow-xl shadow-orange-200 hover:opacity-95"
              >
                <Link href="/products">
                  Explorer les produits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-orange-200 bg-white/80 px-6"
              >
                <Link href="#flash-sales">Voir les ventes flash</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {dynamicHighlights.map((item, index) => (
                <Card
                  key={item.title}
                  className={`rounded-3xl border-0 shadow-xl ${
                    index === 1
                      ? 'bg-slate-950 text-white shadow-slate-950/10'
                      : index === 2
                        ? 'bg-orange-500 text-white shadow-orange-200'
                        : 'bg-white/75 shadow-orange-100/60 backdrop-blur'
                  }`}
                >
                  <CardContent className="space-y-2 pt-6">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-70">{item.title}</p>
                    <p className="text-3xl font-black">{item.value}</p>
                    <p className={`text-sm ${index === 0 ? 'text-slate-600' : 'text-white/80'}`}>
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-4 self-start">
            <Card className="overflow-hidden rounded-[2rem] border-0 bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                    {headlineFlashSale ? 'Vente flash active' : 'Catalogue live'}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-orange-200">
                    <Clock3 className="h-4 w-4" />
                    {headlineFlashSale ? 'Disponible maintenant' : 'Chargement dynamique'}
                  </div>
                </div>

                {headlineFlashSale ? (
                  <>
                    <div className="overflow-hidden rounded-[1.5rem]">
                      <ProductVisual
                        src={headlineFlashSale.mainImage}
                        alt={headlineFlashSale.name}
                        className="h-60 w-full rounded-[1.5rem] object-cover"
                        fallbackClassName="h-60 w-full rounded-[1.5rem]"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm tracking-[0.2em] text-orange-200 uppercase">
                        Hero spotlight
                      </p>
                      <h2 className="text-3xl font-black leading-tight">{headlineFlashSale.name}</h2>
                      <p className="text-sm leading-7 text-slate-300">
                        {headlineFlashSale.description || 'Produit en promotion active sur le backend.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-white/8 p-3">
                        <Flame className="h-5 w-5 text-orange-300" />
                        <p className="mt-5 text-lg font-bold">
                          {headlineFlashSale.basePrice && headlineFlashSale.basePrice > headlineFlashSale.price
                            ? `-${Math.round(
                                ((headlineFlashSale.basePrice - headlineFlashSale.price) /
                                  headlineFlashSale.basePrice) *
                                  100
                              )}%`
                            : 'Live'}
                        </p>
                        <p className="text-xs text-slate-300">Promotion</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-3">
                        <PackageCheck className="h-5 w-5 text-orange-300" />
                        <p className="mt-5 text-lg font-bold">{headlineFlashSale.stock}</p>
                        <p className="text-xs text-slate-300">En stock</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-3">
                        <ShoppingCart className="h-5 w-5 text-orange-300" />
                        <p className="mt-5 text-lg font-bold">
                          {formatMoney(headlineFlashSale.price, currencySymbol)}
                        </p>
                        <p className="text-xs text-slate-300">Prix actuel</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] bg-white/8 p-6 text-sm text-slate-300">
                    Aucune vente flash active pour le moment.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Pays selectionne',
                  description: selectedCountry?.name || 'Le catalogue reste consultable sans pays.',
                  icon: Globe2,
                },
                {
                  title: 'Franchises visibles',
                  description: `${franchises.length} franchise(s) chargee(s) depuis l API.`,
                  icon: Sparkles,
                },
              ].map(({ title, description, icon: Icon }) => (
                <Card
                  key={title}
                  className="rounded-[1.75rem] border-0 bg-white/80 shadow-lg shadow-orange-100/50 backdrop-blur"
                >
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-orange-700 uppercase">
              Categories
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Categories visibles depuis le backend
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 rounded-[1.75rem] bg-white shadow-lg shadow-orange-100/40" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?categories=${encodeURIComponent(category.name)}`} className="block">
                <Card className="overflow-hidden rounded-[1.75rem] border-0 bg-white shadow-lg shadow-orange-100/40 transition-transform duration-300 hover:-translate-y-1">
                  <ProductVisual
                    src={category.imageUrl || category.image}
                    alt={category.name}
                    className="h-44 w-full object-cover"
                    fallbackClassName="h-44 w-full"
                  />
                  <CardContent className="space-y-3 pt-5">
                    <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50 text-orange-700">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Categorie
                    </Badge>
                    <div>
                      <h3 className="text-2xl font-black text-slate-950">{category.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {category.description || 'Voir les produits disponibles dans cette categorie.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section id="flash-sales" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-orange-700 uppercase">
              Flash sales
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Promotions actives et cliquables
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {flashSales.map((sale) => (
            <Link key={sale.id} href={`/product/${sale.slug}`} className="block">
              <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/50 transition-transform duration-300 hover:-translate-y-1">
                <ProductVisual
                  src={sale.mainImage}
                  alt={sale.name}
                  className="h-56 w-full object-cover"
                  fallbackClassName="h-56 w-full"
                />
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <Badge className="rounded-full bg-orange-100 px-3 py-1 text-orange-700 hover:bg-orange-100">
                      Vente flash
                    </Badge>
                    <p className="text-sm font-medium text-slate-500">{sale.category}</p>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-950">{sale.name}</h3>
                    {sale.basePrice && sale.basePrice > sale.price ? (
                      <p className="mt-2 text-sm text-slate-500 line-through">
                        {formatMoney(sale.basePrice, currencySymbol)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-3xl font-black text-orange-600">
                      {formatMoney(sale.price, currencySymbol)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold">{sale.stock} unite(s) disponibles</p>
                    <p className="mt-1 text-slate-500">{sale.description || 'Voir le detail complet du produit.'}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-orange-700 uppercase">
              Produits a la une
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Produits API visibles avec leurs vraies images
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <Card
              key={product.id}
              className="group rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40 transition-transform duration-300 hover:-translate-y-1"
            >
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full border-orange-200 text-orange-700">
                    {product.isFlashSale ? 'Flash sale' : product.badge}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{product.rating > 0 ? product.rating : 'Nouveau'}</span>
                  </div>
                </div>

                <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[1.5rem]">
                  <ProductVisual
                    src={product.mainImage}
                    alt={product.name}
                    className="h-52 w-full rounded-[1.5rem] object-cover"
                    fallbackClassName="h-52 w-full rounded-[1.5rem]"
                  />
                </Link>

                <div>
                  <p className="text-sm text-slate-500">{product.category}</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{product.name}</p>
                  <p className="mt-3 text-2xl font-black text-slate-950">
                    {formatMoney(product.price, currencySymbol)}
                  </p>
                </div>

                <Button asChild className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800">
                  <Link href={`/product/${product.slug}`}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Voir le produit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
