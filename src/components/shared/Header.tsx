'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingCart, Sparkles, User } from 'lucide-react';

import LocationSelector from '@/components/shared/LocationSelector';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getDashboardRoute } from '@/middleware/auth-guard';

const HIDDEN_PREFIXES = ['/admin', '/owner', '/auth', '/unauthorized', '/partner'];

export default function Header() {
  const pathname = usePathname();
  const { getTotalItems } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const shouldHide = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (shouldHide) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff8c42,#ffb380)] text-white shadow-lg shadow-orange-200">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-950">
                NipponHub
              </p>
              <p className="text-xs text-slate-500">
                Produits japonais, prix locaux, navigation simplifiee
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="transition hover:text-orange-600">
              Accueil
            </Link>
            <Link href="/products" className="transition hover:text-orange-600">
              Produits
            </Link>
            <Link href="/profile" className="transition hover:text-orange-600">
              Mon profil
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LocationSelector />
          </div>

          <Link
            href="/cart"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
          >
            <span className="hidden sm:inline">Panier </span>
            <ShoppingCart className="mr-1 inline h-4 w-4" />
            ({getTotalItems()})
          </Link>

          {isAuthenticated && user ? (
            <Button asChild variant="outline" className="rounded-full border-orange-200">
              <Link href={getDashboardRoute(user.role)}>
                <User className="mr-2 h-4 w-4" />
                {user.role === 'customer' ? 'Profil' : 'Dashboard'}
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95">
              <Link href="/auth/login">
                <Menu className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-orange-50 px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl justify-between">
          <Link href="/" className="text-sm font-medium text-slate-600">
            Accueil
          </Link>
          <Link href="/products" className="text-sm font-medium text-slate-600">
            Produits
          </Link>
          <LocationSelector />
        </div>
      </div>
    </header>
  );
}
