// ===== УПРАВЛЕНИЕ НАСТРОЙКАМИ =====

class SettingsManager {
    constructor() {
        this.currentTab = 'profile';
        this.settings = {};
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.populateForms();
    }

    // ===== ЗАГРУЗКА И СОХРАНЕНИЕ НАСТРОЕК =====
    loadSettings() {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            // Настройки по умолчанию
            this.settings = {
                profile: {
                    firstName: 'Иван',
                    lastName: 'Петров',
                    email: 'ivan.petrov@company.com',
                    phone: '+996 555 123 456',
                    position: 'Frontend Developer',
                    department: 'IT отдел',
                    avatar: 'assets/images/avatars/default.png'
                },
                appearance: {
                    theme: 'light',
                    language: 'ru',
                    timezone: 'Asia/Bishkek',
                    dateFormat: 'DD.MM.YYYY',
                    timeFormat: '24h'
                },
                notifications: {
                    weeklyReports: true,
                    timesheetReminders: true,
                    payrollNotifications: true,
                    workStartReminders: false,
                    breakReminders: true,
                    deadlineReminders: true
                },
                workSchedule: {
                    workStart: '09:00',
                    workEnd: '18:00',
                    lunchStart: '13:00',
                    lunchDuration: 60,
                    workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    autoCheckIn: true,
                    breakReminders: true,
                    endDayReminders: true
                },
                privacy: {
                    showOnlineStatus: true,
                    shareStatistics: true
                }
            };
            this.saveSettings();
        }
    }

    saveSettings() {
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Применяем тему
        this.applyTheme(this.settings.appearance.theme);
        
        // Применяем язык (в реальном приложении)
        document.documentElement.lang = this.settings.appearance.language;
        
        // Обновляем профиль пользователя
        this.updateUserProfile();
        
        // Уведомление об успешном сохранении
        showNotification('Настройки сохранены', 'Изменения применены успешно', 'success');
    }

    // ===== НАВИГАЦИЯ ПО ВКЛАДКАМ =====
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.settings-nav-item');
        const tabContents = document.querySelectorAll('.settings-tab');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Убираем активные классы
        document.querySelectorAll('.settings-nav-item').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Добавляем активные классы
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');

        this.currentTab = tabId;
    }

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    setupEventListeners() {
        // Форма профиля
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileSettings();
        });

        // Форма внешнего вида
        document.getElementById('appearanceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppearanceSettings();
        });

        // Форма уведомлений
        document.getElementById('notificationsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettings();
        });

        // Форма рабочего графика
        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveScheduleSettings();
        });

        // Форма безопасности
        document.getElementById('securityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSecuritySettings();
        });

        // Изменение фото профиля
        document.getElementById('photoInput').addEventListener('change', (e) => {
            this.handlePhotoChange(e);
        });

        // Живое изменение темы
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        });
    }

    // ===== ЗАПОЛНЕНИЕ ФОРМ =====
    populateForms() {
        this.populateProfileForm();
        this.populateAppearanceForm();
        this.populateNotificationForm();
        this.populateScheduleForm();
    }

    populateProfileForm() {
        const profile = this.settings.profile;
        document.getElementById('firstName').value = profile.firstName;
        document.getElementById('lastName').value = profile.lastName;
        document.getElementById('email').value = profile.email;
        document.getElementById('phone').value = profile.phone;
        document.getElementById('position').value = profile.position;
        document.getElementById('department').value = profile.department;
        document.getElementById('profileImage').src = profile.avatar;
    }

    populateAppearanceForm() {
        const appearance = this.settings.appearance;
        document.querySelector(`input[name="theme"][value="${appearance.theme}"]`).checked = true;
        document.getElementById('language').value = appearance.language;
        document.getElementById('timezone').value = appearance.timezone;
        document.getElementById('dateFormat').value = appearance.dateFormat;
        document.getElementById('timeFormat').value = appearance.timeFormat;
    }

    populateNotificationForm() {
        const notifications = this.settings.notifications;
        Object.keys(notifications).forEach(key => {
            const checkbox = document.querySelector(`input[name="${key}"]`);
            if (checkbox) {
                checkbox.checked = notifications[key];
            }
        });
    }

    populateScheduleForm() {
        const schedule = this.settings.workSchedule;
        document.getElementById('workStart').value = schedule.workStart;
        document.getElementById('workEnd').value = schedule.workEnd;
        document.getElementById('lunchStart').value = schedule.lunchStart;
        document.getElementById('lunchDuration').value = schedule.lunchDuration;

        // Рабочие дни
        schedule.workdays.forEach(day => {
            const checkbox = document.querySelector(`input[name="workdays"][value="${day}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        // Автоматизация
        document.querySelector('input[name="autoCheckIn"]').checked = schedule.autoCheckIn;
        document.querySelector('input[name="breakReminders"]').checked = schedule.breakReminders;
        document.querySelector('input[name="endDayReminders"]').checked = schedule.endDayReminders;
    }

    // ===== СОХРАНЕНИЕ НАСТРОЕК =====
    saveProfileSettings() {
        const formData = new FormData(document.getElementById('profileForm'));
        const profileData = Object.fromEntries(formData.entries());
        
        this.settings.profile = { ...this.settings.profile, ...profileData };
        this.saveSettings();
    }

    saveAppearanceSettings() {
        const formData = new FormData(document.getElementById('appearanceForm'));
        const appearanceData = Object.fromEntries(formData.entries());
        
        this.settings.appearance = { ...this.settings.appearance, ...appearanceData };
        this.saveSettings();
    }

    saveNotificationSettings() {
        const form = document.getElementById('notificationsForm');
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            this.settings.notifications[checkbox.name] = checkbox.checked;
        });
        
        this.saveSettings();
    }

    saveScheduleSettings() {
        const formData = new FormData(document.getElementById('scheduleForm'));
        const scheduleData = Object.fromEntries(formData.entries());
        
        // Обработка рабочих дней
        const workdayCheckboxes = document.querySelectorAll('input[name="workdays"]:checked');
        scheduleData.workdays = Array.from(workdayCheckboxes).map(cb => cb.value);
        
        // Обработка чекбоксов автоматизации
        scheduleData.autoCheckIn = document.querySelector('input[name="autoCheckIn"]').checked;
        scheduleData.breakReminders = document.querySelector('input[name="breakReminders"]').checked;
        scheduleData.endDayReminders = document.querySelector('input[name="endDayReminders"]').checked;
        
        this.settings.workSchedule = { ...this.settings.workSchedule, ...scheduleData };
        this.saveSettings();
    }

    saveSecuritySettings() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('Ошибка', 'Пароли не совпадают', 'error');
            return;
        }
        
        if (newPassword && !this.validatePassword(newPassword)) {
            showNotification('Ошибка', 'Пароль не соответствует требованиям', 'error');
            return;
        }
        
        // Обновляем настройки конфиденциальности
        this.settings.privacy.showOnlineStatus = document.querySelector('input[name="showOnlineStatus"]').checked;
        this.settings.privacy.shareStatistics = document.querySelector('input[name="shareStatistics"]').checked;
        
        if (newPassword) {
            // В реальном приложении здесь был бы запрос к серверу
            showNotification('Успешно', 'Пароль изменен', 'success');
            document.getElementById('securityForm').reset();
        }
        
        this.saveSettings();
    }

    // ===== РАБОТА С ФОТО ПРОФИЛЯ =====
    handlePhotoChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            showNotification('Ошибка', 'Выберите файл изображения', 'error');
            return;
        }

        // Проверяем размер файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Ошибка', 'Размер файла не должен превышать 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            document.getElementById('profileImage').src = imageUrl;
            this.settings.profile.avatar = imageUrl;
            this.saveSettings();
        };
        reader.readAsDataURL(file);
    }

    // ===== ПРИМЕНЕНИЕ НАСТРОЕК =====
    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
        } else if (theme === 'auto') {
            // Определяем тему системы
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
                document.body.classList.add('theme-dark');
            }
        }
        // Светлая тема - по умолчанию, дополнительных классов не нужно
    }

    updateUserProfile() {
        const profile = this.settings.profile;
        
        // Обновляем имя в навигации
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = `${profile.firstName} ${profile.lastName}`;
        }
        
        // Обновляем аватар в навигации
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            profileAvatar.src = profile.avatar;
        }
        
        // Обновляем приветствие на главной странице
        const pageHeader = document.querySelector('.page-header h1');
        if (pageHeader && pageHeader.textContent.includes('Добро пожаловать')) {
            pageHeader.textContent = `Добро пожаловать, ${profile.firstName}!`;
        }
    }

    // ===== ВАЛИДАЦИЯ =====
    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        return Object.values(requirements).every(req => req);
    }

    // ===== ЭКСПОРТ ДАННЫХ =====
    exportTimesheet() {
        const period = document.getElementById('timesheetPeriod').value;
        
        // В реальном приложении здесь был бы запрос к серверу
        const data = this.generateTimesheetData(period);
        this.downloadFile(data, `timesheet_${period}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        showNotification('Успешно', 'Табель экспортирован', 'success');
    }

    exportPayroll() {
        const period = document.getElementById('payrollPeriod').value;
        
        // В реальном приложении здесь был бы запрос к серверу
        const data = this.generatePayrollData(period);
        this.downloadFile(data, `payroll_${period}.pdf`, 'application/pdf');
        
        showNotification('Успешно', 'Отчет по зарплате экспортирован', 'success');
    }

    exportAllData() {
        const data = {
            profile: this.settings.profile,
            timeRecords: JSON.parse(localStorage.getItem('timeRecords') || '[]'),
            events: JSON.parse(localStorage.getItem('calendarEvents') || '[]'),
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
        
        const jsonData = JSON.stringify(data, null, 2);
        this.downloadFile(jsonData, 'timetracker_data.json', 'application/json');
        
        showNotification('Успешно', 'Все данные экспортированы', 'success');
    }

    generateTimesheetData(period) {
        // Заглушка для генерации данных табеля
        return "Данные табеля в формате Excel";
    }

    generatePayrollData(period) {
        // Заглушка для генерации данных зарплаты
        return "Данные зарплаты в формате PDF";
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ===== СБРОС НАСТРОЕК =====
    resetForm() {
        this.populateForms();
        showNotification('Информация', 'Форма восстановлена', 'info');
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
function changePhoto() {
    document.getElementById('photoInput').click();
}

function removePhoto() {
    if (confirm('Удалить фото профиля?')) {
        document.getElementById('profileImage').src = 'assets/images/avatars/default.png';
        settings.settings.profile.avatar = 'assets/images/avatars/default.png';
        settings.saveSettings();
    }
}

function resetForm() {
    settings.resetForm();
}

function exportTimesheet() {
    settings.exportTimesheet();
}

function exportPayroll() {
    settings.exportPayroll();
}

function exportAllData() {
    settings.exportAllData();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
let settings;

document.addEventListener('DOMContentLoaded', function() {
    settings = new SettingsManager();
    
    // Отслеживаем изменения системной темы для авто-режима
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (settings.settings.appearance.theme === 'auto') {
                settings.applyTheme('auto');
            }
        });
    }
});

// ===== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.settings = settings;
window.changePhoto = changePhoto;
window.removePhoto = removePhoto;
window.resetForm = resetForm;
window.exportTimesheet = exportTimesheet;
window.exportPayroll = exportPayroll;
window.exportAllData = exportAllData;