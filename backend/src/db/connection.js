const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  // Configured for ~100 simultaneous visitors per module
  // 10 connections = ~200 queries/sec capacity = supports 400-1000 concurrent users
  // For 100 visitors: 10 provides comfortable headroom, 5 would also work
  max: parseInt(process.env.DB_POOL_MAX) || 10,  // Default 10 (optimal for 100+ concurrent users)
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(-1);
  }
});

module.exports = { pool };

