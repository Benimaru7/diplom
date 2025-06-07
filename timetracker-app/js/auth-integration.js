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
