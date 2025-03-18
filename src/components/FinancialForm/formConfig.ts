
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
  { value: "bimestriel", label: "Bimestriel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "semestriel", label: "Semestriel" },
];

// Liste des sociétés facturées
export const societeFactureeOptions = [
  { value: "climalife", label: "Climalife" },
  { value: "gestimat", label: "Gestimat" },
  { value: "crealis", label: "Crealis" },
  { value: "dehon_service", label: "Dehon Service" },
  { value: "gestimat_belgium", label: "Gestimat Belgium" },
  { value: "matelex", label: "Matelex" },
  { value: "smb", label: "SMB" },
];

// Liste des options pour Axe IT 1
export const axeIT1Options = [
  { value: "business", label: "Business" },
  { value: "it_devops", label: "IT-DevOps" },
  { value: "it_middleware", label: "IT-Middleware" },
  { value: "it_jde", label: "IT-JDE" },
  { value: "it_digital_workplace", label: "IT-Digital WorkPlace" },
  { value: "it_network", label: "IT-Network" },
  { value: "juridique", label: "Juridique" },
  { value: "security", label: "Security" },
  { value: "it_user_assistance", label: "IT-User Assistance" },
];

// Liste des options pour Axe IT 2
export const axeIT2Options = [
  { value: "hosting", label: "Hosting" },
  { value: "web_development", label: "Web Development" },
  { value: "digital_workplace", label: "Digital WorkPlace" },
  { value: "middleware", label: "Middleware" },
  { value: "websites", label: "Websites" },
  { value: "tools", label: "Tools" },
  { value: "bi_dev", label: "BI Dev" },
  { value: "back_office_dev", label: "Back Office Dev" },
  { value: "business", label: "Business" },
  { value: "jde_prestation", label: "JDE Prestation" },
  { value: "run_management", label: "Run Management" },
  { value: "mobile_telephony", label: "Mobile Telephony" },
  { value: "ip_telephony", label: "IP Telephony" },
  { value: "jde_software", label: "JDE Software" },
];

// Définition de la couleur pour les champs obligatoires en erreur
export const requiredFieldErrorColor = "#ea384c";

export const formSchema = z.object({
  codeSociete: z.string().min(1, "Le Code Société est requis"),
  fournisseur: z.string().min(1, "Le fournisseur est requis"),
  codeArticle: z.string().min(1, "Le Code Article est requis"),
  natureCommande: z.string().min(1, "La Nature de la commande est requise"),
  dateArriveeFacture: z.string().min(1, "La Date d'arrivée de la facture est requise"),
  typeDocument: z.string().min(1, "Le Type de document est requis"),
  delaisPrevis: z.number().min(0, "Le Délais préavis doit être positif"),
  dateFinContrat: z.date().nullable().optional(), // Date en format Date ou null
  referenceAffaire: z.string().min(1, "La Référence Affaire est requise"),
  contacts: z.string().min(1, "Les Contacts sont requis"),
  axeIT1: z.string().min(1, "L'Axe IT 1 est requis"),
  axeIT2: z.string().min(1, "L'Axe IT 2 est requis"),
  societeFacturee: z.string().min(1, "La Société facturée est requise"),
  annee: z.number().min(startYear, `L'année doit être supérieure ou égale à ${startYear}`),
  dateReglement: z.date().nullable().optional(), // Date en format Date ou null
  mois: z.number().min(1).max(12),
  montantReel: z.number().optional(),
  budget: z.number().optional(),
  regleEn: z.number().optional()
});

export type FormSchema = z.infer<typeof formSchema>;
