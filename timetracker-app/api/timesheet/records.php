
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

// Получаем параметры запроса
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 30;

$stmt = $timesheet->getUserRecords($start_date, $end_date);
$records = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $records[] = [
        'id' => $row['id'],
        'date' => $row['date'],
        'checkIn' => $row['check_in'],
        'checkOut' => $row['check_out'],
        'breakTime' => intval($row['break_time']),
        'totalTime' => intval($row['total_time']),
        'overtime' => intval($row['overtime']),
        'status' => $row['status'],
        'notes' => $row['notes'],
        'location' => $row['location']
    ];
    
    if (count($records) >= $limit) break;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $records
]);