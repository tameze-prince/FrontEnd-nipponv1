'use client';

import React from 'react';

import { CurrencyManagement } from '@/components/admin/CurrencyManagement';
import { WhatsappCityManagement } from '@/components/admin/WhatsappCityManagement';
import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConfigurationPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-gray-600">Gerez les devises, villes et contacts WhatsApp</p>
          </div>

          <Tabs defaultValue="currency" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="currency">Devises</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp & Villes</TabsTrigger>
            </TabsList>

            <TabsContent value="currency">
              <CurrencyManagement />
            </TabsContent>

            <TabsContent value="whatsapp">
              <WhatsappCityManagement />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
