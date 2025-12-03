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

// Predefined claim scenarios for practice
const scenarios = {
  1: {
    name: 'Approved Outpatient Visit',
    claim_id: 'CLM-PRACTICE-001',
    claim_amount: 1500.00,
    diagnosis_code: 'E11.9',
    diagnosis_name: 'Type 2 Diabetes',
    procedure_code: '99213',
    procedure_name: 'Office visit',
    patient_age: 45,
    patient_gender: 'Male',
    claim_status: 'Approved',
    claim_type: 'Outpatient',
    payer_name: 'Blue Cross',
    denial_reason: null,
    days_to_process: 15
  },
  2: {
    name: 'Denied - Missing Authorization',
    claim_id: 'CLM-PRACTICE-002',
    claim_amount: 2500.00,
    diagnosis_code: 'I10',
    diagnosis_name: 'Hypertension',
    procedure_code: '99214',
    procedure_name: 'Detailed office visit',
    patient_age: 55,
    patient_gender: 'Female',
    claim_status: 'Denied',
    claim_type: 'Outpatient',
    payer_name: 'Aetna',
    denial_reason: 'Missing authorization',
    days_to_process: 45
  },
  3: {
    name: 'Pending - Long Processing',
    claim_id: 'CLM-PRACTICE-003',
    claim_amount: 5000.00,
    diagnosis_code: 'J44.9',
    diagnosis_name: 'COPD',
    procedure_code: '99285',
    procedure_name: 'Emergency visit',
    patient_age: 68,
    patient_gender: 'Male',
    claim_status: 'Pending',
    claim_type: 'Emergency',
    payer_name: 'Medicare',
    denial_reason: null,
    days_to_process: 95  // Over 90 days - will show in QA issues!
  },
  4: {
    name: 'Denied - Medical Necessity',
    claim_id: 'CLM-PRACTICE-004',
    claim_amount: 3200.00,
    diagnosis_code: 'M79.3',
    diagnosis_name: 'Myalgia (Muscle pain)',
    procedure_code: '99215',
    procedure_name: 'Comprehensive visit',
    patient_age: 42,
    patient_gender: 'Female',
    claim_status: 'Denied',
    claim_type: 'Outpatient',
    payer_name: 'UnitedHealthcare',
    denial_reason: 'Medical necessity not established',
    days_to_process: 30
  },
  5: {
    name: 'Approved Emergency Visit',
    claim_id: 'CLM-PRACTICE-005',
    claim_amount: 4500.00,
    diagnosis_code: 'R51',
    diagnosis_name: 'Headache',
    procedure_code: '99285',
    procedure_name: 'Emergency visit',
    patient_age: 35,
    patient_gender: 'Male',
    claim_status: 'Approved',
    claim_type: 'Emergency',
    payer_name: 'Cigna',
    denial_reason: null,
    days_to_process: 20
  }
};

async function addClaim(scenarioNumber) {
  console.log('='.repeat(60));
  console.log('Adding Practice Claim to Database');
  console.log('='.repeat(60));

  const scenario = scenarios[scenarioNumber];
  
  if (!scenario) {
    console.log('\n✗ Invalid scenario number!');
    console.log('Please choose 1-5');
    return;
  }

  console.log(`\nScenario: ${scenario.name}`);
  console.log('-'.repeat(60));

  const client = await pool.connect();

  try {
    // Get a random patient ID
    const patientResult = await client.query('SELECT id FROM patients ORDER BY RANDOM() LIMIT 1');
    const patientId = patientResult.rows[0].id;

    // Check if claim ID already exists
    const checkQuery = 'SELECT claim_id FROM claims WHERE claim_id = $1';
    const checkResult = await client.query(checkQuery, [scenario.claim_id]);
    
    if (checkResult.rows.length > 0) {
      console.log(`\n⚠ Claim ${scenario.claim_id} already exists!`);
      console.log('Generating new claim ID...');
      scenario.claim_id = `CLM-PRACTICE-${Date.now()}`;
    }

    // Add the claim
    const insertQuery = `
      INSERT INTO claims (
        claim_id, patient_id, provider_id, claim_amount, claim_date,
        diagnosis_code, procedure_code, patient_age, patient_gender,
        claim_status, claim_type, payer_name, denial_reason, days_to_process
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      scenario.claim_id,
      patientId,
      'PRV-' + Math.floor(Math.random() * 9000 + 1000),
      scenario.claim_amount,
      new Date(),
      scenario.diagnosis_code,
      scenario.procedure_code,
      scenario.patient_age,
      scenario.patient_gender,
      scenario.claim_status,
      scenario.claim_type,
      scenario.payer_name,
      scenario.denial_reason,
      scenario.days_to_process
    ];

    const result = await client.query(insertQuery, values);

    console.log('\n✓ Claim added successfully!');
    console.log('\nClaim Details:');
    console.log('  Claim ID:', result.rows[0].claim_id);
    console.log('  Amount:', `$${result.rows[0].claim_amount}`);
    console.log('  Diagnosis:', `${result.rows[0].diagnosis_code} (${scenario.diagnosis_name})`);
    console.log('  Procedure:', `${result.rows[0].procedure_code} (${scenario.procedure_name})`);
    console.log('  Status:', result.rows[0].claim_status);
    console.log('  Payer:', result.rows[0].payer_name);
    if (result.rows[0].denial_reason) {
      console.log('  Denial Reason:', result.rows[0].denial_reason);
    }
    console.log('  Days to Process:', result.rows[0].days_to_process);

    // Show where to see this claim
    console.log('\n' + '='.repeat(60));
    console.log('✓ Done! Check your dashboard:');
    console.log('  Overview: http://localhost:3002');
    
    if (scenario.claim_status === 'Denied') {
      console.log('  Denials: http://localhost:3002/denials');
    }
    
    if (scenario.days_to_process > 90) {
      console.log('  QA Issues: http://localhost:3002/qa (Long processing time)');
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Error adding claim:');
    console.error(error.message);
  } finally {
    client.release();
  }
}

// Main execution
console.log('\n' + '='.repeat(60));
console.log('RCM Practice Claim Generator');
console.log('='.repeat(60));
console.log('\nAvailable Scenarios:\n');

Object.keys(scenarios).forEach(key => {
  const s = scenarios[key];
  console.log(`${key}. ${s.name}`);
  console.log(`   Diagnosis: ${s.diagnosis_code} (${s.diagnosis_name})`);
  console.log(`   Status: ${s.claim_status} | Amount: $${s.claim_amount}`);
  console.log('');
});

// Main execution function
async function main() {
  const arg = process.argv[2];
  
  if (!arg) {
    console.log('Usage: node addCustomClaim.js [scenario_number]');
    console.log('Example: node addCustomClaim.js 1');
    console.log('\nOr add all scenarios:');
    console.log('  node addCustomClaim.js all');
    return;
  }
  
  try {
    if (arg === 'all') {
      console.log('Adding all scenarios...\n');
      for (let i = 1; i <= 5; i++) {
        await addClaim(i);
        if (i < 5) console.log('\n');
      }
    } else {
      const scenarioNumber = parseInt(arg);
      if (isNaN(scenarioNumber) || scenarioNumber < 1 || scenarioNumber > 5) {
        console.log('✗ Invalid scenario number! Please choose 1-5');
        return;
      }
      await addClaim(scenarioNumber);
    }
  } finally {
    await pool.end();
  }
}

main();
