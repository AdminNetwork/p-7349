
<?php
require_once 'config.php';

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
function calculateFields($data) {
    $budget = isset($data['budget']) ? floatval($data['budget']) : 0;
    $montantReel = isset($data['montantReel']) ? floatval($data['montantReel']) : 0;
    $regleEn = isset($data['regleEn']) ? floatval($data['regleEn']) : 0;
    
    // Nouvelle formule qui prend en compte le montant du règlement s'il est supérieur à 0
    $ecart_budget_reel = $regleEn > 0 
        ? $budget - $montantReel - $regleEn
        : $budget - $montantReel;
    
    return [
        'ecart_budget_reel' => $ecart_budget_reel
    ];
}

// Fonction pour gérer les valeurs nulles ou vides
function handleNullableValue($value) {
    if ($value === null || $value === '' || $value === 'null') {
        return null;
    }
    return $value;
}

// Ajouter une nouvelle entrée
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Conversion du mois numérique en libellé
        $mois_numerique = intval($data['mois']);
        $mois_libelle = getMonthLabel($mois_numerique);
        
        // Calcul des champs dérivés
        $calculatedFields = calculateFields($data);

        // Traitement des champs facultatifs
        $dateFinContrat = handleNullableValue($data['dateFinContrat'] ?? null);
        $dateReglement = handleNullableValue($data['dateReglement'] ?? null);

        // Requête SQL avec tous les champs
        $sql = "INSERT INTO budget_entries (
            codeSociete, fournisseur, codeArticle, natureCommande, dateArriveeFacture,
            typeDocument, delaisPrevis, dateFinContrat, referenceAffaire, contacts,
            axeIT1, axeIT2, societeFacturee, annee, dateReglement, mois,
            montantReel, budget, regleEn,
            ecart_budget_reel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);

        // Tableau avec tous les paramètres
        $params = [
            $data['codeSociete'],
            $data['fournisseur'],
            $data['codeArticle'],
            $data['natureCommande'],
            $data['dateArriveeFacture'],
            $data['typeDocument'],
            floatval($data['delaisPrevis'] ?? 0),
            $dateFinContrat,
            $data['referenceAffaire'],
            $data['contacts'],
            $data['axeIT1'],
            $data['axeIT2'],
            $data['societeFacturee'],
            intval($data['annee']),
            $dateReglement,
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['regleEn'] ?? 0),
            $calculatedFields['ecart_budget_reel']
        ];
        
        $stmt->execute($params);
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $newId]);
        
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
        $calculatedFields = calculateFields($data);
        
        // Traitement des champs facultatifs
        $dateFinContrat = handleNullableValue($data['dateFinContrat'] ?? null);
        $dateReglement = handleNullableValue($data['dateReglement'] ?? null);
        
        $sql = "UPDATE budget_entries SET 
            codeSociete = ?, fournisseur = ?, codeArticle = ?, natureCommande = ?, dateArriveeFacture = ?,
            typeDocument = ?, delaisPrevis = ?, dateFinContrat = ?, referenceAffaire = ?, contacts = ?,
            axeIT1 = ?, axeIT2 = ?, societeFacturee = ?, annee = ?, dateReglement = ?, mois = ?,
            montantReel = ?, budget = ?, regleEn = ?,
            ecart_budget_reel = ?
            WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        
        $params = [
            $data['codeSociete'],
            $data['fournisseur'],
            $data['codeArticle'],
            $data['natureCommande'],
            $data['dateArriveeFacture'],
            $data['typeDocument'],
            floatval($data['delaisPrevis'] ?? 0),
            $dateFinContrat,
            $data['referenceAffaire'],
            $data['contacts'],
            $data['axeIT1'],
            $data['axeIT2'],
            $data['societeFacturee'],
            intval($data['annee']),
            $dateReglement,
            $mois_libelle,
            floatval($data['montantReel'] ?? 0),
            floatval($data['budget'] ?? 0),
            floatval($data['regleEn'] ?? 0),
            $calculatedFields['ecart_budget_reel'],
            $data['id']
        ];
        
        $stmt->execute($params);
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
        
        $stmt = $pdo->prepare('DELETE FROM budget_entries WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
