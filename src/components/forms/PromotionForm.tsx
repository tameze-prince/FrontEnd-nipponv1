'use client';

import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromotionFormData {
  title: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

interface PromotionFormProps {
  onSubmit: (data: PromotionFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<PromotionFormData>;
  isEdit?: boolean;
  isFlashSale?: boolean;
}

export default function PromotionForm({
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
  isFlashSale = false,
}: PromotionFormProps) {
  const [formData, setFormData] = useState<PromotionFormData>(
    initialData
      ? {
          title: initialData.title || '',
          description: initialData.description || '',
          type: initialData.type || 'percentage',
          discountValue: initialData.discountValue || 0,
          minPurchaseAmount: initialData.minPurchaseAmount,
          maxDiscountAmount: initialData.maxDiscountAmount,
          applicableProducts: initialData.applicableProducts || [],
          applicableCategories: initialData.applicableCategories || [],
          startDate: initialData.startDate || '',
          endDate: initialData.endDate || '',
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        }
      : {
          title: '',
          type: 'percentage',
          discountValue: 0,
          startDate: '',
          isActive: true,
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.type === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget;
    const newValue = type === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountValue' || name === 'minPurchaseAmount' || name === 'maxDiscountAmount' ? parseFloat(value) : newValue,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
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

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          {isFlashSale ? 'Flash Sale' : 'Promotion'} Title *
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={isFlashSale ? 'e.g., Lightning Deal on Electronics' : 'e.g., Summer Sale 2024'}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Enter promotion description"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Promotion Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Discount Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="percentage">Percentage (%) Off</option>
          <option value="fixed_amount">Fixed Amount Off</option>
          <option value="free_shipping">Free Shipping</option>
          <option value="buy_x_get_y">Buy X Get Y</option>
        </select>
      </div>

      {/* Discount Value */}
      <div>
        <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-2">
          Discount Value {formData.type === 'percentage' ? '(%)' : '($)'} *
        </label>
        <input
          id="discountValue"
          type="number"
          name="discountValue"
          value={formData.discountValue}
          onChange={handleChange}
          placeholder="0"
          step={formData.type === 'percentage' ? '1' : '0.01'}
          min="0"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.discountValue ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
      </div>

      {/* Min Purchase Amount */}
      <div>
        <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Purchase Amount (Optional)
        </label>
        <input
          id="minPurchaseAmount"
          type="number"
          name="minPurchaseAmount"
          value={formData.minPurchaseAmount || ''}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Max Discount Amount */}
      <div>
        <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Discount Amount (Optional)
        </label>
        <input
          id="maxDiscountAmount"
          type="number"
          name="maxDiscountAmount"
          value={formData.maxDiscountAmount || ''}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            id="startDate"
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date {isFlashSale ? '*' : '(Optional)'}
          </label>
          <input
            id="endDate"
            type="datetime-local"
            name="endDate"
            value={formData.endDate || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-orange-500 rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
      >
        {loading && <Loader size={20} className="animate-spin" />}
        {loading ? 'Saving...' : isEdit ? 'Update Promotion' : 'Create Promotion'}
      </Button>
    </form>
  );
}
