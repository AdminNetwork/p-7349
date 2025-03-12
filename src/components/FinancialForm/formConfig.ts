import * as z from "zod";

const currentYear = new Date().getFullYear();
const startYear = 2000;

export const yearRange = Array.from(
  { length: currentYear - startYear + 1 }, 
  (_, i) => startYear + i
);

export const planYearRange = Array.from(
  { length: 10 }, 
  (_, i) => currentYear + 1 + i
);

export const monthsData = [
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

export const periodeOptions = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
];

export const formSchema = z.object({
  axeIT1: z.string().min(1, "L'Axe IT 1 est requis"),
  axeIT2: z.string().min(1, "L'Axe IT 2 est requis"),
  typeDocument: z.string().min(1, "Le Type de document est requis"),
  referenceAffaire: z.string().min(1, "La Référence Affaire est requise"),
  fournisseur: z.string().min(1, "Le fournisseur est requis"),
  codeSociete: z.string().min(1, "Le Code Société est requis"),
  codeArticle: z.string().min(1, "Le Code Article est requis"),
  natureCommande: z.string().min(1, "La Nature de la commande est requise"),
  dateArriveeFacture: z.string().min(1, "La Date d'arrivée de la facture est requise"),
  delaisPrevis: z.number().min(0, "Le Délais préavis doit être positif"),
  dateFinContrat: z.string().min(1, "La Date fin de contrat est requise"),
  contacts: z.string().min(1, "Les Contacts sont requis"),
  annee: z.number().min(startYear, `L'année doit être supérieure ou égale à ${startYear}`),
  annee_plan: z.number().min(currentYear + 1, "L'année du plan doit être une année future"),
  mois: z.number().min(1).max(12),
  montantReel: z.number().optional(),
  budget: z.number().optional(),
  regleEn: z.number().optional()
});

export type FormSchema = z.infer<typeof formSchema>;
