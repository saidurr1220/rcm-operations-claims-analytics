# RCM Practice Cheat Sheet - সহজ Commands

## 🚀 Quick Start

### প্রথমে এই folder এ যান:

```bash
cd backend
```

---

## ✅ Claims Add করার Commands

### 1. Quick Templates (সবচেয়ে সহজ!)

```bash
# Approved claim
node scripts/quickAddClaim.js approved

# Denied claim
node scripts/quickAddClaim.js denied

# Pending claim
node scripts/quickAddClaim.js pending

# Emergency claim
node scripts/quickAddClaim.js emergency
```

### 2. Practice Scenarios (5 types)

```bash
# Scenario 1: Approved Outpatient ($1,500)
node scripts/addCustomClaim.js 1

# Scenario 2: Denied - Missing Auth ($2,500)
node scripts/addCustomClaim.js 2

# Scenario 3: Pending >90 days ($5,000)
node scripts/addCustomClaim.js 3

# Scenario 4: Denied - Medical Necessity ($3,200)
node scripts/addCustomClaim.js 4

# Scenario 5: Approved Emergency ($4,500)
node scripts/addCustomClaim.js 5

# সব 5টি একসাথে
node scripts/addCustomClaim.js all
```

### 3. Simple Sample

```bash
node scripts/addSampleClaim.js
```

---

## 📊 Dashboard Links

```
Overview:          http://localhost:3002
Denials & Revenue: http://localhost:3002/denials
Patients:          http://localhost:3002/patients
QA Issues:         http://localhost:3002/qa
```

---

## 🎯 Daily Practice Routine

### Morning (5 minutes)

```bash
cd backend
node scripts/quickAddClaim.js approved
node scripts/quickAddClaim.js approved
node scripts/quickAddClaim.js denied
```

### Check Dashboard

- Refresh: http://localhost:3002
- Note changes

### Evening (5 minutes)

```bash
node scripts/addCustomClaim.js 3
node scripts/quickAddClaim.js emergency
```

### Check QA Issues

- Visit: http://localhost:3002/qa
- Note new issues

---

## 💡 Common Mistakes

### ❌ Wrong:

```bash
# Root directory থেকে
node scripts/quickAddClaim.js approved
```

### ✅ Correct:

```bash
# Backend folder এ যান
cd backend
node scripts/quickAddClaim.js approved
```

### অথবা Root থেকে:

```bash
node backend/scripts/quickAddClaim.js approved
```

---

## 🔄 Server Commands

### Backend Server

```bash
cd backend
npm start
```

### Frontend Server

```bash
cd frontend
npm run dev
```

### Check if Running

```
Backend:  http://localhost:3001/health
Frontend: http://localhost:3002
```

---

## 📝 Quick Practice Examples

### Example 1: Add 5 Claims

```bash
cd backend
node scripts/quickAddClaim.js approved
node scripts/quickAddClaim.js approved
node scripts/quickAddClaim.js denied
node scripts/quickAddClaim.js pending
node scripts/quickAddClaim.js emergency
```

### Example 2: Practice All Scenarios

```bash
cd backend
node scripts/addCustomClaim.js all
```

### Example 3: Mix Different Types

```bash
cd backend
node scripts/quickAddClaim.js approved
node scripts/addCustomClaim.js 2
node scripts/quickAddClaim.js denied
node scripts/addCustomClaim.js 5
```

---

## 🎓 What to Practice

### Week 1: Basics

- Add 20 claims
- Explore all dashboard pages
- Note findings

### Week 2: Analysis

- Add 30 claims (mix types)
- Analyze denial patterns
- Write first report

### Week 3: Advanced

- Add 40 claims
- Create QA report
- Document findings

---

## 📚 Medical Codes Reference

### Common Diagnosis Codes (ICD-10)

```
E11.9  - Type 2 Diabetes
I10    - Hypertension
J44.9  - COPD
M79.3  - Myalgia (Muscle pain)
R51    - Headache
Z00.00 - General exam
```

### Common Procedure Codes (CPT)

```
99213  - Office visit ($125)
99214  - Detailed visit ($175)
99215  - Comprehensive visit ($250)
99285  - Emergency visit ($450)
99291  - Critical care ($800)
```

---

## 🚨 Troubleshooting

### Problem: "Cannot find module"

**Solution:** আপনি backend folder এ নেই

```bash
cd backend
```

### Problem: "Connection refused"

**Solution:** Backend server চালু নেই

```bash
cd backend
npm start
```

### Problem: Dashboard খালি

**Solution:** Data import করেননি

```bash
cd backend
npm run import-data
```

---

## 🎯 Quick Goals

### Today:

- [ ] 5টি claims add করুন
- [ ] Dashboard check করুন
- [ ] Notes নিন

### This Week:

- [ ] 20টি claims add করুন
- [ ] সব pages explore করুন
- [ ] First report লিখুন

### This Month:

- [ ] 100টি claims add করুন
- [ ] Analysis complete করুন
- [ ] Portfolio ready করুন

---

## 🔗 Important Links

**Dashboard:** http://localhost:3002  
**API:** http://localhost:3001  
**GitHub:** https://github.com/saidurr1220/rcm-operations-claims-analytics

---

## 💪 Remember

1. **Always `cd backend` first!**
2. **Refresh dashboard after adding claims**
3. **Take notes daily**
4. **Practice 10-15 minutes daily**
5. **Mix different claim types**

---

**Happy Learning!** 🌟
