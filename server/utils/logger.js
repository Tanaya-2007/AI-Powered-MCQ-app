import pino from 'pino';
import pinoHttp from 'pino-http';

const isProd = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

/**
 * Production-Grade Structured JSON Logger using Pino
 * - High performance (up to 5x faster than console.log)
 * - ISO timestamps and structured JSON output for log aggregators
 * - Auto-redaction of sensitive authorization tokens
 */
export const logger = pino({
  level: logLevel,
  base: {
    service: 'quizmaster-server',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'authorization', 'token', 'password'],
    censor: '[REDACTED]',
  },
});

/**
 * Express middleware for automatic HTTP request & response logging
 */
export const httpLogger = pinoHttp({
  logger,
  // Don't log spammy health checks or static asset probes at 'info' level
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/favicon.ico',
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
