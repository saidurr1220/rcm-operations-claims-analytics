# Quick Setup Guide

Follow these steps to get the RCM Operations Analytics Dashboard running on your machine.

## Prerequisites Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] PostgreSQL v14+ installed (`psql --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (optional, for version control)

## Step-by-Step Setup

### 1. Prepare Data Files

Download and place these files in the `/data` directory:

**Synthea Data:**

- `patients.txt`
- `encounters.txt`
- `conditions.txt`
- `immunizations.txt`

Download from: https://synthea.mitre.org/downloads

**Kaggle Claims Data:**

- `health_insurance_claims.csv`

Download from: https://www.kaggle.com/ (search for "health insurance claims")

```bash
mkdir data
# Place your CSV/TXT files in the data/ directory
```

### 2. Set Up PostgreSQL Database

```bash
# Option A: Using createdb command
createdb rcm_analytics

# Option B: Using psql
psql -U postgres
CREATE DATABASE rcm_analytics;
\q
```

### 3. Configure Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/rcm_analytics
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rcm_analytics
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3001
NODE_ENV=development
DATA_DIR=../data
```

### 4. Initialize Database

```bash
# Still in backend directory
npm run init-db
```

Expected output:

```
✓ Connected to PostgreSQL
✓ Schema created successfully
✓ Found 5 tables: claims, conditions, encounters, immunizations, patients
✓ Found 2 views
✓ Database initialization completed successfully!
```

### 5. Import Data

```bash
npm run import-data
```

Expected output:

```
→ Importing patients...
  ✓ Imported 1,000 patients (0 errors)
→ Importing encounters...
  ✓ Imported 5,432 encounters (0 errors)
→ Importing conditions...
  ✓ Imported 8,765 conditions (0 errors)
→ Importing immunizations...
  ✓ Imported 2,341 immunizations (0 errors)
→ Importing claims...
  ✓ Imported 10,000 claims (0 errors)
✓ Data import completed successfully!
```

### 6. Start Backend Server

```bash
npm start
```

Expected output:

```
✓ Server running on http://localhost:3001
✓ Environment: development
✓ Connected to PostgreSQL database
```

Test the API:

```bash
curl http://localhost:3001/health
```

### 7. Configure Frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

The default `.env.local` should work:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 8. Start Frontend

```bash
npm run dev
```

Expected output:

```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### 9. Access the Application

Open your browser to: **http://localhost:3000**

You should see the RCM Operations Analytics Dashboard!

## Verify Everything Works

### Test Backend Endpoints

```bash
# KPI Overview
curl http://localhost:3001/api/kpis/overview

# Denials by Payer
curl http://localhost:3001/api/kpis/denials-by-payer

# QA Issues
curl http://localhost:3001/api/qa/issues
```

### Test Frontend Pages

Visit these URLs in your browser:

- http://localhost:3000 (Overview)
- http://localhost:3000/denials (Denials & Revenue)
- http://localhost:3000/patients (Patients)
- http://localhost:3000/qa (QA Issues)

## Troubleshooting

### Database Connection Error

**Error:** `connection refused` or `authentication failed`

**Solution:**

1. Verify PostgreSQL is running: `pg_isready`
2. Check credentials in `backend/.env`
3. Test connection: `psql -U your_username -d rcm_analytics`

### Import Script Fails

**Error:** `File not found` or `ENOENT`

**Solution:**

1. Verify data files exist: `ls data/`
2. Check DATA_DIR in `.env` points to correct location
3. Ensure file names match exactly (case-sensitive)

### Frontend Can't Connect to Backend

**Error:** `Failed to fetch` or `Network error`

**Solution:**

1. Verify backend is running on port 3001
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Check browser console for CORS errors
4. Ensure no firewall blocking localhost connections

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**

```bash
# Find process using port 3001 (backend)
lsof -i :3001
kill -9 <PID>

# Find process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>
```

Or change ports in `.env` files.

## Development Workflow

### Making Changes

**Backend changes:**

```bash
cd backend
npm run dev  # Auto-reloads on file changes
```

**Frontend changes:**

```bash
cd frontend
npm run dev  # Hot reload enabled
```

### Resetting Database

```bash
cd backend
npm run init-db    # Drops and recreates tables
npm run import-data # Re-imports data
```

### Viewing Logs

**Backend logs:** Check terminal where `npm start` is running

**Frontend logs:** Check browser console (F12)

**Database logs:** Check PostgreSQL logs (location varies by OS)

## Next Steps

1. Explore the dashboard pages
2. Review the API documentation at http://localhost:3001/
3. Read the QA Runbook: `docs/rcm_qa_runbook.md`
4. Review the example analysis: `docs/example_rcm_analysis.md`
5. Customize for your portfolio needs

## Production Deployment

For production deployment, see:

- Backend: Consider using PM2 for process management
- Frontend: Use `npm run build` then `npm start`
- Database: Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
- Hosting: Vercel (frontend), Railway/Render (backend)

## Getting Help

- Check README.md for detailed documentation
- Review code comments in source files
- Check GitHub issues (if applicable)
- Contact: [your-email@example.com]

---

**Setup complete!** You now have a fully functional RCM analytics dashboard running locally.
