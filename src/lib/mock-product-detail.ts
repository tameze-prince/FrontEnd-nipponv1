import { mockProducts } from '@/lib/mock-products';

export interface ProductReview {
  id: number | string;
  author: string;
  rating: number;
  comment: string;
  dateLabel: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  edition: string;
  price: number;
  imageLabel: string;
  stockByLocation: Record<string, number>;
}

export interface ProductDetail {
  productId: string;
  slug: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  franchise: string;
  basePrice: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  imageGallery: string[];
  variants: ProductVariant[];
  reviews: ProductReview[];
  relatedProducts: Array<{
    id: string;
    slug: string;
    name: string;
    badge: string;
    price: number;
    rating: number;
    imageLabel: string;
  }>;
}

const detailOverrides: Record<string, Omit<ProductDetail, 'productId' | 'slug' | 'name' | 'category' | 'badge' | 'basePrice' | 'originalPrice' | 'rating' | 'reviewsCount' | 'relatedProducts'>> = {
  'katana-display-stand': {
    description:
      'Support premium pour exposition de katana avec finitions japonaises, pensé pour les collectionneurs qui veulent une presence forte sur bureau ou etagere.',
    franchise: 'Samurai Heritage',
    imageGallery: ['Vue hero', 'Detail finition', 'Pose bureau', 'Edition premium'],
    variants: [
      {
        id: 'katana-black-standard',
        color: 'black',
        size: 'Standard',
        edition: 'Standard',
        price: 39900,
        imageLabel: 'Stand noir mat',
        stockByLocation: {
          '1-101': 8,
          '1-102': 3,
          '3-301': 6,
        },
      },
      {
        id: 'katana-gold-limited',
        color: 'gold',
        size: 'Large',
        edition: 'Limited',
        price: 45900,
        imageLabel: 'Stand noir et or',
        stockByLocation: {
          '1-101': 2,
          '1-102': 1,
          '3-301': 0,
        },
      },
    ],
    reviews: [
      {
        id: 1,
        author: 'Jean K.',
        rating: 5,
        comment: 'Finition impeccable, le produit rend encore mieux en vrai.',
        dateLabel: 'Il y a 2 jours',
      },
      {
        id: 2,
        author: 'Mireille A.',
        rating: 4,
        comment: 'Tres beau rendu, packaging soigne.',
        dateLabel: 'Cette semaine',
      },
      {
        id: 3,
        author: 'Lionel P.',
        rating: 5,
        comment: 'Parfait pour mon coin collector, je recommande.',
        dateLabel: 'Ce mois-ci',
      },
    ],
  },
  'demon-slayer-box': {
    description:
      'Box collector anime avec goodies exclusifs, mini artbook et accessoires pensés pour un unboxing tres visuel.',
    franchise: 'Demon Slayer',
    imageGallery: ['Box hero', 'Goodies inclus', 'Ouverture box', 'Edition promo'],
    variants: [
      {
        id: 'demon-red-standard',
        color: 'red',
        size: 'Standard',
        edition: 'Standard',
        price: 24900,
        imageLabel: 'Box rouge collector',
        stockByLocation: {
          '1-101': 12,
          '1-102': 7,
          '1-104': 4,
        },
      },
      {
        id: 'demon-black-limited',
        color: 'black',
        size: 'XL',
        edition: 'Limited',
        price: 31900,
        imageLabel: 'Box noire edition limitee',
        stockByLocation: {
          '1-101': 3,
          '1-102': 1,
          '1-104': 0,
        },
      },
    ],
    reviews: [
      {
        id: 4,
        author: 'Aline S.',
        rating: 5,
        comment: 'Le contenu vaut vraiment le prix promo.',
        dateLabel: 'Hier',
      },
      {
        id: 5,
        author: 'Kevin M.',
        rating: 4,
        comment: 'Tres cool pour offrir, livraison rapide.',
        dateLabel: 'Il y a 5 jours',
      },
    ],
  },
};

function createGenericDetail(slug: string): ProductDetail | null {
  const product = mockProducts.find((item) => item.slug === slug);

  if (!product) return null;

  const override = detailOverrides[slug];

  const variants =
    override?.variants ??
    product.colors.map((color, index) => ({
      id: `${product.slug}-${color}-${index + 1}`,
      color,
      size: index % 2 === 0 ? 'Standard' : 'Large',
      edition: index === 0 ? 'Standard' : 'Limited',
      price: product.price + index * 2500,
      imageLabel: `${product.imageLabel} ${index + 1}`,
      stockByLocation: Object.fromEntries(
        product.countryIds.flatMap((countryId) =>
          product.cityIds.map((cityId, cityIndex) => [`${countryId}-${cityId}`, Math.max(0, 9 - cityIndex - index)])
        )
      ),
    }));

  return {
    productId: String(product.id),
    slug: product.slug,
    name: product.name,
    category: product.category,
    badge: product.badge,
    description:
      override?.description ??
      `${product.name} est une fiche detail mockee pour avancer vite sur l'experience produit, avec une base solide pour brancher variants, stock et medias plus tard.`,
    franchise: override?.franchise ?? `${product.category} Universe`,
    basePrice: product.price,
    originalPrice: product.originalPrice,
    rating: product.rating,
    reviewsCount: product.reviews,
    imageGallery: override?.imageGallery ?? [
      `${product.imageLabel} hero`,
      `${product.imageLabel} detail`,
      `${product.imageLabel} packaging`,
      `${product.imageLabel} lifestyle`,
    ],
    variants,
    reviews:
      override?.reviews ??
      [
        {
          id: product.id * 100 + 1,
          author: 'Client NipponHub',
          rating: Math.round(product.rating),
          comment: 'Bonne surprise, la fiche detail pourra ensuite recevoir de vrais avis API.',
          dateLabel: 'Cette semaine',
        },
      ],
    relatedProducts:
      mockProducts
        .filter((item) => item.slug !== product.slug && item.category === product.category)
        .slice(0, 3)
        .map((item) => ({
          id: String(item.id),
          slug: item.slug,
          name: item.name,
          badge: item.badge,
          price: item.price,
          rating: item.rating,
          imageLabel: item.imageLabel,
        })),
  };
}

export function getProductDetail(slug: string) {
  return createGenericDetail(slug);
}
