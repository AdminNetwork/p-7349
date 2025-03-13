
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// SQL Server Connection Parameters
$host = 'svinmssql001.groupedehon.com';
$port = '1433';
$dbname = 'MDMPROD';
$schema = 'DataWarehouse';
$user = 'JEMSPROD';
$password = '*EL*KTafPGm8qC';

try {
    // SQL Server connection string
    $connectionInfo = array(
        "Database" => $dbname,
        "UID" => $user,
        "PWD" => $password,
        "CharacterSet" => "UTF-8"
    );
    
    // Create connection to SQL Server
    $serverName = "$host,$port";
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    
    if (!$conn) {
        $errors = sqlsrv_errors();
        throw new Exception("SQL Server Connection Error: " . json_encode($errors));
    }
} catch (Exception $e) {
    error_log("Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
