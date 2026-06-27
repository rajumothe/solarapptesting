const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSSL = (process.env.DB_SSL || 'false').toLowerCase() === 'true';
const rejectUnauthorized = (process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        dialect: 'mysql',
        dialectOptions: useSSL ? {
            ssl: {
                rejectUnauthorized
            }
        } : undefined,
        logging: false, 
        timezone: '+05:30',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Helper function to capture audit logs automatically
const createAuditLog = async (action, modelName, instance, options) => {
    try {
        // CRITICAL GUARD: Prevent infinite looping if the model being modified is AuditLog itself
        if (modelName === 'AuditLog') return;

        const AuditLog = sequelize.models.AuditLog;
        if (!AuditLog) return;

        const userId = options.userId || null;
        const recordId = instance.id || null;
        const newData = action !== 'DELETE' ? JSON.stringify(instance.toJSON()) : null;
        
        await AuditLog.create({
            userId,
            action,
            modelName,
            recordId,
            changes: newData
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

// Apply automated global hooks for auditing changes
sequelize.addHook('afterCreate', (instance, options) => createAuditLog('CREATE', instance.constructor.name, instance, options));
sequelize.addHook('afterUpdate', (instance, options) => createAuditLog('UPDATE', instance.constructor.name, instance, options));
sequelize.addHook('afterDestroy', (instance, options) => createAuditLog('DELETE', instance.constructor.name, instance, options));

module.exports = sequelize;