'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Mail, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { userService, UserRole, UserStatus, type User } from '@/lib/user-service';
import { useLocationStore } from '@/stores/useLocationStore';

function getFullName(user: User) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Client NipponHub';
}

function formatDate(value?: string) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminClientsPage() {
  const { selectedCountry } = useLocationStore();
  const [clients, setClients] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await userService.getUsers(
        selectedCountry?.id,
        1,
        100,
        { role: UserRole.CUSTOMER }
      );

      if (!response.success || !response.data) {
        setClients([]);
        setError(response.error || 'Impossible de charger les clients.');
        return;
      }

      setClients(response.data.data);
    } catch (err) {
      console.error('Clients loading error:', err);
      setClients([]);
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, [selectedCountry?.id]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) =>
      [getFullName(client), client.email, client.phone, client.city, client.country]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [clients, searchTerm]);

  const activeClients = clients.filter((client) => client.status === UserStatus.ACTIVE).length;
  const newThisMonth = clients.filter((client) => {
    const createdAt = new Date(client.createdAt);
    const now = new Date();
    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length;

  const exportClients = () => {
    const header = ['Nom', 'Email', 'Telephone', 'Ville', 'Pays', 'Statut', 'Inscription'];
    const rows = filteredClients.map((client) => [
      getFullName(client),
      client.email,
      client.phone || '',
      client.city || '',
      client.country || '',
      client.status,
      formatDate(client.createdAt),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clients-nipponhub.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Clients</h1>
              <p className="mt-1 text-gray-600">
                Clients charges depuis l API utilisateurs
                {selectedCountry ? ` pour ${selectedCountry.name}` : ''}.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={exportClients}
              disabled={filteredClients.length === 0}
              className="flex items-center gap-2 border-orange-500 text-orange-500"
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">Clients total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{clients.length}</p>
            </Card>
            <Card className="border-0 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">Clients actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{activeClients}</p>
            </Card>
            <Card className="border-0 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">Nouveaux ce mois</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{newThisMonth}</p>
            </Card>
            <Card className="border-0 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-600">Pays actif</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{selectedCountry?.code || 'Tous'}</p>
            </Card>
          </div>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher par nom, email, telephone ou zone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Nom</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Telephone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Zone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Statut</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Inscription</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Chargement des clients...
                      </td>
                    </tr>
                  ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-4 font-semibold text-gray-900">{getFullName(client)}</td>
                        <td className="px-4 py-4 text-gray-700">{client.email}</td>
                        <td className="px-4 py-4 text-gray-700">{client.phone || 'Non renseigne'}</td>
                        <td className="px-4 py-4 text-gray-700">
                          {[client.city, client.country].filter(Boolean).join(', ') || 'Non renseignee'}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              client.status === UserStatus.ACTIVE
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {client.status === UserStatus.ACTIVE ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{formatDate(client.createdAt)}</td>
                        <td className="flex gap-2 px-4 py-4">
                          <button
                            type="button"
                            onClick={() => toast.info(getFullName(client), { description: client.email })}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                            title="Voir profil"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={client.phone ? `https://wa.me/${client.phone.replace(/[^\d]/g, '')}` : undefined}
                            onClick={(event) => {
                              if (!client.phone) {
                                event.preventDefault();
                                toast.error('Aucun telephone pour ce client.');
                              }
                            }}
                            className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                            title="Envoyer message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>
                          <a
                            href={`mailto:${client.email}`}
                            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            title="Envoyer email"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Aucun client trouve
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
