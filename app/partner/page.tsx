'use client';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Link2, Wallet } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

function PartnerDashboardContent() {
  const { user } = useAuthStore();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e8,transparent_35%),linear-gradient(180deg,#fffdfb_0%,#fff8f2_50%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
              Partner Portal
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              Tableau de bord partenaire
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Espace minimal pour permettre la navigation par role en attendant le portail complet.
            </p>
          </div>

          <Button asChild variant="outline" className="rounded-full border-orange-200">
            <Link href="/profile">Retour au profil</Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="border-0 bg-white p-6 shadow-xl shadow-orange-100/40">
            <BarChart3 className="h-8 w-8 text-orange-500" />
            <p className="mt-4 text-sm text-slate-500">Compte connecte</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{user?.name || 'Partner'}</p>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-xl shadow-orange-100/40">
            <Wallet className="h-8 w-8 text-orange-500" />
            <p className="mt-4 text-sm text-slate-500">Commissions</p>
            <p className="mt-2 text-2xl font-black text-slate-950">A brancher</p>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-xl shadow-orange-100/40">
            <Link2 className="h-8 w-8 text-orange-500" />
            <p className="mt-4 text-sm text-slate-500">Lien d'affiliation</p>
            <p className="mt-2 text-2xl font-black text-slate-950">A brancher</p>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function PartnerDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['partner', 'admin', 'owner']}>
      <PartnerDashboardContent />
    </ProtectedRoute>
  );
}
