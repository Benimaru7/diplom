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

// Проверяем, загружен ли файл
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['avatar'];

// Проверяем тип файла
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
    exit;
}

// Проверяем размер файла (максимум 5МБ)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['message' => 'File too large. Maximum size is 5MB']);
    exit;
}

// Создаем директорию для аватаров, если она не существует
$upload_dir = '../../assets/uploads/avatars/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Генерируем уникальное имя файла
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'avatar_' . $user_id . '_' . time() . '.' . $file_extension;
$filepath = $upload_dir . $filename;

// Перемещаем загруженный файл
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to save uploaded file']);
    exit;
}

// Обновляем путь к аватару в базе данных
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

// Удаляем старый аватар, если он не является аватаром по умолчанию
if ($user->avatar && $user->avatar !== 'assets/images/avatars/default.png') {
    $old_file = '../../' . $user->avatar;
    if (file_exists($old_file)) {
        unlink($old_file);
    }
}

// Обновляем путь к новому аватару
$user->avatar = 'assets/uploads/avatars/' . $filename;

if ($user->update()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Avatar uploaded successfully',
        'avatar_url' => $user->avatar
    ]);
} else {
    // Удаляем загруженный файл в случае ошибки БД
    unlink($filepath);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update avatar in database'
    ]);
}