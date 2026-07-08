function maskValue(key, value) {
  if (/password|hash|token|secret|signature/i.test(key)) {
    return '[REDACTED]';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value.length > 120 ? `${value.slice(0, 120)}...` : value;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 120 ? `${serialized.slice(0, 120)}...` : serialized;
  } catch (_error) {
    return String(value);
  }
}

function summarizeObject(source) {
  const entries = Object.entries(source || {});

  if (entries.length === 0) {
    return '{}';
  }

  return `{ ${entries.map(([key, value]) => `${key}=${maskValue(key, value)}`).join(', ')} }`;
}

function logControllerStart(controllerName, req) {
  const startedAt = Date.now();
  console.log(
    `[API][${controllerName}] -> ${req.method} ${req.originalUrl} | params: ${summarizeObject(req.params)} | query: ${summarizeObject(req.query)} | body: ${summarizeObject(req.body)}`,
  );

  return startedAt;
}

function logControllerEnd(controllerName, req, startedAt, res) {
  const duration = Date.now() - startedAt;
  console.log(`[API][${controllerName}] <- ${res.statusCode} ${req.method} ${req.originalUrl} (${duration}ms)`);
}

function logControllerError(controllerName, req, startedAt, error) {
  const duration = Date.now() - startedAt;
  console.error(`[API][${controllerName}] ! ${req.method} ${req.originalUrl} (${duration}ms) ${error.message}`);
}

function withControllerLog(controllerName, handler) {
  return async function loggedController(req, res, next) {
    const startedAt = logControllerStart(controllerName, req);

    try {
      const result = await handler(req, res, next);
      logControllerEnd(controllerName, req, startedAt, res);
      return result;
    } catch (error) {
      logControllerError(controllerName, req, startedAt, error);
      throw error;
    }
  };
}

module.exports = {
  withControllerLog,
};