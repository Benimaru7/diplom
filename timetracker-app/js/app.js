// ===== РАБОТА С ВРЕМЕНЕМ =====
function checkActiveWorkSession() {
    const session = localStorage.getItem('currentWorkSession');
    if (session) {
        const workSession = JSON.parse(session);
        if (workSession.checkIn && !workSession.checkOut) {
            // Есть активная сессия
            checkInTime = new Date(workSession.checkIn);
            showCheckOutCard();
            startWorkTimer();
        }
    }
}
const API_BASE_URL = 'http://localhost:5000/api';

function checkIn() {
    const now = new Date();
    checkInTime = now;
    
    // Сохраняем сессию
    const workSession = {
        date: now.toDateString(),
        checkIn: now.toISOString(),
        checkOut: null
    };
    
    localStorage.setItem('currentWorkSession', JSON.stringify(workSession));
    
    // Обновляем интерфейс
    showCheckOutCard();
    startWorkTimer();
    
    // Показываем уведомление
    showNotification('Приход отмечен', `Время прихода: ${formatTime(now)}`, 'success');
    
    // Сохраняем в историю
    saveTimeRecord('checkIn', now);
}

function checkOut() {
    const now = new Date();
    
    // Получаем текущую сессию
    const session = localStorage.getItem('currentWorkSession');
    if (session) {
        const workSession = JSON.parse(session);
        workSession.checkOut = now.toISOString();
        
        // Вычисляем отработанное время
        const checkInTime = new Date(workSession.checkIn);
        const workDuration = now - checkInTime;
        const hours = Math.floor(workDuration / (1000 * 60 * 60));
        const minutes = Math.floor((workDuration % (1000 * 60 * 60)) / (1000 * 60));
        
        // Обновляем сессию
        workSession.totalTime = workDuration;
        localStorage.setItem('currentWorkSession', JSON.stringify(workSession));
        
        // Обновляем интерфейс
        showCheckInCard();
        stopWorkTimer();
        
        // Показываем уведомление
        showNotification('Уход отмечен', `Отработано: ${hours}ч ${minutes}м`, 'success');
        
        // Сохраняем в историю
        saveTimeRecord('checkOut', now);
        
        // Обновляем статистику
        updateDashboardStats();
    }
}

function startWorkTimer() {
    if (workTimer) clearInterval(workTimer);
    
    workTimer = setInterval(() => {
        if (checkInTime) {
            const now = new Date();
            const duration = now - checkInTime;
            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
            
            const durationElement = document.getElementById('workDuration');
            if (durationElement) {
                durationElement.textContent = `${hours}ч ${minutes}м`;
            }
            
            // Обновляем статистику "Сегодня"
            const todayElement = document.getElementById('todayHours');
            if (todayElement) {
                todayElement.textContent = `${hours}ч ${minutes}м`;
            }
        }
    }, 1000);
}

function stopWorkTimer() {
    if (workTimer) {
        clearInterval(workTimer);
        workTimer = null;
    }
    checkInTime = null;
}

function showCheckInCard() {
    const checkInCard = document.getElementById('checkInCard');
    const checkOutCard = document.getElementById('checkOutCard');
    
    if (checkInCard) checkInCard.classList.remove('hidden');
    if (checkOutCard) checkOutCard.classList.add('hidden');
}

function showCheckOutCard() {
    const checkInCard = document.getElementById('checkInCard');
    const checkOutCard = document.getElementById('checkOutCard');
    
    if (checkInCard) checkInCard.classList.add('hidden');
    if (checkOutCard) checkOutCard.classList.remove('hidden');
}

// ===== РАБОТА С ДАННЫМИ =====
function saveTimeRecord(type, time) {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const today = time.toDateString();
    
    // Находим или создаем запись за сегодня
    let todayRecord = records.find(record => record.date === today);
    if (!todayRecord) {
        todayRecord = {
            id: Date.now(),
            userId: currentUser.id,
            date: today,
            checkIn: null,
            checkOut: null,
            totalTime: 0,
            status: 'pending'
        };
        records.push(todayRecord);
    }
    
    // Обновляем запись
    if (type === 'checkIn') {
        todayRecord.checkIn = time.toISOString();
    } else if (type === 'checkOut') {
        todayRecord.checkOut = time.toISOString();
        
        if (todayRecord.checkIn) {
            const checkInTime = new Date(todayRecord.checkIn);
            todayRecord.totalTime = time - checkInTime;
            todayRecord.status = 'complete';
            
            // Определяем статус (переработка, опоздание и т.д.)
            const hours = todayRecord.totalTime / (1000 * 60 * 60);
            if (hours > 8) {
                todayRecord.status = 'overtime';
            }
        }
    }
    
    localStorage.setItem('timeRecords', JSON.stringify(records));
}

function loadDashboardData() {
    updateCurrentDate();
    updateDashboardStats();
    loadRecentRecords();
}

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('ru-RU', options);
    }
}

function updateDashboardStats() {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const userRecords = records.filter(record => record.userId === currentUser.id);
    
    // Статистика за неделю
    const weekStats = calculateWeekStats(userRecords);
    const weekElement = document.getElementById('weekHours');
    if (weekElement) {
        weekElement.textContent = formatDuration(weekStats.totalTime);
    }
    
    // Статистика за месяц
    const monthStats = calculateMonthStats(userRecords);
    const monthElement = document.getElementById('monthHours');
    if (monthElement) {
        monthElement.textContent = formatDuration(monthStats.totalTime);
    }
    
    // Расчет зарплаты
    const salary = calculateCurrentSalary(monthStats.totalTime);
    const salaryElement = document.getElementById('currentSalary');
    if (salaryElement) {
        salaryElement.textContent = `${salary.toLocaleString('ru-RU')}₽`;
    }
}

function calculateWeekStats(records) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Понедельник
    weekStart.setHours(0, 0, 0, 0);
    
    const weekRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart;
    });
    
    const totalTime = weekRecords.reduce((sum, record) => sum + (record.totalTime || 0), 0);
    
    return { totalTime, records: weekRecords };
}

function calculateMonthStats(records) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart;
    });
    
    const totalTime = monthRecords.reduce((sum, record) => sum + (record.totalTime || 0), 0);
    
    return { totalTime, records: monthRecords };
}

function calculateCurrentSalary(totalTime) {
    const hoursWorked = totalTime / (1000 * 60 * 60);
    const hourlyRate = currentUser.salary / 160; // 160 часов в месяц
    return Math.round(hoursWorked * hourlyRate);
}

function loadRecentRecords() {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const userRecords = records
        .filter(record => record.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const tbody = document.getElementById('recentRecords');
    if (tbody && userRecords.length > 0) {
        tbody.innerHTML = userRecords.map(record => {
            const checkIn = record.checkIn ? formatTime(new Date(record.checkIn)) : '-';
            const checkOut = record.checkOut ? formatTime(new Date(record.checkOut)) : '-';
            const duration = record.totalTime ? formatDuration(record.totalTime) : '-';
            const status = getStatusBadge(record.status);
            
            return `
                <tr>
                    <td>${formatDate(new Date(record.date))}</td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td>${duration}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join('');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
}

function getStatusBadge(status) {
    const statusMap = {
        'complete': '<span class="status status-complete">Завершен</span>',
        'overtime': '<span class="status status-overtime">Переработка</span>',
        'pending': '<span class="status status-pending">В процессе</span>',
        'absent': '<span class="status status-absent">Отсутствие</span>'
    };
    
    return statusMap[status] || '<span class="status status-pending">Неизвестно</span>';
}

// ===== ТАЙМЕРЫ И ЧАСЫ =====
function startClocks() {
    // Обновляем текущее время
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = formatTime(now);
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Обновляем время в модальном окне
        const modalTime = document.getElementById('modalTime');
        if (modalTime) {
            modalTime.textContent = formatTime(new Date());
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId || 'checkInModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function confirmCheckIn() {
    checkIn();
    closeModal('checkInModal');
}

// ===== УВЕДОМЛЕНИЯ =====
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
    
    // Добавляем стили для toast уведомлений
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
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

// ===== CSS АНИМАЦИИ ДЛЯ УВЕДОМЛЕНИЙ =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-toast {
        box-shadow: var(--shadow-xl);
    }
`;
document.head.appendChild(style);

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
// Глобальные обработчики для демонстрации
window.checkIn = checkIn;
window.checkOut = checkOut;
window.logout = logout;
window.showModal = showModal;
window.closeModal = closeModal;
window.confirmCheckIn = confirmCheckIn; 

// Глобальные переменные
let currentUser = null;
let workTimer = null;
let checkInTime = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('TimeTracker Pro загружен');
    
    // Проверяем авторизацию
    checkAuthentication();
    
    // Инициализируем компоненты
    initializeComponents();
    
    // Загружаем данные
    loadDashboardData();
    
    // Запускаем таймеры
    startClocks();
});

// ===== АВТОРИЗАЦИЯ =====
function checkAuthentication() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        updateUserInterface();
    } else {
        // Для демо используем тестового пользователя
        currentUser = {
            id: 1,
            name: 'Иван Петров',
            email: 'ivan.petrov@company.com',
            role: 'employee',
            avatar: 'assets/images/avatars/default.png',
            position: 'Frontend Developer',
            department: 'IT отдел',
            salary: 80000
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserInterface();
    }
}

function updateUserInterface() {
    // Обновляем информацию о пользователе в навигации
    const profileName = document.querySelector('.profile-name');
    const profileAvatar = document.querySelector('.profile-avatar');
    
    if (profileName) profileName.textContent = currentUser.name;
    if (profileAvatar) profileAvatar.src = currentUser.avatar;
    
    // Обновляем приветствие
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        const firstName = currentUser.name.split(' ')[0];
        pageHeader.textContent = `Добро пожаловать, ${firstName}!`;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentWorkSession');
    window.location.href = 'login.html';
}

// ===== ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ =====
function initializeComponents() {
    // Инициализация дропдаунов
    initializeDropdowns();
    
    // Инициализация модальных окон
    initializeModals();
    
    // Инициализация уведомлений
    initializeNotifications();
    
    // Проверяем активную рабочую сессию
    checkActiveWorkSession();
}

function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.profile-dropdown');
    
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.profile-trigger');
        const menu = dropdown.querySelector('.profile-menu');
        
        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
            
            // Закрытие при клике вне дропдауна
            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        }
    });
}

function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal(modal.id);
            });
        }
        
        // Закрытие при клике на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function initializeNotifications() {
    // Здесь можно добавить логику для реальных уведомлений
    // Например, проверка новых сообщений с сервера
    console.log('Система уведомлений инициализирована');
}

//