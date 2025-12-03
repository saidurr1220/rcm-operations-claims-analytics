import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function createDatabase() {
  // Connect to default 'postgres' database first
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default database
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    // Check if database exists
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}';
    `;
    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log(`✓ Database '${process.env.DB_NAME}' already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME};`);
      console.log(`✓ Database '${process.env.DB_NAME}' created successfully`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
