
<?php
require_once 'config.php';
require_once 'utils.php';

// Mettre à jour une entrée
function updateEntry($conn, $data) {
    try {
        error_log("PUT - Données reçues: " . print_r($data, true));
        
        if (!isset($data['id'])) {
            throw new Exception('ID manquant');
        }

        $mois_numerique = intval($data['mois'] ?? 1);
        $mois_libelle = getMonthLabel($mois_numerique);
        $calculatedFields = calculateFields($mois_numerique, $data);
        
        // Log des paramètres avant exécution
        $paramsToLog = [
            'codeSociete' => $data['codeSociete'] ?? '',
            'fournisseur' => $data['fournisseur'] ?? '',
            'codeArticle' => $data['codeArticle'] ?? '',
            'natureCommande' => $data['natureCommande'] ?? '',
            'dateArriveeFacture' => $data['dateArriveeFacture'] ?? '',
            'typeDocument' => $data['typeDocument'] ?? '',
            'delaisPrevis' => floatval($data['delaisPrevis'] ?? 0),
            'dateFinContrat' => $data['dateFinContrat'] ?? '',
            'referenceAffaire' => $data['referenceAffaire'] ?? '',
            'contacts' => $data['contacts'] ?? '',
            'axeIT1' => $data['axeIT1'] ?? '',
            'axeIT2' => $data['axeIT2'] ?? '',
            'societeFacturee' => $data['societeFacturee'] ?? '',
            'annee' => intval($data['annee'] ?? 0),
            'dateReglement' => $data['dateReglement'] ?? '',
            'mois' => $mois_libelle,
            'montantReel' => floatval($data['montantReel'] ?? 0),
            'budget' => floatval($data['budget'] ?? 0),
            'montantReglement' => floatval($data['montantReglement'] ?? 0),
            'ecart_budget_reel' => $calculatedFields['ecart_budget_reel'],
            'budget_vs_reel_ytd' => $calculatedFields['budget_vs_reel_ytd'],
            'id' => $data['id']
        ];
        error_log("Paramètres pour la mise à jour: " . print_r($paramsToLog, true));

        $sql = "UPDATE budget_entries SET 
            codeSociete = ?, fournisseur = ?, codeArticle = ?, natureCommande = ?, dateArriveeFacture = ?,
            typeDocument = ?, delaisPrevis = ?, dateFinContrat = ?, referenceAffaire = ?, contacts = ?,
            axeIT1 = ?, axeIT2 = ?, societeFacturee = ?, annee = ?, dateReglement = ?, mois = ?,
            montantReel = ?, budget = ?, montantReglement = ?,
            ecart_budget_reel = ?, budget_vs_reel_ytd = ?
            WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        
        // Exactement 22 paramètres (21 pour les champs + 1 pour l'ID dans WHERE)
        $stmt->bindParam(1, $data['codeSociete'] ?? '');
        $stmt->bindParam(2, $data['fournisseur'] ?? '');
        $stmt->bindParam(3, $data['codeArticle'] ?? '');
        $stmt->bindParam(4, $data['natureCommande'] ?? '');
        $stmt->bindParam(5, $data['dateArriveeFacture'] ?? '');
        $stmt->bindParam(6, $data['typeDocument'] ?? '');
        $delaisPrevis = floatval($data['delaisPrevis'] ?? 0);
        $stmt->bindParam(7, $delaisPrevis);
        $stmt->bindParam(8, $data['dateFinContrat'] ?? '');
        $stmt->bindParam(9, $data['referenceAffaire'] ?? '');
        $stmt->bindParam(10, $data['contacts'] ?? '');
        $stmt->bindParam(11, $data['axeIT1'] ?? '');
        $stmt->bindParam(12, $data['axeIT2'] ?? '');
        $stmt->bindParam(13, $data['societeFacturee'] ?? '');
        $annee = intval($data['annee'] ?? 0);
        $stmt->bindParam(14, $annee);
        $stmt->bindParam(15, $data['dateReglement'] ?? '');
        $stmt->bindParam(16, $mois_libelle);
        $montantReel = floatval($data['montantReel'] ?? 0);
        $stmt->bindParam(17, $montantReel);
        $budget = floatval($data['budget'] ?? 0);
        $stmt->bindParam(18, $budget);
        $montantReglement = floatval($data['montantReglement'] ?? 0);
        $stmt->bindParam(19, $montantReglement);
        $ecart_budget_reel = $calculatedFields['ecart_budget_reel'];
        $stmt->bindParam(20, $ecart_budget_reel);
        $budget_vs_reel_ytd = $calculatedFields['budget_vs_reel_ytd'];
        $stmt->bindParam(21, $budget_vs_reel_ytd);
        $stmt->bindParam(22, $data['id']);
        
        $stmt->execute();
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        handleError("Erreur lors de la mise à jour d'entrée", $e);
    }
}
?>
