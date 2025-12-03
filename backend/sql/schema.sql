-- ============================================================================
-- RCM Operations Analytics Dashboard - Database Schema
-- ============================================================================
-- This schema supports synthetic healthcare data analysis for RCM operations
-- including patients, encounters, conditions, immunizations, and claims.
-- ============================================================================

-- Drop existing tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS immunizations CASCADE;
DROP TABLE IF EXISTS conditions CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS encounters CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================
-- Stores patient demographics and financial summary data
-- Source: patients.txt (Synthea-style data)
-- ============================================================================
CREATE TABLE patients (
    id VARCHAR(100) PRIMARY KEY,
    birth_date DATE,
    death_date DATE,
    ssn VARCHAR(11),
    drivers_license VARCHAR(50),
    passport VARCHAR(50),
    prefix VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    suffix VARCHAR(10),
    maiden_name VARCHAR(100),
    marital_status VARCHAR(1),
    race VARCHAR(50),
    ethnicity VARCHAR(50),
    gender VARCHAR(1),
    birthplace VARCHAR(200),
    address VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(2),
    county VARCHAR(100),
    zip VARCHAR(10),
    lat NUMERIC(10, 6),
    lon NUMERIC(10, 6),
    healthcare_expenses NUMERIC(12, 2),
    healthcare_coverage NUMERIC(12, 2),
    income NUMERIC(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ENCOUNTERS TABLE
-- ============================================================================
-- Stores healthcare encounters (visits, admissions, procedures)
-- Source: encounters.txt (Synthea-style data)
-- ============================================================================
CREATE TABLE encounters (
    id VARCHAR(100) PRIMARY KEY,
    start_time TIMESTAMP,
    stop_time TIMESTAMP,
    patient_id VARCHAR(100) NOT NULL,
    organization_id VARCHAR(100),
    provider_id VARCHAR(100),
    payer_id VARCHAR(100),
    encounter_class VARCHAR(50),
    code VARCHAR(50),
    description VARCHAR(500),
    base_encounter_cost NUMERIC(12, 2),
    total_claim_cost NUMERIC(12, 2),
    payer_coverage NUMERIC(12, 2),
    reason_code VARCHAR(50),
    reason_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ============================================================================
-- CONDITIONS TABLE
-- ============================================================================
-- Stores patient diagnoses/conditions linked to encounters
-- Source: conditions.txt (Synthea-style data)
-- ============================================================================
CREATE TABLE conditions (
    id SERIAL PRIMARY KEY,
    start_date DATE,
    stop_date DATE,
    patient_id VARCHAR(100) NOT NULL,
    encounter_id VARCHAR(100),
    code VARCHAR(50),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL
);

-- ============================================================================
-- IMMUNIZATIONS TABLE
-- ============================================================================
-- Stores immunization records linked to encounters
-- Source: immunizations.txt (Synthea-style data)
-- ============================================================================
CREATE TABLE immunizations (
    id SERIAL PRIMARY KEY,
    date DATE,
    patient_id VARCHAR(100) NOT NULL,
    encounter_id VARCHAR(100),
    code VARCHAR(50),
    description VARCHAR(500),
    base_cost NUMERIC(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE SET NULL
);

-- ============================================================================
-- CLAIMS TABLE
-- ============================================================================
-- Stores insurance claims data from Kaggle dataset
-- Source: health_insurance_claims.csv
-- Note: patient_id may need mapping to patients table depending on data
-- ============================================================================
CREATE TABLE claims (
    claim_id VARCHAR(100) PRIMARY KEY,
    patient_id VARCHAR(100),
    provider_id VARCHAR(100),
    claim_amount NUMERIC(12, 2),
    claim_date DATE,
    diagnosis_code VARCHAR(50),
    procedure_code VARCHAR(50),
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    claim_status VARCHAR(50),
    claim_type VARCHAR(50),
    claim_submission_method VARCHAR(50),
    insurance_type VARCHAR(50),
    payer_name VARCHAR(200),
    denial_reason VARCHAR(500),
    days_to_process INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- These indexes optimize common RCM analytics queries

-- Patient lookups
CREATE INDEX idx_patients_city_state ON patients(city, state);
CREATE INDEX idx_patients_gender ON patients(gender);

-- Encounter queries
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_start_time ON encounters(start_time);
CREATE INDEX idx_encounters_encounter_class ON encounters(encounter_class);
CREATE INDEX idx_encounters_payer_id ON encounters(payer_id);

-- Condition queries
CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_conditions_encounter_id ON conditions(encounter_id);
CREATE INDEX idx_conditions_code ON conditions(code);

-- Immunization queries
CREATE INDEX idx_immunizations_patient_id ON immunizations(patient_id);
CREATE INDEX idx_immunizations_encounter_id ON immunizations(encounter_id);
CREATE INDEX idx_immunizations_date ON immunizations(date);

-- Claims queries (critical for RCM analytics)
CREATE INDEX idx_claims_patient_id ON claims(patient_id);
CREATE INDEX idx_claims_claim_date ON claims(claim_date);
CREATE INDEX idx_claims_claim_status ON claims(claim_status);
CREATE INDEX idx_claims_claim_type ON claims(claim_type);
CREATE INDEX idx_claims_payer_name ON claims(payer_name);
CREATE INDEX idx_claims_diagnosis_code ON claims(diagnosis_code);
CREATE INDEX idx_claims_procedure_code ON claims(procedure_code);

-- ============================================================================
-- VIEWS FOR COMMON RCM ANALYTICS
-- ============================================================================

-- View: Patient financial summary with claim totals
CREATE OR REPLACE VIEW vw_patient_financial_summary AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.gender,
    p.city,
    p.state,
    p.healthcare_expenses,
    p.healthcare_coverage,
    p.income,
    COUNT(DISTINCT e.id) as total_encounters,
    COUNT(DISTINCT c.claim_id) as total_claims,
    COALESCE(SUM(c.claim_amount), 0) as total_claim_amount,
    COALESCE(SUM(e.total_claim_cost), 0) as total_encounter_cost,
    COALESCE(SUM(e.payer_coverage), 0) as total_payer_coverage
FROM patients p
LEFT JOIN encounters e ON p.id = e.patient_id
LEFT JOIN claims c ON p.id = c.patient_id
GROUP BY p.id, p.first_name, p.last_name, p.gender, p.city, p.state, 
         p.healthcare_expenses, p.healthcare_coverage, p.income;

-- View: Claims with denial indicators
CREATE OR REPLACE VIEW vw_claims_with_denials AS
SELECT 
    c.*,
    CASE 
        WHEN LOWER(c.claim_status) IN ('denied', 'rejected') THEN 1 
        ELSE 0 
    END as is_denied,
    CASE 
        WHEN LOWER(c.claim_status) IN ('approved', 'paid') THEN 1 
        ELSE 0 
    END as is_approved
FROM claims c;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE patients IS 'Patient demographics and financial summary';
COMMENT ON TABLE encounters IS 'Healthcare encounters including visits and procedures';
COMMENT ON TABLE conditions IS 'Patient diagnoses and conditions';
COMMENT ON TABLE immunizations IS 'Immunization records';
COMMENT ON TABLE claims IS 'Insurance claims from Kaggle dataset';

COMMENT ON COLUMN encounters.encounter_class IS 'Type of encounter: ambulatory, emergency, inpatient, wellness, urgentcare, outpatient';
COMMENT ON COLUMN claims.claim_status IS 'Status: Approved, Denied, Pending, Paid, Rejected';
COMMENT ON COLUMN claims.claim_type IS 'Type: Inpatient, Outpatient, Emergency, Pharmacy';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
