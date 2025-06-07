<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../middleware/auth.php';

setCorsHeaders();

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Получить настройки пользователя
    $query = "SELECT * FROM user_settings WHERE user_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $user_id);
    $stmt->execute();

    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($settings) {
        unset($settings['id'], $settings['user_id'], $settings['created_at'], $settings['updated_at']);
        
        // Преобразуем числовые значения в boolean
        foreach ($settings as $key => $value) {
            if (in_array($key, ['dark_theme', 'compact_view', 'email_notifications', 'timesheet_reminders', 'weekly_reports', 'sound_notifications'])) {
                $settings[$key] = (bool) $value;
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);
    } else {
        // Создаем настройки по умолчанию
        $default_settings = [
            'dark_theme' => false,
            'language' => 'ru',
            'timezone' => 'Europe/Moscow',
            'compact_view' => false,
            'email_notifications' => true,
            'timesheet_reminders' => true,
            'weekly_reports' => false,
            'sound_notifications' => false
        ];

        $insert_query = "INSERT INTO user_settings (user_id) VALUES (?)";
        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(1, $user_id);
        $insert_stmt->execute();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $default_settings
        ]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Обновить настройки пользователя
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid JSON data']);
        exit;
    }

    // Подготавливаем запрос обновления
    $fields = [];
    $values = [];

    if (isset($data->dark_theme)) {
        $fields[] = "dark_theme = ?";
        $values[] = $data->dark_theme ? 1 : 0;
    }
    if (isset($data->language)) {
        $fields[] = "language = ?";
        $values[] = $data->language;
    }
    if (isset($data->timezone)) {
        $fields[] = "timezone = ?";
        $values[] = $data->timezone;
    }
    if (isset($data->compact_view)) {
        $fields[] = "compact_view = ?";
        $values[] = $data->compact_view ? 1 : 0;
    }
    if (isset($data->email_notifications)) {
        $fields[] = "email_notifications = ?";
        $values[] = $data->email_notifications ? 1 : 0;
    }
    if (isset($data->timesheet_reminders)) {
        $fields[] = "timesheet_reminders = ?";
        $values[] = $data->timesheet_reminders ? 1 : 0;
    }
    if (isset($data->weekly_reports)) {
        $fields[] = "weekly_reports = ?";
        $values[] = $data->weekly_reports ? 1 : 0;
    }
    if (isset($data->sound_notifications)) {
        $fields[] = "sound_notifications = ?";
        $values[] = $data->sound_notifications ? 1 : 0;
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['message' => 'No valid fields to update']);
        exit;
    }

    $fields[] = "updated_at = NOW()";
    $values[] = $user_id;

    $query = "UPDATE user_settings SET " . implode(', ', $fields) . " WHERE user_id = ?";
    $stmt = $db->prepare($query);

    if ($stmt->execute($values)) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update settings'
        ]);
    }

} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
?>