'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email.includes('@')) {
      setError('Email invalide');
      setIsLoading(false);
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Code de réinitialisation envoyé à votre email');
      setStep('verify');
    } catch (err) {
      setError('Erreur lors de l\'envoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!resetCode) {
      setError('Veuillez entrer le code');
      setIsLoading(false);
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Code vérifié');
      setStep('reset');
    } catch (err) {
      setError('Code invalide');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Mot de passe réinitialisé avec succès !');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      setError('Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg mb-4">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NipponHub</h1>
          <p className="text-gray-600 mt-2">Réinitialiser votre mot de passe</p>
        </div>

        {/* Reset Card */}
        <Card className="p-8 bg-white shadow-lg border-0">
          {step === 'email' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Récupération de compte</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Entrez votre adresse email pour recevoir un code de réinitialisation
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="jean@mail.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
                </Button>
              </form>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Vérification</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Entrez le code reçu par email
                </p>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Code de réinitialisation
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => {
                      setResetCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="A1B2C3D4"
                    maxLength={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition text-center text-2xl font-mono tracking-widest"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Vérifiez votre boîte email (incluez les spam)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Vérification en cours...' : 'Vérifier le code'}
                </Button>
              </form>

              <button
                onClick={() => {
                  setStep('email');
                  setError('');
                  setSuccess('');
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Créez un nouveau mot de passe sécurisé
                </p>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                </Button>
              </form>

              <button
                onClick={() => {
                  setStep('email');
                  setError('');
                  setSuccess('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm mt-6 border-t border-gray-200 pt-6">
            Se souvenir du mot de passe ?{' '}
            <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-semibold">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
