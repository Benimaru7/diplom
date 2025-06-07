# 📖 API Документация TimeTracker Pro

## Содержание
1. [Введение](#введение)
2. [Аутентификация](#аутентификация)
3. [Структура ответов](#структура-ответов)
4. [Пользователи](#пользователи)
5. [Учет времени](#учет-времени)
6. [Календарь](#календарь)
7. [Отчеты](#отчеты)
8. [Зарплата](#зарплата)
9. [Настройки](#настройки)
10. [Webhook'и](#webhookи)
11. [Коды ошибок](#коды-ошибок)

---

## Введение

TimeTracker Pro предоставляет RESTful API для интеграции с внешними системами. API использует JSON для обмена данными и HTTP-методы для различных операций.

### Базовая информация
- **Базовый URL**: `https://api.timetracker.pro/v1/`
- **Формат данных**: JSON
- **Кодировка**: UTF-8
- **Версионирование**: через URL path (`/v1/`)

### Поддерживаемые HTTP методы
- `GET` - Получение данных
- `POST` - Создание новых записей
- `PUT` - Полное обновление записи
- `PATCH` - Частичное обновление записи
- `DELETE` - Удаление записи

---

## Аутентификация

API использует JWT (JSON Web Token) для аутентификации. Токен необходимо передавать в заголовке `Authorization` с префиксом `Bearer`.

### Получение токена

**POST** `/auth/login`

```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "Иван Петров",
      "email": "ivan.petrov@company.com",
      "role": "employee"
    }
  }
}
```

### Использование токена

```http
GET /api/v1/users/profile
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

### Обновление токена

**POST** `/auth/refresh`

```http
Authorization: Bearer YOUR_TOKEN
```

### Выход из системы

**POST** `/auth/logout`

```http
Authorization: Bearer YOUR_TOKEN
```

---

## Структура ответов

Все ответы API имеют единообразную структуру:

### Успешный ответ
```json
{
  "success": true,
  "data": {
    // Данные ответа
  },
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "timestamp": "2025-06-02T10:30:00Z"
}
```

### Ответ с ошибкой
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email обязателен для заполнения"],
      "password": ["Пароль должен содержать минимум 8 символов"]
    }
  },
  "timestamp": "2025-06-02T10:30:00Z"
}
```

---

## Пользователи

### Получение профиля текущего пользователя

**GET** `/users/profile`

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Иван Петров",
    "email": "ivan.petrov@company.com",
    "phone": "+996555123456",
    "position": "Frontend Developer",
    "department": "IT отдел",
    "avatar": "https://api.timetracker.pro/avatars/1.jpg",
    "role": "employee",
    "salary": 80000,
    "hire_date": "2024-01-15",
    "status": "active",
    "settings": {
      "timezone": "Asia/Bishkek",
      "language": "ru",
      "notifications": {
        "email": true,
        "push": true
      }
    },
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2025-06-01T15:30:00Z"
  }
}
```

### Обновление профиля

**PATCH** `/users/profile`

```json
{
  "name": "Иван Петрович Петров",
  "phone": "+996555987654",
  "settings": {
    "timezone": "Europe/Moscow",
    "notifications": {
      "email": false
    }
  }
}
```

### Получение списка пользователей (только для админов)

**GET** `/users`

**Параметры запроса:**
- `page` - Номер страницы (по умолчанию: 1)
- `per_page` - Количество записей на страницу (по умолчанию: 20, максимум: 100)
- `role` - Фильтр по роли (`admin`, `manager`, `employee`)
- `department` - Фильтр по отделу
- `status` - Фильтр по статусу (`active`, `inactive`)
- `search` - Поиск по имени или email

**Пример запроса:**
```http
GET /users?page=1&per_page=10&role=employee&department=IT&search=иван
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Иван Петров",
      "email": "ivan.petrov@company.com",
      "position": "Frontend Developer",
      "department": "IT отдел",
      "role": "employee",
      "status": "active",
      "last_activity": "2025-06-02T08:30:00Z"
    }