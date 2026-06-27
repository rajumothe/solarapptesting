// Input sanitization to prevent injection attacks
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/[;'"]/g, '') // Remove SQL injection chars
        .replace(/[`\\]/g, '') // Remove escape chars
        .trim();
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Only sanitize known safe fields
            const safeFields = [
                'fullName', 'customerName', 'email', 'address', 
                'remarks', 'description', 'reason', 'groupName', 
                'itemName', 'issueDescription', 'claimType'
            ];
            
            if (safeFields.includes(key)) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    
    return obj;
};

// Middleware to sanitize request body
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

module.exports = {
    sanitizeString,
    sanitizeObject,
    sanitizeInput
};
