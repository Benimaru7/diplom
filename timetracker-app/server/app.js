// ===== ОСНОВНОЕ ПРИЛОЖЕНИЕ EXPRESS.JS =====

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const cors = require('cors');

// Импорт конфигурации
const config = require('./config/config');
const database = require('./config/database');

// Импорт middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const rateLimitMiddleware = require('./middleware/rateLimit');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const timesheetRoutes = require('./routes/timesheet');
const calendarRoutes = require('./routes/calendar');
const reportsRoutes = require('./routes/reports');
const payrollRoutes = require('./routes/payroll');
const settingsRoutes = require('./routes/settings');
const webhookRoutes = require('./routes/webhooks');

// Создание приложения Express
const app = express();

// ===== MIDDLEWARE КОНФИГУРАЦИЯ =====

// Безопасность
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS конфигурация
app.use(cors({
    origin: config.app.allowedOrigins || ['http://localhost:3000', 'https://timetracker.company.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Сжатие ответов
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Парсинг тела запросов
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование
if (config.app.env === 'production') {
    // Создание директории для логов
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Настройка Morgan для production
    const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
    app.use(morgan('combined', { stream: accessLogStream }));
} else {
    app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', rateLimitMiddleware.general);
app.use('/api/auth/login', rateLimitMiddleware.auth);
app.use('/api/auth/register', rateLimitMiddleware.auth);

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// ===== API МАРШРУТЫ =====

// Базовый маршрут для проверки здоровья
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: require('../package.json').version
    });
});

// API маршруты
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware.requireAuth, userRoutes);
app.use('/api/v1/timesheet', authMiddleware.requireAuth, timesheetRoutes);
app.use('/api/v1/calendar', authMiddleware.requireAuth, calendarRoutes);
app.use('/api/v1/reports', authMiddleware.requireAuth, reportsRoutes);
app.use('/api/v1/payroll', authMiddleware.requireAuth, payrollRoutes);
app.use('/api/v1/settings', authMiddleware.requireAuth, settingsRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Обслуживание SPA для фронтенда
app.use(express.static(path.join(__dirname, '../dist'), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Fallback для SPA маршрутизации
app.get('*', (req, res, next) => {
    // Пропускаем API маршруты
    if (req.url.startsWith('/api/') || req.url.startsWith('/health')) {
        return next();
    }
    
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Frontend not built. Run npm run build first.' });
    }
});

// ===== ОБРАБОТКА ОШИБОК =====

// 404 для API маршрутов
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'API endpoint not found',
            path: req.path
        }
    });
});

// Глобальный обработчик ошибок
app.use(errorHandler);

// ===== ОБРАБОТКА ПРОЦЕССА =====

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    // Закрытие сервера
    if (server) {
        server.close(() => {
            console.log('HTTP server closed.');
            
            // Закрытие подключения к базе данных
            database.close().then(() => {
                console.log('Database connection closed.');
                process.exit(0);
            }).catch(err => {
                console.error('Error closing database:', err);
                process.exit(1);
            });
        });
    }
    
    // Принудительное завершение через 10 секунд
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// ===== ЗАПУСК СЕРВЕРА =====

let server;

async function startServer() {
    try {
        // Инициализация базы данных
        await database.init();
        console.log('Database initialized successfully');
        
        // Запуск сервера
        const PORT = config.app.port || 3001;
        const HOST = config.app.host || '0.0.0.0';
        
        if (config.app.https && config.app.https.enabled) {
            // HTTPS сервер
            const options = {
                key: fs.readFileSync(config.app.https.keyPath),
                cert: fs.readFileSync(config.app.https.certPath)
            };
            
            server = https.createServer(options, app);
            server.listen(PORT, HOST, () => {
                console.log(`🚀 HTTPS Server running on https://${HOST}:${PORT}`);
                console.log(`📊 Environment: ${config.app.env}`);
                console.log(`🔧 API Base URL: https://${HOST}:${PORT}/api/v1`);
            });
        } else {
            // HTTP сервер
            server = http.createServer(app);
            server.listen(PORT, HOST, () => {
                console.log(`🚀 HTTP Server running on http://${HOST}:${PORT}`);
                console.log(`📊 Environment: ${config.app.env}`);
                console.log(`🔧 API Base URL: http://${HOST}:${PORT}/api/v1`);
            });
        }
        
        // Обработка ошибок сервера
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Запуск приложения
if (require.main === module) {
    startServer();
}

module.exports = app;