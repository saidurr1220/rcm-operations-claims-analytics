import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Common codes for easy selection
const diagnosisCodes = {
  1: { code: 'E11.9', name: 'Type 2 Diabetes' },
  2: { code: 'I10', name: 'Hypertension' },
  3: { code: 'J44.9', name: 'COPD' },
  4: { code: 'M79.3', name: 'Myalgia (Muscle pain)' },
  5: { code: 'R51', name: 'Headache' },
  6: { code: 'Z00.00', name: 'General exam' }
};

const procedureCodes = {
  1: { code: '99213', name: 'Office visit', amount: 125 },
  2: { code: '99214', name: 'Detailed visit', amount: 175 },
  3: { code: '99215', name: 'Comprehensive visit', amount: 250 },
  4: { code: '99285', name: 'Emergency visit', amount: 450 },
  5: { code: '99291', name: 'Critical care', amount: 800 }
};

const payers = ['Blue Cross', 'Aetna', 'UnitedHealthcare', 'Cigna', 'Humana', 'Medicare', 'Medicaid'];
const claimTypes = ['Outpatient', 'Inpatient', 'Emergency', 'Pharmacy'];

async function addCustomClaim() {
  console.log('\n' + '='.repeat(60));
  console.log('Create Your Own Claim (Interactive)');
  console.log('='.repeat(60));

  try {
    // Diagnosis Code
    console.log('\nSelect Diagnosis Code:');
    Object.keys(diagnosisCodes).forEach(key => {
      const d = diagnosisCodes[key];
      console.log(`  ${key}. ${d.code} - ${d.name}`);
    });
    const diagChoice = await question('\nEnter number (1-6): ');
    const diagnosis = diagnosisCodes[diagChoice] || diagnosisCodes[1];

    // Procedure Code
    console.log('\nSelect Procedure Code:');
    Object.keys(procedureCodes).forEach(key => {
      const p = procedureCodes[key];
      console.log(`  ${key}. ${p.code} - ${p.name} ($${p.amount})`);
    });
    const procChoice = await question('\nEnter number (1-5): ');
    const procedure = procedureCodes[procChoice] || procedureCodes[1];

    // Claim Amount
    const defaultAmount = procedure.amount;
    const amountInput = await question(`\nClaim Amount (default $${defaultAmount}): `);
    const claimAmount = amountInput ? parseFloat(amountInput) : defaultAmount;

    // Patient Age
    const ageInput = await question('\nPatient Age (default 45): ');
    const patientAge = ageInput ? parseInt(ageInput) : 45;

    // Patient Gender
    const genderInput = await question('\nPatient Gender (M/F, default M): ');
    const patientGender = genderInput.toUpperCase() === 'F' ? 'Female' : 'Male';

    // Claim Status
    console.log('\nSelect Claim Status:');
    console.log('  1. Approved');
    console.log('  2. Denied');
    console.log('  3. Pending');
    const statusChoice = await question('\nEnter number (1-3, default 1): ');
    let claimStatus = 'Approved';
    let denialReason = null;
    
    if (statusChoice === '2') {
      claimStatus = 'Denied';
      console.log('\nSelect Denial Reason:');
      console.log('  1. Missing authorization');
      console.log('  2. Medical necessity not established');
      console.log('  3. Timely filing limit exceeded');
      console.log('  4. Duplicate claim');
      const denialChoice = await question('\nEnter number (1-4): ');
      const denialReasons = {
        1: 'Missing authorization',
        2: 'Medical necessity not established',
        3: 'Timely filing limit exceeded',
        4: 'Duplicate claim'
      };
      denialReason = denialReasons[denialChoice] || denialReasons[1];
    } else if (statusChoice === '3') {
      claimStatus = 'Pending';
    }

    // Claim Type
    console.log('\nSelect Claim Type:');
    claimTypes.forEach((type, idx) => {
      console.log(`  ${idx + 1}. ${type}`);
    });
    const typeChoice = await question('\nEnter number (1-4, default 1): ');
    const claimType = claimTypes[parseInt(typeChoice) - 1] || claimTypes[0];

    // Payer
    console.log('\nSelect Payer:');
    payers.forEach((payer, idx) => {
      console.log(`  ${idx + 1}. ${payer}`);
    });
    const payerChoice = await question('\nEnter number (1-7, default 1): ');
    const payerName = payers[parseInt(payerChoice) - 1] || payers[0];

    // Days to Process
    const daysInput = await question('\nDays to Process (default 20): ');
    const daysToProcess = daysInput ? parseInt(daysInput) : 20;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Claim Summary:');
    console.log('='.repeat(60));
    console.log(`Diagnosis: ${diagnosis.code} (${diagnosis.name})`);
    console.log(`Procedure: ${procedure.code} (${procedure.name})`);
    console.log(`Amount: $${claimAmount}`);
    console.log(`Patient: ${patientAge} years old, ${patientGender}`);
    console.log(`Status: ${claimStatus}`);
    if (denialReason) console.log(`Denial Reason: ${denialReason}`);
    console.log(`Type: ${claimType}`);
    console.log(`Payer: ${payerName}`);
    console.log(`Days to Process: ${daysToProcess}`);
    console.log('='.repeat(60));

    const confirm = await question('\nAdd this claim? (Y/n): ');
    if (confirm.toLowerCase() === 'n') {
      console.log('Cancelled.');
      rl.close();
      await pool.end();
      return;
    }

    // Add to database
    const client = await pool.connect();
    
    try {
      // Get random patient
      const patientResult = await client.query('SELECT id FROM patients ORDER BY RANDOM() LIMIT 1');
      const patientId = patientResult.rows[0].id;

      // Generate unique claim ID
      const claimId = `CLM-CUSTOM-${Date.now()}`;

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
        claimAmount,
        new Date(),
        diagnosis.code,
        procedure.code,
        patientAge,
        patientGender,
        claimStatus,
        claimType,
        payerName,
        denialReason,
        daysToProcess
      ];

      const result = await client.query(insertQuery, values);

      console.log('\n✓ Claim added successfully!');
      console.log(`Claim ID: ${result.rows[0].claim_id}`);
      console.log('\n' + '='.repeat(60));
      console.log('✓ Done! Refresh your dashboard:');
      console.log('  http://localhost:3002');
      console.log('='.repeat(60));

      client.release();
    } catch (error) {
      console.error('\n✗ Error:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

addCustomClaim();
