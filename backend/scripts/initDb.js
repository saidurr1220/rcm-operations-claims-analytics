import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

// Create a new pool for initialization
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  console.log('='.repeat(60));
  console.log('RCM Analytics Database Initialization');
  console.log('='.repeat(60));
  
  const client = await pool.connect();
  
  try {
    console.log('\n✓ Connected to PostgreSQL');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    console.log(`\n→ Reading schema from: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`✓ Schema file loaded (${schemaSql.length} characters)`);
    
    // Execute schema
    console.log('\n→ Executing schema SQL...');
    await client.query(schemaSql);
    console.log('✓ Schema created successfully');
    
    // Verify tables were created
    console.log('\n→ Verifying tables...');
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tableCheckQuery);
    console.log(`✓ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verify views were created
    console.log('\n→ Verifying views...');
    const viewCheckQuery = `
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const viewResult = await client.query(viewCheckQuery);
    console.log(`✓ Found ${viewResult.rows.length} views:`);
    viewResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verify indexes
    console.log('\n→ Verifying indexes...');
    const indexCheckQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname;
    `;
    
    const indexResult = await client.query(indexCheckQuery);
    console.log(`✓ Found ${indexResult.rows.length} indexes`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Database initialization completed successfully!');
    console.log('='.repeat(60));
    console.log('\nNext step: Run "npm run import-data" to load CSV/TXT files');
    
  } catch (error) {
    console.error('\n✗ Error during database initialization:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
