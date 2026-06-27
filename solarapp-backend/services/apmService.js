import { StatsD } from 'node-dogstatsd';

/**
 * Initialize DataDog APM/Metrics
 * Usage: initializeDataDog() in server.js
 */
export const initializeDataDog = () => {
  if (!process.env.DATADOG_API_KEY) {
    console.warn('⚠️ DATADOG_API_KEY not configured. Metrics disabled.');
    return null;
  }

  const metrics = new StatsD({
    host: process.env.DATADOG_AGENT_HOST || 'localhost',
    port: process.env.DATADOG_AGENT_PORT || 8125,
    prefix: 'solarapp.',
    flushInterval: 10000,
  });

  console.log('✅ DataDog APM initialized');
  return metrics;
};

/**
 * Middleware for tracking request metrics
 */
export const metricsMiddleware = (metrics) => {
  return (req, res, next) => {
    if (!metrics) {
      return next();
    }

    const startTime = Date.now();

    // Track request start
    metrics.increment('requests.count', {
      method: req.method,
      endpoint: req.path,
      hostname: req.hostname,
    });

    // Override res.end to track response
    const originalEnd = res.end;
    res.end = function (...args) {
      const duration = Date.now() - startTime;

      // Track request duration
      metrics.timing('requests.duration', duration, {
        method: req.method,
        endpoint: req.path,
        status: res.statusCode,
      });

      // Track by status code
      if (res.statusCode >= 500) {
        metrics.increment('requests.errors.5xx', {
          status: res.statusCode,
          endpoint: req.path,
        });
      } else if (res.statusCode >= 400) {
        metrics.increment('requests.errors.4xx', {
          status: res.statusCode,
          endpoint: req.path,
        });
      }

      // Track slow requests
      if (duration > 1000) {
        metrics.increment('requests.slow', {
          duration_seconds: Math.ceil(duration / 1000),
          endpoint: req.path,
        });
      }

      return originalEnd.apply(res, args);
    };

    next();
  };
};

/**
 * Track database query performance
 */
export const trackDatabaseQuery = (metrics, queryName, duration, success = true) => {
  if (!metrics) return;

  metrics.timing('database.query_duration', duration, {
    query: queryName,
    status: success ? 'success' : 'error',
  });

  metrics.increment('database.queries', {
    query: queryName,
    status: success ? 'success' : 'error',
  });

  if (duration > 500) {
    metrics.increment('database.slow_queries', {
      query: queryName,
      duration_ms: duration,
    });
  }
};

/**
 * Track cache operations
 */
export const trackCacheOperation = (metrics, operation, duration, hit = false) => {
  if (!metrics) return;

  metrics.timing('cache.operation_duration', duration, {
    operation,
    hit: hit ? 'hit' : 'miss',
  });

  metrics.increment('cache.operations', {
    operation,
    status: hit ? 'hit' : 'miss',
  });
};

/**
 * Track custom business metrics
 */
export const trackBusinessMetric = (metrics, metricName, value, tags = {}) => {
  if (!metrics) return;

  metrics.gauge(`business.${metricName}`, value, tags);
};

/**
 * Track lead operations
 */
export const trackLeadMetric = (metrics, action, leadId = null, tags = {}) => {
  if (!metrics) return;

  metrics.increment('leads.' + action, {
    ...tags,
    ...(leadId && { leadId }),
  });
};

/**
 * Track order operations
 */
export const trackOrderMetric = (metrics, action, orderId = null, amount = 0, tags = {}) => {
  if (!metrics) return;

  metrics.increment('orders.' + action, {
    ...tags,
    ...(orderId && { orderId }),
  });

  if (amount > 0) {
    metrics.gauge('orders.amount', amount, {
      action,
      ...tags,
    });
  }
};

/**
 * Track authentication metrics
 */
export const trackAuthMetric = (metrics, action, success = true, duration = 0) => {
  if (!metrics) return;

  metrics.increment('auth.' + action, {
    status: success ? 'success' : 'failed',
  });

  if (duration > 0) {
    metrics.timing('auth.duration', duration, {
      action,
    });
  }
};

/**
 * Track payment metrics
 */
export const trackPaymentMetric = (metrics, action, amount = 0, status = 'pending', tags = {}) => {
  if (!metrics) return;

  metrics.increment('payments.' + action, {
    status,
    ...tags,
  });

  if (amount > 0) {
    metrics.gauge('payments.amount', amount, {
      action,
      status,
    });
  }
};

/**
 * Track error rate by endpoint
 */
export const trackErrorRate = (metrics, endpoint, statusCode) => {
  if (!metrics) return;

  if (statusCode >= 400) {
    metrics.increment('errors.by_endpoint', {
      endpoint,
      status: statusCode,
    });
  }
};

/**
 * Flush metrics before shutdown
 */
export const flushMetrics = (metrics) => {
  if (metrics) {
    metrics.flush();
  }
};

/**
 * Health check metrics
 */
export const trackHealthMetric = (metrics, service, status, responseTime = 0) => {
  if (!metrics) return;

  metrics.gauge('health.' + service, status === 'up' ? 1 : 0);

  if (responseTime > 0) {
    metrics.timing('health.' + service + '.response_time', responseTime);
  }
};

export default {
  initializeDataDog,
  metricsMiddleware,
  trackDatabaseQuery,
  trackCacheOperation,
  trackBusinessMetric,
  trackLeadMetric,
  trackOrderMetric,
  trackAuthMetric,
  trackPaymentMetric,
  trackErrorRate,
  flushMetrics,
  trackHealthMetric,
};
