import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { logger, httpLogger } from '../utils/logger.js';

describe('Logger (Pino Structured Logging)', () => {
  it('exports valid pino logger instance with standard logging levels', () => {
    assert.ok(logger);
    assert.equal(typeof logger.info, 'function');
    assert.equal(typeof logger.warn, 'function');
    assert.equal(typeof logger.error, 'function');
    assert.equal(typeof logger.debug, 'function');
  });

  it('exports httpLogger middleware function', () => {
    assert.ok(httpLogger);
    assert.equal(typeof httpLogger, 'function');
    assert.equal(httpLogger.length, 3); // (req, res, next)
  });

  it('logs structured events without throwing', () => {
    assert.doesNotThrow(() => {
      logger.info({ event: 'test_event', testId: 123 }, 'Unit test log message');
      logger.warn({ warningCode: 'WARN_01' }, 'Test warning message');
      logger.error(new Error('Test error log'), 'Test error message');
    });
  });
});
