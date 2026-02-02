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

const seedPath = path.join(__dirname, '../database/seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');

pool
  .query(sql)
  .then(() => {
    console.log('Seed data imported successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
