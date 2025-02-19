
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { CalculatedFields } from "./CalculatedFields";
import { monthsData, yearRange, planYearRange, formSchema } from "./formConfig";
import type { FinancialFormData } from "@/types/budget";
import { useEffect } from "react";

type FormSchema = z.infer<typeof formSchema>;

interface FinancialFormProps {
  onSubmit: (values: FormSchema) => Promise<void>;
  editingId: number | null;
  entries?: FinancialFormData[];
}

export function FinancialForm({ onSubmit, editingId, entries = [] }: FinancialFormProps) {
  const currentDate = new Date();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      axeIT: "",
      groupe2: "",
      contrePartie: "",
      libContrePartie: "",
      annee: currentDate.getFullYear(),
      annee_plan: currentDate.getFullYear() + 1,
      mois: currentDate.getMonth() + 1,
      montantReel: undefined,
      budget: undefined,
      atterissage: undefined,
      plan: undefined,
    },
  });

  useEffect(() => {
    if (editingId && entries) {
      const entryToEdit = entries.find(entry => entry.id === editingId);
      if (entryToEdit) {
        const monthEntry = monthsData.find(m => m.label === entryToEdit.mois);
        const monthNumber = monthEntry ? monthEntry.value : 1;
        
        const formData = {
          axeIT: entryToEdit.axeIT,
          groupe2: entryToEdit.groupe2,
          contrePartie: entryToEdit.contrePartie,
          libContrePartie: entryToEdit.libContrePartie,
          annee: Number(entryToEdit.annee),
          annee_plan: Number(entryToEdit.annee_plan),
          mois: monthNumber,
          montantReel: Number(entryToEdit.montantReel) || undefined,
          budget: Number(entryToEdit.budget) || undefined,
          atterissage: Number(entryToEdit.atterissage) || undefined,
          plan: Number(entryToEdit.plan) || undefined,
        };
        
        form.reset(formData);
      }
    }
  }, [editingId, entries, form]);

  const formValues = form.watch();

  return (
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
            name="annee_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Année du Plan</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez une année pour le plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    {planYearRange.map((year) => (
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
                    {monthsData.map((month) => (
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
                    disabled={formValues.annee <= new Date().getFullYear()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <CalculatedFields formValues={formValues} />

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
  );
}
