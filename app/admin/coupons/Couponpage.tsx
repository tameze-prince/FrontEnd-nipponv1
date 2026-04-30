'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { CouponForm } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Plus, X, Loader, Copy } from 'lucide-react';
import { promotionService } from '@/lib/index';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getCoupons();
      if (response.success && response.data) {
        const items = Array.isArray(response.data) ? response.data : response.data.data;
        setCoupons((items ?? []) as Coupon[]);
      } else {
        setError('Unable to load coupons');
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError('Error loading coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
    } else {
      setEditingCoupon(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setError('');
      let response;

      if (editingCoupon) {
        response = await promotionService.updateCoupon(editingCoupon.id, formData);
      } else {
        response = await promotionService.createCoupon(formData);
      }

      if (response.success) {
        handleCloseForm();
        loadCoupons();
      } else {
        setError(response.error || 'Operation failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Form submit error:', err);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await promotionService.deleteCoupon(couponId);
        if (response.success) {
          loadCoupons();
        } else {
          setError('Unable to delete coupon');
        }
      } catch (err) {
        setError('Error deleting coupon');
        console.error('Delete error:', err);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Add toast notification
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Codes Promotionnels</h1>
            <p className="text-gray-600 mt-1">Gérez vos codes de réduction</p>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau Code Promo
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Coupons Table */}
        <Card className="p-6 bg-white shadow-sm border-0">
          {loading ? (
            <div className="py-8 text-center">
              <Loader className="w-6 h-6 animate-spin mx-auto text-orange-500" />
              <p className="text-gray-600 mt-2">Chargement des codes promo...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Remise</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Utilisations</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Validité</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length > 0 ? (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1 bg-gray-100 rounded text-gray-900 font-mono text-sm">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copier le code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-orange-600">
                          {coupon.discountType === 'percentage'
                            ? `-${coupon.discountValue}%`
                            : `-${coupon.discountValue}€`
                          }
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <div className="text-xs text-gray-500">Max {coupon.maxDiscount}€</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{coupon.usageCount}/{coupon.usageLimit}</div>
                          <div className="w-12 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              style={{ width: `${(coupon.usageCount / coupon.usageLimit) * 100}%` }}
                              className="h-full bg-orange-500"
                            ></div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              coupon.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {coupon.status === 'active' ? '🟢 Active' : '⏸️ Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex gap-2">
                          <button
                            onClick={() => handleOpenForm(coupon)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                        Aucun code promo trouvé. Créez-en un pour commencer!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Coupon Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl border-0">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCoupon ? 'Modifier le code promo' : 'Nouveau code promo'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <CouponForm
                initialData={editingCoupon || undefined}
                isEdit={!!editingCoupon}
                onSubmit={handleFormSubmit}
              />
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
