const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

// Format log message
const formatLogMessage = (level, message, metadata = {}) => {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...metadata
    });
};

// Write to log file
const writeLog = (level, message, metadata = {}) => {
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const logMessage = formatLogMessage(level, message, metadata) + '\n';
    
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Failed to write log:', err);
    });
};

// Log security events
const logSecurityEvent = (event, details) => {
    const metadata = {
        event,
        userId: details.userId || null,
        email: details.email || null,
        ip: details.ip || null,
        action: details.action || null,
        resource: details.resource || null,
        status: details.status || null,
        timestamp: new Date().toISOString()
    };
    
    writeLog(details.level || 'INFO', event, metadata);
};

// Audit middleware - logs all requests
const auditMiddleware = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        const metadata = {
            userId: req.user ? req.user.id : null,
            email: req.user ? req.user.email : null,
            ip: req.ip || req.connection.remoteAddress,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            timestamp: new Date().toISOString()
        };
        
        // Log errors and suspicious activity
        if (res.statusCode >= 400) {
            const level = res.statusCode >= 500 ? 'ERROR' : 'WARN';
            writeLog(level, `Request: ${req.method} ${req.path}`, metadata);
        }
        
        res.send = originalSend;
        return res.send(data);
    };
    
    next();
};

// Failed login tracker
const failedLoginAttempts = new Map();

const trackFailedLogin = (email, ip) => {
    const key = `${email}:${ip}`;
    const attempts = (failedLoginAttempts.get(key) || 0) + 1;
    failedLoginAttempts.set(key, attempts);
    
    // Reset after 15 minutes
    setTimeout(() => failedLoginAttempts.delete(key), 15 * 60 * 1000);
    
    // Log suspicious activity
    if (attempts >= 3) {
        logSecurityEvent('MULTIPLE_FAILED_LOGINS', {
            email,
            ip,
            attempts,
            level: 'WARN'
        });
    }
    
    return attempts;
};

// Clear failed login on success
const clearFailedLogin = (email, ip) => {
    const key = `${email}:${ip}`;
    failedLoginAttempts.delete(key);
};

// Get failed login count
const getFailedLoginCount = (email, ip) => {
    const key = `${email}:${ip}`;
    return failedLoginAttempts.get(key) || 0;
};

module.exports = {
    LOG_LEVELS,
    writeLog,
    logSecurityEvent,
    auditMiddleware,
    trackFailedLogin,
    clearFailedLogin,
    getFailedLoginCount
};
