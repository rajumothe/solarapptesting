const express = require('express');
const router = express.Router();
const { logFieldVisit } = require('../controllers/visitController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Expose transactional visit entries gateway across field force hierarchy bands
router.post('/log', authorizeRoles('Super Admin', 'Executive', 'ASM', 'RSM'), logFieldVisit);

module.exports = router;