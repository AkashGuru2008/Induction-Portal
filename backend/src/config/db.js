const { Pool } = require('pg');
require('dotenv').config();

// Prefer a single DATABASE_URL (common in hosted Postgres), otherwise fall
// back to discrete PG* env vars. Never hardcode credentials here.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err);
});

module.exports = pool;
