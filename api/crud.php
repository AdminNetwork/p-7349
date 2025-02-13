<?php
require_once 'config.php';

// Activation des logs d'erreur PHP
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Fonction pour calculer les champs
function calculateFields($data) {
    // Conversion explicite en nombres avec valeurs par défaut à 0
    $mois = isset($data['mois']) ? floatval($data['mois']) : 1;
    $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $atterissage = isset($data['atterissage']) ? floatval($data['atterissage']) : 0;

    // Forcer les valeurs à 0 si elles sont NULL ou non numériques
    $mois = is_numeric($mois) ? $mois : 0;
    $budget = is_numeric($budget) ? $budget : 0;
    $montantReel = is_numeric($montantReel) ? $montantReel : 0;
    $atterissage = is_numeric($atterissage) ? $atterissage : 0;

    // Log détaillé des données reçues
    error_log("=== DÉBUT DU CALCUL DES CHAMPS ===");
    error_log("Type de mois: " . gettype($mois) . ", Valeur: $mois");
    error_log("Type de budget: " . gettype($budget) . ", Valeur: $budget");
    error_log("Type de montantReel: " . gettype($montantReel) . ", Valeur: $montantReel");
    error_log("Type de atterissage: " . gettype($atterissage) . ", Valeur: $atterissage");

    // Calcul des champs avec vérification explicite des valeurs nulles
    $calculatedFields = [
        'ecart_budget_reel' => floatval($budget - $montantReel),
        'ecart_budget_atterissage' => floatval($budget - $atterissage),
        'budget_ytd' => floatval($budget > 0 ? ($budget * $mois) / 12 : 0),
        'budget_vs_reel_ytd' => floatval(($budget > 0 ? ($budget * $mois) / 12 : 0) - $montantReel)
    ];

    // Vérification finale pour s'assurer qu'aucune valeur n'est NULL
    foreach ($calculatedFields as $key => $value) {
        if ($value === null || !is_numeric($value)) {
            $calculatedFields[$key] = 0;
        }
    }

    return $calculatedFields;
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM budget_entries');
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir les valeurs NULL en 0 dans les résultats
        foreach ($results as &$row) {
            foreach ($row as $key => $value) {
                if ($value === null || !is_numeric($value)) {
                    $row[$key] = 0;
                }
            }
        }
        
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
        
        // Convertir les valeurs numériques potentiellement NULL en 0
        foreach ($data as $key => $value) {
            if (in_array($key, ['montantReel', 'budget', 'atterissage', 'plan']) && 
                ($value === null || !is_numeric($value))) {
                $data[$key] = 0;
            }
        }
        
        $calculatedFields = calculateFields($data);
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
        $stmt->execute($params);
        
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("ERREUR: " . $e->getMessage());
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
