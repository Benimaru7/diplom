// ===== АНАЛИТИКА И МЕТРИКИ =====

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.data = {};
        this.filters = {
            period: 'month',
            department: 'all',
            employee: 'all'
        };
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
    }

    async loadData() {
        try {
            // Загружаем данные из JSON файлов
            const [employees, payroll, timesheet] = await Promise.all([
                fetch('data/employees.json').then(r => r.json()),
                fetch('data/payroll-rates.json').then(r => r.json()),
                fetch('data/timesheet.json').then(r => r.json())
            ]);

            this.data = {
                employees: employees.employees,
                payroll: payroll.payrollCalculations,
                timesheet: timesheet.employeeTimesheets,
                departments: employees.departments
            };
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showError('Не удалось загрузить данные для аналитики');
        }
    }

    setupEventListeners() {
        // Фильтры периода
        const periodFilter = document.getElementById('analytics-period');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.filters.period = e.target.value;
                this.updateCharts();
            });
        }

        // Фильтр отделов
        const deptFilter = document.getElementById('analytics-department');
        if (deptFilter) {
            deptFilter.addEventListener('change', (e) => {
                this.filters.department = e.target.value;
                this.updateCharts();
            });
        }

        // Экспорт отчетов
        const exportBtn = document.getElementById('export-analytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    renderDashboard() {
        this.renderKPICards();
        this.renderAttendanceChart();
        this.renderSalaryChart();
        this.renderProductivityChart();
        this.renderDepartmentComparison();
        this.renderTopPerformers();
    }

    renderKPICards() {
        const kpiContainer = document.getElementById('kpi-cards');
        if (!kpiContainer) return;

        const kpis = this.calculateKPIs();
        
        kpiContainer.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card kpi-primary">
                    <div class="kpi-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">${kpis.totalEmployees}</div>
                        <div class="kpi-label">Всего сотрудников</div>
                        <div class="kpi-change positive">+2 за месяц</div>
                    </div>
                </div>

                <div class="kpi-card kpi-success">
                    <div class="kpi-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">${kpis.avgHoursWorked}ч</div>
                        <div class="kpi-label">Средние часы работы</div>
                        <div class="kpi-change ${kpis.hoursChange >= 0 ? 'positive' : 'negative'}">
                            ${kpis.hoursChange >= 0 ? '+' : ''}${kpis.hoursChange}ч за месяц
                        </div>
                    </div>
                </div>

                <div class="kpi-card kpi-warning">
                    <div class="kpi-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">${this.formatMoney(kpis.totalPayroll)}</div>
                        <div class="kpi-label">Общий фонд зарплаты</div>
                        <div class="kpi-change positive">+3.2% за месяц</div>
                    </div>
                </div>

                <div class="kpi-card kpi-info">
                    <div class="kpi-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-value">${kpis.productivity}%</div>
                        <div class="kpi-label">Производительность</div>
                        <div class="kpi-change positive">+1.8% за месяц</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAttendanceChart() {
        const ctx = document.getElementById('attendance-chart');
        if (!ctx) return;

        const attendanceData = this.getAttendanceData();
        
        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: attendanceData.labels,
                datasets: [{
                    label: 'Посещаемость (%)',
                    data: attendanceData.values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Посещаемость сотрудников'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    renderSalaryChart() {
        const ctx = document.getElementById('salary-chart');
        if (!ctx) return;

        const salaryData = this.getSalaryDistribution();
        
        this.charts.salary = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: salaryData.labels,
                datasets: [{
                    data: salaryData.values,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#06b6d4'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Распределение зарплат по отделам'
                    }
                }
            }
        });
    }

    renderProductivityChart() {
        const ctx = document.getElementById('productivity-chart');
        if (!ctx) return;

        const productivityData = this.getProductivityData();
        
        this.charts.productivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: productivityData.labels,
                datasets: [{
                    label: 'Производительность (%)',
                    data: productivityData.values,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Производительность по отделам'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 120,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    renderDepartmentComparison() {
        const container = document.getElementById('department-comparison');
        if (!container) return;

        const departments = this.getDepartmentStats();
        
        container.innerHTML = `
            <div class="comparison-grid">
                ${departments.map(dept => `
                    <div class="department-card">
                        <div class="dept-header">
                            <h4>${dept.name}</h4>
                            <span class="employee-count">${dept.employeeCount} сотр.</span>
                        </div>
                        <div class="dept-metrics">
                            <div class="metric">
                                <span class="metric-label">Средняя зарплата</span>
                                <span class="metric-value">${this.formatMoney(dept.avgSalary)}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Производительность</span>
                                <span class="metric-value">${dept.productivity}%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Посещаемость</span>
                                <span class="metric-value">${dept.attendance}%</span>
                            </div>
                        </div>
                        <div class="dept-progress">
                            <div class="progress-bar" style="width: ${dept.productivity}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTopPerformers() {
        const container = document.getElementById('top-performers');
        if (!container) return;

        const topPerformers = this.getTopPerformers();
        
        container.innerHTML = `
            <div class="performers-list">
                ${topPerformers.map((performer, index) => `
                    <div class="performer-item">
                        <div class="performer-rank">${index + 1}</div>
                        <div class="performer-avatar">
                            <img src="${performer.avatar}" alt="${performer.name}">
                        </div>
                        <div class="performer-info">
                            <div class="performer-name">${performer.name}</div>
                            <div class="performer-position">${performer.position}</div>
                        </div>
                        <div class="performer-metrics">
                            <div class="metric-item">
                                <span class="metric-label">Часы</span>
                                <span class="metric-value">${performer.hoursWorked}ч</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Эффективность</span>
                                <span class="metric-value">${performer.efficiency}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Вспомогательные методы для расчета данных
    calculateKPIs() {
        return {
            totalEmployees: this.data.employees.length,
            avgHoursWorked: Math.round(this.data.timesheet.reduce((sum, emp) => sum + emp.summary.actualHours, 0) / this.data.timesheet.length),
            hoursChange: 12,
            totalPayroll: this.data.payroll.reduce((sum, emp) => sum + emp.netSalary, 0),
            productivity: Math.round(this.data.timesheet.reduce((sum, emp) => sum + emp.summary.efficiency, 0) / this.data.timesheet.length)
        };
    }

    getAttendanceData() {
        // Генерируем данные посещаемости за последние 30 дней
        const labels = [];
        const values = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
            values.push(Math.round(92 + Math.random() * 8)); // 92-100%
        }
        
        return { labels, values };
    }

    getSalaryDistribution() {
        const departments = this.data.departments;
        const payrollByDept = {};
        
        // Группируем зарплаты по отделам
        this.data.payroll.forEach(emp => {
            const employee = this.data.employees.find(e => e.id === emp.employeeId);
            if (employee) {
                const dept = employee.workInfo.department;
                payrollByDept[dept] = (payrollByDept[dept] || 0) + emp.netSalary;
            }
        });
        
        return {
            labels: Object.keys(payrollByDept),
            values: Object.values(payrollByDept)
        };
    }

    getProductivityData() {
        const deptProductivity = {};
        const deptCounts = {};
        
        this.data.timesheet.forEach(emp => {
            const employee = this.data.employees.find(e => e.id === emp.employeeId);
            if (employee) {
                const dept = employee.workInfo.department;
                deptProductivity[dept] = (deptProductivity[dept] || 0) + emp.summary.efficiency;
                deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            }
        });
        
        const labels = Object.keys(deptProductivity);
        const values = labels.map(dept => Math.round(deptProductivity[dept] / deptCounts[dept]));
        
        return { labels, values };
    }

    getDepartmentStats() {
        const departments = [];
        
        this.data.departments.forEach(dept => {
            const deptEmployees = this.data.employees.filter(emp => emp.workInfo.department === dept.name);
            const deptPayroll = this.data.payroll.filter(pay => {
                const emp = this.data.employees.find(e => e.id === pay.employeeId);
                return emp && emp.workInfo.department === dept.name;
            });
            const deptTimesheet = this.data.timesheet.filter(time => {
                const emp = this.data.employees.find(e => e.id === time.employeeId);
                return emp && emp.workInfo.department === dept.name;
            });
            
            const avgSalary = deptPayroll.length > 0 
                ? Math.round(deptPayroll.reduce((sum, pay) => sum + pay.netSalary, 0) / deptPayroll.length)
                : 0;
                
            const productivity = deptTimesheet.length > 0
                ? Math.round(deptTimesheet.reduce((sum, time) => sum + time.summary.efficiency, 0) / deptTimesheet.length)
                : 0;
            
            departments.push({
                name: dept.name,
                employeeCount: deptEmployees.length,
                avgSalary,
                productivity,
                attendance: Math.round(95 + Math.random() * 5) // 95-100%
            });
        });
        
        return departments;
    }

    getTopPerformers() {
        return this.data.timesheet
            .map(timesheet => {
                const employee = this.data.employees.find(emp => emp.id === timesheet.employeeId);
                return {
                    name: employee ? employee.personalInfo.firstName + ' ' + employee.personalInfo.lastName : 'Неизвестно',
                    position: employee ? employee.workInfo.position : 'Неизвестно',
                    avatar: employee ? employee.avatar : 'assets/images/avatars/default.png',
                    hoursWorked: timesheet.summary.actualHours,
                    efficiency: timesheet.summary.efficiency
                };
            })
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 5);
    }

    updateCharts() {
        // Обновляем все графики при изменении фильтров
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update();
            }
        });
        
        // Обновляем остальные компоненты
        this.renderKPICards();
        this.renderDepartmentComparison();
        this.renderTopPerformers();
    }

    exportReport() {
        // Функция экспорта отчета (будет реализована в export.js)
        if (window.ExportManager) {
            const exportManager = new ExportManager();
            exportManager.exportAnalyticsReport(this.data, this.filters);
        } else {
            this.showNotification('Функция экспорта будет доступна в следующей версии', 'info');
        }
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KGS',
            minimumFractionDigits: 0
        }).format(amount);
    }

    showError(message) {
        console.error(message);
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-error';
        errorContainer.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">Ошибка загрузки данных</div>
                <div class="alert-message">${message}</div>
            </div>
        `;
        
        const container = document.querySelector('.analytics-container') || document.body;
        container.insertBefore(errorContainer, container.firstChild);
    }

    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений
        if (window.showNotification) {
            window.showNotification('Информация', message, type);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.analytics-container')) {
        window.analyticsManager = new AnalyticsManager();
    }
});

// Экспорт для использования в других модулях
window.AnalyticsManager = AnalyticsManager;