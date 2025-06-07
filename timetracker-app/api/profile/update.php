<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';
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

$user = new User($db);

// Получаем данные из PUT
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON data']);
    exit;
}

$user->id = $user_id;

// Читаем текущие данные пользователя
if (!$user->readOne()) {
    http_response_code(404);
    echo json_encode(['message' => 'User not found']);
    exit;
}

// Обновляем только те поля, которые можно редактировать
if (isset($data->firstName)) $user->first_name = trim($data->firstName);
if (isset($data->lastName)) $user->last_name = trim($data->lastName);
if (isset($data->middleName)) $user->middle_name = trim($data->middleName);
if (isset($data->personalEmail)) $user->personal_email = trim($data->personalEmail);
if (isset($data->phone)) $user->phone = trim($data->phone);
if (isset($data->birthDate)) $user->birth_date = $data->birthDate;
if (isset($data->address)) $user->address = trim($data->address);
if (isset($data->skills)) $user->skills = trim($data->skills);
if (isset($data->bio)) $user->bio = trim($data->bio);
if (isset($data->avatar)) $user->avatar = $data->avatar;

// Валидация email
if (!empty($user->personal_email) && !filter_var($user->personal_email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid personal email format']);
    exit;
}

if ($user->update()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update profile'
    ]);
}