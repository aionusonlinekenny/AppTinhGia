<?php
require_once __DIR__ . '/config.php';

if (!isAdmin()) jsonOut(['error' => 'Forbidden'], 403);

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET — list all keys with activation count
if ($method === 'GET') {
    $stmt = $db->query('
        SELECT k.*, COUNT(d.id) as activated_count
        FROM license_keys k
        LEFT JOIN device_activations d ON k.key_code = d.key_code
        GROUP BY k.id
        ORDER BY k.created_at DESC
    ');
    jsonOut($stmt->fetchAll());
}

// POST — add new key
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true);
    $key       = strtoupper(trim($body['key']        ?? ''));
    $customer  = trim($body['customer']  ?? '');
    $maxDev    = intval($body['maxDevices'] ?? 1);
    $notes     = trim($body['notes']     ?? '');

    if (!$key || !$customer) jsonOut(['error' => 'key and customer required'], 400);

    try {
        $db->prepare('INSERT INTO license_keys (key_code, customer, max_devices, notes) VALUES (?, ?, ?, ?)')
           ->execute([$key, $customer, $maxDev, $notes]);
        jsonOut(['success' => true, 'key' => $key]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) jsonOut(['error' => 'Key already exists'], 409);
        throw $e;
    }
}

jsonOut(['error' => 'Method not allowed'], 405);
