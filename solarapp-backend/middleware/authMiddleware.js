const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/coreModels');
require('dotenv').config();

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

// Middleware to authenticate and check JWT tokens
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized access.' });
        }

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ message: 'Session terminated. Please login again.' });
        }

        // Verify token authenticity
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired session.' });
            }

            // Find user details along with their assigned role
            const user = await User.findByPk(decodedUser.id, {
                include: [{ model: Role, attributes: ['roleName'] }]
            });

            if (!user || !user.isActive) {
                return res.status(403).json({ message: 'Account unavailable.' });
            }

            // Bind user data onto the request payload for downstream controllers
            req.user = user;
            req.token = token; // Store token for logout
            
            // Pass the operating user's ID into Sequelize hooks to capture it in Audit Logs automatically
            req.auditOptions = { userId: user.id };

            next();
        });
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(500).json({ message: 'Authentication failed.' });
    }
};

// Logout - add token to blacklist
const logout = (token) => {
    tokenBlacklist.add(token);
    // In production, implement Redis with TTL
};

// Middleware to strictly enforce RBAC access limits
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.Role) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const currentRole = req.user.Role.roleName;

        // Check if the user's role is permitted for this action
        if (!allowedRoles.includes(currentRole)) {
            console.warn(`Unauthorized access attempt by ${req.user.email} for roles: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ 
                message: 'Access denied.' 
            });
        }
        next();
    };
};

// Helper function to get user's accessible pincodes (for filtering queries)
const getUserAccessiblePincodes = (user) => {
    if (!user) return [];
    
    const roleName = user.Role?.roleName;
    
    // Super Admin, HOD, State Head, RSM have no filtering
    if (['Super Admin', 'HOD', 'State Head', 'RSM'].includes(roleName)) {
        return null; // null means no filter - access all
    }
    
    // Executive and Service Engineer access their assigned pincodes
    if (['Executive', 'Service Engineer'].includes(roleName)) {
        return user.pincodeAccess ? user.pincodeAccess.split(',') : [];
    }
    
    // ASM: derive pincodes from their sales offices
    if (roleName === 'ASM') {
        // This would need to be fetched separately with async call
        // For now, returning null to indicate fetch is needed
        return null;
    }
    
    return [];
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    logout,
    tokenBlacklist,
    getUserAccessiblePincodes
};