// ===== КАЛЕНДАРЬ - УПРАВЛЕНИЕ СОБЫТИЯМИ =====

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.selectedDate = null;
        this.editingEvent = null;
        
        this.init();
    }

    init() {
        this.loadEvents();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateCurrentMonthTitle();
    }

    // ===== ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ =====
    loadEvents() {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        } else {
            // Демо события
            this.events = [
                {
                    id: 1,
                    title: 'Встреча с командой',
                    type: 'meeting',
                    date: '2025-06-02',
                    time: '10:00',
                    duration: 60,
                    location: 'Кабинет 205',
                    description: 'Еженедельная встреча команды разработки',
                    priority: 'medium',
                    reminder: true
                },
                {
                    id: 2,
                    title: 'Дедлайн проекта TimeTracker',
                    type: 'deadline',
                    date: '2025-06-05',
                    time: '18:00',
                    duration: 0,
                    location: '',
                    description: 'Завершение разработки основного функционала',
                    priority: 'high',
                    reminder: true
                },
                {
                    id: 3,
                    title: 'День защиты детей',
                    type: 'holiday',
                    date: '2025-06-01',
                    time: '',
                    duration: 0,
                    location: '',
                    description: 'Международный день защиты детей',
                    priority: 'low',
                    reminder: false
                }
            ];
            this.saveEvents();
        }
    }

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    setupEventListeners() {
        // Навигация по месяцам
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.navigateMonth(-1);
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.navigateMonth(1);
        });

        document.getElementById('todayBtn').addEventListener('click', () => {
            this.goToToday();
        });

        // Переключение видов
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Модальное окно
        document.querySelector('#eventModal .modal-close').addEventListener('click', () => {
            this.closeEventModal();
        });

        // Форма события
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Фильтр событий
        document.getElementById('eventTypeFilter').addEventListener('change', (e) => {
            this.filterEvents(e.target.value);
        });
    }

    // ===== НАВИГАЦИЯ =====
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
        this.updateCurrentMonthTitle();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
        this.updateCurrentMonthTitle();
    }

    switchView(view) {
        this.currentView = view;
        
        // Обновляем активную кнопку
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Показываем нужный вид
        document.querySelectorAll('.calendar-view').forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(`${view}View`).classList.remove('hidden');

        // Рендерим соответствующий вид
        switch(view) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }

    // ===== РЕНДЕРИНГ КАЛЕНДАРЯ =====
    renderCalendar() {
        switch(this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
        this.renderEventsList();
    }

    renderMonthView() {
        const calendar = document.getElementById('calendarDays');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Первый день месяца и последний день предыдущего месяца
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Понедельник = 1
        
        let html = '';
        let dayCount = 1;
        
        // Заполняем календарь
        for (let week = 0; week < 6; week++) {
            for (let day = 1; day <= 7; day++) {
                const cellDate = new Date(year, month, dayCount - firstDayWeek + day);
                const isCurrentMonth = cellDate.getMonth() === month;
                const isToday = this.isToday(cellDate);
                const dayEvents = this.getEventsForDate(cellDate);
                
                let classes = 'calendar-day';
                if (!isCurrentMonth) classes += ' other-month';
                if (isToday) classes += ' today';
                
                html += `
                    <div class="${classes}" data-date="${this.formatDate(cellDate)}" onclick="calendar.selectDate('${this.formatDate(cellDate)}')">
                        <div class="day-number">${cellDate.getDate()}</div>
                        <div class="day-events">
                            ${this.renderDayEvents(dayEvents)}
                        </div>
                    </div>
                `;
            }
            
            // Прерываем, если дошли до конца месяца
            if (dayCount - firstDayWeek + 7 > lastDay.getDate()) break;
        }
        
        calendar.innerHTML = html;
    }

    renderWeekView() {
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const weekDays = document.getElementById('weekDays');
        const weekGrid = document.getElementById('weekGrid');
        
        // Заголовки дней недели
        let daysHtml = '';
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const isToday = this.isToday(day);
            
            daysHtml += `
                <div class="week-day-header ${isToday ? 'today' : ''}">
                    <div class="week-day-name">${this.getDayName(day)}</div>
                    <div class="week-day-number">${day.getDate()}</div>
                </div>
            `;
        }
        weekDays.innerHTML = daysHtml;
        
        // Сетка времени
        let gridHtml = '<div class="time-slots">';
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="time-slot">${hour.toString().padStart(2, '0')}:00</div>`;
        }
        gridHtml += '</div>';
        
        gridHtml += '<div class="week-days-grid">';
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayEvents = this.getEventsForDate(day);
            
            gridHtml += '<div class="week-day-column">';
            for (let hour = 0; hour < 24; hour++) {
                gridHtml += `<div class="week-hour-slot" data-date="${this.formatDate(day)}" data-hour="${hour}"></div>`;
            }
            gridHtml += '</div>';
        }
        gridHtml += '</div>';
        
        weekGrid.innerHTML = gridHtml;
        
        // Добавляем события
        this.renderWeekEvents(startOfWeek);
    }

    renderDayView() {
        const dayTitle = document.getElementById('dayTitle');
        const dayGrid = document.getElementById('dayGrid');
        
        dayTitle.textContent = this.formatDayTitle(this.currentDate);
        
        let gridHtml = '<div class="day-time-slots">';
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="day-time-slot">${hour.toString().padStart(2, '0')}:00</div>`;
        }
        gridHtml += '</div>';
        
        gridHtml += '<div class="day-events-column">';
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="day-hour-slot" data-hour="${hour}"></div>`;
        }
        gridHtml += '</div>';
        
        dayGrid.innerHTML = gridHtml;
        
        // Добавляем события дня
        this.renderDayEvents(this.currentDate);
    }

    renderDayEvents(events) {
        if (events.length === 0) return '';
        
        const maxVisible = 3;
        let html = '';
        
        for (let i = 0; i < Math.min(events.length, maxVisible); i++) {
            const event = events[i];
            html += `
                <div class="event-item event-${event.type}" onclick="calendar.editEvent(${event.id})">
                    ${event.title}
                </div>
            `;
        }
        
        if (events.length > maxVisible) {
            html += `<div class="more-events">+${events.length - maxVisible} еще</div>`;
        }
        
        return html;
    }

    renderWeekEvents(startOfWeek) {
        // Реализация для недельного вида
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayEvents = this.getEventsForDate(day);
            
            dayEvents.forEach(event => {
                if (event.time) {
                    const [hour, minute] = event.time.split(':').map(Number);
                    const slot = document.querySelector(
                        `[data-date="${this.formatDate(day)}"][data-hour="${hour}"]`
                    );
                    
                    if (slot) {
                        const eventElement = document.createElement('div');
                        eventElement.className = `week-event event-${event.type}`;
                        eventElement.innerHTML = `
                            <div class="event-title">${event.title}</div>
                            <div class="event-time">${event.time}</div>
                        `;
                        eventElement.style.height = `${Math.max(event.duration / 60 * 60, 30)}px`;
                        eventElement.onclick = () => this.editEvent(event.id);
                        
                        slot.appendChild(eventElement);
                    }
                }
            });
        }
    }

    renderDayEvents(date) {
        const dayEvents = this.getEventsForDate(date);
        
        dayEvents.forEach(event => {
            if (event.time) {
                const [hour, minute] = event.time.split(':').map(Number);
                const slot = document.querySelector(`[data-hour="${hour}"]`);
                
                if (slot) {
                    const eventElement = document.createElement('div');
                    eventElement.className = `day-event event-${event.type}`;
                    eventElement.innerHTML = `
                        <div class="day-event-title">${event.title}</div>
                        <div class="day-event-time">${event.time} - ${this.calculateEndTime(event.time, event.duration)}</div>
                    `;
                    eventElement.style.height = `${Math.max(event.duration / 60 * 80, 40)}px`;
                    eventElement.onclick = () => this.editEvent(event.id);
                    
                    slot.appendChild(eventElement);
                }
            }
        });
    }

    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        const currentFilter = document.getElementById('eventTypeFilter').value;
        
        let filteredEvents = this.events;
        if (currentFilter) {
            filteredEvents = this.events.filter(event => event.type === currentFilter);
        }
        
        // Сортируем по дате и времени
        filteredEvents.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateA - dateB;
        });
        
        if (filteredEvents.length === 0) {
            eventsList.innerHTML = '<div class="no-events">Нет событий для отображения</div>';
            return;
        }
        
        const html = filteredEvents.map(event => `
            <div class="event-list-item" onclick="calendar.editEvent(${event.id})">
                <div class="event-color-indicator event-${event.type}"></div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-details">
                        <div class="event-time-info">
                            <i class="fas fa-clock"></i>
                            <span>${this.formatEventDate(event.date)} ${event.time || 'Весь день'}</span>
                        </div>
                        ${event.location ? `
                            <div class="event-location-info">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.location}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        eventsList.innerHTML = html;
    }

    // ===== УПРАВЛЕНИЕ СОБЫТИЯМИ =====
    selectDate(dateString) {
        this.selectedDate = dateString;
        this.openEventModal();
    }

    openEventModal(eventId = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('eventForm');
        
        this.editingEvent = eventId;
        
        if (eventId) {
            // Редактирование существующего события
            const event = this.events.find(e => e.id === eventId);
            modalTitle.textContent = 'Редактировать событие';
            this.populateForm(event);
        } else {
            // Создание нового события
            modalTitle.textContent = 'Новое событие';
            form.reset();
            if (this.selectedDate) {
                document.getElementById('eventDate').value = this.selectedDate;
            }
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.editingEvent = null;
        this.selectedDate = null;
    }

    populateForm(event) {
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventPriority').value = event.priority;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDuration').value = event.duration;
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventReminder').checked = event.reminder;
    }

    saveEvent() {
        const formData = new FormData(document.getElementById('eventForm'));
        const eventData = Object.fromEntries(formData.entries());
        eventData.reminder = document.getElementById('eventReminder').checked;
        eventData.duration = parseInt(eventData.duration) || 60;
        
        if (this.editingEvent) {
            // Обновляем существующее событие
            const eventIndex = this.events.findIndex(e => e.id === this.editingEvent);
            this.events[eventIndex] = { ...this.events[eventIndex], ...eventData };
        } else {
            // Создаем новое событие
            const newEvent = {
                id: Date.now(),
                ...eventData
            };
            this.events.push(newEvent);
        }
        
        this.saveEvents();
        this.renderCalendar();
        this.closeEventModal();
        
        const message = this.editingEvent ? 'Событие обновлено' : 'Событие создано';
        showNotification('Успешно', message, 'success');
    }

    editEvent(eventId) {
        this.openEventModal(eventId);
    }

    deleteEvent(eventId) {
        if (confirm('Вы уверены, что хотите удалить это событие?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderCalendar();
            this.closeEventModal();
            showNotification('Успешно', 'Событие удалено', 'success');
        }
    }

    filterEvents(type) {
        this.renderEventsList();
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    getEventsForDate(date) {
        const dateString = this.formatDate(date);
        return this.events.filter(event => event.date === dateString);
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getStartOfWeek(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
        startOfWeek.setDate(diff);
        return startOfWeek;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatEventDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short'
        });
    }

    formatDayTitle(date) {
        return date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    getDayName(date) {
        return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }

    updateCurrentMonthTitle() {
        const monthTitle = document.getElementById('currentMonth');
        monthTitle.textContent = this.currentDate.toLocaleDateString('ru-RU', {
            month: 'long',
            year: 'numeric'
        });
    }

    calculateEndTime(startTime, duration) {
        if (!startTime || !duration) return '';
        
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
let calendar;

function openEventModal() {
    calendar.openEventModal();
}

function closeEventModal() {
    calendar.closeEventModal();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    calendar = new CalendarManager();
    
    // Устанавливаем обработчик для клика вне модального окна
    document.getElementById('eventModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEventModal();
        }
    });
});

// ===== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.calendar = calendar;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;