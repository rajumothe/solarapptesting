const express = require('express');
const router = express.Router();
const { 
    createLead, 
    convertLeadToCustomer, 
    asmEvaluateVerification, 
    backOfficeFinalVerification,
    getLeadsWithKYC // Added here safely to avoid reference errors
} = require('../controllers/leadController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Executive Territory Execution Pipeline Endpoints
router.post('/create', authorizeRoles('Super Admin', 'Executive', 'ASM', 'RSM'), createLead);
router.post('/convert-kyc', authorizeRoles('Super Admin', 'Executive', 'ASM', 'RSM'), convertLeadToCustomer);

// Management Approval Chain Enforcement Checkpoints
router.post('/asm-approve', authorizeRoles('Super Admin', 'ASM', 'RSM'), asmEvaluateVerification);
router.post('/backoffice-verify', authorizeRoles('Super Admin', 'Department Admin'), backOfficeFinalVerification);

// Pipeline Listing Data Getter Endpoints
router.get('/list', authorizeRoles('Super Admin', 'ASM', 'RSM', 'Department Admin', 'Executive'), getLeadsWithKYC);

module.exports = router;