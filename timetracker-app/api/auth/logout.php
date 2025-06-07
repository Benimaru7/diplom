<?php
require_once '../../config/cors.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

session_start();
session_destroy();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logout successful'
]);
?>