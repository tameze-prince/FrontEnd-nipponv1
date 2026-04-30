'use client';

import { useEffect, useState } from 'react';
import { productService, type Product } from '@/lib/product-service';
import { useLocationStore } from '@/stores/useLocationStore';

interface UseApiProductsOptions {
  categoryId?: string;
  franchiseId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  cityId?: string;
  enabled?: boolean;
}

export function useApiProducts(options: UseApiProductsOptions = {}) {
  const { selectedCountry, selectedCity } = useLocationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: options.page || 1,
    pageSize: options.pageSize || 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await productService.getProducts({
          category: options.categoryId,
          franchise: options.franchiseId,
          search: options.keyword,
          page: options.page || 1,
          pageSize: options.pageSize || 12,
          countryId: selectedCountry?.id.toString(),
          cityId: options.cityId || selectedCity?.id.toString(),
        });

        if (!response.success || !response.data) {
          setError(response.error || 'Failed to load products');
          setProducts([]);
          return;
        }

        setProducts(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          pageSize: response.data.pagination.pageSize,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, [
    options.categoryId,
    options.cityId,
    options.enabled,
    options.franchiseId,
    options.keyword,
    options.page,
    options.pageSize,
    selectedCity?.id,
    selectedCountry?.id,
  ]);

  return {
    products,
    isLoading,
    error,
    pagination,
  };
}
