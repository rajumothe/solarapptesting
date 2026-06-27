const express = require('express');
const router = express.Router();
const { handleCheckIn, handleCheckOut, applyLeaveOrOD, submitExpenseClaim, evaluateLeaveRequest, evaluateExpenseClaim } = require('../controllers/hrController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Standard Employee Operational Endpoints (Mobile App Triggers)
router.post('/attendance/checkin', handleCheckIn);
router.post('/attendance/checkout', handleCheckOut);
router.post('/leave/apply', applyLeaveOrOD);
router.post('/expense/submit', submitExpenseClaim);

// Management Approval Chain Endpoints (ASM, RSM, Admin Verification Gates)
router.post('/leave/evaluate', authorizeRoles('Super Admin', 'ASM', 'RSM', 'Department Admin'), evaluateLeaveRequest);
router.post('/expense/evaluate', authorizeRoles('Super Admin', 'ASM', 'RSM', 'Department Admin'), evaluateExpenseClaim);

module.exports = router;