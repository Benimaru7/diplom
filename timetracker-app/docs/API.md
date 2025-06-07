# 🚀 API Reference - TimeTracker Pro

## Быстрый старт

### Базовая настройка
```javascript
const API_BASE_URL = 'https://api.timetracker.pro/v1';
const token = 'your-jwt-token';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};
```

### Примеры использования

#### 1. Аутентификация
```javascript
// Вход в систему
const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('token', data.data.token);
        return data.data;
    }
    throw new Error(data.error.message);
};

// Использование
try {
    const user = await login('user@company.com', 'password123');
    console.log('Logged in:', user);
} catch (error) {
    console.error('Login failed:', error.message);
}
```

#### 2. Отметка времени
```javascript
// Отметка прихода
const checkIn = async (note = '') => {
    const response = await fetch(`${API_BASE_URL}/timesheet/checkin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            timestamp: new Date().toISOString(),
            note
        })
    });
    
    return await response.json();
};

// Отметка ухода
const checkOut = async (note = '') => {
    const response = await fetch(`${API_BASE_URL}/timesheet/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            timestamp: new Date().toISOString(),
            note
        })
    });
    
    return await response.json();
};

// Использование
await checkIn('Начинаю рабочий день');
// ... работа ...
await checkOut('Завершил все задачи');
```

#### 3. Получение данных
```javascript
// Получение профиля
const getProfile = async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers
    });
    return await response.json();
};

// Получение записей времени за неделю
const getWeekTimesheet = async () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 7));
    
    const params = new URLSearchParams({
        date_from: weekStart.toISOString().split('T')[0],
        date_to: weekEnd.toISOString().split('T')[0]
    });
    
    const response = await fetch(`${API_BASE_URL}/timesheet?${params}`, {
        headers
    });
    return await response.json();
};
```

#### 4. Работа с календарем
```javascript
// Создание события
const createEvent = async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/calendar/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
    });
    return await response.json();
};

// Получение событий на месяц
const getMonthEvents = async (year, month) => {
    const dateFrom = `${year}-${month.toString().padStart(2, '0')}-01`;
    const dateTo = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo
    });
    
    const response = await fetch(`${API_BASE_URL}/calendar/events?${params}`, {
        headers
    });
    return await response.json();
};

// Пример создания события
const newEvent = {
    title: 'Встреча с клиентом',
    description: 'Обсуждение требований к проекту',
    type: 'meeting',
    date: '2025-06-05',
    start_time: '14:00:00',
    duration: 90,
    location: 'Переговорная #1',
    reminder: true
};

await createEvent(newEvent);
```

## API Wrapper Class

```javascript
class TimeTrackerAPI {
    constructor(baseURL, token) {
        this.baseURL = baseURL;
        this.token = token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        
        if (response.success) {
            this.token = response.data.token;
        }
        
        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });
        
        if (response.success) {
            this.token = null;
        }
        
        return response;
    }

    // User methods
    async getProfile() {
        return await this.request('/users/profile');
    }

    async updateProfile(data) {
        return await this.request('/users/profile', {
            method: 'PATCH',
            body: data
        });
    }

    // Timesheet methods
    async checkIn(data = {}) {
        return await this.request('/timesheet/checkin', {
            method: 'POST',
            body: {
                timestamp: new Date().toISOString(),
                ...data
            }
        });
    }

    async checkOut(data = {}) {
        return await this.request('/timesheet/checkout', {
            method: 'POST',
            body: {
                timestamp: new Date().toISOString(),
                ...data
            }
        });
    }

    async getTimesheet(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/timesheet${query ? '?' + query : ''}`);
    }

    async addManualEntry(data) {
        return await this.request('/timesheet/manual', {
            method: 'POST',
            body: data
        });
    }

    // Calendar methods
    async getEvents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/calendar/events${query ? '?' + query : ''}`);
    }

    async createEvent(data) {
        return await this.request('/calendar/events', {
            method: 'POST',
            body: data
        });
    }

    async updateEvent(id, data) {
        return await this.request(`/calendar/events/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    async deleteEvent(id) {
        return await this.request(`/calendar/events/${id}`, {
            method: 'DELETE'
        });
    }

    // Reports methods
    async getTimesheetReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/reports/timesheet${query ? '?' + query : ''}`);
    }

    async getProductivityReport(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/reports/productivity${query ? '?' + query : ''}`);
    }

    // Payroll methods
    async getCurrentPayroll() {
        return await this.request('/payroll/current');
    }

    async getPayrollHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/payroll/history${query ? '?' + query : ''}`);
    }

    // Settings methods
    async getUserSettings() {
        return await this.request('/settings/user');
    }

    async updateUserSettings(data) {
        return await this.request('/settings/user', {
            method: 'PUT',
            body: data
        });
    }

    async getCompanySettings() {
        return await this.request('/settings/company');
    }
}

// Использование
const api = new TimeTrackerAPI('https://api.timetracker.pro/v1');

// Пример работы с API
(async () => {
    try {
        // Вход в систему
        await api.login('user@company.com', 'password123');
        
        // Получение профиля
        const profile = await api.getProfile();
        console.log('Profile:', profile.data);
        
        // Отметка прихода
        await api.checkIn({ note: 'Начинаю работу' });
        
        // Получение событий на сегодня
        const today = new Date().toISOString().split('T')[0];
        const events = await api.getEvents({
            date_from: today,
            date_to: today
        });
        console.log('Today events:', events.data);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
```

## Реактивные хуки для React

```javascript
import { useState, useEffect, useCallback } from 'react';

// Хук для аутентификации
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const api = new TimeTrackerAPI('https://api.timetracker.pro/v1', token);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.login(email, password);
            if (response.success) {
                setToken(response.data.token);
                setUser(response.data.user);
                localStorage.setItem('token', response.data.token);
                return response.data;
            }
        } catch (error) {
            throw error;
        }
    }, [api]);

    const logout = useCallback(async () => {
        try {
            await api.logout();
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [api]);

    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await api.getProfile();
                    if (response.success) {
                        setUser(response.data);
                    }
                } catch (error) {
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token, api]);

    return { user, loading, login, logout, api };
};

// Хук для работы с табелем
export const useTimesheet = (period = 'current') => {
    const [timesheet, setTimesheet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { api } = useAuth();

    const fetchTimesheet = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getTimesheet(params);
            if (response.success) {
                setTimesheet(response.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [api]);

    const checkIn = useCallback(async (note = '') => {
        try {
            const response = await api.checkIn({ note });
            if (response.success) {
                fetchTimesheet(); // Обновляем данные
                return response.data;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [api, fetchTimesheet]);

    const checkOut = useCallback(async (note = '') => {
        try {
            const response = await api.checkOut({ note });
            if (response.success) {
                fetchTimesheet(); // Обновляем данные
                return response.data;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [api, fetchTimesheet]);

    useEffect(() => {
        if (api) {
            fetchTimesheet();
        }
    }, [api, fetchTimesheet, period]);

    return {
        timesheet,
        loading,
        error,
        checkIn,
        checkOut,
        refetch: fetchTimesheet
    };
};

// Хук для календаря
export const useCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { api } = useAuth();

    const fetchEvents = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getEvents(params);
            if (response.success) {
                setEvents(response.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [api]);

    const createEvent = useCallback(async (eventData) => {
        try {
            const response = await api.createEvent(eventData);
            if (response.success) {
                fetchEvents(); // Обновляем список
                return response.data;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [api, fetchEvents]);

    const updateEvent = useCallback(async (id, eventData) => {
        try {
            const response = await api.updateEvent(id, eventData);
            if (response.success) {
                fetchEvents(); // Обновляем список
                return response.data;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [api, fetchEvents]);

    const deleteEvent = useCallback(async (id) => {
        try {
            const response = await api.deleteEvent(id);
            if (response.success) {
                fetchEvents(); // Обновляем список
                return true;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [api, fetchEvents]);

    return {
        events,
        loading,
        error,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent
    };
};

// Пример использования в компоненте
const Dashboard = () => {
    const { user, logout } = useAuth();
    const { timesheet, checkIn, checkOut, loading } = useTimesheet();
    const { events } = useCalendar();

    const handleCheckIn = async () => {
        try {
            await checkIn('Начинаю рабочий день');
            alert('Приход отмечен!');
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <h1>Добро пожаловать, {user?.name}!</h1>
            <button onClick={handleCheckIn}>Отметить приход</button>
            <button onClick={() => checkOut('Завершаю работу')}>Отметить уход</button>
            <button onClick={logout}>Выйти</button>
            
            <h2>Сегодняшние события</h2>
            {events.map(event => (
                <div key={event.id}>{event.title} - {event.start_time}</div>
            ))}
        </div>
    );
};
```

## Обработка ошибок

```javascript
class APIError extends Error {
    constructor(response, data) {
        super(data.error?.message || 'API Error');
        this.name = 'APIError';
        this.code = data.error?.code;
        this.status = response.status;
        this.details = data.error?.details;
    }
}

// Расширенная версия с обработкой ошибок
class TimeTrackerAPIAdvanced extends TimeTrackerAPI {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                    ...options.headers
                },
                ...options,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                throw new APIError(response, data);
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) {
                // Специфичная обработка ошибок API
                switch (error.code) {
                    case 'AUTHENTICATION_FAILED':
                        this.token = null;
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        break;
                    case 'VALIDATION_ERROR':
                        console.log('Validation errors:', error.details);
                        break;
                    case 'ALREADY_CHECKED_IN':
                        console.log('User already checked in at:', error.details?.last_checkin);
                        break;
                }
            }
            throw error;
        }
    }

    // Retry механизм для критичных операций
    async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                if (i === maxRetries - 1 || error.status < 500) {
                    throw error;
                }
                // Ждем перед повторной попыткой
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
}
```

## Кеширование и оптимизация

```javascript
class CachedTimeTrackerAPI extends TimeTrackerAPIAdvanced {
    constructor(baseURL, token) {
        super(baseURL, token);
        this.cache = new Map();
        this.cacheExpiry = new Map();
    }

    // Кеширование GET запросов
    async getCached(endpoint, ttl = 300000) { // 5 минут по умолчанию
        const cacheKey = `GET:${endpoint}`;
        const now = Date.now();
        
        if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > now) {
            return this.cache.get(cacheKey);
        }

        const response = await this.request(endpoint);
        this.cache.set(cacheKey, response);
        this.cacheExpiry.set(cacheKey, now + ttl);
        
        return response;
    }

    // Инвалидация кеша
    invalidateCache(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }

    // Переопределяем методы для использования кеша
    async getProfile() {
        return await this.getCached('/users/profile', 600000); // 10 минут
    }

    async getTimesheet(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.getCached(`/timesheet${query ? '?' + query : ''}`, 60000); // 1 минута
    }

    async checkIn(data = {}) {
        const response = await super.checkIn(data);
        this.invalidateCache('/timesheet'); // Инвалидируем кеш табеля
        return response;
    }

    async checkOut(data = {}) {
        const response = await super.checkOut(data);
        this.invalidateCache('/timesheet'); // Инвалидируем кеш табеля
        return response;
    }
}
```

## Валидация данных

```javascript
// Схемы валидации
const schemas = {
    user: {
        name: { required: true, minLength: 2, maxLength: 100 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { pattern: /^\+?[\d\s\-\(\)]+$/ }
    },
    event: {
        title: { required: true, minLength: 1, maxLength: 200 },
        date: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
        start_time: { pattern: /^\d{2}:\d{2}:\d{2}$/ },
        duration: { min: 1, max: 1440 }
    }
};

// Валидатор
const validate = (data, schema) => {
    const errors = {};
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        if (rules.required && (!value || value.toString().trim() === '')) {
            errors[field] = ['Поле обязательно для заполнения'];
            continue;
        }
        
        if (value) {
            if (rules.minLength && value.length < rules.minLength) {
                errors[field] = errors[field] || [];
                errors[field].push(`Минимальная длина: ${rules.minLength}`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors[field] = errors[field] || [];
                errors[field].push(`Максимальная длина: ${rules.maxLength}`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors[field] = errors[field] || [];
                errors[field].push('Неверный формат');
            }
            
            if (rules.min && Number(value) < rules.min) {
                errors[field] = errors[field] || [];
                errors[field].push(`Минимальное значение: ${rules.min}`);
            }
            
            if (rules.max && Number(value) > rules.max) {
                errors[field] = errors[field] || [];
                errors[field].push(`Максимальное значение: ${rules.max}`);
            }
        }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
};

// Расширение API с валидацией
class ValidatedTimeTrackerAPI extends CachedTimeTrackerAPI {
    async updateProfile(data) {
        const errors = validate(data, schemas.user);
        if (errors) {
            throw new Error('Validation failed: ' + JSON.stringify(errors));
        }
        return await super.updateProfile(data);
    }

    async createEvent(data) {
        const errors = validate(data, schemas.event);
        if (errors) {
            throw new Error('Validation failed: ' + JSON.stringify(errors));
        }
        return await super.createEvent(data);
    }
}
```

## Тестирование API

```javascript
// Jest тесты
describe('TimeTracker API', () => {
    let api;
    
    beforeEach(() => {
        api = new TimeTrackerAPI('https://api.test.timetracker.pro/v1');
        // Мокаем fetch
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should login successfully', async () => {
        const mockResponse = {
            success: true,
            data: {
                token: 'test-token',
                user: { id: 1, name: 'Test User' }
            }
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await api.login('test@example.com', 'password');
        
        expect(fetch).toHaveBeenCalledWith(
            'https://api.test.timetracker.pro/v1/auth/login',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password'
                })
            })
        );
        
        expect(result.success).toBe(true);
        expect(api.token).toBe('test-token');
    });

    test('should handle check-in', async () => {
        api.token = 'test-token';
        
        const mockResponse = {
            success: true,
            data: { id: 123, timestamp: '2025-06-02T09:00:00Z' }
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await api.checkIn({ note: 'Test note' });
        
        expect(fetch).toHaveBeenCalledWith(
            'https://api.test.timetracker.pro/v1/timesheet/checkin',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            })
        );
        
        expect(result.success).toBe(true);
    });

    test('should handle API errors', async () => {
        const mockError = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed'
            }
        };

        fetch.mockResolvedValueOnce({
            ok: false,
            status: 422,
            json: async () => mockError
        });

        await expect(api.login('invalid', 'data')).rejects.toThrow('Validation failed');
    });
});
```

---

**Последнее обновление**: 2 июня 2025 г.  
**Версия**: 1.0