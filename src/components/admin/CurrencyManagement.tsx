'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Edit, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
  active: boolean;
  createdAt: string;
}

export function CurrencyManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency: '',
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Country[]>('/api/v1/countries');
      if (!response.success || !response.data) throw new Error(response.error || 'Erreur lors de la recuperation');
      setCountries(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (country?: Country) => {
    if (country) {
      setEditingId(country.id);
      setFormData({
        name: country.name,
        code: country.code,
        currency: country.currency,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', currency: '' });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.currency) {
      toast({
        title: 'Erreur',
        description: 'Tous les champs sont requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/v1/countries/${editingId}`
        : '/api/v1/countries';

      const response =
        method === 'PUT'
          ? await apiClient.put<Country>(url, formData)
          : await apiClient.post<Country>(url, { ...formData, active: true });

      if (!response.success) throw new Error(response.error || 'Erreur lors de la sauvegarde');

      toast({
        title: 'Succès',
        description: editingId ? 'Devise mise à jour' : 'Pays créé',
      });

      setOpenDialog(false);
      void fetchCountries();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Gestion des Devises</CardTitle>
            <CardDescription>
              Configurer la devise de chaque pays
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un pays
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pays</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell>{country.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {country.code}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {country.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={country.active ? 'default' : 'secondary'}>
                        {country.active ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {country.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(country)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier la devise' : 'Ajouter un pays'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Mettez à jour les informations du pays'
                : 'Créez un nouveau pays avec sa devise'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du pays</label>
              <Input
                placeholder="ex: Cameroun"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Code</label>
              <Input
                placeholder="ex: CM"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                maxLength={5}
                disabled={!!editingId}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Devise (Code ISO)</label>
              <Input
                placeholder="ex: XAF, EUR, USD"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value.toUpperCase() })
                }
                maxLength={10}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
