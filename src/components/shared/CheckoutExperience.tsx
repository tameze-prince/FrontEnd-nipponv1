'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPinned,
  MessageSquareMore,
  Smartphone,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

import CheckoutAuthCard from '@/components/shared/CheckoutAuthCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { orderService } from '@/lib/order-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { useOrderStore } from '@/stores/useOrderStore';

type StepId = 'auth' | 'address' | 'payment' | 'review';
type PaymentMethod = 'mobile-money' | 'retrieve' | 'cod';

const steps: { id: StepId; label: string; icon: typeof LockKeyhole }[] = [
  { id: 'auth', label: 'Connexion', icon: LockKeyhole },
  { id: 'address', label: 'Adresse', icon: MapPinned },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
  { id: 'review', label: 'Confirmation', icon: CheckCircle2 },
];

function formatMoney(amount: number, currencySymbol: string) {
  return `${currencySymbol} ${amount.toLocaleString()}`;
}

function paymentLabel(method: PaymentMethod) {
  switch (method) {
    case 'cod':
      return 'Paiement a la livraison';
    case 'retrieve':
      return 'Retrait en magasin';
    case 'mobile-money':
    default:
      return 'Mobile Money';
  }
}

export default function CheckoutExperience() {
  const router = useRouter();
  const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
  const { selectedCountry, selectedCity } = useLocationStore();
  const { setLastOrder } = useOrderStore();
  const { isAuthenticated, user } = useAuthStore();

  const [requestedStep, setRequestedStep] = useState<StepId>(
    isAuthenticated ? 'address' : 'auth'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile-money');
  const [formData, setFormData] = useState(() => ({
    fullName:
      user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    district: '',
    note: '',
  }));

  const currentStep =
    !isAuthenticated ? 'auth' : requestedStep === 'auth' ? 'address' : requestedStep;

  const totalItems = getTotalItems();
  const subtotal = getTotalPrice();
  const currencySymbol =
    items[0]?.currencySymbol ?? selectedCountry?.currencySymbol ?? 'FCFA';
  // Retrieve (retrait) n'a pas de frais de livraison, COD et Mobile Money ont les frais normaux
  const shipping = paymentMethod === 'retrieve' ? 0 : items.length === 0 ? 0 : subtotal >= 50000 ? 0 : 1500;
  const total = subtotal + shipping;
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const locationLabel =
    selectedCountry && selectedCity
      ? `${selectedCity.name}, ${selectedCountry.name}`
      : 'Localisation non definie';

  const paymentDescription = useMemo(() => {
    switch (paymentMethod) {
      case 'retrieve':
        return 'Retrait en magasin - Aucun frais de livraison. Venez chercher votre commande sur place.';
      case 'cod':
        return `Paiement a la livraison. Les frais de livraison (${formatMoney(shipping, currencySymbol)}) s'ajoutent au total et sont a regler au moment de la livraison.`;
      case 'mobile-money':
      default:
        return 'Paiement Mobile Money. Les frais de livraison s\'appliquent selon le montant.';
    }
  }, [paymentMethod, shipping, currencySymbol]);

  const previousStep = () => {
    const previous = steps[currentStepIndex - 1];

    if (!previous) return;

    if (previous.id === 'auth' && isAuthenticated) {
      setRequestedStep('address');
      return;
    }

    setRequestedStep(previous.id);
  };

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleAddressContinue = () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      toast.error('Remplissez les informations client et l adresse principale');
      return;
    }

    if (!selectedCity) {
      toast.error('Choisissez une ville avant de poursuivre la commande');
      return;
    }

    setRequestedStep('payment');
  };

  const handlePaymentContinue = () => {
    setRequestedStep('review');
    toast.success('Mode de paiement enregistre');
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    if (!isAuthenticated) {
      setRequestedStep('auth');
      toast.error('Connectez-vous avant de confirmer la commande');
      return;
    }

    if (!selectedCity) {
      toast.error('La ville de livraison est obligatoire');
      return;
    }

    if (!formData.fullName.trim() || !formData.address.trim() || !formData.phone.trim()) {
      toast.error('Completez les informations de livraison');
      return;
    }

    setIsSubmitting(true);

    const localOrderId = `LOCAL-${Date.now().toString().slice(-8)}`;
    const backendItems = items
      .filter((item) => Boolean(item.variantId))
      .map((item) => ({
        variantId: item.variantId as string,
        quantity: item.quantity,
      }));

    const createLocalSnapshot = (orderId: string, orderNumber?: string) => {
      setLastOrder({
        orderId,
        orderNumber,
        createdAt: new Date().toISOString(),
        countryId: selectedCountry?.id,
        cityId: selectedCity.id,
        countryName: selectedCountry?.name,
        cityName: selectedCity.name,
        customerName: formData.fullName || user?.name || 'Client NipponHub',
        customerEmail: formData.email || user?.email || '',
        customerPhone: formData.phone,
        address: formData.address,
        district: formData.district,
        note: formData.note,
        locationLabel,
        paymentMethod,
        subtotal,
        shipping,
        total,
        currencySymbol,
        items,
      });
    };

    try {
      if (backendItems.length !== items.length) {
        createLocalSnapshot(localOrderId, localOrderId);
        clearCart();
        toast.error(
          'Recapitulatif local cree.'
        );
        router.push(`/orders/${localOrderId}`);
        return;
      }

      const response = await orderService.createOrder({
        cityId: selectedCity.id,
        items: backendItems,
        notes:
          [formData.address, formData.district, formData.note].filter(Boolean).join(' | ') ||
          undefined,
      });

      if (!response.success || !response.data || response.data.items.length === 0) {
        createLocalSnapshot(localOrderId, localOrderId);
        clearCart();
        toast.error(response.error || 'Servicer indisponible, recapitulatif local cree.');
        router.push(`/orders/${localOrderId}`);
        return;
      }

      createLocalSnapshot(response.data.id, response.data.orderNumber);
      clearCart();
      toast.success('Commande confirmee', {
        description: `${response.data.orderNumber} creee avec succes.`,
      });
      router.push(`/orders/${response.data.id}`);
    } catch (error) {
      createLocalSnapshot(localOrderId, localOrderId);
      clearCart();
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur de reseau, recapitulatif local cree.'
      );
      router.push(`/orders/${localOrderId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au panier
            </Link>
          </Button>
          <p className="text-sm text-slate-500">
            {totalItems} article{totalItems > 1 ? 's' : ''} a finaliser
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = step.id === currentStep;
            const complete = index < currentStepIndex || (step.id === 'auth' && isAuthenticated);

            return (
              <Card
                key={step.id}
                className={`rounded-[1.75rem] border-0 shadow-sm ${
                  active
                    ? 'bg-slate-950 text-white'
                    : complete
                      ? 'bg-orange-50'
                      : 'bg-white'
                }`}
              >
                <CardContent className="flex items-center gap-3 pt-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      active
                        ? 'bg-white/10 text-orange-200'
                        : complete
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] opacity-60">
                      Etape {index + 1}
                    </p>
                    <p className="font-semibold">{step.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {currentStep === 'auth' ? (
          <CheckoutAuthCard
            title="Veillez vous connecter/inscrit afin the completer votre commande"
            description="Vous devez vous connecter ou créer son compte pour renseigner ses informations, confirmer sa livraison et enregistrer sa commande sur le site."
          />
        ) : null}

        {currentStep === 'address' ? (
          <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
            <CardContent className="space-y-6 pt-6">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Etape 2
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Adresse de livraison</h2>
              </div>

              <div className="rounded-[1.5rem] bg-orange-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-950">Client connecte</p>
                <p className="mt-1">
                  {user?.name || formData.fullName || 'Client NipponHub'}
                  {formData.email ? ` - ${formData.email}` : ''}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nom complet</label>
                  <input
                    value={formData.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    placeholder="Jean Kamga"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="vous@nipponhub.com"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Telephone</label>
                  <input
                    value={formData.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Zone</label>
                  <input
                    value={locationLabel}
                    readOnly
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Adresse</label>
                  <input
                    value={formData.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Rue, quartier, repere"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quartier / district</label>
                  <input
                    value={formData.district}
                    onChange={(event) => updateField('district', event.target.value)}
                    placeholder="Akwa"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Note de livraison</label>
                  <input
                    value={formData.note}
                    onChange={(event) => updateField('note', event.target.value)}
                    placeholder="Appeler avant livraison"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={previousStep} className="rounded-full">
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={handleAddressContinue}
                  className="rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95"
                >
                  Continuer vers paiement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {currentStep === 'payment' ? (
          <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
            <CardContent className="space-y-6 pt-6">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Etape 3
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Mode de paiement</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    id: 'mobile-money' as const,
                    label: 'Mobile Money',
                    icon: Smartphone,
                  },
                  {
                    id: 'retrieve' as const,
                    label: 'Retrait en magasin',
                    icon: MapPinned,
                  },
                  {
                    id: 'cod' as const,
                    label: 'Paiement a la livraison',
                    icon: Truck,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const active = paymentMethod === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={`rounded-[1.75rem] border p-5 text-left transition ${
                        active
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-slate-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 font-semibold text-slate-950">{option.label}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm font-semibold text-orange-200">Detail paiement</p>
                <p className="mt-2 text-sm text-slate-300">{paymentDescription}</p>
              </div>

              {paymentMethod === 'mobile-money' && shipping > 0 ? (
                <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm font-semibold text-orange-700">Frais de livraison</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {formatMoney(shipping, currencySymbol)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Les frais de livraison sont inclus dans le total et seront debites lors du paiement.
                  </p>
                </div>
              ) : null}
              {paymentMethod === 'retrieve' ? (
                <div className="rounded-[1.5rem] border border-green-200 bg-green-50 p-5">
                  <p className="text-sm font-semibold text-green-700">Avantage retrait</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    Aucun frais de livraison
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Venez chercher votre commande en magasin et economisez les frais de livraison.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={previousStep} className="rounded-full">
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={handlePaymentContinue}
                  className="rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95"
                >
                  Revoir ma commande
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {currentStep === 'review' ? (
          <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
            <CardContent className="space-y-6 pt-6">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                  Etape 4
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Verification avant confirmation
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-orange-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-700">Client</p>
                  <p className="mt-2 font-semibold text-slate-950">{formData.fullName || 'A renseigner'}</p>
                  <p className="mt-1 text-sm text-slate-600">{formData.email || 'Email manquant'}</p>
                  <p className="mt-1 text-sm text-slate-600">{formData.phone || 'Telephone manquant'}</p>
                </div>
                <div className="rounded-[1.5rem] bg-orange-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-700">Livraison</p>
                  <p className="mt-2 font-semibold text-slate-950">{locationLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{formData.address || 'Adresse manquante'}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-950">
                  <MessageSquareMore className="h-4 w-4 text-orange-500" />
                  <p className="font-semibold">Paiement choisi</p>
                </div>
                {/* <p className="mt-2 text-sm leading-7 text-slate-600">
                  {paymentLabel(paymentMethod)}. Les notes client et l&apos;adresse sont concatenees
                  dans l&apos;appel `POST /api/v1/orders` pour que le backend conserve les
                  informations utiles a la preparation de commande.
                </p> */}
                {paymentMethod === 'retrieve' ? (
                  <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    ✓ Retrait en magasin - Aucun frais de livraison
                  </p>
                ) : paymentMethod === 'mobile-money' && shipping > 0 ? (
                  <p className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
                    Frais de livraison: {formatMoney(shipping, currencySymbol)}
                  </p>
                ) : paymentMethod === 'cod' ? (
                  <p className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
                    Frais de livraison: {shipping === 0 ? 'Livraison offerte' : formatMoney(shipping, currencySymbol)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={previousStep} className="rounded-full">
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95"
                >
                  {isSubmitting ? 'Confirmation...' : 'Confirmer ma commande'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff3e8,#ffffff,#fff5ed)] shadow-xl shadow-orange-100/40">
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                Resume commande
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Vue checkout</h2>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white p-4 text-sm text-slate-500">
                  Aucun article pour le moment.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? 'base'}`}
                    className="rounded-[1.5rem] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.variantLabel || item.variantId || 'Standard'} - Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-950">
                        {formatMoney(item.price * item.quantity, item.currencySymbol)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Sous-total</span>
                <span>{formatMoney(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {paymentMethod === 'retrieve' ? 'Retrait (gratuit)' : paymentMethod === 'cod' ? 'Livraison a payer' : 'Livraison'}
                </span>
                <span>{shipping === 0 ? 'Offerte' : formatMoney(shipping, currencySymbol)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-200">Total</span>
                <span className="text-3xl font-black">{formatMoney(total, currencySymbol)}</span>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etat tunnel</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {isAuthenticated ? 'Client reconnu' : 'Authentification requise'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedCity ? locationLabel : 'Choisissez une ville pour permettre le POST commande.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
