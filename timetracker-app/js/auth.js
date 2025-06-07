// ===== ЛОГИКА АВТОРИЗАЦИИ =====

// Демо-пользователи
const DEMO_USERS = {
    employees: {
        'ivan.petrov@company.com': {
            id: 1,
            name: 'Иван Петров',
            email: 'ivan.petrov@company.com',
            password: '123456',
            role: 'employee',
            avatar: 'assets/images/avatars/ivan.png',
            position: 'Frontend Developer',
            department: 'IT отдел',
            salary: 80000,
            hourlyRate: 500
        },
        'maria.sidorova@company.com': {
            id: 2,
            name: 'Мария Сидорова',
            email: 'maria.sidorova@company.com',
            password: '123456',
            role: 'employee',
            avatar: 'assets/images/avatars/maria.png',
            position: 'UX/UI Designer',
            department: 'Дизайн',
            salary: 75000,
            hourlyRate: 468
        },
        'beksultan@gmail.com': {
            id: 3,
            name: 'Бексултан Кылычбеков',
            email: 'beksultan@gmail.com',
            password: '123456',
            role: 'employee',
            avatar: 'assets/images/avatars/beksultan.png',
            position: 'Developer',
            department: 'IT',
            salary: 150000,
            hourlyRate: 500
        }
    },
    admins: {
        'admin@company.com': {
            id: 100,
            name: 'Администратор',
            email: 'admin@company.com',
            password: 'admin123',
            code: 'ADMIN2025',
            role: 'admin',
            avatar: 'assets/images/avatars/admin.png',
            permissions: ['all']
        }
    }
};

// Глобальные переменные
let currentRole = 'employee';
let currentMode = 'login'; // login или register
let isLoading = false;

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initializeAuthPage() {
    console.log('Инициализация страницы авторизации');
    
    // Проверяем, есть ли уже авторизованный пользователь
    checkExistingAuth();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Инициализируем переключатели
    initializeSwitchers();
    
    // Запускаем анимации
    startBackgroundAnimations();
    
    // Устанавливаем начальное состояние
    switchAuthMode('login');
    switchRole('employee');
}

function checkExistingAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('Найден авторизованный пользователь:', user.name);
        
        // Показываем сообщение и перенаправляем
        showNotification('Добро пожаловать!', `Вы уже авторизованы как ${user.name}`, 'info');
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin-panel.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 2000);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupEventListeners() {
    // Переключатель режимов (Вход/Регистрация)
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => switchAuthMode(btn.dataset.mode));
    });
    
    // Переключатель ролей
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => switchRole(btn.dataset.role));
    });
    
    // Формы входа
    const employeeLoginForm = document.getElementById('employeeLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    
    if (employeeLoginForm) {
        employeeLoginForm.addEventListener('submit', handleEmployeeLogin);
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Формы регистрации
    const employeeRegisterForm = document.getElementById('employeeRegisterForm');
    const adminRegisterForm = document.getElementById('adminRegisterForm');
    
    if (employeeRegisterForm) {
        employeeRegisterForm.addEventListener('submit', handleEmployeeRegister);
    }
    
    if (adminRegisterForm) {
        adminRegisterForm.addEventListener('submit', handleAdminRegister);
    }
    
    // Валидация в реальном времени
    setupRealTimeValidation();
    
    // Проверка силы пароля
    setupPasswordStrength();
    
    // Клавиша Enter для быстрого входа
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            quickLogin('employee', 'ivan');
        }
    });
}

function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
}

function setupPasswordStrength() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        if (input.id.includes('register')) {
            input.addEventListener('input', () => checkPasswordStrength(input));
        }
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ И РОЛЕЙ =====
function initializeSwitchers() {
    // Устанавливаем начальные состояния
    const loginBtn = document.querySelector('[data-mode="login"]');
    const employeeBtn = document.querySelector('[data-role="employee"]');
    
    if (loginBtn) loginBtn.classList.add('active');
    if (employeeBtn) employeeBtn.classList.add('active');
}

function switchAuthMode(mode) {
    currentMode = mode;
    
    // Обновляем кнопки переключателя режимов
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Показываем нужные формы
    const loginForms = document.getElementById('loginForms');
    const registerForms = document.getElementById('registerForms');
    
    if (mode === 'login') {
        loginForms?.classList.remove('hidden');
        registerForms?.classList.add('hidden');
        updateAuthInfo('Войдите в систему используя ваши учетные данные');
    } else {
        loginForms?.classList.add('hidden');
        registerForms?.classList.remove('hidden');
        updateAuthInfo('Создайте новый аккаунт для работы с системой');
    }
    
    // Анимация переключения
    animateFormSwitch();
}

function switchRole(role) {
    currentRole = role;
    
    // Обновляем кнопки переключателя ролей
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });
    
    // Показываем нужные формы в зависимости от режима и роли
    if (currentMode === 'login') {
        const employeeForm = document.getElementById('employeeLoginForm');
        const adminForm = document.getElementById('adminLoginForm');
        
        if (role === 'employee') {
            employeeForm?.classList.remove('hidden');
            adminForm?.classList.add('hidden');
        } else {
            employeeForm?.classList.add('hidden');
            adminForm?.classList.remove('hidden');
        }
    } else {
        const employeeForm = document.getElementById('employeeRegisterForm');
        const adminForm = document.getElementById('adminRegisterForm');
        
        if (role === 'employee') {
            employeeForm?.classList.remove('hidden');
            adminForm?.classList.add('hidden');
        } else {
            employeeForm?.classList.add('hidden');
            adminForm?.classList.remove('hidden');
        }
    }
    
    // Анимация переключения
    animateFormSwitch();
}

function animateFormSwitch() {
    const activeForms = document.querySelectorAll('.auth-form:not(.hidden)');
    
    activeForms.forEach(form => {
        form.style.opacity = '0';
        form.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            form.style.transition = 'all 0.3s ease-out';
            form.style.opacity = '1';
            form.style.transform = 'translateY(0)';
        }, 100);
    });
}

function updateAuthInfo(text) {
    const authModeInfo = document.getElementById('authModeInfo');
    if (authModeInfo) {
        authModeInfo.textContent = text;
    }
}

// ===== АВТОРИЗАЦИЯ СОТРУДНИКОВ =====
function handleEmployeeLogin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const email = document.getElementById('login-employee-email').value.trim();
    const password = document.getElementById('login-employee-password').value;
    const remember = document.getElementById('remember-employee-login').checked;
    
    // Валидация
    if (!validateEmployeeLoginForm(email, password)) {
        return;
    }
    
    // Проверяем пользователя
    const user = DEMO_USERS.employees[email];
    
    if (!user || user.password !== password) {
        showFieldError('login-employee-password', 'Неверный email или пароль');
        showNotification('Ошибка входа', 'Проверьте правильность введенных данных', 'error');
        return;
    }
    
    // Успешный вход
    loginUser(user, remember);
}

function validateEmployeeLoginForm(email, password) {
    let isValid = true;
    
    // Проверка email
    if (!email) {
        showFieldError('login-employee-email', 'Введите email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('login-employee-email', 'Введите корректный email');
        isValid = false;
    } else {
        showFieldSuccess('login-employee-email');
    }
    
    // Проверка пароля
    if (!password) {
        showFieldError('login-employee-password', 'Введите пароль');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('login-employee-password', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    } else {
        showFieldSuccess('login-employee-password');
    }
    
    return isValid;
}

// ===== АВТОРИЗАЦИЯ АДМИНИСТРАТОРОВ =====
function handleAdminLogin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const email = document.getElementById('login-admin-email').value.trim();
    const password = document.getElementById('login-admin-password').value;
    const code = document.getElementById('login-admin-code').value.trim();
    const remember = document.getElementById('remember-admin-login').checked;
    
    // Валидация
    if (!validateAdminLoginForm(email, password, code)) {
        return;
    }
    
    // Проверяем администратора
    const admin = DEMO_USERS.admins[email];
    
    if (!admin || admin.password !== password || admin.code !== code) {
        showFieldError('login-admin-code', 'Неверные данные для входа');
        showNotification('Доступ запрещен', 'Проверьте правильность всех данных', 'error');
        return;
    }
    
    // Успешный вход
    loginUser(admin, remember, 'admin-panel.html');
}

function validateAdminLoginForm(email, password, code) {
    let isValid = true;
    
    // Проверка email
    if (!email) {
        showFieldError('login-admin-email', 'Введите email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('login-admin-email', 'Введите корректный email');
        isValid = false;
    } else {
        showFieldSuccess('login-admin-email');
    }
    
    // Проверка пароля
    if (!password) {
        showFieldError('login-admin-password', 'Введите пароль');
        isValid = false;
    } else {
        showFieldSuccess('login-admin-password');
    }
    
    // Проверка кода доступа
    if (!code) {
        showFieldError('login-admin-code', 'Введите код доступа');
        isValid = false;
    } else {
        showFieldSuccess('login-admin-code');
    }
    
    return isValid;
}

// ===== РЕГИСТРАЦИЯ СОТРУДНИКОВ =====
function handleEmployeeRegister(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const formData = {
        firstName: document.getElementById('register-employee-firstname').value.trim(),
        lastName: document.getElementById('register-employee-lastname').value.trim(),
        email: document.getElementById('register-employee-email').value.trim(),
        phone: document.getElementById('register-employee-phone').value.trim(),
        department: document.getElementById('register-employee-department').value,
        position: document.getElementById('register-employee-position').value.trim(),
        password: document.getElementById('register-employee-password').value,
        confirmPassword: document.getElementById('register-employee-confirm-password').value,
        agreeTerms: document.getElementById('agree-terms-employee').checked
    };
    
    // Валидация
    if (!validateEmployeeRegisterForm(formData)) {
        return;
    }
    
    // Проверяем, не существует ли уже такой email
    if (DEMO_USERS.employees[formData.email]) {
        showFieldError('register-employee-email', 'Пользователь с таким email уже существует');
        showNotification('Ошибка регистрации', 'Пользователь с таким email уже зарегистрирован', 'error');
        return;
    }
    
    // Создаем нового пользователя
    const newUser = {
        id: Date.now(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: 'employee',
        avatar: 'assets/images/avatars/default.png',
        position: formData.position,
        department: formData.department,
        phone: formData.phone,
        salary: 0,
        hourlyRate: 0,
        createdAt: new Date().toISOString()
    };
    
    // Сохраняем в демо-данных
    DEMO_USERS.employees[formData.email] = newUser;
    
    // Показываем успешное сообщение
    showRegistrationSuccess('employee', newUser.name);
}

function validateEmployeeRegisterForm(data) {
    let isValid = true;
    
    // Проверка имени
    if (!data.firstName) {
        showFieldError('register-employee-firstname', 'Введите имя');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-firstname');
    }
    
    // Проверка фамилии
    if (!data.lastName) {
        showFieldError('register-employee-lastname', 'Введите фамилию');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-lastname');
    }
    
    // Проверка email
    if (!data.email) {
        showFieldError('register-employee-email', 'Введите email');
        isValid = false;
    } else if (!isValidEmail(data.email)) {
        showFieldError('register-employee-email', 'Введите корректный email');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-email');
    }
    
    // Проверка телефона
    if (!data.phone) {
        showFieldError('register-employee-phone', 'Введите номер телефона');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-phone');
    }
    
    // Проверка отдела
    if (!data.department) {
        showFieldError('register-employee-department', 'Выберите отдел');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-department');
    }
    
    // Проверка должности
    if (!data.position) {
        showFieldError('register-employee-position', 'Введите должность');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-position');
    }
    
    // Проверка пароля
    if (!data.password) {
        showFieldError('register-employee-password', 'Введите пароль');
        isValid = false;
    } else if (data.password.length < 6) {
        showFieldError('register-employee-password', 'Пароль должен содержать минимум 6 символов');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-password');
    }
    
    // Проверка подтверждения пароля
    if (!data.confirmPassword) {
        showFieldError('register-employee-confirm-password', 'Подтвердите пароль');
        isValid = false;
    } else if (data.password !== data.confirmPassword) {
        showFieldError('register-employee-confirm-password', 'Пароли не совпадают');
        isValid = false;
    } else {
        showFieldSuccess('register-employee-confirm-password');
    }
    
    // Проверка согласия с условиями
    if (!data.agreeTerms) {
        showNotification('Ошибка регистрации', 'Необходимо согласиться с условиями использования', 'error');
        isValid = false;
    }
    
    return isValid;
}

// ===== РЕГИСТРАЦИЯ АДМИНИСТРАТОРОВ =====
function handleAdminRegister(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const formData = {
        firstName: document.getElementById('register-admin-firstname').value.trim(),
        lastName: document.getElementById('register-admin-lastname').value.trim(),
        email: document.getElementById('register-admin-email').value.trim(),
        phone: document.getElementById('register-admin-phone').value.trim(),
        company: document.getElementById('register-admin-company').value.trim(),
        accessCode: document.getElementById('register-admin-access-code').value.trim(),
        password: document.getElementById('register-admin-password').value,
        confirmPassword: document.getElementById('register-admin-confirm-password').value,
        agreeTerms: document.getElementById('agree-terms-admin').checked
    };
    
    // Валидация
    if (!validateAdminRegisterForm(formData)) {
        return;
    }
    
    // Проверяем код доступа (для демо используем простую проверку)
    if (formData.accessCode !== 'ADMIN2025') {
        showFieldError('register-admin-access-code', 'Неверный код доступа');
        showNotification('Ошибка регистрации', 'Неверный код доступа администратора', 'error');
        return;
    }
    
    // Проверяем, не существует ли уже такой email
    if (DEMO_USERS.admins[formData.email]) {
        showFieldError('register-admin-email', 'Администратор с таким email уже существует');
        showNotification('Ошибка регистрации', 'Администратор с таким email уже зарегистрирован', 'error');
        return;
    }
    
    // Создаем нового администратора
    const newAdmin = {
        id: Date.now(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        code: formData.accessCode,
        role: 'admin',
        avatar: 'assets/images/avatars/admin.png',
        company: formData.company,
        phone: formData.phone,
        permissions: ['all'],
        createdAt: new Date().toISOString()
    };
    
    // Сохраняем в демо-данных
    DEMO_USERS.admins[formData.email] = newAdmin;
    
    // Показываем успешное сообщение
    showRegistrationSuccess('admin', newAdmin.name);
}

function validateAdminRegisterForm(data) {
    let isValid = true;
    
    // Аналогичная валидация для администратора
    // (код аналогичен validateEmployeeRegisterForm, но с другими полями)
    
    return isValid;
}

// ===== БЫСТРЫЙ ВХОД =====
function quickLogin(role, userType) {
    let user;
    let redirectUrl = 'index.html';
    
    if (role === 'employee') {
        if (userType === 'ivan') {
            user = DEMO_USERS.employees['ivan.petrov@company.com'];
        } else if (userType === 'maria') {
            user = DEMO_USERS.employees['maria.sidorova@company.com'];
        }
    } else if (role === 'admin') {
        user = DEMO_USERS.admins['admin@company.com'];
        redirectUrl = 'admin-panel.html';
    }
    
    if (user) {
        loginUser(user, false, redirectUrl);
    }
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ВХОДА =====
function loginUser(user, remember = false, redirectUrl = null) {
    isLoading = true;
    
    // Показываем прелоадер
    showLoadingOverlay('Вход в систему...', 'Проверяем данные и загружаем интерфейс');
    
    // Имитируем задержку для реализма
    setTimeout(() => {
        // Сохраняем пользователя
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (remember) {
            localStorage.setItem('rememberUser', 'true');
        }
        
        // Сохраняем время входа
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // Показываем успешное уведомление
        showNotification(
            'Вход выполнен успешно!', 
            `Добро пожаловать, ${user.name}`, 
            'success'
        );
        
        // Перенаправляем на нужную страницу
        setTimeout(() => {
            const targetUrl = redirectUrl || (user.role === 'admin' ? 'admin-panel.html' : 'index.html');
            window.location.href = targetUrl;
        }, 1500);
        
    }, 2000);
}

// ===== ПРОВЕРКА СИЛЫ ПАРОЛЯ =====
function checkPasswordStrength(input) {
    const password = input.value;
    const strengthIndicator = input.closest('.form-group').querySelector('.password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    
    // Длина
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Различные типы символов
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Устанавливаем класс
    strengthIndicator.className = 'password-strength';
    if (strength <= 2) {
        strengthIndicator.classList.add('weak');
    } else if (strength <= 4) {
        strengthIndicator.classList.add('medium');
    } else {
        strengthIndicator.classList.add('strong');
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showRegistrationSuccess(role, name) {
    const modal = document.getElementById('registrationSuccessModal');
    const message = document.getElementById('registrationSuccessMessage');
    
    if (modal && message) {
        message.textContent = `Аккаунт ${role === 'admin' ? 'администратора' : 'сотрудника'} "${name}" успешно создан. Теперь вы можете войти в систему.`;
        modal.classList.add('show');
    }
}

function closeRegistrationModal() {
    const modal = document.getElementById('registrationSuccessModal');
    if (modal) {
        modal.classList.remove('show');
        // Переключаемся на режим входа
        switchAuthMode('login');
    }
}

// ===== ВАЛИДАЦИЯ =====
function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldId = field.id;
    
    clearFieldError(field);
    
    if (!value && field.required) {
        showFieldError(fieldId, 'Это поле обязательно для заполнения');
        return false;
    }
    
    if (fieldType === 'email' && value && !isValidEmail(value)) {
        showFieldError(fieldId, 'Введите корректный email адрес');
        return false;
    }
    
    if (fieldId.includes('password') && value && value.length < 6) {
        showFieldError(fieldId, 'Пароль должен содержать минимум 6 символов');
        return false;
    }
    
    if (value) {
        showFieldSuccess(fieldId);
    }
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Добавляем класс ошибки
    field.classList.add('error');
    field.classList.remove('success');
    
    // Удаляем старые сообщения
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Добавляем новое сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    
    // Вставляем после поля или после password-input контейнера
    const container = field.closest('.password-input') || field;
    container.parentNode.insertBefore(errorDiv, container.nextSibling);
}

function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.add('success');
    field.classList.remove('error');
    
    // Удаляем сообщения об ошибках
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
}

function clearFieldError(field) {
    field.classList.remove('error', 'success');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
}

// ===== УТИЛИТЫ =====
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

function showLoadingOverlay(title = 'Загрузка...', text = 'Пожалуйста, подождите') {
    const overlay = document.getElementById('loadingOverlay');
    const titleElement = document.getElementById('loadingTitle');
    const textElement = document.getElementById('loadingText');
    
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    if (textElement) {
        textElement.textContent = text;
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
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
        <button class="alert-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
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
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-3);
        padding: var(--spacing-4);
        border-radius: var(--radius-lg);
        background: var(--white);
        border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'primary'}-color);
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

function closeNotification(element) {
    const notification = element.closest ? element.closest('.notification-toast') : element;
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
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

function startBackgroundAnimations() {
    // Добавляем дополнительные анимации для фона
    const shapes = document.querySelectorAll('.bg-shape');
    
    shapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 2}s`;
        shape.style.animationDuration = `${20 + index * 5}s`;
    });
    
    // Добавляем параллакс эффект при скролле
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        shapes.forEach((shape, index) => {
            const speed = 0.5 + index * 0.2;
            shape.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
function formatPhoneNumber(input) {
    // Форматирование номера телефона в процессе ввода
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('7')) {
        value = value.substring(1);
    }
    
    if (value.length > 0) {
        if (value.length <= 3) {
            value = `+7 (${value}`;
        } else if (value.length <= 6) {
            value = `+7 (${value.substring(0, 3)}) ${value.substring(3)}`;
        } else if (value.length <= 8) {
            value = `+7 (${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
        } else {
            value = `+7 (${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 8)}-${value.substring(8, 10)}`;
        }
    }
    
    input.value = value;
}

function initializePhoneFormatting() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', () => formatPhoneNumber(input));
        input.addEventListener('keydown', (e) => {
            // Разрешаем только цифры, backspace, delete, tab, escape, enter
            if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }
            // Разрешаем только цифры
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    });
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.quickLogin = quickLogin;
window.togglePassword = togglePassword;
window.closeRegistrationModal = closeRegistrationModal;
window.closeNotification = closeNotification;

// ===== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ =====
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
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
    
    .notification-toast .alert-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-toast .alert-content {
        flex: 1;
    }
    
    .notification-toast .alert-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
        color: var(--text-primary);
    }
    
    .notification-toast .alert-message {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    .notification-toast .alert-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-muted);
        transition: color 0.2s ease;
        flex-shrink: 0;
    }
    
    .notification-toast .alert-close:hover {
        color: var(--text-primary);
    }
    
    .alert-success {
        border-left-color: var(--success-color);
    }
    
    .alert-error {
        border-left-color: var(--error-color);
    }
    
    .alert-warning {
        border-left-color: var(--warning-color);
    }
    
    .alert-info {
        border-left-color: var(--primary-color);
    }
    
    .alert-success .alert-icon { color: var(--success-color); }
    .alert-error .alert-icon { color: var(--error-color); }
    .alert-warning .alert-icon { color: var(--warning-color); }
    .alert-info .alert-icon { color: var(--primary-color); }
`;
document.head.appendChild(notificationStyles);

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
    initializePhoneFormatting();
    
    // Добавляем обработчики для закрытия модальных окон
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
    
    // Добавляем обработчик для клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
            }
        }
    });
});