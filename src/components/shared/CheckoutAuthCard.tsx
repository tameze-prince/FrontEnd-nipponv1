'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

import { authService, RegisterRequest } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';

type AuthMode = 'login' | 'register';

interface CheckoutAuthCardProps {
  title?: string;
  description?: string;
}

export default function CheckoutAuthCard({
  title = 'Authentification requise',
  description = 'Connectez-vous ou créez un compte pour compléter votre commande.',
}: CheckoutAuthCardProps) {
  const { setUser, setToken, setError: setAuthError } = useAuthStore();
  const { selectedCountry, selectedCity } = useLocationStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    avatar: null as File | null,
  });

  const updateField = (key: keyof typeof formData, value: string | File | null) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Email et mot de passe requis');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);

      if (!response.success || !response.data) {
        setAuthError(response.error || 'Erreur de connexion');
        toast.error(response.error || 'Connexion échouée');
        return;
      }

      setUser(response.data.user);
      setToken(response.data.token);
      toast.success(`Bienvenue ${response.data.user.firstName || response.data.user.name}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim()
    ) {
      toast.error('Remplissez tous les champs requis');
      return;
    }

    if (!selectedCountry || !selectedCity) {
      toast.error('Sélectionnez votre pays et ville avant de créer un compte');
      return;
    }

    setIsLoading(true);
    try {
      const registerData: RegisterRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        countryId: selectedCountry.id,
        cityId: selectedCity.id,
        avatar: formData.avatar || undefined,
      };

      const response = await authService.register(registerData);

      if (!response.success || !response.data) {
        setAuthError(response.error || 'Erreur d\'inscription');
        toast.error(response.error || 'Inscription échouée');
        return;
      }

      setUser(response.data.user);
      setToken(response.data.token);
      toast.success(
        `Bienvenue ${response.data.user.firstName || response.data.user.name}! Compte créé avec succès.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      void handleLogin();
    } else {
      void handleRegister();
    }
  };

  return (
    <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
      <CardContent className="space-y-6 pt-6">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
            Etape 1
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">{title}</h2>
        </div>

        <p className="text-sm leading-7 text-slate-600">{description}</p>

        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormData((current) => ({
                ...current,
                firstName: '',
                lastName: '',
                phone: '',
              }));
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            <LockKeyhole className="mr-2 inline-block h-4 w-4" />
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormData((current) => ({ ...current, password: '' }));
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            <ShoppingBag className="mr-2 inline-block h-4 w-4" />
            S'inscrire
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'register' ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Prénom</label>
                  <input
                    value={formData.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                    placeholder="Jean"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nom</label>
                  <input
                    value={formData.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                    placeholder="Kamga"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                <input
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="+237 6XX XX XX XX"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="vous@nipponhub.com"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm outline-none focus:border-orange-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Avatar (optionnel)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    updateField('avatar', file);
                  }
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-orange-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-orange-700 outline-none focus:border-orange-300"
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] bg-orange-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-950">
            {mode === 'login' ? 'Pas encore inscrit?' : 'Déjà un compte?'}
          </p>
          <p className="mt-1">
            {mode === 'login'
              ? 'Créez un compte pour accéder à tous les avantages NipponHub.'
              : 'Connectez-vous avec vos identifiants existants.'}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95 disabled:opacity-50"
        >
          {isLoading
            ? 'Traitement...'
            : mode === 'login'
              ? 'Se connecter'
              : 'Créer un compte'}
        </Button>
      </CardContent>
    </Card>
  );
}
