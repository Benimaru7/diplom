<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Timesheet.php';
require_once '../../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// Проверяем авторизацию
$user_id = authenticate();
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed']);
    exit;
}

$timesheet = new Timesheet($db);
$timesheet->user_id = $user_id;

$session = $timesheet->getCurrentSession();

if ($session) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $session['id'],
            'checkIn' => $session['check_in'],
            'date' => $session['date'],
            'status' => $session['status'],
            'location' => $session['location'],
            'isActive' => true
        ]
    ]);
} else {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'isActive' => false
        ]
    ]);
}