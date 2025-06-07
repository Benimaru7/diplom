// ===== КОНФИГУРАЦИЯ И ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ =====

const { Sequelize } = require('sequelize');
const config = require('./config');
const fs = require('fs');
const path = require('path');

let sequelize;

// ===== СОЗДАНИЕ ПОДКЛЮЧЕНИЯ =====
function createConnection() {
    const dbConfig = config.database;
    
    let connectionOptions = {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.type,
        pool: dbConfig.pool,
        ...dbConfig.options,
        
        // Дополнительные настройки для производительности
        benchmark: config.app.env === 'development',
        retry: {
            max: 3,
            timeout: 5000,
            match: [
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /TIMEOUT/,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ]
        },
        
        // Хуки для логирования
        hooks: {
            beforeConnect: () => {
                console.log('🔌 Подключение к базе данных...');
            },
            afterConnect: () => {
                console.log('✅ Подключение к базе данных установлено');
            },
            beforeDisconnect: () => {
                console.log('🔌 Отключение от базы данных...');
            },
            afterDisconnect: () => {
                console.log('✅ Отключение от базы данных завершено');
            }
        }
    };

    // Создание экземпляра Sequelize
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        connectionOptions
    );

    return sequelize;
}

// ===== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ =====
async function init() {
    try {
        if (!sequelize) {
            createConnection();
        }

        // Проверка подключения
        await sequelize.authenticate();
        console.log('✅ База данных подключена успешно');

        // Загрузка моделей
        await loadModels();

        // Синхронизация моделей (только в development)
        if (config.app.env === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Модели синхронизированы');
        }

        // Загрузка начальных данных
        await loadSeedData();

        return sequelize;
    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error);
        throw error;
    }
}

// ===== ЗАГРУЗКА МОДЕЛЕЙ =====
async function loadModels() {
    const modelsPath = path.join(__dirname, '../models');
    
    if (!fs.existsSync(modelsPath)) {
        console.warn('⚠️ Директория моделей не найдена');
        return;
    }

    const modelFiles = fs.readdirSync(modelsPath)
        .filter(file => file.endsWith('.js') && file !== 'index.js')
        .sort();

    console.log('📦 Загрузка моделей:', modelFiles);

    for (const file of modelFiles) {
        try {
            const modelPath = path.join(modelsPath, file);
            const modelModule = require(modelPath);
            
            if (typeof modelModule === 'function') {
                modelModule(sequelize);
            } else if (modelModule.default && typeof modelModule.default === 'function') {
                modelModule.default(sequelize);
            }
            
            console.log(`  ✅ ${file}`);
        } catch (error) {
            console.error(`  ❌ Ошибка загрузки модели ${file}:`, error.message);
            throw error;
        }
    }

    // Настройка ассоциаций
    await setupAssociations();
}

// ===== НАСТРОЙКА АССОЦИАЦИЙ =====
async function setupAssociations() {
    const models = sequelize.models;
    
    console.log('🔗 Настройка ассоциаций моделей...');

 // User ассоциации
if (models.User) {
    // User -> TimeRecord (один ко многим)
    models.User.hasMany(models.TimeRecord, {
        foreignKey: 'user_id',
        as: 'timeRecords'
    });
}
}

        // User -> CalendarEvent (один ко многим)
        models.User.hasMany(models.CalendarEvent, {
            foreignKey: 'created_by',
            as: 'createdEvents'
        });

        // User -> PayrollRecord (один ко многим)
        models.User.hasMany(models.PayrollRecord, {
            foreignKey: 'user_id',
            as: 'payrollRecords'
        });