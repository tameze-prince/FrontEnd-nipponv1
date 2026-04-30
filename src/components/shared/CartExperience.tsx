'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/stores/useCartStore';
import { useLocationStore } from '@/stores/useLocationStore';

function formatMoney(amount: number, currencySymbol: string) {
  return `${currencySymbol} ${amount.toLocaleString()}`;
}

export default function CartExperience() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } =
    useCartStore();
  const { selectedCountry, selectedCity } = useLocationStore();

  const [coupon, setCoupon] = useState('');

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const currencySymbol =
    items[0]?.currencySymbol ?? selectedCountry?.currencySymbol ?? 'FCFA';
  const shipping = items.length === 0 ? 0 : subtotal >= 50000 ? 0 : 1500;
  const couponDiscount = coupon.trim().toUpperCase() === 'NIPPON10' ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shipping - couponDiscount);

  const groupedInsights = useMemo(
    () => [
      {
        label: 'Localisation',
        value:
          selectedCountry && selectedCity
            ? `${selectedCity.name}, ${selectedCountry.name}`
            : 'A confirmer',
      },
      {
        label: 'Articles',
        value: `${totalItems} item${totalItems > 1 ? 's' : ''}`,
      },
      {
        label: 'Livraison',
        value: shipping === 0 ? 'Offerte' : 'Estimee a 48h',
      },
    ],
    [selectedCountry, selectedCity, shipping, totalItems]
  );

  const handleApplyCoupon = () => {
    if (!coupon.trim()) {
      toast.error('Entrez un code promo');
      return;
    }

    if (coupon.trim().toUpperCase() === 'NIPPON10') {
      toast.success('Code promo applique', {
        description: '10% de reduction sur le sous-total',
      });
      return;
    }

    toast.error('Code promo non reconnu');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Panier vide');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        {items.length === 0 ? (
          <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
            <CardContent className="space-y-5 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-950">Votre panier est vide</h2>
                <p className="mx-auto max-w-lg text-sm leading-7 text-slate-500">
                  On a maintenant un vrai parcours catalogue et detail produit. La prochaine belle
                  etape, c&apos;est de remplir ce panier avec vos selections.
                </p>
              </div>
              <div className="flex justify-center">
                <Button asChild className="h-12 rounded-full bg-slate-950 text-white hover:bg-slate-800">
                  <Link href="/products">
                    Retour au catalogue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const lineTotal = item.price * item.quantity;

            return (
              <Card
                key={`${item.productId}-${item.variantId ?? 'base'}`}
                className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30"
              >
                <CardContent className="space-y-5 pt-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#fff2e6,#ffffff,#ffe3ca)] p-4 text-center text-sm font-semibold text-slate-700">
                        {item.image ?? 'Produit'}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-950">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          Variante: {item.variantLabel || item.variantId || 'Standard'}
                        </p>
                        <p className="text-sm font-medium text-orange-700">
                          Prix unitaire: {formatMoney(item.price, item.currencySymbol)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        removeFromCart(item.productId, item.variantId);
                        toast.success('Article retire du panier');
                      }}
                      className="rounded-full text-slate-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Retirer
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4 rounded-[1.5rem] bg-orange-50/70 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="inline-flex items-center rounded-full border border-orange-200 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))
                        }
                        className="inline-flex h-11 w-11 items-center justify-center text-slate-700"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="inline-flex h-11 w-11 items-center justify-center text-slate-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total ligne</p>
                      <p className="text-2xl font-black text-slate-950">
                        {formatMoney(lineTotal, item.currencySymbol)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff3e8,#ffffff,#fff5ed)] shadow-xl shadow-orange-100/40">
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                Resume
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Pret pour le checkout</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {groupedInsights.map((item) => (
                <div key={item.label} className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                  <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-sm">
              <label className="text-sm font-semibold text-slate-700" htmlFor="coupon-code">
                Code promo
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon-code"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Essayez NIPPON10"
                  className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  className="rounded-full border-orange-200"
                >
                  Appliquer
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Sous-total</span>
                <span>{formatMoney(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Livraison</span>
                <span>{shipping === 0 ? 'Offerte' : formatMoney(shipping, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Reduction</span>
                <span>{couponDiscount > 0 ? `- ${formatMoney(couponDiscount, currencySymbol)}` : '-'}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-200">Total</span>
                <span className="text-3xl font-black">{formatMoney(total, currencySymbol)}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <Button
                asChild
                type="button"
                className="h-12 rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95"
                disabled={items.length === 0}
              >
                <Link href="/checkout">
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Passer au checkout
                </Link>
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                className="h-12 rounded-full border-orange-200"
              >
                <Link href="/products">Continuer mes achats</Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleClearCart}
                disabled={items.length === 0}
                className="rounded-full text-slate-500"
              >
                Vider le panier
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
