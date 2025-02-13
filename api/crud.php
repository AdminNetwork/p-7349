
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
    return "Janvier"; // Valeur par défaut
}

// Fonction pour calculer les champs
function calculateFields($mois_numerique, $data) {
    $budget = isset($data['budget']) && !is_null($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) && !is_null($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $atterissage = isset($data['atterissage']) && !is_null($data['atterissage']) ? floatval($data['atterissage']) : 0;

    // Log détaillé des données reçues
    error_log("=== DÉBUT DU CALCUL DES CHAMPS ===");
    error_log("Mois numérique pour calcul: $mois_numerique");
    error_log("Budget: $budget");
    error_log("Montant réel: $montantReel");
    error_log("Atterrissage: $atterissage");

    // Calcul des champs en gardant les valeurs non-nulles
    $calculatedFields = [
        'ecart_budget_reel' => $budget - $montantReel,
        'ecart_budget_atterissage' => $budget - $atterissage,
        'budget_ytd' => $budget !== 0 ? ($budget * $mois_numerique) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget !== 0 ? ($budget * $mois_numerique) / 12 : 0) - $montantReel
    ];

    error_log("Champs calculés : " . print_r($calculatedFields, true));
    return $calculatedFields;
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT 
            id, axeIT, groupe2, contrePartie, libContrePartie, 
            annee, mois, 
            COALESCE(montantReel, 0) as montantReel,
            COALESCE(budget, 0) as budget,
            COALESCE(atterissage, 0) as atterissage,
            COALESCE(plan, 0) as plan,
            COALESCE(ecart_budget_reel, 0) as ecart_budget_reel,
            COALESCE(ecart_budget_atterissage, 0) as ecart_budget_atterissage,
            COALESCE(budget_ytd, 0) as budget_ytd,
            COALESCE(budget_vs_reel_ytd, 0) as budget_vs_reel_ytd
            FROM budget_entries');
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
        error_log("=== DÉBUT DE L'INSERTION ===");
        
        $rawData = file_get_contents('php://input');
        error_log("Données brutes reçues: " . $rawData);
        
        $data = json_decode($rawData, true);
        error_log("Données décodées: " . print_r($data, true));

        // Garder la valeur numérique pour les calculs
        $mois_numerique = intval($data['mois']);
        // Convertir en libellé pour le stockage en utilisant la fonction getMonthLabel
        $data['mois'] = getMonthLabel($mois_numerique);
        
        // Convertir les valeurs numériques potentiellement NULL en 0
        foreach ($data as $key => $value) {
            if (in_array($key, ['montantReel', 'budget', 'atterissage', 'plan']) && 
                ($value === null || !is_numeric($value))) {
                $data[$key] = 0;
            }
        }
        
        $calculatedFields = calculateFields($mois_numerique, $data);
        
        $params = array_merge($data, $calculatedFields);
        
        error_log("Paramètres finaux pour l'insertion: " . print_r($params, true));
        
        $sql = "INSERT INTO budget_entries (
                axeIT, groupe2, contrePartie, libContrePartie, 
                annee, mois, montantReel, budget, atterissage, plan,
                ecart_budget_reel, ecart_budget_atterissage, budget_ytd, budget_vs_reel_ytd
                ) VALUES (
                :axeIT, :groupe2, :contrePartie, :libContrePartie, 
                :annee, :mois, :montantReel, :budget, :atterissage, :plan,
                :ecart_budget_reel, :ecart_budget_atterissage, :budget_ytd, :budget_vs_reel_ytd
                )";
        
        error_log("SQL préparé: " . $sql);
        $stmt = $pdo->prepare($sql);
        
        error_log("Exécution avec les paramètres: " . print_r($params, true));
        $stmt->execute($params);
        
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("ERREUR: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Mettre à jour une entrée
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];
        
        // Garder la valeur numérique pour les calculs
        $mois_numerique = intval($data['mois']);
        // Convertir en libellé pour le stockage en utilisant la fonction getMonthLabel
        $data['mois'] = getMonthLabel($mois_numerique);
        
        // Appliquer les mêmes conversions que pour l'insertion
        foreach ($data as $key => $value) {
            if (in_array($key, ['montantReel', 'budget', 'atterissage', 'plan']) && 
                ($value === null || !is_numeric($value))) {
                $data[$key] = 0;
            }
        }
        
        $calculatedFields = calculateFields($mois_numerique, $data);
        
        $sql = "UPDATE budget_entries SET 
                axeIT = :axeIT,
                groupe2 = :groupe2,
                contrePartie = :contrePartie,
                libContrePartie = :libContrePartie,
                annee = :annee,
                mois = :mois,
                montantReel = :montantReel,
                budget = :budget,
                atterissage = :atterissage,
                plan = :plan,
                ecart_budget_reel = :ecart_budget_reel,
                ecart_budget_atterissage = :ecart_budget_atterissage,
                budget_ytd = :budget_ytd,
                budget_vs_reel_ytd = :budget_vs_reel_ytd
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($data, $calculatedFields));
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Supprimer une entrée
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $id = $_GET['id'];
        $stmt = $pdo->prepare('DELETE FROM budget_entries WHERE id = ?');
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
