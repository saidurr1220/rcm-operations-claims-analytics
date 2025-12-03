import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addSampleClaim() {
  console.log('='.repeat(60));
  console.log('Adding Sample Claim to Database');
  console.log('='.repeat(60));

  const client = await pool.connect();

  try {
    // Get a random patient ID
    const patientResult = await client.query('SELECT id FROM patients LIMIT 1');
    const patientId = patientResult.rows[0].id;

    // Add a new claim
    const insertQuery = `
      INSERT INTO claims (
        claim_id, patient_id, provider_id, claim_amount, claim_date,
        diagnosis_code, procedure_code, patient_age, patient_gender,
        claim_status, claim_type, payer_name, days_to_process
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      'CLM-MY001',           // claim_id
      patientId,             // patient_id
      'PRV-1234',            // provider_id
      1500.00,               // claim_amount
      new Date(),            // claim_date
      'E11.9',               // diagnosis_code (Type 2 Diabetes)
      '99213',               // procedure_code (Office visit)
      45,                    // patient_age
      'Male',                // patient_gender
      'Approved',            // claim_status
      'Outpatient',          // claim_type
      'Blue Cross',          // payer_name
      15                     // days_to_process
    ];

    const result = await client.query(insertQuery, values);

    console.log('\n✓ Claim added successfully!');
    console.log('\nClaim Details:');
    console.log('  Claim ID:', result.rows[0].claim_id);
    console.log('  Patient ID:', result.rows[0].patient_id);
    console.log('  Amount:', `$${result.rows[0].claim_amount}`);
    console.log('  Diagnosis:', result.rows[0].diagnosis_code, '(Type 2 Diabetes)');
    console.log('  Procedure:', result.rows[0].procedure_code, '(Office visit)');
    console.log('  Status:', result.rows[0].claim_status);
    console.log('  Payer:', result.rows[0].payer_name);

    console.log('\n' + '='.repeat(60));
    console.log('✓ Done! Refresh your dashboard to see the new claim.');
    console.log('Dashboard: http://localhost:3002');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Error adding claim:');
    console.error(error.message);
    
    if (error.code === '23505') {
      console.log('\nNote: Claim ID already exists. Try changing CLM-MY001 to CLM-MY002');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleClaim();
