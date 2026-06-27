import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for React web app
 * Usage: initializeSentry() in main.jsx before rendering App
 */
export const initializeSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('⚠️ VITE_SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: [
          'localhost',
          /^\//,
          // Add your API domains
          import.meta.env.VITE_API_URL || 'http://localhost:5000',
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out noise
      if (event.exception) {
        const error = hint.originalException;

        // Ignore network errors in development
        if (import.meta.env.MODE !== 'production' && error?.message?.includes('Network')) {
          return null;
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized for error tracking (Web)');
};

/**
 * Error boundary component for React
 * Catches errors in child components
 */
export class ErrorBoundary extends Sentry.ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Something went wrong</h2>
            <p>We've been notified and will investigate shortly.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
            {import.meta.env.MODE !== 'production' && (
              <details style={{ marginTop: '20px', color: '#666' }}>
                <summary>Error Details (Dev Only)</summary>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId, email, name, role) => {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
    ip_address: '{{auto}}',
    role,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking user actions
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
 * Track page views
 */
export const trackPageView = (path) => {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${path}`,
    level: 'info',
  });
};

/**
 * Create transaction for performance monitoring
 */
export const startTransaction = (name, op = 'pageload') => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

export default Sentry;
