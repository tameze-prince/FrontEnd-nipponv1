'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, ShieldCheck, UserCog } from 'lucide-react';

import { ProtectedRoute } from '@/components/middleware/ProtectedRoute';
import { AdminLayout } from '@/components/shared/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  userService,
  UserRole,
  UserStatus,
  type User,
} from '@/lib/user-service';
import { useAuthStore } from '@/stores/useAuthStore';

function roleLabel(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.OWNER:
      return 'Owner';
    case UserRole.PARTNER:
      return 'Partner';
    case UserRole.CUSTOMER:
    default:
      return 'Client';
  }
}

function roleBadge(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-700';
    case UserRole.OWNER:
      return 'bg-blue-100 text-blue-700';
    case UserRole.PARTNER:
      return 'bg-emerald-100 text-emerald-700';
    case UserRole.CUSTOMER:
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function AdminUsersPageContent() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');
    const response = await userService.getUsers(undefined, 1, 100, {
      role: filterRole === 'all' ? undefined : filterRole,
    });

    if (!response.success || !response.data) {
      setError(response.error || 'Impossible de charger les utilisateurs.');
      setUsers([]);
    } else {
      setUsers(response.data.data);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void loadUsers();
  }, [filterRole]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.phone, user.country, user.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [searchTerm, users]);

  const handleStatusToggle = async (target: User) => {
    const nextStatus =
      target.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const response = await userService.updateUserStatus(target.id, nextStatus);

    if (!response.success || !response.data) {
      setError(response.error || 'Impossible de mettre a jour le statut.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === target.id ? response.data! : user)));
  };

  const handleRoleChange = async (target: User, nextRole: UserRole) => {
    if (target.role === nextRole) {
      return;
    }

    const response = await userService.updateUserRole(target.id, nextRole);

    if (!response.success || !response.data) {
      setError(response.error || 'Impossible de mettre a jour le role.');
      return;
    }

    setUsers((current) => current.map((user) => (user.id === target.id ? response.data! : user)));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="mt-1 text-gray-600">
              Liste reelle backend avec filtre role et edition rapide du statut.
            </p>
          </div>

          <Button variant="outline" onClick={() => void loadUsers(true)} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Card className="border-0 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="Rechercher par nom, email, telephone ou zone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
            />

            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value as 'all' | UserRole)}
              className="rounded-lg border border-gray-200 px-4 py-2 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Tous les roles</option>
              <option value={UserRole.CUSTOMER}>Clients</option>
              <option value={UserRole.OWNER}>Owners</option>
              <option value={UserRole.PARTNER}>Partners</option>
              <option value={UserRole.ADMIN}>Admins</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Localisation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Chargement des utilisateurs...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Aucun utilisateur trouve.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sans nom'}
                          </p>
                          <p className="text-sm text-gray-500">{user.phone || 'Telephone non renseigne'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${roleBadge(user.role)}`}>
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {[user.city, user.country].filter(Boolean).join(', ') || 'Non renseignee'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            user.status === UserStatus.ACTIVE
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.status === UserStatus.ACTIVE ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusToggle(user)}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            {user.status === UserStatus.ACTIVE ? 'Desactiver' : 'Activer'}
                          </Button>

                          <select
                            value={user.role}
                            onChange={(event) => void handleRoleChange(user, event.target.value as UserRole)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                            disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'owner'}
                          >
                            <option value={UserRole.CUSTOMER}>Client</option>
                            <option value={UserRole.PARTNER}>Partner</option>
                            <option value={UserRole.OWNER}>Owner</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-0 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <UserCog className="mt-0.5 h-4 w-4 text-orange-500" />
            <p>
              Cette vue est maintenant branchee au backend. Le filtre role est serveur, la recherche
              textuelle est client-side sur la page chargee.
            </p>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'owner']}>
      <AdminUsersPageContent />
    </ProtectedRoute>
  );
}
