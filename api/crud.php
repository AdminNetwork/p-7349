
<?php
require_once 'config.php';

// Activation des logs d'erreur PHP
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Tableau de correspondance des mois
$monthsData = [
    ['value' => 1, 'label' => "Janvier"],
    ['value' => 2, 'label' => "Février"],
    ['value' => 3, 'label' => "Mars"],
    ['value' => 4, 'label' => "Avril"],
    ['value' => 5, 'label' => "Mai"],
    ['value' => 6, 'label' => "Juin"],
    ['value' => 7, 'label' => "Juillet"],
    ['value' => 8, 'label' => "Août"],
    ['value' => 9, 'label' => "Septembre"],
    ['value' => 10, 'label' => "Octobre"],
    ['value' => 11, 'label' => "Novembre"],
    ['value' => 12, 'label' => "Décembre"]
];

// Fonction pour obtenir le label du mois
function getMonthLabel($value) {
    global $monthsData;
    foreach ($monthsData as $month) {
        if ($month['value'] === intval($value)) {
            return $month['label'];
        }
    }
    return "Janvier";
}

// Fonction pour calculer les champs
function calculateFields($mois_numerique, $data) {
    $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $regleEn = isset($data['regleEn']) ? floatval($data['regleEn']) : 0;

    return [
        'ecart_budget_reel' => $budget - $montantReel,
        'budget_ytd' => $budget !== 0 ? ($budget * $mois_numerique) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget !== 0 ? ($budget * $mois_numerique) / 12 : 0) - $montantReel
    ];
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT * FROM DataWarehouse.budget_entries ORDER BY id DESC";
        $stmt = sqlsrv_query($conn, $sql);
        
        if ($stmt === false) {
            throw new Exception("Error in query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        
        $results = array();
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $results[] = $row;
        }
        
        echo json_encode($results);
    } catch (Exception $e) {
        error_log("GET Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Ajouter une nouvelle entrée
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("POST - Données reçues: " . print_r($data, true));

        // Conversion du mois numérique en libellé
        $mois_numerique = intval($data['mois']);
        $mois_libelle = getMonthLabel($mois_numerique);
        
        // Calcul des champs dérivés
        $calculatedFields = calculateFields($mois_numerique, $data);

        // Requête SQL avec tous les champs
        $sql = "INSERT INTO DataWarehouse.budget_entries (
            codeSociete, fournisseur, codeArticle, natureCommande, dateArriveeFacture,
            typeDocument, delaisPrevis, dateFinContrat, referenceAffaire, contacts,
            axeIT1, axeIT2, societeFacturee, annee, dateReglement, mois,
            montantReel, budget, regleEn,
            ecart_budget_reel, budget_ytd, budget_vs_reel_ytd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $params = array(
            $data['codeSociete'],
            $data['fournisseur'],
            $data['codeArticle'],
            $data['natureCommande'],
            $data['dateArriveeFacture'],
            $data['typeDocument'],
            floatval($data['delaisPrevis'] ?? 0),
            $data['dateFinContrat'],
            $data['referenceAffaire'],
            $data['contacts'],
            $data['axeIT1'],
            $data['axeIT2'],
            $data['societeFacturee'],
            intval($data['annee']),
            $data['dateReglement'],
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['regleEn'] ?? 0),
            $calculatedFields['ecart_budget_reel'],
            $calculatedFields['budget_ytd'],
            $calculatedFields['budget_vs_reel_ytd']
        );

        error_log("Paramètres pour l'exécution: " . print_r($params, true));
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            throw new Exception("Error in insert query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
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
        http_response_code(500);
        error_log("ERREUR POST: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Mettre à jour une entrée
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        error_log("PUT - Données reçues: " . print_r($data, true));
        
        if (!isset($data['id'])) {
            throw new Exception('ID manquant');
        }

        $mois_numerique = intval($data['mois']);
        $mois_libelle = getMonthLabel($mois_numerique);
        $calculatedFields = calculateFields($mois_numerique, $data);
        
        $sql = "UPDATE DataWarehouse.budget_entries SET 
            codeSociete = ?, fournisseur = ?, codeArticle = ?, natureCommande = ?, dateArriveeFacture = ?,
            typeDocument = ?, delaisPrevis = ?, dateFinContrat = ?, referenceAffaire = ?, contacts = ?,
            axeIT1 = ?, axeIT2 = ?, societeFacturee = ?, annee = ?, dateReglement = ?, mois = ?,
            montantReel = ?, budget = ?, regleEn = ?,
            ecart_budget_reel = ?, budget_ytd = ?, budget_vs_reel_ytd = ?
            WHERE id = ?";
        
        $params = array(
            $data['codeSociete'],
            $data['fournisseur'],
            $data['codeArticle'],
            $data['natureCommande'],
            $data['dateArriveeFacture'],
            $data['typeDocument'],
            floatval($data['delaisPrevis'] ?? 0),
            $data['dateFinContrat'],
            $data['referenceAffaire'],
            $data['contacts'],
            $data['axeIT1'],
            $data['axeIT2'],
            $data['societeFacturee'],
            intval($data['annee']),
            $data['dateReglement'],
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['regleEn'] ?? 0),
            $calculatedFields['ecart_budget_reel'],
            $calculatedFields['budget_ytd'],
            $calculatedFields['budget_vs_reel_ytd'],
            $data['id']
        );
        
        error_log("Paramètres pour l'exécution: " . print_r($params, true));
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            throw new Exception("Error in update query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("ERREUR PUT: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Supprimer une entrée
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        if (!isset($_GET['id'])) {
            throw new Exception('ID manquant');
        }
        
        $sql = "DELETE FROM DataWarehouse.budget_entries WHERE id = ?";
        $params = array($_GET['id']);
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            throw new Exception("Error in delete query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("ERREUR DELETE: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
