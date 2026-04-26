const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid' });
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(403).json({ message: 'User identity not found in token' });
    }

    // Always check the database directly for admin status to avoid stale tokens
    console.log(`Checking admin status for user ID: ${req.user.id}`);
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Admin Check Error:', JSON.stringify(error, null, 2));
      return res.status(403).json({ message: 'Could not verify admin status' });
    }

    if (!profile) {
      console.log(`Profile not found for user ID: ${req.user.id}`);
      return res.status(403).json({ message: 'User profile not found' });
    }

    console.log(`Profile found: is_admin = ${profile.is_admin}`);
    if (profile.is_admin === true) {
      next();
    } else {
      console.log(`Access Denied: User ${req.user.id} is not an admin`);
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    console.error('Auth Middleware Exception:', error);
    res.status(500).json({ message: 'Internal server error during authorization' });
  }
};
