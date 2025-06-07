<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// Проверяем токен из заголовка Authorization
$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    $auth_header = $headers['Authorization'];
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['message' => 'Token not provided']);
    exit;
}

// Простая проверка токена (в реальном проекте используйте JWT)
$token_parts = explode(':', base64_decode($token));
if (count($token_parts) !== 3) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid token format']);
    exit;
}

$user_id = $token_parts[0];
$timestamp = $token_parts[1];

// Проверяем, не истек ли токен (24 часа)
if (time() - $timestamp > 86400) {
    http_response_code(401);
    echo json_encode(['message' => 'Token expired']);
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
$user->id = $user_id;

if ($user->readOne()) {
    $user_data = [
        'id' => $user->id,
        'name' => trim($user->first_name . ' ' . $user->last_name),
        'firstName' => $user->first_name,
        'lastName' => $user->last_name,
        'middleName' => $user->middle_name,
        'email' => $user->email,
        'personalEmail' => $user->personal_email,
        'phone' => $user->phone,
        'role' => $user->role,
        'avatar' => $user->avatar ?: 'assets/images/avatars/default.png',
        'position' => $user->position,
        'department' => $user->department,
        'salary' => floatval($user->salary),
        'employeeId' => $user->employee_id,
        'startDate' => $user->start_date,
        'manager' => $user->manager,
        'birthDate' => $user->birth_date,
        'address' => $user->address,
        'skills' => $user->skills,
        'bio' => $user->bio
    ];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => $user_data
    ]);
} else {
    http_response_code(404);
    echo json_encode(['message' => 'User not found']);
}
?>