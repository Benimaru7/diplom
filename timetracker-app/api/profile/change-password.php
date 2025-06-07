<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';
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

// Получаем данные из POST
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->currentPassword) || !isset($data->newPassword)) {
    http_response_code(400);
    echo json_encode(['message' => 'Current password and new password are required']);
    exit;
}

if (strlen($data->newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['message' => 'New password must be at least 6 characters long']);
    exit;
}

$user = new User($db);
$user->id = $user_id;

// Читаем данные пользователя
if (!$user->readOne()) {
    http_response_code(404);
    echo json_encode(['message' => 'User not found']);
    exit;
}

// Проверяем текущий пароль
if (!password_verify($data->currentPassword, $user->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Current password is incorrect']);
    exit;
}

// Меняем пароль
if ($user->changePassword($data->newPassword)) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to change password'
    ]);
}