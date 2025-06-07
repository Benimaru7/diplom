<?php
// models/User.php

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $first_name;
    public $last_name;
    public $middle_name;
    public $email;
    public $personal_email;
    public $phone;
    public $password;
    public $role;
    public $avatar;
    public $position;
    public $department;
    public $salary;
    public $employee_id;
    public $start_date;
    public $manager;
    public $birth_date;
    public $address;
    public $skills;
    public $bio;
    public $is_active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Создать пользователя
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET first_name=:first_name, last_name=:last_name, middle_name=:middle_name,
                     email=:email, personal_email=:personal_email, phone=:phone,
                     password=:password, role=:role, avatar=:avatar,
                     position=:position, department=:department, salary=:salary,
                     employee_id=:employee_id, start_date=:start_date, manager=:manager,
                     birth_date=:birth_date, address=:address, skills=:skills,
                     bio=:bio, is_active=1, created_at=NOW()";

        $stmt = $this->conn->prepare($query);

        // Очистка данных
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->middle_name = htmlspecialchars(strip_tags($this->middle_name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->personal_email = htmlspecialchars(strip_tags($this->personal_email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->role = htmlspecialchars(strip_tags($this->role));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->department = htmlspecialchars(strip_tags($this->department));

        // Привязка значений
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":middle_name", $this->middle_name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":personal_email", $this->personal_email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":avatar", $this->avatar);
        $stmt->bindParam(":position", $this->position);
        $stmt->bindParam(":department", $this->department);
        $stmt->bindParam(":salary", $this->salary);
        $stmt->bindParam(":employee_id", $this->employee_id);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":manager", $this->manager);
        $stmt->bindParam(":birth_date", $this->birth_date);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":skills", $this->skills);
        $stmt->bindParam(":bio", $this->bio);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Чтение одного пользователя по ID
    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->middle_name = $row['middle_name'];
            $this->email = $row['email'];
            $this->personal_email = $row['personal_email'];
            $this->phone = $row['phone'];
            $this->role = $row['role'];
            $this->avatar = $row['avatar'];
            $this->position = $row['position'];
            $this->department = $row['department'];
            $this->salary = $row['salary'];
            $this->employee_id = $row['employee_id'];
            $this->start_date = $row['start_date'];
            $this->manager = $row['manager'];
            $this->birth_date = $row['birth_date'];
            $this->address = $row['address'];
            $this->skills = $row['skills'];
            $this->bio = $row['bio'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    // Поиск пользователя по email
    public function findByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? AND is_active = 1 LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->id = $row['id'];
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->middle_name = $row['middle_name'];
            $this->email = $row['email'];
            $this->personal_email = $row['personal_email'];
            $this->phone = $row['phone'];
            $this->password = $row['password'];
            $this->role = $row['role'];
            $this->avatar = $row['avatar'];
            $this->position = $row['position'];
            $this->department = $row['department'];
            $this->salary = $row['salary'];
            $this->employee_id = $row['employee_id'];
            $this->start_date = $row['start_date'];
            $this->manager = $row['manager'];
            $this->birth_date = $row['birth_date'];
            $this->address = $row['address'];
            $this->skills = $row['skills'];
            $this->bio = $row['bio'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }

        return false;
    }

    // Обновить пользователя
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET first_name=:first_name, last_name=:last_name, middle_name=:middle_name,
                     personal_email=:personal_email, phone=:phone, avatar=:avatar,
                     birth_date=:birth_date, address=:address, skills=:skills,
                     bio=:bio, updated_at=NOW()
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        // Очистка данных
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->middle_name = htmlspecialchars(strip_tags($this->middle_name));
        $this->personal_email = htmlspecialchars(strip_tags($this->personal_email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));

        // Привязка значений
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":middle_name", $this->middle_name);
        $stmt->bindParam(":personal_email", $this->personal_email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":avatar", $this->avatar);
        $stmt->bindParam(":birth_date", $this->birth_date);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":skills", $this->skills);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Смена пароля
    public function changePassword($new_password) {
        $query = "UPDATE " . $this->table_name . " 
                 SET password=:password, updated_at=NOW()
                 WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Получить всех пользователей
    public function readAll() {
        $query = "SELECT 
                    id, first_name, last_name, middle_name, email, phone, role,
                    avatar, position, department, employee_id, start_date, is_active,
                    created_at
                  FROM " . $this->table_name . " 
                  WHERE is_active = 1
                  ORDER BY first_name ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Получить пользователей по отделу
    public function readByDepartment($department) {
        $query = "SELECT 
                    id, first_name, last_name, middle_name, email, phone,
                    avatar, position, employee_id
                  FROM " . $this->table_name . " 
                  WHERE department = ? AND is_active = 1
                  ORDER BY first_name ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $department);
        $stmt->execute();

        return $stmt;
    }

    // Проверка существования email
    public function emailExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
?>