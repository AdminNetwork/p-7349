
-- Script SQL pour créer la table budget_entries dans MySQL

CREATE TABLE IF NOT EXISTS budget_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codeSociete VARCHAR(50) NOT NULL,
  fournisseur VARCHAR(100) NOT NULL,
  codeArticle VARCHAR(50) NOT NULL,
  natureCommande VARCHAR(100) NOT NULL,
  dateArriveeFacture VARCHAR(20) NOT NULL,
  typeDocument VARCHAR(50) NOT NULL,
  delaisPrevis FLOAT NOT NULL,
  dateFinContrat VARCHAR(20) NOT NULL,
  referenceAffaire VARCHAR(50) NOT NULL,
  contacts VARCHAR(100) NOT NULL,
  axeIT1 VARCHAR(50) NOT NULL,
  axeIT2 VARCHAR(50) NOT NULL,
  societeFacturee VARCHAR(100) NOT NULL,
  annee INT NOT NULL,
  dateReglement VARCHAR(20) NOT NULL,
  mois VARCHAR(20) NOT NULL,
  montantReel FLOAT NOT NULL,
  budget FLOAT NOT NULL,
  montantReglement FLOAT NOT NULL,
  ecart_budget_reel FLOAT NOT NULL,
  budget_vs_reel_ytd FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
