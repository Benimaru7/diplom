<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Timesheet.php';
require_once '../../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

// Получаем данные из PUT
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Record ID is required']);
    exit;
}

$timesheet->id = $data->id;
$timesheet->user_id = $user_id;
$timesheet->check_in = isset($data->checkIn) ? $data->checkIn : null;
$timesheet->check_out = isset($data->checkOut) ? $data->checkOut : null;
$timesheet->break_time = isset($data->breakTime) ? intval($data->breakTime) : 60;
$timesheet->notes = isset($data->notes) ? trim($data->notes) : '';

if ($timesheet->update()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Record updated successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update record'
    ]);
}