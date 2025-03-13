
<?php
require_once 'config.php';
require_once 'utils.php';

// Récupérer toutes les entrées
function getEntries($conn) {
    try {
        $sql = "SELECT * FROM budget_entries ORDER BY id DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($results);
    } catch (PDOException $e) {
        error_log("GET Error: " . $e->getMessage());
        handleError("Erreur lors de la récupération des données", $e);
    }
}
?>
