const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    logoutUser, 
    refreshToken, 
    requestPasswordReset, 
    resetPassword,
    getEngineersList,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    toggleUserStatus
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validationMiddleware');
const { authLimiter, registrationLimiter } = require('../middleware/securityMiddleware');
const { User, Role } = require('../models/coreModels');
const bcrypt = require('bcryptjs');

// Define open routing access endpoints with rate limiting and validation
router.post('/register', registrationLimiter, validateUserRegistration, register);
router.post('/login', authLimiter, validateUserLogin, login);
router.post('/logout', authenticateToken, logoutUser);
router.post('/refresh-token', refreshToken);
router.post('/password-reset-request', requestPasswordReset);
router.post('/password-reset', resetPassword);

// Protected Operations Route to feed deployment dropdown boxes
router.get('/engineers-list', authenticateToken, getEngineersList);

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================
router.post('/users', authenticateToken, authorizeRoles('Super Admin'), createUser);
router.get('/users', authenticateToken, authorizeRoles('Super Admin', 'HOD'), getAllUsers);
router.put('/users/:id', authenticateToken, authorizeRoles('Super Admin'), updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('Super Admin'), deleteUser);
router.patch('/users/:id/toggle', authenticateToken, authorizeRoles('Super Admin'), toggleUserStatus);

// System Seeding: Tool to create your very first Super Admin user
router.post('/init-admin', async (req, res) => {
    try {
        // Confirm if an admin profile already exists to block duplicates
        const existingAdmin = await User.findOne({ where: { email: 'admin@solarapp.com' } });
        if (existingAdmin) {
            return res.status(400).json({ message: 'System initialization already completed.' });
        }

        // Search the database for the Super Admin role generated in Step 2
        const adminRole = await Role.findOne({ where: { roleName: 'Super Admin' } });
        if (!adminRole) {
            return res.status(500).json({ message: 'Roles have not been seeded yet. Please restart server.js' });
        }

        const hashedPassword = await bcrypt.hash('SolarAppAdmin2026!', 10);

        // Generate the root account profile row
        const admin = await User.create({
            fullName: 'Chief Super Admin',
            email: 'admin@solarapp.com',
            password: hashedPassword,
            contactNo: '9999999999',
            pincodeAccess: '500001,500002', // Default layout access parameters
            isActive: true,
            roleId: adminRole.id
        });

        return res.status(201).json({
            message: 'Root administrator account initialized successfully!',
            credentials: {
                email: 'admin@solarapp.com',
                password: 'SolarAppAdmin2026!'
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Initialization failed.', error: error.message });
    }
});

module.exports = router;

module.exports = router;