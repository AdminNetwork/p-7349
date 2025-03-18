
<?php
// Configuration CORS plus détaillée pour éviter les problèmes de connexion
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // 24 heures
header('Content-Type: application/json');

// Gestion préflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

$host = 'localhost';
$db   = 'budget_entries'; // Changé de 'kevin_api' à 'budget_entries'
$user = 'root';
$pass = ''; // Mot de passe vide comme indiqué
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
