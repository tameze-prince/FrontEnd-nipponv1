'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { RegisterForm } from '@/components/forms';
import { Card } from '@/components/ui/card';
import { buildAuthRedirectHref, sanitizeRedirectPath } from '@/lib/auth-redirect';
import { authService } from '@/lib/index';
import { getDashboardRoute } from '@/middleware/auth-guard';
import { useAuthStore } from '@/stores/useAuthStore';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'), '/products');

  const handleRegisterSubmit = async (formData: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        setToken(response.data.token);

        router.push(
          sanitizeRedirectPath(
            searchParams.get('redirect'),
            getDashboardRoute(response.data.user.role)
          )
        );
      } else {
        setError(response.error || 'L inscription a echoue. Veuillez reessayer.');
      }
    } catch (err) {
      setError('Erreur lors de l inscription. Verifiez vos informations puis reessayez.');
      console.error('Register error:', err);
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
          <p className="mt-2 text-gray-600">Creez votre compte</p>
        </div>

        <Card className="border-0 bg-white p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Inscription</h2>
            <p className="mt-2 text-sm text-gray-600">
              Rejoignez NipponHub pour acceder au catalogue et commander.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="mb-6">
            <RegisterForm onSubmit={handleRegisterSubmit} loading={loading} error={error} />
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Deja inscrit ?{' '}
            <Link
              href={buildAuthRedirectHref('/auth/login', redirectPath)}
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Se connecter
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-600">
          En creant un compte, vous acceptez nos conditions d&apos;utilisation
        </p>
      </div>
    </div>
  );
}
