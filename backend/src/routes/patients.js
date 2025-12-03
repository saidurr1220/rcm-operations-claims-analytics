import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/patients/summary
// Returns patient list with financial summary
router.get('/summary', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const query = `
      SELECT * FROM vw_patient_financial_summary
      ORDER BY total_claim_amount DESC
      LIMIT $1 OFFSET $2;
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM patients;`;
    
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    res.json({
      success: true,
      data: dataResult.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        gender: row.gender,
        city: row.city,
        state: row.state,
        healthcareExpenses: parseFloat(row.healthcare_expenses || 0),
        healthcareCoverage: parseFloat(row.healthcare_coverage || 0),
        income: parseFloat(row.income || 0),
        totalEncounters: parseInt(row.total_encounters),
        totalClaims: parseInt(row.total_claims),
        totalClaimAmount: parseFloat(row.total_claim_amount),
        totalEncounterCost: parseFloat(row.total_encounter_cost),
        totalPayerCoverage: parseFloat(row.total_payer_coverage)
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error fetching patient summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient summary',
      message: error.message 
    });
  }
});

// GET /api/patients/:id
// Returns detailed patient information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        COUNT(DISTINCT e.id) as total_encounters,
        COUNT(DISTINCT c.claim_id) as total_claims,
        COALESCE(SUM(c.claim_amount), 0) as total_claim_amount
      FROM patients p
      LEFT JOIN encounters e ON p.id = e.patient_id
      LEFT JOIN claims c ON p.id = c.patient_id
      WHERE p.id = $1
      GROUP BY p.id;
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }
    
    const patient = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: patient.id,
        birthDate: patient.birth_date,
        deathDate: patient.death_date,
        firstName: patient.first_name,
        lastName: patient.last_name,
        gender: patient.gender,
        race: patient.race,
        ethnicity: patient.ethnicity,
        maritalStatus: patient.marital_status,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zip: patient.zip,
        healthcareExpenses: parseFloat(patient.healthcare_expenses || 0),
        healthcareCoverage: parseFloat(patient.healthcare_coverage || 0),
        income: parseFloat(patient.income || 0),
        totalEncounters: parseInt(patient.total_encounters),
        totalClaims: parseInt(patient.total_claims),
        totalClaimAmount: parseFloat(patient.total_claim_amount)
      }
    });
  } catch (error) {
    console.error('Error fetching patient detail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient detail',
      message: error.message 
    });
  }
});

// GET /api/patients/:id/encounters
// Returns all encounters for a specific patient
router.get('/:id/encounters', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        e.*,
        COUNT(DISTINCT co.id) as condition_count
      FROM encounters e
      LEFT JOIN conditions co ON e.id = co.encounter_id
      WHERE e.patient_id = $1
      GROUP BY e.id
      ORDER BY e.start_time DESC;
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        startTime: row.start_time,
        stopTime: row.stop_time,
        encounterClass: row.encounter_class,
        code: row.code,
        description: row.description,
        baseEncounterCost: parseFloat(row.base_encounter_cost || 0),
        totalClaimCost: parseFloat(row.total_claim_cost || 0),
        payerCoverage: parseFloat(row.payer_coverage || 0),
        reasonCode: row.reason_code,
        reasonDescription: row.reason_description,
        conditionCount: parseInt(row.condition_count)
      }))
    });
  } catch (error) {
    console.error('Error fetching patient encounters:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient encounters',
      message: error.message 
    });
  }
});

// GET /api/patients/:id/claims
// Returns all claims for a specific patient
router.get('/:id/claims', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT *
      FROM claims
      WHERE patient_id = $1
      ORDER BY claim_date DESC;
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        claimId: row.claim_id,
        claimAmount: parseFloat(row.claim_amount || 0),
        claimDate: row.claim_date,
        diagnosisCode: row.diagnosis_code,
        procedureCode: row.procedure_code,
        claimStatus: row.claim_status,
        claimType: row.claim_type,
        payerName: row.payer_name,
        denialReason: row.denial_reason,
        daysToProcess: parseInt(row.days_to_process || 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching patient claims:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient claims',
      message: error.message 
    });
  }
});

export default router;
