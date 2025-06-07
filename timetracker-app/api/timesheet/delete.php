<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Timesheet.php';
require_once '../../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

// Получаем ID из URL
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(['message' => 'Record ID is required']);
    exit;
}

$timesheet = new Timesheet($db);
$timesheet->id = $id;
$timesheet->user_id = $user_id;

if ($timesheet->delete()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Record deleted successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete record'
    ]);
}
?>