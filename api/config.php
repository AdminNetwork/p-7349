
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Activation des logs d'erreur PHP pour le débogage
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// MySQL Connection Parameters
$host = 'localhost';
$db   = 'budget_entries';
$user = 'root';
$pass = ''; 
$charset = 'utf8mb4';

try {
    // PDO connection to MySQL
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $conn = new PDO($dsn, $user, $pass, $options);
    
} catch (PDOException $e) {
    error_log("Connection Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
