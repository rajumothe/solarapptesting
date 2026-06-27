/**
 * WebSocket Setup for Real-time Features
 * Handles notifications, live updates, chat
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.activeSessions = new Map();
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Store active session
      this.activeSessions.set(socket.userId, {
        socketId: socket.id,
        connectedAt: new Date(),
        email: socket.userEmail
      });

      // Join user-specific room
      socket.join(`user_${socket.userId}`);

      // Lead assignment event
      socket.on('lead_assigned', (data) => {
        this.io.to(`user_${data.assignedUserId}`).emit('notification', {
          type: 'lead_assigned',
          title: 'New Lead Assigned',
          message: `Lead #${data.leadCode} assigned to you`,
          data: data
        });
      });

      // Service ticket update event
      socket.on('ticket_updated', (data) => {
        this.io.to(`user_${data.engineerId}`).emit('notification', {
          type: 'ticket_updated',
          title: 'Ticket Update',
          message: `Ticket #${data.ticketId} status: ${data.status}`,
          data: data
        });
      });

      // Order status update
      socket.on('order_status_changed', (data) => {
        this.io.to(`user_${data.userId}`).emit('notification', {
          type: 'order_status_changed',
          title: 'Order Update',
          message: `Order #${data.orderId} status: ${data.status}`,
          data: data
        });
      });

      // Approval request
      socket.on('approval_required', (data) => {
        this.io.to(`user_${data.approverId}`).emit('notification', {
          type: 'approval_required',
          title: 'Approval Needed',
          message: `${data.itemType} #${data.itemId} requires approval`,
          actionUrl: data.actionUrl,
          data: data
        });
      });

      // Real-time dashboard update
      socket.on('dashboard_metrics', (data) => {
        socket.broadcast.emit('dashboard_updated', data);
      });

      // Chat message
      socket.on('send_message', (data) => {
        this.io.to(`user_${data.recipientId}`).emit('new_message', {
          from: socket.userId,
          message: data.message,
          timestamp: new Date(),
          read: false
        });
      });

      // Acknowledge message
      socket.on('message_read', (data) => {
        this.io.to(`user_${data.senderId}`).emit('message_acknowledged', {
          messageId: data.messageId,
          readAt: new Date()
        });
      });

      // Location update (field force)
      socket.on('location_update', (data) => {
        this.io.to('supervisors').emit('field_force_location', {
          userId: socket.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date()
        });
      });

      // Service engineer availability
      socket.on('engineer_available', (data) => {
        socket.join('available_engineers');
        this.io.emit('engineer_status', {
          engineerId: socket.userId,
          status: 'available',
          location: data.location
        });
      });

      socket.on('engineer_busy', () => {
        socket.leave('available_engineers');
        this.io.emit('engineer_status', {
          engineerId: socket.userId,
          status: 'busy'
        });
      });

      // System announcement
      socket.on('system_announcement', (data) => {
        if (data.roleFilter) {
          // Broadcast to specific role
          this.io.to(`role_${data.roleFilter}`).emit('announcement', {
            title: data.title,
            message: data.message,
            priority: data.priority,
            timestamp: new Date()
          });
        } else {
          // Broadcast to all
          this.io.emit('announcement', {
            title: data.title,
            message: data.message,
            priority: data.priority,
            timestamp: new Date()
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.activeSessions.delete(socket.userId);
        this.io.emit('user_offline', { userId: socket.userId });
      });
    });
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId, type, title, message, data = {}) {
    this.io.to(`user_${userId}`).emit('notification', {
      type,
      title,
      message,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Send notification to multiple users
   */
  notifyUsers(userIds, type, title, message, data = {}) {
    userIds.forEach(userId => {
      this.notifyUser(userId, type, title, message, data);
    });
  }

  /**
   * Broadcast to all users
   */
  broadcastNotification(type, title, message, data = {}) {
    this.io.emit('notification', {
      type,
      title,
      message,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Send to role-based group
   */
  notifyRole(role, type, title, message, data = {}) {
    this.io.to(`role_${role}`).emit('notification', {
      type,
      title,
      message,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Get active users
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.activeSessions.has(userId);
  }

  /**
   * Get user's socket ID
   */
  getSocketId(userId) {
    const session = this.activeSessions.get(userId);
    return session ? session.socketId : null;
  }
}

module.exports = WebSocketService;
