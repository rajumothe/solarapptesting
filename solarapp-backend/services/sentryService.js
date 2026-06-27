import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Usage: initializeSentry(app)
 */
export const initializeSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️ SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event, hint) {
      // Filter out noise
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore 404s
        if (error?.statusCode === 404) return null;
        
        // Ignore validation errors in development
        if (process.env.NODE_ENV !== 'production' && error?.name === 'ValidationError') {
          return null;
        }
      }

      return event;
    },
  });

  // Attach Sentry request handler
  app.use(Sentry.Handlers.requestHandler());

  // Attach Sentry tracing middleware
  app.use(Sentry.Handlers.tracingHandler());

  console.log('✅ Sentry initialized for error tracking');

  return Sentry;
};

/**
 * Attach Sentry error handlers to Express app
 */
export const attachSentryErrorHandler = (app) => {
  app.use(Sentry.Handlers.errorHandler());
};

/**
 * Manually capture exception
 */
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  });
};

/**
 * Manually capture message
 */
export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context
 */
export const setUserContext = (userId, email, name) => {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking
 */
export const addBreadcrumb = (message, category, data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    timestamp: Math.floor(Date.now() / 1000),
  });
};

/**
 * Create transaction for performance monitoring
 */
export const startTransaction = (name, op = 'http.server') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

export default Sentry;
