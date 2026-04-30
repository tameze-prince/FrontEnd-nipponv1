export type ProductSort =
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating';

export const productCategories = [
  'Manga',
  'Anime',
  'Collectibles',
  'Tech',
  'Snacks',
  'Maison',
] as const;

export const productColors = [
  { value: 'black', label: 'Noir', hex: '#111827' },
  { value: 'white', label: 'Blanc', hex: '#f8fafc' },
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'blue', label: 'Bleu', hex: '#2563eb' },
  { value: 'gold', label: 'Or', hex: '#f59e0b' },
  { value: 'pink', label: 'Rose', hex: '#ec4899' },
] as const;

export const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'popularity', label: 'Popularite' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix decroissant' },
  { value: 'newest', label: 'Nouveautes' },
  { value: 'rating', label: 'Meilleure note' },
];
