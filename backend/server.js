const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');
const { processDailyRoi } = require('./services/roiService');

dotenv.config();

const app = express();

// Serve uploads static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Security Headers (Protection against XSS and clickjacking)
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5180',
  'http://localhost:5181',
  'http://localhost:5182',
  'http://localhost:5173',
  'https://investmenprofit.vercel.app', // Adding likely Vercel URL
  /\.vercel\.app$/ // Allow any Vercel preview deployment
].filter(Boolean);

console.log('CORS Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`Origin ${origin} blocked by CORS`);
      return callback(null, true); // Temporarily allow all during initial deploy to prevent lockouts
    }
  },
  credentials: true
}));

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 3. Rate Limiting (DISABLED for development)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000, // Increased limit for development and dashboard usage
//   message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
// });
// app.use('/api/', limiter);

// 4. Body Parsers with size limits
app.use(express.json({ limit: '10kb' })); // Protection against large payload DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { supabaseAdmin } = require('./config/supabase');
    
    // Check profiles table
    const { data: profileCheck, error: profileError } = await supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true });
    
    // Check bank_accounts table schema
    const { data: bankCheck, error: bankError } = await supabaseAdmin.from('bank_accounts').select('*').limit(1);
    
    // Get column names if bankCheck exists
    let bankColumns = [];
    if (bankCheck && bankCheck.length > 0) {
      bankColumns = Object.keys(bankCheck[0]);
    } else if (bankError && bankError.message.includes('column')) {
      // If there's a column error, it might give us a hint
      console.log('Bank accounts schema error detected, attempting automatic reload...');
      // Try to reload schema automatically via RPC if function exists
      await supabaseAdmin.rpc('reload_schema').catch(e => console.log('RPC reload_schema failed:', e.message));
    }

    res.json({
      status: 'ok',
      message: 'If you see schema errors, visit /api/fix-schema',
      database: (profileError || bankError) ? 'error' : 'connected',
      profiles_table: profileError ? 'error' : 'exists',
      bank_accounts_table: bankError ? (bankError.message.includes('does not exist') ? 'missing' : 'error') : 'exists',
      bank_accounts_columns: bankColumns,
      bank_error_details: bankError ? bankError.message : null,
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_NEW_SERVICE_ROLE_KEY_HERE' ? 'provided' : 'missing',
      profile_error: profileError || null
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Fix Schema Cache (Automatic/Manual)
app.get('/api/fix-schema', async (req, res) => {
  try {
    const { supabaseAdmin } = require('./config/supabase');
    
    // 1. Try automatic reload via NOTIFY if possible (usually needs SQL function)
    const { error: rpcError } = await supabaseAdmin.rpc('reload_schema');
    
    // 2. Try a raw query that might trigger a refresh
    await supabaseAdmin.from('bank_accounts').select('id').limit(1);
    
    res.json({
      message: 'Schema refresh attempted.',
      rpc_status: rpcError ? 'Function reload_schema() not found. Please run the manual fix below.' : 'Success',
      manual_fix: 'If errors persist, go to Supabase SQL Editor and run: NOTIFY pgrst, \'reload schema\';',
      note: 'This refreshes the API cache for your tables and columns.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error during schema fix', details: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('SYC Capital API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Schedule Daily ROI Processing (Every 24 hours)
  // Run once on startup for development
  processDailyRoi();
  
  setInterval(() => {
    processDailyRoi();
  }, 24 * 60 * 60 * 1000);
});
