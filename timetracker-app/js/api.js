// js/api.js - Модуль для работы с API

class API {
    constructor() {
        this.baseURL = 'api/';
        this.token = localStorage.getItem('auth_token') || null;
    }

    // Установить токен авторизации
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Получить заголовки для запроса
    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Базовый метод для выполнения запросов
    async request(url, options = {}) {
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(this.baseURL + url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Методы авторизации
    async login(credentials) {
        const response = await this.request('auth/login.php', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.success && response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async register(userData) {
        return await this.request('auth/register.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        try {
            await this.request('auth/logout.php', {
                method: 'POST'
            });
        } finally {
            this.setToken(null);
        }
    }

    async verifyToken() {
        return await this.request('auth/verify.php', {
            method: 'POST'
        });
    }

    // Методы работы с профилем
    async getProfile() {
        return await this.request('profile/get.php');
    }

    async updateProfile(profileData) {
        return await this.request('profile/update.php', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return await this.request('profile/change-password.php', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    async uploadAvatar(avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        return await this.request('profile/upload-avatar.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
    }

    async getSettings() {
        return await this.request('profile/settings.php');
    }

    async updateSettings(settings) {
        return await this.request('profile/settings.php', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Методы работы с учетом времени
    async checkIn(location = 'Office') {
        return await this.request('timesheet/checkin.php', {
            method: 'POST',
            body: JSON.stringify({ location })
        });
    }

    async checkOut(breakTime = 60, notes = '') {
        return await this.request('timesheet/checkout.php', {
            method: 'POST',
            body: JSON.stringify({ breakTime, notes })
        });
    }

    async getCurrentSession() {
        return await this.request('timesheet/current-session.php');
    }

    async getTimesheetRecords(startDate = null, endDate = null, limit = 30) {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (limit) params.append('limit', limit);

        const url = `timesheet/records.php${params.toString() ? '?' + params.toString() : ''}`;
        return await this.request(url);
    }

    async getTimesheetStats(period = 'month', startDate = null, endDate = null) {
        const params = new URLSearchParams();
        params.append('period', period);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        return await this.request(`timesheet/stats.php?${params.toString()}`);
    }

    async updateTimesheetRecord(recordData) {
        return await this.request('timesheet/update.php', {
            method: 'PUT',
            body: JSON.stringify(recordData)
        });
    }

    async deleteTimesheetRecord(recordId) {
        return await this.request(`timesheet/delete.php?id=${recordId}`, {
            method: 'DELETE'
        });
    }
}

// Создаем глобальный экземпляр API
window.api = new API();

// js/auth-integration.js - Интеграция авторизации с API

// Обновляем функции авторизации для работы с API
async function handleLogin(credentials, role) {
    try {
        showLoading('Вход в систему...', 'Проверяем данные и загружаем интерфейс');

        const response = await api.login(credentials);

        if (response.success) {
            // Сохраняем данные пользователя
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            showNotification('Успешно', 'Добро пожаловать в систему!', 'success');
            
            // Перенаправляем на соответствующую страницу
            setTimeout(() => {
                if (response.user.role === 'admin') {
                    window.location.href = 'admin-panel.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            throw new Error(response.message || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка входа', error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(userData, role) {
    try {
        showLoading('Регистрация...', 'Создаем ваш аккаунт');

        userData.role = role;
        const response = await api.register(userData);

        if (response.success) {
            showRegistrationSuccess('Регистрация завершена успешно! Теперь вы можете войти в систему.');
        } else {
            throw new Error(response.message || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Ошибка регистрации', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Проверка авторизации при загрузке страницы
async function checkAuthOnLoad() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        // Если нет токена, перенаправляем на страницу входа
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    try {
        const response = await api.verifyToken();
        
        if (response.success) {
            // Обновляем данные пользователя
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            currentUser = response.user;
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        // Токен недействителен, очищаем и перенаправляем
        api.setToken(null);
        localStorage.removeItem('currentUser');
        
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}