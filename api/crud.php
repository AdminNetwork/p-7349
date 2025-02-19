
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
        
        // Validation des données reçues
        if (!isset($data['mois']) || !isset($data['annee'])) {
            throw new Exception('Données manquantes');
        }

        // Conversion du mois numérique en libellé
        $mois_numerique = intval($data['mois']);
        $mois_libelle = getMonthLabel($mois_numerique);
        
        // Calcul des champs dérivés
        $calculatedFields = calculateFields($mois_numerique, $data);

        // Préparation des valeurs par défaut
        $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
        $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
        $atterissage = isset($data['atterissage']) ? floatval($data['atterissage']) : 0;
        $plan = isset($data['plan']) ? floatval($data['plan']) : 0;
        
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
        
        $stmt->execute([
            ':axeIT' => $data['axeIT'],
            ':groupe2' => $data['groupe2'],
            ':contrePartie' => $data['contrePartie'],
            ':libContrePartie' => $data['libContrePartie'],
            ':annee' => intval($data['annee']),
            ':mois' => $mois_libelle,
            ':montantReel' => $montantReel,
            ':budget' => $budget,
            ':atterissage' => $atterissage,
            ':plan' => $plan,
            ':ecart_budget_reel' => $calculatedFields['ecart_budget_reel'],
            ':ecart_budget_atterissage' => $calculatedFields['ecart_budget_atterissage'],
            ':budget_ytd' => $calculatedFields['budget_ytd'],
            ':budget_vs_reel_ytd' => $calculatedFields['budget_vs_reel_ytd']
        ]);
        
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Mettre à jour une entrée
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            throw new Exception('ID manquant');
        }

        $mois_numerique = intval($data['mois']);
        $mois_libelle = getMonthLabel($mois_numerique);
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
        
        $stmt->execute([
            ':id' => $data['id'],
            ':axeIT' => $data['axeIT'],
            ':groupe2' => $data['groupe2'],
            ':contrePartie' => $data['contrePartie'],
            ':libContrePartie' => $data['libContrePartie'],
            ':annee' => intval($data['annee']),
            ':mois' => $mois_libelle,
            ':montantReel' => floatval($data['montantReel'] ?? 0),
            ':budget' => floatval($data['budget'] ?? 0),
            ':atterissage' => floatval($data['atterissage'] ?? 0),
            ':plan' => floatval($data['plan'] ?? 0),
            ':ecart_budget_reel' => $calculatedFields['ecart_budget_reel'],
            ':ecart_budget_atterissage' => $calculatedFields['ecart_budget_atterissage'],
            ':budget_ytd' => $calculatedFields['budget_ytd'],
            ':budget_vs_reel_ytd' => $calculatedFields['budget_vs_reel_ytd']
        ]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Supprimer une entrée
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        if (!isset($_GET['id'])) {
            throw new Exception('ID manquant');
        }
        
        $stmt = $pdo->prepare('DELETE FROM budget_entries WHERE id = :id');
        $stmt->execute([':id' => $_GET['id']]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
