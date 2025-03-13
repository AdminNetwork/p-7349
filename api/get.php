
<?php
require_once 'config.php';
require_once 'utils.php';

// Récupérer toutes les entrées
function getEntries($conn) {
    try {
        $sql = "SELECT * FROM DataWarehouse.budget_entries ORDER BY id DESC";
        $stmt = sqlsrv_query($conn, $sql);
        
        if ($stmt === false) {
            throw new Exception("Error in query: " . json_encode(sqlsrv_errors(), JSON_PRETTY_PRINT));
        }
        
        $results = array();
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $results[] = $row;
        }
        
        echo json_encode($results);
    } catch (Exception $e) {
        error_log("GET Error: " . $e->getMessage());
        handleError("Erreur lors de la récupération des données", $e);
    }
}
?>
