# 🔧 Руководство администратора TimeTracker Pro

## Содержание
1. [Введение](#введение)
2. [Установка и настройка](#установка-и-настройка)
3. [Управление пользователями](#управление-пользователями)
4. [Настройка системы](#настройка-системы)
5. [Мониторинг и отчеты](#мониторинг-и-отчеты)
6. [Безопасность](#безопасность)
7. [Резервное копирование](#резервное-копирование)
8. [Устранение неполадок](#устранение-неполадок)
9. [API и интеграции](#api-и-интеграции)

---

## Введение

TimeTracker Pro — веб-приложение для автоматизированного учета рабочего времени и расчета заработной платы сотрудников. Данное руководство предназначено для системных администраторов и содержит инструкции по установке, настройке и обслуживанию системы.

### Системные требования

#### Минимальные требования:
- **ОС**: Linux (Ubuntu 18.04+), Windows Server 2016+, macOS 10.14+
- **Веб-сервер**: Apache 2.4+ или Nginx 1.16+
- **База данных**: MySQL 8.0+ или PostgreSQL 12+
- **PHP**: 8.0+ (для серверной части)
- **RAM**: 4 GB
- **Диск**: 20 GB свободного места
- **Браузеры**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

#### Рекомендуемые требования:
- **RAM**: 8 GB+
- **Диск**: SSD 50 GB+
- **Процессор**: 4 ядра 2.5 GHz+
- **SSL-сертификат** для HTTPS

---

## Установка и настройка

### 1. Подготовка сервера

#### Установка зависимостей (Ubuntu/Debian):
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка веб-сервера
sudo apt install nginx -y

# Установка MySQL
sudo apt install mysql-server -y

# Установка PHP и расширений
sudo apt install php8.1-fpm php8.1-mysql php8.1-json php8.1-curl php8.1-mbstring -y

# Установка Node.js для фронтенда
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

#### Настройка MySQL:
```sql
-- Создание базы данных
CREATE DATABASE timetracker_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'timetracker'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON timetracker_pro.* TO 'timetracker'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Развертывание приложения

#### Клонирование репозитория:
```bash
cd /var/www/
sudo git clone https://github.com/company/timetracker-pro.git
sudo chown -R www-data:www-data timetracker-pro/
cd timetracker-pro/
```

#### Установка зависимостей:
```bash
# Frontend зависимости
npm install

# Сборка продакшн версии
npm run build

# Настройка прав доступа
sudo chmod -R 755 assets/
sudo chmod -R 777 data/
```

### 3. Конфигурация веб-сервера

#### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name timetracker.company.com;
    root /var/www/timetracker-pro;
    index index.html index.php;

    # Логи
    access_log /var/log/nginx/timetracker_access.log;
    error_log /var/log/nginx/timetracker_error.log;

    # Основные настройки
    location / {
        try_files $uri $uri/ =404;
    }

    # PHP обработка
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }

    # Безопасность
    location ~ /\. {
        deny all;
    }

    # Кеширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### SSL настройка:
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d timetracker.company.com

# Автообновление
sudo crontab -e
# Добавить: 0 3 * * * certbot renew --quiet
```

### 4. Первоначальная настройка

#### Создание файла конфигурации:
```javascript
// config/app.js
const config = {
    database: {
        host: 'localhost',
        port: 3306,
        database: 'timetracker_pro',
        username: 'timetracker',
        password: 'SecurePassword123!'
    },
    app: {
        name: 'TimeTracker Pro',
        url: 'https://timetracker.company.com',
        timezone: 'Asia/Bishkek',
        locale: 'ru'
    },
    session: {
        secret: 'your-session-secret-key',
        timeout: 3600 // 1 час
    },
    security: {
        maxLoginAttempts: 5,
        lockoutDuration: 900, // 15 минут
        passwordMinLength: 8
    }
};

export default config;
```

#### Инициализация базы данных:
```bash
# Выполнение миграций
node scripts/migrate.js

# Создание администратора
node scripts/create-admin.js
```

---

## Управление пользователями

### 1. Структура ролей

| Роль | Описание | Права доступа |
|------|----------|---------------|
| **Супер-админ** | Полный доступ к системе | Все функции |
| **Админ** | Управление пользователями и отчеты | Все кроме настроек системы |
| **HR-менеджер** | Управление персоналом | Просмотр/редактирование сотрудников |
| **Менеджер** | Руководитель отдела | Просмотр отчетов своего отдела |
| **Сотрудник** | Обычный пользователь | Учет времени, просмотр своих данных |

### 2. Создание пользователей

#### Через админ-панель:
1. Войдите в админ-панель: `/admin-panel.html`
2. Перейдите в раздел "Пользователи"
3. Нажмите "Добавить пользователя"
4. Заполните обязательные поля:
   - Имя и фамилия
   - Email (уникальный)
   - Должность
   - Отдел
   - Роль
   - Начальная зарплата

#### Через командную строку:
```bash
node scripts/create-user.js \
  --name "Иван Петров" \
  --email "ivan.petrov@company.com" \
  --role "employee" \
  --department "IT" \
  --salary 80000
```

#### Массовый импорт:
```bash
# Подготовка CSV файла: name,email,role,department,salary
# Импорт
node scripts/import-users.js --file users.csv
```

### 3. Управление правами доступа

#### Настройка прав по ролям:
```javascript
// config/permissions.js
const permissions = {
    'super-admin': ['*'], // Все права
    'admin': [
        'users.create', 'users.edit', 'users.delete',
        'reports.view', 'reports.export',
        'settings.company'
    ],
    'hr-manager': [
        'users.view', 'users.edit',
        'reports.hr', 'payroll.view'
    ],
    'manager': [
        'reports.department', 'team.view'
    ],
    'employee': [
        'timesheet.own', 'profile.edit'
    ]
};
```

### 4. Деактивация пользователей

```sql
-- Временная деактивация
UPDATE users SET status = 'inactive' WHERE email = 'user@company.com';

-- Полное удаление (осторожно!)
-- Сначала архивируем данные
INSERT INTO users_archive SELECT * FROM users WHERE email = 'user@company.com';
DELETE FROM users WHERE email = 'user@company.com';
```

---

## Настройка системы

### 1. Общие настройки

#### Параметры компании:
```javascript
// В админ-панели или config/company.js
const companySettings = {
    name: 'ООО "Название компании"',
    address: 'г. Бишкек, ул. Примерная, 123',
    workingHours: {
        start: '09:00',
        end: '18:00',
        lunchDuration: 60
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    holidays: [
        '2025-01-01', // Новый год
        '2025-03-08', // 8 марта
        '2025-03-21', // Нооруз
        // ... другие праздники
    ],
    payrollSettings: {
        payDay: 15, // День выплаты зарплаты
        overtimeRate: 1.5,
        weekendRate: 2.0,
        holidayRate: 2.5
    }
};
```

### 2. Настройка уведомлений

#### Email настройки:
```javascript
// config/mail.js
const mailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'noreply@company.com',
        pass: 'app-password'
    },
    from: {
        name: 'TimeTracker Pro',
        address: 'noreply@company.com'
    }
};
```

#### Шаблоны уведомлений:
- `templates/weekly-report.html` - Еженедельный отчет
- `templates/payroll-notification.html` - Уведомление о зарплате
- `templates/password-reset.html` - Сброс пароля
- `templates/welcome.html` - Приветствие нового пользователя

### 3. Интеграции

#### 1C:Предприятие интеграция:
```javascript
// config/integrations.js
const integrations = {
    '1c': {
        enabled: true,
        endpoint: 'http://1c-server:8080/timetracker-exchange',
        username: '1c_user',
        password: '1c_password',
        syncInterval: 3600 // 1 час
    },
    'telegram': {
        enabled: true,
        botToken: 'YOUR_BOT_TOKEN',
        chatId: '-123456789'
    }
};
```

---

## Мониторинг и отчеты

### 1. Системный мониторинг

#### Логирование:
```bash
# Основные логи
tail -f /var/log/nginx/timetracker_access.log
tail -f /var/log/nginx/timetracker_error.log
tail -f /var/www/timetracker-pro/logs/app.log
```

#### Мониторинг производительности:
```javascript
// scripts/monitor.js - Пример скрипта мониторинга
const performance = {
    checkDatabaseConnections: async () => {
        // Проверка подключений к БД
    },
    checkDiskSpace: () => {
        // Проверка свободного места
    },
    checkMemoryUsage: () => {
        // Проверка использования памяти
    }
};
```

#### Автоматические уведомления:
```bash
# Cron задача для мониторинга
*/5 * * * * node /var/www/timetracker-pro/scripts/health-check.js
```

### 2. Отчеты для администраторов

#### Ежедневные отчеты:
- Количество активных пользователей
- Статистика посещаемости
- Ошибки и предупреждения
- Использование ресурсов сервера

#### Еженедельные отчеты:
- Сводка по отработанным часам
- Топ активных пользователей
- Статистика опозданий
- Анализ производительности

#### Месячные отчеты:
- Полная статистика по зарплатам
- Анализ трендов посещаемости
- Отчет по использованию функций
- Рекомендации по оптимизации

---

## Безопасность

### 1. Настройка брандмауэра

```bash
# UFW настройка
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw deny 3306/tcp     # MySQL (только локально)
```

### 2. Защита от атак

#### Rate limiting (Nginx):
```nginx
# Ограничение запросов
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

location /login {
    limit_req zone=login burst=5 nodelay;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

#### Fail2Ban настройка:
```bash
# Установка
sudo apt install fail2ban -y

# Настройка для TimeTracker
sudo tee /etc/fail2ban/jail.local << EOF
[timetracker]
enabled = true
port = http,https
filter = timetracker
logpath = /var/www/timetracker-pro/logs/security.log
maxretry = 5
bantime = 1800
EOF
```

### 3. Аудит безопасности

#### Регулярные проверки:
```bash
# Проверка прав доступа к файлам
find /var/www/timetracker-pro -type f -perm 777

# Проверка активных сессий
mysql -u timetracker -p -e "SELECT * FROM user_sessions WHERE expires_at > NOW();"

# Анализ логов безопасности
grep "FAILED_LOGIN" /var/www/timetracker-pro/logs/security.log | tail -20
```

---

## Резервное копирование

### 1. Автоматическое резервное копирование

#### Скрипт резервного копирования:
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/timetracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="timetracker_pro"
APP_DIR="/var/www/timetracker-pro"

# Создание директории
mkdir -p "$BACKUP_DIR/$DATE"

# Резервная копия базы данных
mysqldump -u timetracker -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/$DATE/database.sql"

# Резервная копия файлов
tar -czf "$BACKUP_DIR/$DATE/files.tar.gz" \
    --exclude="$APP_DIR/node_modules" \
    --exclude="$APP_DIR/logs" \
    "$APP_DIR"

# Резервная копия пользовательских данных
cp -r "$APP_DIR/uploads" "$BACKUP_DIR/$DATE/"

# Удаление старых копий (старше 30 дней)
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

#### Автоматизация через cron:
```bash
# Ежедневное резервное копирование в 2:00
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# Еженедельное полное резервное копирование
0 1 * * 0 /opt/scripts/full-backup.sh >> /var/log/backup.log 2>&1
```

### 2. Восстановление из резервной копии

```bash
#!/bin/bash
# restore.sh

BACKUP_PATH=$1
DB_NAME="timetracker_pro"

if [ -z "$BACKUP_PATH" ]; then
    echo "Usage: $0 /path/to/backup/folder"
    exit 1
fi

# Остановка сервисов
sudo systemctl stop nginx
sudo systemctl stop php8.1-fpm

# Восстановление базы данных
mysql -u timetracker -p$DB_PASSWORD $DB_NAME < "$BACKUP_PATH/database.sql"

# Восстановление файлов
tar -xzf "$BACKUP_PATH/files.tar.gz" -C /

# Восстановление прав доступа
sudo chown -R www-data:www-data /var/www/timetracker-pro
sudo chmod -R 755 /var/www/timetracker-pro

# Запуск сервисов
sudo systemctl start php8.1-fpm
sudo systemctl start nginx

echo "Restore completed from $BACKUP_PATH"
```

---

## Устранение неполадок

### 1. Типичные проблемы

#### Проблема: Пользователи не могут войти в систему
**Решение:**
```bash
# Проверка статуса сервисов
sudo systemctl status nginx
sudo systemctl status php8.1-fpm
sudo systemctl status mysql

# Проверка логов
tail -f /var/log/nginx/timetracker_error.log
tail -f /var/www/timetracker-pro/logs/app.log

# Проверка подключения к БД
mysql -u timetracker -p timetracker_pro -e "SELECT COUNT(*) FROM users;"
```

#### Проблема: Медленная работа системы
**Решение:**
```bash
# Анализ производительности базы данных
mysql -u timetracker -p timetracker_pro -e "SHOW PROCESSLIST;"

# Проверка использования ресурсов
htop
iotop
mysqladmin -u timetracker -p processlist

# Очистка логов
sudo truncate -s 0 /var/log/nginx/timetracker_access.log
sudo find /var/www/timetracker-pro/logs -name "*.log" -exec truncate -s 0 {} \;
```

#### Проблема: Ошибки JavaScript
**Решение:**
```bash
# Пересборка фронтенда
cd /var/www/timetracker-pro
npm run build

# Очистка кеша браузера
# Инструкция для пользователей: Ctrl+F5

# Проверка синтаксиса JS
node scripts/validate-js.js
```

### 2. Диагностические команды

```bash
# Проверка конфигурации Nginx
sudo nginx -t

# Тест подключения к базе данных
mysql -u timetracker -p timetracker_pro -e "SELECT VERSION();"

# Проверка свободного места
df -h

# Мониторинг в реальном времени
watch -n 1 'ps aux | grep -E "(nginx|php|mysql)" | grep -v grep'

# Проверка портов
netstat -tlnp | grep -E ":80|:443|:3306"
```

### 3. Процедура эскалации

1. **Уровень 1** - Основные проблемы:
   - Перезагрузка сервисов
   - Проверка логов
   - Очистка кеша

2. **Уровень 2** - Серьезные проблемы:
   - Анализ производительности
   - Проверка целостности данных
   - Восстановление из резервной копии

3. **Уровень 3** - Критические проблемы:
   - Обращение к разработчикам
   - Полное восстановление системы
   - Анализ причин сбоя

---

## API и интеграции

### 1. REST API документация

#### Базовый URL: `https://timetracker.company.com/api/v1/`

#### Аутентификация:
```bash
# Получение токена
curl -X POST https://timetracker.company.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@company.com", "password": "password"}'

# Использование токена
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://timetracker.company.com/api/v1/users/profile
```

#### Основные эндпоинты:
- `GET /users` - Список пользователей
- `POST /timesheet/checkin` - Отметка прихода
- `GET /reports/timesheet` - Отчет по времени
- `GET /payroll/current` - Текущая зарплата

### 2. Webhook настройка

```javascript
// config/webhooks.js
const webhooks = {
    onUserCheckin: [
        'https://slack.company.com/webhooks/checkin',
        'https://telegram.com/bot/send'
    ],
    onPayrollCalculated: [
        'https://1c.company.com/api/payroll'
    ]
};
```

---

## Заключение

Данное руководство покрывает основные аспекты администрирования TimeTracker Pro. Для получения дополнительной информации обращайтесь к:

- **Техническая поддержка**: support@timetracker.pro
- **Документация разработчика**: [API Docs](api-docs.md)
- **Сообщество**: https://github.com/company/timetracker-pro/discussions

**Последнее обновление**: 2 июня 2025 г.  
**Версия документа**: 1.0