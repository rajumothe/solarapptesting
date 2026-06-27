const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, SalesOffice } = require('../models/coreModels');
const { logout } = require('../middleware/authMiddleware');
const { trackFailedLogin, clearFailedLogin } = require('../middleware/loggingMiddleware');
require('dotenv').config();

// User Registration Endpoint
const register = async (req, res) => {
    try {
        const { fullName, email, password, contactNo, roleId, pincodeAccess, parentId, salesOfficeId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user record
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            contactNo,
            roleId,
            pincodeAccess,
            parentId: parentId || null,
            salesOfficeId: salesOfficeId || null
        }, {
            userId: req.user ? req.user.id : null 
        });

        return res.status(201).json({
            message: 'Registration successful.',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ message: 'Registration failed.' });
    }
};

// User Login Endpoint
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        // Fetch user
        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, attributes: ['roleName'] }]
        });

        if (!user || !user.isActive) {
            trackFailedLogin(email, ip);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            trackFailedLogin(email, ip);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Clear failed login on success
        clearFailedLogin(email, ip);

        // Generate access token (short-lived - 24h)
        const accessToken = jwt.sign(
            { id: user.id, role: user.Role.roleName },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Generate refresh token (long-lived - 7 days)
        const refreshToken = jwt.sign(
            { id: user.id, role: user.Role.roleName, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.Role.roleName,
                pincodeAccess: user.pincodeAccess
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Login failed.' });
    }
};

// Logout Endpoint
const logoutUser = async (req, res) => {
    try {
        const token = req.token;
        
        if (token) {
            logout(token);
        }

        return res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({ message: 'Logout failed.' });
    }
};

// Token Refresh Endpoint
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token required.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err || decoded.type !== 'refresh') {
                return res.status(403).json({ message: 'Invalid refresh token.' });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { id: decoded.id, role: decoded.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                message: 'Token refreshed.',
                accessToken: newAccessToken
            });
        });
    } catch (error) {
        console.error('Token Refresh Error:', error);
        return res.status(500).json({ message: 'Token refresh failed.' });
    }
};

// Password Reset Request
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if email exists
            return res.status(200).json({ message: 'If email exists, reset link sent.' });
        }

        // Generate reset token (valid for 15 minutes)
        const resetToken = jwt.sign(
            { id: user.id, type: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // TODO: Send reset token via email
        console.log(`Password reset token for ${email}: ${resetToken}`);

        return res.status(200).json({ message: 'If email exists, reset link sent.' });
    } catch (error) {
        console.error('Password Reset Request Error:', error);
        return res.status(500).json({ message: 'Password reset request failed.' });
    }
};

// Password Reset Confirm
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and password required.' });
        }

        jwt.verify(resetToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err || decoded.type !== 'reset') {
                return res.status(403).json({ message: 'Invalid reset token.' });
            }

            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Hash and update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save({ userId: user.id });

            return res.status(200).json({ message: 'Password reset successful.' });
        });
    } catch (error) {
        console.error('Password Reset Error:', error);
        return res.status(500).json({ message: 'Password reset failed.' });
    }
};

// Fetch all field installation or support engineers
const getEngineersList = async (req, res) => {
    try {
        const techRole = await Role.findOne({ where: { roleName: 'Service Engineer' } });
        
        const engineers = await User.findAll({
            where: { roleId: techRole ? techRole.id : 0 },
            attributes: ['id', 'fullName']
        });
        return res.status(200).json(engineers);
    } catch (error) {
        console.error('Engineer List Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve engineers.' });
    }
};

// Admin: Create User
const createUser = async (req, res) => {
    try {
        const { fullName, email, password, contactNo, roleId, pincodeAccess, parentId, salesOfficeId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user record
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            contactNo,
            roleId,
            pincodeAccess: pincodeAccess || '',
            parentId: parentId || null,
            salesOfficeId: salesOfficeId || null,
            isActive: true
        }, { userId: req.user.id });

        return res.status(201).json({
            message: 'User created successfully.',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                roleId: newUser.roleId
            }
        });
    } catch (error) {
        console.error('User Creation Error:', error);
        return res.status(500).json({ message: 'User creation failed.', error: error.message });
    }
};

// Admin: Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Role, attributes: ['roleName'] }],
            attributes: ['id', 'fullName', 'email', 'contactNo', 'isActive', 'createdAt'],
            order: [['fullName', 'ASC']]
        });
        return res.status(200).json(users);
    } catch (error) {
        console.error('Get Users Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve users.' });
    }
};

// Admin: Update User
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, contactNo, roleId, pincodeAccess, parentId, salesOfficeId } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await user.update({
            fullName: fullName || user.fullName,
            email: email || user.email,
            contactNo: contactNo || user.contactNo,
            roleId: roleId || user.roleId,
            pincodeAccess: pincodeAccess !== undefined ? pincodeAccess : user.pincodeAccess,
            parentId: parentId !== undefined ? parentId : user.parentId,
            salesOfficeId: salesOfficeId !== undefined ? salesOfficeId : user.salesOfficeId
        }, { userId: req.user.id });

        return res.status(200).json({
            message: 'User updated successfully.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                roleId: user.roleId
            }
        });
    } catch (error) {
        console.error('User Update Error:', error);
        return res.status(500).json({ message: 'User update failed.', error: error.message });
    }
};

// Admin: Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Soft delete by marking isActive as false
        await user.update({ isActive: false }, { userId: req.user.id });

        return res.status(200).json({ message: 'User deactivated successfully.' });
    } catch (error) {
        console.error('User Delete Error:', error);
        return res.status(500).json({ message: 'User deletion failed.', error: error.message });
    }
};

// Admin: Toggle User Status
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.isActive = !user.isActive;
        await user.save({ userId: req.user.id });

        return res.status(200).json({ message: `User status toggled to: ${user.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        console.error('Toggle User Status Error:', error);
        return res.status(500).json({ message: 'User status toggle failed.', error: error.message });
    }
};

module.exports = {
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
};