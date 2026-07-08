require('dotenv').config();
const sql = require('mssql');

let pool;

function maskSensitiveValue(key, value) {
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
    return value.length > 160 ? `${value.slice(0, 160)}...` : value;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 160 ? `${serialized.slice(0, 160)}...` : serialized;
  } catch (_error) {
    return String(value);
  }
}

function formatQueryForLog(queryText) {
  const compact = String(queryText || '').replace(/\s+/g, ' ').trim();
  return compact.length > 500 ? `${compact.slice(0, 500)}...` : compact;
}

function formatRequestParams(request) {
  const entries = Object.entries(request.parameters || {});

  if (entries.length === 0) {
    return '';
  }

  return entries
    .map(([key, param]) => `${key}=${maskSensitiveValue(key, param?.value)}`)
    .join(', ');
}

if (!sql.Request.prototype.__bookstoreQueryLoggerPatched) {
  const originalQuery = sql.Request.prototype.query;

  sql.Request.prototype.query = function loggedQuery(...args) {
    const queryText = args[0];
    const params = formatRequestParams(this);
    const sqlText = formatQueryForLog(queryText);

    console.log(`[SQL] ${sqlText}${params ? ` | params: ${params}` : ''}`);

    try {
      const result = originalQuery.apply(this, args);

      if (result && typeof result.catch === 'function') {
        return result.catch((error) => {
          console.error(`[SQL ERROR] ${sqlText}`, error.message);
          throw error;
        });
      }

      return result;
    } catch (error) {
      console.error(`[SQL ERROR] ${sqlText}`, error.message);
      throw error;
    }
  };

  sql.Request.prototype.__bookstoreQueryLoggerPatched = true;
}

async function getPool() {
  if (pool) {
    return pool;
  }

  pool = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 1433),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  return pool;
}

module.exports = {
  getPool,
  sql,
};
