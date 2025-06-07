<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../models/Timesheet.php';
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

$timesheet = new Timesheet($db);
$timesheet->user_id = $user_id;

// Получаем параметры
$period = isset($_GET['period']) ? $_GET['period'] : 'month';

$today = date('Y-m-d');
$start_date = $today;
$end_date = $today;

switch ($period) {
    case 'today':
        // Уже установлено
        break;
    case 'week':
        $start_date = date('Y-m-d', strtotime('monday this week'));
        $end_date = date('Y-m-d', strtotime('sunday this week'));
        break;
    case 'month':
        $start_date = date('Y-m-01');
        $end_date = date('Y-m-t');
        break;
    case 'year':
        $start_date = date('Y-01-01');
        $end_date = date('Y-12-31');
        break;
    default:
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            $start_date = $_GET['start_date'];
            $end_date = $_GET['end_date'];
        }
}

$stats = $timesheet->getStats($start_date, $end_date);

// Преобразуем минуты в часы и минуты для удобства
function formatTime($minutes) {
    $hours = floor($minutes / 60);
    $mins = $minutes % 60;
    return [
        'hours' => $hours,
        'minutes' => $mins,
        'total_minutes' => $minutes,
        'formatted' => $hours . 'ч ' . $mins . 'м'
    ];
}

$response_data = [
    'period' => $period,
    'start_date' => $start_date,
    'end_date' => $end_date,
    'total_days' => intval($stats['total_days']),
    'complete_days' => intval($stats['complete_days']),
    'overtime_days' => intval($stats['overtime_days']),
    'incomplete_days' => intval($stats['incomplete_days']),
    'total_time' => formatTime(intval($stats['total_minutes'] ?? 0)),
    'total_overtime' => formatTime(intval($stats['total_overtime'] ?? 0)),
    'average_daily_time' => formatTime(intval($stats['avg_daily_minutes'] ?? 0))
];

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $response_data
]);