const { body, param, validationResult } = require('express-validator');

// Global validation error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Input validation failed',
            errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('fullName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Full name must be 3-100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('contactNo')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid Indian phone number'),
    body('roleId')
        .isInt({ min: 1 })
        .withMessage('Valid role ID required'),
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),
    body('password')
        .notEmpty()
        .withMessage('Password required'),
    handleValidationErrors
];

// Lead creation validation
const validateLeadCreation = [
    body('customerName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Customer name must be 3-100 characters'),
    body('contactNo')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid Indian phone number'),
    body('address')
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Address must be 5-255 characters'),
    body('pincode')
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be 6 digits'),
    body('unitCapacitySelection')
        .notEmpty()
        .withMessage('Unit capacity selection required'),
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude required'),
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude required'),
    handleValidationErrors
];

// Item master validation
const validateItemMaster = [
    body('itemName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Item name must be 3-100 characters'),
    body('capacityKW')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Capacity must be between 0-100 KW'),
    handleValidationErrors
];

// Group master validation
const validateGroupMaster = [
    body('groupName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Group name must be 3-100 characters'),
    body('selectedItems')
        .isArray()
        .withMessage('Selected items must be an array'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateLeadCreation,
    validateItemMaster,
    validateGroupMaster
};
