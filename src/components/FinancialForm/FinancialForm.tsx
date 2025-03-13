import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { CalculatedFields } from "./CalculatedFields";
import { monthsData, yearRange, periodeOptions, formSchema } from "./formConfig";
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
      codeSociete: "",
      fournisseur: "",
      codeArticle: "",
      natureCommande: "",
      dateArriveeFacture: "",
      typeDocument: "",
      delaisPrevis: 0,
      dateFinContrat: "",
      referenceAffaire: "",
      contacts: "",
      axeIT1: "",
      axeIT2: "",
      societeFacturee: "",
      annee: currentDate.getFullYear(),
      dateReglement: "",
      mois: currentDate.getMonth() + 1,
      montantReel: undefined,
      budget: undefined,
      regleEn: undefined,
    },
  });

  useEffect(() => {
    if (editingId && entries) {
      const entryToEdit = entries.find(entry => entry.id === editingId);
      if (entryToEdit) {
        const monthEntry = monthsData.find(m => m.label === entryToEdit.mois);
        const monthNumber = monthEntry ? monthEntry.value : 1;
        
        const formData = {
          codeSociete: entryToEdit.codeSociete || "",
          fournisseur: entryToEdit.fournisseur || "",
          codeArticle: entryToEdit.codeArticle || "",
          natureCommande: entryToEdit.natureCommande || "",
          dateArriveeFacture: entryToEdit.dateArriveeFacture || "",
          typeDocument: entryToEdit.typeDocument || "",
          delaisPrevis: Number(entryToEdit.delaisPrevis) || 0,
          dateFinContrat: entryToEdit.dateFinContrat || "",
          referenceAffaire: entryToEdit.referenceAffaire || "",
          contacts: entryToEdit.contacts || "",
          axeIT1: entryToEdit.axeIT1 || "",
          axeIT2: entryToEdit.axeIT2 || "",
          societeFacturee: entryToEdit.societeFacturee || "",
          annee: Number(entryToEdit.annee),
          dateReglement: entryToEdit.dateReglement || "",
          mois: monthNumber,
          montantReel: Number(entryToEdit.montantReel) || undefined,
          budget: Number(entryToEdit.budget) || undefined,
          regleEn: Number(entryToEdit.regleEn) || undefined,
        };
        
        form.reset(formData);
      }
    }
  }, [editingId, entries, form]);

  const formValues = form.watch();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="codeSociete"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Société</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez le code société" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fournisseur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez le fournisseur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codeArticle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Article</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez le code article" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="natureCommande"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nature de la commande</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez la nature de la commande" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateArriveeFacture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date d'arrivée de la facture</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    {periodeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hover:bg-muted text-gray-900 hover:text-gray-900"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                    {monthsData.map((month) => (
                      <SelectItem
                        key={`month-${month.value}`}
                        value={month.label}
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
          <FormField
            control={form.control}
            name="typeDocument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de document</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez le type de document" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="delaisPrevis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Délais préavis (jours)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateFinContrat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date fin de contrat</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez une période" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    {periodeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hover:bg-muted text-gray-900 hover:text-gray-900"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                    {monthsData.map((month) => (
                      <SelectItem
                        key={`month-${month.value}`}
                        value={month.label}
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
          <FormField
            control={form.control}
            name="referenceAffaire"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence Affaire</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez la référence affaire" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contacts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contacts</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez les contacts" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="axeIT1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Axe IT 1</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez l'axe IT 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="axeIT2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Axe IT 2</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez l'axe IT 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="societeFacturee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Société facturée</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez la société facturée" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            name="dateReglement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date du règlement</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionnez une année" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    {yearRange.map((year) => (
                      <SelectItem
                        key={`year-${year}`}
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
                <FormLabel>Mois YTD</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            name="regleEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Réglé en</FormLabel>
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
