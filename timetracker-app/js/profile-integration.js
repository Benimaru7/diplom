// js/profile-integration.js - Интеграция профиля с API

// Обновленные функции профиля для работы с API
async function loadCurrentUser() {
    try {
        const response = await api.getProfile();
        
        if (response.success) {
            currentUser = response.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateProfileDisplay();
        } else {
            throw new Error(response.message || 'Ошибка загрузки профиля');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Ошибка', 'Не удалось загрузить данные профиля', 'error');
    }
}

async function handlePersonalFormSubmit(e) {
    e.preventDefault();
    
    if (!validatePersonalForm()) {
        return;
    }
    
    // Собираем данные формы
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        middleName: document.getElementById('middleName').value,
        birthDate: document.getElementById('birthDate').value,
        phone: document.getElementById('phone').value,
        personalEmail: document.getElementById('personalEmail').value,
        address: document.getElementById('address').value
    };
    
    try {
        const response = await api.updateProfile(formData);
        
        if (response.success) {
            // Обновляем локальные данные
            Object.assign(currentUser, formData);
            currentUser.name = `${formData.firstName} ${formData.lastName}`;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Обновляем отображение
            updateProfileDisplay();
            
            showSuccessMessage('Личные данные успешно обновлены!');
        } else {
            throw new Error(response.message || 'Ошибка обновления профиля');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

async function handleSecurityFormSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
        return;
    }
    
    try {
        const response = await api.changePassword({
            currentPassword,
            newPassword
        });
        
        if (response.success) {
            showSuccessMessage('Пароль успешно изменен!');
            
            // Очищаем форму
            document.getElementById('securityForm').reset();
            document.getElementById('passwordStrength').className = 'password-strength';
        } else {
            throw new Error(response.message || 'Ошибка смены пароля');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

async function handleSettingsFormSubmit(e) {
    e.preventDefault();
    
    // Собираем настройки
    const settings = {
        dark_theme: document.getElementById('darkTheme').checked,
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        compact_view: document.getElementById('compactView').checked,
        email_notifications: document.getElementById('emailNotifications').checked,
        timesheet_reminders: document.getElementById('timesheetReminders').checked,
        weekly_reports: document.getElementById('weeklyReports').checked,
        sound_notifications: document.getElementById('soundNotifications').checked
    };
    
    try {
        const response = await api.updateSettings(settings);
        
        if (response.success) {
            // Применяем настройки
            applySettings(settings);
            
            showSuccessMessage('Настройки успешно сохранены!');
        } else {
            throw new Error(response.message || 'Ошибка сохранения настроек');
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

async function loadUserSettings() {
    try {
        const response = await api.getSettings();
        
        if (response.success) {
            const settings = response.data;
            
            // Применяем настройки к форме
            updateElement('darkTheme', settings.dark_theme, 'checked');
            updateElement('language', settings.language, 'value');
            updateElement('timezone', settings.timezone, 'value');
            updateElement('compactView', settings.compact_view, 'checked');
            updateElement('emailNotifications', settings.email_notifications, 'checked');
            updateElement('timesheetReminders', settings.timesheet_reminders, 'checked');
            updateElement('weeklyReports', settings.weekly_reports, 'checked');
            updateElement('soundNotifications', settings.sound_notifications, 'checked');
            
            // Применяем настройки к интерфейсу
            applySettings(settings);
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
        // Используем настройки по умолчанию
        const defaultSettings = {
            dark_theme: false,
            language: 'ru',
            timezone: 'Europe/Moscow',
            compact_view: false,
            email_notifications: true,
            timesheet_reminders: true,
            weekly_reports: false,
            sound_notifications: false
        };
        applySettings(defaultSettings);
    }
}

// Функция загрузки аватара через API
async function handleAvatarUpload(file) {
    try {
        const response = await api.uploadAvatar(file);
        
        if (response.success) {
            // Обновляем аватар в интерфейсе
            const avatars = document.querySelectorAll('#profileAvatar, #navProfileAvatar');
            avatars.forEach(avatar => {
                avatar.src = response.avatar_url;
            });
            
            // Обновляем данные пользователя
            currentUser.avatar = response.avatar_url;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showSuccessMessage('Фото профиля успешно обновлено!');
        } else {
            throw new Error(response.message || 'Ошибка загрузки аватара');
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

// Обновляем функцию обработки файла аватара
function handleAvatarFile(file) {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
        showNotification('Ошибка', 'Выберите изображение', 'error');
        return;
    }
    
    // Проверяем размер файла (максимум 5МБ)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Ошибка', 'Размер файла не должен превышать 5МБ', 'error');
        return;
    }
    
    selectedAvatarFile = file;
    selectedPresetAvatar = null;
    
    // Показываем предпросмотр
    const reader = new FileReader();
    reader.onload = (e) => {
        showAvatarPreview(e.target.result, file.name, formatFileSize(file.size));
    };
    reader.readAsDataURL(file);
}

// Обновляем функцию сохранения аватара
async function saveAvatar() {
    if (selectedAvatarFile) {
        await handleAvatarUpload(selectedAvatarFile);
        closeModal('avatarModal');
    } else if (selectedPresetAvatar) {
        // Для пресетных аватаров можно реализовать отдельную логику
        updateUserAvatar(selectedPresetAvatar);
    }
}

// Инициализация API интеграции
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию при загрузке каждой страницы
    if (!window.location.pathname.includes('login.html')) {
        checkAuthOnLoad();
    }
});

// Глобальные функции для совместимости
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.checkActiveWorkSession = checkActiveWorkSession;
window.updateDashboardStats = updateDashboardStats;
window.loadRecentRecords = loadRecentRecords;
window.loadCurrentUser = loadCurrentUser;
window.loadUserSettings = loadUserSettings;