const express = require('express');
const router = express.Router();
const { 
    updateInstallationStatus, 
    assignInstallationCrew,
    raiseServiceTicket, 
    getMyRaisedTickets, // FIX: Imported safely alongside standard modules
    getAvailableTicketsByLocation, 
    assignTicketToEngineer, 
    updateTicketProgress,
    getInstallationsList, 
    getTicketsList 
} = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Support Ticket Intake Operations Endpoints
router.post('/ticket/raise', authorizeRoles('Super Admin', 'Executive', 'ASM'), raiseServiceTicket);

// FIX: Added the history tracker route endpoint matching what your ExecutiveSupportScreen fetches!
router.get('/tickets/my-raised', authorizeRoles('Super Admin', 'Executive', 'ASM'), getMyRaisedTickets);

router.post('/ticket/:id/assign', authorizeRoles('Super Admin', 'Service Engineer', 'ASM', 'Department Admin'), assignTicketToEngineer);

// Location Pin Code Driven Dispatch Routes for Service Engineers
router.get('/tickets/local-grid', authorizeRoles('Super Admin', 'Service Engineer'), getAvailableTicketsByLocation);
router.post('/ticket/progress', authorizeRoles('Super Admin', 'Service Engineer'), updateTicketProgress);

// Installation Execution Operations
router.post('/installation/update', authorizeRoles('Super Admin', 'Service Engineer'), updateInstallationStatus);
router.post('/installation/:id/assign', authorizeRoles('Super Admin', 'ASM', 'Department Admin'), assignInstallationCrew);

// Central Operational Feeds & Ledgers Data Endpoints
router.get('/installations/list', authorizeRoles('Super Admin', 'ASM', 'RSM', 'Department Admin'), getInstallationsList);
router.get('/tickets/list', authorizeRoles('Super Admin', 'ASM', 'RSM', 'Department Admin', 'Executive'), getTicketsList);

module.exports = router;