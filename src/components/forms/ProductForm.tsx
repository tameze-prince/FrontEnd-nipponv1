'use client';

import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { validateRequired, validatePrice, validateMinLength } from '@/lib/form-validation';
import { Button } from '@/components/ui/button';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  categoryId: string;
  sku: string;
  barcode?: string;
  stock: number;
  minStock: number;
  colors: string[];
  sizes: string[];
  weight?: number;
  dimensions?: string;
  images: File[];
}

interface ProductFormProps {
  categories: Array<{ id: string; name: string }>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<ProductFormData>;
  isEdit?: boolean;
}

export default function ProductForm({
  categories,
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(
    initialData
      ? {
          name: initialData.name || '',
          description: initialData.description || '',
          price: initialData.price || 0,
          salePrice: initialData.salePrice,
          categoryId: initialData.categoryId || '',
          sku: initialData.sku || '',
          barcode: initialData.barcode || '',
          stock: initialData.stock || 0,
          minStock: initialData.minStock || 10,
          colors: initialData.colors || [],
          sizes: initialData.sizes || [],
          weight: initialData.weight,
          dimensions: initialData.dimensions || '',
          images: [],
        }
      : {
          name: '',
          description: '',
          price: 0,
          categoryId: '',
          sku: '',
          stock: 0,
          minStock: 10,
          colors: [],
          sizes: [],
          images: [],
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'Product name is required';
    }

    if (!validateRequired(formData.description)) {
      newErrors.description = 'Description is required';
    } else if (!validateMinLength(formData.description, 10)) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!validatePrice(formData.price)) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.salePrice && !validatePrice(formData.salePrice)) {
      newErrors.salePrice = 'Sale price must be greater than 0';
    }

    if (formData.salePrice && formData.salePrice >= formData.price) {
      newErrors.salePrice = 'Sale price must be less than regular price';
    }

    if (!validateRequired(formData.categoryId)) {
      newErrors.categoryId = 'Category is required';
    }

    if (!validateRequired(formData.sku)) {
      newErrors.sku = 'SKU is required';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (!isEdit && formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'salePrice' || name === 'stock' || name === 'minStock' || name === 'weight' ? parseFloat(value) : value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(e.currentTarget.files!)],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addColor = () => {
    if (newColor.trim()) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()],
      }));
      setNewColor('');
    }
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const addSize = () => {
    if (newSize.trim()) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()],
      }));
      setNewSize('');
    }
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Product Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter product name"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description"
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Price Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <input
            id="price"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        <div>
          <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price (Optional)
          </label>
          <input
            id="salePrice"
            type="number"
            name="salePrice"
            value={formData.salePrice || ''}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.salePrice ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.salePrice && <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>}
        </div>
      </div>

      {/* Category & SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select category</option>
            {categories && categories.length > 0 ? categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            )) : (
              <option value="" disabled>Loading categories...</option>
            )}
          </select>
          {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
          </label>
          <input
            id="sku"
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="SKU-001"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.sku ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
        </div>
      </div>

      {/* Stock Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <input
            id="stock"
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
        </div>

        <div>
          <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Stock
          </label>
          <input
            id="minStock"
            type="number"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            placeholder="e.g., Red, Blue"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addColor();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <Button type="button" onClick={addColor} className="bg-orange-500 hover:bg-orange-600 text-white">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.colors.map((color, idx) => (
            <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {color}
              <button
                type="button"
                onClick={() => removeColor(idx)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSize}
            onChange={e => setNewSize(e.target.value)}
            placeholder="e.g., S, M, L, XL"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSize();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <Button type="button" onClick={addSize} className="bg-orange-500 hover:bg-orange-600 text-white">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.sizes.map((size, idx) => (
            <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {size}
              <button
                type="button"
                onClick={() => removeSize(idx)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
          Product Images {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}

        {formData.images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {formData.images.map((file, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Product ${idx}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
      >
        {loading && <Loader size={20} className="animate-spin" />}
        {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );
}
