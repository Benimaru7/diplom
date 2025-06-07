// ===== ОТЧЕТЫ И АНАЛИТИКА =====

// Глобальные переменные
let currentReportPeriod = 'month';
let currentUser = null;
let reportData = {};
let charts = {};
let currentCalendarMonth = new Date();
let activeReportTab = 'summary';

// Инициализация страницы отчетов
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reports.html')) {
        initializeReports();
    }
});

function initializeReports() {
    console.log('Инициализация страницы отчетов');
    
    // Проверяем авторизацию
    checkAuthentication();
    
    // Загружаем пользователя
    loadCurrentUser();
    
    // Настраиваем обработчики событий
    setupReportsEventListeners();
    
    // Инициализируем данные
    loadReportData();
    
    // Создаем графики
    initializeCharts();
    
    // Обновляем отчеты
    updateReports();
    
    // Генерируем календарь активности
    generateActivityCalendar();
    
    // Загружаем детальные отчеты
    loadDetailedReports();
}

function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupReportsEventListeners() {
    // Фильтры отчетов
    const reportPeriodSelect = document.getElementById('reportPeriod');
    if (reportPeriodSelect) {
        reportPeriodSelect.addEventListener('change', handlePeriodChange);
    }
    
    // Чекбоксы типов отчетов
    const reportCheckboxes = ['timeReport', 'productivityReport', 'attendanceReport', 'salaryReport'];
    reportCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', updateReports);
        }
    });
    
    // Кнопки периодов графиков
    const chartButtons = document.querySelectorAll('.chart-btn');
    chartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            if (period) {
                setChartPeriod(e.target, period);
            }
        });
    });
}

function handlePeriodChange() {
    const periodType = document.getElementById('reportPeriod').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (periodType === 'custom') {
        customDateRange.classList.remove('hidden');
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
    } else {
        customDateRange.classList.add('hidden');
    }
    
    currentReportPeriod = periodType;
    updateReports();
}

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadReportData() {
    // Получаем данные о рабочем времени
    const timeRecords = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const userRecords = timeRecords.filter(record => record.userId === currentUser?.id);
    
    // Обрабатываем данные для текущего периода
    reportData = processReportData(userRecords);
    
    // Генерируем демо-данные если нужно
    if (userRecords.length === 0) {
        generateDemoReportData();
    }
}

function processReportData(records) {
    const now = new Date();
    const periodData = getRecordsForPeriod(records, currentReportPeriod);
    
    // Основные метрики
    const totalHours = periodData.reduce((sum, record) => {
        return sum + (record.totalTime ? record.totalTime / (1000 * 60 * 60) : 0);
    }, 0);
    
    const overtimeHours = periodData.reduce((sum, record) => {
        const hours = record.totalTime ? record.totalTime / (1000 * 60 * 60) : 0;
        return sum + Math.max(0, hours - 8);
    }, 0);
    
    const workingDays = periodData.filter(record => record.checkOut).length;
    const lateCount = periodData.filter(record => record.status === 'late').length;
    
    // Посещаемость
    const expectedDays = getExpectedWorkingDays(currentReportPeriod);
    const attendanceRate = expectedDays > 0 ? (workingDays / expectedDays) * 100 : 0;
    
    // Производительность (упрощенный расчет)
    const productivity = Math.min(100, (totalHours / (expectedDays * 8)) * 100);
    
    return {
        totalHours,
        overtimeHours,
        workingDays,
        lateCount,
        attendanceRate,
        productivity,
        records: periodData,
        expectedDays
    };
}

function getRecordsForPeriod(records, period) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + 1); // Понедельник
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            const startInput = document.getElementById('startDate')?.value;
            const endInput = document.getElementById('endDate')?.value;
            if (startInput && endInput) {
                startDate = new Date(startInput);
                endDate = new Date(endInput);
                endDate.setHours(23, 59, 59, 999);
            } else {
                return [];
            }
            break;
        default:
            return [];
    }
    
    return records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
}

function getExpectedWorkingDays(period) {
    // Упрощенный расчет ожидаемых рабочих дней
    switch (period) {
        case 'week': return 5;
        case 'month': return 22;
        case 'quarter': return 66;
        case 'year': return 250;
        default: return 22;
    }
}

// ===== ОБНОВЛЕНИЕ ОТЧЕТОВ =====
function updateReports() {
    loadReportData();
    updateKeyMetrics();
    updateCharts();
    generateActivityCalendar();
    loadDetailedReports();
}

function updateKeyMetrics() {
    if (!reportData) return;
    
    // Обновляем основные метрики
    updateElement('totalHours', formatDuration(reportData.totalHours * 60 * 60 * 1000));
    updateElement('productivity', `${Math.round(reportData.productivity)}%`);
    updateElement('attendance', `${reportData.attendanceRate.toFixed(1)}%`);
    updateElement('rating', '4.8'); // Заглушка
    
    // Обновляем изменения (заглушки)
    updateMetricChanges();
}

function updateMetricChanges() {
    // Здесь можно добавить реальные расчеты изменений
    // Пока используем заглушки
    const changes = [
        { id: 'totalHours', change: '+5.2%', type: 'positive' },
        { id: 'productivity', change: '+2.1%', type: 'positive' },
        { id: 'attendance', change: 'Норма: 95%', type: 'neutral' },
        { id: 'rating', change: '+0.3', type: 'positive' }
    ];
    
    changes.forEach(change => {
        const metricCard = document.querySelector(`#${change.id}`).closest('.metric-card');
        const changeElement = metricCard.querySelector('.metric-change');
        if (changeElement) {
            changeElement.className = `metric-change ${change.type}`;
            const icon = change.type === 'positive' ? 'fa-arrow-up' : 
                        change.type === 'negative' ? 'fa-arrow-down' : 'fa-minus';
            changeElement.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${change.change}</span>
            `;
        }
    });
}

// ===== ГРАФИКИ И ДИАГРАММЫ =====
function initializeCharts() {
    // Инициализируем основные графики
    createWorkTimeChart();
    createProductivityChart();
    createTimeDistributionChart();
    createMiniCharts();
}

function createWorkTimeChart() {
    const ctx = document.getElementById('workTimeChart');
    if (!ctx) return;
    
    // Генерируем данные для графика
    const chartData = generateWorkTimeData();
    
    charts.workTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Рабочие часы',
                data: chartData.data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }, {
                label: 'Плановые часы',
                data: chartData.planned,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12,
                    ticks: {
                        callback: function(value) {
                            return value + 'ч';
                        }
                    }
                }
            }
        }
    });
}

function createProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    
    const chartData = generateProductivityData();
    
    charts.productivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Фактическое время',
                data: chartData.actual,
                backgroundColor: '#2563eb',
                borderRadius: 4
            }, {
                label: 'Плановое время',
                data: chartData.planned,
                backgroundColor: '#10b981',
                borderRadius: 4
            }, {
                label: 'Переработки',
                data: chartData.overtime,
                backgroundColor: '#f59e0b',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false
                }
            }
        }
    });
}

function createTimeDistributionChart() {
    const ctx = document.getElementById('timeDistributionChart');
    if (!ctx) return;
    
    charts.timeDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Основная работа', 'Переработки', 'Перерывы', 'Встречи'],
            datasets: [{
                data: [75, 15, 8, 2],
                backgroundColor: [
                    '#2563eb',
                    '#f59e0b',
                    '#ef4444',
                    '#10b981'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

function createMiniCharts() {
    // Мини-графики для метрик
    const miniChartIds = ['totalHoursChart', 'productivityChart', 'attendanceChart', 'ratingChart'];
    
    miniChartIds.forEach((id, index) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        
        const data = generateMiniChartData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.datasets[index],
                    borderColor: ['#2563eb', '#10b981', '#f59e0b', '#06b6d4'][index],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    point: { radius: 0 }
                }
            }
        });
    });
}

// ===== ГЕНЕРАЦИЯ ДАННЫХ ДЛЯ ГРАФИКОВ =====
function generateWorkTimeData() {
    const labels = [];
    const data = [];
    const planned = [];
    
    const days = currentReportPeriod === 'week' ? 7 : 30;
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        if (date.getDay() !== 0 && date.getDay() !== 6) { // Исключаем выходные
            labels.push(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
            data.push(7.5 + Math.random() * 2); // Случайные данные 7.5-9.5 часов
            planned.push(8);
        }
    }
    
    return { labels, data, planned };
}

function generateProductivityData() {
    const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
    const actual = [8.2, 7.8, 8.5, 9.1, 7.9];
    const planned = [8, 8, 8, 8, 8];
    const overtime = [0.2, 0, 0.5, 1.1, 0];
    
    return { labels, actual, planned, overtime };
}

function generateMiniChartData() {
    const labels = ['1', '2', '3', '4', '5', '6', '7'];
    const datasets = [
        [7, 8, 7.5, 9, 8.2, 8.5, 8.1], // Часы
        [85, 88, 92, 89, 95, 91, 92],   // Производительность
        [95, 98, 92, 100, 95, 98, 95],  // Посещаемость
        [4.2, 4.5, 4.3, 4.8, 4.6, 4.7, 4.8] // Рейтинг
    ];
    
    return { labels, datasets };
}

// ===== КАЛЕНДАРЬ АКТИВНОСТИ =====
function generateActivityCalendar() {
    const calendarGrid = document.getElementById('activityCalendar');
    const calendarMonthElement = document.getElementById('calendarMonth');
    
    if (!calendarGrid) return;
    
    // Обновляем заголовок месяца
    if (calendarMonthElement) {
        calendarMonthElement.textContent = currentCalendarMonth.toLocaleDateString('ru-RU', {
            month: 'long',
            year: 'numeric'
        });
    }
    
    // Очищаем календарь
    calendarGrid.innerHTML = '';
    
    // Генерируем дни месяца
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Корректируем начальную дату на понедельник
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Создаем заголовки дней недели
    const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach(day => {
        const headerElement = document.createElement('div');
        headerElement.className = 'calendar-day-header';
        headerElement.textContent = day;
        headerElement.style.fontSize = '10px';
        headerElement.style.fontWeight = '500';
        headerElement.style.color = '#64748b';
        headerElement.style.textAlign = 'center';
        headerElement.style.padding = '4px';
        calendarGrid.appendChild(headerElement);
    });
    
    // Генерируем ячейки календаря (42 дня = 6 недель)
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Определяем интенсивность активности (0-4)
        const intensity = getActivityIntensity(currentDate);
        dayElement.setAttribute('data-intensity', intensity);
        
        // Добавляем тултип
        dayElement.title = `${currentDate.toLocaleDateString('ru-RU')} - Активность: ${intensity}/4`;
        
        calendarGrid.appendChild(dayElement);
    }
}

function getActivityIntensity(date) {
    // Генерируем случайную интенсивность на основе даты
    // В реальном приложении здесь бы был расчет на основе реальных данных
    const today = new Date();
    if (date > today) return 0; // Будущие дни
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0; // Выходные
    
    // Используем дату как seed для генерации стабильной случайности
    const seed = date.getTime();
    const random = Math.sin(seed) * 10000;
    const normalized = (random - Math.floor(random)) * 5;
    
    return Math.floor(normalized);
}

function changeCalendarMonth(direction) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
    generateActivityCalendar();
}

// ===== ДЕТАЛЬНЫЕ ОТЧЕТЫ =====
function loadDetailedReports() {
    loadAttendanceTable();
}

function switchReportTab(tabName) {
    // Убираем активный класс у всех вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.report-tab-content').forEach(content => content.classList.remove('active'));
    
    // Добавляем активный класс к выбранной вкладке
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    activeReportTab = tabName;
    
    // Загружаем данные для активной вкладки
    if (tabName === 'attendance') {
        loadAttendanceTable();
    } else if (tabName === 'time') {
        createTimeBreakdownChart();
    }
}

function loadAttendanceTable() {
    const tableBody = document.getElementById('attendanceTableBody');
    if (!tableBody) return;
    
    const records = reportData.records || [];
    
    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Нет данных</h3>
                    <p>За выбранный период записей не найдено</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = records.map(record => {
        const date = new Date(record.date);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const checkIn = record.checkIn ? formatTime(new Date(record.checkIn)) : '-';
        const checkOut = record.checkOut ? formatTime(new Date(record.checkOut)) : '-';
        
        // Вычисляем опоздание
        let lateMinutes = 0;
        if (record.checkIn) {
            const checkInTime = new Date(record.checkIn);
            const workStart = new Date(checkInTime);
            workStart.setHours(9, 0, 0, 0);
            if (checkInTime > workStart) {
                lateMinutes = Math.round((checkInTime - workStart) / (1000 * 60));
            }
        }
        
        const lateText = lateMinutes > 0 ? `${lateMinutes}м` : '-';
        const statusBadge = getAttendanceStatusBadge(record.status);
        
        return `
            <tr>
                <td>${formatDate(date)}</td>
                <td>${dayName}</td>
                <td>${checkIn}</td>
                <td>${checkOut}</td>
                <td>${lateText}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function getAttendanceStatusBadge(status) {
    const statusMap = {
        'complete': '<span class="record-status complete">Присутствовал</span>',
        'late': '<span class="record-status late">Опоздание</span>',
        'overtime': '<span class="record-status overtime">Переработка</span>',
        'pending': '<span class="record-status pending">В процессе</span>'
    };
    
    return statusMap[status] || '<span class="record-status complete">Присутствовал</span>';
}

function createTimeBreakdownChart() {
    const ctx = document.getElementById('timeBreakdownChart');
    if (!ctx || charts.timeBreakdown) return;
    
    charts.timeBreakdown = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Основная работа', 'Переработки', 'Перерывы', 'Встречи', 'Обучение'],
            datasets: [{
                data: [70, 15, 8, 5, 2],
                backgroundColor: [
                    '#2563eb',
                    '#f59e0b',
                    '#ef4444',
                    '#10b981',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// ===== УПРАВЛЕНИЕ ГРАФИКАМИ =====
function setChartPeriod(button, period) {
    // Убираем активный класс у всех кнопок в группе
    const buttons = button.parentNode.querySelectorAll('.chart-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Добавляем активный класс к выбранной кнопке
    button.classList.add('active');
    
    // Обновляем соответствующий график
    updateChartForPeriod(period);
}

function updateChartForPeriod(period) {
    // Здесь можно обновить данные графика для выбранного периода
    console.log('Обновление графика для периода:', period);
}

function updateCharts() {
    // Обновляем все графики с новыми данными
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.update === 'function') {
            chart.update();
        }
    });
}

function updateTimeDistribution() {
    const period = document.querySelector('.chart-filter').value;
    console.log('Обновление распределения времени для периода:', period);
    // Здесь можно обновить график распределения времени
}

// ===== ЦЕЛИ И ДОСТИЖЕНИЯ =====
function showGoalsModal() {
    const modal = document.getElementById('goalsModal');
    if (modal) {
        // Сбрасываем форму
        document.getElementById('goalForm').reset();
        
        // Устанавливаем дату по умолчанию (конец текущего месяца)
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
        document.getElementById('goalDeadline').value = endOfMonth.toISOString().split('T')[0];
        
        showModal('goalsModal');
    }
}

function saveGoal() {
    const form = document.getElementById('goalForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const goal = {
        id: Date.now(),
        userId: currentUser.id,
        title: document.getElementById('goalTitle').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        unit: document.getElementById('goalUnit').value,
        deadline: document.getElementById('goalDeadline').value,
        current: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Сохраняем цель
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    goals.push(goal);
    localStorage.setItem('userGoals', JSON.stringify(goals));
    
    // Закрываем модальное окно
    closeModal('goalsModal');
    
    // Показываем уведомление
    showNotification('Успешно', 'Цель добавлена', 'success');
}

// ===== ЭКСПОРТ И ГЕНЕРАЦИЯ =====
function generateReport() {
    showNotification('Генерация отчета', 'Отчет формируется...', 'info');
    
    // Имитируем генерацию отчета
    setTimeout(() => {
        showNotification('Готово', 'Отчет успешно сформирован', 'success');
    }, 2000);
}

function exportAllReports() {
    showNotification('Экспорт', 'Отчеты экспортируются...', 'info');
    
    // Имитируем экспорт
    setTimeout(() => {
        showNotification('Готово', 'Отчеты успешно экспортированы', 'success');
    }, 1500);
}

function resetFilters() {
    // Сбрасываем все фильтры
    document.getElementById('reportPeriod').value = 'month';
    document.getElementById('groupBy').value = 'week';
    document.getElementById('comparison').value = 'previous';
    
    // Сбрасываем чекбоксы
    document.getElementById('timeReport').checked = true;
    document.getElementById('productivityReport').checked = true;
    document.getElementById('attendanceReport').checked = true;
    document.getElementById('salaryReport').checked = false;
    
    // Скрываем кастомный диапазон дат
    document.getElementById('customDateRange').classList.add('hidden');
    
    // Обновляем отчеты
    currentReportPeriod = 'month';
    updateReports();
    
    showNotification('Фильтры', 'Фильтры сброшены', 'info');
}

// ===== ДЕМО-ДАННЫЕ =====
function generateDemoReportData() {
    // Генерируем демо-данные для отчетов если нет реальных данных
    console.log('Генерация демо-данных для отчетов');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
}

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

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.updateReports = updateReports;
window.updateTimeDistribution = updateTimeDistribution;
window.switchReportTab = switchReportTab;
window.changeCalendarMonth = changeCalendarMonth;
window.showGoalsModal = showGoalsModal;
window.saveGoal = saveGoal;
window.generateReport = generateReport;
window.exportAllReports = exportAllReports;
window.resetFilters = resetFilters;