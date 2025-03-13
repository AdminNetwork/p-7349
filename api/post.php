
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

        // Count the number of placeholders vs parameters
        $placeholderCount = 21; // This is the number of ? in your SQL statement
        $paramCount = count($paramsToLog);
        error_log("Placeholders: $placeholderCount, Parameters: $paramCount");

        $sql = "INSERT INTO DataWarehouse.budget_entries (
            codeSociete, fournisseur, codeArticle, natureCommande, dateArriveeFacture,
            typeDocument, delaisPrevis, dateFinContrat, referenceAffaire, contacts,
            axeIT1, axeIT2, societeFacturee, annee, dateReglement, mois,
            montantReel, budget, montantReglement, ecart_budget_reel, budget_vs_reel_ytd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
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
            $calculatedFields['budget_vs_reel_ytd']
        );
        
        error_log("SQL: " . $sql);
        error_log("Nombre de paramètres pour insert: " . count($params));
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            $errors = sqlsrv_errors();
            error_log("Erreur SQL lors de l'insertion: " . json_encode($errors, JSON_PRETTY_PRINT));
            throw new Exception("Error in insert query: " . json_encode($errors, JSON_PRETTY_PRINT));
        }
        
        // Get the ID of the newly inserted record (SQL Server specific)
        $identitySql = "SELECT SCOPE_IDENTITY() AS ID";
        $identityStmt = sqlsrv_query($conn, $identitySql);
        if ($identityStmt === false) {
            throw new Exception("Error getting inserted ID: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        $newId = 0;
        if (sqlsrv_fetch($identityStmt)) {
            $newId = sqlsrv_get_field($identityStmt, 0);
        }
        
        echo json_encode(['success' => true, 'id' => $newId]);
        
    } catch (Exception $e) {
        handleError("Erreur lors de la création d'entrée", $e);
    }
}
?>
