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

// Валидация обязательных полей
$required_fields = ['firstName', 'lastName', 'email', 'phone', 'password', 'department', 'position'];
foreach ($required_fields as $field) {
    if (!isset($data->$field) || empty(trim($data->$field))) {
        http_response_code(400);
        echo json_encode(['message' => "Field {$field} is required"]);
        exit;
    }
}

// Проверяем, существует ли пользователь с таким email
$user->email = $data->email;
if ($user->emailExists()) {
    http_response_code(409);
    echo json_encode(['message' => 'User with this email already exists']);
    exit;
}

// Заполняем данные пользователя
$user->first_name = trim($data->firstName);
$user->last_name = trim($data->lastName);
$user->middle_name = isset($data->middleName) ? trim($data->middleName) : '';
$user->email = trim($data->email);
$user->personal_email = isset($data->personalEmail) ? trim($data->personalEmail) : '';
$user->phone = trim($data->phone);
$user->password = $data->password;
$user->role = isset($data->role) ? $data->role : 'employee';
$user->avatar = 'assets/images/avatars/default.png';
$user->position = trim($data->position);
$user->department = trim($data->department);
$user->salary = isset($data->salary) ? floatval($data->salary) : 0;
$user->employee_id = isset($data->employeeId) ? $data->employeeId : null;
$user->start_date = date('Y-m-d');
$user->manager = isset($data->manager) ? $data->manager : '';
$user->birth_date = isset($data->birthDate) ? $data->birthDate : null;
$user->address = isset($data->address) ? trim($data->address) : '';
$user->skills = isset($data->skills) ? trim($data->skills) : '';
$user->bio = isset($data->bio) ? trim($data->bio) : '';

// Создаем пользователя
if ($user->create()) {
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
        'avatar' => $user->avatar,
        'position' => $user->position,
        'department' => $user->department,
        'salary' => $user->salary,
        'employeeId' => $user->employee_id,
        'startDate' => $user->start_date,
        'manager' => $user->manager,
        'birthDate' => $user->birth_date,
        'address' => $user->address,
        'skills' => $user->skills,
        'bio' => $user->bio
    ];

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user' => $user_data
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create user'
    ]);
}
?>