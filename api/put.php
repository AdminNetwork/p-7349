
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

        $sql = "UPDATE DataWarehouse.budget_entries SET 
            codeSociete = ?, fournisseur = ?, codeArticle = ?, natureCommande = ?, dateArriveeFacture = ?,
            typeDocument = ?, delaisPrevis = ?, dateFinContrat = ?, referenceAffaire = ?, contacts = ?,
            axeIT1 = ?, axeIT2 = ?, societeFacturee = ?, annee = ?, dateReglement = ?, mois = ?,
            montantReel = ?, budget = ?, montantReglement = ?,
            ecart_budget_reel = ?, budget_vs_reel_ytd = ?
            WHERE id = ?";
        
        $params = array(
            $data['codeSociete'] ?? '',
            $data['fournisseur'] ?? '',
            $data['codeArticle'] ?? '',
            $data['natureCommande'] ?? '',
            $data['dateArriveeFacture'] ?? '',
            $data['typeDocument'] ?? '',
            floatval($data['delaisPrevis'] ?? 0),
            $data['dateFinContrat'] ?? '',
            $data['referenceAffaire'] ?? '',
            $data['contacts'] ?? '',
            $data['axeIT1'] ?? '',
            $data['axeIT2'] ?? '',
            $data['societeFacturee'] ?? '',
            intval($data['annee'] ?? 0),
            $data['dateReglement'] ?? '',
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['montantReglement'] ?? 0),
            $calculatedFields['ecart_budget_reel'],
            $calculatedFields['budget_vs_reel_ytd'],
            $data['id']
        );
        
        error_log("SQL Update: " . $sql);
        error_log("Nombre de paramètres pour update: " . count($params));
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            $errors = sqlsrv_errors();
            error_log("Erreur SQL lors de la mise à jour: " . json_encode($errors, JSON_PRETTY_PRINT));
            throw new Exception("Error in update query: " . json_encode($errors, JSON_PRETTY_PRINT));
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        handleError("Erreur lors de la mise à jour d'entrée", $e);
    }
}
?>
