'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

import ProductVisual from '@/components/shared/ProductVisual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  productService,
  type Product,
  type ProductDetail,
  type ProductVariant,
} from '@/lib/product-service';
import { useCartStore } from '@/stores/useCartStore';
import { useLocationStore } from '@/stores/useLocationStore';

interface ProductDetailExperienceProps {
  slug: string;
  initialVariantId?: string;
}

interface UiVariant {
  id: string;
  color: string;
  size: string;
  edition: string;
  price: number;
  image: string;
  imageLabel: string;
  stockQuantity: number;
}

interface UiReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  dateLabel: string;
}

interface UiRelatedProduct {
  id: string;
  slug: string;
  name: string;
  badge: string;
  price: number;
  rating: number;
  image: string;
  imageLabel: string;
}

interface UiProductDetail {
  productId: string;
  slug: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  franchise: string;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  imageGallery: Array<{ src: string; label: string }>;
  variants: UiVariant[];
  reviews: UiReview[];
  relatedProducts: UiRelatedProduct[];
}

function formatReviewDate(createdAt?: string) {
  if (!createdAt) {
    return 'Avis recent';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Avis recent';
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getEditionLabel(variant: ProductVariant) {
  return variant.name || [variant.color, variant.size].filter(Boolean).join(' / ') || 'Standard';
}

function colorToHex(value: string) {
  const normalized = value.trim().toLowerCase();
  const palette: Record<string, string> = {
    black: '#111827',
    blanc: '#f8fafc',
    white: '#f8fafc',
    blue: '#2563eb',
    bleu: '#2563eb',
    red: '#dc2626',
    rouge: '#dc2626',
    green: '#16a34a',
    vert: '#16a34a',
    yellow: '#facc15',
    jaune: '#facc15',
    orange: '#f97316',
    violet: '#7c3aed',
    purple: '#7c3aed',
    rose: '#f472b6',
    pink: '#f472b6',
    gris: '#6b7280',
    gray: '#6b7280',
    grey: '#6b7280',
  };

  return palette[normalized] || '#e5e7eb';
}

function buildUiVariant(
  product: ProductDetail,
  variant: ProductVariant,
  index: number,
  fallbackImage: string
): UiVariant {
  return {
    id: variant.id,
    color: variant.color || 'default',
    size: variant.size || 'Standard',
    edition: getEditionLabel(variant),
    price: variant.price,
    image: variant.image || fallbackImage,
    imageLabel: `${product.name} ${index + 1}`,
    stockQuantity: variant.stockQuantity ?? product.stock,
  };
}

function buildRelatedProducts(products: Product[]): UiRelatedProduct[] {
  return products.map((product, index) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    badge: product.badge,
    price: product.price,
    rating: product.rating,
    image: product.mainImage,
    imageLabel: product.mainImage ? `Visuel ${index + 1}` : product.name,
  }));
}

function adaptApiProductDetail(
  detail: ProductDetail,
  relatedProducts: Product[]
): UiProductDetail {
  const gallerySources =
    detail.images.length > 0 ? detail.images : detail.mainImage ? [detail.mainImage] : [];
  const fallbackImage = detail.mainImage || detail.images[0] || '';
  const variants =
    detail.variants.length > 0
      ? detail.variants.map((variant, index) =>
          buildUiVariant(detail, variant, index, variant.image || gallerySources[index] || fallbackImage)
        )
      : [
          {
            id: `${detail.slug}-default`,
            color: detail.colors[0] || 'default',
            size: 'Standard',
            edition: 'Standard',
            price: detail.price,
            image: fallbackImage,
            imageLabel: detail.name,
            stockQuantity: detail.stock,
          },
        ];

  return {
    productId: detail.id,
    slug: detail.slug,
    name: detail.name,
    category: detail.category,
    badge: detail.badge,
    description: detail.longDescription || detail.description,
    franchise: detail.franchise || 'NipponHub',
    originalPrice:
      detail.basePrice && detail.basePrice > detail.price ? detail.basePrice : undefined,
    rating: detail.rating,
    reviewsCount: detail.reviewCount,
    imageGallery: Array.from(
      new Set([
        ...gallerySources,
        ...variants.map((variant) => variant.image).filter(Boolean),
      ])
    ).map((src, index) => ({
      src,
      label: `Visuel ${index + 1}`,
    })),
    variants,
    reviews:
      detail.reviews.length > 0
        ? detail.reviews.map((review) => ({
            id: review.id,
            author: review.userName,
            rating: review.rating,
            comment: review.comment,
            dateLabel: formatReviewDate(review.createdAt),
          }))
        : [
            {
              id: `${detail.id}-review-placeholder`,
              author: 'Client NipponHub',
              rating: detail.rating || 5,
              comment:
                'Les avis clients seront affiches ici des qu ils seront exposes par l API.',
              dateLabel: 'Bientot',
            },
          ],
    relatedProducts: buildRelatedProducts(relatedProducts),
  };
}

export default function ProductDetailExperience({
  slug,
  initialVariantId,
}: ProductDetailExperienceProps) {
  const { addToCart } = useCartStore();
  const { selectedCountry, selectedCity } = useLocationStore();

  const [detail, setDetail] = useState<UiProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manualVariantId, setManualVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      setIsLoading(true);
      setLoadError(null);

      const response = await productService.getProductBySlug(
        slug,
        selectedCountry?.id?.toString(),
        selectedCity?.id?.toString()
      );

      if (response.success && response.data) {
        const relatedResponse = await productService.getRelatedProducts({
          productId: response.data.id,
          category: response.data.category || undefined,
          franchise: response.data.franchise || undefined,
          countryId: selectedCountry?.id?.toString(),
          limit: 3,
        });
        const uiDetail = adaptApiProductDetail(
          response.data,
          relatedResponse.success && relatedResponse.data ? relatedResponse.data : []
        );

        if (active) {
          setDetail(uiDetail);
          setSelectedImageSrc(
            uiDetail.variants.find((variant) => variant.id === initialVariantId)?.image ||
              uiDetail.variants[0]?.image ||
              uiDetail.imageGallery[0]?.src ||
              ''
          );
          setIsLoading(false);
        }
        return;
      }

      if (active) {
        setDetail(null);
        setLoadError(response.error || 'Produit introuvable');
        setIsLoading(false);
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [initialVariantId, selectedCity?.id, selectedCountry?.id, slug]);

  const selectedVariantId =
    manualVariantId || initialVariantId || detail?.variants[0]?.id || '';

  const selectedVariant =
    detail?.variants.find((variant) => variant.id === selectedVariantId) ?? detail?.variants[0];

  const stockForLocation = selectedVariant?.stockQuantity ?? 0;

  const carouselImages = useMemo(() => {
    if (!detail) return [];

    return detail.imageGallery.length > 0
      ? detail.imageGallery
      : selectedVariant?.image
        ? [{ src: selectedVariant.image, label: selectedVariant.imageLabel }]
        : [];
  }, [detail, selectedVariant]);

  const selectedImageIndex = Math.max(
    0,
    carouselImages.findIndex((image) => image.src === selectedImageSrc)
  );

  const stockMessage = useMemo(() => {
    if (stockForLocation <= 0) return 'En rupture pour cette localisation';
    if (stockForLocation < 4) return `Plus que ${stockForLocation} unite(s) restantes`;
    if (stockForLocation < 10) return `Stock limite: ${stockForLocation} unite(s)`;
    return 'En stock';
  }, [stockForLocation]);

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }

    setSelectedImageSrc(selectedVariant.image || detail?.imageGallery[0]?.src || '');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('variant') !== selectedVariant.id) {
        url.searchParams.set('variant', selectedVariant.id);
        window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
      }
    }
  }, [detail?.imageGallery, selectedVariant?.id]);

  const handleAddToCart = () => {
    if (!detail || !selectedVariant || stockForLocation <= 0) return;

    addToCart({
      productId: detail.productId,
      productSlug: detail.slug,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.edition,
      name: `${detail.name} - ${selectedVariant.edition}`,
      price: selectedVariant.price,
      quantity,
      image: selectedVariant.image || detail.imageGallery[0]?.src || detail.name,
      currencySymbol: selectedCountry?.currencySymbol ?? 'FCFA',
    });

    toast.success('Produit ajoute au panier', {
      description: `${detail.name} x${quantity}`,
    });
  };

  const toggleFavorite = () => {
    if (!detail) return;

    setFavorite((current) => !current);
    toast.success(favorite ? 'Retire des favoris' : 'Ajoute aux favoris', {
      description: detail.name,
    });
  };

  const shareProduct = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copie');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const showPreviousImage = () => {
    if (carouselImages.length === 0) return;
    const nextIndex = selectedImageIndex <= 0 ? carouselImages.length - 1 : selectedImageIndex - 1;
    setSelectedImageSrc(carouselImages[nextIndex].src);
  };

  const showNextImage = () => {
    if (carouselImages.length === 0) return;
    const nextIndex = selectedImageIndex >= carouselImages.length - 1 ? 0 : selectedImageIndex + 1;
    setSelectedImageSrc(carouselImages[nextIndex].src);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_55%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-12 w-48 rounded-full bg-slate-100" />
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="h-[520px] rounded-[2rem] bg-slate-100" />
            <div className="h-[520px] rounded-[2rem] bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!detail || !selectedVariant) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_55%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
            <CardContent className="space-y-5 py-14 text-center">
              <h2 className="text-3xl font-black text-slate-950">Produit introuvable</h2>
              <p className="mx-auto max-w-lg text-sm leading-7 text-slate-500">
                {loadError || 'Impossible de charger cette fiche produit pour le moment.'}
              </p>
              <div className="flex justify-center">
                <Button asChild className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
                  <Link href="/products">Retour au catalogue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_55%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au catalogue
            </Link>
          </Button>
          <Badge className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 hover:bg-orange-100">
            {detail.badge}
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-4">
            <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff2e6,#ffffff,#ffe5cf)] shadow-xl shadow-orange-100/40">
              <CardContent className="space-y-4 p-6">
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <ProductVisual
                    src={selectedImageSrc || selectedVariant.image || carouselImages[0]?.src}
                    alt={detail.name}
                    className="h-[420px] w-full rounded-[1.5rem] object-cover"
                    fallbackClassName="h-[420px] w-full rounded-[1.5rem] border border-dashed border-orange-200/80"
                    labelClassName="max-w-md text-2xl font-black tracking-tight text-slate-950"
                  />
                  {carouselImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousImage}
                        className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white"
                        aria-label="Image precedente"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextImage}
                        className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition hover:bg-white"
                        aria-label="Image suivante"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {carouselImages.map((image) => {
                    const active = image.src === (selectedImageSrc || selectedVariant.image);
                    return (
                      <button
                        key={image.src || image.label}
                        type="button"
                        onClick={() => setSelectedImageSrc(image.src)}
                        className={`rounded-[1.25rem] border p-4 text-sm font-medium ${
                          active
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <ProductVisual
                          src={image.src}
                          alt={image.label}
                          className="h-20 w-full rounded-xl object-cover"
                          fallbackClassName="h-20 w-full rounded-xl"
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 rounded-[1.5rem] bg-white/80 p-4">
                  <p className="text-sm font-semibold text-slate-700">Variantes</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detail.variants.map((variant) => {
                      const active = variant.id === selectedVariant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setManualVariantId(variant.id);
                            setSelectedImageSrc(variant.image || carouselImages[0]?.src || '');
                          }}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            active
                              ? 'border-orange-400 bg-orange-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-orange-300'
                          }`}
                        >
                          <ProductVisual
                            src={variant.image}
                            alt={variant.edition}
                            className="h-14 w-14 rounded-xl object-cover"
                            fallbackClassName="h-14 w-14 rounded-xl"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-950">
                              {variant.edition}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {selectedCountry?.currencySymbol ?? 'FCFA'} {variant.price} | Stock {variant.stockQuantity}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                {detail.category}
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {detail.name}
              </h1>
              <div className="flex items-center gap-2 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">{detail.rating || 'Nouveau'}</span>
                <span className="text-sm text-slate-500">({detail.reviewsCount} avis)</span>
              </div>
            </div>

            <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
              <CardContent className="space-y-6 pt-6">
                <div>
                  {detail.originalPrice ? (
                    <p className="text-sm text-slate-400 line-through">
                      {selectedCountry?.currencySymbol ?? 'FCFA'} {detail.originalPrice}
                    </p>
                  ) : null}
                  <p className="text-4xl font-black text-slate-950">
                    {selectedCountry?.currencySymbol ?? 'FCFA'} {selectedVariant.price}
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-4">
                  <p
                    className={`text-sm font-semibold ${
                      stockForLocation > 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {stockMessage}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCity && selectedCountry
                      ? `Verification pour ${selectedCity.name}, ${selectedCountry.name}`
                      : 'Selection basee sur le meilleur stock disponible'}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(detail.variants.map((variant) => variant.color))).map((colorValue) => {
                      const active = selectedVariant.color === colorValue;
                      return (
                        <button
                          key={colorValue}
                          type="button"
                          onClick={() => {
                            const next = detail.variants.find((variant) => variant.color === colorValue);
                            if (next) setManualVariantId(next.id);
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                            active
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-white/30"
                            style={{ backgroundColor: colorToHex(colorValue) }}
                          />
                          {colorValue}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Taille</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(detail.variants.map((variant) => variant.size))).map((size) => {
                      const variant = detail.variants.find(
                        (item) => item.size === size && item.color === selectedVariant.color
                      );
                      const active = selectedVariant.size === size;
                      const disabled = !variant;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (variant) setManualVariantId(variant.id);
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            active
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Edition</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(detail.variants.map((variant) => variant.edition))).map((edition) => {
                      const variant = detail.variants.find(
                        (item) =>
                          item.edition === edition &&
                          item.color === selectedVariant.color &&
                          item.size === selectedVariant.size
                      );
                      const active = selectedVariant.edition === edition;
                      return (
                        <button
                          key={edition}
                          type="button"
                          onClick={() => {
                            if (variant) setManualVariantId(variant.id);
                          }}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            active
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                          }`}
                        >
                          {edition}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-950 p-4 text-white sm:grid-cols-2">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-orange-200 uppercase">Franchise</p>
                    <p className="mt-2 text-sm">{detail.franchise}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.2em] text-orange-200 uppercase">Categorie</p>
                    <p className="mt-2 text-sm">{detail.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-slate-700">Quantite</p>
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="inline-flex h-11 w-11 items-center justify-center text-slate-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.min(Math.max(stockForLocation, 1), current + 1))
                      }
                      className="inline-flex h-11 w-11 items-center justify-center text-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={stockForLocation <= 0}
                    className="h-12 rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white sm:col-span-2 hover:opacity-95"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ajouter au panier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleFavorite}
                    className="h-12 rounded-full"
                  >
                    {favorite ? <Check className="mr-2 h-4 w-4" /> : <Heart className="mr-2 h-4 w-4" />}
                    Favoris
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={shareProduct}
                  className="h-11 rounded-full text-slate-600"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager ce produit
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="rounded-[2rem] border-0 bg-white shadow-lg shadow-orange-100/30">
            <CardContent className="space-y-5 pt-6">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Description
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Ce que le produit raconte</h2>
              </div>
              <p className="max-w-3xl text-sm leading-8 text-slate-600">{detail.description}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff3e8,#ffffff,#fff7f1)] shadow-lg shadow-orange-100/30">
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Avis clients
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Ils en pensent quoi</h2>
              </div>
              <div className="space-y-3">
                {detail.reviews.map((review) => (
                  <div key={review.id} className="rounded-[1.5rem] border border-orange-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{review.author}</p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-400">{review.dateLabel}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
              Produits similaires
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Continuez l&apos;exploration</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {detail.relatedProducts.map((product) => (
              <Card
                key={product.id}
                className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30"
              >
                <CardContent className="space-y-4 pt-6">
                  <Badge variant="outline" className="rounded-full border-orange-200 text-orange-700">
                    {product.badge}
                  </Badge>
                  <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[1.5rem]">
                    <ProductVisual
                      src={product.image}
                      alt={product.name}
                      className="h-48 w-full rounded-[1.5rem] object-cover"
                      fallbackClassName="h-48 w-full rounded-[1.5rem] border border-dashed border-orange-200/80"
                    />
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-slate-950">
                      {selectedCountry?.currencySymbol ?? 'FCFA'} {product.price}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{product.rating || 'Nouveau'}</span>
                    </div>
                  </div>
                  <Button asChild className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800">
                    <Link href={`/product/${product.slug}`}>Voir le produit</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
