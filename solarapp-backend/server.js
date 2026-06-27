const express = require('express');
const cors = require('cors');
const http = require('http');
const sequelize = require('./config/db');
const { Role } = require('./models/coreModels');
const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const leadRoutes = require('./routes/leadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const hrRoutes = require('./routes/hrRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const visitRoutes = require('./routes/visitRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { securityHeaders, apiLimiter } = require('./middleware/securityMiddleware');
const { auditMiddleware } = require('./middleware/loggingMiddleware');
const { sanitizeInput } = require('./middleware/sanitizationMiddleware');
const { specs, swaggerUi } = require('./swagger');
const WebSocketService = require('./services/websocketService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Security middleware - apply in order
app.use(securityHeaders);
app.use(apiLimiter);
app.use(auditMiddleware);

// Secure CORS configuration - restrict to allowed origins only
const corsOptions = {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400
};
app.use(cors(corsOptions));

// Request parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: false }));

// Input sanitization
app.use(sanitizeInput);

// API Documentation (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SolarApp API Documentation'
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// WebSocket setup
const io = new WebSocketService(server);
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Attach Core Authentication Microservice Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/visits', visitRoutes);

// Error handling middleware (must be last)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect DB and run server with schema safety alterations active
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');
        
        // Sync models with database
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully.');
        
        // Create roles
        const roles = ['Super Admin', 'HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Service Engineer'];
        for (const r of roles) {
            await Role.findOrCreate({ where: { roleName: r } });
        }
        console.log('✅ Roles verified.');
    } catch (err) {
        console.warn('⚠️ Database connection warning:', err.message);
        console.warn('⚠️ Running in limited mode. API Docs and Health checks available.');
        console.warn('⚠️ To use full functionality, ensure MySQL is running.');
    }
    
    // Start server regardless of database status
    server.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║     SolarApp Backend Server v1.0        ║
║     Running on Port ${PORT}              ║
║     API Docs: http://localhost:${PORT}/api/docs ║
║     WebSocket: Enabled                  ║
╚════════════════════════════════════════╝
        `);
    });
};

startServer();

module.exports = server;