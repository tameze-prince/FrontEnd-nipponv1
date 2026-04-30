'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  MessageCircleMore,
  PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import AuthPromptCard from '@/components/shared/AuthPromptCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { locationService } from '@/lib/location-service';
import { orderService, type Order } from '@/lib/order-service';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { useOrderStore, type LastOrderSnapshot } from '@/stores/useOrderStore';

interface OrderConfirmationExperienceProps {
  orderId: string;
}

type DisplayOrder = {
  id: string;
  orderNumber: string;
  countryId?: number;
  cityId?: number;
  countryName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationLabel: string;
  address: string;
  note: string;
  paymentLabel: string;
  subtotal: number;
  shipping: number;
  total: number;
  currencySymbol: string;
  invoiceUrl?: string;
  createdAt: string;
  items: Array<{
    key: string;
    name: string;
    quantity: number;
    total: number;
    currencySymbol: string;
  }>;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  source: 'backend' | 'local';
};

function sanitizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, '');
}

function buildWhatsappMessage(order: DisplayOrder) {
  const lines = [
    `Bonjour NipponHub, je confirme ma commande ${order.orderNumber}.`,
    `Client: ${order.customerName}`,
    `Telephone: ${order.customerPhone || 'Non renseigne'}`,
    `Zone: ${order.locationLabel}`,
    `Total: ${formatMoney(order.total, order.currencySymbol)}`,
  ];

  if (order.address) {
    lines.push(`Adresse: ${order.address}`);
  }

  if (order.note) {
    lines.push(`Note: ${order.note}`);
  }

  return lines.join('\n');
}

function resolveWhatsappCountryId(
  order: DisplayOrder,
  selectedCountry: { id: number; name: string } | null
) {
  if (order.countryId) {
    return order.countryId;
  }

  if (selectedCountry && (!order.countryName || order.countryName === selectedCountry.name)) {
    return selectedCountry.id;
  }

  return undefined;
}

function formatMoney(amount: number, currencySymbol: string) {
  return `${currencySymbol} ${amount.toLocaleString()}`;
}

function paymentLabel(method?: LastOrderSnapshot['paymentMethod']) {
  switch (method) {
    case 'cod':
      return 'Paiement a la livraison';
    case 'mobile-money':
      return 'Mobile Money';
    case 'retrieve':
      return 'Retrait en point NipponHub';
    default:
      return 'Paiement confirme';
  }
}

function getStatusSteps(status: DisplayOrder['status']) {
  const stepDefinitions = [
    'Commande recue',
    'Preparation',
    'Preparation',
    'Livraison',
  ] as const;
  const statusToIndex: Record<DisplayOrder['status'], number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELLED: 0,
  };

  if (status === 'CANCELLED') {
    return stepDefinitions.map((label, index) => ({
      label,
      state: index === 0 ? 'complete' : 'pending',
    }));
  }

  const activeIndex = statusToIndex[status];

  return stepDefinitions.map((label, index) => ({
    label,
    state: index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending',
  }));
}

function toDisplayOrderFromSnapshot(order: LastOrderSnapshot): DisplayOrder {
  return {
    id: order.orderId,
    orderNumber: order.orderNumber || order.orderId,
    countryId: order.countryId,
    cityId: order.cityId,
    countryName: order.countryName,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    locationLabel: order.locationLabel,
    address: order.address,
    note: order.note,
    paymentLabel: paymentLabel(order.paymentMethod),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    currencySymbol: order.currencySymbol,
    invoiceUrl: undefined,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      key: `${item.productId}-${item.variantId ?? 'base'}`,
      name: item.name,
      quantity: item.quantity,
      total: item.price * item.quantity,
      currencySymbol: item.currencySymbol,
    })),
    status: 'CONFIRMED',
    source: 'local',
  };
}

function toDisplayOrderFromBackend(
  order: Order,
  fallback: LastOrderSnapshot | null,
  user: { name?: string; email?: string; phone?: string } | null
): DisplayOrder {
  const currencySymbol = fallback?.currencySymbol || 'FCFA';
  const locationLabel =
    [order.city?.name || order.cityName, order.countryName].filter(Boolean).join(', ') ||
    fallback?.locationLabel ||
    'Ville non renseignee';

  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    countryId: fallback?.countryId,
    cityId: fallback?.cityId,
    countryName: order.countryName || fallback?.countryName,
    customerName: fallback?.customerName || user?.name || 'Client NipponHub',
    customerEmail: fallback?.customerEmail || user?.email || '',
    customerPhone: fallback?.customerPhone || user?.phone || '',
    locationLabel,
    address: fallback?.address || '',
    note: fallback?.note || order.notes || '',
    paymentLabel: paymentLabel(fallback?.paymentMethod),
    subtotal: order.subtotal,
    shipping: fallback?.shipping ?? order.shippingCost,
    total: order.totalAmount,
    currencySymbol,
    invoiceUrl: order.invoiceUrl,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      key: item.id || item.variantId,
      name:
        item.productName ||
        item.variantLabel ||
        [item.variantColor, item.variantSize].filter(Boolean).join(' / ') ||
        'Produit NipponHub',
      quantity: item.quantity,
      total: item.subtotal,
      currencySymbol,
    })),
    status: order.status,
    source: 'backend',
  };
}

export default function OrderConfirmationExperience({
  orderId,
}: OrderConfirmationExperienceProps) {
  const { lastOrder, clearLastOrder } = useOrderStore();
  const { isAuthenticated, user } = useAuthStore();
  const { selectedCountry } = useLocationStore();

  const localOrder =
    lastOrder?.orderId === orderId || lastOrder?.orderNumber === orderId ? lastOrder : null;

  const [backendOrder, setBackendOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState<string | null>(null);
  const [isLoadingWhatsapp, setIsLoadingWhatsapp] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Si c'est un ID local (commence par LOCAL-), ne pas appeler le backend
    if (orderId.startsWith('LOCAL-')) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadOrder = async () => {
      setIsLoading(true);
      setLoadError(null);

      const response = await orderService.getOrder(orderId);

      if (!active) {
        return;
      }

      if (response.success && response.data) {
        setBackendOrder(response.data);
        setLoadError(null);
      } else {
        setBackendOrder(null);
        setLoadError(response.error || 'Impossible de charger cette commande.');
      }

      setIsLoading(false);
    };

    void loadOrder();

    return () => {
      active = false;
    };
  }, [isAuthenticated, orderId]);

  const order = useMemo<DisplayOrder | null>(() => {
    if (backendOrder) {
      return toDisplayOrderFromBackend(
        backendOrder,
        localOrder,
        user
          ? {
              name: user.name,
              email: user.email,
              phone: user.phone,
            }
          : null
      );
    }

    if (localOrder) {
      return toDisplayOrderFromSnapshot(localOrder);
    }

    return null;
  }, [backendOrder, localOrder, user]);

  const statusSteps = useMemo(
    () => getStatusSteps(order?.status || 'PENDING'),
    [order?.status]
  );
  const whatsappCountryId = useMemo(
    () => (order ? resolveWhatsappCountryId(order, selectedCountry) : undefined),
    [order, selectedCountry]
  );
  const effectiveWhatsappHref = whatsappCountryId ? whatsappHref : null;

  useEffect(() => {
    if (!order || !whatsappCountryId) {
      return;
    }

    let active = true;

    const loadWhatsappContact = async () => {
      setIsLoadingWhatsapp(true);

      const response = await locationService.getWhatsappContacts(whatsappCountryId);

      if (!active) {
        return;
      }

      const contactNumber =
        response.data?.find((contact) => contact.active)?.whatsappNumber ||
        response.data?.[0]?.whatsappNumber;

      if (contactNumber) {
        setWhatsappHref(
          `https://wa.me/${sanitizePhoneNumber(contactNumber)}?text=${encodeURIComponent(
            buildWhatsappMessage(order)
          )}`
        );
      } else {
        setWhatsappHref(null);
      }

      setIsLoadingWhatsapp(false);
    };

    void loadWhatsappContact();

    return () => {
      active = false;
    };
  }, [order, whatsappCountryId]);

  if (!isAuthenticated && !localOrder) {
    return (
      <AuthPromptCard
        title="Connexion requise pour voir la commande"
        description="Reconnectez-vous pour recharger votre commande depuis le backend et suivre son etat apres un refresh ou une reouverture du lien."
        redirectTo={`/orders/${orderId}`}
      />
    );
  }

  if (isLoading && !order) {
    return (
      <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
        <CardContent className="space-y-6 py-14">
          <div className="h-10 w-40 rounded-full bg-slate-100" />
          <div className="h-8 w-72 rounded bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 rounded-[1.5rem] bg-slate-100" />
            <div className="h-24 rounded-[1.5rem] bg-slate-100" />
            <div className="h-24 rounded-[1.5rem] bg-slate-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
        <CardContent className="space-y-5 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <PackageCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-950">Commande introuvable</h2>
            <p className="mx-auto max-w-lg text-sm leading-7 text-slate-500">
              {loadError ||
                'Ni le recapitulatif local ni le backend ne renvoient cette commande pour le moment.'}
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
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <Card className="rounded-[2rem] border-0 bg-[linear-gradient(135deg,#fff3e8,#ffffff,#fff5ed)] shadow-xl shadow-orange-100/40">
          <CardContent className="space-y-6 pt-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                Commande confirmee
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Merci, {order.customerName.split(' ')[0] || 'client'}.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Votre commande <span className="font-semibold text-slate-950">{order.orderNumber}</span>{' '}
                est bien enregistree. Elle est maintenant chargee depuis le{' '}
                <span className="font-semibold text-slate-950">
                  {order.source === 'backend' ? 'backend' : 'recapitulatif local'}
                </span>
                .
              </p>
              {loadError && order.source === 'local' ? (
                <p className="text-sm font-medium text-orange-700">
                  Backend indisponible pour le moment: {loadError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paiement</p>
                <p className="mt-2 font-semibold text-slate-950">{order.paymentLabel}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Livraison</p>
                <p className="mt-2 font-semibold text-slate-950">{order.locationLabel}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className="mt-2 font-semibold text-slate-950">
                  {formatMoney(order.total, order.currencySymbol)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  order.invoiceUrl
                    ? window.open(order.invoiceUrl, '_blank', 'noopener,noreferrer')
                    : toast.success('Facture de demonstration', {
                        description: 'Le PDF viendra avec le backend de commandes.',
                      })
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Facture
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  effectiveWhatsappHref
                    ? window.open(effectiveWhatsappHref, '_blank', 'noopener,noreferrer')
                    : toast.error('Aucun contact WhatsApp configure pour cette zone.')
                }
              >
                <MessageCircleMore className="mr-2 h-4 w-4" />
                {isLoadingWhatsapp ? 'Preparation...' : 'WhatsApp'}
              </Button>
              <Button asChild className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/products">
                  Continuer mes achats
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
          <CardContent className="space-y-5 pt-6">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                Suivi
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Etat de la commande</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {statusSteps.map((step) => (
                <div
                  key={step.label}
                  className={`rounded-[1.5rem] border p-4 ${
                    step.state === 'complete'
                      ? 'border-emerald-200 bg-emerald-50'
                      : step.state === 'active'
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-950">{step.label}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {step.state === 'complete'
                      ? 'Valide'
                      : step.state === 'active'
                        ? 'En cours'
                        : 'A venir'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/30">
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                Resume
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Details utiles</h2>
            </div>

            <div className="rounded-[1.5rem] bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-slate-950">
                <Clock3 className="h-4 w-4 text-orange-500" />
                <p className="font-semibold">Commande {order.orderNumber}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {order.customerEmail || 'Email non renseigne'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {order.customerPhone || 'Telephone non renseigne'}
              </p>
              {order.address ? (
                <p className="mt-1 text-sm text-slate-600">{order.address}</p>
              ) : null}
              {order.note ? (
                <p className="mt-2 text-sm text-slate-500">{order.note}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.key} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-950">
                      {formatMoney(item.total, item.currencySymbol)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Sous-total</span>
                <span>{formatMoney(order.subtotal, order.currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Livraison</span>
                <span>
                  {order.shipping === 0
                    ? 'Offerte'
                    : formatMoney(order.shipping, order.currencySymbol)}
                </span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-200">Total</span>
                <span className="text-3xl font-black">
                  {formatMoney(order.total, order.currencySymbol)}
                </span>
              </div>
            </div>

            {localOrder ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearLastOrder}
                className="rounded-full text-slate-500"
              >
                Effacer ce recapitulatif local
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
