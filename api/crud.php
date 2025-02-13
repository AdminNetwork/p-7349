
<?php
require_once 'config.php';

// Activation des logs d'erreur PHP
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Fonction pour calculer les champs
function calculateFields($data) {
    // Conversion explicite en nombres
    $mois = isset($data['mois']) ? floatval($data['mois']) : 1;
    $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $atterissage = isset($data['atterissage']) ? floatval($data['atterissage']) : 0;

    // Log détaillé des données reçues
    error_log("=== DÉBUT DU CALCUL DES CHAMPS ===");
    error_log("Type de mois: " . gettype($mois) . ", Valeur: $mois");
    error_log("Type de budget: " . gettype($budget) . ", Valeur: $budget");
    error_log("Type de montantReel: " . gettype($montantReel) . ", Valeur: $montantReel");
    error_log("Type de atterissage: " . gettype($atterissage) . ", Valeur: $atterissage");

    // Calcul des champs avec des valeurs par défaut à 0
    $calculatedFields = [
        'ecart_budget_reel' => $budget - $montantReel,
        'ecart_budget_atterissage' => $budget - $atterissage,
        'budget_ytd' => $budget ? ($budget * $mois) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget ? ($budget * $mois) / 12 : 0) - $montantReel
    ];

    error_log("Résultats calculés:");
    foreach ($calculatedFields as $key => $value) {
        error_log("$key: " . gettype($value) . ", Valeur: $value");
    }
    error_log("=== FIN DU CALCUL DES CHAMPS ===");

    return $calculatedFields;
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM budget_entries');
        echo json_encode($stmt->fetchAll());
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
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Erreur de décodage JSON: " . json_last_error_msg());
        }
        
        $calculatedFields = calculateFields($data);
        $params = array_merge($data, $calculatedFields);
        
        error_log("Paramètres finaux pour l'insertion:");
        foreach ($params as $key => $value) {
            error_log("$key: " . gettype($value) . ", Valeur: " . print_r($value, true));
        }
        
        $sql = "INSERT INTO budget_entries (
                axeIT, groupe2, contrePartie, libContrePartie, 
                annee, mois, montantReel, budget, atterissage, plan,
                ecart_budget_reel, ecart_budget_atterissage, budget_ytd, budget_vs_reel_ytd
                ) VALUES (
                :axeIT, :groupe2, :contrePartie, :libContrePartie, 
                :annee, :mois, :montantReel, :budget, :atterissage, :plan,
                :ecart_budget_reel, :ecart_budget_atterissage, :budget_ytd, :budget_vs_reel_ytd
                )";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        error_log("Insertion réussie, ID: " . $pdo->lastInsertId());
        error_log("=== FIN DE L'INSERTION ===");
        
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
        $calculatedFields = calculateFields($data);
        
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
