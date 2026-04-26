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
  'http://localhost:5173'
].filter(Boolean);

console.log('CORS Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
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

// Root route
app.get('/', (req, res) => {
  res.send('SYC Capital API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
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
