// ===== АДМИНИСТРАТИВНАЯ ПАНЕЛЬ =====

// Глобальные переменные
let currentAdminTab = 'employees';
let employeesData = [];
let departmentsData = [];
let selectedEmployees = [];
let editingEmployeeId = null;
let sortColumn = 'name';
let sortDirection = 'asc';

// Инициализация административной панели
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-panel.html')) {
        initializeAdminPanel();
    }
});

function initializeAdminPanel() {
    console.log('Инициализация административной панели');
    
    // Проверяем права администратора
    checkAdminRights();
    
    // Загружаем данные
    loadAdminData();
    
    // Настраиваем обработчики событий
    setupAdminEventListeners();
    
    // Инициализируем графики
    initializeAdminCharts();
    
    // Загружаем таблицу сотрудников
    loadEmployeesTable();
    
    // Обновляем статистику
    updateSystemOverview();
}

function checkAdminRights() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') {
        showNotification('Доступ запрещен', 'У вас нет прав администратора', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
}

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadAdminData() {
    // Загружаем или создаем данные сотрудников
    const existingEmployees = localStorage.getItem('employeesData');
    if (existingEmployees) {
        employeesData = JSON.parse(existingEmployees);
    } else {
        generateDemoEmployeesData();
    }
    
    // Загружаем данные отделов
    const existingDepartments = localStorage.getItem('departmentsData');
    if (existingDepartments) {
        departmentsData = JSON.parse(existingDepartments);
    } else {
        generateDemoDepartmentsData();
    }
}

function generateDemoEmployeesData() {
    const demoEmployees = [
        {
            id: 1,
            name: 'Иван Петров',
            email: 'ivan.petrov@company.com',
            department: 'IT',
            position: 'Frontend Developer',
            salary: 80000,
            status: 'active',
            phone: '+7 (999) 123-45-67',
            startDate: '2023-01-15',
            lastActive: new Date().toISOString(),
            avatar: 'assets/images/avatars/ivan.png'
        },
        {
            id: 2,
            name: 'Мария Сидорова',
            email: 'maria.sidorova@company.com',
            department: 'IT',
            position: 'UX/UI Designer',
            salary: 75000,
            status: 'active',
            phone: '+7 (999) 234-56-78',
            startDate: '2023-02-20',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            avatar: 'assets/images/avatars/maria.png'
        },
        {
            id: 3,
            name: 'Алексей Козлов',
            email: 'alexey.kozlov@company.com',
            department: 'Sales',
            position: 'Менеджер по продажам',
            salary: 70000,
            status: 'active',
            phone: '+7 (999) 345-67-89',
            startDate: '2022-11-10',
            lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            avatar: 'assets/images/avatars/alexey.png'
        },
        {
            id: 4,
            name: 'Елена Николаева',
            email: 'elena.nikolaeva@company.com',
            department: 'HR',
            position: 'HR-менеджер',
            salary: 65000,
            status: 'vacation',
            phone: '+7 (999) 456-78-90',
            startDate: '2022-08-01',
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            avatar: 'assets/images/avatars/elena.png'
        },
        {
            id: 5,
            name: 'Дмитрий Волков',
            email: 'dmitriy.volkov@company.com',
            department: 'Marketing',
            position: 'Маркетолог',
            salary: 60000,
            status: 'inactive',
            phone: '+7 (999) 567-89-01',
            startDate: '2023-03-15',
            lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            avatar: 'assets/images/avatars/dmitriy.png'
        }
    ];
    
    employeesData = demoEmployees;
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
}

function generateDemoDepartmentsData() {
    const demoDepartments = [
        {
            id: 'it',
            name: 'IT отдел',
            description: 'Разработка и поддержка',
            icon: 'fas fa-laptop-code',
            manager: 1,
            employees: [1, 2],
            budget: 500000
        },
        {
            id: 'hr',
            name: 'HR отдел',
            description: 'Управление персоналом',
            icon: 'fas fa-users',
            manager: 4,
            employees: [4],
            budget: 200000
        },
        {
            id: 'sales',
            name: 'Продажи',
            description: 'Отдел продаж',
            icon: 'fas fa-chart-line',
            manager: 3,
            employees: [3],
            budget: 300000
        }
    ];
    
    departmentsData = demoDepartments;
    localStorage.setItem('departmentsData', JSON.stringify(departmentsData));
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupAdminEventListeners() {
    // Поиск сотрудников
    const employeeSearch = document.getElementById('employeeSearch');
    if (employeeSearch) {
        employeeSearch.addEventListener('input', debounce(filterEmployees, 300));
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

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
function switchAdminTab(tabName) {
    // Убираем активный класс у всех вкладок
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-content').forEach(content => content.classList.remove('active'));
    
    // Добавляем активный класс к выбранной вкладке
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Content`).classList.add('active');
    
    currentAdminTab = tabName;
    
    // Загружаем данные для активной вкладки
    switch (tabName) {
        case 'employees':
            loadEmployeesTable();
            break;
        case 'departments':
            loadDepartmentsData();
            break;
        case 'reports':
            loadCorporateReports();
            break;
    }
}

// ===== УПРАВЛЕНИЕ СОТРУДНИКАМИ =====
function loadEmployeesTable() {
    const tableBody = document.getElementById('employeesTableBody');
    if (!tableBody) return;
    
    const filteredEmployees = getFilteredEmployees();
    
    if (filteredEmployees.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-empty">
                    <i class="fas fa-users"></i>
                    <h3>Сотрудники не найдены</h3>
                    <p>Попробуйте изменить фильтры поиска</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredEmployees.map(employee => {
        const lastActive = formatLastActive(employee.lastActive);
        const statusBadge = getEmployeeStatusBadge(employee.status);
        
        return `
            <tr data-employee-id="${employee.id}">
                <td>
                    <input type="checkbox" class="employee-checkbox" 
                           value="${employee.id}" onchange="toggleEmployeeSelection(${employee.id})">
                </td>
                <td>
                    <div class="employee-info">
                        <div class="employee-avatar">
                            <img src="${employee.avatar}" alt="${employee.name}" 
                                 onerror="this.src='assets/images/avatars/default.png'">
                        </div>
                        <div class="employee-details">
                            <div class="employee-name">${employee.name}</div>
                            <div class="employee-email">${employee.email}</div>
                        </div>
                    </div>
                </td>
                <td>${employee.department}</td>
                <td>${employee.position}</td>
                <td>${formatCurrency(employee.salary)}</td>
                <td>${statusBadge}</td>
                <td>${lastActive}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="showEditEmployeeModal(${employee.id})" 
                                title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="confirmDeleteEmployee(${employee.id})" 
                                title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getFilteredEmployees() {
    let filtered = [...employeesData];
    
    // Поиск по имени и email
    const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Фильтр по отделу
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';
    if (departmentFilter) {
        filtered = filtered.filter(employee => employee.department === departmentFilter);
    }
    
    // Фильтр по статусу
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    if (statusFilter) {
        filtered = filtered.filter(employee => employee.status === statusFilter);
    }
    
    // Сортировка
    filtered.sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    return filtered;
}

function filterEmployees() {
    loadEmployeesTable();
}

function sortEmployees(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Обновляем иконки сортировки
    updateSortIcons();
    
    // Перезагружаем таблицу
    loadEmployeesTable();
}

function updateSortIcons() {
    const headers = document.querySelectorAll('.employees-table th');
    headers.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    const currentHeader = document.querySelector(`[onclick="sortEmployees('${sortColumn}')"]`);
    if (currentHeader) {
        currentHeader.classList.add(`sorted-${sortDirection}`);
    }
}

function getEmployeeStatusBadge(status) {
    const statusMap = {
        'active': '<span class="employee-status active"><i class="fas fa-check"></i> Активный</span>',
        'inactive': '<span class="employee-status inactive"><i class="fas fa-times"></i> Неактивный</span>',
        'vacation': '<span class="employee-status vacation"><i class="fas fa-umbrella-beach"></i> В отпуске</span>'
    };
    
    return statusMap[status] || '<span class="employee-status inactive">Неизвестно</span>';
}

function formatLastActive(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Только что';
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays < 7) return `${diffDays}д назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// ===== ВЫБОР СОТРУДНИКОВ =====
function toggleSelectAllEmployees() {
    const selectAll = document.getElementById('selectAllEmployees');
    const checkboxes = document.querySelectorAll('.employee-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        const employeeId = parseInt(checkbox.value);
        
        if (selectAll.checked) {
            if (!selectedEmployees.includes(employeeId)) {
                selectedEmployees.push(employeeId);
            }
        } else {
            selectedEmployees = selectedEmployees.filter(id => id !== employeeId);
        }
    });
    
    updateBulkActions();
}

function toggleEmployeeSelection(employeeId) {
    const checkbox = document.querySelector(`input[value="${employeeId}"]`);
    
    if (checkbox.checked) {
        if (!selectedEmployees.includes(employeeId)) {
            selectedEmployees.push(employeeId);
        }
    } else {
        selectedEmployees = selectedEmployees.filter(id => id !== employeeId);
    }
    
    // Обновляем состояние "выбрать все"
    const allCheckboxes = document.querySelectorAll('.employee-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.employee-checkbox:checked');
    const selectAll = document.getElementById('selectAllEmployees');
    
    if (selectAll) {
        selectAll.checked = allCheckboxes.length === checkedCheckboxes.length;
        selectAll.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    }
    
    updateBulkActions();
}

function updateBulkActions() {
    const bulkActions = document.getElementById('employeeBulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (!bulkActions) return;
    
    if (selectedEmployees.length > 0) {
        bulkActions.classList.remove('hidden');
        bulkActions.classList.add('show');
        if (selectedCount) {
            selectedCount.textContent = selectedEmployees.length;
        }
    } else {
        bulkActions.classList.add('hidden');
        bulkActions.classList.remove('show');
    }
}

// ===== МОДАЛЬНЫЕ ОКНА СОТРУДНИКОВ =====
function showAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (!modal) return;
    
    // Сбрасываем форму
    document.getElementById('addEmployeeForm').reset();
    
    // Устанавливаем дату начала работы по умолчанию
    const startDateInput = document.getElementById('employeeStartDate');
    if (startDateInput) {
        startDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    showModal('addEmployeeModal');
}

function showEditEmployeeModal(employeeId) {
    const modal = document.getElementById('editEmployeeModal');
    if (!modal) return;
    
    const employee = employeesData.find(emp => emp.id === employeeId);
    if (!employee) {
        showNotification('Ошибка', 'Сотрудник не найден', 'error');
        return;
    }
    
    editingEmployeeId = employeeId;
    
    // Заполняем форму данными сотрудника
    document.getElementById('editEmployeeName').value = employee.name;
    document.getElementById('editEmployeeEmail').value = employee.email;
    document.getElementById('editEmployeeDepartment').value = employee.department;
    document.getElementById('editEmployeePosition').value = employee.position;
    document.getElementById('editEmployeeSalary').value = employee.salary;
    document.getElementById('editEmployeeStatus').value = employee.status;
    document.getElementById('editEmployeePhone').value = employee.phone || '';
    document.getElementById('editEmployeeNotes').value = employee.notes || '';
    
    showModal('editEmployeeModal');
}

function saveEmployee() {
    const form = document.getElementById('addEmployeeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const newEmployee = {
        id: Date.now(),
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        department: document.getElementById('employeeDepartment').value,
        position: document.getElementById('employeePosition').value,
        salary: parseInt(document.getElementById('employeeSalary').value),
        status: 'active',
        phone: document.getElementById('employeePhone').value,
        startDate: document.getElementById('employeeStartDate').value,
        lastActive: new Date().toISOString(),
        notes: document.getElementById('employeeNotes').value,
        avatar: 'assets/images/avatars/default.png'
    };
    
    employeesData.push(newEmployee);
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    
    // Закрываем модальное окно
    closeModal('addEmployeeModal');
    
    // Обновляем таблицу
    loadEmployeesTable();
    updateSystemOverview();
    
    // Показываем уведомление
    showNotification('Успешно', 'Сотрудник добавлен', 'success');
}

function updateEmployee() {
    if (!editingEmployeeId) return;
    
    const form = document.getElementById('editEmployeeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const employeeIndex = employeesData.findIndex(emp => emp.id === editingEmployeeId);
    if (employeeIndex === -1) {
        showNotification('Ошибка', 'Сотрудник не найден', 'error');
        return;
    }
    
    // Обновляем данные сотрудника
    employeesData[employeeIndex] = {
        ...employeesData[employeeIndex],
        name: document.getElementById('editEmployeeName').value,
        email: document.getElementById('editEmployeeEmail').value,
        department: document.getElementById('editEmployeeDepartment').value,
        position: document.getElementById('editEmployeePosition').value,
        salary: parseInt(document.getElementById('editEmployeeSalary').value),
        status: document.getElementById('editEmployeeStatus').value,
        phone: document.getElementById('editEmployeePhone').value,
        notes: document.getElementById('editEmployeeNotes').value
    };
    
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    
    // Закрываем модальное окно
    closeModal('editEmployeeModal');
    editingEmployeeId = null;
    
    // Обновляем таблицу
    loadEmployeesTable();
    updateSystemOverview();
    
    // Показываем уведомление
    showNotification('Успешно', 'Данные сотрудника обновлены', 'success');
}

function deleteEmployee() {
    if (!editingEmployeeId) return;
    
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
        return;
    }
    
    employeesData = employeesData.filter(emp => emp.id !== editingEmployeeId);
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    
    // Закрываем модальное окно
    closeModal('editEmployeeModal');
    editingEmployeeId = null;
    
    // Обновляем таблицу
    loadEmployeesTable();
    updateSystemOverview();
    
    // Показываем уведомление
    showNotification('Успешно', 'Сотрудник удален', 'success');
}

function confirmDeleteEmployee(employeeId) {
    const employee = employeesData.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    if (!confirm(`Вы уверены, что хотите удалить сотрудника ${employee.name}?`)) {
        return;
    }
    
    employeesData = employeesData.filter(emp => emp.id !== employeeId);
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    
    // Обновляем таблицу
    loadEmployeesTable();
    updateSystemOverview();
    
    // Показываем уведомление
    showNotification('Успешно', 'Сотрудник удален', 'success');
}

// ===== МАССОВЫЕ ОПЕРАЦИИ =====
function bulkActivateEmployees() {
    if (selectedEmployees.length === 0) return;
    
    selectedEmployees.forEach(employeeId => {
        const employee = employeesData.find(emp => emp.id === employeeId);
        if (employee) {
            employee.status = 'active';
        }
    });
    
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    selectedEmployees = [];
    
    loadEmployeesTable();
    updateBulkActions();
    showNotification('Успешно', 'Сотрудники активированы', 'success');
}

function bulkDeactivateEmployees() {
    if (selectedEmployees.length === 0) return;
    
    selectedEmployees.forEach(employeeId => {
        const employee = employeesData.find(emp => emp.id === employeeId);
        if (employee) {
            employee.status = 'inactive';
        }
    });
    
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    selectedEmployees = [];
    
    loadEmployeesTable();
    updateBulkActions();
    showNotification('Успешно', 'Сотрудники деактивированы', 'success');
}

function bulkDeleteEmployees() {
    if (selectedEmployees.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите удалить ${selectedEmployees.length} сотрудников?`)) {
        return;
    }
    
    employeesData = employeesData.filter(emp => !selectedEmployees.includes(emp.id));
    localStorage.setItem('employeesData', JSON.stringify(employeesData));
    selectedEmployees = [];
    
    loadEmployeesTable();
    updateBulkActions();
    updateSystemOverview();
    showNotification('Успешно', 'Сотрудники удалены', 'success');
}

// ===== УПРАВЛЕНИЕ ОТДЕЛАМИ =====
function loadDepartmentsData() {
    // Обновляем статистику отделов
    console.log('Загрузка данных отделов');
}

function showAddDepartmentModal() {
    const modal = document.getElementById('addDepartmentModal');
    if (!modal) return;
    
    // Сбрасываем форму
    document.getElementById('addDepartmentForm').reset();
    
    // Заполняем список руководителей
    const managerSelect = document.getElementById('departmentManager');
    if (managerSelect) {
        managerSelect.innerHTML = '<option value="">Выберите руководителя</option>';
        employeesData.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            managerSelect.appendChild(option);
        });
    }
    
    showModal('addDepartmentModal');
}

function saveDepartment() {
    const form = document.getElementById('addDepartmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const newDepartment = {
        id: Date.now().toString(),
        name: document.getElementById('departmentName').value,
        description: document.getElementById('departmentDescription').value,
        icon: document.getElementById('departmentIcon').value,
        manager: parseInt(document.getElementById('departmentManager').value) || null,
        employees: [],
        budget: 0
    };
    
    departmentsData.push(newDepartment);
    localStorage.setItem('departmentsData', JSON.stringify(departmentsData));
    
    // Закрываем модальное окно
    closeModal('addDepartmentModal');
    
    // Обновляем отображение
    updateSystemOverview();
    
    // Показываем уведомление
    showNotification('Успешно', 'Отдел добавлен', 'success');
}

function editDepartment(departmentId) {
    showNotification('Редактирование', 'Функция редактирования отдела в разработке', 'info');
}

// ===== НАСТРОЙКИ СИСТЕМЫ =====
function saveSettings() {
    const settings = {
        companyName: document.getElementById('companyName').value,
        workingHours: document.getElementById('workingHours').value,
        workStart: document.getElementById('workStart').value,
        timezone: document.getElementById('timezone').value,
        autoLateDetection: document.getElementById('autoLateDetection').checked,
        lateThreshold: document.getElementById('lateThreshold').value,
        overtimeRate: document.getElementById('overtimeRate').value,
        requiredBreaks: document.getElementById('requiredBreaks').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        lateNotifications: document.getElementById('lateNotifications').checked,
        reportEmail: document.getElementById('reportEmail').value
    };
    
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    showNotification('Успешно', 'Настройки сохранены', 'success');
}

function resetSettings() {
    if (!confirm('Сбросить все настройки к значениям по умолчанию?')) {
        return;
    }
    
    // Устанавливаем значения по умолчанию
    document.getElementById('companyName').value = 'ООО ТехИнновации';
    document.getElementById('workingHours').value = '8';
    document.getElementById('workStart').value = '09:00';
    document.getElementById('timezone').value = 'Europe/Moscow';
    document.getElementById('autoLateDetection').checked = true;
    document.getElementById('lateThreshold').value = '15';
    document.getElementById('overtimeRate').value = '1.5';
    document.getElementById('requiredBreaks').checked = false;
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('lateNotifications').checked = true;
    document.getElementById('reportEmail').value = 'hr@company.com';
    
    showNotification('Успешно', 'Настройки сброшены', 'info');
}

// ===== СИСТЕМНАЯ СТАТИСТИКА =====
function updateSystemOverview() {
    // Общее количество сотрудников
    const totalEmployees = employeesData.length;
    updateElement('totalEmployees', totalEmployees);
    
    // Количество отделов
    const totalDepartments = departmentsData.length;
    updateElement('totalDepartments', totalDepartments);
    
    // Активные сегодня
    const activeToday = employeesData.filter(emp => {
        const lastActive = new Date(emp.lastActive);
        const today = new Date();
        return emp.status === 'active' && 
               lastActive.toDateString() === today.toDateString();
    }).length;
    updateElement('activeToday', activeToday);
    
    // Фонд зарплаты
    const totalPayroll = employeesData
        .filter(emp => emp.status === 'active')
        .reduce((sum, emp) => sum + emp.salary, 0);
    updateElement('totalPayroll', formatPayroll(totalPayroll));
}

function formatPayroll(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M₽';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'K₽';
    }
    return amount.toLocaleString('ru-RU') + '₽';
}

// ===== ГРАФИКИ =====
function initializeAdminCharts() {
    createOverviewCharts();
    createCorporateCharts();
}

function createOverviewCharts() {
    // Мини-графики для карточек обзора
    const chartIds = ['employeesChart', 'departmentsChart', 'activeChart', 'payrollChart'];
    
    chartIds.forEach((id, index) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        
        const data = generateOverviewChartData(index);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    borderColor: data.color,
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
                }
            }
        });
    });
}

function generateOverviewChartData(index) {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#06b6d4'];
    const labels = ['1', '2', '3', '4', '5', '6', '7'];
    
    const datasets = [
        [20, 22, 21, 24, 23, 24, 24], // Сотрудники
        [4, 4, 5, 5, 5, 5, 5],        // Отделы
        [15, 18, 16, 20, 17, 19, 18], // Активные
        [1.0, 1.1, 1.15, 1.2, 1.18, 1.2, 1.2] // Фонд зарплаты (в млн)
    ];
    
    return {
        labels,
        values: datasets[index],
        color: colors[index]
    };
}

function createCorporateCharts() {
    createMonthlyOverviewChart();
    createDepartmentAttendanceChart();
    createPayrollTrendChart();
}

function createMonthlyOverviewChart() {
    const ctx = document.getElementById('monthlyOverviewChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: 'Среднее время работы',
                data: [8.2, 8.1, 8.3, 8.0, 7.9, 0, 0],
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}

function createDepartmentAttendanceChart() {
    const ctx = document.getElementById('departmentAttendanceChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['IT отдел', 'HR отдел', 'Продажи', 'Маркетинг'],
            datasets: [{
                data: [95, 88, 92, 85],
                backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createPayrollTrendChart() {
    const ctx = document.getElementById('payrollTrendChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май'],
            datasets: [{
                label: 'Фонд зарплаты',
                data: [1000000, 1050000, 1100000, 1150000, 1200000],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return (value / 1000000).toFixed(1) + 'M₽';
                        }
                    }
                }
            }
        }
    });
}

// ===== КОРПОРАТИВНЫЕ ОТЧЕТЫ =====
function loadCorporateReports() {
    console.log('Загрузка корпоративных отчетов');
    // Графики уже созданы в createCorporateCharts()
}

function generateCorporateReport() {
    showNotification('Генерация отчета', 'Корпоративный отчет формируется...', 'info');
    
    // Имитируем генерацию отчета
    setTimeout(() => {
        showNotification('Готово', 'Корпоративный отчет сформирован', 'success');
    }, 2000);
}

// ===== ЭКСПОРТ ДАННЫХ =====
function exportSystemData() {
    const systemData = {
        employees: employeesData,
        departments: departmentsData,
        settings: JSON.parse(localStorage.getItem('systemSettings') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(systemData, null, 2);
    downloadJSON(jsonData, `system_data_${new Date().toISOString().split('T')[0]}.json`);
    
    showNotification('Экспорт', 'Данные системы экспортированы', 'success');
}

function downloadJSON(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
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
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('RUB', '₽');
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

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

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.switchAdminTab = switchAdminTab;
window.showAddEmployeeModal = showAddEmployeeModal;
window.showEditEmployeeModal = showEditEmployeeModal;
window.saveEmployee = saveEmployee;
window.updateEmployee = updateEmployee;
window.deleteEmployee = deleteEmployee;
window.confirmDeleteEmployee = confirmDeleteEmployee;
window.filterEmployees = filterEmployees;
window.sortEmployees = sortEmployees;
window.toggleSelectAllEmployees = toggleSelectAllEmployees;
window.toggleEmployeeSelection = toggleEmployeeSelection;
window.bulkActivateEmployees = bulkActivateEmployees;
window.bulkDeactivateEmployees = bulkDeactivateEmployees;
window.bulkDeleteEmployees = bulkDeleteEmployees;
window.showAddDepartmentModal = showAddDepartmentModal;
window.saveDepartment = saveDepartment;
window.editDepartment = editDepartment;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.generateCorporateReport = generateCorporateReport;
window.exportSystemData = exportSystemData;