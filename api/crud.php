
<?php
require_once 'config.php';

// Fonction pour calculer les champs
function calculateFields($data) {
    // Conversion explicite en nombres
    $mois = isset($data['mois']) ? floatval($data['mois']) : 1;
    $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $atterissage = isset($data['atterissage']) ? floatval($data['atterissage']) : 0;

    // Calcul des champs avec des valeurs par défaut à 0
    $calculatedFields = [
        'ecart_budget_reel' => $budget - $montantReel,
        'ecart_budget_atterissage' => $budget - $atterissage,
        'budget_ytd' => $budget ? ($budget * $mois) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget ? ($budget * $mois) / 12 : 0) - $montantReel
    ];

    // Log pour debug
    error_log("Valeurs utilisées pour les calculs:");
    error_log("mois: $mois");
    error_log("budget: $budget");
    error_log("montantReel: $montantReel");
    error_log("atterissage: $atterissage");
    error_log("Résultats calculés: " . print_r($calculatedFields, true));

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
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Debug des données reçues
        error_log("Données reçues du frontend: " . print_r($data, true));
        
        // Calcul des champs
        $calculatedFields = calculateFields($data);
        
        // Préparation des paramètres pour la requête SQL
        $params = array_merge($data, $calculatedFields);
        
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
        
        // Debug final avant exécution
        error_log("Paramètres finaux pour l'insertion: " . print_r($params, true));
        
        $stmt->execute($params);
        
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        error_log("Erreur SQL: " . $e->getMessage());
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
