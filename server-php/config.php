<?php
define('DB_HOST',     'localhost');
define('DB_PORT',     '3306');
define('DB_USER',     'appcostcount');
define('DB_PASS',     'Eban0815@');
define('DB_NAME',     'AppCostCount');
define('ADMIN_SECRET','change-this-to-strong-secret-123'); // Change this!

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function jsonOut($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function isAdmin() {
    $h = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
    return $h === ADMIN_SECRET;
}

// Allow requests from the app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
