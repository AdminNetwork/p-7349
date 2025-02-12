
<?php
require_once 'config.php';

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
        
        $sql = "INSERT INTO budget_entries (axeIT, groupe2, contrePartie, libContrePartie, 
                annee, mois, montantReel, budget, atterissage, plan) 
                VALUES (:axeIT, :groupe2, :contrePartie, :libContrePartie, 
                :annee, :mois, :montantReel, :budget, :atterissage, :plan)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
        
        echo json_encode(['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Mettre à jour une entrée
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];
        
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
                plan = :plan
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
        
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
