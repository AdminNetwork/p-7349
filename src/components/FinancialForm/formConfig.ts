
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

export const formSchema = z.object({
  axeIT: z.string().min(1, "L'Axe IT est requis"),
  groupe2: z.string().min(1, "Le Groupe 2 est requis"),
  contrePartie: z.string().min(1, "La Contre-partie est requise"),
  libContrePartie: z.string().min(1, "Le libellé de contre-partie est requis"),
  annee: z.number().min(startYear, `L'année doit être supérieure ou égale à ${startYear}`),
  annee_plan: z.number().min(currentYear + 1, "L'année du plan doit être une année future"),
  mois: z.number().min(1).max(12),
  montantReel: z.number().optional(),
  budget: z.number().optional(),
  atterissage: z.number().optional(),
  plan: z.number().optional()
});

export type FormSchema = z.infer<typeof formSchema>;
