const { supabase, supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

exports.register = async (req, res) => {
  try {
    let { fullName, phone, email, password, referralCode } = req.body;

    // If no email provided, use phone as a fake email for free authentication
    if (!email && phone) {
      email = `${phone}@smartyield.net`;
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Phone/Email and password are required' });
    }

    // 1. Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database Check Error:', checkError);
      return res.status(500).json({ 
        message: 'Database connection error', 
        details: checkError.message,
        hint: 'Check if SUPABASE_SERVICE_ROLE_KEY is correct and "profiles" table exists.'
      });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'This phone or email is already registered' });
    }

    // 2. Register in Supabase Auth with Metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return res.status(authError.status || 500).json({ 
        message: authError.message || 'Authentication service error',
        details: authError.details || 'Check if Supabase Email Confirmation is disabled in Auth settings.',
        hint: 'If you see "email rate limit", wait 60 seconds or disable rate limits in Supabase.'
      });
    }

    // 3. Update profile with referrer if code provided and generate own referral code
    // (The trigger already created the basic profile)
    const newReferralCode = generateReferralCode();
    
    if (referralCode) {
      const normalizedRefCode = referralCode.trim().toUpperCase();
      // Use supabaseAdmin to bypass RLS and find the referrer by their code
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', normalizedRefCode)
        .single();
      
      if (referrer && !referrerError) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ referrer_id: referrer.id, referral_code: newReferralCode })
          .eq('id', authData.user.id);
        
        if (updateError) console.error('Referrer update error:', updateError);
      } else if (referrerError) {
        console.error('Referrer find error:', referrerError);
        // Still set the new user's referral code even if referrer not found
        await supabaseAdmin
          .from('profiles')
          .update({ referral_code: newReferralCode })
          .eq('id', authData.user.id);
      }
    } else {
      // No referral code provided, just set the new user's referral code
      await supabaseAdmin
        .from('profiles')
        .update({ referral_code: newReferralCode })
        .eq('id', authData.user.id);
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Detailed Registration Error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal Server Error',
      details: error.details || error.hint || 'No additional details available'
    });
  }
};

exports.adminRegister = async (req, res) => {
  try {
    const { fullName, phone, email, password, adminSecret } = req.body;

    // 0. Check if admin registration is enabled
    if (process.env.ALLOW_ADMIN_REGISTER !== 'true') {
      return res.status(403).json({ message: 'Admin registration is currently disabled' });
    }

    // 1. Validate Admin Secret
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid Admin Secret Key' });
    }

    // 2. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone already registered' });
    }

    // 3. Register in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          is_admin: true
        }
      }
    });

    if (authError) throw authError;

    // 4. Update profile to be admin (Trigger might have created basic profile)
    await supabaseAdmin
      .from('profiles')
      .update({ 
        is_admin: true,
        full_name: fullName,
        phone: phone,
        email: email
      })
      .eq('id', authData.user.id);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Admin Registration Error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password, phone } = req.body;

    // Support logging in with phone number by converting to fake email
    if (!email && phone) {
      email = `${phone}@smartyield.net`;
    }

    if (!email) {
      return res.status(400).json({ message: 'Phone or Email is required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login Auth Error:', error);
      return res.status(401).json({ 
        message: error.message || 'Invalid credentials',
        hint: 'If you just registered, ensure "Confirm Email" is DISABLED in Supabase > Auth > Settings.'
      });
    }

    // Get profile info - Use supabaseAdmin to bypass RLS since the anon client doesn't have a user session yet
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile Fetch Error:', profileError);
      return res.status(500).json({ message: 'User authenticated but profile not found.' });
    }

    // Auto-generate referral code if missing (for legacy users)
    if (!profile.referral_code) {
      const newCode = generateReferralCode();
      const { data: updatedProfile } = await supabaseAdmin
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', profile.id)
        .select()
        .single();
      if (updatedProfile) profile.referral_code = updatedProfile.referral_code;
    }

    const token = jwt.sign(
      { id: data.user.id, isAdmin: profile.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: profile });
  } catch (error) {
    console.error('Login Controller Error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.getReferrerByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { data: referrer, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !referrer) {
      return res.status(404).json({ message: 'Referrer not found' });
    }

    res.json({ fullName: referrer.full_name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    if (error) {
      console.error('Database Error in getProfile:', error);
      return res.status(500).json({ message: 'Internal Database Error' });
    }

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found. Please register again.' });
    }

    res.json(profile);
  } catch (error) {
    console.error('System Error in getProfile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;
    res.json({ message: 'Login password updated successfully' });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

exports.updateWithdrawPassword = async (req, res) => {
  try {
    const { withdrawPassword } = req.body;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ withdraw_password: withdrawPassword })
      .eq('id', userId);

    if (error) throw error;
    res.json({ message: 'Withdrawal password updated successfully' });
  } catch (error) {
    console.error('Update Withdraw Password Error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
