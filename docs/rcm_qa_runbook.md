# RCM Data Quality Assurance Runbook

## Purpose

This runbook outlines the data quality (QA) checks performed on claims and encounter data to ensure accuracy, completeness, and compliance with RCM operational standards.

## Overview

Data quality is critical in Revenue Cycle Management. Poor data quality leads to:

- Increased claim denials
- Payment delays
- Compliance issues
- Revenue leakage
- Operational inefficiencies

This system performs automated QA checks across all claims and encounters data, flagging issues for review and remediation.

## QA Check Categories

### 1. Financial Data Validation

#### Check: Negative or Zero Claim Amounts

- **Issue Type:** `negative_claim_amount`
- **Description:** Claims with amounts ≤ $0
- **Impact:** Cannot process claims with invalid amounts
- **Action Required:**
  - Review claim details in source system
  - Verify correct procedure codes and fee schedules
  - Correct amount and resubmit claim
- **Frequency:** Daily
- **Priority:** High

#### Check: Claim Cost Less Than Base Cost

- **Issue Type:** `claim_cost_less_than_base`
- **Description:** Total claim cost is less than base encounter cost
- **Impact:** Indicates potential data entry error or incorrect cost calculation
- **Action Required:**
  - Review encounter cost calculation
  - Verify all services are included in claim
  - Check for discounts or adjustments
- **Frequency:** Weekly
- **Priority:** Medium

#### Check: Coverage Exceeds Claim Amount

- **Issue Type:** `coverage_exceeds_claim`
- **Description:** Payer coverage amount exceeds total claim cost
- **Impact:** Overpayment risk, reconciliation issues
- **Action Required:**
  - Review payer remittance advice
  - Check for duplicate payments
  - Process refund if necessary
- **Frequency:** Daily
- **Priority:** High

### 2. Data Completeness Validation

#### Check: Missing Critical Fields

- **Issue Type:** `missing_critical_field`
- **Description:** Claims missing required fields (status, payer, diagnosis code)
- **Impact:** Claims cannot be processed or adjudicated
- **Action Required:**
  - Identify missing field(s)
  - Obtain missing information from clinical documentation
  - Update claim record
  - Resubmit if already sent to payer
- **Frequency:** Daily
- **Priority:** Critical

#### Check: Missing Payer Assignment

- **Issue Type:** `missing_payer`
- **Description:** Encounters without assigned payer
- **Impact:** Cannot generate claims, revenue at risk
- **Action Required:**
  - Verify patient insurance eligibility
  - Update encounter with correct payer information
  - Generate and submit claim
- **Frequency:** Daily
- **Priority:** Critical

### 3. Data Reasonableness Validation

#### Check: Implausible Patient Age

- **Issue Type:** `implausible_age`
- **Description:** Patient age < 0 or > 110 years
- **Impact:** Data integrity issue, potential claim rejection
- **Action Required:**
  - Verify patient date of birth in registration system
  - Correct demographic information
  - Update all affected records
- **Frequency:** Weekly
- **Priority:** Medium

#### Check: Long Processing Time

- **Issue Type:** `long_processing_time`
- **Description:** Claims taking > 90 days to process
- **Impact:** Cash flow impact, potential write-off risk
- **Action Required:**
  - Review claim status with payer
  - Check for pending information requests
  - Escalate to payer relations if necessary
  - Consider appeal if denied
- **Frequency:** Weekly
- **Priority:** High

## Weekly QA Workflow

### Monday Morning (9:00 AM)

1. **Run QA Summary Report**

   ```bash
   curl http://localhost:3001/api/qa/summary
   ```

   - Review total issue count
   - Compare to previous week
   - Identify trending issues

2. **Review Critical Issues**
   - Missing critical fields
   - Missing payer assignments
   - Negative claim amounts
   - Assign to appropriate team members

### Tuesday

3. **Financial Validation Review**
   - Review all financial data validation issues
   - Work with billing team to correct amounts
   - Verify cost calculations

### Wednesday

4. **Completeness Review**
   - Address missing field issues
   - Coordinate with clinical documentation team
   - Update records in source systems

### Thursday

5. **Long Processing Time Review**
   - Generate list of claims > 90 days
   - Contact payers for status updates
   - Prepare appeals for denied claims
   - Document follow-up actions

### Friday

6. **Weekly Summary**
   - Document issues resolved
   - Calculate resolution rate
   - Report to management
   - Identify process improvements

## Using the QA Dashboard

### Accessing QA Issues

1. Navigate to `http://localhost:3000/qa`
2. Review summary cards showing issue counts by type
3. Scroll to detailed issue table

### Filtering Issues

- Use query parameters to filter by issue type:
  ```
  http://localhost:3001/api/qa/issues?type=missing_critical_field
  ```

### Exporting Issues

- Copy table data for Excel analysis
- Use browser developer tools to export JSON
- Future: Export to CSV functionality

## Escalation Procedures

### Critical Issues (Immediate Action)

- Missing critical fields preventing claim submission
- Negative claim amounts
- Missing payer assignments for encounters > 7 days old

**Escalation Path:**

1. Billing Supervisor (immediate)
2. RCM Manager (if unresolved in 4 hours)
3. Director of Revenue Cycle (if unresolved in 24 hours)

### High Priority Issues (24-Hour Response)

- Coverage exceeding claim amounts
- Claims > 90 days in processing
- Systematic data quality issues affecting > 50 claims

**Escalation Path:**

1. Team Lead (within 4 hours)
2. RCM Manager (if unresolved in 24 hours)

### Medium Priority Issues (Weekly Review)

- Claim cost vs. base cost mismatches
- Implausible ages
- Individual data quality issues

**Escalation Path:**

1. Weekly team meeting review
2. RCM Manager (if trending upward)

## Metrics and Reporting

### Key Metrics

- **Total Issues:** Count of all active QA issues
- **Issue Resolution Rate:** % of issues resolved within SLA
- **Average Time to Resolution:** Days from detection to resolution
- **Issues by Type:** Distribution across issue categories
- **Trending:** Week-over-week change in issue counts

### Monthly Report Contents

1. Executive summary
2. Total issues detected and resolved
3. Issue breakdown by category
4. Top 5 root causes
5. Process improvements implemented
6. Recommendations for next month

## Root Cause Analysis

When issues exceed thresholds:

1. **Identify Pattern:** Is issue isolated or systematic?
2. **Trace to Source:** Which system/process created the issue?
3. **Document:** Record findings in issue tracking system
4. **Implement Fix:** Update process, training, or system validation
5. **Monitor:** Track issue recurrence rate

## Training and Documentation

### New Team Member Onboarding

- Review this runbook (Day 1)
- Shadow QA review process (Week 1)
- Perform supervised QA review (Week 2)
- Independent QA review with spot checks (Week 3+)

### Quarterly Training Topics

- Q1: Financial validation and cost calculations
- Q2: Payer-specific requirements and missing fields
- Q3: Claims processing timelines and follow-up
- Q4: Year-end reconciliation and data cleanup

## System Maintenance

### Database Performance

- QA queries run daily at 6:00 AM
- Indexes optimized for QA check performance
- Query execution time monitored

### Data Retention

- QA issue history retained for 2 years
- Resolved issues archived quarterly
- Audit trail maintained for compliance

## Contact Information

**RCM Data Quality Team**

- Email: rcm-qa@example.com
- Slack: #rcm-data-quality
- On-call: (555) 123-4567

**System Support**

- IT Help Desk: helpdesk@example.com
- Database Admin: dba@example.com

## Revision History

| Version | Date       | Author   | Changes                  |
| ------- | ---------- | -------- | ------------------------ |
| 1.0     | 2024-12-03 | RCM Team | Initial runbook creation |

---

**Last Updated:** December 3, 2024
**Next Review Date:** March 3, 2025
