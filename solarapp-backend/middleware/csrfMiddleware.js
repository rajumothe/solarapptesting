const crypto = require('crypto');

// Store CSRF tokens (use Redis in production)
const csrfTokenStore = new Map();

// Generate CSRF token for forms
const generateCsrfToken = (req, res, next) => {
    if (!req.session) {
        req.session = {};
    }
    
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        csrfTokenStore.set(req.session.csrfToken, {
            createdAt: Date.now(),
            userId: req.user ? req.user.id : null
        });
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    next();
};

// Verify CSRF token
const verifyCsrfToken = (req, res, next) => {
    const token = req.headers['x-csrf-token'] || 
                  req.body.csrfToken || 
                  req.query.csrfToken;

    if (!token) {
        return res.status(403).json({ message: 'Invalid request.' });
    }

    const tokenData = csrfTokenStore.get(token);
    if (!tokenData) {
        return res.status(403).json({ message: 'Invalid request.' });
    }

    // Check token age (15 minutes)
    if (Date.now() - tokenData.createdAt > 15 * 60 * 1000) {
        csrfTokenStore.delete(token);
        return res.status(403).json({ message: 'Request expired.' });
    }

    // Verify user matches (if authenticated)
    if (req.user && tokenData.userId !== req.user.id) {
        return res.status(403).json({ message: 'Invalid request.' });
    }

    next();
};

module.exports = {
    generateCsrfToken,
    verifyCsrfToken,
    csrfTokenStore
};
