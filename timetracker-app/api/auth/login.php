<?php
// api/auth/login.php

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
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

// Получаем данные из POST
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email and password are required']);
    exit;
}

$user->email = $data->email;

// Находим пользователя по email
if ($user->findByEmail()) {
    // Проверяем пароль
    if (password_verify($data->password, $user->password)) {
        // Создаем токен (простая реализация)
        $token = base64_encode($user->id . ':' . time() . ':' . md5($user->email));
        
        // Сохраняем токен в сессии или базе данных
        session_start();
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_token'] = $token;
        
        // Подготавливаем данные пользователя для ответа
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
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user_data
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid password'
        ]);
    }
} else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'User not found'
    ]);
}
?>