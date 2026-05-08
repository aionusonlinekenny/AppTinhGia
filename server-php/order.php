<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'POST only'], 405);

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) jsonOut(['error' => 'Invalid JSON'], 400);

$name       = trim($body['name']       ?? '');
$email      = trim($body['email']      ?? '');
$restaurant = trim($body['restaurant'] ?? '');
$phone      = trim($body['phone']      ?? '');
$devices    = intval($body['devices']  ?? 1);
$deviceId   = trim($body['deviceId']   ?? '');
$notes      = trim($body['notes']      ?? '');

if (!$name || !$email || !$restaurant) {
    jsonOut(['error' => 'Name, email, and restaurant are required'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['error' => 'Invalid email address'], 400);
}

// ── Store order in DB ────────────────────────────────────────────
try {
    $db = getDB();
    $db->prepare('
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
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ')->execute();

    $stmt = $db->prepare('
        INSERT INTO license_orders (name, email, restaurant, phone, devices, device_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$name, $email, $restaurant, $phone, $devices, $deviceId, $notes]);
} catch (Exception $e) {
    // DB failure non-fatal — still send email
}

// ── Email notification to owner ───────────────────────────────────
$ownerEmail  = 'support@stonephovaldosta.com'; // ← change to your email
$priceMap    = [1 => '$5/mo', 2 => '$8/mo', 3 => '$10/mo'];
$priceLabel  = $priceMap[$devices] ?? "$devices devices";

$subject = "New License Order — $restaurant ($priceLabel)";
$message = "New license order received:\n\n"
         . "Name:       $name\n"
         . "Email:      $email\n"
         . "Restaurant: $restaurant\n"
         . "Phone:      " . ($phone ?: '—') . "\n"
         . "Devices:    $devices ($priceLabel)\n"
         . "Device ID:  " . ($deviceId ?: '—') . "\n"
         . "Notes:      " . ($notes ?: '—') . "\n\n"
         . "---\n"
         . "Reply to this email or create a key in the admin panel:\n"
         . "https://stonephovaldosta.com/license-api/admin.html\n";

$headers  = "From: orders@stonephovaldosta.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

@mail($ownerEmail, $subject, $message, $headers);

// ── Confirmation email to customer ────────────────────────────────
$custSubject = "Menu Cost Pro — Order Received";
$custMessage = "Hi $name,\n\n"
             . "We received your order for Menu Cost Pro ($priceLabel).\n\n"
             . "Your license key will be sent to this email within 24 hours "
             . "after payment confirmation.\n\n"
             . "Order summary:\n"
             . "  Restaurant: $restaurant\n"
             . "  Devices:    $devices ($priceLabel)\n\n"
             . "Questions? Reply to this email.\n\n"
             . "— Menu Cost Pro Team\n";

$custHeaders  = "From: support@stonephovaldosta.com\r\n";
$custHeaders .= "X-Mailer: PHP/" . phpversion();

@mail($email, $custSubject, $custMessage, $custHeaders);

jsonOut(['success' => true, 'message' => 'Order received']);
