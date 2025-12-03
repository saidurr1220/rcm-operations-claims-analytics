# How to Practice RCM Billing & Coding with This Project

## 🎯 Purpose

This project is designed to help you learn and practice **Revenue Cycle Management (RCM)** skills through hands-on experience with real-world scenarios.

---

## 📚 Learning Path

### Phase 1: Understanding the Dashboard (Week 1)

#### Day 1-2: Explore All Pages

**Overview Page** (`http://localhost:3002`)

- Study each KPI card
- Understand what each metric means
- Note the color coding (green = good, red = bad)

**Key Metrics to Learn:**

- **Denial Rate**: % of claims rejected by payers (target: <10%)
- **Approval Rate**: % of claims approved (target: >85%)
- **Days to Process**: Average time from submission to payment
- **Clean Claim Rate**: % of claims submitted without errors

#### Day 3-4: Denial Analysis

**Denials Page** (`http://localhost:3002/denials`)

**Exercise 1: Identify Problem Payers**

1. Look at "Denials by Payer" table
2. Find payers with denial rate >10%
3. Calculate potential revenue loss
4. Write a brief analysis

**Example:**

```
Payer: Blue Cross
Denial Rate: 14.2%
Total Denied: $892,000
Problem: 2x higher than industry average

Root Causes:
- Missing authorization codes (42%)
- Incorrect modifiers (28%)
- Timely filing issues (18%)

Action Plan:
1. Implement pre-auth verification
2. Create payer-specific checklist
3. Train billing staff
4. Schedule quarterly meetings

Expected Savings: $356,000/year
```

#### Day 5-7: Data Quality Issues

**QA Issues Page** (`http://localhost:3002/qa`)

**Exercise 2: Weekly QA Review**

Create a weekly QA report:

```
Week of: [Date]
Total Issues: [Number]

Issue Breakdown:
1. Missing Critical Fields: X (Y%)
2. Long Processing Time: X (Y%)
3. Missing Payer: X (Y%)
4. Coverage Exceeds Claim: X (Y%)
5. Negative Amounts: X (Y%)

Priority Actions:
- [Issue 1]: [Action needed]
- [Issue 2]: [Action needed]
- [Issue 3]: [Action needed]

Assigned To: [Team/Person]
Due Date: [Date]
```

---

### Phase 2: Hands-On Practice (Week 2-3)

#### Practice 1: Add Claims Manually

**Learn by doing - add your own claims:**

```sql
-- Connect to database
psql -U postgres -d rcm_analytics

-- Add a new claim
INSERT INTO claims (
  claim_id,
  patient_id,
  provider_id,
  claim_amount,
  claim_date,
  diagnosis_code,
  procedure_code,
  patient_age,
  patient_gender,
  claim_status,
  claim_type,
  payer_name,
  denial_reason,
  days_to_process
) VALUES (
  'CLM-TEST001',
  (SELECT id FROM patients LIMIT 1),
  'PRV-1234',
  1500.00,
  CURRENT_DATE,
  'E11.9',      -- Type 2 Diabetes
  '99213',      -- Office visit
  45,
  'Male',
  'Approved',   -- Try: Approved, Denied, Pending
  'Outpatient',
  'Blue Cross',
  NULL,         -- No denial reason if approved
  15            -- Days to process
);
```

**Refresh your dashboard and see the new claim!**

#### Practice 2: Simulate Different Scenarios

**Scenario A: Denied Claim - Missing Authorization**

```sql
INSERT INTO claims (...) VALUES (
  'CLM-TEST002',
  ...,
  'Denied',
  'Missing authorization',
  45  -- Took longer because of denial
);
```

**Scenario B: Pending Claim - Long Processing**

```sql
INSERT INTO claims (...) VALUES (
  'CLM-TEST003',
  ...,
  'Pending',
  NULL,
  95  -- Over 90 days - will show in QA issues!
);
```

**Scenario C: Data Quality Issue - Negative Amount**

```sql
INSERT INTO claims (...) VALUES (
  'CLM-TEST004',
  ...,
  -500.00,  -- Negative amount - will trigger QA alert
  ...
);
```

#### Practice 3: Medical Coding

**Learn Common Codes:**

**ICD-10 Diagnosis Codes:**
| Code | Description | When to Use |
|------|-------------|-------------|
| E11.9 | Type 2 Diabetes | Diabetic patient visit |
| I10 | Hypertension | High blood pressure |
| J44.9 | COPD | Chronic lung disease |
| M79.3 | Myalgia | Muscle pain |
| R51 | Headache | Head pain symptom |
| Z00.00 | General exam | Wellness visit |

**CPT Procedure Codes:**
| Code | Description | Typical Amount |
|------|-------------|----------------|
| 99213 | Office visit, established | $100-150 |
| 99214 | Office visit, detailed | $150-200 |
| 99215 | Office visit, comprehensive | $200-300 |
| 99285 | Emergency visit | $300-500 |
| 99291 | Critical care | $500-1000 |

**Coding Exercise:**

Create claims for these scenarios:

1. **Scenario: Diabetic Follow-up**

   - Diagnosis: E11.9 (Type 2 Diabetes)
   - Procedure: 99213 (Office visit)
   - Amount: $125
   - Status: Approved

2. **Scenario: Emergency Chest Pain**

   - Diagnosis: I10 (Hypertension)
   - Procedure: 99285 (Emergency visit)
   - Amount: $450
   - Status: Pending

3. **Scenario: Wellness Checkup**
   - Diagnosis: Z00.00 (General exam)
   - Procedure: 99213 (Office visit)
   - Amount: $100
   - Status: Approved

---

### Phase 3: Analysis & Reporting (Week 4)

#### Exercise 1: Monthly Trend Analysis

**Task:** Analyze last 3 months of data

```sql
-- Monthly claims summary
SELECT
  TO_CHAR(claim_date, 'YYYY-MM') as month,
  COUNT(*) as total_claims,
  SUM(claim_amount) as total_amount,
  AVG(claim_amount) as avg_amount,
  COUNT(CASE WHEN claim_status = 'Denied' THEN 1 END) as denied,
  ROUND(100.0 * COUNT(CASE WHEN claim_status = 'Denied' THEN 1 END) / COUNT(*), 2) as denial_rate
FROM claims
WHERE claim_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY TO_CHAR(claim_date, 'YYYY-MM')
ORDER BY month;
```

**Write a report:**

```
Monthly Trend Analysis - Q4 2024

October:
- Claims: 180
- Amount: $450,000
- Denial Rate: 8.5%

November:
- Claims: 195 (↑8%)
- Amount: $487,500 (↑8%)
- Denial Rate: 9.2% (↑0.7%)

December:
- Claims: 210 (↑8%)
- Amount: $525,000 (↑8%)
- Denial Rate: 10.1% (↑0.9%)

Findings:
✓ Volume growing (good)
✗ Denial rate increasing (concerning)

Recommendations:
1. Hire additional staff
2. Implement claim scrubbing
3. Increase training
```

#### Exercise 2: Payer Performance Analysis

```sql
-- Payer comparison
SELECT
  payer_name,
  COUNT(*) as total_claims,
  SUM(claim_amount) as total_amount,
  AVG(days_to_process) as avg_days,
  COUNT(CASE WHEN claim_status = 'Denied' THEN 1 END) as denied,
  ROUND(100.0 * COUNT(CASE WHEN claim_status = 'Denied' THEN 1 END) / COUNT(*), 2) as denial_rate
FROM claims
GROUP BY payer_name
ORDER BY total_amount DESC;
```

**Create a payer scorecard:**

```
Payer Performance Scorecard

Blue Cross:
- Volume: High (150 claims)
- Denial Rate: 14% (Poor)
- Avg Days: 28 (Fair)
- Grade: C
- Action: Needs improvement

Aetna:
- Volume: Medium (100 claims)
- Denial Rate: 6% (Good)
- Avg Days: 21 (Good)
- Grade: A
- Action: Maintain relationship

Medicare:
- Volume: High (200 claims)
- Denial Rate: 4% (Excellent)
- Avg Days: 18 (Excellent)
- Grade: A+
- Action: Best practices model
```

#### Exercise 3: Revenue Cycle Metrics

**Calculate Key RCM Metrics:**

```sql
-- Days in A/R (Accounts Receivable)
SELECT
  AVG(days_to_process) as avg_days_in_ar,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_process) as median_days
FROM claims
WHERE claim_status IN ('Approved', 'Paid');

-- Clean Claim Rate
SELECT
  COUNT(*) as total_claims,
  COUNT(CASE WHEN denial_reason IS NULL THEN 1 END) as clean_claims,
  ROUND(100.0 * COUNT(CASE WHEN denial_reason IS NULL THEN 1 END) / COUNT(*), 2) as clean_claim_rate
FROM claims;

-- Collection Rate
SELECT
  SUM(claim_amount) as total_billed,
  SUM(CASE WHEN claim_status IN ('Approved', 'Paid') THEN claim_amount ELSE 0 END) as total_collected,
  ROUND(100.0 * SUM(CASE WHEN claim_status IN ('Approved', 'Paid') THEN claim_amount ELSE 0 END) / SUM(claim_amount), 2) as collection_rate
FROM claims;
```

---

## 🎓 Interview Preparation

### Practice Answering These Questions

**Q1: Walk me through your RCM analytics project.**

**Your Answer:**
"I built a full-stack RCM analytics dashboard to practice real-world revenue cycle management. The application has:

- PostgreSQL database with 5 tables tracking patients, encounters, and claims
- Backend API with 13 endpoints for KPIs, denials, revenue, and QA checks
- React/Next.js frontend with 4 dashboard pages
- 7 automated data quality checks

I used it to practice denial analysis, medical coding, and revenue optimization. For example, I identified that Payer X had a 14% denial rate and created an action plan to reduce it to 7%, potentially saving $22,500 annually."

**Q2: How do you handle a high denial rate?**

**Your Answer:**
"I follow a systematic approach:

1. Identify the problem using data (my dashboard shows denial rates by payer)
2. Analyze root causes (missing auth, coding errors, timely filing)
3. Quantify the impact ($X in denied claims)
4. Create action plan (training, process improvements, payer meetings)
5. Implement solutions
6. Monitor results (track denial rate weekly)

In my project, I practiced this by analyzing denial patterns and creating detailed action plans with expected ROI."

**Q3: What data quality checks do you perform?**

**Your Answer:**
"I implemented 7 automated QA checks:

1. Negative claim amounts - data entry errors
2. Missing critical fields - incomplete documentation
3. Coverage exceeding claims - overpayment detection
4. Long processing times - claims over 90 days
5. Implausible ages - demographic errors
6. Missing payers - insurance verification gaps
7. Cost mismatches - calculation errors

These checks run automatically and flag issues before claims are submitted, improving our clean claim rate."

**Q4: How do you prioritize QA issues?**

**Your Answer:**
"I use a priority matrix based on:

- Financial impact (high dollar amounts = high priority)
- Volume (affecting many claims = high priority)
- Urgency (timely filing deadlines = high priority)
- Complexity (easy fixes first for quick wins)

For example, missing critical fields preventing submission would be Priority 1 (critical), while minor cost mismatches might be Priority 3 (review weekly)."

---

## 📊 Create Your Own Analysis

### Project Ideas to Add to Your Portfolio

**1. Denial Reduction Initiative**

- Analyze current denial patterns
- Identify top 3 denial reasons
- Create action plan with timeline
- Calculate expected ROI
- Document in `docs/my_denial_analysis.md`

**2. Payer Relationship Optimization**

- Compare payer performance
- Identify best and worst performers
- Create payer scorecards
- Recommend contract negotiations
- Document in `docs/payer_analysis.md`

**3. Revenue Cycle Optimization**

- Calculate current metrics (Days in A/R, collection rate)
- Identify bottlenecks
- Propose process improvements
- Estimate impact on cash flow
- Document in `docs/revenue_optimization.md`

**4. Coding Accuracy Study**

- Analyze most common diagnosis codes
- Check for coding patterns
- Identify potential upcoding/downcoding
- Recommend coding education
- Document in `docs/coding_analysis.md`

---

## 🚀 Next Steps

### Week 1: Foundation

- [ ] Complete all dashboard exploration
- [ ] Understand each KPI
- [ ] Review all QA issue types
- [ ] Take notes on findings

### Week 2: Practice

- [ ] Add 10 manual claims
- [ ] Create 3 denial scenarios
- [ ] Practice medical coding
- [ ] Run custom SQL queries

### Week 3: Analysis

- [ ] Complete monthly trend analysis
- [ ] Create payer performance report
- [ ] Calculate RCM metrics
- [ ] Write findings document

### Week 4: Portfolio

- [ ] Take screenshots
- [ ] Create demo video (2-3 min)
- [ ] Write custom analysis
- [ ] Update README with learnings
- [ ] Deploy to Vercel/Railway
- [ ] Add to resume

---

## 💡 Tips for Success

1. **Practice Daily**: Spend 30-60 minutes each day
2. **Take Notes**: Document your findings
3. **Ask Questions**: Research terms you don't understand
4. **Be Curious**: Explore beyond the exercises
5. **Share Your Work**: Post on LinkedIn
6. **Get Feedback**: Ask RCM professionals to review

---

## 📚 Additional Resources

**Learn More About:**

- ICD-10 Codes: https://www.icd10data.com/
- CPT Codes: https://www.aapc.com/codes/cpt-codes-range/
- RCM Best Practices: HFMA (Healthcare Financial Management Association)
- Medical Billing: AAPC (American Academy of Professional Coders)

---

## 🎯 Success Metrics

You'll know you're ready when you can:

- ✅ Explain all KPIs confidently
- ✅ Identify denial patterns
- ✅ Write SQL queries for analysis
- ✅ Code common diagnoses and procedures
- ✅ Create actionable recommendations
- ✅ Present findings clearly
- ✅ Answer interview questions

---

**Remember:** This project is your learning laboratory. Experiment, make mistakes, learn, and grow!

Good luck with your RCM career! 🌟
