import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/revenue/by-encounterclass
// Returns revenue breakdown by encounter class (ambulatory, emergency, inpatient, etc.)
router.get('/by-encounterclass', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(encounter_class, 'Unknown') as encounter_class,
        COUNT(*) as total_encounters,
        COALESCE(SUM(base_encounter_cost), 0) as total_base_cost,
        COALESCE(SUM(total_claim_cost), 0) as total_claim_cost,
        COALESCE(SUM(payer_coverage), 0) as total_payer_coverage,
        COALESCE(SUM(total_claim_cost - payer_coverage), 0) as patient_responsibility,
        COALESCE(AVG(base_encounter_cost), 0) as avg_base_cost,
        COALESCE(AVG(total_claim_cost), 0) as avg_claim_cost,
        ROUND(
          100.0 * COALESCE(SUM(payer_coverage), 0) / 
          NULLIF(COALESCE(SUM(total_claim_cost), 0), 0), 
          2
        ) as coverage_rate
      FROM encounters
      GROUP BY encounter_class
      ORDER BY total_claim_cost DESC;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        encounterClass: row.encounter_class,
        totalEncounters: parseInt(row.total_encounters),
        totalBaseCost: parseFloat(row.total_base_cost),
        totalClaimCost: parseFloat(row.total_claim_cost),
        totalPayerCoverage: parseFloat(row.total_payer_coverage),
        patientResponsibility: parseFloat(row.patient_responsibility),
        avgBaseCost: parseFloat(row.avg_base_cost),
        avgClaimCost: parseFloat(row.avg_claim_cost),
        coverageRate: parseFloat(row.coverage_rate)
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue by encounter class:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch revenue by encounter class',
      message: error.message 
    });
  }
});

// GET /api/revenue/by-payer
// Returns revenue breakdown by payer from encounters table
router.get('/by-payer', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(e.payer_id, 'Unknown') as payer_id,
        COUNT(*) as total_encounters,
        COALESCE(SUM(e.total_claim_cost), 0) as total_claim_cost,
        COALESCE(SUM(e.payer_coverage), 0) as total_payer_coverage,
        COALESCE(SUM(e.total_claim_cost - e.payer_coverage), 0) as patient_responsibility,
        COALESCE(AVG(e.total_claim_cost), 0) as avg_claim_cost,
        ROUND(
          100.0 * COALESCE(SUM(e.payer_coverage), 0) / 
          NULLIF(COALESCE(SUM(e.total_claim_cost), 0), 0), 
          2
        ) as coverage_rate
      FROM encounters e
      GROUP BY e.payer_id
      ORDER BY total_claim_cost DESC
      LIMIT 20;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        payerId: row.payer_id,
        totalEncounters: parseInt(row.total_encounters),
        totalClaimCost: parseFloat(row.total_claim_cost),
        totalPayerCoverage: parseFloat(row.total_payer_coverage),
        patientResponsibility: parseFloat(row.patient_responsibility),
        avgClaimCost: parseFloat(row.avg_claim_cost),
        coverageRate: parseFloat(row.coverage_rate)
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue by payer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch revenue by payer',
      message: error.message 
    });
  }
});

// GET /api/revenue/summary
// Returns overall revenue summary combining encounters and claims data
router.get('/summary', async (req, res) => {
  try {
    const encounterQuery = `
      SELECT 
        COUNT(*) as total_encounters,
        COALESCE(SUM(base_encounter_cost), 0) as total_base_cost,
        COALESCE(SUM(total_claim_cost), 0) as total_claim_cost,
        COALESCE(SUM(payer_coverage), 0) as total_payer_coverage,
        COALESCE(SUM(total_claim_cost - payer_coverage), 0) as total_patient_responsibility,
        COALESCE(AVG(total_claim_cost), 0) as avg_encounter_cost
      FROM encounters;
    `;
    
    const claimsQuery = `
      SELECT 
        COUNT(*) as total_claims,
        COALESCE(SUM(claim_amount), 0) as total_claim_amount,
        COALESCE(AVG(claim_amount), 0) as avg_claim_amount,
        COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) as approved_claims,
        COALESCE(
          SUM(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN claim_amount ELSE 0 END), 
          0
        ) as approved_amount
      FROM claims;
    `;
    
    const [encounterResult, claimsResult] = await Promise.all([
      pool.query(encounterQuery),
      pool.query(claimsQuery)
    ]);
    
    const encounterData = encounterResult.rows[0];
    const claimsData = claimsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        encounters: {
          totalEncounters: parseInt(encounterData.total_encounters),
          totalBaseCost: parseFloat(encounterData.total_base_cost),
          totalClaimCost: parseFloat(encounterData.total_claim_cost),
          totalPayerCoverage: parseFloat(encounterData.total_payer_coverage),
          totalPatientResponsibility: parseFloat(encounterData.total_patient_responsibility),
          avgEncounterCost: parseFloat(encounterData.avg_encounter_cost)
        },
        claims: {
          totalClaims: parseInt(claimsData.total_claims),
          totalClaimAmount: parseFloat(claimsData.total_claim_amount),
          avgClaimAmount: parseFloat(claimsData.avg_claim_amount),
          approvedClaims: parseInt(claimsData.approved_claims),
          approvedAmount: parseFloat(claimsData.approved_amount)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch revenue summary',
      message: error.message 
    });
  }
});

export default router;
