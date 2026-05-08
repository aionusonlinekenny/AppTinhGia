<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['error' => 'POST only'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$key      = strtoupper(trim($body['key']      ?? ''));
$deviceId = trim($body['deviceId'] ?? '');

if (!$key || !$deviceId) {
    jsonOut(['valid' => false, 'message' => 'Missing key or deviceId'], 400);
}

$db = getDB();

// Look up key
$stmt = $db->prepare('SELECT * FROM license_keys WHERE key_code = ?');
$stmt->execute([$key]);
$entry = $stmt->fetch();

if (!$entry) {
    jsonOut(['valid' => false, 'message' => 'License key not found']);
}
if (!$entry['active']) {
    jsonOut(['valid' => false, 'message' => 'License key has been deactivated']);
}

// Check if device already registered
$stmt = $db->prepare('SELECT * FROM device_activations WHERE key_code = ? AND device_id = ?');
$stmt->execute([$key, $deviceId]);
$existing = $stmt->fetch();

if ($existing) {
    // Known device — update last_seen
    $db->prepare('UPDATE device_activations SET last_seen = NOW() WHERE key_code = ? AND device_id = ?')
       ->execute([$key, $deviceId]);
    jsonOut(['valid' => true, 'message' => 'License valid', 'customer' => $entry['customer']]);
}

// New device — check limit
$stmt = $db->prepare('SELECT COUNT(*) as cnt FROM device_activations WHERE key_code = ?');
$stmt->execute([$key]);
$count = $stmt->fetch()['cnt'];

if ($count >= $entry['max_devices']) {
    jsonOut([
        'valid'   => false,
        'message' => "Key already used on {$entry['max_devices']} device(s). Contact support to transfer.",
    ]);
}

// Register new device
$db->prepare('INSERT INTO device_activations (key_code, device_id) VALUES (?, ?)')
   ->execute([$key, $deviceId]);

jsonOut(['valid' => true, 'message' => 'License activated', 'customer' => $entry['customer']]);
