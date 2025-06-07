// ===== EMPLOYEE DASHBOARD FUNCTIONALITY =====

// Глобальные переменные для дашборда
let employeeTasks = [];
let employeeNotifications = [];
let employeeSchedule = [];

// Инициализация страницы employee-dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('employee-dashboard.html')) {
        initializeEmployeeDashboard();
    }
});

function initializeEmployeeDashboard() {
    console.log('Инициализация панели сотрудника');
    
    // Загружаем данные
    loadEmployeeTasks();
    loadEmployeeNotifications();
    loadEmployeeSchedule();
    
    // Настраиваем обработчики событий
    setupTaskHandlers();
    setupNotificationHandlers();
    
    // Обновляем прогресс-бары статистики
    updateProgressBars();
    
    // Запускаем анимации
    animateStatCards();
}

// ===== УПРАВЛЕНИЕ ЗАДАЧАМИ =====
function loadEmployeeTasks() {
    // Загружаем задачи из localStorage или создаем демо-данные
    const storedTasks = localStorage.getItem('employeeTasks');
    
    if (storedTasks) {
        employeeTasks = JSON.parse(storedTasks);
    } else {
        // Создаем демо-задачи
        employeeTasks = [
            {
                id: 1,
                title: 'Завершить модуль авторизации',
                priority: 'high',
                deadline: new Date().toISOString(),
                description: 'Доработать систему входа пользователей',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Ревью кода коллеги',
                priority: 'medium',
                deadline: new Date(Date.now() + 86400000).toISOString(),
                description: 'Проверить pull request от команды',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Обновить документацию',
                priority: 'low',
                deadline: new Date(Date.now() + 604800000).toISOString(),
                description: 'Актуализировать техническую документацию',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];
        
        saveEmployeeTasks();
    }
    
    updateTasksDisplay();
}

function saveEmployeeTasks() {
    localStorage.setItem('employeeTasks', JSON.stringify(employeeTasks));
}

function updateTasksDisplay() {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;
    
    // Очищаем текущий список
    taskList.innerHTML = '';
    
    // Добавляем каждую задачу
    employeeTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority}`;
    
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < new Date() && !task.completed;
    const timeText = task.completed ? 'Выполнено' : 
                    isOverdue ? 'Просрочено' : 
                    formatDeadline(deadline);
    
    taskDiv.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" id="task${task.id}" ${task.completed ? 'checked' : ''}>
            <label for="task${task.id}"></label>
        </div>
        <div class="task-content ${task.completed ? 'completed' : ''}">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span class="task-time">
                    <i class="fas fa-${task.completed ? 'check' : 'clock'}"></i> 
                    ${timeText}
                </span>
                <span class="task-priority ${task.priority}">
                    ${getPriorityText(task.priority)}
                </span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-btn" onclick="editTask(${task.id})" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
    
    return taskDiv;
}

function formatDeadline(deadline) {
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `До ${deadline.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return 'До завтра';
    } else if (diffDays > 1) {
        return `До ${deadline.toLocaleDateString('ru-RU')}`;
    } else {
        return 'Просрочено';
    }
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Высокий приоритет',
        'medium': 'Средний приоритет',
        'low': 'Низкий приоритет'
    };
    return priorityMap[priority] || 'Неизвестно';
}

function showAddTaskModal() {
    showModal('addTaskModal');
    
    // Сбрасываем форму
    const form = document.getElementById('addTaskForm');
    if (form) {
        form.reset();
    }
}

function saveTask() {
    const form = document.getElementById('addTaskForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const newTask = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value || new Date(Date.now() + 86400000).toISOString(),
        description: document.getElementById('taskDescription').value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Добавляем задачу
    employeeTasks.push(newTask);
    saveEmployeeTasks();
    updateTasksDisplay();
    
    // Настраиваем обработчики для новых элементов
    setupTaskHandlers();

    // Закрываем модальное окно
    closeModal('addTaskModal');

    // Показываем уведомление
    showNotification('Успешно', 'Задача создана', 'success');

    // Сбрасываем форму
    form.reset();
}

function editTask(taskId) {
    const task = employeeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Для демо просто показываем информацию о задаче
    const taskInfo = `
        Задача: ${task.title}
        Приоритет: ${getPriorityText(task.priority)}
        Статус: ${task.completed ? 'Выполнена' : 'В работе'}
        Описание: ${task.description || 'Нет описания'}
    `;
    
    showNotification('Информация о задаче', taskInfo, 'info');
    
    // Здесь можно добавить полноценное модальное окно редактирования
}

function toggleTask(taskId, completed) {
    const task = employeeTasks.find(t => t.id === taskId);
    if (task) {
        task.completed = completed;
        saveEmployeeTasks();
        updateTasksDisplay();
        setupTaskHandlers();
        
        const message = completed ? 'Задача выполнена!' : 'Задача снова в работе';
        const type = completed ? 'success' : 'info';
        showNotification('Статус изменен', message, type);
    }
}

function setupTaskHandlers() {
    // Обработчики чекбоксов задач
    const taskCheckboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
    
    taskCheckboxes.forEach(checkbox => {
        // Удаляем старые обработчики
        checkbox.removeEventListener('change', handleTaskToggle);
        
        // Добавляем новые обработчики
        checkbox.addEventListener('change', handleTaskToggle);
    });
}

function handleTaskToggle(event) {
    const checkbox = event.target;
    const taskId = parseInt(checkbox.id.replace('task', ''));
    const completed = checkbox.checked;
    
    toggleTask(taskId, completed);
}

// ===== УПРАВЛЕНИЕ УВЕДОМЛЕНИЯМИ =====
function loadEmployeeNotifications() {
    // Загружаем уведомления из localStorage или создаем демо-данные
    const storedNotifications = localStorage.getItem('employeeNotifications');
    
    if (storedNotifications) {
        employeeNotifications = JSON.parse(storedNotifications);
    } else {
        // Создаем демо-уведомления
        employeeNotifications = [
            {
                id: 1,
                title: 'Обновление системы',
                text: 'Запланировано техническое обслуживание',
                type: 'info',
                time: new Date(Date.now() - 7200000).toISOString(),
                read: false
            },
            {
                id: 2,
                title: 'Новый сотрудник',
                text: 'Мария Сидорова присоединилась к команде',
                type: 'info',
                time: new Date(Date.now() - 86400000).toISOString(),
                read: true
            },
            {
                id: 3,
                title: 'Достижение',
                text: 'Вы выполнили 100% задач в этом месяце!',
                type: 'success',
                time: new Date(Date.now() - 259200000).toISOString(),
                read: true
            }
        ];
        
        saveEmployeeNotifications();
    }
    
    updateNotificationsDisplay();
}

function saveEmployeeNotifications() {
    localStorage.setItem('employeeNotifications', JSON.stringify(employeeNotifications));
}

function updateNotificationsDisplay() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    // Очищаем текущий список
    notificationList.innerHTML = '';
    
    // Сортируем по времени (новые сверху)
    const sortedNotifications = [...employeeNotifications].sort((a, b) => 
        new Date(b.time) - new Date(a.time)
    );
    
    // Добавляем каждое уведомление
    sortedNotifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationList.appendChild(notificationElement);
    });
}

function createNotificationElement(notification) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-item ${!notification.read ? 'unread' : ''}`;
    
    const timeAgo = getTimeAgo(new Date(notification.time));
    const iconClass = getNotificationIconClass(notification.type);
    
    notificationDiv.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-text">${notification.text}</div>
            <div class="notification-time">${timeAgo}</div>
        </div>
    `;
    
    // Добавляем обработчик клика для отметки как прочитанное
    notificationDiv.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
    });
    
    return notificationDiv;
}

function getTimeAgo(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} ${getDaysText(diffDays)} назад`;
    } else if (diffHours > 0) {
        return `${diffHours} ${getHoursText(diffHours)} назад`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} ${getMinutesText(diffMinutes)} назад`;
    } else {
        return 'Только что';
    }
}

function getDaysText(days) {
    if (days === 1) return 'день';
    if (days < 5) return 'дня';
    return 'дней';
}

function getHoursText(hours) {
    if (hours === 1) return 'час';
    if (hours < 5) return 'часа';
    return 'часов';
}

function getMinutesText(minutes) {
    if (minutes === 1) return 'минуту';
    if (minutes < 5) return 'минуты';
    return 'минут';
}

function getNotificationIconClass(type) {
    const iconMap = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return iconMap[type] || 'bell';
}

function markNotificationAsRead(notificationId) {
    const notification = employeeNotifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        saveEmployeeNotifications();
        updateNotificationsDisplay();
    }
}

function setupNotificationHandlers() {
    // Обработчики уведомлений уже настроены в createNotificationElement
    console.log('Обработчики уведомлений настроены');
}

// ===== УПРАВЛЕНИЕ РАСПИСАНИЕМ =====
function loadEmployeeSchedule() {
    // Загружаем расписание из localStorage или создаем демо-данные
    const storedSchedule = localStorage.getItem('employeeSchedule');
    
    if (storedSchedule) {
        employeeSchedule = JSON.parse(storedSchedule);
    } else {
        // Создаем демо-расписание на сегодня
        const today = new Date();
        employeeSchedule = [
            {
                id: 1,
                title: 'Ежедневный стендап',
                time: '10:00',
                location: 'Конференц-зал',
                date: today.toDateString()
            },
            {
                id: 2,
                title: 'Планирование спринта',
                time: '14:00',
                location: 'Zoom',
                date: today.toDateString()
            },
            {
                id: 3,
                title: '1-на-1 с руководителем',
                time: '16:00',
                location: 'Кабинет 205',
                date: today.toDateString()
            }
        ];
        
        saveEmployeeSchedule();
    }
    
    updateScheduleDisplay();
}

function saveEmployeeSchedule() {
    localStorage.setItem('employeeSchedule', JSON.stringify(employeeSchedule));
}

function updateScheduleDisplay() {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    // Фильтруем события на сегодня
    const today = new Date().toDateString();
    const todayEvents = employeeSchedule.filter(event => event.date === today);
    
    // Сортируем по времени
    todayEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    // Очищаем текущий список
    scheduleList.innerHTML = '';
    
    if (todayEvents.length === 0) {
        scheduleList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>На сегодня событий нет</p>
            </div>
        `;
        return;
    }
    
    // Добавляем каждое событие
    todayEvents.forEach(event => {
        const eventElement = createScheduleElement(event);
        scheduleList.appendChild(eventElement);
    });
}

function createScheduleElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'schedule-item';
    
    eventDiv.innerHTML = `
        <div class="schedule-time">${event.time}</div>
        <div class="schedule-content">
            <div class="schedule-title">${event.title}</div>
            <div class="schedule-location">${event.location}</div>
        </div>
    `;
    
    return eventDiv;
}

// ===== АНИМАЦИИ И ВИЗУАЛЬНЫЕ ЭФФЕКТЫ =====
function updateProgressBars() {
    // Анимируем прогресс-бары статистики
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach((bar, index) => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.transition = 'width 1s ease-out';
            bar.style.width = targetWidth;
        }, 200 + index * 100);
    });
}

function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.showAddTaskModal = showAddTaskModal;
window.saveTask = saveTask;
window.editTask = editTask;

// ===== ЭКСПОРТ ДЛЯ ДРУГИХ МОДУЛЕЙ =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadEmployeeTasks,
        saveTask,
        editTask,
        loadEmployeeNotifications,
        loadEmployeeSchedule
    };
}