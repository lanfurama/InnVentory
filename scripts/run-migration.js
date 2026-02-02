#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

const migrationPath = path.join(__dirname, '../database/migrations/001_add_depreciation_disposal.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

pool
  .query(sql)
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
