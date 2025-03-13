
<?php
require_once 'config.php';
require_once 'utils.php';

// Ajouter une nouvelle entrée
function createEntry($conn, $data) {
    try {
        error_log("POST - Données reçues: " . print_r($data, true));

        // Conversion du mois numérique en libellé
        $mois_numerique = intval($data['mois'] ?? 1);
        $mois_libelle = getMonthLabel($mois_numerique);
        
        // Calcul des champs dérivés
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
            'budget_vs_reel_ytd' => $calculatedFields['budget_vs_reel_ytd']
        ];
        error_log("Paramètres pour l'exécution: " . print_r($paramsToLog, true));

        // Ajout des nouveaux champs dans l'instruction SQL
        $sql = "INSERT INTO budget_entries (
            codeSociete, fournisseur, codeArticle, natureCommande, dateArriveeFacture,
            typeDocument, delaisPrevis, dateFinContrat, referenceAffaire, contacts,
            axeIT1, axeIT2, societeFacturee, annee, dateReglement, mois,
            montantReel, budget, montantReglement, ecart_budget_reel, 
            budget_vs_reel_ytd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        
        // Ajout des nouveaux paramètres (21 au total)
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
        
        $stmt->execute();
        
        // Get the ID of the newly inserted record
        $newId = $conn->lastInsertId();
        
        echo json_encode(['success' => true, 'id' => $newId]);
        
    } catch (PDOException $e) {
        handleError("Erreur lors de la création d'entrée", $e);
    }
}
?>
