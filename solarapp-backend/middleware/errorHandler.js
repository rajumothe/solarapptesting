// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = req.id || Math.random().toString(36).substr(2, 9);
    
    // Log error server-side with full details
    console.error(`[${timestamp}] Error ID: ${requestId}`, err);
    
    // Determine appropriate HTTP status
    let status = err.status || err.statusCode || 500;
    let message = 'An error occurred.';
    
    // Map specific errors
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Invalid input.';
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized.';
    } else if (err.name === 'ForbiddenError') {
        status = 403;
        message = 'Access denied.';
    } else if (err.name === 'NotFoundError') {
        status = 404;
        message = 'Not found.';
    } else if (status === 500) {
        message = 'Internal server error.';
    }
    
    // Send generic response to client
    res.status(status).json({
        message,
        requestId // Include for debugging on client side
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        message: 'Endpoint not found.'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
