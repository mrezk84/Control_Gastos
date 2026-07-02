/**
 * Professional logging utility for the frontend application.
 *
 * Usage:
 *   import logger from './utils/logger';
 *   logger.error('Error fetching expenses:', err);
 *   logger.info('User logged in');
 *   logger.debug('Component rendered', { data });
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

// Set log level from environment or default to INFO in production, DEBUG in development
const currentLevel =
  process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;

const isLevelEnabled = (level) => level >= currentLevel;

const logger = {
  debug: (message, ...args) => {
    if (isLevelEnabled(LogLevel.DEBUG)) {
      // Only log debug in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    }
  },

  info: (message, ...args) => {
    if (isLevelEnabled(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (isLevelEnabled(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message, error, ...args) => {
    if (isLevelEnabled(LogLevel.ERROR)) {
      // Format error for better readability
      const errorInfo = error
        ? {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          }
        : null;

      console.error(`[ERROR] ${message}`, errorInfo, ...args);
    }
  },

  // Log API errors specifically
  apiError: (message, error) => {
    if (isLevelEnabled(LogLevel.ERROR)) {
      const errorInfo = {
        message: error.message || 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
      };
      console.error(`[API ERROR] ${message}`, errorInfo);
    }
  },
};

export default logger;
