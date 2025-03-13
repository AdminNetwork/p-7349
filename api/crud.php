
<?php
// Main entry point for CRUD operations
require_once 'config.php';
require_once 'utils.php';
require_once 'get.php';
require_once 'post.php';
require_once 'put.php';
require_once 'delete.php';

// Router to direct requests to the appropriate handler
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getEntries($conn);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    createEntry($conn, $data);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    updateEntry($conn, $data);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    deleteEntry($conn, $_GET['id'] ?? null);
}
?>
