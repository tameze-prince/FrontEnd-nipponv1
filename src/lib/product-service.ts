/**
 * Products API Service
 * Aligned with `/api/v1/products`.
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api-client';

export interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  label?: string;
  sku: string;
  price: number;
  extraPrice?: number;
  image?: string;
  stockQuantity?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  franchise: string;
  images: string[];
  mainImage: string;
  variants: ProductVariant[];
  colors: string[];
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isFlashSale: boolean;
  badge: string;
  basePrice?: number;
  salePrice?: number;
  quantity?: number;
  image?: string;
}

export interface ProductDetail extends Product {
  longDescription: string;
  specifications: Record<string, string>;
  reviews: Review[];
  relatedProducts: Product[];
  stockByLocation: StockLocation[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  verified: boolean;
}

export interface StockLocation {
  country: string;
  city: string;
  quantity: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  franchise?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sorting?: 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'rating';
  page?: number;
  pageSize?: number;
  countryId?: string;
  cityId?: string;
}

interface RelatedProductFilters {
  productId: string;
  category?: string;
  franchise?: string;
  countryId?: string;
  limit?: number;
}

type ProductCreateInput = {
  name: string;
  description: string;
  price?: number;
  basePrice?: number;
  salePrice?: number;
  categoryId: string;
  franchiseId?: string;
  sku?: string;
  stock?: number;
  quantity?: number;
  minStock?: number;
  stockCountryId?: string;
  colors?: string[];
  sizes?: string[];
  images?: File[];
  variants?: Array<{
    color?: string;
    size?: string;
    sku?: string;
    price?: number;
    label?: string;
    imageUrl?: string;
    extraPrice?: number;
    initialStock?: number;
  }>;
};

export interface VariantInput {
  label: string;
  extraPrice?: number;
  imageUrl?: string;
}

interface BackendFlashSale {
  discountPct: number;
  discountedPrice: number;
  endsAt: string;
}

interface BackendVariant {
  id: number;
  label: string;
  extraPrice: number;
  finalPrice: number;
  imageUrl?: string;
  stockQuantity?: number;
}

interface BackendProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  categoryName?: string;
  franchiseName?: string;
  variants: BackendVariant[];
  imageUrls: string[];
  activeFlashSale?: BackendFlashSale | null;
  active: boolean;
}

interface BackendProductPage {
  content: BackendProduct[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BulkProductPayload {
  products: Array<Record<string, unknown>>;
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toVariantName(label: string) {
  return label || 'Standard';
}

function parseVariantAttributes(label: string) {
  const [first = '', second = ''] = label
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);

  const normalizedFirst = first.toLowerCase();
  const normalizedSecond = second.toLowerCase();

  return {
    color: normalizedFirst || undefined,
    size: normalizedSecond || undefined,
  };
}

function mapVariant(variant: BackendVariant, basePrice: number): ProductVariant {
  const { color, size } = parseVariantAttributes(variant.label);

  return {
    id: String(variant.id),
    name: toVariantName(variant.label),
    label: variant.label,
    color,
    size,
    sku: slugify(variant.label || `variant-${variant.id}`),
    price: variant.finalPrice ?? basePrice + (variant.extraPrice || 0),
    extraPrice: variant.extraPrice || 0,
    image: variant.imageUrl,
    stockQuantity: variant.stockQuantity ?? 0,
  };
}

function mapProduct(product: BackendProduct): Product {
  const variants = (product.variants || []).map((variant) => mapVariant(variant, product.basePrice));
  const totalStock = variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0);
  const discountPrice = product.activeFlashSale?.discountedPrice;
  const colors = Array.from(
    new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))
  );
  const inStock = totalStock > 0;

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    description: product.description || '',
    price: discountPrice ?? product.basePrice,
    discountPrice,
    category: product.categoryName || '',
    franchise: product.franchiseName || '',
    images: product.imageUrls || [],
    mainImage: product.imageUrls?.[0] || '',
    variants,
    colors,
    stock: totalStock,
    inStock,
    rating: 0,
    reviewCount: 0,
    isFeatured: false,
    isFlashSale: Boolean(product.activeFlashSale),
    badge: product.activeFlashSale ? 'Flash sale' : inStock ? 'Disponible' : 'Rupture',
    basePrice: product.basePrice,
    salePrice: discountPrice,
    quantity: totalStock,
    image: product.imageUrls?.[0] || '',
  };
}

function mapPage(page: BackendProductPage): PaginatedResponse<Product> {
  return {
    data: page.content.map(mapProduct),
    pagination: {
      page: (page.number || 0) + 1,
      pageSize: page.size || page.content.length,
      total: page.totalElements || page.content.length,
      totalPages: page.totalPages || 1,
    },
  };
}

function buildVariantPayload(input: ProductCreateInput) {
  if (input.variants && input.variants.length > 0) {
    return input.variants.map((variant, index) => ({
        label:
          variant.label ||
          [variant.color, variant.size].filter(Boolean).join(' / ') ||
          variant.sku ||
          `Variant ${index + 1}`,
      extraPrice:
        variant.extraPrice ??
        Math.max(0, (variant.price ?? input.price ?? input.basePrice ?? 0) - (input.price ?? input.basePrice ?? 0)),
      imageUrl: variant.imageUrl || '',
    }));
  }

  const colors = input.colors?.filter(Boolean) || [];
  const sizes = input.sizes?.filter(Boolean) || [];

  if (colors.length === 0 && sizes.length === 0) {
    return [];
  }

  if (colors.length > 0 && sizes.length > 0) {
    return colors.flatMap((color) =>
      sizes.map((size) => ({
        label: `${color} / ${size}`,
        extraPrice: 0,
        imageUrl: '',
      }))
    );
  }

  return [...colors, ...sizes].map((value) => ({
    label: value,
    extraPrice: 0,
    imageUrl: '',
  }));
}

function buildProductPayload(input: ProductCreateInput, imageCount: number) {
  return {
    name: input.name,
    description: input.description,
    basePrice: input.price ?? input.basePrice ?? 0,
    purchasePrice: input.price ?? input.basePrice ?? 0,
    categoryId: Number(input.categoryId),
    franchiseId: input.franchiseId ? Number(input.franchiseId) : undefined,
    variants: buildVariantPayload(input),
    initialStock: input.variants && input.variants.length > 0 ? 0 : input.stock ?? input.quantity ?? 0,
    stockCountryId: input.stockCountryId ? Number(input.stockCountryId) : undefined,
    imageCount,
  };
}

class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const params = new URLSearchParams();

    if (filters.category) params.append('categoryId', filters.category);
    if (filters.franchise) params.append('franchiseId', filters.franchise);
    if (filters.search) params.append('keyword', filters.search);
    if (filters.countryId) params.append('countryId', filters.countryId);
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.page) params.append('page', String(Math.max(0, filters.page - 1)));
    if (filters.pageSize) params.append('size', String(filters.pageSize));

    const query = params.toString();
    const response = await apiClient.get<BackendProductPage>(
      `/api/v1/products${query ? `?${query}` : ''}`
    );

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<Product>>(response);
    }

    return {
      ...response,
      data: mapPage(response.data),
    };
  }

  async getProduct(id: string): Promise<ApiResponse<ProductDetail>> {
    const product = await this.getProductBySlug(id);
    return product;
  }

  async getProductBySlug(slug: string, countryId?: string, cityId?: string): Promise<ApiResponse<ProductDetail>> {
    const params = new URLSearchParams();

    if (countryId) {
      params.set('countryId', countryId);
    }
    if (cityId) {
      params.set('cityId', cityId);
    }

    const response = await apiClient.get<BackendProduct>(
      `/api/v1/products/${slug}${params.toString() ? `?${params.toString()}` : ''}`
    );

    if (!response.success || !response.data) {
      return failureResponse<ProductDetail>(response);
    }

    const mapped = mapProduct(response.data);
    return {
      ...response,
      data: {
        ...mapped,
        longDescription: mapped.description,
        specifications: {},
        reviews: [],
        relatedProducts: [],
        stockByLocation: [],
      },
    };
  }

  async getFeaturedProducts(limit: number = 6): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ page: 1, pageSize: limit });

    if (!response.success || !response.data) {
      return failureResponse<Product[]>(response);
    }

    return {
      ...response,
      data: response.data.data.slice(0, limit),
    };
  }

  async getFlashSaleProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get<BackendProduct[]>('/api/v1/products/flash-sales');

    if (!response.success || !response.data) {
      return failureResponse<Product[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapProduct).slice(0, limit),
    };
  }

  async getRelatedProducts({
    productId,
    category,
    franchise,
    countryId,
    limit = 4,
  }: RelatedProductFilters): Promise<ApiResponse<Product[]>> {
    const primaryResponse =
      category || franchise
        ? await this.getProducts({
            category,
            franchise,
            countryId,
            page: 1,
            pageSize: Math.max(limit * 4, 12),
          })
        : await this.getProducts({
            countryId,
            page: 1,
            pageSize: Math.max(limit * 4, 12),
          });

    if (primaryResponse.success && primaryResponse.data) {
      const related = primaryResponse.data.data
        .filter((product) => product.id !== productId)
        .slice(0, limit);

      if (related.length >= limit || (!category && !franchise)) {
        return {
          ...primaryResponse,
          data: related,
        };
      }
    }

    const response = await this.getProducts({
      countryId,
      page: 1,
      pageSize: Math.max(limit * 4, 12),
    });

    if (!response.success || !response.data) {
      return failureResponse<Product[]>(response);
    }

    return {
      ...response,
      data: response.data.data.filter((product) => product.id !== productId).slice(0, limit),
    };
  }

  async searchProducts(query: string, limit: number = 20): Promise<ApiResponse<Product[]>> {
    const response = await this.getProducts({ search: query, page: 1, pageSize: limit });

    if (!response.success || !response.data) {
      return failureResponse<Product[]>(response);
    }

    return {
      ...response,
      data: response.data.data,
    };
  }

  async getStockByLocation(
    productId: string,
    variantId: string,
    countryId: string,
    cityId: string
  ): Promise<ApiResponse<{ quantity: number; available: boolean }>> {
    void cityId;
    const product = await this.getProducts({ countryId, page: 1, pageSize: 100 });

    if (!product.success || !product.data) {
      return { success: false, error: 'Unable to load stock information' };
    }

    const targetProduct = product.data.data.find((item) => item.id === productId);
    const quantity =
      targetProduct?.variants.find((variant) => variant.id === variantId)?.stockQuantity ||
      targetProduct?.stock ||
      0;

    return {
      success: true,
      data: {
        quantity,
        available: quantity > 0,
      },
    };
  }

  async getProductReviews(productId: string, page: number = 1): Promise<ApiResponse<PaginatedResponse<Review>>> {
    void productId;
    return {
      success: true,
      data: {
        data: [],
        pagination: {
          page,
          pageSize: 0,
          total: 0,
          totalPages: 0,
        },
      },
    };
  }

  async addProductReview(
    productId: string,
    data: {
      rating: number;
      title: string;
      comment: string;
    }
  ): Promise<ApiResponse<Review>> {
    void productId;
    void data;
    return {
      success: false,
      error: 'Product reviews are not implemented in the backend yet.',
    };
  }

  async createProduct(data: ProductCreateInput): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    const images = data.images || [];

    formData.append(
      'data',
      new Blob([JSON.stringify(buildProductPayload(data, images.length))], {
        type: 'application/json',
      })
    );

    images.forEach((image) => formData.append('images', image));

    const response = await apiClient.post<BackendProduct>('/api/v1/products', formData);

    if (!response.success || !response.data) {
      return failureResponse<Product>(response);
    }

    return {
      ...response,
      data: mapProduct(response.data),
    };
  }

  async createProducts(products: ProductCreateInput[]): Promise<ApiResponse<Product[]>> {
    const formData = new FormData();
    const payload: BulkProductPayload = {
      products: products.map((product) => buildProductPayload(product, product.images?.length || 0)),
    };

    formData.append(
      'data',
      new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      })
    );

    products.forEach((product) => {
      (product.images || []).forEach((image) => formData.append('images', image));
    });

    const response = await apiClient.post<BackendProduct[]>('/api/v1/products/bulk', formData);

    if (!response.success || !response.data) {
      return failureResponse<Product[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapProduct),
    };
  }

  async updateProduct(id: string, data: ProductCreateInput): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    const images = data.images || [];

    formData.append(
      'data',
      new Blob([JSON.stringify(buildProductPayload(data, images.length))], {
        type: 'application/json',
      })
    );

    images.forEach((image) => formData.append('images', image));

    const response = await apiClient.put<BackendProduct>(`/api/v1/products/${id}`, formData);

    if (!response.success || !response.data) {
      return failureResponse<Product>(response);
    }

    return {
      ...response,
      data: mapProduct(response.data),
    };
  }

  async deleteProduct(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/products/${id}`);
  }

  async addVariant(productId: string, data: VariantInput): Promise<ApiResponse<ProductVariant>> {
    const response = await apiClient.post<BackendVariant>(`/api/v1/products/${productId}/variants`, data);

    if (!response.success || !response.data) {
      return failureResponse<ProductVariant>(response);
    }

    return {
      ...response,
      data: mapVariant(response.data, 0),
    };
  }

  async addVariants(productId: string, variants: VariantInput[]): Promise<ApiResponse<ProductVariant[]>> {
    const results = await Promise.all(variants.map((variant) => this.addVariant(productId, variant)));
    const failed = results.find((result) => !result.success);

    if (failed) {
      return {
        success: false,
        error: failed.error || 'Impossible de creer les variantes.',
        statusCode: failed.statusCode,
      };
    }

    return {
      success: true,
      data: results.flatMap((result) => (result.data ? [result.data] : [])),
    };
  }

  async deleteVariant(variantId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/products/variants/${variantId}`);
  }
}

export const productService = new ProductService();
