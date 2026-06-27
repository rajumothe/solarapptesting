const express = require('express');
const router = express.Router();
const { 
    createOrderReceipt, 
    getOrdersList, 
    manageLoanStatus, 
    generateInvoice, 
    recordPaymentCollection 
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Order Entry Points & Pipelines
router.post('/receipt', authorizeRoles('Super Admin', 'Executive', 'ASM', 'Department Admin'), createOrderReceipt);
router.get('/list', authorizeRoles('Super Admin', 'Executive', 'ASM', 'RSM', 'Department Admin'), getOrdersList);
router.post('/collect-payment', authorizeRoles('Super Admin', 'Executive', 'ASM', 'Department Admin'), recordPaymentCollection);

// Restricted Administration Checkpoints
router.post('/update-loan', authorizeRoles('Super Admin', 'Department Admin'), manageLoanStatus);
router.post('/generate-invoice', authorizeRoles('Super Admin', 'Department Admin'), generateInvoice);

module.exports = router;