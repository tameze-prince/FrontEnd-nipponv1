'use client';

import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CouponFormData {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCountPerUser?: number;
  validFrom: string;
  validUntil: string;
  applicableToNewUsersOnly?: boolean;
  isActive: boolean;
}

interface CouponFormProps {
  onSubmit: (data: CouponFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<CouponFormData>;
  isEdit?: boolean;
}

export default function CouponForm({
  onSubmit,
  loading = false,
  error,
  initialData,
  isEdit = false,
}: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>(
    initialData
      ? {
          code: initialData.code || '',
          type: initialData.type || 'percentage',
          discountValue: initialData.discountValue || 0,
          minPurchaseAmount: initialData.minPurchaseAmount,
          maxDiscountAmount: initialData.maxDiscountAmount,
          usageLimit: initialData.usageLimit,
          validFrom: initialData.validFrom || '',
          validUntil: initialData.validUntil || '',
          applicableToNewUsersOnly: initialData.applicableToNewUsersOnly || false,
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        }
      : {
          code: '',
          type: 'percentage',
          discountValue: 0,
          validFrom: '',
          validUntil: '',
          isActive: true,
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9-]{3,}$/.test(formData.code)) {
      newErrors.code = 'Code must be 3+ characters (uppercase, numbers, dash only)';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.type === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'Valid until date is required';
    }

    if (formData.validFrom && formData.validUntil && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'Valid until must be after valid from';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCode = () => {
    const code = 'CODE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.currentTarget;
    const newValue = type === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: ['discountValue', 'minPurchaseAmount', 'maxDiscountAmount', 'usageLimit', 'usageCountPerUser'].includes(name)
        ? parseFloat(value)
        : newValue,
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

      {/* Coupon Code */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          Coupon Code *
        </label>
        <div className="flex gap-2">
          <input
            id="code"
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            disabled={isEdit}
            placeholder="SAVE20"
            className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase ${
              isEdit ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
          />
          {!isEdit && (
            <Button type="button" onClick={generateCode} className="bg-gray-500 hover:bg-gray-600 text-white px-4">
              Generate
            </Button>
          )}
        </div>
        {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
      </div>

      {/* Coupon Type */}
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
          <option value="fixed_amount">Fixed Amount ($) Off</option>
          <option value="free_shipping">Free Shipping</option>
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

      {/* Min Purchase & Max Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Purchase (Optional)
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

        <div>
          <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Discount (Optional)
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
      </div>

      {/* Usage Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Total Usage Limit (Optional)
          </label>
          <input
            id="usageLimit"
            type="number"
            name="usageLimit"
            value={formData.usageLimit || ''}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label htmlFor="usageCountPerUser" className="block text-sm font-medium text-gray-700 mb-2">
            Uses Per User (Optional)
          </label>
          <input
            id="usageCountPerUser"
            type="number"
            name="usageCountPerUser"
            value={formData.usageCountPerUser || ''}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Valid From *
          </label>
          <input
            id="validFrom"
            type="datetime-local"
            name="validFrom"
            value={formData.validFrom}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.validFrom ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
        </div>

        <div>
          <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until *
          </label>
          <input
            id="validUntil"
            type="datetime-local"
            name="validUntil"
            value={formData.validUntil}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.validUntil ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
        </div>
      </div>

      {/* Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <input
            id="newUsersOnly"
            type="checkbox"
            name="applicableToNewUsersOnly"
            checked={formData.applicableToNewUsersOnly || false}
            onChange={handleChange}
            className="w-4 h-4 text-orange-500 rounded"
          />
          <label htmlFor="newUsersOnly" className="text-sm font-medium text-gray-700">
            Applicable to New Users Only
          </label>
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
          Active Coupon
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
      >
        {loading && <Loader size={20} className="animate-spin" />}
        {loading ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
      </Button>
    </form>
  );
}
