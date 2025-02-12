
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash, Save } from "lucide-react";
import type { FinancialFormData } from "@/types/budget";

const currentYear = new Date().getFullYear();
const yearRange = Array.from({ length: 10 }, (_, i) => currentYear + i);
const months = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

const formSchema = z.object({
  axeIT: z.string().min(1, "L'Axe IT est requis"),
  groupe2: z.string().min(1, "Le Groupe 2 est requis"),
  contrePartie: z.string().min(1, "La Contre-partie est requise"),
  libContrePartie: z.string().min(1, "Le libellé de contre-partie est requis"),
  annee: z.number().min(currentYear, "L'année doit être supérieure ou égale à l'année en cours"),
  mois: z.number().min(1).max(12),
  montantReel: z.number().optional(),
  budget: z.number().optional(),
  atterissage: z.number().optional(),
  plan: z.number().optional()
});

type FormSchema = z.infer<typeof formSchema>;

export default function Interface() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FinancialFormData[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      axeIT: "",
      groupe2: "",
      contrePartie: "",
      libContrePartie: "",
      annee: currentYear,
      mois: new Date().getMonth() + 1,
    },
  });

  const { watch, setValue } = form;
  const formValues = watch();

  const loadEntries = async () => {
    try {
      const response = await fetch('http://localhost/api/crud.php');
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const validatePlan = (value: number | undefined) => {
    if (value !== undefined && formValues.annee <= currentYear) {
      return "Le plan ne peut être défini que pour les années futures";
    }
    return true;
  };

  const calculatedFields = {
    ecartBudgetReel: (formValues.budget || 0) - (formValues.montantReel || 0),
    ecartBudgetAtterrissage: (formValues.budget || 0) - (formValues.atterissage || 0),
    budgetYTD: formValues.budget ? (formValues.budget * formValues.mois) / 12 : 0,
    budgetVsReelYTD: (formValues.budget ? (formValues.budget * formValues.mois) / 12 : 0) - (formValues.montantReel || 0),
  };

  const onSubmit = async (values: FormSchema) => {
    const planValidation = validatePlan(values.plan);
    if (planValidation !== true) {
      form.setError('plan', { message: planValidation });
      return;
    }

    try {
      if (editingId !== null) {
        await fetch('http://localhost/api/crud.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...values, id: editingId }),
        });

        toast({
          title: "Succès",
          description: "Les données ont été mises à jour avec succès",
        });
      } else {
        await fetch('http://localhost/api/crud.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        toast({
          title: "Succès",
          description: "Les nouvelles données ont été enregistrées",
        });
      }

      await loadEntries();
      setEditingId(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'opération",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: FinancialFormData) => {
    if (entry.id) {
      Object.keys(entry).forEach((key) => {
        if (key !== 'id') {
          setValue(key as keyof FormSchema, entry[key as keyof FormSchema]);
        }
      });
      setEditingId(entry.id);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost/api/crud.php?id=${id}`, {
        method: 'DELETE',
      });

      toast({
        title: "Succès",
        description: "Les données ont été supprimées avec succès",
      });

      await loadEntries();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les données",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Données Financières</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="axeIT"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Axe IT</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez l'axe IT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="groupe2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Groupe 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez le groupe 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contrePartie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contre-partie</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez la contre-partie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="libContrePartie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Libellé Contre-partie</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez le libellé" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="annee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez une année" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {yearRange.map((year) => (
                            <SelectItem 
                              key={year} 
                              value={year.toString()}
                              className="hover:bg-muted text-gray-900 hover:text-gray-900"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mois"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mois</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez un mois" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {months.map((month) => (
                            <SelectItem 
                              key={month.value} 
                              value={month.value.toString()}
                              className="hover:bg-muted text-gray-900 hover:text-gray-900"
                            >
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="montantReel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant Réel</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="atterissage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atterrissage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={formValues.annee <= currentYear}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Écart Budget vs Montant Réel</p>
                  <p className="text-lg font-bold">{calculatedFields.ecartBudgetReel.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Écart Budget vs Atterrissage</p>
                  <p className="text-lg font-bold">{calculatedFields.ecartBudgetAtterrissage.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">BUDGET YTD</p>
                  <p className="text-lg font-bold">{calculatedFields.budgetYTD.toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Budget vs Réel en YTD</p>
                  <p className="text-lg font-bold">{calculatedFields.budgetVsReelYTD.toFixed(2)} €</p>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingId !== null ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Mettre à jour
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrées Enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{entry.axeIT}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.annee} - {entry.contrePartie}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => entry.id && handleDelete(entry.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
