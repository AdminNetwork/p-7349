<?php
require_once 'config.php';

// Activation des logs d'erreur PHP
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Fonction pour calculer les champs
function calculateFields($data) {
    // Conversion en nombres, mais en gardant les valeurs non-nulles
    $mois = isset($data['mois']) && !is_null($data['mois']) ? floatval($data['mois']) : 1;
    $budget = isset($data['budget']) && !is_null($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) && !is_null($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $atterissage = isset($data['atterissage']) && !is_null($data['atterissage']) ? floatval($data['atterissage']) : 0;

    // Log détaillé des données reçues
    error_log("=== DÉBUT DU CALCUL DES CHAMPS ===");
    error_log("Type de mois: " . gettype($mois) . ", Valeur: $mois");
    error_log("Type de budget: " . gettype($budget) . ", Valeur: $budget");
    error_log("Type de montantReel: " . gettype($montantReel) . ", Valeur: $montantReel");
    error_log("Type de atterissage: " . gettype($atterissage) . ", Valeur: $atterissage");

    // Calcul des champs en gardant les valeurs non-nulles
    $calculatedFields = [
        'ecart_budget_reel' => $budget - $montantReel,
        'ecart_budget_atterissage' => $budget - $atterissage,
        'budget_ytd' => $budget !== 0 ? ($budget * $mois) / 12 : 0,
        'budget_vs_reel_ytd' => ($budget !== 0 ? ($budget * $mois) / 12 : 0) - $montantReel
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
        
        // Convertir les valeurs numériques potentiellement NULL en 0
        foreach ($data as $key => $value) {
            if (in_array($key, ['montantReel', 'budget', 'atterissage', 'plan']) && 
                ($value === null || !is_numeric($value))) {
                $data[$key] = 0;
            }
        }
        
        $calculatedFields = calculateFields($data);
        
        // S'assurer que tous les champs calculés sont bien définis et non NULL
        foreach ($calculatedFields as $key => $value) {
            $calculatedFields[$key] = floatval($value);
            if (!is_numeric($calculatedFields[$key])) {
                $calculatedFields[$key] = 0;
            }
        }
        
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
        
        error_log("Insertion réussie. ID: " . $pdo->lastInsertId());
        
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
        
        // Appliquer les mêmes conversions que pour l'insertion
        foreach ($data as $key => $value) {
            if (in_array($key, ['montantReel', 'budget', 'atterissage', 'plan']) && 
                ($value === null || !is_numeric($value))) {
                $data[$key] = 0;
            }
        }
        
        $calculatedFields = calculateFields($data);
        
        // Vérification finale de tous les champs calculés
        foreach ($calculatedFields as $key => $value) {
            $calculatedFields[$key] = floatval($value);
            if (!is_numeric($calculatedFields[$key])) {
                $calculatedFields[$key] = 0;
            }
        }
        
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
