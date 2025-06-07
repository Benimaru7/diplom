// ===== КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ =====

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    // Основные настройки приложения
    app: {
        name: process.env.APP_NAME || 'TimeTracker Pro',
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT) || 3001,
        host: process.env.HOST || '0.0.0.0',
        url: process.env.APP_URL || 'http://localhost:3001',
        timezone: process.env.TIMEZONE || 'Asia/Bishkek',
        locale: process.env.LOCALE || 'ru',
        debug: process.env.DEBUG === 'true',
        
        // Разрешенные домены для CORS
        allowedOrigins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:3001'],
        
        // HTTPS настройки
        https: {
            enabled: process.env.HTTPS_ENABLED === 'true',
            keyPath: process.env.HTTPS_KEY_PATH || './certificates/key.pem',
            certPath: process.env.HTTPS_CERT_PATH || './certificates/cert.pem'
        }
    },

    // Настройки базы данных
    database: {
        type: process.env.DB_TYPE || 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_DATABASE || 'timetracker_pro',
        username: process.env.DB_USERNAME || 'timetracker',
        password: process.env.DB_PASSWORD || '',
        
        // Настройки пула соединений
        pool: {
            min: parseInt(process.env.DB_POOL_MIN) || 5,
            max: parseInt(process.env.DB_POOL_MAX) || 20,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE) || 10000
        },
        
        // Дополнительные опции
        options: {
            dialect: process.env.DB_TYPE || 'mysql',
            dialectOptions: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
                useUTC: false,
                timezone: process.env.TIMEZONE || '+06:00'
            },
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            define: {
                timestamps: true,
                underscored: true,
                freezeTableName: true
            }
        }
    },

    // Настройки Redis (для кеширования и сессий)
    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'timetracker:',
        ttl: parseInt(process.env.REDIS_TTL) || 3600 // 1 час
    },

    // Настройки JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER || 'timetracker-pro',
        audience: process.env.JWT_AUDIENCE || 'timetracker-users'
    },

    // Настройки безопасности
    security: {
        // Хеширование паролей
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        
        // Ограничения входа
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900, // 15 минут
        
        // Настройки сессий
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600, // 1 час
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
        
        // CORS настройки
        corsOptions: {
            origin: true,
            credentials: true,
            optionsSuccessStatus: 200
        },
        
        // Rate limiting
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 минут
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // максимум запросов
            standardHeaders: true,
            legacyHeaders: false
        },
        
        // Особые лимиты для аутентификации
        authRateLimit: {
            windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 900000, // 15 минут
            max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10, // максимум попыток входа
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true
        }
    },

    // Настройки email
    email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        provider: process.env.EMAIL_PROVIDER || 'smtp', // smtp, sendgrid, mailgun
        
        // SMTP настройки
        smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            },
            tls: {
                rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
            }
        },
        
        // Настройки отправителя
        from: {
            name: process.env.EMAIL_FROM_NAME || 'TimeTracker Pro',
            address: process.env.EMAIL_FROM_ADDRESS || 'noreply@timetracker.pro'
        },
        
        // Шаблоны
        templates: {
            welcome: 'welcome',
            passwordReset: 'password-reset',
            weeklyReport: 'weekly-report',
            payrollNotification: 'payroll-notification'
        }
    },

    // Настройки файлового хранилища
    storage: {
        type: process.env.STORAGE_TYPE || 'local', // local, s3, gcs
        
        // Локальное хранилище
        local: {
            uploadPath: process.env.UPLOAD_PATH || './uploads',
            maxFileSize: process.env.MAX_FILE_SIZE || '25MB',
            allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',')
        },
        
        // AWS S3
        s3: {
            region: process.env.AWS_REGION || 'us-west-2',
            bucket: process.env.AWS_S3_BUCKET || '',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
    },

    // Настройки логирования
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        
        // Ротация логов
        rotation: {
            enabled: process.env.LOG_ROTATION_ENABLED === 'true',
            maxsize: process.env.LOG_MAX_SIZE || '100m',
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10,
            datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
        },
        
        // Различные типы логов
        files: {
            error: './logs/error.log',
            combined: './logs/combined.log',
            access: './logs/access.log'
        }
    },

    // Настройки компании (по умолчанию)
    company: {
        name: process.env.COMPANY_NAME || 'Название компании',
        address: process.env.COMPANY_ADDRESS || '',
        timezone: process.env.COMPANY_TIMEZONE || 'Asia/Bishkek',
        currency: process.env.COMPANY_CURRENCY || 'KGS',
        
        // Рабочее время
        workingHours: {
            start: process.env.WORKING_HOURS_START || '09:00',
            end: process.env.WORKING_HOURS_END || '18:00',
            lunchDuration: parseInt(process.env.LUNCH_DURATION) || 60 // минуты
        },
        
        // Рабочие дни
        workingDays: (process.env.WORKING_DAYS || 'monday,tuesday,wednesday,thursday,friday').split(','),
        
        // Настройки зарплаты
        payroll: {
            payDay: parseInt(process.env.PAYROLL_PAY_DAY) || 15, // день месяца
            overtimeRate: parseFloat(process.env.OVERTIME_RATE) || 1.5,
            weekendRate: parseFloat(process.env.WEEKEND_RATE) || 2.0,
            holidayRate: parseFloat(process.env.HOLIDAY_RATE) || 2.5,
            currency: process.env.PAYROLL_CURRENCY || 'KGS'
        }
    },

    // Настройки интеграций
    integrations: {
        // 1C:Предприятие
        oneC: {
            enabled: process.env.INTEGRATION_1C_ENABLED === 'true',
            endpoint: process.env.INTEGRATION_1C_ENDPOINT || '',
            username: process.env.INTEGRATION_1C_USERNAME || '',
            password: process.env.INTEGRATION_1C_PASSWORD || '',
            syncInterval: parseInt(process.env.INTEGRATION_1C_SYNC_INTERVAL) || 3600 // секунды
        },
        
        // Telegram Bot
        telegram: {
            enabled: process.env.TELEGRAM_ENABLED === 'true',
            botToken: process.env.TELEGRAM_BOT_TOKEN || '',
            webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
            chatId: process.env.TELEGRAM_CHAT_ID || ''
        },
        
        // Slack
        slack: {
            enabled: process.env.SLACK_ENABLED === 'true',
            webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
            channel: process.env.SLACK_CHANNEL || '#timetracker'
        }
    },

    // Настройки резервного копирования
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // каждый день в 2:00
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        path: process.env.BACKUP_PATH || './backups',
        
        // Типы резервных копий
        types: {
            database: process.env.BACKUP_DATABASE === 'true',
            files: process.env.BACKUP_FILES === 'true',
            logs: process.env.BACKUP_LOGS === 'true'
        }
    },

    // Настройки мониторинга
    monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        
        // Prometheus метрики
        prometheus: {
            enabled: process.env.PROMETHEUS_ENABLED === 'true',
            port: parseInt(process.env.PROMETHEUS_PORT) || 9090,
            path: process.env.PROMETHEUS_PATH || '/metrics'
        },
        
        // Health checks
        healthCheck: {
            enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
            path: process.env.HEALTH_CHECK_PATH || '/health',
            timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
        }
    }
};

// Валидация критических настроек
function validateConfig() {
    const errors = [];
    
    if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
        errors.push('JWT_SECRET must be set in production');
    }
    
    if (config.app.env === 'production') {
        if (!config.database.password) {
            errors.push('Database password must be set in production');
        }
        
        if (config.app.https.enabled && (!config.app.https.keyPath || !config.app.https.certPath)) {
            errors.push('HTTPS certificate paths must be set when HTTPS is enabled');
        }
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        throw new Error('Invalid configuration');
    }
}

// Валидация при загрузке модуля
validateConfig();

module.exports = config;