const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogById, exportAuditLogs } = require('../controllers/auditController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All audit endpoints require authentication
router.use(authenticateToken);

// Get audit logs with filtering
router.get('/', authorizeRoles('Super Admin', 'HOD'), getAuditLogs);

// Get specific audit log
router.get('/:id', authorizeRoles('Super Admin', 'HOD'), getAuditLogById);

// Export audit logs (Super Admin only)
router.get('/export/csv', authorizeRoles('Super Admin'), exportAuditLogs);

module.exports = router;
