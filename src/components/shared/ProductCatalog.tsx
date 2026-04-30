'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApiProducts } from '@/components/hooks/useApiProducts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductVisual from '@/components/shared/ProductVisual';
import { categoryService } from '@/lib/category-service';
import {
  productCategories,
  productColors,
  sortOptions,
  type ProductSort,
} from '@/lib/product-options';
import { type Product } from '@/lib/product-service';
import { useCartStore } from '@/stores/useCartStore';
import { useLocationStore } from '@/stores/useLocationStore';

const PAGE_SIZE = 6;
const API_FETCH_SIZE = 60;

type CatalogProduct = Product & {
  imageLabel?: string;
};

export interface ProductCatalogInitialState {
  search: string;
  minPrice: string;
  maxPrice: string;
  sort: ProductSort;
  categories: string[];
  colors: string[];
  inStock: boolean;
  flashSale: boolean;
  page: number;
}

interface ProductCatalogProps {
  initialState: ProductCatalogInitialState;
}

function buildQueryString(state: ProductCatalogInitialState) {
  const params = new URLSearchParams();

  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.minPrice.trim()) params.set('minPrice', state.minPrice.trim());
  if (state.maxPrice.trim()) params.set('maxPrice', state.maxPrice.trim());
  if (state.sort !== 'popularity') params.set('sort', state.sort);
  if (state.categories.length) params.set('categories', state.categories.join(','));
  if (state.colors.length) params.set('colors', state.colors.join(','));
  if (state.inStock) params.set('inStock', 'true');
  if (state.flashSale) params.set('flashSale', 'true');
  if (state.page > 1) params.set('page', String(state.page));

  return params.toString();
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function getDisplayImageLabel(product: CatalogProduct) {
  return product.imageLabel || product.name;
}

function getDisplayPrice(product: CatalogProduct) {
  return product.price;
}

function getDisplayOriginalPrice(product: CatalogProduct) {
  if (product.basePrice && product.basePrice > product.price) {
    return product.basePrice;
  }

  return undefined;
}

export default function ProductCatalog({ initialState }: ProductCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { addToCart } = useCartStore();
  const { selectedCountry, selectedCity } = useLocationStore();

  const [searchInput, setSearchInput] = useState(initialState.search);
  const [filters, setFilters] = useState<ProductCatalogInitialState>(initialState);
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    ...productCategories,
  ]);
  const [categoryIdsByName, setCategoryIdsByName] = useState<Record<string, string>>({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((current) => {
        if (current.search === searchInput) return current;
        return {
          ...current,
          search: searchInput,
          page: 1,
        };
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const queryString = buildQueryString(filters);
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [filters, pathname, router]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      const response = await categoryService.getCategories();

      if (!active || !response.success || !response.data) {
        return;
      }

      const nextCategories = response.data.data.map((category) => category.name).filter(Boolean);
      const nextMap = Object.fromEntries(
        response.data.data.map((category) => [category.name, category.id])
      );

      if (nextCategories.length > 0) {
        setAvailableCategories(nextCategories);
        setCategoryIdsByName(nextMap);
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const selectedCategoryId =
    filters.categories.length === 1 ? categoryIdsByName[filters.categories[0]] : undefined;

  const {
    products: apiProducts,
    isLoading,
    error,
    pagination,
  } = useApiProducts({
    categoryId: selectedCategoryId,
    keyword: filters.search,
    page: 1,
    pageSize: API_FETCH_SIZE,
    cityId: selectedCity?.id.toString(),
    enabled: Boolean(selectedCountry && selectedCity),
  });

  const sourceProducts = useMemo<CatalogProduct[]>(() => {
    return apiProducts as CatalogProduct[];
  }, [apiProducts]);

  const filteredProducts = useMemo(() => {
    const minAmount = parseAmount(filters.minPrice);
    const maxAmount = parseAmount(filters.maxPrice);
    const searchTerm = filters.search.trim().toLowerCase();

    let items = sourceProducts.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.badge.toLowerCase().includes(searchTerm);

      const matchesCategory =
        filters.categories.length === 0 || filters.categories.includes(product.category);

      const matchesColors =
        filters.colors.length === 0 ||
        filters.colors.some((color) => product.colors.includes(color));

      const matchesMin = minAmount === null || getDisplayPrice(product) >= minAmount;
      const matchesMax = maxAmount === null || getDisplayPrice(product) <= maxAmount;
      const matchesStock = !filters.inStock || product.inStock;
      const matchesFlash = !filters.flashSale || product.isFlashSale;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesColors &&
        matchesMin &&
        matchesMax &&
        matchesStock &&
        matchesFlash
      );
    });

    items = [...items].sort((a, b) => {
      switch (filters.sort) {
        case 'price-asc':
          return getDisplayPrice(a) - getDisplayPrice(b);
        case 'price-desc':
          return getDisplayPrice(b) - getDisplayPrice(a);
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return Number(b.id) - Number(a.id);
        case 'popularity':
        default:
          return b.reviewCount - a.reviewCount;
      }
    });

    return items;
  }, [filters, sourceProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleArrayFilter = (key: 'categories' | 'colors', value: string) => {
    setFilters((current) => {
      const exists = current[key].includes(value);
      return {
        ...current,
        [key]: exists ? current[key].filter((item) => item !== value) : [...current[key], value],
        page: 1,
      };
    });
  };

  const setBooleanFilter = (key: 'inStock' | 'flashSale') => {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
      page: 1,
    }));
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: 'popularity',
      categories: [],
      colors: [],
      inStock: false,
      flashSale: false,
      page: 1,
    });
  };

  const updatePriceField = (key: 'minPrice' | 'maxPrice', value: string) => {
    if (!/^\d*$/.test(value)) return;

    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));
  };

  const goToPage = (page: number) => {
    setFilters((current) => ({
      ...current,
      page: Math.min(Math.max(page, 1), totalPages),
    }));
  };

  const handleAddToCart = (product: CatalogProduct) => {
    const firstVariant = product.variants[0];

    if (!firstVariant) {
      toast.error('Aucune variante disponible pour ce produit');
      return;
    }

    addToCart({
      productId: product.id,
      productSlug: product.slug,
      variantId: firstVariant.id,
      variantLabel: firstVariant.name,
      name: product.name,
      price: firstVariant.price,
      currencySymbol: selectedCountry?.currencySymbol ?? 'FCFA',
      image: getDisplayImageLabel(product),
    });

    toast.success('Produit ajoute au panier', {
      description: product.name,
    });
  };

  const locationLabel =
    selectedCountry && selectedCity
      ? `${selectedCity.name}, ${selectedCountry.name}`
      : 'Toutes les zones';

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/50">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Filtres
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Catalogue</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Filter className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-orange-600" />
                {locationLabel}
              </div>
              <p className="mt-2 text-slate-500">
                Le catalogue se synchronise maintenant avec l&apos;API sur la localisation choisie.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Recherche</label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Nom produit, categorie, badge..."
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Prix min</label>
                <input
                  value={filters.minPrice}
                  onChange={(event) => updatePriceField('minPrice', event.target.value)}
                  placeholder="0"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Prix max</label>
                <input
                  value={filters.maxPrice}
                  onChange={(event) => updatePriceField('maxPrice', event.target.value)}
                  placeholder="50000"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Categories</p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => {
                  const active = filters.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleArrayFilter('categories', category)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Couleurs</p>
              <div className="grid grid-cols-2 gap-2">
                {productColors.map((color) => {
                  const active = filters.colors.includes(color.value);
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => toggleArrayFilter('colors', color.value)}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Statut</p>
              <button
                type="button"
                onClick={() => setBooleanFilter('inStock')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  filters.inStock
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                }`}
              >
                En stock uniquement
                <span>{filters.inStock ? 'Oui' : 'Non'}</span>
              </button>
              <button
                type="button"
                onClick={() => setBooleanFilter('flashSale')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                  filters.flashSale
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                }`}
              >
                Flash sales
                <span>{filters.flashSale ? 'Oui' : 'Non'}</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-11 w-full rounded-full border-orange-200"
            >
              Reinitialiser
            </Button>
          </CardContent>
        </Card>
      </aside>

      <section className="space-y-6">
        <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff3e8,#ffffff,#fff1e3)] shadow-xl shadow-orange-100/40">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Liste produits
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Trouvez votre prochain coup de coeur japonais
                </h1>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm text-slate-600">
                <Sparkles className="h-4 w-4 text-orange-500" />
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouves
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl text-sm leading-7 text-slate-600">
                <p>Le catalogue affiche maintenant les produits reels renvoyes par l&apos;API.</p>
                {error ? (
                  <p className="mt-2 font-medium text-red-700">{error}</p>
                ) : null}
                {!error && pagination.total > sourceProducts.length ? (
                  <p className="mt-2 text-slate-500">
                    {pagination.total} produits disponibles sur le backend, dont {sourceProducts.length}{' '}
                    charges pour cette vue.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700" htmlFor="sort-products">
                  Trier
                </label>
                <select
                  id="sort-products"
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sort: event.target.value as ProductSort,
                      page: 1,
                    }))
                  }
                  className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-300"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Card
                key={`catalog-skeleton-${index}`}
                className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30"
              >
                <CardContent className="space-y-5 pt-6">
                  <div className="h-6 w-24 rounded-full bg-slate-100" />
                  <div className="h-40 rounded-[1.5rem] bg-slate-100" />
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 rounded bg-slate-100" />
                    <div className="h-4 w-1/2 rounded bg-slate-100" />
                    <div className="h-10 rounded-full bg-slate-100" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <Card className="rounded-[2rem] border-0 bg-white shadow-lg shadow-orange-100/40">
            <CardContent className="space-y-4 py-12 text-center">
              <p className="text-2xl font-black text-slate-950">Aucun produit ne correspond</p>
              <p className="mx-auto max-w-lg text-sm leading-7 text-slate-500">
                Essayez d&apos;enlever un filtre, de changer la localisation, ou de relancer une
                recherche plus large.
              </p>
              <div className="flex justify-center">
                <Button type="button" onClick={resetFilters} className="rounded-full">
                  Repartir de zero
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedProducts.map((product) => (
              <Card
                key={product.id}
                className="group rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40 transition-transform duration-300 hover:-translate-y-1"
              >
                <CardContent className="space-y-5 pt-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-full border-orange-200 text-orange-700">
                      {product.badge}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">
                        {product.rating > 0 ? product.rating : 'Nouveau'}
                      </span>
                    </div>
                  </div>

                  <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[1.5rem]">
                    <ProductVisual
                      src={product.mainImage}
                      alt={product.name}
                      className="h-56 w-full rounded-[1.5rem] object-cover"
                      fallbackClassName="h-56 w-full rounded-[1.5rem] border border-dashed border-orange-200/80"
                    />
                  </Link>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-slate-500">{getDisplayImageLabel(product)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.colors.length > 0 ? (
                        product.colors.map((colorValue) => {
                          const color = productColors.find((item) => item.value === colorValue);
                          return (
                            <span
                              key={colorValue}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-slate-200"
                                style={{ backgroundColor: color?.hex ?? '#e5e7eb' }}
                              />
                              {color?.label ?? colorValue}
                            </span>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                          Variante standard
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        {getDisplayOriginalPrice(product) ? (
                          <p className="text-sm text-slate-400 line-through">
                            {selectedCountry?.currencySymbol ?? 'FCFA'} {getDisplayOriginalPrice(product)}
                          </p>
                        ) : null}
                        <p className="text-2xl font-black text-slate-950">
                          {selectedCountry?.currencySymbol ?? 'FCFA'} {getDisplayPrice(product)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.inStock
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {product.inStock ? 'En stock' : 'Rupture'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Panier
                    </Button>
                    <Button asChild type="button" variant="outline" className="rounded-full">
                      <Link href={`/product/${product.slug}`}>Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-lg shadow-orange-100/30 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Page {currentPage} sur {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                    currentPage === page
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-50 text-slate-700 hover:bg-orange-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-full"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
