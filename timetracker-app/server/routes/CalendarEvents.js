// server/models/CalendarEvent.js
const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
    userId: { // Кто создал или к кому относится событие (если персональное)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Ссылка на модель User
        // required: true, // Может быть необязательным для общих событий (праздники)
    },
    title: {
        type: String,
        required: [true, 'Пожалуйста, укажите название события'],
        trim: true,
    },
    type: { // Тип события: 'vacation', 'sick_leave', 'public_holiday', 'meeting', 'other'
        type: String,
        required: [true, 'Пожалуйста, укажите тип события'],
        enum: ['vacation', 'sick_leave', 'public_holiday', 'meeting', 'reminder', 'other'],
        default: 'other',
    },
    startDate: {
        type: Date,
        required: [true, 'Пожалуйста, укажите дату начала'],
    },
    endDate: {
        type: Date,
        // required: [true, 'Пожалуйста, укажите дату окончания'], // Может быть = startDate
    },
    isAllDay: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: { // Для событий типа 'vacation' или 'sick_leave'
        type: String,
        enum: ['pending', 'approved', 'rejected', null],
        default: null,
    },
    // Можно добавить цвет для отображения в календаре
    color: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Убедимся, что endDate не раньше startDate
CalendarEventSchema.pre('save', function(next) {
    if (this.endDate && this.startDate > this.endDate) {
        next(new Error('Дата окончания не может быть раньше даты начала.'));
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
// server/routes/CalendarEvents.js
const express = require('express');
const router = express.Router();

// Пока нет базы данных, будем использовать mock-данные
// В реальном приложении здесь будет импорт модели:
// const CalendarEvent = require('../models/CalendarEvent');
// const authMiddleware = require('../middleware/auth'); // Предполагаем, что есть middleware для аутентификации

let mockEvents = [
    {
        id: '1',
        userId: 'userId1', // ID пользователя
        title: 'Отпуск',
        type: 'vacation',
        startDate: new Date('2025-07-15T00:00:00.000Z'),
        endDate: new Date('2025-07-20T23:59:59.000Z'),
        isAllDay: true,
        description: 'Ежегодный оплачиваемый отпуск',
        status: 'approved',
        color: '#2563eb' // Синий для отпуска
    },
    {
        id: '2',
        userId: null, // Общее событие
        title: 'День Независимости',
        type: 'public_holiday',
        startDate: new Date('2025-07-04T00:00:00.000Z'),
        endDate: new Date('2025-07-04T23:59:59.000Z'),
        isAllDay: true,
        description: 'Государственный праздник',
        status: null,
        color: '#10b981' // Зеленый для праздников
    },
    {
        id: '3',
        userId: 'userId2',
        title: 'Больничный',
        type: 'sick_leave',
        startDate: new Date('2025-06-10T00:00:00.000Z'),
        endDate: new Date('2025-06-12T23:59:59.000Z'),
        isAllDay: true,
        description: 'По болезни',
        status: 'pending',
        color: '#f59e0b' // Оранжевый для больничных
    }
];
let nextEventId = 4; // Для генерации ID для mock-данных

// MIDDLEWARE (пример)
// Защищаем все роуты в этом файле (если нужно)
// router.use(authMiddleware);


// GET /api/calendar-events - Получить все события (с возможностью фильтрации)
router.get('/', (req, res) => {
    // Здесь можно добавить логику фильтрации по дате, пользователю, типу и т.д.
    // Например, req.query.userId, req.query.startDate, req.query.endDate
    // В реальном приложении:
    // const events = await CalendarEvent.find(filters).populate('userId', 'name email');
    res.status(200).json({ success: true, data: mockEvents });
});

// GET /api/calendar-events/:id - Получить одно событие по ID
router.get('/:id', (req, res) => {
    const event = mockEvents.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }
    // В реальном приложении:
    // const event = await CalendarEvent.findById(req.params.id).populate('userId', 'name email');
    // if (!event) { /* ... */ }
    // Здесь также можно добавить проверку прав доступа (например, пользователь может видеть только свои события или события отдела)
    res.status(200).json({ success: true, data: event });
});

// POST /api/calendar-events - Создать новое событие
router.post('/', (req, res) => {
    const { title, type, startDate, endDate, isAllDay, description, status, color /*, userId */ } = req.body;

    if (!title || !type || !startDate) {
        return res.status(400).json({ success: false, message: 'Пожалуйста, укажите название, тип и дату начала события' });
    }

    // В реальном приложении userId будет браться из req.user (после authMiddleware)
    // const userIdFromToken = req.user.id;

    const newEvent = {
        id: String(nextEventId++),
        // userId: userId || userIdFromToken, // Если не передано, берем из токена
        userId: req.body.userId || 'mockUserId', // Заглушка для userId
        title,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate), // Если endDate нет, событие на один день
        isAllDay: isAllDay !== undefined ? isAllDay : true,
        description,
        status: type === 'vacation' || type === 'sick_leave' ? (status || 'pending') : null,
        color,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // В реальном приложении:
    // try {
    //     const event = await CalendarEvent.create(newEvent);
    //     res.status(201).json({ success: true, data: event });
    // } catch (error) {
    //     res.status(400).json({ success: false, message: error.message });
    // }
    mockEvents.push(newEvent);
    res.status(201).json({ success: true, data: newEvent });
});

// PUT /api/calendar-events/:id - Обновить событие
router.put('/:id', (req, res) => {
    const eventIndex = mockEvents.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    // Здесь также нужна проверка прав доступа (может ли текущий пользователь редактировать это событие)

    const updatedEventData = { ...mockEvents[eventIndex], ...req.body, updatedAt: new Date() };
    
    // Преобразование дат, если они пришли строками
    if (req.body.startDate) updatedEventData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updatedEventData.endDate = new Date(req.body.endDate);


    // В реальном приложении:
    // try {
    //     const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, {
    //         new: true, // Вернуть обновленный документ
    //         runValidators: true // Запустить валидаторы Mongoose
    //     });
    //     if (!event) { /* ... */ }
    //     res.status(200).json({ success: true, data: event });
    // } catch (error) {
    //     res.status(400).json({ success: false, message: error.message });
    // }
    mockEvents[eventIndex] = updatedEventData;
    res.status(200).json({ success: true, data: updatedEventData });
});

// DELETE /api/calendar-events/:id - Удалить событие
router.delete('/:id', (req, res) => {
    const eventIndex = mockEvents.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Событие не найдено' });
    }

    // Проверка прав доступа

    // В реальном приложении:
    // try {
    //     const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    //     if (!event) { /* ... */ }
    //     res.status(200).json({ success: true, message: 'Событие удалено' }); // или 204 No Content
    // } catch (error) {
    //     res.status(500).json({ success: false, message: 'Ошибка сервера при удалении события' });
    // }
    mockEvents.splice(eventIndex, 1);
    res.status(200).json({ success: true, message: 'Событие удалено' });
});


// Если есть специфичные действия, например, одобрение/отклонение заявки на отпуск (админом)
// PUT /api/calendar-events/:id/approve
router.put('/:id/status', (req, res) => {
    // Предполагается, что этот роут доступен только админу/менеджеру
    // Здесь должен быть authMiddleware и проверка роли
    const { status } = req.body; // 'approved' or 'rejected'
    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Некорректный статус' });
    }

    const eventIndex = mockEvents.findIndex(e => e.id === req.params.id && (e.type === 'vacation' || e.type === 'sick_leave'));
    if (eventIndex === -1) {
        return res.status(404).json({ success: false, message: 'Событие для изменения статуса не найдено или неверный тип события' });
    }
    
    mockEvents[eventIndex].status = status;
    mockEvents[eventIndex].updatedAt = new Date();

    // В реальном приложении:
    // const event = await CalendarEvent.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    // ...

    res.status(200).json({ success: true, data: mockEvents[eventIndex] });
});


module.exports = router;
// server/app.js (или server.js)
// ... другие require
const express = require('express');
const path = require('path'); // если отдаете статику с бэкенда
// const connectDB = require('./config/database'); // Если есть подключение к БД

// ...
const calendarEventsRoutes = require('./routes/CalendarEvents');
// ... другие роуты (authRoutes, timesheetRoutes и т.д.)

const app = express();

// Подключение к БД
// connectDB();

// Middleware для парсинга JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ... другие middleware (CORS, логгер и т.д.)

// Подключение роутов
app.use('/api/auth', require('./routes/auth')); // Пример для аутентификации
app.use('/api/timesheets', require('./routes/timesheet')); // Пример для табелей
app.use('/api/calendar-events', calendarEventsRoutes); // <--- НАШ НОВЫЙ РОУТЕР
// ...

// Для отдачи статики (если фронтенд и бэкенд на одном сервере в продакшене)
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../public'))); // или путь к вашей сборке фронтенда
//   app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../public', 'index.html')));
// } else {
//   app.get('/', (req, res) => {
//     res.send('API is running...');
//   });
// }


const PORT = process.env.PORT || 5000; // Пример порта
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));