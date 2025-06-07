# 🚀 Руководство по установке TimeTracker Pro

## Быстрый старт (5 минут)

### 1. Демо версия
Самый быстрый способ познакомиться с системой:

🌐 **Откройте**: [demo.timetracker.pro](https://demo.timetracker.pro)

**Тестовые аккаунты:**
- **Сотрудник**: `ivan.petrov@company.com` / `123456`
- **Администратор**: `admin@company.com` / `admin123`

### 2. Локальная установка

```bash
# Скачать архив
wget https://github.com/company/timetracker-pro/archive/main.zip
unzip main.zip
cd timetracker-pro-main

# Запустить локальный сервер
python3 -m http.server 3000
# или
npx serve .

# Открыть в браузере
open http://localhost:3000
```

**✅ Готово!** Система работает локально с демо-данными.

---

## Подробная установка

### Шаг 1: Подготовка системы

<details>
<summary>🐧 Ubuntu/Debian</summary>

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка веб-сервера
sudo apt install nginx -y

# Установка Node.js (опционально)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Установка MySQL (опционально)
sudo apt install mysql-server -y
```

</details>

<details>
<summary>🍎 macOS</summary>

```bash
# Установка Homebrew (если нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка зависимостей
brew install nginx node mysql

# Запуск сервисов
brew services start nginx
brew services start mysql
```

</details>

<details>
<summary>🪟 Windows</summary>

```powershell
# Установка через Chocolatey
choco install nginx nodejs mysql

# Или скачайте вручную:
# - Nginx: https://nginx.org/en/download.html
# - Node.js: https://nodejs.org/
# - MySQL: https://dev.mysql.com/downloads/installer/
```

</details>

### Шаг 2: Установка приложения

#### Способ A: Простая установка (рекомендуется)

```bash
# Создание директории
sudo mkdir -p /var/www/timetracker-pro
cd /var/www/timetracker-pro

# Скачивание последней версии
sudo wget https://github.com/company/timetracker-pro/releases/latest/download/timetracker-pro.zip
sudo unzip timetracker-pro.zip

# Настройка прав доступа
sudo chown -R www-data:www-data /var/www/timetracker-pro
sudo chmod -R 755 /var/www/timetracker-pro
```

#### Способ B: Установка из исходного кода

```bash
# Клонирование репозитория
git clone https://github.com/company/timetracker-pro.git /var/www/timetracker-pro
cd /var/www/timetracker-pro

# Установка зависимостей
npm install

# Сборка для production
npm run build

# Настройка прав доступа
sudo chown -R www-data:www-data /var/www/timetracker-pro
```

### Шаг 3: Настройка веб-сервера

<details>
<summary>📦 Nginx конфигурация</summary>

```bash
# Создание конфигурационного файла
sudo tee /etc/nginx/sites-available/timetracker-pro << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/timetracker-pro;
    index index.html;
    
    # Логирование
    access_log /var/log/nginx/timetracker_access.log;
    error_log /var/log/nginx/timetracker_error.log;
    
    # Основная обработка
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    # SPA fallback
    location @fallback {
        rewrite ^.*$ /index.html last;
    }
    
    # Кеширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
EOF

# Активация сайта
sudo ln -s /etc/nginx/sites-available/timetracker-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

</details>

<details>
<summary>🔧 Apache конфигурация</summary>

```bash
# Создание конфигурационного файла
sudo tee /etc/apache2/sites-available/timetracker-pro.conf << 'EOF'
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/timetracker-pro
    
    # Логирование
    ErrorLog ${APACHE_LOG_DIR}/timetracker_error.log
    CustomLog ${APACHE_LOG_DIR}/timetracker_access.log combined
    
    # Перенаправление для SPA
    <Directory /var/www/timetracker-pro>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # URL rewriting для SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Кеширование
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
</VirtualHost>
EOF

# Активация модулей и сайта
sudo a2enmod rewrite expires
sudo a2ensite timetracker-pro
sudo systemctl reload apache2
```

</details>

### Шаг 4: Настройка базы данных (опционально)

<details>
<summary>🗄️ MySQL настройка</summary>

```bash
# Вход в MySQL
sudo mysql -u root -p

# Выполнение SQL команд
```

```sql
-- Создание базы данных
CREATE DATABASE timetracker_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'timetracker'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON timetracker_pro.* TO 'timetracker'@'localhost';
FLUSH PRIVILEGES;

-- Выход
EXIT;
```

```bash
# Создание таблиц (если есть миграции)
cd /var/www/timetracker-pro
npm run migrate
```

</details>

<details>
<summary>🐘 PostgreSQL настройка</summary>

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Выполнение SQL команд
```

```sql
-- Создание базы данных и пользователя
CREATE DATABASE timetracker_pro;
CREATE USER timetracker WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE timetracker_pro TO timetracker;

-- Выход
\q
```

</details>

### Шаг 5: SSL сертификат (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автообновление
echo "0 3 * * * certbot renew --quiet" | sudo crontab -
```

### Шаг 6: Первоначальная настройка

1. **Откройте браузер** и перейдите по адресу: `https://your-domain.com`

2. **Войдите как администратор**:
   - Email: `admin@company.com`
   - Пароль: `admin123`

3. **Измените пароль администратора**:
   - Перейдите в "Настройки" → "Безопасность"
   - Установите новый безопасный пароль

4. **Настройте компанию**:
   - Перейдите в "Настройки" → "Компания"
   - Заполните информацию о вашей организации
   - Настройте рабочий график и праздники

5. **Добавьте сотрудников**:
   - Перейдите в "Пользователи"
   - Нажмите "Добавить пользователя"
   - Заполните данные сотрудников

---

## Режимы работы

### 🏠 Локальная разработка

```bash
# Клонирование для разработки
git clone https://github.com/company/timetracker-pro.git
cd timetracker-pro

# Установка dev зависимостей
npm install

# Запуск dev сервера с hot reload
npm run dev

# Открытие в браузере
open http://localhost:3000
```

**Особенности dev режима:**
- ✅ Hot reload при изменении файлов
-