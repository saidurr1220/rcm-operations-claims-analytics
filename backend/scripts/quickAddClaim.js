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

// Quick templates
const templates = {
  approved: {
    name: 'Quick Approved Claim',
    diagnosis: { code: 'E11.9', name: 'Type 2 Diabetes' },
    procedure: { code: '99213', name: 'Office visit' },
    amount: 150,
    status: 'Approved',
    type: 'Outpatient',
    payer: 'Blue Cross',
    days: 15
  },
  denied: {
    name: 'Quick Denied Claim',
    diagnosis: { code: 'I10', name: 'Hypertension' },
    procedure: { code: '99214', name: 'Detailed visit' },
    amount: 200,
    status: 'Denied',
    type: 'Outpatient',
    payer: 'Aetna',
    denial: 'Missing authorization',
    days: 30
  },
  pending: {
    name: 'Quick Pending Claim',
    diagnosis: { code: 'J44.9', name: 'COPD' },
    procedure: { code: '99285', name: 'Emergency visit' },
    amount: 500,
    status: 'Pending',
    type: 'Emergency',
    payer: 'Medicare',
    days: 45
  },
  emergency: {
    name: 'Quick Emergency Claim',
    diagnosis: { code: 'R51', name: 'Headache' },
    procedure: { code: '99285', name: 'Emergency visit' },
    amount: 450,
    status: 'Approved',
    type: 'Emergency',
    payer: 'Cigna',
    days: 20
  }
};

async function quickAdd(templateName) {
  const template = templates[templateName];
  
  if (!template) {
    console.log('\n✗ Invalid template!');
    console.log('\nAvailable templates:');
    console.log('  approved  - Approved outpatient claim ($150)');
    console.log('  denied    - Denied claim with missing auth ($200)');
    console.log('  pending   - Pending claim ($500)');
    console.log('  emergency - Approved emergency claim ($450)');
    console.log('\nUsage: node quickAddClaim.js [template]');
    console.log('Example: node quickAddClaim.js approved');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Adding: ${template.name}`);
  console.log('='.repeat(60));

  const client = await pool.connect();

  try {
    // Get random patient
    const patientResult = await client.query('SELECT id FROM patients ORDER BY RANDOM() LIMIT 1');
    const patientId = patientResult.rows[0].id;

    // Generate unique claim ID
    const claimId = `CLM-QUICK-${Date.now()}`;

    const insertQuery = `
      INSERT INTO claims (
        claim_id, patient_id, provider_id, claim_amount, claim_date,
        diagnosis_code, procedure_code, patient_age, patient_gender,
        claim_status, claim_type, payer_name, denial_reason, days_to_process
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      claimId,
      patientId,
      'PRV-' + Math.floor(Math.random() * 9000 + 1000),
      template.amount,
      new Date(),
      template.diagnosis.code,
      template.procedure.code,
      Math.floor(Math.random() * 50) + 25, // Random age 25-75
      Math.random() > 0.5 ? 'Male' : 'Female',
      template.status,
      template.type,
      template.payer,
      template.denial || null,
      template.days
    ];

    const result = await client.query(insertQuery, values);

    console.log('\n✓ Claim added successfully!');
    console.log('\nDetails:');
    console.log(`  Claim ID: ${result.rows[0].claim_id}`);
    console.log(`  Diagnosis: ${template.diagnosis.code} (${template.diagnosis.name})`);
    console.log(`  Procedure: ${template.procedure.code} (${template.procedure.name})`);
    console.log(`  Amount: $${template.amount}`);
    console.log(`  Status: ${template.status}`);
    if (template.denial) console.log(`  Denial Reason: ${template.denial}`);
    console.log(`  Payer: ${template.payer}`);

    console.log('\n' + '='.repeat(60));
    console.log('✓ Done! Refresh dashboard: http://localhost:3002');
    console.log('='.repeat(60));

    client.release();
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Main
const templateName = process.argv[2];

if (!templateName) {
  console.log('\n' + '='.repeat(60));
  console.log('Quick Claim Generator');
  console.log('='.repeat(60));
  console.log('\nAvailable templates:\n');
  console.log('  approved  - Approved outpatient claim ($150)');
  console.log('  denied    - Denied claim with missing auth ($200)');
  console.log('  pending   - Pending claim ($500)');
  console.log('  emergency - Approved emergency claim ($450)');
  console.log('\nUsage: node quickAddClaim.js [template]');
  console.log('Example: node quickAddClaim.js approved');
  console.log('\nOr use npm:');
  console.log('  npm run quick-claim approved');
  process.exit(0);
}

quickAdd(templateName);
