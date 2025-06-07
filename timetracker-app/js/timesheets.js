// ===== ТАБЕЛЬ УЧЕТА ВРЕМЕНИ =====

// Глобальные переменные
let currentView = 'calendar';
let currentPeriod = new Date();
let periodType = 'month';
let currentPage = 1;
let recordsPerPage = 10;
let sortColumn = 'date';
let sortDirection = 'desc';
let selectedRecords = [];
let editingRecordId = null;

// Инициализация страницы табеля
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('timesheet.html')) {
        initializeTimesheet();
    }
});

function initializeTimesheet() {
    console.log('Инициализация табеля учета времени');
    
    // Проверяем авторизацию
    checkAuthentication();
    
    // Загружаем данные
    loadTimesheetData();
    
    // Настраиваем обработчики событий
    setupTimesheetEventListeners();
    
    // Инициализируем календарь
    generateCalendar();
    
    // Загружаем таблицу
    loadTimesheetTable();
    
    // Обновляем сводку
    updatePeriodSummary();
    
    // Устанавливаем текущую дату в форме
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupTimesheetEventListeners() {
    // Фильтры
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterRecords(btn.dataset.filter);
        });
    });
    
    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchRecords, 300));
    }
    
    // Выбор всех записей
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
    
    // Модальные окна
    setupModalEventListeners();
}

function setupModalEventListeners() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВИДОВ =====
function switchView(view) {
    currentView = view;
    
    // Обновляем кнопки
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Показываем нужный вид
    const calendarView = document.querySelector('.calendar-view');
    const tableView = document.getElementById('tableView');
    
    if (view === 'calendar') {
        calendarView.classList.remove('hidden');
        tableView.classList.add('hidden');
        generateCalendar();
    } else {
        calendarView.classList.add('hidden');
        tableView.classList.remove('hidden');
        loadTimesheetTable();
    }
}

// ===== КАЛЕНДАРНЫЙ ВИД =====
function generateCalendar() {
    const calendarBody = document.getElementById('calendarBody');
    const currentPeriodElement = document.getElementById('currentPeriod');
    
    if (!calendarBody) return;
    
    const year = currentPeriod.getFullYear();
    const month = currentPeriod.getMonth();
    
    // Обновляем заголовок периода
    if (currentPeriodElement) {
        currentPeriodElement.textContent = new Intl.DateTimeFormat('ru-RU', {
            month: 'long',
            year: 'numeric'
        }).format(currentPeriod);
    }
    
    // Получаем первый день месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Получаем первый понедельник для отображения
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Очищаем календарь
    calendarBody.innerHTML = '';
    
    // Генерируем ячейки календаря
    const today = new Date();
    const records = getTimeRecordsForPeriod(year, month);
    
    for (let i = 0; i < 42; i++) { // 6 недель * 7 дней
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = createCalendarDay(currentDate, month, today, records);
        calendarBody.appendChild(dayElement);
    }
}

function createCalendarDay(date, currentMonth, today, records) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === today.toDateString();
    const dateString = date.toDateString();
    
    // Находим запись для этого дня
    const dayRecord = records.find(record => 
        new Date(record.date).toDateString() === dateString
    );
    
    // Добавляем классы
    if (!isCurrentMonth) dayElement.classList.add('other-month');
    if (isToday) dayElement.classList.add('today');
    if (dayRecord) dayElement.classList.add('has-record');
    
    // Создаем содержимое дня
    dayElement.innerHTML = `
        <div class="day-number">${date.getDate()}</div>
        ${dayRecord ? createDayStatus(dayRecord) : ''}
        ${dayRecord ? createDayHours(dayRecord) : ''}
    `;
    
    // Добавляем обработчик клика
    dayElement.addEventListener('click', () => {
        if (dayRecord) {
            showEditRecordModal(dayRecord);
        } else if (isCurrentMonth) {
            showAddRecordModal(date);
        }
    });
    
    return dayElement;
}

function createDayStatus(record) {
    let statusClass = 'normal';
    
    if (record.status === 'overtime') statusClass = 'overtime';
    else if (record.status === 'late') statusClass = 'late';
    else if (!record.checkOut) statusClass = 'absent';
    
    return `<div class="day-status ${statusClass}"></div>`;
}

function createDayHours(record) {
    if (!record.totalTime) return '';
    
    const hours = Math.floor(record.totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((record.totalTime % (1000 * 60 * 60)) / (1000 * 60));
    const isOvertime = hours > 8;
    
    return `<div class="day-hours ${isOvertime ? 'overtime' : ''}">${hours}ч ${minutes}м</div>`;
}

// ===== ТАБЛИЧНЫЙ ВИД =====
function loadTimesheetTable() {
    const tableBody = document.getElementById('timesheetTableBody');
    if (!tableBody) return;
    
    // Показываем загрузку
    showTableLoading();
    
    // Имитируем задержку загрузки
    setTimeout(() => {
        const records = getFilteredRecords();
        const paginatedRecords = paginateRecords(records);
        
        if (paginatedRecords.length === 0) {
            showTableEmpty();
            return;
        }
        
        // Генерируем строки таблицы
        tableBody.innerHTML = paginatedRecords.map(record => createTableRow(record)).join('');
        
        // Обновляем статистику
        updateTableStats(records);
        
        // Обновляем пагинацию
        updatePagination(records.length);
        
    }, 300);
}

function createTableRow(record) {
    const checkIn = record.checkIn ? formatTime(new Date(record.checkIn)) : '-';
    const checkOut = record.checkOut ? formatTime(new Date(record.checkOut)) : '-';
    const duration = record.totalTime ? formatDuration(record.totalTime) : '-';
    const breakTime = record.breakDuration ? `${record.breakDuration}м` : '60м';
    const status = getRecordStatusBadge(record);
    
    return `
        <tr data-record-id="${record.id}">
            <td>
                <input type="checkbox" class="record-checkbox" 
                       value="${record.id}" onchange="toggleRecordSelection(${record.id})">
            </td>
            <td>${formatDate(new Date(record.date))}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td>${duration}</td>
            <td>${breakTime}</td>
            <td>${status}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="showEditRecordModal(${record.id})" 
                            title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="confirmDeleteRecord(${record.id})" 
                            title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function getRecordStatusBadge(record) {
    const statusMap = {
        'complete': '<span class="record-status complete">Завершен</span>',
        'overtime': '<span class="record-status overtime">Переработка</span>',
        'pending': '<span class="record-status pending">В процессе</span>',
        'late': '<span class="record-status late">Опоздание</span>'
    };
    
    return statusMap[record.status] || '<span class="record-status pending">Неизвестно</span>';
}

function showTableLoading() {
    const tableBody = document.getElementById('timesheetTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    <div class="spinner"></div>
                    <p>Загрузка данных...</p>
                </td>
            </tr>
        `;
    }
}

function showTableEmpty() {
    const tableBody = document.getElementById('timesheetTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-empty">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Нет записей</h3>
                    <p>За выбранный период записей не найдено</p>
                </td>
            </tr>
        `;
    }
}

// ===== РАБОТА С ДАННЫМИ =====
function getTimeRecordsForPeriod(year, month) {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    return records.filter(record => {
        if (record.userId !== currentUser.id) return false;
        
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });
}

function getFilteredRecords() {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    
    let filteredRecords = records.filter(record => record.userId === currentUser.id);
    
    // Применяем фильтр по статусу
    if (activeFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.status === activeFilter);
    }
    
    // Применяем поиск
    if (searchTerm) {
        filteredRecords = filteredRecords.filter(record => {
            const date = formatDate(new Date(record.date)).toLowerCase();
            const notes = (record.notes || '').toLowerCase();
            return date.includes(searchTerm) || notes.includes(searchTerm);
        });
    }
    
    // Применяем сортировку
    filteredRecords.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortColumn) {
            case 'date':
                valueA = new Date(a.date);
                valueB = new Date(b.date);
                break;
            case 'checkIn':
                valueA = a.checkIn ? new Date(a.checkIn) : new Date(0);
                valueB = b.checkIn ? new Date(b.checkIn) : new Date(0);
                break;
            case 'checkOut':
                valueA = a.checkOut ? new Date(a.checkOut) : new Date(0);
                valueB = b.checkOut ? new Date(b.checkOut) : new Date(0);
                break;
            case 'duration':
                valueA = a.totalTime || 0;
                valueB = b.totalTime || 0;
                break;
            default:
                valueA = a[sortColumn] || '';
                valueB = b[sortColumn] || '';
        }
        
        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    return filteredRecords;
}

function paginateRecords(records) {
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    return records.slice(start, end);
}

// ===== ФИЛЬТРАЦИЯ И ПОИСК =====
function filterRecords(filter) {
    currentPage = 1; // Сбрасываем на первую страницу
    loadTimesheetTable();
}

function searchRecords() {
    currentPage = 1; // Сбрасываем на первую страницу
    loadTimesheetTable();
}

// Debounce функция для поиска
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== СОРТИРОВКА =====
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc';
    }
    
    // Обновляем иконки сортировки
    updateSortIcons();
    
    // Перезагружаем таблицу
    loadTimesheetTable();
}

function updateSortIcons() {
    const headers = document.querySelectorAll('.table th');
    headers.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    const currentHeader = document.querySelector(`[onclick="sortTable('${sortColumn}')"]`);
    if (currentHeader) {
        currentHeader.classList.add(`sorted-${sortDirection}`);
    }
}

// ===== ПАГИНАЦИЯ =====
function changePage(direction) {
    const records = getFilteredRecords();
    const totalPages = Math.ceil(records.length / recordsPerPage);
    
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    loadTimesheetTable();
}

function updatePagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const start = (currentPage - 1) * recordsPerPage + 1;
    const end = Math.min(currentPage * recordsPerPage, totalRecords);
    
    // Обновляем информацию
    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalEntries').textContent = totalRecords;
    
    // Обновляем кнопки
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // Генерируем номера страниц
    generatePageNumbers(totalPages);
}

function generatePageNumbers(totalPages) {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    pageNumbers.innerHTML = '';
    
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbers.appendChild(pageBtn);
    }
}

function goToPage(page) {
    currentPage = page;
    loadTimesheetTable();
}

// ===== ВЫБОР ЗАПИСЕЙ =====
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.record-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        const recordId = parseInt(checkbox.value);
        
        if (selectAll.checked) {
            if (!selectedRecords.includes(recordId)) {
                selectedRecords.push(recordId);
            }
        } else {
            selectedRecords = selectedRecords.filter(id => id !== recordId);
        }
    });
    
    updateBulkActions();
}

function toggleRecordSelection(recordId) {
    const checkbox = document.querySelector(`input[value="${recordId}"]`);
    
    if (checkbox.checked) {
        if (!selectedRecords.includes(recordId)) {
            selectedRecords.push(recordId);
        }
    } else {
        selectedRecords = selectedRecords.filter(id => id !== recordId);
    }
    
    // Обновляем состояние "выбрать все"
    const allCheckboxes = document.querySelectorAll('.record-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.record-checkbox:checked');
    const selectAll = document.getElementById('selectAll');
    
    if (selectAll) {
        selectAll.checked = allCheckboxes.length === checkedCheckboxes.length;
        selectAll.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    }
    
    updateBulkActions();
}

function updateBulkActions() {
    const bulkActions = document.querySelector('.bulk-actions');
    if (!bulkActions) return;
    
    if (selectedRecords.length > 0) {
        bulkActions.classList.add('show');
        const countText = document.querySelector('.bulk-actions-text');
        if (countText) {
            countText.textContent = `Выбрано записей: ${selectedRecords.length}`;
        }
    } else {
        bulkActions.classList.remove('show');
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showAddRecordModal(date = null) {
    const modal = document.getElementById('addRecordModal');
    if (!modal) return;
    
    // Сбрасываем форму
    document.getElementById('addRecordForm').reset();
    
    // Устанавливаем дату
    const dateInput = document.getElementById('recordDate');
    if (dateInput) {
        const targetDate = date || new Date();
        dateInput.value = targetDate.toISOString().split('T')[0];
    }
    
    // Устанавливаем значения по умолчанию
    document.getElementById('checkInTime').value = '09:00';
    document.getElementById('checkOutTime').value = '18:00';
    document.getElementById('breakDuration').value = '60';
    document.getElementById('workLocation').value = 'office';
    
    showModal('addRecordModal');
}

function showEditRecordModal(recordOrId) {
    const modal = document.getElementById('editRecordModal');
    if (!modal) return;
    
    let record;
    if (typeof recordOrId === 'object') {
        record = recordOrId;
    } else {
        const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
        record = records.find(r => r.id === recordOrId);
    }
    
    if (!record) {
        showNotification('Ошибка', 'Запись не найдена', 'error');
        return;
    }
    
    editingRecordId = record.id;
    
    // Заполняем форму данными записи
    document.getElementById('editRecordDate').value = new Date(record.date).toISOString().split('T')[0];
    document.getElementById('editRecordType').value = record.type || 'work';
    
    if (record.checkIn) {
        document.getElementById('editCheckInTime').value = formatTimeForInput(new Date(record.checkIn));
    }
    
    if (record.checkOut) {
        document.getElementById('editCheckOutTime').value = formatTimeForInput(new Date(record.checkOut));
    }
    
    document.getElementById('editBreakDuration').value = record.breakDuration || 60;
    document.getElementById('editWorkLocation').value = record.workLocation || 'office';
    document.getElementById('editRecordNotes').value = record.notes || '';
    
    showModal('editRecordModal');
}

// ===== СОХРАНЕНИЕ И ОБНОВЛЕНИЕ ЗАПИСЕЙ =====
function saveRecord() {
    const form = document.getElementById('addRecordForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const record = {
        id: Date.now(),
        userId: currentUser.id,
        date: document.getElementById('recordDate').value,
        type: document.getElementById('recordType').value,
        checkIn: null,
        checkOut: null,
        breakDuration: parseInt(document.getElementById('breakDuration').value) || 60,
        workLocation: document.getElementById('workLocation').value,
        notes: document.getElementById('recordNotes').value,
        status: 'complete',
        totalTime: 0
    };
    
    // Создаем полные даты для времени
    const recordDate = new Date(record.date);
    const checkInTime = document.getElementById('checkInTime').value;
    const checkOutTime = document.getElementById('checkOutTime').value;
    
    if (checkInTime) {
        const [hours, minutes] = checkInTime.split(':');
        const checkInDate = new Date(recordDate);
        checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        record.checkIn = checkInDate.toISOString();
    }
    
    if (checkOutTime) {
        const [hours, minutes] = checkOutTime.split(':');
        const checkOutDate = new Date(recordDate);
        checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        record.checkOut = checkOutDate.toISOString();
    }
    
    // Вычисляем общее время
    if (record.checkIn && record.checkOut) {
        const totalMs = new Date(record.checkOut) - new Date(record.checkIn);
        const breakMs = record.breakDuration * 60 * 1000;
        record.totalTime = Math.max(0, totalMs - breakMs);
        
        // Определяем статус
        const totalHours = record.totalTime / (1000 * 60 * 60);
        if (totalHours > 8) {
            record.status = 'overtime';
        }
        
        // Проверяем опоздание (если приход после 9:15)
        const checkInHour = new Date(record.checkIn).getHours();
        const checkInMinute = new Date(record.checkIn).getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
            record.status = 'late';
        }
    }
    
    // Сохраняем запись
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    records.push(record);
    localStorage.setItem('timeRecords', JSON.stringify(records));
    
    // Закрываем модальное окно
    closeModal('addRecordModal');
    
    // Обновляем отображение
    refreshCurrentView();
    
    // Показываем уведомление
    showNotification('Успешно', 'Запись добавлена', 'success');
}

function updateRecord() {
    if (!editingRecordId) return;
    
    const form = document.getElementById('editRecordForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const recordIndex = records.findIndex(r => r.id === editingRecordId);
    
    if (recordIndex === -1) {
        showNotification('Ошибка', 'Запись не найдена', 'error');
        return;
    }
    
    const record = records[recordIndex];
    
    // Обновляем данные записи
    record.date = document.getElementById('editRecordDate').value;
    record.type = document.getElementById('editRecordType').value;
    record.breakDuration = parseInt(document.getElementById('editBreakDuration').value) || 60;
    record.workLocation = document.getElementById('editWorkLocation').value;
    record.notes = document.getElementById('editRecordNotes').value;
    
    // Обновляем время
    const recordDate = new Date(record.date);
    const checkInTime = document.getElementById('editCheckInTime').value;
    const checkOutTime = document.getElementById('editCheckOutTime').value;
    
    if (checkInTime) {
        const [hours, minutes] = checkInTime.split(':');
        const checkInDate = new Date(recordDate);
        checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        record.checkIn = checkInDate.toISOString();
    }
    
    if (checkOutTime) {
        const [hours, minutes] = checkOutTime.split(':');
        const checkOutDate = new Date(recordDate);
        checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        record.checkOut = checkOutDate.toISOString();
    }
    
    // Пересчитываем общее время и статус
    if (record.checkIn && record.checkOut) {
        const totalMs = new Date(record.checkOut) - new Date(record.checkIn);
        const breakMs = record.breakDuration * 60 * 1000;
        record.totalTime = Math.max(0, totalMs - breakMs);
        
        const totalHours = record.totalTime / (1000 * 60 * 60);
        record.status = totalHours > 8 ? 'overtime' : 'complete';
        
        const checkInHour = new Date(record.checkIn).getHours();
        const checkInMinute = new Date(record.checkIn).getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
            record.status = 'late';
        }
    }
    
    // Сохраняем изменения
    localStorage.setItem('timeRecords', JSON.stringify(records));
    
    // Закрываем модальное окно
    closeModal('editRecordModal');
    editingRecordId = null;
    
    // Обновляем отображение
    refreshCurrentView();
    
    // Показываем уведомление
    showNotification('Успешно', 'Запись обновлена', 'success');
}

function deleteRecord() {
    if (!editingRecordId) return;
    
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }
    
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const filteredRecords = records.filter(r => r.id !== editingRecordId);
    
    localStorage.setItem('timeRecords', JSON.stringify(filteredRecords));
    
    // Закрываем модальное окно
    closeModal('editRecordModal');
    editingRecordId = null;
    
    // Обновляем отображение
    refreshCurrentView();
    
    // Показываем уведомление
    showNotification('Успешно', 'Запись удалена', 'success');
}

function confirmDeleteRecord(recordId) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }
    
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const filteredRecords = records.filter(r => r.id !== recordId);
    
    localStorage.setItem('timeRecords', JSON.stringify(filteredRecords));
    
    // Обновляем отображение
    refreshCurrentView();
    
    // Показываем уведомление
    showNotification('Успешно', 'Запись удалена', 'success');
}

// ===== НАВИГАЦИЯ ПО ПЕРИОДАМ =====
function changePeriod(direction) {
    if (periodType === 'month') {
        currentPeriod.setMonth(currentPeriod.getMonth() + direction);
    } else if (periodType === 'week') {
        currentPeriod.setDate(currentPeriod.getDate() + (direction * 7));
    }
    
    refreshCurrentView();
}

function updatePeriod() {
    const periodTypeSelect = document.getElementById('periodType');
    if (periodTypeSelect) {
        periodType = periodTypeSelect.value;
        refreshCurrentView();
    }
}

// ===== СВОДКА ПО ПЕРИОДУ =====
function updatePeriodSummary() {
    const records = getTimeRecordsForPeriod(currentPeriod.getFullYear(), currentPeriod.getMonth());
    
    // Подсчитываем статистику
    const totalTime = records.reduce((sum, record) => sum + (record.totalTime || 0), 0);
    const workingDays = records.filter(record => record.checkOut).length;
    const lateCount = records.filter(record => record.status === 'late').length;
    const overtimeRecords = records.filter(record => record.status === 'overtime');
    const overtimeTime = overtimeRecords.reduce((sum, record) => {
        const hours = (record.totalTime || 0) / (1000 * 60 * 60);
        return sum + Math.max(0, hours - 8);
    }, 0);
    
    // Обновляем элементы
    const workedHoursEl = document.getElementById('workedHours');
    const workingDaysEl = document.getElementById('workingDays');
    const lateCountEl = document.getElementById('lateCount');
    const overtimeHoursEl = document.getElementById('overtimeHours');
    
    if (workedHoursEl) workedHoursEl.textContent = formatDuration(totalTime);
    if (workingDaysEl) workingDaysEl.textContent = workingDays;
    if (lateCountEl) lateCountEl.textContent = lateCount;
    if (overtimeHoursEl) {
        const overtimeMs = overtimeTime * 60 * 60 * 1000;
        overtimeHoursEl.textContent = formatDuration(overtimeMs);
    }
}

function updateTableStats(records) {
    const totalRecordsEl = document.getElementById('totalRecords');
    const totalHoursEl = document.getElementById('totalHours');
    
    if (totalRecordsEl) totalRecordsEl.textContent = records.length;
    
    if (totalHoursEl) {
        const totalTime = records.reduce((sum, record) => sum + (record.totalTime || 0), 0);
        totalHoursEl.textContent = formatDuration(totalTime);
    }
}

// ===== ЭКСПОРТ =====
function exportTimesheet() {
    const records = getFilteredRecords();
    const csvContent = generateCSV(records);
    downloadCSV(csvContent, `timesheet_${currentPeriod.getFullYear()}_${currentPeriod.getMonth() + 1}.csv`);
    
    showNotification('Экспорт', 'Файл успешно загружен', 'success');
}

function generateCSV(records) {
    const headers = ['Дата', 'Приход', 'Уход', 'Длительность', 'Перерыв', 'Статус', 'Примечания'];
    const csvRows = [headers.join(',')];
    
    records.forEach(record => {
        const row = [
            formatDate(new Date(record.date)),
            record.checkIn ? formatTime(new Date(record.checkIn)) : '-',
            record.checkOut ? formatTime(new Date(record.checkOut)) : '-',
            record.totalTime ? formatDuration(record.totalTime) : '-',
            `${record.breakDuration || 60}м`,
            record.status || 'pending',
            `"${record.notes || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function refreshCurrentView() {
    if (currentView === 'calendar') {
        generateCalendar();
    } else {
        loadTimesheetTable();
    }
    updatePeriodSummary();
}

function formatTimeForInput(date) {
    return date.toTimeString().slice(0, 5);
}

function loadTimesheetData() {
    // Создаем демо-данные если их нет
    const existingRecords = localStorage.getItem('timeRecords');
    if (!existingRecords) {
        generateDemoData();
    }
}

function generateDemoData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const demoRecords = [];
    const today = new Date();
    
    // Генерируем записи за последние 30 дней
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Пропускаем выходные
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const checkIn = new Date(date);
        checkIn.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
        
        const totalTime = checkOut - checkIn - (60 * 60 * 1000); // Минус час на обед
        const hours = totalTime / (1000 * 60 * 60);
        
        let status = 'complete';
        if (hours > 8) status = 'overtime';
        if (checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 15)) {
            status = 'late';
        }
        
        demoRecords.push({
            id: Date.now() + i,
            userId: currentUser.id,
            date: date.toDateString(),
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            totalTime: totalTime,
            breakDuration: 60,
            workLocation: 'office',
            status: status,
            notes: i % 5 === 0 ? 'Важная встреча с клиентом' : ''
        });
    }
    
    localStorage.setItem('timeRecords', JSON.stringify(demoRecords));
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.switchView = switchView;
window.changePeriod = changePeriod;
window.updatePeriod = updatePeriod;
window.sortTable = sortTable;
window.changePage = changePage;
window.goToPage = goToPage;
window.toggleSelectAll = toggleSelectAll;
window.toggleRecordSelection = toggleRecordSelection;
window.showAddRecordModal = showAddRecordModal;
window.showEditRecordModal = showEditRecordModal;
window.saveRecord = saveRecord;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.confirmDeleteRecord = confirmDeleteRecord;
window.exportTimesheet = exportTimesheet;