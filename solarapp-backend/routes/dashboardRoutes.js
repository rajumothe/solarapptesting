const express = require('express');
const router = express.Router();
const { getPerformanceMetrics } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protect performance matrix behind token verification layer
router.get('/metrics', authenticateToken, getPerformanceMetrics);

module.exports = router;