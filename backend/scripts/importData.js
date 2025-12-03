import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Get data directory from env or use default
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

// Helper: Parse date strings to PostgreSQL format
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

// Helper: Parse timestamp strings
function parseTimestamp(timestampStr) {
  if (!timestampStr || timestampStr.trim() === '') return null;
  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// Helper: Parse numeric values
function parseNumeric(value) {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// Helper: Parse integer values
function parseInteger(value) {
  if (!value || value.trim() === '') return null;
  const num = Number.parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// Helper: Clean string values
function cleanString(value) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

// Import patients from patients.txt
async function importPatients(client) {
  console.log('\n→ Importing patients...');
  const filePath = path.join(DATA_DIR, 'patients.txt');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    let count = 0;
    let errors = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const insertQuery = `
      INSERT INTO patients (
        id, birth_date, death_date, ssn, drivers_license, passport,
        prefix, first_name, last_name, suffix, maiden_name, marital_status,
        race, ethnicity, gender, birthplace, address, city, state, county,
        zip, lat, lon, healthcare_expenses, healthcare_coverage, income
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        const values = [
          cleanString(record.Id || record.ID),
          parseDate(record.BIRTHDATE || record.birthdate),
          parseDate(record.DEATHDATE || record.deathdate),
          cleanString(record.SSN || record.ssn),
          cleanString(record.DRIVERS || record.drivers_license),
          cleanString(record.PASSPORT || record.passport),
          cleanString(record.PREFIX || record.prefix),
          cleanString(record.FIRST || record.first_name),
          cleanString(record.LAST || record.last_name),
          cleanString(record.SUFFIX || record.suffix),
          cleanString(record.MAIDEN || record.maiden_name),
          cleanString(record.MARITAL || record.marital_status),
          cleanString(record.RACE || record.race),
          cleanString(record.ETHNICITY || record.ethnicity),
          cleanString(record.GENDER || record.gender),
          cleanString(record.BIRTHPLACE || record.birthplace),
          cleanString(record.ADDRESS || record.address),
          cleanString(record.CITY || record.city),
          cleanString(record.STATE || record.state),
          cleanString(record.COUNTY || record.county),
          cleanString(record.ZIP || record.zip),
          parseNumeric(record.LAT || record.lat),
          parseNumeric(record.LON || record.lon),
          parseNumeric(record.HEALTHCARE_EXPENSES || record.healthcare_expenses),
          parseNumeric(record.HEALTHCARE_COVERAGE || record.healthcare_coverage),
          parseNumeric(record.INCOME || record.income),
        ];
        
        batch.push(values);
        
        if (batch.length >= batchSize) {
          parser.pause();
          try {
            for (const vals of batch) {
              await client.query(insertQuery, vals);
              count++;
            }
            batch = [];
          } catch (error) {
            errors++;
            console.error(`  ✗ Error inserting patient: ${error.message}`);
          }
          parser.resume();
        }
      }
    });
    
    parser.on('end', async () => {
      try {
        // Insert remaining batch
        for (const vals of batch) {
          await client.query(insertQuery, vals);
          count++;
        }
        console.log(`  ✓ Imported ${count} patients (${errors} errors)`);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    fs.createReadStream(filePath).pipe(parser);
  });
}

// Import encounters from encounters.txt
async function importEncounters(client) {
  console.log('\n→ Importing encounters...');
  const filePath = path.join(DATA_DIR, 'encounters.txt');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    let count = 0;
    let errors = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const insertQuery = `
      INSERT INTO encounters (
        id, start_time, stop_time, patient_id, organization_id, provider_id,
        payer_id, encounter_class, code, description, base_encounter_cost,
        total_claim_cost, payer_coverage, reason_code, reason_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        const values = [
          cleanString(record.Id || record.ID),
          parseTimestamp(record.START || record.start_time),
          parseTimestamp(record.STOP || record.stop_time),
          cleanString(record.PATIENT || record.patient_id),
          cleanString(record.ORGANIZATION || record.organization_id),
          cleanString(record.PROVIDER || record.provider_id),
          cleanString(record.PAYER || record.payer_id),
          cleanString(record.ENCOUNTERCLASS || record.encounter_class),
          cleanString(record.CODE || record.code),
          cleanString(record.DESCRIPTION || record.description),
          parseNumeric(record.BASE_ENCOUNTER_COST || record.base_encounter_cost),
          parseNumeric(record.TOTAL_CLAIM_COST || record.total_claim_cost),
          parseNumeric(record.PAYER_COVERAGE || record.payer_coverage),
          cleanString(record.REASONCODE || record.reason_code),
          cleanString(record.REASONDESCRIPTION || record.reason_description),
        ];
        
        batch.push(values);
        
        if (batch.length >= batchSize) {
          parser.pause();
          try {
            for (const vals of batch) {
              await client.query(insertQuery, vals);
              count++;
            }
            batch = [];
          } catch (error) {
            errors++;
            if (errors <= 5) {
              console.error(`  ✗ Error inserting encounter: ${error.message}`);
            }
          }
          parser.resume();
        }
      }
    });
    
    parser.on('end', async () => {
      try {
        for (const vals of batch) {
          await client.query(insertQuery, vals);
          count++;
        }
        console.log(`  ✓ Imported ${count} encounters (${errors} errors)`);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    fs.createReadStream(filePath).pipe(parser);
  });
}

// Import conditions from conditions.txt
async function importConditions(client) {
  console.log('\n→ Importing conditions...');
  const filePath = path.join(DATA_DIR, 'conditions.txt');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    let count = 0;
    let errors = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const insertQuery = `
      INSERT INTO conditions (
        start_date, stop_date, patient_id, encounter_id, code, description
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `;
    
    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        const values = [
          parseDate(record.START || record.start_date),
          parseDate(record.STOP || record.stop_date),
          cleanString(record.PATIENT || record.patient_id),
          cleanString(record.ENCOUNTER || record.encounter_id),
          cleanString(record.CODE || record.code),
          cleanString(record.DESCRIPTION || record.description),
        ];
        
        batch.push(values);
        
        if (batch.length >= batchSize) {
          parser.pause();
          try {
            for (const vals of batch) {
              await client.query(insertQuery, vals);
              count++;
            }
            batch = [];
          } catch (error) {
            errors++;
            if (errors <= 5) {
              console.error(`  ✗ Error inserting condition: ${error.message}`);
            }
          }
          parser.resume();
        }
      }
    });
    
    parser.on('end', async () => {
      try {
        for (const vals of batch) {
          await client.query(insertQuery, vals);
          count++;
        }
        console.log(`  ✓ Imported ${count} conditions (${errors} errors)`);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    fs.createReadStream(filePath).pipe(parser);
  });
}

// Import immunizations from immunizations.txt
async function importImmunizations(client) {
  console.log('\n→ Importing immunizations...');
  const filePath = path.join(DATA_DIR, 'immunizations.txt');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    let count = 0;
    let errors = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const insertQuery = `
      INSERT INTO immunizations (
        date, patient_id, encounter_id, code, description, base_cost
      ) VALUES ($1, $2, $3, $4, $5, $6);
    `;
    
    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        const values = [
          parseDate(record.DATE || record.date),
          cleanString(record.PATIENT || record.patient_id),
          cleanString(record.ENCOUNTER || record.encounter_id),
          cleanString(record.CODE || record.code),
          cleanString(record.DESCRIPTION || record.description),
          parseNumeric(record.BASE_COST || record.base_cost),
        ];
        
        batch.push(values);
        
        if (batch.length >= batchSize) {
          parser.pause();
          try {
            for (const vals of batch) {
              await client.query(insertQuery, vals);
              count++;
            }
            batch = [];
          } catch (error) {
            errors++;
            if (errors <= 5) {
              console.error(`  ✗ Error inserting immunization: ${error.message}`);
            }
          }
          parser.resume();
        }
      }
    });
    
    parser.on('end', async () => {
      try {
        for (const vals of batch) {
          await client.query(insertQuery, vals);
          count++;
        }
        console.log(`  ✓ Imported ${count} immunizations (${errors} errors)`);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    fs.createReadStream(filePath).pipe(parser);
  });
}

// Import claims from health_insurance_claims.csv
async function importClaims(client) {
  console.log('\n→ Importing claims...');
  const filePath = path.join(DATA_DIR, 'health_insurance_claims.csv');
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ File not found: ${filePath}`);
    return 0;
  }
  
  return new Promise((resolve, reject) => {
    let count = 0;
    let errors = 0;
    const batchSize = 100;
    let batch = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    const insertQuery = `
      INSERT INTO claims (
        claim_id, patient_id, provider_id, claim_amount, claim_date,
        diagnosis_code, procedure_code, patient_age, patient_gender,
        claim_status, claim_type, claim_submission_method, insurance_type,
        payer_name, denial_reason, days_to_process
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (claim_id) DO NOTHING;
    `;
    
    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        const values = [
          cleanString(record.ClaimID || record.claim_id),
          cleanString(record.PatientID || record.patient_id),
          cleanString(record.ProviderID || record.provider_id),
          parseNumeric(record.ClaimAmount || record.claim_amount),
          parseDate(record.ClaimDate || record.claim_date),
          cleanString(record.DiagnosisCode || record.diagnosis_code),
          cleanString(record.ProcedureCode || record.procedure_code),
          parseInteger(record.PatientAge || record.patient_age),
          cleanString(record.PatientGender || record.patient_gender),
          cleanString(record.ClaimStatus || record.claim_status),
          cleanString(record.ClaimType || record.claim_type),
          cleanString(record.ClaimSubmissionMethod || record.claim_submission_method),
          cleanString(record.InsuranceType || record.insurance_type),
          cleanString(record.PayerName || record.payer_name),
          cleanString(record.DenialReason || record.denial_reason),
          parseInteger(record.DaysToProcess || record.days_to_process),
        ];
        
        batch.push(values);
        
        if (batch.length >= batchSize) {
          parser.pause();
          try {
            for (const vals of batch) {
              await client.query(insertQuery, vals);
              count++;
            }
            batch = [];
          } catch (error) {
            errors++;
            if (errors <= 5) {
              console.error(`  ✗ Error inserting claim: ${error.message}`);
            }
          }
          parser.resume();
        }
      }
    });
    
    parser.on('end', async () => {
      try {
        for (const vals of batch) {
          await client.query(insertQuery, vals);
          count++;
        }
        console.log(`  ✓ Imported ${count} claims (${errors} errors)`);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    fs.createReadStream(filePath).pipe(parser);
  });
}

// Main import function
async function importAllData() {
  console.log('='.repeat(60));
  console.log('RCM Analytics Data Import');
  console.log('='.repeat(60));
  console.log(`\nData directory: ${DATA_DIR}`);
  
  const client = await pool.connect();
  
  try {
    console.log('\n✓ Connected to PostgreSQL');
    
    // Import in order (patients first due to foreign keys)
    const startTime = Date.now();
    
    const patientCount = await importPatients(client);
    const encounterCount = await importEncounters(client);
    const conditionCount = await importConditions(client);
    const immunizationCount = await importImmunizations(client);
    const claimCount = await importClaims(client);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`  Patients:      ${patientCount.toLocaleString()}`);
    console.log(`  Encounters:    ${encounterCount.toLocaleString()}`);
    console.log(`  Conditions:    ${conditionCount.toLocaleString()}`);
    console.log(`  Immunizations: ${immunizationCount.toLocaleString()}`);
    console.log(`  Claims:        ${claimCount.toLocaleString()}`);
    console.log(`  Total time:    ${duration}s`);
    console.log('='.repeat(60));
    console.log('\n✓ Data import completed successfully!');
    console.log('\nNext step: Start the API server with "npm start"');
    
  } catch (error) {
    console.error('\n✗ Error during data import:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run import
importAllData();
