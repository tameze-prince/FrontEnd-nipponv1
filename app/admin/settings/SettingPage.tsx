'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, DollarSign, Bell, Eye, Lock, AlertCircle } from 'lucide-react';

interface CurrencyRate {
  id: number;
  currency: string;
  symbol: string;
  rate: number;
  lastUpdated: string;
}

const mockCurrencies: CurrencyRate[] = [
  { id: 1, currency: 'FCFA', symbol: 'FCFA', rate: 656, lastUpdated: '20/04/2024 14:00' },
  { id: 2, currency: 'USD', symbol: '$', rate: 1.2, lastUpdated: '20/04/2024 14:00' },
  { id: 3, currency: 'GBP', symbol: '£', rate: 0.87, lastUpdated: '20/04/2024 14:00' },
  { id: 4, currency: 'EUR', symbol: '€', rate: 1.0, lastUpdated: '20/04/2024 14:00' },
];

export default function AdminSettingsPage() {
  const [generealSettings, setGeneralSettings] = useState({
    storeName: 'NipponHub',
    storeEmail: 'contact@nipponhub.com',
    storePhone: '+237 6XX XXX XXX',
    whatsappNumber: '+237 6XX XXX XXX',
    mainCurrency: 'EUR',
    timezone: 'Africa/Douala',
  });

  const [currencySettings, setCurrencySettings] = useState(generealSettings.mainCurrency);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>(mockCurrencies);
  const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    orderStatusNotifications: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
  });

  const [saveSuccess, setSaveSuccess] = useState('');

  const handleGeneralSave = async () => {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaveSuccess('Paramètres généraux enregistrés');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleCurrencyUpdate = async (currencyId: number) => {
    setCurrencyRates(
      currencyRates.map((curr) =>
        curr.id === currencyId
          ? { ...curr, rate: parseFloat(editingRate), lastUpdated: new Date().toLocaleString() }
          : curr
      )
    );
    setEditingCurrencyId(null);
    setSaveSuccess('Taux de change mise à jour');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleNotificationsSave = async () => {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaveSuccess('Paramètres de notification enregistrés');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600 mt-1">Gérez les paramètres de votre boutique</p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-700">{saveSuccess}</p>
          </div>
        )}

        {/* General Settings */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Paramètres Généraux</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nom de la boutique</label>
                <input
                  type="text"
                  value={generealSettings.storeName}
                  onChange={(e) => setGeneralSettings({ ...generealSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email de contact</label>
                <input
                  type="email"
                  value={generealSettings.storeEmail}
                  onChange={(e) => setGeneralSettings({ ...generealSettings, storeEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Téléphone principal</label>
                <input
                  type="tel"
                  value={generealSettings.storePhone}
                  onChange={(e) => setGeneralSettings({ ...generealSettings, storePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Numéro WhatsApp</label>
                <input
                  type="tel"
                  value={generealSettings.whatsappNumber}
                  onChange={(e) => setGeneralSettings({ ...generealSettings, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Devise principale</label>
                <select
                  value={currencySettings}
                  onChange={(e) => setCurrencySettings(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  {currencyRates.map((curr) => (
                    <option key={curr.id} value={curr.currency}>
                      {curr.currency} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Fuseau horaire</label>
                <select
                  value={generealSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generealSettings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="Africa/Douala">Africa/Douala</option>
                  <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                  <option value="Africa/Libreville">Africa/Libreville</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGeneralSave}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </form>
        </Card>

        {/* Currency Exchange Rates */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              Taux de Change
            </h2>
            <div className="text-xs text-gray-500">Mise à jour automatique tous les jours à 14h</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Devise</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Symbole</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Taux (vs EUR)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Dernière mis à jour</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currencyRates.map((currency) => (
                  <tr key={currency.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-semibold text-gray-900">{currency.currency}</td>
                    <td className="py-4 px-4 text-gray-700">{currency.symbol}</td>
                    <td className="py-4 px-4">
                      {editingCurrencyId === currency.id ? (
                        <input
                          type="number"
                          value={editingRate}
                          onChange={(e) => setEditingRate(e.target.value)}
                          className="w-20 px-2 py-1 border border-orange-500 rounded"
                          step="0.01"
                        />
                      ) : (
                        <span className="text-gray-900">{currency.rate}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{currency.lastUpdated}</td>
                    <td className="py-4 px-4 flex gap-2">
                      {editingCurrencyId === currency.id ? (
                        <>
                          <button
                            onClick={() => handleCurrencyUpdate(currency.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingCurrencyId(null)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCurrencyId(currency.id);
                            setEditingRate(currency.rate.toString());
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Paramètres de Notification
          </h2>

          <div className="space-y-4">
            {[
              { id: 'emailNotifications', label: 'Notifications par email', icon: Mail },
              { id: 'whatsappNotifications', label: 'Notifications WhatsApp', icon: messageIcon },
              { id: 'orderStatusNotifications', label: 'Mises à jour statut commande', icon: Bell },
              { id: 'lowStockAlerts', label: 'Alertes stock faible', icon: AlertCircle },
              { id: 'newOrderAlerts', label: 'Alertes pour nouvelles commandes', icon: Bell },
            ].map((setting) => (
              <label key={setting.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  checked={notificationSettings[setting.id as keyof typeof notificationSettings]}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      [setting.id]: e.target.checked,
                    })
                  }
                  className="w-5 h-5 border-2 border-gray-300 rounded cursor-pointer accent-orange-500"
                />
                <span className="text-gray-900 font-medium flex-1">{setting.label}</span>
              </label>
            ))}
          </div>

          <Button
            onClick={handleNotificationsSave}
            className="mt-6 bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            Sécurité
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Mot de passe admin</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
                <Button variant="outline" className="text-orange-500 border-orange-500">
                  Modifier
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Authentification à deux facteurs</p>
                <p>Activez la 2FA pour renforcer la sécurité de votre compte administrateur</p>
              </div>
              <Button className="ml-auto text-blue-600 hover:bg-blue-100">Activer</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 bg-red-50 border border-red-200">
          <h2 className="text-lg font-bold text-red-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Zone Danger
          </h2>
          <p className="text-red-800 mb-4">Ces actions sont irréversibles. Procédez avec précaution.</p>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
            Supprimer toutes les données
          </Button>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Placeholder icon
const messageIcon = () => null;
const Mail = () => null;
