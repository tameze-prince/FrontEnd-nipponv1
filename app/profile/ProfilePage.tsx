'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit2,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authService } from '@/lib/auth-service';
import { orderService, type Order } from '@/lib/order-service';
import { userService, type UserAddress } from '@/lib/user-service';
import { wishlistService, type WishlistItem } from '@/lib/wishlist-service';
import { getDashboardRoute } from '@/middleware/auth-guard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';

type TabId = 'profile' | 'orders' | 'addresses' | 'favorites';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'profile', label: 'Mon Profil' },
  { id: 'orders', label: 'Mes Commandes' },
  { id: 'addresses', label: 'Mes Adresses' },
  { id: 'favorites', label: 'Mes Favoris' },
];

const orderStatusConfig: Record<
  Order['status'],
  { label: string; className: string }
> = {
  PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmee', className: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'En preparation', className: 'bg-indigo-100 text-indigo-800' },
  SHIPPED: { label: 'Expediee', className: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Livree', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulee', className: 'bg-red-100 text-red-800' },
};

function formatDate(value?: string) {
  if (!value) return 'Date indisponible';

  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function getWishlistProductName(item: WishlistItem) {
  return (
    item.variant?.productName ||
    item.variant?.product?.name ||
    item.variant?.label ||
    `Variante #${item.variantId}`
  );
}

function getWishlistProductPrice(item: WishlistItem) {
  return item.variant?.price ?? item.variant?.finalPrice ?? item.variant?.product?.basePrice ?? 0;
}

function getWishlistImageLabel(item: WishlistItem) {
  const label = item.variant?.label || item.variant?.product?.name || item.variantId;
  return label?.slice(0, 24) || 'Produit';
}

function ProfileContent() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const { addToCart } = useCartStore();

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [addressesMessage, setAddressesMessage] = useState('');
  const [addressesChecked, setAddressesChecked] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Domicile',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    let active = true;

    const loadCurrentUser = async () => {
      const response = await authService.getCurrentUser();

      if (!active || !response.success || !response.data) {
        return;
      }

      const hasChanged =
        user?.id !== response.data.id ||
        user?.email !== response.data.email ||
        user?.firstName !== response.data.firstName ||
        user?.lastName !== response.data.lastName ||
        user?.phone !== response.data.phone ||
        user?.country !== response.data.country ||
        user?.city !== response.data.city ||
        user?.role !== response.data.role;

      if (!hasChanged) {
        return;
      }

      setUser({
        ...(user || {}),
        ...response.data,
      });
    };

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [setUser, user]);

  useEffect(() => {
    if (activeTab !== 'orders' || ordersLoaded) {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      setIsLoadingOrders(true);
      const response = await orderService.getMyOrders(0, 20);

      if (!active) {
        return;
      }

      if (response.success && response.data) {
        setOrders(response.data.data);
        setOrdersLoaded(true);
      } else {
        setError(response.error || 'Impossible de charger vos commandes.');
      }

      setIsLoadingOrders(false);
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, [activeTab, ordersLoaded]);

  useEffect(() => {
    if (activeTab !== 'favorites' || favoritesLoaded) {
      return;
    }

    let active = true;

    const loadFavorites = async () => {
      setIsLoadingFavorites(true);
      const response = await wishlistService.getWishlist();

      if (!active) {
        return;
      }

      if (response.success && response.data) {
        setFavorites(response.data);
        setFavoritesLoaded(true);
      } else {
        setError(response.error || 'Impossible de charger vos favoris.');
      }

      setIsLoadingFavorites(false);
    };

    void loadFavorites();

    return () => {
      active = false;
    };
  }, [activeTab, favoritesLoaded]);

  useEffect(() => {
    if (activeTab !== 'addresses' || addressesChecked) {
      return;
    }

    let active = true;

    const checkAddresses = async () => {
      setIsLoadingAddresses(true);
      const response = await userService.getAddresses();

      if (!active) {
        return;
      }

      if (response.success && response.data) {
        setAddresses(response.data);
        setAddressesMessage(
          response.data.length === 0
            ? 'Aucune adresse enregistree pour le moment.'
            : 'Adresses synchronisees avec le backend.'
        );
      } else {
        setAddresses([]);
        setAddressesMessage(response.error || 'Impossible de charger les adresses.');
      }
      setAddressesChecked(true);
      setIsLoadingAddresses(false);
    };

    void checkAddresses();

    return () => {
      active = false;
    };
  }, [activeTab, addressesChecked]);

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true);
      setError('');

      const response = await authService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      });

      if (!response.success || !response.data) {
        setError(response.error || 'Impossible de mettre le profil a jour.');
        return;
      }

      setUser({
        ...(user || {}),
        ...response.data,
        country: user?.country,
        city: user?.city,
      });
      setIsEditing(false);
      toast.success('Profil mis a jour');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre le profil a jour.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleAddFavoriteToCart = (item: WishlistItem) => {
    const price = getWishlistProductPrice(item);
    const name = getWishlistProductName(item);
    const productId = item.variant?.product?.id || item.variantId;

    if (!productId || !name || price <= 0) {
      toast.error('Impossible d ajouter ce favori au panier pour le moment.');
      return;
    }

    addToCart({
      productId,
      productSlug: item.variant?.product?.slug,
      variantId: item.variantId || item.variant?.id,
      variantLabel: item.variant?.label,
      name,
      price,
      quantity: 1,
      image: item.variant?.image || item.variant?.imageUrl || item.variant?.product?.imageUrls?.[0],
      currencySymbol: 'FCFA',
    });

    toast.success('Produit ajoute au panier');
  };

  const handleRemoveFavorite = async (variantId: string) => {
    const response = await wishlistService.removeFromWishlist(variantId);

    if (!response.success) {
      toast.error(response.error || 'Suppression impossible');
      return;
    }

    setFavorites((current) => current.filter((item) => item.variantId !== variantId));
    toast.success('Favori retire');
  };

  const handleAddressField = (key: keyof typeof addressForm, value: string | boolean) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.label.trim() ||
      !addressForm.firstName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.address.trim() ||
      !addressForm.city.trim() ||
      !addressForm.country.trim()
    ) {
      toast.error('Completez les champs obligatoires de l adresse.');
      return;
    }

    setIsSavingAddress(true);

    const response = await userService.createAddress(addressForm);

    if (!response.success || !response.data) {
      setIsSavingAddress(false);
      toast.error(response.error || 'Impossible d enregistrer cette adresse.');
      return;
    }

    setAddresses((current) => {
      const next = response.data!.isDefault
        ? current.map((address) => ({ ...address, isDefault: false }))
        : current;
      return [response.data!, ...next];
    });
    setAddressesMessage('Adresse enregistree avec succes.');
    setAddressForm({
      label: 'Domicile',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: '',
      city: user?.city || '',
      state: '',
      country: user?.country || '',
      postalCode: '',
      isDefault: false,
    });
    setIsSavingAddress(false);
    toast.success('Adresse ajoutee');
  };

  const handleDeleteAddress = async (addressId: string) => {
    const response = await userService.deleteAddress(addressId);

    if (!response.success) {
      toast.error(response.error || 'Suppression impossible.');
      return;
    }

    const refreshed = await userService.getAddresses();
    if (refreshed.success && refreshed.data) {
      setAddresses(refreshed.data);
    } else {
      setAddresses((current) => current.filter((address) => address.id !== addressId));
    }
    toast.success('Adresse supprimee');
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const response = await userService.setDefaultAddress(addressId);

    if (!response.success || !response.data) {
      toast.error(response.error || 'Impossible de changer l adresse par defaut.');
      return;
    }

    setAddresses((current) =>
      current.map((address) => ({
        ...address,
        isDefault: address.id === response.data!.id,
      }))
    );
    toast.success('Adresse par defaut mise a jour');
  };

  const dashboardRoute = getDashboardRoute(user?.role);
  const canAccessDashboard =
    user?.role === 'admin' || user?.role === 'owner' || user?.role === 'partner';
  const resolvedProfileData = {
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
  };
  const displayedProfileData = isEditing ? profileData : resolvedProfileData;

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }

    setProfileData(resolvedProfileData);
    setIsEditing(true);
  };

  useEffect(() => {
    setAddressForm((current) => ({
      ...current,
      firstName: user?.firstName || user?.name?.split(' ')[0] || current.firstName,
      lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || current.lastName,
      phone: user?.phone || current.phone,
      city: user?.city || current.city,
      country: user?.country || current.country,
    }));
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Retour a l&apos;accueil
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Mon Compte</h1>
            <p className="mt-1 text-gray-600">
              Gerez vos informations personnelles et vos acces.
            </p>
          </div>

          {canAccessDashboard ? (
            <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href={dashboardRoute}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Acceder a mon dashboard
              </Link>
            </Button>
          ) : null}
        </div>

        <Card className="mb-6 border-0 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-3xl font-bold text-white">
                {(displayedProfileData.firstName || user?.name || 'N').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {displayedProfileData.firstName} {displayedProfileData.lastName}
                </h2>
                <p className="text-gray-600">
                  {[displayedProfileData.city, displayedProfileData.country]
                    .filter(Boolean)
                    .join(', ') || 'Localisation non renseignee'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Role: <span className="font-semibold uppercase">{user?.role || 'customer'}</span>
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Deconnexion
            </Button>
          </div>
        </Card>

        <div className="mb-6 rounded-lg border-0 bg-white shadow-sm">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {activeTab === 'profile' && (
          <Card className="border-0 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Informations Personnelles</h3>
              <Button
                type="button"
                onClick={handleEditToggle}
                variant="outline"
                className="flex items-center gap-2 border-orange-500 text-orange-500"
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </>
                )}
              </Button>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Prenom</label>
                  <input
                    type="text"
                    value={displayedProfileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Nom</label>
                  <input
                    type="text"
                    value={displayedProfileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={displayedProfileData.email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Phone className="h-4 w-4" />
                  Telephone WhatsApp
                </label>
                <input
                  type="tel"
                  value={displayedProfileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Pays</label>
                  <input
                  type="text"
                  value={displayedProfileData.country}
                  disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Ville</label>
                  <input
                  type="text"
                  value={displayedProfileData.city}
                  disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={handleProfileUpdate}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              ) : null}
            </form>
          </Card>
        )}

        {activeTab === 'orders' && (
          <Card className="border-0 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-gray-900">Mes Commandes</h3>

            {isLoadingOrders ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Chargement de vos commandes...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                Aucune commande trouvee pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = orderStatusConfig[order.status] || orderStatusConfig.PENDING;

                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              {[order.city?.name || order.cityName, order.countryName]
                                .filter(Boolean)
                                .join(', ') || 'Zone non renseignee'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                            <p className="font-semibold text-orange-600">
                              {order.totalAmount.toLocaleString()} FCFA
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'addresses' && (
          <Card className="border-0 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Mes Adresses</h3>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                {addresses.length} adresse{addresses.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-gray-700">
                  {addressesMessage}
                </div>

                {isLoadingAddresses ? (
                  <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
                    Chargement des adresses...
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
                    Aucune adresse disponible pour le moment.
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="rounded-lg border border-gray-200 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{address.label}</p>
                            {address.isDefault ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                Par defaut
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-gray-700">
                            {address.firstName} {address.lastName}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{address.phone}</p>
                          <p className="mt-1 text-sm text-gray-600">{address.address}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!address.isDefault ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSetDefaultAddress(address.id)}
                            >
                              Definir par defaut
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-5">
                <div className="mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-semibold text-gray-900">Ajouter une adresse</p>
                    <p className="text-sm text-gray-500">Enregistrement direct dans le backend.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <input
                    value={addressForm.label}
                    onChange={(event) => handleAddressField('label', event.target.value)}
                    placeholder="Label"
                    className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={addressForm.firstName}
                      onChange={(event) => handleAddressField('firstName', event.target.value)}
                      placeholder="Prenom"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      value={addressForm.lastName}
                      onChange={(event) => handleAddressField('lastName', event.target.value)}
                      placeholder="Nom"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <input
                    value={addressForm.phone}
                    onChange={(event) => handleAddressField('phone', event.target.value)}
                    placeholder="Telephone"
                    className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    value={addressForm.address}
                    onChange={(event) => handleAddressField('address', event.target.value)}
                    placeholder="Adresse"
                    className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={addressForm.city}
                      onChange={(event) => handleAddressField('city', event.target.value)}
                      placeholder="Ville"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      value={addressForm.state}
                      onChange={(event) => handleAddressField('state', event.target.value)}
                      placeholder="Region / Etat"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={addressForm.country}
                      onChange={(event) => handleAddressField('country', event.target.value)}
                      placeholder="Pays"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      value={addressForm.postalCode}
                      onChange={(event) => handleAddressField('postalCode', event.target.value)}
                      placeholder="Code postal"
                      className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) => handleAddressField('isDefault', event.target.checked)}
                    />
                    Definir comme adresse par defaut
                  </label>

                  <Button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={isSavingAddress}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {isSavingAddress ? 'Enregistrement...' : 'Ajouter cette adresse'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h3 className="mb-6 text-lg font-bold text-gray-900">
              Mes Favoris ({favorites.length})
            </h3>

            {isLoadingFavorites ? (
              <Card className="border-0 bg-white p-8 shadow-sm">
                <div className="text-center text-sm text-gray-500">Chargement de vos favoris...</div>
              </Card>
            ) : favorites.length === 0 ? (
              <Card className="border-0 bg-white p-8 shadow-sm">
                <div className="text-center text-sm text-gray-500">
                  Aucun favori pour le moment.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((product) => (
                  <Card
                    key={product.id}
                    className="border-0 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span className="text-sm font-semibold text-slate-500">
                        {getWishlistImageLabel(product)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(product.variantId)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>

                    <p className="font-semibold text-gray-900">{getWishlistProductName(product)}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.variant?.label || `Variante #${product.variantId}`}
                    </p>
                    <p className="mt-2 text-lg font-bold text-orange-600">
                      {getWishlistProductPrice(product).toLocaleString()} FCFA
                    </p>

                    <Button
                      type="button"
                      onClick={() => handleAddFavoriteToCart(product)}
                      className="mt-4 w-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Ajouter au panier
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
