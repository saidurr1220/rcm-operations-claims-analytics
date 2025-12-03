import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/kpis/overview
// Returns high-level KPIs: total claims, amounts, denial rate, approval rate
router.get('/overview', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_claims,
        COUNT(DISTINCT patient_id) as total_patients,
        COALESCE(SUM(claim_amount), 0) as total_claim_amount,
        COALESCE(AVG(claim_amount), 0) as avg_claim_amount,
        COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) as denied_claims,
        COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) as approved_claims,
        COUNT(CASE WHEN LOWER(claim_status) = 'pending' THEN 1 END) as pending_claims,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as denial_rate,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as approval_rate,
        COALESCE(AVG(days_to_process), 0) as avg_days_to_process
      FROM claims;
    `;
    
    const result = await pool.query(query);
    const data = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalClaims: parseInt(data.total_claims),
        totalPatients: parseInt(data.total_patients),
        totalClaimAmount: parseFloat(data.total_claim_amount),
        avgClaimAmount: parseFloat(data.avg_claim_amount),
        deniedClaims: parseInt(data.denied_claims),
        approvedClaims: parseInt(data.approved_claims),
        pendingClaims: parseInt(data.pending_claims),
        denialRate: parseFloat(data.denial_rate),
        approvalRate: parseFloat(data.approval_rate),
        avgDaysToProcess: parseFloat(data.avg_days_to_process)
      }
    });
  } catch (error) {
    console.error('Error fetching KPI overview:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch KPI overview',
      message: error.message 
    });
  }
});

// GET /api/kpis/denials-by-payer
// Returns denial statistics grouped by payer
router.get('/denials-by-payer', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(payer_name, 'Unknown') as payer_name,
        COUNT(*) as total_claims,
        COALESCE(SUM(claim_amount), 0) as total_amount,
        COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) as denied_claims,
        COALESCE(
          SUM(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN claim_amount ELSE 0 END), 
          0
        ) as denied_amount,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as denial_rate,
        COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) as approved_claims,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as approval_rate
      FROM claims
      GROUP BY payer_name
      ORDER BY total_claims DESC;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        payerName: row.payer_name,
        totalClaims: parseInt(row.total_claims),
        totalAmount: parseFloat(row.total_amount),
        deniedClaims: parseInt(row.denied_claims),
        deniedAmount: parseFloat(row.denied_amount),
        denialRate: parseFloat(row.denial_rate),
        approvedClaims: parseInt(row.approved_claims),
        approvalRate: parseFloat(row.approval_rate)
      }))
    });
  } catch (error) {
    console.error('Error fetching denials by payer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch denials by payer',
      message: error.message 
    });
  }
});

// GET /api/kpis/denials-by-claim-type
// Returns denial statistics grouped by claim type
router.get('/denials-by-claim-type', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(claim_type, 'Unknown') as claim_type,
        COUNT(*) as total_claims,
        COALESCE(SUM(claim_amount), 0) as total_amount,
        COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) as denied_claims,
        COALESCE(
          SUM(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN claim_amount ELSE 0 END), 
          0
        ) as denied_amount,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as denial_rate,
        COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) as approved_claims
      FROM claims
      GROUP BY claim_type
      ORDER BY total_claims DESC;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        claimType: row.claim_type,
        totalClaims: parseInt(row.total_claims),
        totalAmount: parseFloat(row.total_amount),
        deniedClaims: parseInt(row.denied_claims),
        deniedAmount: parseFloat(row.denied_amount),
        denialRate: parseFloat(row.denial_rate),
        approvedClaims: parseInt(row.approved_claims)
      }))
    });
  } catch (error) {
    console.error('Error fetching denials by claim type:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch denials by claim type',
      message: error.message 
    });
  }
});

// GET /api/kpis/monthly-trends
// Returns monthly claim trends for charting
router.get('/monthly-trends', async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(claim_date, 'YYYY-MM') as month,
        COUNT(*) as total_claims,
        COALESCE(SUM(claim_amount), 0) as total_amount,
        COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) as denied_claims,
        COUNT(CASE WHEN LOWER(claim_status) IN ('approved', 'paid') THEN 1 END) as approved_claims,
        ROUND(
          100.0 * COUNT(CASE WHEN LOWER(claim_status) IN ('denied', 'rejected') THEN 1 END) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as denial_rate
      FROM claims
      WHERE claim_date IS NOT NULL
      GROUP BY TO_CHAR(claim_date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        month: row.month,
        totalClaims: parseInt(row.total_claims),
        totalAmount: parseFloat(row.total_amount),
        deniedClaims: parseInt(row.denied_claims),
        approvedClaims: parseInt(row.approved_claims),
        denialRate: parseFloat(row.denial_rate)
      }))
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch monthly trends',
      message: error.message 
    });
  }
});

export default router;
