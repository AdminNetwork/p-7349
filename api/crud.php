
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
    $atterissage = isset($data['atterissage']) ? floatval($data['atterissage']) : 0;

    return [
        'ecart_budget_reel' => $budget - $montantReel,
        'ecart_budget_atterissage' => $budget - $atterissage,
        'budget_ytd' => $budget !== 0 ? ($budget * $mois_numerique) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget !== 0 ? ($budget * $mois_numerique) / 12 : 0) - $montantReel
    ];
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM budget_entries ORDER BY id DESC');
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (PDOException $e) {
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

        // Requête SQL avec exactement 11 colonnes et 11 paramètres
        $sql = "INSERT INTO budget_entries (
            axeIT, groupe2, contrePartie, libContrePartie, 
            annee, annee_plan, mois, montantReel, budget, atterissage, plan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);
        error_log("SQL préparé: " . $sql);

        // Tableau avec exactement 11 paramètres
        $params = [
            $data['axeIT'],
            $data['groupe2'],
            $data['contrePartie'],
            $data['libContrePartie'],
            intval($data['annee']),
            intval($data['annee_plan']),
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['atterissage'] ?? 0),
            floatval($data['plan'] ?? 0)
        ];

        error_log("Paramètres pour l'exécution: " . print_r($params, true));
        
        $stmt->execute($params);
        $newId = $pdo->lastInsertId();
        
        // Mise à jour des champs calculés dans une requête séparée
        $updateSql = "UPDATE budget_entries SET 
            ecart_budget_reel = ?,
            ecart_budget_atterissage = ?,
            budget_ytd = ?,
            budget_vs_reel_ytd = ?
            WHERE id = ?";
            
        $updateParams = [
            $calculatedFields['ecart_budget_reel'],
            $calculatedFields['ecart_budget_atterissage'],
            $calculatedFields['budget_ytd'],
            $calculatedFields['budget_vs_reel_ytd'],
            $newId
        ];
        
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute($updateParams);
        
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
        
        $sql = "UPDATE budget_entries SET 
            axeIT = ?, groupe2 = ?, contrePartie = ?, libContrePartie = ?,
            annee = ?, annee_plan = ?, mois = ?, montantReel = ?, 
            budget = ?, atterissage = ?, plan = ?,
            ecart_budget_reel = ?, ecart_budget_atterissage = ?, 
            budget_ytd = ?, budget_vs_reel_ytd = ?
            WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        error_log("SQL préparé: " . $sql);
        
        $params = [
            $data['axeIT'],
            $data['groupe2'],
            $data['contrePartie'],
            $data['libContrePartie'],
            intval($data['annee']),
            intval($data['annee_plan']),
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['atterissage'] ?? 0),
            floatval($data['plan'] ?? 0),
            $calculatedFields['ecart_budget_reel'],
            $calculatedFields['ecart_budget_atterissage'],
            $calculatedFields['budget_ytd'],
            $calculatedFields['budget_vs_reel_ytd'],
            $data['id']
        ];
        
        error_log("Paramètres pour l'exécution: " . print_r($params, true));
        
        $stmt->execute($params);
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
        
        $stmt = $pdo->prepare('DELETE FROM budget_entries WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("ERREUR DELETE: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
