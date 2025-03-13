
<?php
require_once 'config.php';
require_once 'utils.php';

// Supprimer une entrée
function deleteEntry($conn, $id) {
    try {
        if (!isset($id)) {
            throw new Exception('ID manquant');
        }
        
        $sql = "DELETE FROM DataWarehouse.budget_entries WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(1, $id);
        
        $stmt->execute();
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        handleError("Erreur lors de la suppression d'entrée", $e);
    }
}
?>
