'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-red-600" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accès Refusé</h1>
          <p className="text-gray-600 mt-2">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Information:</strong> Seuls les utilisateurs avec les rôles appropriés peuvent accéder à cette zone.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Accueil
          </Button>
        </div>
      </Card>
    </div>
  );
}
