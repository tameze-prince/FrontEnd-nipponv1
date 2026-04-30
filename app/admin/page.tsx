'use client';

import React from 'react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { AdminDashboard } from '@/components/shared/AdminDashboard';
import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </ProtectedRoute>
  );
}
