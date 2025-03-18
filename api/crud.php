
<?php
require_once 'config.php';

// Activation des logs d'erreur PHP
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Log des requêtes entrantes avec plus de détails
error_log("Requête reçue: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);
error_log("Headers: " . json_encode(getallheaders()));

// Test de la connexion à la base de données
try {
    $test = $pdo->query("SELECT 1");
    error_log("Test de connexion à la base de données réussi");
    
    // Vérifier si la table budget_entries existe
    $tables = $pdo->query("SHOW TABLES LIKE 'budget_entries'")->fetchAll();
    if (count($tables) > 0) {
        error_log("Table budget_entries trouvée");
        
        // Vérifier le nombre d'entrées dans la table
        $count = $pdo->query("SELECT COUNT(*) as total FROM budget_entries")->fetch();
        error_log("Nombre total d'entrées dans la table: " . $count['total']);
    } else {
        error_log("ERREUR: Table budget_entries non trouvée!");
    }
} catch (PDOException $e) {
    error_log("ERREUR test connexion: " . $e->getMessage());
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
    
    return [
        'ecart_budget_reel' => $budget - $montantReel
    ];
}

// Fonction pour gérer les valeurs nulles ou vides
function handleNullableValue($value) {
    if ($value === null || $value === '' || $value === 'null') {
        return null;
    }
    return $value;
}

// Récupérer toutes les entrées
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        error_log("Exécution de la requête GET pour récupérer toutes les entrées");
        
        // Vérifier à nouveau la connexion
        $pdo->query("SELECT 1");
        error_log("Connexion toujours active");
        
        // Nouvelle tentative avec try/catch supplémentaire pour isoler l'erreur potentielle
        try {
            $stmt = $pdo->query('SELECT * FROM budget_entries ORDER BY id DESC');
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Nombre d'entrées récupérées: " . count($results));
            
            // Logguer un échantillon des données pour vérification
            if (count($results) > 0) {
                error_log("Premier enregistrement: " . json_encode($results[0]));
            } else {
                error_log("ATTENTION: Aucune entrée trouvée dans la table budget_entries");
            }
            
            echo json_encode($results);
        } catch (PDOException $e) {
            error_log("ERREUR spécifique à la requête SELECT: " . $e->getMessage());
            throw $e;
        }
    } catch (PDOException $e) {
        error_log("ERREUR GET: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
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
        error_log("SQL préparé: " . $sql);

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

        error_log("Paramètres pour l'exécution: " . print_r($params, true));
        
        $stmt->execute($params);
        $newId = $pdo->lastInsertId();
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
        error_log("SQL préparé: " . $sql);
        
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
