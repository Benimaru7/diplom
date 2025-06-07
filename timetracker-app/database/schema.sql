-- database/schema.sql
-- Схема базы данных для TimeTracker Pro

CREATE DATABASE IF NOT EXISTS `timetracker_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `timetracker_db`;

-- Таблица пользователей
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL UNIQUE,
  `personal_email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('employee','manager','admin','hr') DEFAULT 'employee',
  `avatar` varchar(500) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT 0.00,
  `employee_id` varchar(20) DEFAULT NULL UNIQUE,
  `start_date` date DEFAULT NULL,
  `manager` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_department` (`department`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица учета рабочего времени
CREATE TABLE `timesheets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` timestamp NOT NULL,
  `check_in` timestamp DEFAULT NULL,
  `check_out` timestamp DEFAULT NULL,
  `break_time` int(11) DEFAULT 60 COMMENT 'Время перерыва в минутах',
  `total_time` int(11) DEFAULT 0 COMMENT 'Общее рабочее время в минутах',
  `overtime` int(11) DEFAULT 0 COMMENT 'Переработка в минутах',
  `status` enum('in_progress','complete','overtime','incomplete','absent') DEFAULT 'in_progress',
  `notes` text DEFAULT NULL,
  `location` varchar(255) DEFAULT 'Office',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `date`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_timesheets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица настроек пользователей
CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `dark_theme` tinyint(1) DEFAULT 0,
  `language` varchar(10) DEFAULT 'ru',
  `timezone` varchar(50) DEFAULT 'Europe/Moscow',
  `compact_view` tinyint(1) DEFAULT 0,
  `email_notifications` tinyint(1) DEFAULT 1,
  `timesheet_reminders` tinyint(1) DEFAULT 1,
  `weekly_reports` tinyint(1) DEFAULT 0,
  `sound_notifications` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_settings` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица задач
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `deadline` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_tasks` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_deadline` (`deadline`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица событий календаря
CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('meeting','deadline','holiday','personal','other') DEFAULT 'other',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `date` date NOT NULL,
  `time` time DEFAULT NULL,
  `duration` int(11) DEFAULT 60 COMMENT 'Продолжительность в минутах',
  `location` varchar(255) DEFAULT NULL,
  `reminder` tinyint(1) DEFAULT 0,
  `reminder_time` int(11) DEFAULT 15 COMMENT 'Время напоминания в минутах до события',
  `is_all_day` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `date`),
  KEY `idx_date` (`date`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_calendar_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица расчета зарплаты
CREATE TABLE `payroll` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `base_salary` decimal(10,2) NOT NULL,
  `hourly_rate` decimal(8,2) DEFAULT 0.00,
  `total_hours` int(11) DEFAULT 0,
  `regular_hours` int(11) DEFAULT 0,
  `overtime_hours` int(11) DEFAULT 0,
  `overtime_rate` decimal(8,2) DEFAULT 0.00,
  `bonuses` decimal(10,2) DEFAULT 0.00,
  `deductions` decimal(10,2) DEFAULT 0.00,
  `gross_pay` decimal(10,2) DEFAULT 0.00,
  `tax_deductions` decimal(10,2) DEFAULT 0.00,
  `social_deductions` decimal(10,2) DEFAULT 0.00,
  `net_pay` decimal(10,2) DEFAULT 0.00,
  `status` enum('draft','calculated','approved','paid') DEFAULT 'draft',
  `calculated_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_period` (`user_id`, `period_start`, `period_end`),
  KEY `idx_period` (`period_start`, `period_end`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payroll_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица отпусков и больничных
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('vacation','sick','personal','maternity','emergency') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_count` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_leave` (`user_id`),
  KEY `idx_dates` (`start_date`, `end_date`),
  KEY `idx_status` (`status`),
  KEY `idx_approved_by` (`approved_by`),
  CONSTRAINT `fk_leave_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_requests_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица отделов
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `budget` decimal(12,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_department_name` (`name`),
  KEY `idx_manager` (`manager_id`),
  CONSTRAINT `fk_departments_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица системных логов
CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_logs` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_system_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Заполнение тестовыми данными

-- Отделы
INSERT INTO `departments` (`name`, `description`, `budget`) VALUES
('IT отдел', 'Информационные технологии и разработка', 500000.00),
('HR отдел', 'Управление персоналом', 200000.00),
('Продажи', 'Отдел продаж и маркетинга', 300000.00),
('Маркетинг', 'Маркетинг и реклама', 250000.00),
('Финансы', 'Финансовый отдел', 150000.00),
('Дизайн', 'Отдел дизайна и UX/UI', 180000.00);

-- Тестовые пользователи
INSERT INTO `users` (
  `first_name`, `last_name`, `middle_name`, `email`, `personal_email`, 
  `phone`, `password`, `role`, `position`, `department`, `salary`, 
  `employee_id`, `start_date`, `manager`, `birth_date`, `address`, 
  `skills`, `bio`
) VALUES
-- Администратор
(
  'Анна', 'Администратор', 'Владимировна', 'admin@company.com', 
  'admin@gmail.com', '+7 (999) 000-00-01', 
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin', 'Главный администратор', 'Администрация', 120000.00, 
  'ADM001', '2023-01-01', NULL, '1985-03-15', 
  'г. Москва, ул. Центральная, д. 1', 
  'Управление персоналом, Системное администрирование', 
  'Главный администратор системы TimeTracker Pro'
),
-- Сотрудники
(
  'Иван', 'Петров', 'Сергеевич', 'ivan.petrov@company.com', 
  'ivan.petrov@gmail.com', '+7 (999) 123-45-67', 
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 123456
  'employee', 'Frontend Developer', 'IT отдел', 80000.00, 
  '001', '2023-01-15', 'Смирнов Алексей Иванович', '1990-05-15', 
  'г. Москва, ул. Примерная, д. 123, кв. 45', 
  'JavaScript, React, Vue.js, HTML5, CSS3, Node.js, Git, Agile/Scrum', 
  'Опытный frontend-разработчик с фокусом на современные веб-технологии и пользовательский опыт.'
),
(
  'Мария', 'Сидорова', 'Александровна', 'maria.sidorova@company.com', 
  'maria.sidorova@gmail.com', '+7 (999) 234-56-78', 
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 123456
  'employee', 'Backend Developer', 'IT отдел', 85000.00, 
  '002', '2023-02-01', 'Смирнов Алексей Иванович', '1992-08-22', 
  'г. Москва, ул. Новая, д. 45, кв. 12', 
  'PHP, Python, MySQL, PostgreSQL, Redis, Docker, API Development', 
  'Backend-разработчик с опытом создания масштабируемых веб-приложений.'
),
(
  'Елена', 'Козлова', 'Дмитриевна', 'elena.kozlova@company.com', 
  'elena.kozlova@gmail.com', '+7 (999) 345-67-89', 
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 123456
  'manager', 'HR Manager', 'HR отдел', 90000.00, 
  '003', '2023-01-10', NULL, '1988-12-03', 
  'г. Москва, ул. Садовая, д. 78, кв. 34', 
  'Управление персоналом, Рекрутинг, Психология, 1С:ЗУП', 
  'HR-менеджер с опытом работы в области управления персоналом и рекрутинга.'
);

-- Настройки пользователей по умолчанию
INSERT INTO `user_settings` (`user_id`) 
SELECT `id` FROM `users`;

-- Тестовые записи времени
INSERT INTO `timesheets` (
  `user_id`, `date`, `check_in`, `check_out`, `break_time`, 
  `total_time`, `overtime`, `status`
) VALUES
-- Записи для Ивана Петрова (user_id = 2)
(2, '2025-05-28 09:00:00', '2025-05-28 09:00:00', '2025-05-28 18:30:00', 60, 510, 30, 'overtime'),
(2, '2025-05-29 09:15:00', '2025-05-29 09:15:00', '2025-05-29 17:45:00', 60, 450, 0, 'complete'),
(2, '2025-05-30 09:00:00', '2025-05-30 09:00:00', '2025-05-30 18:00:00', 60, 480, 0, 'complete'),
-- Записи для Марии Сидоровой (user_id = 3)
(3, '2025-05-28 08:45:00', '2025-05-28 08:45:00', '2025-05-28 17:30:00', 60, 465, 0, 'complete'),
(3, '2025-05-29 09:00:00', '2025-05-29 09:00:00', '2025-05-29 18:15:00', 60, 495, 15, 'overtime'),
(3, '2025-05-30 09:10:00', '2025-05-30 09:10:00', '2025-05-30 17:50:00', 60, 460, 0, 'complete');

-- Тестовые задачи
INSERT INTO `tasks` (
  `user_id`, `title`, `description`, `priority`, `status`, `deadline`
) VALUES
(2, 'Завершить модуль авторизации', 'Реализовать функционал входа и регистрации пользователей', 'high', 'in_progress', '2025-06-07 18:00:00'),
(2, 'Ревью кода коллеги', 'Проверить pull request от Марии по API', 'medium', 'pending', '2025-06-08 12:00:00'),
(2, 'Обновить документацию', 'Написать документацию к новому API', 'low', 'completed', '2025-06-06 17:00:00'),
(3, 'Оптимизация базы данных', 'Добавить индексы и оптимизировать запросы', 'high', 'in_progress', '2025-06-10 18:00:00'),
(3, 'Настройка мониторинга', 'Внедрить систему мониторинга производительности', 'medium', 'pending', '2025-06-15 18:00:00');

-- Тестовые события календаря
INSERT INTO `calendar_events` (
  `user_id`, `title`, `description`, `type`, `priority`, 
  `date`, `time`, `duration`, `location`, `reminder`
) VALUES
(2, 'Ежедневный стендап', 'Ежедневная встреча команды разработки', 'meeting', 'medium', '2025-06-06', '10:00:00', 30, 'Конференц-зал', 1),
(2, 'Планирование спринта', 'Планирование задач на следующий спринт', 'meeting', 'high', '2025-06-06', '14:00:00', 120, 'Zoom', 1),
(2, '1-на-1 с руководителем', 'Еженедельная встреча с тимлидом', 'meeting', 'medium', '2025-06-06', '16:00:00', 60, 'Кабинет 205', 1),
(3, 'Код-ревью', 'Ревью кода новых функций', 'meeting', 'medium', '2025-06-06', '11:00:00', 60, 'Переговорная', 1),
(3, 'Техническое интервью', 'Собеседование кандидата на позицию разработчика', 'meeting', 'high', '2025-06-07', '15:00:00', 90, 'Кабинет HR', 1);

-- Индексы для оптимизации
CREATE INDEX idx_timesheets_user_month ON timesheets (user_id, YEAR(date), MONTH(date));
CREATE INDEX idx_timesheets_department_date ON timesheets (user_id, date) 
  WHERE user_id IN (SELECT id FROM users WHERE department IS NOT NULL);
CREATE INDEX idx_payroll_period ON payroll (period_start, period_end);
CREATE INDEX idx_tasks_deadline ON tasks (deadline) WHERE status != 'completed';
CREATE INDEX idx_calendar_user_month ON calendar_events (user_id, YEAR(date), MONTH(date));