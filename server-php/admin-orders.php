<?php
require_once __DIR__ . '/config.php';

if (!isAdmin()) jsonOut(['error' => 'Forbidden'], 403);

$db = getDB();

// ── Ensure table exists ───────────────────────────────────────────
$db->exec('
    CREATE TABLE IF NOT EXISTS license_orders (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(120) NOT NULL,
        email       VARCHAR(200) NOT NULL,
        restaurant  VARCHAR(200) NOT NULL,
        phone       VARCHAR(40),
        devices     TINYINT DEFAULT 1,
        device_id   VARCHAR(100),
        notes       TEXT,
        status      ENUM("pending","paid","fulfilled","cancelled") DEFAULT "pending",
        fulfilled_key VARCHAR(24),
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
');

// ── GET: list orders ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $rows = $db->query('SELECT * FROM license_orders ORDER BY created_at DESC')->fetchAll();
    jsonOut($rows);
}

// ── POST: update order status ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $id     = intval($body['id']     ?? 0);
    $action = trim($body['action']   ?? '');
    $key    = strtoupper(trim($body['key'] ?? ''));

    if (!$id || !$action) jsonOut(['error' => 'id and action required'], 400);

    switch ($action) {
        case 'mark-paid':
            $db->prepare('UPDATE license_orders SET status="paid" WHERE id=?')->execute([$id]);
            jsonOut(['success' => true]);

        case 'fulfill':
            if (!$key) jsonOut(['error' => 'key required for fulfill'], 400);
            $db->prepare('UPDATE license_orders SET status="fulfilled", fulfilled_key=? WHERE id=?')
               ->execute([$key, $id]);
            // Send key email to customer
            $row = $db->prepare('SELECT * FROM license_orders WHERE id=?');
            $row->execute([$id]);
            $o = $row->fetch();
            if ($o && $o['email']) {
                $subject = 'Menu Cost Pro — Your License Key';
                $message = "Hi {$o['name']},\n\n"
                         . "Your license key is ready:\n\n"
                         . "  {$key}\n\n"
                         . "How to activate:\n"
                         . "  1. Open Menu Cost Pro on your phone\n"
                         . "  2. Tap the orange trial banner\n"
                         . "  3. Select \"Enter Key\"\n"
                         . "  4. Type the key above and tap Activate\n\n"
                         . "Your key works on up to {$o['devices']} device(s).\n\n"
                         . "Thank you for your purchase!\n"
                         . "— Menu Cost Pro Team\n";
                $headers  = "From: support@stonephovaldosta.com\r\n";
                $headers .= "X-Mailer: PHP/" . phpversion();
                @mail($o['email'], $subject, $message, $headers);
            }
            jsonOut(['success' => true, 'message' => 'Order fulfilled, key emailed to customer']);

        case 'cancel':
            $db->prepare('UPDATE license_orders SET status="cancelled" WHERE id=?')->execute([$id]);
            jsonOut(['success' => true]);

        default:
            jsonOut(['error' => 'Unknown action'], 400);
    }
}
