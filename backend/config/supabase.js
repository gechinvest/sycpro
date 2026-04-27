const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_NEW_SERVICE_ROLE_KEY_HERE') {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing or not set. Admin functions will fail.');
}

// Client for regular user operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for bypass RLS (use with caution)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
