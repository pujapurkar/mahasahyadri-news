import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'NewsDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true,  // ← YEH ADD KARO
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Check if SQL Authentication or Windows Authentication
if (process.env.DB_USER && process.env.DB_PASSWORD) {
  // SQL Server Authentication
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}
// For Windows Authentication, no user/password needed with trustedConnection: true

let pool: sql.ConnectionPool | null = null;

export async function getDB(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
  }
  return pool;
}

export { sql };