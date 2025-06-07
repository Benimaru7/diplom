# 🚀 Руководство по развертыванию TimeTracker Pro

## Содержание
1. [Подготовка к развертыванию](#подготовка-к-развертыванию)
2. [Локальная разработка](#локальная-разработка)
3. [Staging окружение](#staging-окружение)
4. [Production развертывание](#production-развертывание)
5. [Docker развертывание](#docker-развертывание)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Мониторинг и логирование](#мониторинг-и-логирование)
8. [Обновление системы](#обновление-системы)

---

## Подготовка к развертыванию

### Требования к серверу

#### Минимальные требования:
- **CPU**: 2 ядра, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 20.04 LTS / CentOS 8 / Windows Server 2019
- **Network**: Стабильное интернет-соединение

#### Рекомендуемые требования:
- **CPU**: 4 ядра, 2.5 GHz
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Load Balancer**: Nginx/Apache
- **Database**: Отдельный сервер

### Проверка окружения

```bash
#!/bin/bash
# check-environment.sh

echo "=== Проверка системных требований ==="

# Проверка ОС
echo "Операционная система:"
lsb_release -a 2>/dev/null || cat /etc/os-release

# Проверка ресурсов
echo -e "\nЦентральный процессор:"
lscpu | grep "CPU(s):\|Model name:"

echo -e "\nОперативная память:"
free -h

echo -e "\nДисковое пространство:"
df -h

# Проверка сетевого подключения
echo -e "\nСетевое подключение:"
ping -c 3 google.com

# Проверка открытых портов
echo -e "\nОткрытые порты:"
netstat -tlnp | grep -E ":80|:443|:3306|:5432"

echo -e "\n=== Проверка завершена ==="
```

---

## Локальная разработка

### 1. Установка зависимостей

```bash
# Клонирование репозитория
git clone https://github.com/company/timetracker-pro.git
cd timetracker-pro

# Установка Node.js зависимостей
npm install

# Установка глобальных инструментов
npm install -g serve http-server
```

### 2. Настройка локальной базы данных

#### MySQL:
```sql
-- Создание базы данных для разработки
CREATE DATABASE timetracker_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON timetracker_dev.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
```

#### SQLite (для быстрого старта):
```bash
# Создание SQLite базы
mkdir -p data
touch data/timetracker.db
```

### 3. Конфигурация для разработки

```javascript
// config/development.js
export default {
    app: {
        name: 'TimeTracker Pro (Dev)',
        url: 'http://localhost:3000',
        debug: true
    },
    database: {
        type: 'sqlite',
        file: './data/timetracker.db'
        // или для MySQL:
        // type: 'mysql',
        // host: 'localhost',
        // port: 3306,
        // database: 'timetracker_dev',
        // username: 'dev_user',
        // password: 'dev_password'
    },
    storage: {
        type: 'local',
        path: './uploads'
    }
};
```

### 4. Запуск в режиме разработки

```bash
# Запуск с hot reload
npm run dev

# Или запуск статического сервера
npm run serve

# Запуск тестов
npm test

# Линтинг кода
npm run lint
```

### 5. Наполнение тестовыми данными

```bash
# Выполнение миграций
npm run migrate

# Загрузка тестовых данных
npm run seed

# Создание тестового администратора
npm run create-admin -- --email admin@dev.local --password admin123
```

---

## Staging окружение

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y nginx nodejs npm mysql-server git curl

# Настройка Node.js (последняя LTS версия)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Настройка веб-сервера

```nginx
# /etc/nginx/sites-available/timetracker-staging
server {
    listen 80;
    server_name staging.timetracker.company.com;

    root /var/www/timetracker-staging;
    index index.html;

    # Логирование
    access_log /var/log/nginx/timetracker-staging_access.log;
    error_log /var/log/nginx/timetracker-staging_error.log;

    # Обслуживание статических файлов
    location / {
        try_files $uri $uri/ @fallback;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # Fallback для SPA
    location @fallback {
        rewrite ^.*$ /index.html last;
    }

    # API проксирование (если есть бэкенд)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 3. SSL сертификат

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d staging.timetracker.company.com

# Настройка автообновления
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 4. Автоматизация развертывания

```bash
#!/bin/bash
# deploy-staging.sh

set -e

APP_NAME="timetracker-staging"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/company/timetracker-pro.git"
BRANCH="develop"

echo "=== Развертывание TimeTracker Pro (Staging) ==="

# Проверка и создание директории
if [ ! -d "$APP_DIR" ]; then
    echo "Клонирование репозитория..."
    sudo git clone $REPO_URL $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
else
    echo "Обновление кода..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
fi

cd $APP_DIR

# Установка зависимостей
echo "Установка зависимостей..."
npm ci --production

# Сборка приложения
echo "Сборка приложения..."
npm run build:staging

# Настройка прав доступа
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Перезапуск веб-сервера
echo "Перезапуск Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# Проверка доступности
echo "Проверка доступности..."
curl -f http://staging.timetracker.company.com || {
    echo "Ошибка: Сайт недоступен!"
    exit 1
}

echo "✅ Развертывание завершено успешно!"
echo "🌐 Сайт доступен: https://staging.timetracker.company.com"
```

---

## Production развертывание

### 1. Подготовка production сервера

```bash
#!/bin/bash
# setup-production.sh

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых компонентов
sudo apt install -y nginx nodejs npm mysql-server redis-server fail2ban ufw

# Настройка брандмауэра
sudo ufw default deny incoming
sudo ufw default allow outgoing