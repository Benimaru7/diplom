<?php
// models/Timesheet.php

class Timesheet {
    private $conn;
    private $table_name = "timesheets";

    public $id;
    public $user_id;
    public $date;
    public $check_in;
    public $check_out;
    public $break_time;
    public $total_time;
    public $overtime;
    public $status;
    public $notes;
    public $location;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Отметка прихода
    public function checkIn() {
        // Проверяем, есть ли уже запись за сегодня
        $today = date('Y-m-d');
        $check_query = "SELECT id FROM " . $this->table_name . " 
                       WHERE user_id = ? AND DATE(date) = ?";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(1, $this->user_id);
        $check_stmt->bindParam(2, $today);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            return false; // Уже есть запись за сегодня
        }

        $query = "INSERT INTO " . $this->table_name . " 
                 SET user_id=:user_id, date=:date, check_in=:check_in, 
                     status='in_progress', location=:location, created_at=NOW()";

        $stmt = $this->conn->prepare($query);

        $this->date = date('Y-m-d H:i:s');
        $this->check_in = date('Y-m-d H:i:s');

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":date", $this->date);
        $stmt->bindParam(":check_in", $this->check_in);
        $stmt->bindParam(":location", $this->location);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Отметка ухода
    public function checkOut() {
        $today = date('Y-m-d');
        
        // Находим запись за сегодня
        $find_query = "SELECT id, check_in FROM " . $this->table_name . " 
                      WHERE user_id = ? AND DATE(date) = ? AND check_out IS NULL";
        $find_stmt = $this->conn->prepare($find_query);
        $find_stmt->bindParam(1, $this->user_id);
        $find_stmt->bindParam(2, $today);
        $find_stmt->execute();

        $row = $find_stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return false; // Нет записи о приходе
        }

        $this->id = $row['id'];
        $check_in_time = new DateTime($row['check_in']);
        $check_out_time = new DateTime();
        
        // Вычисляем общее время
        $interval = $check_in_time->diff($check_out_time);
        $total_minutes = ($interval->h * 60) + $interval->i;
        
        // Учитываем перерыв (по умолчанию 1 час)
        $break_minutes = $this->break_time ?? 60;
        $work_minutes = max(0, $total_minutes - $break_minutes);
        
        // Определяем переработку (более 8 часов)
        $overtime_minutes = max(0, $work_minutes - 480); // 480 минут = 8 часов

        $query = "UPDATE " . $this->table_name . " 
                 SET check_out=:check_out, break_time=:break_time, 
                     total_time=:total_time, overtime=:overtime,
                     status=:status, notes=:notes, updated_at=NOW()
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $this->check_out = $check_out_time->format('Y-m-d H:i:s');
        $this->break_time = $break_minutes;
        $this->total_time = $work_minutes;
        $this->overtime = $overtime_minutes;
        
        // Определяем статус
        if ($overtime_minutes > 0) {
            $this->status = 'overtime';
        } elseif ($work_minutes >= 480) {
            $this->status = 'complete';
        } else {
            $this->status = 'incomplete';
        }

        $stmt->bindParam(":check_out", $this->check_out);
        $stmt->bindParam(":break_time", $this->break_time);
        $stmt->bindParam(":total_time", $this->total_time);
        $stmt->bindParam(":overtime", $this->overtime);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Получить записи пользователя за период
    public function getUserRecords($start_date = null, $end_date = null) {
        $where_clause = "WHERE user_id = ?";
        $params = [$this->user_id];

        if ($start_date) {
            $where_clause .= " AND DATE(date) >= ?";
            $params[] = $start_date;
        }

        if ($end_date) {
            $where_clause .= " AND DATE(date) <= ?";
            $params[] = $end_date;
        }

        $query = "SELECT 
                    id, date, check_in, check_out, break_time, 
                    total_time, overtime, status, notes, location
                  FROM " . $this->table_name . " 
                  " . $where_clause . "
                  ORDER BY date DESC";

        $stmt = $this->conn->prepare($query);
        
        for ($i = 0; $i < count($params); $i++) {
            $stmt->bindParam($i + 1, $params[$i]);
        }
        
        $stmt->execute();
        return $stmt;
    }

    // Получить текущую сессию пользователя
    public function getCurrentSession() {
        $today = date('Y-m-d');
        
        $query = "SELECT 
                    id, date, check_in, check_out, status, location
                  FROM " . $this->table_name . " 
                  WHERE user_id = ? AND DATE(date) = ? AND check_out IS NULL
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $today);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Статистика за период
    public function getStats($start_date, $end_date) {
        $query = "SELECT 
                    COUNT(*) as total_days,
                    SUM(total_time) as total_minutes,
                    SUM(overtime) as total_overtime,
                    AVG(total_time) as avg_daily_minutes,
                    COUNT(CASE WHEN status = 'complete' THEN 1 END) as complete_days,
                    COUNT(CASE WHEN status = 'overtime' THEN 1 END) as overtime_days,
                    COUNT(CASE WHEN status = 'incomplete' THEN 1 END) as incomplete_days
                  FROM " . $this->table_name . " 
                  WHERE user_id = ? AND DATE(date) BETWEEN ? AND ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $start_date);
        $stmt->bindParam(3, $end_date);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Обновить запись
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET check_in=:check_in, check_out=:check_out, 
                     break_time=:break_time, notes=:notes, updated_at=NOW()
                 WHERE id=:id AND user_id=:user_id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":check_in", $this->check_in);
        $stmt->bindParam(":check_out", $this->check_out);
        $stmt->bindParam(":break_time", $this->break_time);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        // Пересчитываем время если есть check_in и check_out
        if ($this->check_in && $this->check_out) {
            $check_in_time = new DateTime($this->check_in);
            $check_out_time = new DateTime($this->check_out);
            $interval = $check_in_time->diff($check_out_time);
            $total_minutes = ($interval->h * 60) + $interval->i;
            $break_minutes = $this->break_time ?? 60;
            $work_minutes = max(0, $total_minutes - $break_minutes);
            $overtime_minutes = max(0, $work_minutes - 480);

            // Обновляем расчетные поля
            $update_calc_query = "UPDATE " . $this->table_name . " 
                                 SET total_time=?, overtime=?, 
                                     status=CASE 
                                       WHEN ? > 0 THEN 'overtime'
                                       WHEN ? >= 480 THEN 'complete'
                                       ELSE 'incomplete'
                                     END
                                 WHERE id=?";
            
            $calc_stmt = $this->conn->prepare($update_calc_query);
            $calc_stmt->bindParam(1, $work_minutes);
            $calc_stmt->bindParam(2, $overtime_minutes);
            $calc_stmt->bindParam(3, $overtime_minutes);
            $calc_stmt->bindParam(4, $work_minutes);
            $calc_stmt->bindParam(5, $this->id);
            $calc_stmt->execute();
        }

        return $stmt->execute();
    }

    // Удалить запись
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id=? AND user_id=?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->bindParam(2, $this->user_id);
        return $stmt->execute();
    }
}
?>