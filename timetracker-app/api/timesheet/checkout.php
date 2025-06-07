<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Timesheet.php';
require_once '../../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Получаем данные из POST
$data = json_decode(file_get_contents("php://input"));
$timesheet->break_time = isset($data->breakTime) ? intval($data->breakTime) : 60;
$timesheet->notes = isset($data->notes) ? trim($data->notes) : '';

if ($timesheet->checkOut()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Check-out successful',
        'data' => [
            'checkOut' => $timesheet->check_out,
            'totalTime' => $timesheet->total_time,
            'overtime' => $timesheet->overtime,
            'status' => $timesheet->status
        ]
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Check-out failed. You may not have checked in today.'
    ]);
}