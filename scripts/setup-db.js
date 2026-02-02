const { createdb, dropdb } = require('pgtools');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const config = {
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
};

const databaseName = process.env.PGDATABASE;
const schemaFilePath = path.join(__dirname, '../database/schema.sql');

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

async function createDatabase() {
  try {
    await createdb(config, databaseName);
  } catch (error) {
    throw new DatabaseError(`Error creating database: ${error.message}`);
  }
}

async function dropDatabase() {
  try {
    await dropdb(config, databaseName);
  } catch (error) {
    throw new DatabaseError(`Error dropping database: ${error.message}`);
  }
}

async function runSchema() {
  return new Promise((resolve, reject) => {
    const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');
    const pool = new Pool({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      database: databaseName,
    });
    pool.query(schemaSql, (err) => {
      pool.end();
      if (err) {
        reject(new DatabaseError(`Error running schema: ${err.message}`));
      } else {
        console.log('Schema created successfully');
        resolve();
      }
    });
  });
}

async function seedUsers() {
  const pool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: databaseName,
  });

  const defaultUsers = [
    { email: 'superadmin@email.com', password: 'superadmin123', role: 'superadmin' },
    { email: 'admin@email.com', password: 'admin123', role: 'superadmin' },
    { email: 'user@email.com', password: 'password', role: 'user' },
    { email: 'usr@email.com', password: 'password', role: 'user' },
  ];

  for (const u of defaultUsers) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await pool.query(
      'INSERT INTO public.users(email, password, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [u.email, hashedPassword, u.role],
    );
  }

  await pool.end();
  console.log('Default users seeded successfully');
}

async function setupDatabase() {
  try {
    await createDatabase();
    await runSchema();
    await seedUsers();
    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    if (
      error instanceof DatabaseError
      && (error.message.includes('duplicate_database') || error.message.includes('already exists'))
    ) {
      readline.question(
        `Database ${databaseName} already exists. Proceed? Existing data will be replaced. (Y/N) `,
        async (answer) => {
          if (answer.toLowerCase() === 'y') {
            try {
              await dropDatabase();
              await createDatabase();
              await runSchema();
              await seedUsers();
              console.log('Database setup completed successfully');
            } catch (err) {
              console.error('Error setting up database:', err);
            }
          } else {
            console.log('Operation cancelled.');
          }
          readline.close();
          process.exit(0);
        },
      );
    } else {
      console.error('Error setting up database:', error);
      process.exit(1);
    }
  }
}

setupDatabase();
