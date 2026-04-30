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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Edit, Trash, MessageCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
}

interface City {
  id: number;
  name: string;
  countryId: number;
  countryName: string;
  active: boolean;
  whatsappContacts?: WhatsappContact[];
}

interface WhatsappContact {
  id: number;
  cityId: number;
  cityName: string;
  whatsappNumber: string;
  label: string;
  active: boolean;
}

export function WhatsappCityManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [whatsappDialog, setWhatsappDialog] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState<WhatsappContact | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const { toast } = useToast();

  const [cityForm, setCityForm] = useState({ name: '' });
  const [whatsappForm, setWhatsappForm] = useState({
    whatsappNumber: '',
    label: '',
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchCities(Number(selectedCountry));
    }
  }, [selectedCountry]);

  const fetchCountries = async () => {
    try {
      const response = await apiClient.get<Country[]>('/api/v1/countries/active');
      if (!response.success || !response.data) throw new Error(response.error || 'Erreur');
      setCountries(response.data);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pays',
        variant: 'destructive',
      });
    }
  };

  const fetchCities = async (countryId: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get<City[]>(`/api/v1/cities/by-country/${countryId}`);
      if (!response.success || !response.data) throw new Error(response.error || 'Erreur');
      setCities(response.data);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les villes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    if (!cityForm.name || !selectedCountry) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.post<City>('/api/v1/cities', {
        countryId: Number(selectedCountry),
        name: cityForm.name,
      });

      if (!response.success) throw new Error(response.error || 'Erreur');

      toast({ title: 'Succès', description: 'Ville créée' });
      setCityForm({ name: '' });
      setOpenDialog(false);
      void fetchCities(Number(selectedCountry));
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const handleAddWhatsapp = async () => {
    const sanitizedNumber = whatsappForm.whatsappNumber.replace(/[^\d+]/g, '');

    if (!sanitizedNumber || !selectedCity) {
      toast({
        title: 'Erreur',
        description: 'Veuillez renseigner un numero WhatsApp valide',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[+]?[0-9]{1,15}$/.test(sanitizedNumber)) {
      toast({
        title: 'Erreur',
        description: 'Le numero doit contenir uniquement + et 15 chiffres maximum.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = editingWhatsapp ? 'PUT' : 'POST';
      const url = editingWhatsapp
        ? `/api/v1/cities/whatsapp/${editingWhatsapp.id}`
        : `/api/v1/cities/${selectedCity}/whatsapp`;

      const payload = {
        cityId: selectedCity,
        whatsappNumber: sanitizedNumber,
        label: whatsappForm.label || 'Support',
        active: true,
      };

      const response =
        method === 'PUT'
          ? await apiClient.put<WhatsappContact>(url, payload)
          : await apiClient.post<WhatsappContact>(url, payload);

      if (!response.success) throw new Error(response.error || 'Erreur');

      toast({
        title: 'Succès',
        description: editingWhatsapp
          ? 'Contact mis à jour'
          : 'Contact créé',
      });

      setWhatsappForm({ whatsappNumber: '', label: '' });
      setEditingWhatsapp(null);
      setWhatsappDialog(false);
      if (selectedCountry) void fetchCities(Number(selectedCountry));
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWhatsapp = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr?')) return;

    try {
      const response = await apiClient.delete<void>(`/api/v1/cities/whatsapp/${contactId}`);

      if (!response.success) throw new Error(response.error || 'Erreur');

      toast({ title: 'Succès', description: 'Contact supprimé' });
      if (selectedCountry) void fetchCities(Number(selectedCountry));
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Villes et Contacts WhatsApp</CardTitle>
          <CardDescription>
            Gérez les villes et leurs numéros WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sélectionner un pays</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCountry && (
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ville
            </Button>
          )}

          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : (
            <div className="space-y-4">
              {cities.map((city) => (
                <Card key={city.id} className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{city.name}</CardTitle>
                      <Badge
                        variant={city.active ? 'default' : 'secondary'}>
                        {city.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCity(city.id);
                          setEditingWhatsapp(null);
                          setWhatsappForm({ whatsappNumber: '', label: '' });
                          setWhatsappDialog(true);
                        }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter contact WhatsApp
                      </Button>
                    </div>

                    {(city.whatsappContacts || []).length > 0 ? (
                      <div className="space-y-2">
                        {(city.whatsappContacts || []).map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="font-mono font-semibold">
                                  {contact.whatsappNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {contact.label}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCity(city.id);
                                  setEditingWhatsapp(contact);
                                  setWhatsappForm({
                                    whatsappNumber: contact.whatsappNumber,
                                    label: contact.label,
                                  });
                                  setWhatsappDialog(true);
                                }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteWhatsapp(contact.id)
                                }>
                                <Trash className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Aucun contact WhatsApp
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une ville</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom de la ville</label>
              <Input
                placeholder="ex: Yaoundé"
                value={cityForm.name}
                onChange={(e) => setCityForm({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateCity}>Créer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappDialog} onOpenChange={setWhatsappDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWhatsapp
                ? 'Modifier contact WhatsApp'
                : 'Ajouter contact WhatsApp'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Numéro WhatsApp
              </label>
              <Input
                placeholder="+237 6XX XXX XXX"
                value={whatsappForm.whatsappNumber}
                onChange={(e) =>
                  setWhatsappForm({
                    ...whatsappForm,
                    whatsappNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Libellé (optionnel)
              </label>
              <Input
                placeholder="ex: Support client"
                value={whatsappForm.label}
                onChange={(e) =>
                  setWhatsappForm({
                    ...whatsappForm,
                    label: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setWhatsappDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddWhatsapp}>
                {editingWhatsapp ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
