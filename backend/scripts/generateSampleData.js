import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample data generator for testing without full Synthea/Kaggle datasets
// This creates small CSV files with realistic-looking synthetic data

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate patients.txt
function generatePatients(count = 100) {
  console.log(`Generating ${count} patients...`);
  
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const cities = ['Boston', 'New York', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  const states = ['MA', 'NY', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
  
  const headers = 'Id,BIRTHDATE,DEATHDATE,SSN,DRIVERS,PASSPORT,PREFIX,FIRST,LAST,SUFFIX,MAIDEN,MARITAL,RACE,ETHNICITY,GENDER,BIRTHPLACE,ADDRESS,CITY,STATE,COUNTY,ZIP,LAT,LON,HEALTHCARE_EXPENSES,HEALTHCARE_COVERAGE,INCOME\n';
  
  let csv = headers;
  
  for (let i = 0; i < count; i++) {
    const id = generateUUID();
    const birthDate = randomDate(new Date(1940, 0, 1), new Date(2010, 11, 31)).toISOString().split('T')[0];
    const gender = randomChoice(['M', 'F']);
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const cityIndex = randomInt(0, cities.length - 1);
    const city = cities[cityIndex];
    const state = states[cityIndex];
    const income = randomFloat(20000, 150000, 2);
    const expenses = randomFloat(1000, 50000, 2);
    const coverage = randomFloat(500, expenses, 2);
    
    csv += `${id},${birthDate},,999-${randomInt(10, 99)}-${randomInt(1000, 9999)},S99999999,,Mr.,${firstName},${lastName},,,,White,nonhispanic,${gender},${city} ${state},${randomInt(100, 999)} Main St,${city},${state},${city} County,${randomInt(10000, 99999)},${randomFloat(30, 45, 6)},${randomFloat(-120, -70, 6)},${expenses},${coverage},${income}\n`;
  }
  
  fs.writeFileSync(path.join(DATA_DIR, 'patients.txt'), csv);
  console.log('✓ patients.txt created');
  
  return csv.split('\n').slice(1, -1).map(line => line.split(',')[0]); // Return patient IDs
}

// Generate encounters.txt
function generateEncounters(patientIds, encountersPerPatient = 5) {
  console.log(`Generating encounters for ${patientIds.length} patients...`);
  
  const encounterClasses = ['ambulatory', 'emergency', 'inpatient', 'outpatient', 'wellness'];
  const codes = ['185345009', '185347001', '185349003', '185351004', '185353001'];
  const descriptions = ['Encounter for symptom', 'Emergency visit', 'Hospital admission', 'Outpatient visit', 'Wellness checkup'];
  
  const headers = 'Id,START,STOP,PATIENT,ORGANIZATION,PROVIDER,PAYER,ENCOUNTERCLASS,CODE,DESCRIPTION,BASE_ENCOUNTER_COST,TOTAL_CLAIM_COST,PAYER_COVERAGE,REASONCODE,REASONDESCRIPTION\n';
  
  let csv = headers;
  const encounterIds = [];
  
  for (const patientId of patientIds) {
    const numEncounters = randomInt(1, encountersPerPatient);
    
    for (let i = 0; i < numEncounters; i++) {
      const encounterId = generateUUID();
      encounterIds.push({ encounterId, patientId });
      
      const startDate = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31));
      const stopDate = new Date(startDate.getTime() + randomInt(1, 24) * 3600000); // 1-24 hours later
      const encounterClass = randomChoice(encounterClasses);
      const codeIndex = encounterClasses.indexOf(encounterClass);
      const baseCost = randomFloat(100, 5000, 2);
      const totalCost = randomFloat(baseCost, parseFloat(baseCost) * 1.5, 2);
      const coverage = randomFloat(totalCost * 0.6, totalCost * 0.95, 2);
      
      csv += `${encounterId},${startDate.toISOString()},${stopDate.toISOString()},${patientId},${generateUUID()},${generateUUID()},${generateUUID()},${encounterClass},${codes[codeIndex]},${descriptions[codeIndex]},${baseCost},${totalCost},${coverage},${codes[codeIndex]},${descriptions[codeIndex]}\n`;
    }
  }
  
  fs.writeFileSync(path.join(DATA_DIR, 'encounters.txt'), csv);
  console.log('✓ encounters.txt created');
  
  return encounterIds;
}

// Generate conditions.txt
function generateConditions(encounters, conditionsPerEncounter = 2) {
  console.log(`Generating conditions for ${encounters.length} encounters...`);
  
  const codes = ['44054006', '195662009', '271737000', '368009', '161891005'];
  const descriptions = ['Type 2 Diabetes', 'Hypertension', 'Anemia', 'Heart disease', 'Asthma'];
  
  const headers = 'START,STOP,PATIENT,ENCOUNTER,CODE,DESCRIPTION\n';
  
  let csv = headers;
  
  for (const { encounterId, patientId } of encounters) {
    const numConditions = randomInt(0, conditionsPerEncounter);
    
    for (let i = 0; i < numConditions; i++) {
      const startDate = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)).toISOString().split('T')[0];
      const codeIndex = randomInt(0, codes.length - 1);
      
      csv += `${startDate},,${patientId},${encounterId},${codes[codeIndex]},${descriptions[codeIndex]}\n`;
    }
  }
  
  fs.writeFileSync(path.join(DATA_DIR, 'conditions.txt'), csv);
  console.log('✓ conditions.txt created');
}

// Generate immunizations.txt
function generateImmunizations(encounters) {
  console.log(`Generating immunizations for ${encounters.length} encounters...`);
  
  const codes = ['140', '141', '143', '150', '88'];
  const descriptions = ['Influenza vaccine', 'COVID-19 vaccine', 'Hepatitis B vaccine', 'Pneumococcal vaccine', 'Tetanus vaccine'];
  
  const headers = 'DATE,PATIENT,ENCOUNTER,CODE,DESCRIPTION,BASE_COST\n';
  
  let csv = headers;
  
  // Only some encounters have immunizations
  const immunizationEncounters = encounters.filter(() => Math.random() < 0.3);
  
  for (const { encounterId, patientId } of immunizationEncounters) {
    const date = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)).toISOString().split('T')[0];
    const codeIndex = randomInt(0, codes.length - 1);
    const cost = randomFloat(20, 150, 2);
    
    csv += `${date},${patientId},${encounterId},${codes[codeIndex]},${descriptions[codeIndex]},${cost}\n`;
  }
  
  fs.writeFileSync(path.join(DATA_DIR, 'immunizations.txt'), csv);
  console.log('✓ immunizations.txt created');
}

// Generate health_insurance_claims.csv
function generateClaims(patientIds, claimsPerPatient = 10) {
  console.log(`Generating claims for ${patientIds.length} patients...`);
  
  const claimStatuses = ['Approved', 'Denied', 'Pending', 'Paid', 'Rejected'];
  const claimTypes = ['Inpatient', 'Outpatient', 'Emergency', 'Pharmacy'];
  const insuranceTypes = ['PPO', 'HMO', 'Medicare', 'Medicaid', 'Private'];
  const payerNames = ['Blue Cross', 'Aetna', 'UnitedHealthcare', 'Cigna', 'Humana', 'Medicare', 'Medicaid'];
  const denialReasons = ['', '', '', 'Missing authorization', 'Medical necessity', 'Duplicate claim', 'Timely filing', 'Invalid code'];
  const submissionMethods = ['Electronic', 'Paper', 'Portal'];
  const diagnosisCodes = ['E11.9', 'I10', 'J44.9', 'M79.3', 'R51'];
  const procedureCodes = ['99213', '99214', '99215', '99285', '99291'];
  
  const headers = 'ClaimID,PatientID,ProviderID,ClaimAmount,ClaimDate,DiagnosisCode,ProcedureCode,PatientAge,PatientGender,ClaimStatus,ClaimType,ClaimSubmissionMethod,InsuranceType,PayerName,DenialReason,DaysToProcess\n';
  
  let csv = headers;
  
  for (const patientId of patientIds) {
    const numClaims = randomInt(1, claimsPerPatient);
    
    for (let i = 0; i < numClaims; i++) {
      const claimId = `CLM-${randomInt(100000, 999999)}`;
      const providerId = `PRV-${randomInt(1000, 9999)}`;
      const amount = randomFloat(100, 10000, 2);
      const claimDate = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)).toISOString().split('T')[0];
      const age = randomInt(0, 90);
      const gender = randomChoice(['Male', 'Female']);
      const status = randomChoice(claimStatuses);
      const claimType = randomChoice(claimTypes);
      const submissionMethod = randomChoice(submissionMethods);
      const insuranceType = randomChoice(insuranceTypes);
      const payerName = randomChoice(payerNames);
      const denialReason = status === 'Denied' || status === 'Rejected' ? randomChoice(denialReasons.slice(3)) : '';
      const daysToProcess = randomInt(5, 120);
      const diagnosisCode = randomChoice(diagnosisCodes);
      const procedureCode = randomChoice(procedureCodes);
      
      csv += `${claimId},${patientId},${providerId},${amount},${claimDate},${diagnosisCode},${procedureCode},${age},${gender},${status},${claimType},${submissionMethod},${insuranceType},${payerName},${denialReason},${daysToProcess}\n`;
    }
  }
  
  fs.writeFileSync(path.join(DATA_DIR, 'health_insurance_claims.csv'), csv);
  console.log('✓ health_insurance_claims.csv created');
}

// Main execution
console.log('='.repeat(60));
console.log('Sample Data Generator for RCM Analytics');
console.log('='.repeat(60));
console.log(`\nData directory: ${DATA_DIR}\n`);

const patientIds = generatePatients(100);
const encounters = generateEncounters(patientIds, 5);
generateConditions(encounters, 2);
generateImmunizations(encounters);
generateClaims(patientIds, 10);

console.log('\n' + '='.repeat(60));
console.log('Sample data generation complete!');
console.log('='.repeat(60));
console.log('\nGenerated files:');
console.log('  - patients.txt (100 patients)');
console.log('  - encounters.txt (~500 encounters)');
console.log('  - conditions.txt (~1000 conditions)');
console.log('  - immunizations.txt (~150 immunizations)');
console.log('  - health_insurance_claims.csv (~1000 claims)');
console.log('\nNext steps:');
console.log('  1. cd backend');
console.log('  2. npm run init-db');
console.log('  3. npm run import-data');
console.log('='.repeat(60));
