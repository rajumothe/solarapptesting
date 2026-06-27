const { AuditLog, User, Role } = require('../models/coreModels');
const { Op } = require('sequelize');

// Get audit logs with RBAC
const getAuditLogs = async (req, res) => {
    try {
        // Only Super Admin and HOD can view audit logs
        const allowedRoles = ['Super Admin', 'HOD'];
        if (!allowedRoles.includes(req.user.Role.roleName)) {
            console.warn(`Unauthorized audit log access attempt by ${req.user.email}`);
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { startDate, endDate, userId, action, limit = 100, offset = 0 } = req.query;
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        if (userId) where.userId = parseInt(userId);
        if (action) where.action = action;

        const logs = await AuditLog.findAll({
            where,
            include: [{ model: User, attributes: ['id', 'fullName', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: Math.min(parseInt(limit), 1000), // Max 1000
            offset: parseInt(offset),
            attributes: ['id', 'userId', 'action', 'modelName', 'recordId', 'changes', 'createdAt']
        });

        const total = await AuditLog.count({ where });

        return res.status(200).json({
            logs,
            total,
            limit: Math.min(parseInt(limit), 1000),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve audit logs.' });
    }
};

// Get audit log by ID
const getAuditLogById = async (req, res) => {
    try {
        // Only Super Admin and HOD can view audit logs
        if (!['Super Admin', 'HOD'].includes(req.user.Role.roleName)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { id } = req.params;
        const log = await AuditLog.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'fullName', 'email'] }]
        });

        if (!log) {
            return res.status(404).json({ message: 'Audit log not found.' });
        }

        return res.status(200).json(log);
    } catch (error) {
        console.error('Get Audit Log Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve audit log.' });
    }
};

// Export audit logs (restricted)
const exportAuditLogs = async (req, res) => {
    try {
        // Only Super Admin
        if (req.user.Role.roleName !== 'Super Admin') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { startDate, endDate } = req.query;
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const logs = await AuditLog.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'userId', 'action', 'modelName', 'recordId', 'changes', 'createdAt']
        });

        // Return as CSV
        const csv = [
            'ID,User ID,Action,Model,Record ID,Changes,Timestamp',
            ...logs.map(log => {
                const changes = log.changes ? log.changes.replace(/"/g, '""') : '';
                return `${log.id},"${log.userId}","${log.action}","${log.modelName}","${log.recordId}","${changes}","${log.createdAt}"`;
            })
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        return res.send(csv);
    } catch (error) {
        console.error('Export Audit Logs Error:', error);
        return res.status(500).json({ message: 'Failed to export audit logs.' });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogById,
    exportAuditLogs
};
