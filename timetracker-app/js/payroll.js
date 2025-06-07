// ===== РАСЧЕТ ЗАРАБОТНОЙ ПЛАТЫ =====

// Глобальные переменные
let currentPayrollPeriod = new Date();
let currentUser = null;
let salaryData = {};
let paymentHistory = [];
let taxDeductions = [];

// Инициализация страницы расчета зарплаты
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('payroll.html')) {
        initializePayroll();
    }
});

function initializePayroll() {
    console.log('Инициализация страницы расчета зарплаты');
    
    // Проверяем авторизацию
    checkAuthentication();
    
    // Загружаем пользователя
    loadCurrentUser();
    
    // Инициализируем данные
    loadPayrollData();
    
    // Настраиваем обработчики событий
    setupPayrollEventListeners();
    
    // Выполняем первоначальный расчет
    calculateSalary();
    
    // Загружаем историю выплат
    loadPaymentHistory();
    
    // Загружаем налоговые вычеты
    loadTaxDeductions();
    
    // Обновляем интерфейс
    updatePayrollInterface();
}

function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateEmployeeInfo();
    }
}

function updateEmployeeInfo() {
    if (!currentUser) return;
    
    // Обновляем информацию о сотруднике
    const employeeName = document.getElementById('employeeName');
    const employeePosition = document.getElementById('employeePosition');
    const employeeNumber = document.getElementById('employeeNumber');
    
    if (employeeName) employeeName.textContent = currentUser.name;
    if (employeePosition) employeePosition.textContent = currentUser.position;
    if (employeeNumber) employeeNumber.textContent = currentUser.id.toString().padStart(3, '0');
    
    // Устанавливаем базовую зарплату
    const baseSalaryInput = document.getElementById('baseSalary');
    if (baseSalaryInput && currentUser.salary) {
        baseSalaryInput.value = currentUser.salary;
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupPayrollEventListeners() {
    // Поля калькулятора
    const calculatorInputs = [
        'baseSalary', 'overtimeRate', 'bonuses', 
        'taxRate', 'socialRate', 'penalties'
    ];
    
    calculatorInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', debounce(calculateSalary, 300));
        }
    });
    
    // Дата расчета
    updateCalculationDate();
    setInterval(updateCalculationDate, 60000); // Обновляем каждую минуту
}

// ===== ОСНОВНОЙ РАСЧЕТ ЗАРПЛАТЫ =====
function calculateSalary() {
    // Получаем данные о рабочем времени за период
    const timeData = getTimeDataForPeriod();
    
    // Получаем значения из калькулятора
    const baseSalary = parseFloat(document.getElementById('baseSalary')?.value || 0);
    const overtimeRate = parseFloat(document.getElementById('overtimeRate')?.value || 1.5);
    const bonuses = parseFloat(document.getElementById('bonuses')?.value || 0);
    const taxRate = parseFloat(document.getElementById('taxRate')?.value || 13);
    const socialRate = parseFloat(document.getElementById('socialRate')?.value || 1);
    const penalties = parseFloat(document.getElementById('penalties')?.value || 0);
    
    // Рассчитываем основные показатели
    const standardHours = 160; // Стандартное количество часов в месяц
    const actualHours = timeData.totalHours;
    const overtimeHours = Math.max(0, timeData.overtimeHours);
    
    // Процент отработанного времени
    const workPercentage = Math.min(100, (actualHours / standardHours) * 100);
    
    // Основные начисления
    const baseAmount = baseSalary;
    const adjustedBase = (baseSalary * workPercentage) / 100;
    const hourlyRate = baseSalary / standardHours;
    const overtimeAmount = overtimeHours * hourlyRate * overtimeRate;
    const bonusAmount = bonuses;
    
    // Общая сумма начислений
    const grossAmount = adjustedBase + overtimeAmount + bonusAmount;
    
    // Удержания
    const taxAmount = (grossAmount * taxRate) / 100;
    const socialAmount = (grossAmount * socialRate) / 100;
    const penaltyAmount = penalties;
    
    // Общая сумма удержаний
    const totalDeductions = taxAmount + socialAmount + penaltyAmount;
    
    // К выплате
    const netAmount = grossAmount - totalDeductions;
    
    // Обновляем интерфейс
    updateCalculatorDisplay({
        baseAmount,
        adjustedBase,
        workPercentage,
        overtimeAmount,
        bonusAmount,
        grossAmount,
        taxAmount,
        socialAmount,
        penaltyAmount,
        totalDeductions,
        netAmount,
        hourlyRate
    });
    
    // Сохраняем данные расчета
    salaryData = {
        period: currentPayrollPeriod,
        timeData,
        amounts: {
            baseAmount,
            adjustedBase,
            overtimeAmount,
            bonusAmount,
            grossAmount,
            taxAmount,
            socialAmount,
            penaltyAmount,
            totalDeductions,
            netAmount
        },
        rates: {
            baseSalary,
            overtimeRate,
            taxRate,
            socialRate,
            hourlyRate
        }
    };
    
    // Обновляем расчетный листок
    updatePayslip();
    
    // Обновляем статистику
    updateSalaryStats();
}

function getTimeDataForPeriod() {
    const records = JSON.parse(localStorage.getItem('timeRecords') || '[]');
    const userRecords = records.filter(record => 
        record.userId === currentUser?.id &&
        isInCurrentPeriod(new Date(record.date))
    );
    
    let totalHours = 0;
    let overtimeHours = 0;
    let workedDays = 0;
    let sickDays = 0;
    
    userRecords.forEach(record => {
        if (record.totalTime) {
            const hours = record.totalTime / (1000 * 60 * 60);
            totalHours += hours;
            
            if (hours > 8) {
                overtimeHours += (hours - 8);
            }
            
            if (record.type === 'sick') {
                sickDays++;
            } else {
                workedDays++;
            }
        }
    });
    
    return {
        totalHours: Math.round(totalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        workedDays,
        sickDays,
        records: userRecords
    };
}

function isInCurrentPeriod(date) {
    const year = currentPayrollPeriod.getFullYear();
    const month = currentPayrollPeriod.getMonth();
    
    return date.getFullYear() === year && date.getMonth() === month;
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateCalculatorDisplay(amounts) {
    // Основные суммы
    updateElement('baseAmount', formatCurrency(amounts.baseAmount));
    updateElement('adjustedBase', formatCurrency(amounts.adjustedBase));
    updateElement('workPercentage', `${amounts.workPercentage.toFixed(1)}%`);
    updateElement('overtimeAmount', `+${formatCurrency(amounts.overtimeAmount)}`);
    updateElement('bonusAmount', `+${formatCurrency(amounts.bonusAmount)}`);
    
    // Удержания
    updateElement('taxAmount', `-${formatCurrency(amounts.taxAmount)}`);
    updateElement('socialAmount', `-${formatCurrency(amounts.socialAmount)}`);
    updateElement('penaltyAmount', amounts.penaltyAmount > 0 ? `-${formatCurrency(amounts.penaltyAmount)}` : '0₽');
    
    // Итоги
    updateElement('grossAmount', formatCurrency(amounts.grossAmount));
    updateElement('totalDeductions', `-${formatCurrency(amounts.totalDeductions)}`);
    updateElement('netAmount', formatCurrency(amounts.netAmount));
}

function updatePayslip() {
    if (!salaryData.amounts) return;
    
    const payslipPeriod = document.getElementById('payslipPeriod');
    if (payslipPeriod) {
        payslipPeriod.textContent = formatPeriod(currentPayrollPeriod);
    }
    
    // Обновляем таблицу расчетного листка
    const tableBody = document.getElementById('payslipTableBody');
    if (tableBody) {
        tableBody.innerHTML = generatePayslipTableRows();
    }
    
    // Устанавливаем дату выдачи
    const issueDate = document.getElementById('issueDate');
    if (issueDate) {
        issueDate.textContent = new Date().toLocaleDateString('ru-RU');
    }
}

function generatePayslipTableRows() {
    const { amounts, timeData } = salaryData;
    
    const rows = [
        {
            name: 'Оклад',
            quantity: '1 мес.',
            amount: amounts.baseAmount
        },
        {
            name: 'Корректировка по отработанному времени',
            quantity: `${timeData.totalHours}ч`,
            amount: amounts.adjustedBase - amounts.baseAmount
        }
    ];
    
    if (amounts.overtimeAmount > 0) {
        rows.push({
            name: 'Переработка',
            quantity: `${timeData.overtimeHours}ч`,
            amount: amounts.overtimeAmount
        });
    }
    
    if (amounts.bonusAmount > 0) {
        rows.push({
            name: 'Премии и надбавки',
            quantity: '1',
            amount: amounts.bonusAmount
        });
    }
    
    // Добавляем строку итого начислено
    rows.push({
        name: '<strong>Итого начислено</strong>',
        quantity: '',
        amount: amounts.grossAmount,
        isTotal: true
    });
    
    // Удержания
    rows.push({
        name: 'НДФЛ (13%)',
        quantity: '',
        amount: -amounts.taxAmount,
        isDeduction: true
    });
    
    if (amounts.socialAmount > 0) {
        rows.push({
            name: 'Соц. взносы работника',
            quantity: '',
            amount: -amounts.socialAmount,
            isDeduction: true
        });
    }
    
    if (amounts.penaltyAmount > 0) {
        rows.push({
            name: 'Штрафы и удержания',
            quantity: '',
            amount: -amounts.penaltyAmount,
            isDeduction: true
        });
    }
    
    // Итого к выплате
    rows.push({
        name: '<strong>К выплате</strong>',
        quantity: '',
        amount: amounts.netAmount,
        isFinal: true
    });
    
    return rows.map(row => {
        const amountClass = row.isDeduction ? 'deduction' : 
                           row.isFinal ? 'final' : 
                           row.isTotal ? 'total' : '';
        
        return `
            <tr class="${amountClass}">
                <td>${row.name}</td>
                <td>${row.quantity}</td>
                <td class="amount ${amountClass}">${formatCurrency(Math.abs(row.amount))}</td>
            </tr>
        `;
    }).join('');
}

function updateSalaryStats() {
    if (!salaryData.amounts) return;
    
    const { netAmount, rates } = salaryData;
    const timeData = salaryData.timeData;
    
    // Рост к прошлому месяцу (заглушка)
    const previousMonthSalary = 76640; // Можно загружать из истории
    const growth = ((netAmount - previousMonthSalary) / previousMonthSalary) * 100;
    const growthAmount = netAmount - previousMonthSalary;
    
    updateElement('salaryGrowth', `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`);
    
    // Средняя зарплата в день
    const dailyAverage = timeData.workedDays > 0 ? netAmount / timeData.workedDays : 0;
    updateElement('dailyAverage', formatCurrency(dailyAverage));
    
    // Стоимость часа
    updateElement('hourlyRate', formatCurrency(rates.hourlyRate));
    
    // Накопления за год (заглушка)
    const yearlyTotal = netAmount * 12; // Упрощенный расчет
    updateElement('yearlyTotal', formatCurrency(yearlyTotal));
}

function updatePayrollInterface() {
    // Обновляем период
    const payrollPeriodElement = document.getElementById('payrollPeriod');
    if (payrollPeriodElement) {
        payrollPeriodElement.textContent = formatPeriod(currentPayrollPeriod);
    }
    
    // Обновляем статистику периода
    const timeData = getTimeDataForPeriod();
    updateElement('workedDays', timeData.workedDays);
    updateElement('workedHours', `${Math.floor(timeData.totalHours)}ч`);
    updateElement('overtimeHours', `${Math.floor(timeData.overtimeHours)}ч`);
    updateElement('sickDays', timeData.sickDays);
}

// ===== НАВИГАЦИЯ ПО ПЕРИОДАМ =====
function changePeriod(direction) {
    currentPayrollPeriod.setMonth(currentPayrollPeriod.getMonth() + direction);
    updatePayrollInterface();
    calculateSalary();
}

// ===== ИСТОРИЯ ВЫПЛАТ =====
function loadPaymentHistory() {
    // Генерируем демо-данные истории выплат
    if (!localStorage.getItem('paymentHistory')) {
        generatePaymentHistoryDemo();
    }
    
    const historyData = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
    const userHistory = historyData.filter(payment => payment.userId === currentUser?.id);
    
    // Фильтруем по выбранному периоду
    const historyPeriod = parseInt(document.getElementById('historyPeriod')?.value || 12);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - historyPeriod);
    
    const filteredHistory = userHistory.filter(payment => 
        new Date(payment.period) >= cutoffDate
    );
    
    // Сортируем по дате (новые сверху)
    filteredHistory.sort((a, b) => new Date(b.period) - new Date(a.period));
    
    // Обновляем таблицу
    updatePaymentHistoryTable(filteredHistory);
}

function generatePaymentHistoryDemo() {
    if (!currentUser) return;
    
    const historyData = [];
    const today = new Date();
    
    // Генерируем историю за последние 12 месяцев
    for (let i = 1; i <= 12; i++) {
        const period = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const baseSalary = currentUser.salary || 80000;
        const variation = (Math.random() - 0.5) * 0.2; // ±10% вариация
        const grossAmount = baseSalary * (1 + variation);
        const deductions = grossAmount * 0.14; // 14% на налоги и взносы
        const netAmount = grossAmount - deductions;
        
        // Определяем статус
        let status = 'paid';
        if (i === 1) status = 'processing';
        else if (i === 2) status = 'pending';
        
        historyData.push({
            id: Date.now() + i,
            userId: currentUser.id,
            period: period.toISOString(),
            workedHours: 160 + Math.floor(Math.random() * 40),
            grossAmount: Math.round(grossAmount),
            deductions: Math.round(deductions),
            netAmount: Math.round(netAmount),
            paymentDate: new Date(period.getFullYear(), period.getMonth() + 1, 10).toISOString(),
            status: status
        });
    }
    
    localStorage.setItem('paymentHistory', JSON.stringify(historyData));
}

function updatePaymentHistoryTable(history) {
    const tableBody = document.getElementById('paymentHistoryBody');
    if (!tableBody) return;
    
    if (history.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-empty">
                    <i class="fas fa-receipt"></i>
                    <h3>Нет данных</h3>
                    <p>История выплат за выбранный период отсутствует</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = history.map(payment => {
        const period = new Date(payment.period);
        const paymentDate = new Date(payment.paymentDate);
        const statusBadge = getPaymentStatusBadge(payment.status);
        
        return `
            <tr>
                <td>${formatPeriod(period)}</td>
                <td>${payment.workedHours}ч</td>
                <td>${formatCurrency(payment.grossAmount)}</td>
                <td>${formatCurrency(payment.deductions)}</td>
                <td><strong>${formatCurrency(payment.netAmount)}</strong></td>
                <td>${paymentDate.toLocaleDateString('ru-RU')}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="downloadPayslip(${payment.id})" title="Скачать листок">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="viewPaymentDetails(${payment.id})" title="Подробности">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getPaymentStatusBadge(status) {
    const statusMap = {
        'paid': '<span class="payment-status paid"><i class="fas fa-check"></i> Выплачено</span>',
        'pending': '<span class="payment-status pending"><i class="fas fa-clock"></i> Ожидает</span>',
        'processing': '<span class="payment-status processing"><i class="fas fa-spinner"></i> Обработка</span>'
    };
    
    return statusMap[status] || '<span class="payment-status pending">Неизвестно</span>';
}

// ===== НАЛОГОВЫЕ ВЫЧЕТЫ =====
function loadTaxDeductions() {
    // Демо-данные для налоговых вычетов
    if (!localStorage.getItem('taxDeductions')) {
        generateTaxDeductionsDemo();
    }
    
    const deductions = JSON.parse(localStorage.getItem('taxDeductions') || '[]');
    const userDeductions = deductions.filter(deduction => deduction.userId === currentUser?.id);
    
    // Обновляем интерфейс (карточки уже есть в HTML)
    console.log('Загружены налоговые вычеты:', userDeductions);
}

function generateTaxDeductionsDemo() {
    if (!currentUser) return;
    
    const demoDeductions = [
        {
            id: 1,
            userId: currentUser.id,
            type: 'standard',
            amount: 2800,
            description: 'Стандартный вычет на детей',
            status: 'active',
            documents: []
        },
        {
            id: 2,
            userId: currentUser.id,
            type: 'social',
            amount: 50000,
            description: 'Социальный вычет на обучение',
            status: 'pending',
            documents: []
        },
        {
            id: 3,
            userId: currentUser.id,
            type: 'property',
            amount: 2000000,
            description: 'Имущественный вычет при покупке квартиры',
            status: 'completed',
            documents: []
        }
    ];
    
    localStorage.setItem('taxDeductions', JSON.stringify(demoDeductions));
}

function showDeductionModal() {
    const modal = document.getElementById('deductionModal');
    if (modal) {
        // Сбрасываем форму
        document.getElementById('deductionForm').reset();
        showModal('deductionModal');
    }
}

function saveDeduction() {
    const form = document.getElementById('deductionForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const deduction = {
        id: Date.now(),
        userId: currentUser.id,
        type: document.getElementById('deductionType').value,
        amount: parseFloat(document.getElementById('deductionAmount').value),
        description: document.getElementById('deductionDescription').value,
        status: 'pending',
        documents: [], // Здесь можно добавить обработку файлов
        createdAt: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    const deductions = JSON.parse(localStorage.getItem('taxDeductions') || '[]');
    deductions.push(deduction);
    localStorage.setItem('taxDeductions', JSON.stringify(deductions));
    
    // Закрываем модальное окно
    closeModal('deductionModal');
    
    // Показываем уведомление
    showNotification('Успешно', 'Заявка на вычет отправлена', 'success');
    
    // Перезагружаем данные
    loadTaxDeductions();
}

// ===== ЭКСПОРТ И ПЕЧАТЬ =====
function downloadPayslip(paymentId = null) {
    // Создаем PDF расчетного листка
    const payslipData = paymentId ? getPaymentById(paymentId) : salaryData;
    
    // Для демо просто показываем уведомление
    showNotification('Экспорт', 'Расчетный листок загружен', 'success');
    
    // Здесь можно добавить реальную генерацию PDF
    console.log('Скачивание расчетного листка:', payslipData);
}

function printPayslip() {
    // Открываем диалог печати
    window.print();
}

function viewPaymentDetails(paymentId) {
    const payment = getPaymentById(paymentId);
    if (payment) {
        // Показываем детали выплаты (можно создать модальное окно)
        showNotification('Информация', `Детали выплаты за ${formatPeriod(new Date(payment.period))}`, 'info');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function loadPayrollData() {
    // Инициализируем демо-данные если нужно
    if (!localStorage.getItem('payrollSettings')) {
        const defaultSettings = {
            standardHours: 160,
            overtimeMultiplier: 1.5,
            taxRate: 13,
            socialRate: 1
        };
        localStorage.setItem('payrollSettings', JSON.stringify(defaultSettings));
    }
}

function updateCalculationDate() {
    const calculationDate = document.getElementById('calculationDate');
    if (calculationDate) {
        calculationDate.textContent = new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('RUB', '₽');
}

function formatPeriod(date) {
    return new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function getPaymentById(paymentId) {
    const history = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
    return history.find(payment => payment.id === paymentId);
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
window.calculateSalary = calculateSalary;
window.changePeriod = changePeriod;
window.loadPaymentHistory = loadPaymentHistory;
window.downloadPayslip = downloadPayslip;
window.printPayslip = printPayslip;
window.viewPaymentDetails = viewPaymentDetails;
window.showDeductionModal = showDeductionModal;
window.saveDeduction = saveDeduction;