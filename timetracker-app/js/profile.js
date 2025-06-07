// ===== PROFILE PAGE FUNCTIONALITY =====

// Глобальные переменные
let currentUser = null;
let profileData = {};
let selectedAvatarFile = null;
let selectedPresetAvatar = null;
let pendingAction = null;

// Инициализация страницы профиля
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('profile.html')) {
        initializeProfile();
    }
});

function initializeProfile() {
    console.log('Инициализация страницы профиля');
    
    // Загружаем данные пользователя
    loadCurrentUser();
    
    // Инициализируем обработчики событий
    setupProfileEventHandlers();
    
    // Загружаем данные профиля
    loadProfileData();
    
    // Настраиваем drag & drop для аватара
    setupAvatarUpload();
    
    // Настраиваем валидацию пароля
    setupPasswordValidation();
    
    // Загружаем настройки
    loadUserSettings();
}

// ===== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateProfileDisplay();
    } else {
        // Для демо используем тестового пользователя
        currentUser = {
            id: 1,
            name: 'Иван Петров',
            firstName: 'Иван',
            lastName: 'Петров',
            middleName: 'Сергеевич',
            email: 'ivan.petrov@company.com',
            personalEmail: 'ivan.petrov@gmail.com',
            phone: '+7 (999) 123-45-67',
            role: 'employee',
            avatar: 'assets/images/avatars/default.png',
            position: 'Frontend Developer',
            department: 'IT отдел',
            salary: 80000,
            employeeId: '001',
            startDate: '2023-01-15',
            manager: 'Смирнов Алексей Иванович',
            birthDate: '1990-05-15',
            address: 'г. Москва, ул. Примерная, д. 123, кв. 45',
            skills: 'JavaScript, React, Vue.js, HTML5, CSS3, Node.js, Git, Agile/Scrum',
            bio: 'Опытный frontend-разработчик с фокусом на современные веб-технологии и пользовательский опыт.'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateProfileDisplay();
    }
}

function updateProfileDisplay() {
    if (!currentUser) return;
    
    // Обновляем навигацию
    const navProfileAvatar = document.getElementById('navProfileAvatar');
    const navProfileName = document.getElementById('navProfileName');
    
    if (navProfileAvatar) navProfileAvatar.src = currentUser.avatar;
    if (navProfileName) navProfileName.textContent = currentUser.name;
    
    // Обновляем основную информацию профиля
    updateElement('profileName', currentUser.name);
    updateElement('profilePosition', currentUser.position);
    
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.src = currentUser.avatar;
    
    // Заполняем формы
    fillPersonalForm();
    fillWorkForm();
}

function fillPersonalForm() {
    updateElement('firstName', currentUser.firstName, 'value');
    updateElement('lastName', currentUser.lastName, 'value');
    updateElement('middleName', currentUser.middleName || '', 'value');
    updateElement('birthDate', currentUser.birthDate || '', 'value');
    updateElement('phone', currentUser.phone || '', 'value');
    updateElement('personalEmail', currentUser.personalEmail || '', 'value');
    updateElement('address', currentUser.address || '', 'value');
}

function fillWorkForm() {
    updateElement('workEmail', currentUser.email, 'value');
    updateElement('employeeId', currentUser.employeeId, 'value');
    updateElement('department', currentUser.department, 'value');
    updateElement('position', currentUser.position, 'value');
    updateElement('startDate', currentUser.startDate, 'value');
    updateElement('manager', currentUser.manager, 'value');
    updateElement('skills', currentUser.skills || '', 'value');
    updateElement('bio', currentUser.bio || '', 'value');
}

// ===== УПРАВЛЕНИЕ ТАБАМИ =====
function switchProfileTab(tabName) {
    // Убираем активный класс со всех кнопок и контента
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранной кнопке и контенту
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupProfileEventHandlers() {
    // Формы
    setupFormHandlers();
    
    // Кнопки действий
    setupActionHandlers();
    
    // Модальные окна
    setupModalHandlers();
}

function setupFormHandlers() {
    // Форма личных данных
    const personalForm = document.getElementById('personalInfoForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalFormSubmit);
    }
    
    // Форма рабочей информации
    const workForm = document.getElementById('workInfoForm');
    if (workForm) {
        workForm.addEventListener('submit', handleWorkFormSubmit);
    }
    
    // Форма настроек
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsFormSubmit);
    }
    
    // Форма безопасности
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', handleSecurityFormSubmit);
    }
}

function setupActionHandlers() {
    // Быстрые действия в боковой панели уже имеют onclick обработчики в HTML
}

function setupModalHandlers() {
    // Обработчики модальных окон уже настроены в основном app.js
}

// ===== ОБРАБОТКА ФОРМ =====
function handlePersonalFormSubmit(e) {
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
    
    // Обновляем данные пользователя
    Object.assign(currentUser, formData);
    currentUser.name = `${formData.firstName} ${formData.lastName}`;
    
    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Обновляем отображение
    updateProfileDisplay();
    
    // Показываем успешное сообщение
    showSuccessMessage('Личные данные успешно обновлены!');
}

function handleWorkFormSubmit(e) {
    e.preventDefault();
    
    // Собираем данные формы (только редактируемые поля)
    const formData = {
        skills: document.getElementById('skills').value,
        bio: document.getElementById('bio').value
    };
    
    // Обновляем данные пользователя
    Object.assign(currentUser, formData);
    
    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Показываем успешное сообщение
    showSuccessMessage('Рабочая информация успешно обновлена!');
}

function handleSettingsFormSubmit(e) {
    e.preventDefault();
    
    // Собираем настройки
    const settings = {
        darkTheme: document.getElementById('darkTheme').checked,
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        compactView: document.getElementById('compactView').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        timesheetReminders: document.getElementById('timesheetReminders').checked,
        weeklyReports: document.getElementById('weeklyReports').checked,
        soundNotifications: document.getElementById('soundNotifications').checked
    };
    
    // Сохраняем настройки
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Применяем некоторые настройки
    applySettings(settings);
    
    // Показываем успешное сообщение
    showSuccessMessage('Настройки успешно сохранены!');
}

function handleSecurityFormSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
        return;
    }
    
    // В реальном приложении здесь был бы запрос к серверу
    // Для демо просто показываем успешное сообщение
    showSuccessMessage('Пароль успешно изменен!');
    
    // Очищаем форму
    document.getElementById('securityForm').reset();
    document.getElementById('passwordStrength').className = 'password-strength';
}

// ===== ВАЛИДАЦИЯ =====
function validatePersonalForm() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const personalEmail = document.getElementById('personalEmail').value;
    
    if (!firstName.trim()) {
        showFieldError('firstName', 'Введите имя');
        return false;
    }
    
    if (!lastName.trim()) {
        showFieldError('lastName', 'Введите фамилию');
        return false;
    }
    
    if (personalEmail && !isValidEmail(personalEmail)) {
        showFieldError('personalEmail', 'Введите корректный email');
        return false;
    }
    
    return true;
}

function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
        showFieldError('currentPassword', 'Введите текущий пароль');
        return false;
    }
    
    if (!newPassword) {
        showFieldError('newPassword', 'Введите новый пароль');
        return false;
    }
    
    if (newPassword.length < 6) {
        showFieldError('newPassword', 'Пароль должен содержать минимум 6 символов');
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        showFieldError('confirmPassword', 'Пароли не совпадают');
        return false;
    }
    
    return true;
}

// ===== УПРАВЛЕНИЕ АВАТАРОМ =====
function changeAvatar() {
    selectedAvatarFile = null;
    selectedPresetAvatar = null;
    resetAvatarPreview();
    showModal('avatarModal');
}

// Альтернативная функция для прямого выбора файла
function quickChangeAvatar() {
    const avatarFile = document.getElementById('avatarFile');
    if (avatarFile) {
        avatarFile.click();
    }
}

function setupAvatarUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const avatarFile = document.getElementById('avatarFile');
    
    if (!uploadArea || !avatarFile) return;
    
    // Click обработчик для области загрузки
    uploadArea.addEventListener('click', () => {
        avatarFile.click();
    });
    
    // Drag & Drop обработчики
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAvatarFile(files[0]);
        }
    });
    
    // File input обработчик
    avatarFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleAvatarFile(e.target.files[0]);
            
            // Если файл выбран не через модальное окно, сразу показываем его
            const modal = document.getElementById('avatarModal');
            if (!modal.classList.contains('show')) {
                showModal('avatarModal');
            }
        }
    });
    
    // Также настраиваем прямой выбор при клике на иконку камеры
    const avatarChangeBtn = document.querySelector('.avatar-change-btn');
    if (avatarChangeBtn) {
        // Создаем скрытый input для быстрого выбора
        const quickFileInput = document.createElement('input');
        quickFileInput.type = 'file';
        quickFileInput.accept = 'image/*';
        quickFileInput.style.display = 'none';
        document.body.appendChild(quickFileInput);
        
        // Обработчик для быстрого выбора файла
        quickFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleAvatarFile(e.target.files[0]);
                // Сразу показываем модальное окно с предпросмотром
                showModal('avatarModal');
            }
        });
        
        // Переопределяем функцию changeAvatar для использования быстрого выбора
        avatarChangeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Показываем выбор: либо быстрый выбор файла, либо полное модальное окно
            if (e.shiftKey) {
                // Shift + клик = полное модальное окно
                changeAvatar();
            } else {
                // Обычный клик = быстрый выбор файла
                quickFileInput.click();
            }
        };
    }
}

function selectAvatarFile() {
    document.getElementById('avatarFile').click();
}

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
        
        // Если пользователь выбрал файл напрямую (не через модальное окно),
        // автоматически сохраняем его
        const modal = document.getElementById('avatarModal');
        if (modal && modal.classList.contains('show')) {
            // Модальное окно открыто - показываем предпросмотр
            return;
        } else {
            // Модальное окно не открыто - показываем быстрое подтверждение
            showQuickAvatarConfirmation(e.target.result, file);
        }
    };
    reader.readAsDataURL(file);
}

// Функция для быстрого подтверждения смены аватара
function showQuickAvatarConfirmation(imageSrc, file) {
    const confirmationHtml = `
        <div class="quick-avatar-confirmation" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            text-align: center;
            max-width: 400px;
            width: 90%;
        ">
            <div style="margin-bottom: 1rem;">
                <img src="${imageSrc}" alt="Новый аватар" style="
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid var(--primary-color);
                ">
            </div>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Изменить фото профиля?</h3>
            <p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                ${file.name} (${formatFileSize(file.size)})
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="cancelQuickAvatar()" style="
                    padding: 0.5rem 1rem;
                    background: var(--gray-200);
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                ">Отмена</button>
                <button onclick="confirmQuickAvatar()" style="
                    padding: 0.5rem 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                ">Сохранить</button>
            </div>
        </div>
        <div class="quick-avatar-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
        "></div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmationHtml);
}

// Функции для быстрого подтверждения
function confirmQuickAvatar() {
    if (selectedAvatarFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            updateUserAvatar(e.target.result);
            cancelQuickAvatar();
        };
        reader.readAsDataURL(selectedAvatarFile);
    }
}

function cancelQuickAvatar() {
    const confirmation = document.querySelector('.quick-avatar-confirmation');
    const overlay = document.querySelector('.quick-avatar-overlay');
    
    if (confirmation) confirmation.remove();
    if (overlay) overlay.remove();
    
    selectedAvatarFile = null;
    
    // Очищаем input
    const avatarFile = document.getElementById('avatarFile');
    if (avatarFile) avatarFile.value = '';
}

function selectPresetAvatar(avatarPath) {
    selectedPresetAvatar = avatarPath;
    selectedAvatarFile = null;
    
    // Убираем выделение со всех пресетов
    document.querySelectorAll('.preset-avatar').forEach(avatar => {
        avatar.classList.remove('selected');
    });
    
    // Выделяем выбранный
    event.currentTarget.classList.add('selected');
    
    // Показываем предпросмотр
    showAvatarPreview(avatarPath, 'preset-avatar.png', 'Готовый аватар');
}

function showAvatarPreview(src, fileName, fileSize) {
    const uploadArea = document.getElementById('uploadArea');
    const preview = document.getElementById('avatarPreview');
    const previewImage = document.getElementById('previewImage');
    const fileNameElement = document.getElementById('fileName');
    const fileSizeElement = document.getElementById('fileSize');
    const saveBtn = document.getElementById('saveAvatarBtn');
    
    uploadArea.style.display = 'none';
    preview.classList.remove('hidden');
    
    previewImage.src = src;
    if (fileNameElement) fileNameElement.textContent = fileName;
    if (fileSizeElement) fileSizeElement.textContent = fileSize;
    
    saveBtn.disabled = false;
}

function resetAvatarPreview() {
    const uploadArea = document.getElementById('uploadArea');
    const preview = document.getElementById('avatarPreview');
    const saveBtn = document.getElementById('saveAvatarBtn');
    
    uploadArea.style.display = 'block';
    preview.classList.add('hidden');
    saveBtn.disabled = true;
    
    // Сбрасываем выбор пресетов
    document.querySelectorAll('.preset-avatar').forEach(avatar => {
        avatar.classList.remove('selected');
    });
    
    selectedAvatarFile = null;
    selectedPresetAvatar = null;
}

function saveAvatar() {
    let newAvatarSrc = null;
    
    if (selectedAvatarFile) {
        // Для демо сохраняем как data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            newAvatarSrc = e.target.result;
            updateUserAvatar(newAvatarSrc);
        };
        reader.readAsDataURL(selectedAvatarFile);
    } else if (selectedPresetAvatar) {
        newAvatarSrc = selectedPresetAvatar;
        updateUserAvatar(newAvatarSrc);
    }
}

function updateUserAvatar(newAvatarSrc) {
    // Обновляем аватар пользователя
    currentUser.avatar = newAvatarSrc;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Обновляем все аватары на странице
    const avatars = document.querySelectorAll('#profileAvatar, #navProfileAvatar');
    avatars.forEach(avatar => {
        avatar.src = newAvatarSrc;
    });
    
    // Закрываем модальное окно
    closeModal('avatarModal');
    
    // Показываем успешное сообщение
    showSuccessMessage('Фото профиля успешно обновлено!');
}

// ===== УПРАВЛЕНИЕ ПАРОЛЕМ =====
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthIndicator.className = 'password-strength';
        return;
    }
    
    let strength = 0;
    
    // Проверяем длину
    if (password.length >= 8) strength++;
    
    // Проверяем наличие цифр
    if (/\d/.test(password)) strength++;
    
    // Проверяем наличие заглавных букв
    if (/[A-Z]/.test(password)) strength++;
    
    // Проверяем наличие специальных символов
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    // Устанавливаем класс в зависимости от силы пароля
    if (strength <= 1) {
        strengthIndicator.className = 'password-strength weak';
    } else if (strength <= 2) {
        strengthIndicator.className = 'password-strength medium';
    } else {
        strengthIndicator.className = 'password-strength strong';
    }
}

// ===== БЫСТРЫЕ ДЕЙСТВИЯ =====
function downloadReport() {
    showNotification('Информация', 'Функция загрузки отчета в разработке', 'info');
}

function requestLeave() {
    showConfirmModal(
        'Заявка на отпуск',
        'Перейти к форме подачи заявки на отпуск?',
        () => {
            showNotification('Информация', 'Функция подачи заявки в разработке', 'info');
        }
    );
}

function changePassword() {
    switchProfileTab('security');
    document.getElementById('currentPassword').focus();
}

function contactSupport() {
    showNotification('Поддержка', 'Email: support@timetracker.pro\nТелефон: +7 (800) 123-45-67', 'info');
}

function exportProfile() {
    const profileData = {
        personalInfo: currentUser,
        settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `profile_${currentUser.firstName}_${currentUser.lastName}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSuccessMessage('Данные профиля экспортированы!');
}

// ===== УПРАВЛЕНИЕ СЕССИЯМИ =====
function terminateSession(sessionType) {
    showConfirmModal(
        'Завершить сессию',
        `Вы уверены, что хотите завершить сессию на ${sessionType === 'mobile' ? 'мобильном устройстве' : 'планшете'}?`,
        () => {
            // В реальном приложении здесь был бы запрос к серверу
            showSuccessMessage('Сессия успешно завершена!');
            
            // Удаляем элемент из DOM
            event.target.closest('.session-item').remove();
        }
    );
}

// ===== СБРОС ФОРМ =====
function resetPersonalForm() {
    fillPersonalForm();
    clearFormErrors();
}

function resetWorkForm() {
    fillWorkForm();
    clearFormErrors();
}

function resetSettingsForm() {
    loadUserSettings();
    clearFormErrors();
}

function resetSecurityForm() {
    document.getElementById('securityForm').reset();
    document.getElementById('passwordStrength').className = 'password-strength';
    clearFormErrors();
}

// ===== НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ =====
function loadUserSettings() {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    // Устанавливаем значения по умолчанию
    const defaultSettings = {
        darkTheme: false,
        language: 'ru',
        timezone: 'Europe/Moscow',
        compactView: false,
        emailNotifications: true,
        timesheetReminders: true,
        weeklyReports: false,
        soundNotifications: false
    };
    
    const finalSettings = { ...defaultSettings, ...settings };
    
    // Применяем настройки к форме
    updateElement('darkTheme', finalSettings.darkTheme, 'checked');
    updateElement('language', finalSettings.language, 'value');
    updateElement('timezone', finalSettings.timezone, 'value');
    updateElement('compactView', finalSettings.compactView, 'checked');
    updateElement('emailNotifications', finalSettings.emailNotifications, 'checked');
    updateElement('timesheetReminders', finalSettings.timesheetReminders, 'checked');
    updateElement('weeklyReports', finalSettings.weeklyReports, 'checked');
    updateElement('soundNotifications', finalSettings.soundNotifications, 'checked');
    
    // Применяем настройки к интерфейсу
    applySettings(finalSettings);
}

function applySettings(settings) {
    // Применяем темную тему
    if (settings.darkTheme) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    // Применяем компактный вид
    if (settings.compactView) {
        document.body.classList.add('compact-view');
    } else {
        document.body.classList.remove('compact-view');
    }
    
    // Здесь можно добавить другие настройки интерфейса
}

// ===== СТАТИСТИКА ПРОФИЛЯ =====
function loadProfileData() {
    // Загружаем данные статистики из localStorage или генерируем демо-данные
    const profileStats = JSON.parse(localStorage.getItem('profileStats') || '{}');
    
    if (Object.keys(profileStats).length === 0) {
        generateProfileStats();
    } else {
        updateProfileStats(profileStats);
    }
}

function generateProfileStats() {
    const startDate = new Date(currentUser.startDate || '2023-01-15');
    const now = new Date();
    
    // Вычисляем стаж работы
    const workExperience = calculateWorkExperience(startDate, now);
    
    // Генерируем статистику
    const stats = {
        workExperience: workExperience,
        totalHours: 2040,
        efficiency: 92,
        achievements: 8
    };
    
    localStorage.setItem('profileStats', JSON.stringify(stats));
    updateProfileStats(stats);
}

function calculateWorkExperience(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    if (years > 0) {
        return `${years} ${getYearsText(years)} ${months} ${getMonthsText(months)}`;
    } else {
        return `${months} ${getMonthsText(months)}`;
    }
}

function getYearsText(years) {
    if (years === 1) return 'год';
    if (years < 5) return 'года';
    return 'лет';
}

function getMonthsText(months) {
    if (months === 1) return 'месяц';
    if (months < 5) return 'месяца';
    return 'месяцев';
}

function updateProfileStats(stats) {
    updateElement('workExperience', stats.workExperience);
    updateElement('totalHours', `${stats.totalHours}ч`);
    updateElement('efficiency', `${stats.efficiency}%`);
    updateElement('achievements', stats.achievements);
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleElement = document.getElementById('confirmTitle');
    const messageElement = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    
    pendingAction = onConfirm;
    
    showModal('confirmModal');
}

function confirmAction() {
    if (pendingAction) {
        pendingAction();
        pendingAction = null;
    }
    closeModal('confirmModal');
}

function showSuccessMessage(message) {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    
    if (messageElement) messageElement.textContent = message;
    
    showModal('successModal');
    
    // Автоматически закрываем через 3 секунды
    setTimeout(() => {
        closeModal('successModal');
    }, 3000);
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function updateElement(id, value, property = 'textContent') {
    const element = document.getElementById(id);
    if (element) {
        if (property === 'checked') {
            element.checked = value;
        } else if (property === 'value') {
            element.value = value;
        } else {
            element.textContent = value;
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Добавляем класс ошибки
    field.classList.add('error');
    field.classList.remove('success');
    
    // Удаляем старые сообщения об ошибках
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Добавляем новое сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
}

function clearFormErrors() {
    // Убираем классы ошибок
    document.querySelectorAll('.form-input.error, .form-textarea.error, .form-select.error').forEach(field => {
        field.classList.remove('error');
    });
    
    // Удаляем сообщения об ошибках
    document.querySelectorAll('.field-error').forEach(error => {
        error.remove();
    });
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggleBtn = field.parentNode.querySelector('.password-toggle i');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

function showNotification(title, message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
        </div>
    `;
    
    // Стили для позиционирования
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 320px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: var(--shadow-xl);
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.switchProfileTab = switchProfileTab;
window.changeAvatar = changeAvatar;
window.quickChangeAvatar = quickChangeAvatar;
window.selectAvatarFile = selectAvatarFile;
window.selectPresetAvatar = selectPresetAvatar;
window.resetAvatarPreview = resetAvatarPreview;
window.saveAvatar = saveAvatar;
window.confirmQuickAvatar = confirmQuickAvatar;
window.cancelQuickAvatar = cancelQuickAvatar;
window.downloadReport = downloadReport;
window.requestLeave = requestLeave;
window.changePassword = changePassword;
window.contactSupport = contactSupport;
window.exportProfile = exportProfile;
window.terminateSession = terminateSession;
window.resetPersonalForm = resetPersonalForm;
window.resetWorkForm = resetWorkForm;
window.resetSettingsForm = resetSettingsForm;
window.resetSecurityForm = resetSecurityForm;
window.togglePassword = togglePassword;
window.confirmAction = confirmAction;

// ===== CSS АНИМАЦИИ ДЛЯ УВЕДОМЛЕНИЙ =====
const profileNotificationStyles = document.createElement('style');
profileNotificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-toast {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .field-error {
        display: flex;
        align-items: center;
        gap: var(--spacing-1);
        margin-top: var(--spacing-1);
        font-size: var(--font-size-xs);
        color: var(--error-color);
    }
    
    .form-input.error,
    .form-textarea.error,
    .form-select.error {
        border-color: var(--error-color);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    .alert {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-3);
        padding: var(--spacing-4);
        border-radius: var(--radius-lg);
        border: 1px solid;
        background: var(--white);
    }
    
    .alert-success {
        border-color: var(--success-color);
        background: rgba(16, 185, 129, 0.05);
    }
    
    .alert-error {
        border-color: var(--error-color);
        background: rgba(239, 68, 68, 0.05);
    }
    
    .alert-warning {
        border-color: var(--warning-color);
        background: rgba(245, 158, 11, 0.05);
    }
    
    .alert-info {
        border-color: var(--info-color);
        background: rgba(6, 182, 212, 0.05);
    }
    
    .alert-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        font-size: var(--font-size-lg);
    }
    
    .alert-success .alert-icon { color: var(--success-color); }
    .alert-error .alert-icon { color: var(--error-color); }
    .alert-warning .alert-icon { color: var(--warning-color); }
    .alert-info .alert-icon { color: var(--info-color); }
    
    .alert-content {
        flex: 1;
    }
    
    .alert-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--spacing-1);
    }
    
    .alert-message {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        white-space: pre-line;
    }
`;
document.head.appendChild(profileNotificationStyles);

// ===== ЭКСПОРТ ДЛЯ ДРУГИХ МОДУЛЕЙ =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeProfile,
        loadCurrentUser,
        updateProfileDisplay,
        switchProfileTab
    };
}