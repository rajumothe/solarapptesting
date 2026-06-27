const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production'
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many requests, please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production'
});

// Strict rate limiter for registration
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 new registrations per hour per IP
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production'
});

module.exports = {
    securityHeaders,
    authLimiter,
    apiLimiter,
    registrationLimiter
};
