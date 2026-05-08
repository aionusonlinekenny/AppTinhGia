<?php
require_once __DIR__ . '/config.php';
try {
    getDB()->query('SELECT 1');
    jsonOut(['status' => 'ok', 'db' => 'connected', 'time' => date('c')]);
} catch (Exception $e) {
    jsonOut(['status' => 'error', 'db' => 'disconnected'], 500);
}
