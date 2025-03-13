
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Activation des logs d'erreur PHP pour le débogage
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// SQL Server Connection Parameters
$host = 'svinmssql001.groupedehon.com';
$port = '1433';
$dbname = 'MDMPROD';
$schema = 'DataWarehouse';
$user = 'JEMSPROD';
$password = '*EL*KTafPGm8qC';

try {
    // PDO connection to SQL Server
    $dsn = "sqlsrv:Server=$host,$port;Database=$dbname";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::SQLSRV_ATTR_ENCODING => PDO::SQLSRV_ENCODING_UTF8
    ];
    
    $conn = new PDO($dsn, $user, $password, $options);
    
} catch (PDOException $e) {
    error_log("Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
