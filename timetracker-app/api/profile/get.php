<?php
// api/profile/get.php

require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/User.php';
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
        'data' => $user_data
    ]);
} else {
    http_response_code(404);
    echo json_encode(['message' => 'User not found']);
}