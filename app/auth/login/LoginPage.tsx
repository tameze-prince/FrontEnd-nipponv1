'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { LoginForm } from '@/components/forms';
import { Card } from '@/components/ui/card';
import { buildAuthRedirectHref, sanitizeRedirectPath } from '@/lib/auth-redirect';
import { authService } from '@/lib/index';
import { getDashboardRoute } from '@/middleware/auth-guard';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'), '/products');

  const handleLoginSubmit = async (formData: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    try {
      setLoading(true);
      setError('');

      const response = await authService.login(formData.email, formData.password);

      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);

        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }

        router.push(
          sanitizeRedirectPath(
            searchParams.get('redirect'),
            getDashboardRoute(response.data.user.role)
          )
        );
      } else {
        setError(response.error || 'La connexion a echoue. Veuillez reessayer.');
      }
    } catch (err) {
      setError('Erreur de connexion. Verifiez vos identifiants puis reessayez.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NipponHub</h1>
          <p className="mt-2 text-gray-600">Votre boutique premium nippone</p>
        </div>

        <Card className="border-0 bg-white p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="mt-2 text-sm text-gray-600">
              Connectez-vous pour reprendre votre navigation et votre commande.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="mb-6">
            <LoginForm onSubmit={handleLoginSubmit} loading={loading} error={error} />
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Pas encore inscrit ?{' '}
            <Link
              href={buildAuthRedirectHref('/auth/register', redirectPath)}
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Creer un compte
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-600">
          En continuant, vous acceptez nos{' '}
          <Link href="#" className="hover:text-orange-600">
            conditions d&apos;utilisation
          </Link>
        </p>
      </div>
    </div>
  );
}
