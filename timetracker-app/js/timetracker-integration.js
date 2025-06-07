// Обновленные функции для работы с API
async function checkIn() {
    try {
        const response = await api.checkIn();
        
        if (response.success) {
            // Обновляем интерфейс
            showCheckOutCard();
            startWorkTimer();
            
            // Показываем уведомление
            showNotification('Приход отмечен', `Время прихода: ${formatTime(new Date(response.data.checkIn))}`, 'success');
            
            // Обновляем текущую сессию
            checkInTime = new Date(response.data.checkIn);
        } else {
            throw new Error(response.message || 'Ошибка отметки прихода');
        }
    } catch (error) {
        console.error('Check-in error:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

async function checkOut() {
    try {
        const breakTime = 60; // По умолчанию 1 час
        const notes = ''; // Можно добавить поле для заметок
        
        const response = await api.checkOut(breakTime, notes);
        
        if (response.success) {
            // Обновляем интерфейс
            showCheckInCard();
            stopWorkTimer();
            
            // Показываем уведомление
            const hours = Math.floor(response.data.totalTime / 60);
            const minutes = response.data.totalTime % 60;
            showNotification('Уход отмечен', `Отработано: ${hours}ч ${minutes}м`, 'success');
            
            // Обновляем статистику
            updateDashboardStats();
        } else {
            throw new Error(response.message || 'Ошибка отметки ухода');
        }
    } catch (error) {
        console.error('Check-out error:', error);
        showNotification('Ошибка', error.message, 'error');
    }
}

// Проверка активной сессии при загрузке
async function checkActiveWorkSession() {
    try {
        const response = await api.getCurrentSession();
        
        if (response.success && response.data.isActive) {
            // Есть активная сессия
            checkInTime = new Date(response.data.checkIn);
            showCheckOutCard();
            startWorkTimer();
        }
    } catch (error) {
        console.error('Error checking active session:', error);
    }
}

// Загрузка статистики с сервера
async function updateDashboardStats() {
    try {
        // Получаем статистику за разные периоды
        const [todayStats, weekStats, monthStats] = await Promise.all([
            api.getTimesheetStats('today'),
            api.getTimesheetStats('week'),
            api.getTimesheetStats('month')
        ]);

        // Обновляем элементы интерфейса
        if (todayStats.success) {
            const todayElement = document.getElementById('todayHours');
            if (todayElement) {
                todayElement.textContent = todayStats.data.total_time.formatted;
            }
        }

        if (weekStats.success) {
            const weekElement = document.getElementById('weekHours');
            if (weekElement) {
                weekElement.textContent = weekStats.data.total_time.formatted;
            }
        }

        if (monthStats.success) {
            const monthElement = document.getElementById('monthHours');
            if (monthElement) {
                monthElement.textContent = monthStats.data.total_time.formatted;
            }

            // Расчет зарплаты на основе отработанных часов
            if (currentUser && currentUser.salary) {
                const hoursWorked = monthStats.data.total_time.total_minutes / 60;
                const hourlyRate = currentUser.salary / 160; // 160 часов в месяц
                const currentSalary = Math.round(hoursWorked * hourlyRate);
                
                const salaryElement = document.getElementById('currentSalary');
                if (salaryElement) {
                    salaryElement.textContent = `${currentSalary.toLocaleString('ru-RU')}₽`;
                }
            }
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Загрузка последних записей
async function loadRecentRecords() {
    try {
        const response = await api.getTimesheetRecords(null, null, 5);
        
        if (response.success) {
            const tbody = document.getElementById('recentRecords');
            if (tbody && response.data.length > 0) {
                tbody.innerHTML = response.data.map(record => {
                    const checkIn = record.checkIn ? formatTime(new Date(record.checkIn)) : '-';
                    const checkOut = record.checkOut ? formatTime(new Date(record.checkOut)) : '-';
                    const duration = record.totalTime ? formatDuration(record.totalTime * 60000) : '-';
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
    } catch (error) {
        console.error('Error loading recent records:', error);
    }
}