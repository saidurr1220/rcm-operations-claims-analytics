import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import kpisRouter from './routes/kpis.js';
import revenueRouter from './routes/revenue.js';
import patientsRouter from './routes/patients.js';
import qaRouter from './routes/qa.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'RCM Operations Analytics API'
  });
});

// API Routes
app.use('/api/kpis', kpisRouter);
app.use('/api/revenue', revenueRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/qa', qaRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'RCM Operations Analytics API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      kpis: {
        overview: '/api/kpis/overview',
        denialsByPayer: '/api/kpis/denials-by-payer',
        denialsByClaimType: '/api/kpis/denials-by-claim-type',
        monthlyTrends: '/api/kpis/monthly-trends'
      },
      revenue: {
        byEncounterClass: '/api/revenue/by-encounterclass',
        byPayer: '/api/revenue/by-payer',
        summary: '/api/revenue/summary'
      },
      patients: {
        summary: '/api/patients/summary',
        detail: '/api/patients/:id',
        encounters: '/api/patients/:id/encounters',
        claims: '/api/patients/:id/claims'
      },
      qa: {
        issues: '/api/qa/issues',
        summary: '/api/qa/summary'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: '/'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('RCM Operations Analytics API Server');
  console.log('='.repeat(60));
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API Documentation: http://localhost:${PORT}/`);
  console.log('='.repeat(60));
});

export default app;
