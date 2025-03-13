
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
        $params = array($id);
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        if ($stmt === false) {
            throw new Exception("Error in delete query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        handleError("Erreur lors de la suppression d'entrée", $e);
    }
}
?>
