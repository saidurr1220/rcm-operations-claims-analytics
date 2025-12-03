import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/qa/issues
// Returns data quality issues found across all tables
router.get('/issues', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const issueType = req.query.type; // Optional filter by issue type
    
    const issues = [];
    
    // Issue 1: Claims with negative or zero amounts
    const negativeClaimsQuery = `
      SELECT 
        'negative_claim_amount' as issue_type,
        'claims' as table_name,
        claim_id as record_id,
        'Claim amount is <= 0: $' || claim_amount as description,
        claim_amount as issue_value
      FROM claims
      WHERE claim_amount <= 0
      LIMIT 50;
    `;
    
    // Issue 2: Encounters where total_claim_cost < base_encounter_cost
    const costMismatchQuery = `
      SELECT 
        'claim_cost_less_than_base' as issue_type,
        'encounters' as table_name,
        id as record_id,
        'Total claim cost ($' || total_claim_cost || ') < base cost ($' || base_encounter_cost || ')' as description,
        total_claim_cost - base_encounter_cost as issue_value
      FROM encounters
      WHERE total_claim_cost < base_encounter_cost
        AND total_claim_cost IS NOT NULL
        AND base_encounter_cost IS NOT NULL
      LIMIT 50;
    `;
    
    // Issue 3: Payer coverage exceeds total claim cost
    const coverageExceedsQuery = `
      SELECT 
        'coverage_exceeds_claim' as issue_type,
        'encounters' as table_name,
        id as record_id,
        'Payer coverage ($' || payer_coverage || ') > total claim cost ($' || total_claim_cost || ')' as description,
        payer_coverage - total_claim_cost as issue_value
      FROM encounters
      WHERE payer_coverage > total_claim_cost
        AND payer_coverage IS NOT NULL
        AND total_claim_cost IS NOT NULL
      LIMIT 50;
    `;

    // Issue 4: Claims with missing critical fields
    const missingFieldsQuery = `
      SELECT 
        'missing_critical_field' as issue_type,
        'claims' as table_name,
        claim_id as record_id,
        'Missing: ' || 
          CASE 
            WHEN claim_status IS NULL THEN 'claim_status '
            ELSE ''
          END ||
          CASE 
            WHEN payer_name IS NULL THEN 'payer_name '
            ELSE ''
          END ||
          CASE 
            WHEN diagnosis_code IS NULL THEN 'diagnosis_code '
            ELSE ''
          END as description,
        NULL as issue_value
      FROM claims
      WHERE claim_status IS NULL 
         OR payer_name IS NULL 
         OR diagnosis_code IS NULL
      LIMIT 50;
    `;
    
    // Issue 5: Implausible patient ages
    const implausibleAgeQuery = `
      SELECT 
        'implausible_age' as issue_type,
        'claims' as table_name,
        claim_id as record_id,
        'Patient age is implausible: ' || patient_age as description,
        patient_age as issue_value
      FROM claims
      WHERE patient_age < 0 OR patient_age > 110
      LIMIT 50;
    `;
    
    // Issue 6: Encounters with missing payer
    const missingPayerQuery = `
      SELECT 
        'missing_payer' as issue_type,
        'encounters' as table_name,
        id as record_id,
        'Encounter has no payer assigned' as description,
        NULL as issue_value
      FROM encounters
      WHERE payer_id IS NULL
      LIMIT 50;
    `;
    
    // Issue 7: Claims with very long processing times
    const longProcessingQuery = `
      SELECT 
        'long_processing_time' as issue_type,
        'claims' as table_name,
        claim_id as record_id,
        'Processing time exceeds 90 days: ' || days_to_process || ' days' as description,
        days_to_process as issue_value
      FROM claims
      WHERE days_to_process > 90
      LIMIT 50;
    `;
    
    // Execute all queries in parallel
    const queries = [
      negativeClaimsQuery,
      costMismatchQuery,
      coverageExceedsQuery,
      missingFieldsQuery,
      implausibleAgeQuery,
      missingPayerQuery,
      longProcessingQuery
    ];
    
    const results = await Promise.all(
      queries.map(query => pool.query(query))
    );
    
    // Combine all results
    results.forEach(result => {
      issues.push(...result.rows);
    });
    
    // Filter by issue type if specified
    let filteredIssues = issues;
    if (issueType) {
      filteredIssues = issues.filter(issue => issue.issue_type === issueType);
    }
    
    // Apply limit
    const limitedIssues = filteredIssues.slice(0, limit);
    
    res.json({
      success: true,
      data: limitedIssues.map(issue => ({
        issueType: issue.issue_type,
        tableName: issue.table_name,
        recordId: issue.record_id,
        description: issue.description,
        issueValue: issue.issue_value
      })),
      summary: {
        totalIssues: filteredIssues.length,
        returned: limitedIssues.length,
        issueTypes: [...new Set(issues.map(i => i.issue_type))]
      }
    });
  } catch (error) {
    console.error('Error fetching QA issues:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch QA issues',
      message: error.message 
    });
  }
});

// GET /api/qa/summary
// Returns summary statistics of data quality issues
router.get('/summary', async (req, res) => {
  try {
    const summaryQuery = `
      WITH issue_counts AS (
        SELECT 
          'negative_claim_amount' as issue_type,
          COUNT(*) as count
        FROM claims
        WHERE claim_amount <= 0
        
        UNION ALL
        
        SELECT 
          'claim_cost_less_than_base' as issue_type,
          COUNT(*) as count
        FROM encounters
        WHERE total_claim_cost < base_encounter_cost
          AND total_claim_cost IS NOT NULL
          AND base_encounter_cost IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'coverage_exceeds_claim' as issue_type,
          COUNT(*) as count
        FROM encounters
        WHERE payer_coverage > total_claim_cost
          AND payer_coverage IS NOT NULL
          AND total_claim_cost IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'missing_critical_field' as issue_type,
          COUNT(*) as count
        FROM claims
        WHERE claim_status IS NULL 
           OR payer_name IS NULL 
           OR diagnosis_code IS NULL
        
        UNION ALL
        
        SELECT 
          'implausible_age' as issue_type,
          COUNT(*) as count
        FROM claims
        WHERE patient_age < 0 OR patient_age > 110
        
        UNION ALL
        
        SELECT 
          'missing_payer' as issue_type,
          COUNT(*) as count
        FROM encounters
        WHERE payer_id IS NULL
        
        UNION ALL
        
        SELECT 
          'long_processing_time' as issue_type,
          COUNT(*) as count
        FROM claims
        WHERE days_to_process > 90
      )
      SELECT 
        issue_type,
        count
      FROM issue_counts
      WHERE count > 0
      ORDER BY count DESC;
    `;
    
    const result = await pool.query(summaryQuery);
    
    const totalIssues = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    res.json({
      success: true,
      data: {
        totalIssues,
        issueBreakdown: result.rows.map(row => ({
          issueType: row.issue_type,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching QA summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch QA summary',
      message: error.message 
    });
  }
});

export default router;
