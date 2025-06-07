<?php
// middleware/auth.php

function authenticate() {
    // Получаем токен из заголовка Authorization
    $headers = getallheaders();
    $token = null;

    if (isset($headers['Authorization'])) {
        $auth_header = $headers['Authorization'];
        if (strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
        }
    }

    // Если токена нет, проверяем сессию
    if (!$token) {
        session_start();
        if (isset($_SESSION['user_id']) && isset($_SESSION['user_token'])) {
            $token = $_SESSION['user_token'];
        }
    }

    if (!$token) {
        return false;
    }

    // Простая проверка токена (в реальном проекте используйте JWT)
    $token_parts = explode(':', base64_decode($token));
    if (count($token_parts) !== 3) {
        return false;
    }

    $user_id = $token_parts[0];
    $timestamp = $token_parts[1];

    // Проверяем, не истек ли токен (24 часа)
    if (time() - $timestamp > 86400) {
        return false;
    }

    return intval($user_id);
}

function requireAuth() {
    $user_id = authenticate();
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['message' => 'Authentication required']);
        exit;
    }
    return $user_id;
}

function requireRole($required_role) {
    require_once '../config/database.php';
    require_once '../models/User.php';

    $user_id = requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        http_response_code(500);
        echo json_encode(['message' => 'Database connection failed']);
        exit;
    }

    $user = new User($db);
    $user->id = $user_id;
    
    if (!$user->readOne()) {
        http_response_code(404);
        echo json_encode(['message' => 'User not found']);
        exit;
    }

    if ($user->role !== $required_role && $user->role !== 'admin') {
        http_response_code(403);
        echo json_encode(['message' => 'Insufficient permissions']);
        exit;
    }

    return $user_id;
}
?>