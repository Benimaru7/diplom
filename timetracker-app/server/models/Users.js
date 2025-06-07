// ===== МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ =====

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // Основная информация
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Имя не может быть пустым'
                },
                len: {
                    args: [2, 100],
                    msg: 'Имя должно содержать от 2 до 100 символов'
                }
            }
        },
        
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                msg: 'Пользователь с таким email уже существует'
            },
            validate: {
                isEmail: {
                    msg: 'Неверный формат email'
                },
                notEmpty: {
                    msg: 'Email не может быть пустым'
                }
            },
            set(value) {
                this.setDataValue('email', value.toLowerCase().trim());
            }
        },
        
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Пароль не может быть пустым'
                },
                len: {
                    args: [6, 255],
                    msg: 'Пароль должен содержать минимум 6 символов'
                }
            }
        },
        
        // Рабочая информация
        role: {
            type: DataTypes.ENUM('admin', 'hr_manager', 'manager', 'employee'),
            allowNull: false,
            defaultValue: 'employee',
            validate: {
                isIn: {
                    args: [['admin', 'hr_manager', 'manager', 'employee']],
                    msg: 'Недопустимая роль пользователя'
                }
            }
        },
        
        position: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 100],
                    msg: 'Должность не может превышать 100 символов'
                }
            }
        },
        
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'departments',
                key: 'id'
            }
        },
        
        salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: {
                min: {
                    args: [0],
                    msg: 'Зарплата не может быть отрицательной'
                },
                max: {
                    args: [9999999.99],
                    msg: 'Зарплата превышает максимально допустимое значение'
                }
            }
        },
        
        // Контактная информация
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: {
                    args: /^[\+]?[\d\s\-\(\)]+$/,
                    msg: 'Неверный формат номера телефона'
                }
            }
        },
        
        avatar: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                isUrl: {
                    msg: 'Неверный URL аватара'
                }
            }
        },
        
        // Даты
        hire_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: {
                    msg: 'Неверная дата найма'
                },
                isBefore: {
                    args: new Date().toISOString().split('T')[0],
                    msg: 'Дата найма не может быть в будущем'
                }
            }
        },
        
        birth_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: {
                    msg: 'Неверная дата рождения'
                },
                isBefore: {
                    args: new Date().toISOString().split('T')[0],
                    msg: 'Дата рождения не может быть в будущем'
                }
            }
        },
        
        // Статус и настройки
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            allowNull: false,
            defaultValue: 'active',
            validate: {
                isIn: {
                    args: [['active', 'inactive', 'suspended']],
                    msg: 'Недопустимый статус пользователя'
                }
            }
        },
        
        is_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        
        // Настройки пользователя
        settings: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
                timezone: 'Asia/Bishkek',
                language: 'ru',
                dateFormat: 'DD.MM.YYYY',
                timeFormat: '24h',
                notifications: {
                    email: true,
                    push: true,
                    weeklyReports: true,
                    payrollUpdates: true
                },
                privacy: {
                    showOnlineStatus: true,
                    shareStatistics: true
                }
            }
        },
        
        // Метаданные безопасности
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        
        last_login_ip: {
            type: DataTypes.STRING(45), // IPv6
            allowNull: true
        },
        
        failed_login_attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'Количество неудачных попыток не может быть отрицательным'
                }
            }
        },
        
        locked_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        
        password_changed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        
        // Токены
        email_verification_token: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        
        password_reset_token: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        
        password_reset_expires: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        
        // Индексы
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['role']
            },
            {
                fields: ['department_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['hire_date']
            },
            {
                fields: ['last_login_at']
            }
        ],
        
        // Хуки модели
        hooks: {
            beforeCreate: async (user) => {
                // Хеширование пароля
                if (user.password) {
                    user.password = await User.hashPassword(user.password);
                }
                
                // Установка даты изменения пароля
                user.password_changed_at = new Date();
            },
            
            beforeUpdate: async (user) => {
                // Хеширование пароля при изменении
                if (user.changed('password')) {
                    user.password = await User.hashPassword(user.password);
                    user.password_changed_at = new Date();
                }
            },
            
            beforeDestroy: async (user) => {
                // Логирование удаления пользователя
                console.log(`Удаление пользователя: ${user.email} (ID: ${user.id})`);
            }
        },
        
        // Скрытие полей при сериализации
        defaultScope: {
            attributes: {
                exclude: [
                    'password', 
                    'email_verification_token', 
                    'password_reset_token',
                    'password_reset_expires',
                    'failed_login_attempts',
                    'locked_until'
                ]
            }
        },
        
        // Именованные скоупы
        scopes: {
            withPassword: {
                attributes: {
                    include: ['password']
                }
            },
            withSecurityFields: {
                attributes: {
                    include: [
                        'failed_login_attempts',
                        'locked_until',
                        'last_login_at',
                        'last_login_ip'
                    ]
                }
            },
            active: {
                where: {
                    status: 'active'
                }
            },
            byRole: (role) => ({
                where: {
                    role: role
                }
            }),
            byDepartment: (departmentId) => ({
                where: {
                    department_id: departmentId
                }
            })
        }
    });
    
    // ===== МЕТОДЫ КЛАССА =====
    
    // Хеширование пароля
    User.hashPassword = async function(password) {
        return await bcrypt.hash(password, config.security.bcryptRounds);
    };
    
    // Генерация случайного токена
    User.generateToken = function(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    };
    
    // Поиск пользователя для аутентификации
    User.findForAuth = async function(email) {
        return await this.scope('withPassword', 'withSecurityFields').findOne({
            where: { email: email.toLowerCase().trim() }
        });
    };
    
    // Создание пользователя с валидацией
    User.createUser = async function(userData) {
        const transaction = await sequelize.transaction();
        
        try {
            // Проверка уникальности email
            const existingUser = await this.findOne({
                where: { email: userData.email }
            });
            
            if (existingUser) {
                throw new Error('Пользователь с таким email уже существует');
            }
            
            // Создание пользователя
            const user = await this.create(userData, { transaction });
            
            await transaction.commit();
            return user;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    };
    
    // ===== МЕТОДЫ ЭКЗЕМПЛЯРА =====
    
    // Проверка пароля
    User.prototype.comparePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
    };
    
    // Проверка блокировки аккаунта
    User.prototype.isLocked = function() {
        return this.locked_until && this.locked_until > new Date();
    };
    
    // Инкремент неудачных попыток входа
    User.prototype.incrementFailedAttempts = async function() {
        const updates = {
            failed_login_attempts: this.failed_login_attempts + 1
        };
        
        // Блокировка после превышения лимита
        if (this.failed_login_attempts + 1 >= config.security.maxLoginAttempts) {
            updates.locked_until = new Date(Date.now() + config.security.lockoutDuration * 1000);
        }
        
        await this.update(updates);
    };
    
    // Сброс неудачных попыток
    User.prototype.resetFailedAttempts = async function() {
        await this.update({
            failed_login_attempts: 0,
            locked_until: null
        });
    };
    
    // Обновление информации о входе
    User.prototype.updateLoginInfo = async function(ip) {
        await this.update({
            last_login_at: new Date(),
            last_login_ip: ip,
            failed_login_attempts: 0,
            locked_until: null
        });
    };
    
    // Генерация JWT токена
    User.prototype.generateJWT = function() {
        return jwt.sign(
            {
                id: this.id,
                email: this.email,
                role: this.role
            },
            config.security.jwtSecret,
            { expiresIn: config.security.jwtExpiration }
        );
    };
    
    // Проверка необходимости смены пароля
    User.prototype.needsPasswordChange = function() {
        if (!this.password_changed_at) return true;
        
        const daysSinceChange = Math.floor(
            (new Date() - this.password_changed_at) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceChange > config.security.passwordExpirationDays;
    };
    
    // Проверка прав доступа
    User.prototype.hasPermission = function(permission) {
        const rolePermissions = {
            admin: ['all'],
            hr_manager: ['users_read', 'users_create', 'users_update', 'payroll_read', 'reports_read'],
            manager: ['users_read', 'reports_read', 'time_manage'],
            employee: ['profile_read', 'profile_update', 'time_track']
        };
        
        const userPermissions = rolePermissions[this.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    };
    
    // Получение полного имени с должностью
    User.prototype.getDisplayName = function() {
        return this.position ? `${this.name} (${this.position})` : this.name;
    };
    
    // Возврат модели
    return User;
};