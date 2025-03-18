
<?php
// Configuration CORS encore plus permissive
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
header('Access-Control-Max-Age: 86400'); // 24 heures

// Gestion préflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Définir le content-type uniquement pour les réponses autres que OPTIONS
if ($_SERVER['REQUEST_METHOD'] != 'OPTIONS') {
    header('Content-Type: application/json');
}

// Configuration de la base de données
$host = 'localhost';
$db   = 'budget_entries';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

// Logs pour le débogage de la connexion
error_log("Tentative de connexion à la base de données: host=$host, db=$db, user=$user");

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    error_log("Connexion à la base de données réussie");
} catch (\PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
