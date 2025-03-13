
<?php
// Common utility functions for all CRUD operations

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

// Function to handle errors and respond with JSON
function handleError($message, $exception = null) {
    $errorDetails = $message;
    if ($exception) {
        error_log("ERROR: " . $exception->getMessage());
        error_log("Stack trace: " . $exception->getTraceAsString());
        $errorDetails .= ': ' . $exception->getMessage();
    }
    http_response_code(500);
    echo json_encode(['error' => $errorDetails]);
    exit;
}
?>
