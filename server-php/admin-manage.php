<?php
require_once __DIR__ . '/config.php';

if (!isAdmin()) jsonOut(['error' => 'Forbidden'], 403);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'POST only'], 405);

$body   = json_decode(file_get_contents('php://input'), true);
$key    = strtoupper(trim($body['key']    ?? ''));
$action = trim($body['action'] ?? ''); // deactivate | activate | reset-devices

if (!$key || !$action) jsonOut(['error' => 'key and action required'], 400);

$db = getDB();

// Verify key exists
$stmt = $db->prepare('SELECT id FROM license_keys WHERE key_code = ?');
$stmt->execute([$key]);
if (!$stmt->fetch()) jsonOut(['error' => 'Key not found'], 404);

switch ($action) {
    case 'deactivate':
        $db->prepare('UPDATE license_keys SET active = 0 WHERE key_code = ?')->execute([$key]);
        jsonOut(['success' => true, 'message' => "Key $key deactivated"]);

    case 'activate':
        $db->prepare('UPDATE license_keys SET active = 1 WHERE key_code = ?')->execute([$key]);
        jsonOut(['success' => true, 'message' => "Key $key activated"]);

    case 'reset-devices':
        $db->prepare('DELETE FROM device_activations WHERE key_code = ?')->execute([$key]);
        jsonOut(['success' => true, 'message' => "Devices reset for $key"]);

    default:
        jsonOut(['error' => 'Unknown action'], 400);
}
