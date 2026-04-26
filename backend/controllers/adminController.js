const { supabase, supabaseAdmin } = require('../config/supabase');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getRecharges = async (req, res) => {
  try {
    console.log('Fetching all recharges...');
    const { data, error } = await supabaseAdmin
      .from('recharges')
      .select('*, profiles(full_name, phone, wallet_balance)')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.log('getRecharges join failed or table missing:', error.message);
      
      // Attempt manual fetch if join failed
      const { data: recharges, error: rError } = await supabaseAdmin
        .from('recharges')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (rError) {
        console.warn('recharges table might not exist:', rError.message);
        return res.json([]); // Return empty array instead of 500
      }

      const userIds = [...new Set(recharges.map(r => r.user_id))];
      const { data: profiles, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, wallet_balance')
        .in('id', userIds);

      if (pError) console.warn('profiles fetch failed for recharges:', pError.message);

      const merged = recharges.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.id === r.user_id) || null
      }));

      return res.json(merged);
    }

    res.json(data || []);
  } catch (error) {
    console.error('getRecharges Exception:', error.message);
    res.json([]); // Fail gracefully with empty array
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    console.log('Fetching all withdrawals...');
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*, profiles(full_name, phone, wallet_balance), bank_accounts(*)')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.log('getWithdrawals join failed or table missing:', error.message);
      
      const { data: withdrawals, error: wError } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (wError) {
        console.warn('withdrawals table might not exist:', wError.message);
        return res.json([]);
      }

      const userIds = [...new Set(withdrawals.map(w => w.user_id))];
      const bankIds = [...new Set(withdrawals.map(w => w.bank_account_id).filter(Boolean))];

      const [{ data: profiles, error: pError }, { data: banks, error: bError }] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, full_name, phone, wallet_balance').in('id', userIds),
        supabaseAdmin.from('bank_accounts').select('*').in('id', bankIds)
      ]);

      if (pError) console.warn('profiles fetch failed for withdrawals:', pError.message);
      if (bError) console.warn('banks fetch failed for withdrawals:', bError.message);

      const merged = withdrawals.map(w => ({
        ...w,
        profiles: profiles?.find(p => p.id === w.user_id) || null,
        bank_accounts: banks?.find(b => b.id === w.bank_account_id) || null
      }));

      return res.json(merged);
    }

    res.json(data || []);
  } catch (error) {
    console.error('getWithdrawals Exception:', error.message);
    res.json([]);
  }
};

exports.reviewWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    const { data: withdrawal } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();

    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    if (status === 'approved') {
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'approved',
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .eq('id', id);
      res.json({ message: 'Withdrawal approved' });
    } else {
      // Reject: Return money to wallet
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .eq('id', id);

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance')
        .eq('id', withdrawal.user_id)
        .single();

      await supabaseAdmin
        .from('profiles')
        .update({
          wallet_balance: (profile.wallet_balance || 0) + withdrawal.amount
        })
        .eq('id', withdrawal.user_id);

      res.json({ message: 'Withdrawal rejected and balance returned' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewRecharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    const { data: recharge } = await supabaseAdmin
      .from('recharges')
      .select('*')
      .eq('id', id)
      .single();

    if (!recharge) return res.status(404).json({ message: 'Recharge request not found' });
    if (recharge.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    if (status === 'approved') {
      // 1. Update recharge status
      await supabaseAdmin
        .from('recharges')
        .update({
          status: 'approved',
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .eq('id', id);

      // 2. Update user wallet
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance')
        .eq('id', recharge.user_id)
        .single();

      await supabaseAdmin
        .from('profiles')
        .update({
          wallet_balance: (profile.wallet_balance || 0) + recharge.amount
        })
        .eq('id', recharge.user_id);

      res.json({ message: 'Recharge approved and wallet balance updated' });
    } else {
      // Reject
      await supabaseAdmin
        .from('recharges')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date(),
          reviewed_by: adminId,
        })
        .eq('id', id);
      res.json({ message: 'Recharge rejected' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleReferrals = async (userId, amount, investmentId) => {
  try {
    // Fetch current settings for commissions
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('referral_reward_percent_l1, referral_reward_percent_l2, referral_reward_percent_l3')
      .eq('id', 'global')
      .single();

    const levels = [
      (settings?.referral_reward_percent_l1 || 10.0) / 100,
      (settings?.referral_reward_percent_l2 || 5.0) / 100,
      (settings?.referral_reward_percent_l3 || 2.0) / 100
    ];
    let currentUserId = userId;

    for (let i = 0; i < levels.length; i++) {
    // Get referrer
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('referrer_id')
      .eq('id', currentUserId)
      .single();

    if (!user || !user.referrer_id) break;

    const referrerId = user.referrer_id;
    const commission = amount * levels[i];

    // Update referrer wallet and total earnings
    const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance, total_earnings')
        .eq('id', referrerId)
        .single();

    await supabaseAdmin
      .from('profiles')
      .update({
        wallet_balance: (referrer.wallet_balance || 0) + commission,
        total_earnings: (referrer.total_earnings || 0) + commission,
      })
      .eq('id', referrerId);

    // Log referral
    await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: userId,
        level: i + 1,
        commission_amount: commission,
        source_investment_id: investmentId,
      });

    // Also log to profit_logs for transaction history
    await supabaseAdmin
      .from('profit_logs')
      .insert({
        user_id: referrerId,
        amount: commission,
        type: 'referral_commission',
        metadata: { referred_user_id: userId, level: i + 1 }
      });

    currentUserId = referrerId;
    }
  } catch (error) {
    console.error('handleReferrals error:', error.message);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('getAllUsers Error (Supabase):', error.message);
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.error('getAllUsers Catch (General):', error.message);
    res.json([]);
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [investments, recharges, referrals, profitLogs, bankAccounts] = await Promise.all([
      supabaseAdmin.from('investments').select('*, investment_plans(name)').eq('user_id', id).order('start_date', { ascending: false }),
      supabaseAdmin.from('recharges').select('*').eq('user_id', id).order('submitted_at', { ascending: false }),
      supabaseAdmin.from('referrals').select('*, referred_user:profiles(full_name, phone)').eq('referrer_id', id).order('paid_at', { ascending: false }),
      supabaseAdmin.from('profit_logs').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('bank_accounts').select('*').eq('user_id', id).order('created_at', { ascending: false })
    ]);

    if (investments.error) console.warn('getUserActivity investments error:', investments.error.message);
    if (recharges.error) console.warn('getUserActivity recharges error:', recharges.error.message);
    if (profitLogs.error) console.warn('getUserActivity profitLogs error:', profitLogs.error.message);
    if (bankAccounts.error) console.warn('getUserActivity bankAccounts error:', bankAccounts.error.message);

    // If referrals join failed, fetch referred users manually
    let finalReferrals = referrals.data || [];
    if (referrals.error) {
      console.log('Referrals join failed, manual merge:', referrals.error.message);
      const { data: rawRefs } = await supabaseAdmin.from('referrals').select('*').eq('referrer_id', id).order('paid_at', { ascending: false });
      if (rawRefs) {
        const referredIds = rawRefs.map(r => r.referred_id);
        const { data: profs } = await supabaseAdmin.from('profiles').select('id, full_name, phone').in('id', referredIds);
        finalReferrals = rawRefs.map(r => ({
          ...r,
          referred_user: profs?.find(p => p.id === r.referred_id) || null
        }));
      }
    }

    res.json({
      investments: investments.data || [],
      recharges: recharges.data || [],
      referrals: finalReferrals,
      profitLogs: profitLogs.data || [],
      bankAccounts: bankAccounts.data || []
    });
  } catch (error) {
    console.error('getUserActivity Exception:', error.message);
    res.json({
      investments: [],
      recharges: [],
      referrals: [],
      profitLogs: [],
      bankAccounts: []
    });
  }
};

exports.getAllPlans = async (req, res) => {
  try {
    console.log('Fetching all investment plans...');
    const { data, error } = await supabaseAdmin
      .from('investment_plans')
      .select('*')
      .order('amount', { ascending: true });
    if (error) {
      console.warn('getAllPlans Error (Supabase):', error.message);
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.error('getAllPlans Catch (General):', error.message);
    res.json([]);
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { id, name, amount, daily_profit_percent, duration_days } = req.body;
    const file = req.file;
    let image_url = null;

    if (!id || !name || !amount) {
      return res.status(400).json({ message: 'ID, Name, and Amount are required' });
    }

    if (file) {
      try {
        const isCloudinaryConfigured = 
          process.env.CLOUDINARY_API_KEY && 
          !process.env.CLOUDINARY_API_KEY.includes('your_');

        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
          });
          image_url = result.secure_url;
          fs.unlinkSync(file.path);
        } else {
          image_url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
        }
      } catch (uploadError) {
        console.error('Plan upload error:', uploadError.message);
        image_url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
      }
    }

    const planData = {
      id,
      name,
      amount: parseFloat(amount),
      daily_profit_percent: parseFloat(daily_profit_percent || 20),
      duration_days: parseInt(duration_days || 65),
      image_url
    };

    const { data, error } = await supabaseAdmin
      .from('investment_plans')
      .insert(planData)
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('createPlan Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, daily_profit_percent, duration_days } = req.body;
    const file = req.file;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (daily_profit_percent !== undefined) updateData.daily_profit_percent = parseFloat(daily_profit_percent);
    if (duration_days !== undefined) updateData.duration_days = parseInt(duration_days);

    if (file) {
      try {
        const isCloudinaryConfigured = 
          process.env.CLOUDINARY_API_KEY && 
          !process.env.CLOUDINARY_API_KEY.includes('your_');

        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
          });
          updateData.image_url = result.secure_url;
          fs.unlinkSync(file.path);
        } else {
          updateData.image_url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
        }
      } catch (uploadError) {
        console.error('Plan update upload error:', uploadError.message);
        updateData.image_url = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('investment_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('updatePlan Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const requiredTables = [
      'profiles',
      'investment_plans',
      'investments',
      'recharges',
      'withdrawals',
      'bank_accounts',
      'referrals',
      'profit_logs',
      'system_settings',
      'deposit_methods'
    ];

    const missingTables = [];
    
    // Check all tables in parallel
    await Promise.all(requiredTables.map(async (tableName) => {
      const { error } = await supabaseAdmin
        .from(tableName)
        .select('count', { count: 'exact', head: true });
      
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        missingTables.push(tableName);
      }
    }));

    const defaultSettings = {
      id: 'global',
      withdrawal_fee_percent: 2.0,
      min_withdrawal_amount: 400,
      daily_profit_percent: 3.0,
      is_recharge_enabled: true,
      is_withdrawal_enabled: true,
      recharge_amounts: [500, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
      referral_reward_percent_l1: 10.0,
      referral_reward_percent_l2: 5.0,
      referral_reward_percent_l3: 2.0,
      depositMethods: []
    };

    if (missingTables.length > 0) {
      return res.json({ 
        ...defaultSettings,
        needsMigration: true,
        missingTables: missingTables,
        message: `The following tables are missing: ${missingTables.join(', ')}.`
      });
    }

    // Fetch actual settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .single();
    
    // Fetch deposit methods
    const { data: depositMethods, error: dmError } = await supabaseAdmin
      .from('deposit_methods')
      .select('*')
      .order('slug', { ascending: true });

    const finalSettings = settings || defaultSettings;

    res.json({
      ...finalSettings,
      depositMethods: depositMethods || [],
      needsMigration: false,
      missingTables: []
    });
  } catch (error) {
    console.error('getSystemSettings Exception:', error.message);
    res.json({
      id: 'global',
      withdrawal_fee_percent: 2.0,
      min_withdrawal_amount: 400,
      daily_profit_percent: 3.0,
      is_recharge_enabled: true,
      is_withdrawal_enabled: true,
      recharge_amounts: [500, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
      needsMigration: false
    });
  }
};

exports.updateDepositMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, account_number, account_owner, is_active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('deposit_methods')
      .update({ name, account_number, account_owner, is_active })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST205') {
        return res.status(400).json({ message: "The 'deposit_methods' table is missing. Please run the SQL migrations." });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkSystemStatus = async (req, res) => {
  try {
    const requiredTables = [
      'profiles',
      'investment_plans',
      'investments',
      'recharges',
      'withdrawals',
      'bank_accounts',
      'referrals',
      'profit_logs',
      'system_settings',
      'deposit_methods'
    ];

    const status = {};
    const missingTables = [];

    await Promise.all(requiredTables.map(async (table) => {
      const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        status[table] = 'missing';
        missingTables.push(table);
      } else {
        status[table] = 'ok';
      }
    }));

    res.json({
      status: missingTables.length === 0 ? 'ok' : 'error',
      tables: status,
      missingTables
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.runAutoMigration = async (req, res) => {
  try {
    console.log('Attempting automatic migration...');
    
    // Path to the supabase directory (root of project)
    const projectRoot = path.resolve(__dirname, '../../');
    
    // Command to run migration up
    // We use --local to ensure it's targeting the local instance
    const cmd = 'supabase migration up';
    
    exec(cmd, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Migration Error: ${error.message}`);
        return res.status(500).json({ 
          message: 'Migration failed', 
          error: error.message,
          stderr: stderr 
        });
      }
      
      console.log(`Migration Output: ${stdout}`);
      res.json({ 
        message: 'Migration completed successfully', 
        output: stdout 
      });
    });
  } catch (error) {
    console.error('Auto-migration exception:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { 
      withdrawal_fee_percent, 
      min_withdrawal_amount, 
      daily_profit_percent, 
      is_recharge_enabled, 
      is_withdrawal_enabled,
      recharge_amounts,
      referral_reward_percent_l1,
      referral_reward_percent_l2,
      referral_reward_percent_l3
    } = req.body;

    const updateData = {};
    if (withdrawal_fee_percent !== undefined) updateData.withdrawal_fee_percent = parseFloat(withdrawal_fee_percent);
    if (min_withdrawal_amount !== undefined) updateData.min_withdrawal_amount = parseFloat(min_withdrawal_amount);
    if (daily_profit_percent !== undefined) updateData.daily_profit_percent = parseFloat(daily_profit_percent);
    if (is_recharge_enabled !== undefined) updateData.is_recharge_enabled = is_recharge_enabled;
    if (is_withdrawal_enabled !== undefined) updateData.is_withdrawal_enabled = is_withdrawal_enabled;
    if (referral_reward_percent_l1 !== undefined) updateData.referral_reward_percent_l1 = parseFloat(referral_reward_percent_l1);
    if (referral_reward_percent_l2 !== undefined) updateData.referral_reward_percent_l2 = parseFloat(referral_reward_percent_l2);
    if (referral_reward_percent_l3 !== undefined) updateData.referral_reward_percent_l3 = parseFloat(referral_reward_percent_l3);
    if (recharge_amounts !== undefined) {
      updateData.recharge_amounts = Array.isArray(recharge_amounts) 
        ? recharge_amounts 
        : recharge_amounts.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    }

    let { data, error } = await supabaseAdmin
      .from('system_settings')
      .update(updateData)
      .eq('id', 'global')
      .select()
      .single();

    if (error) {
      // Handle table missing error (PGRST205)
      if (error.code === 'PGRST205') {
        console.error('System settings table missing from schema cache. Please run migrations.');
        return res.status(400).json({ 
          message: "Database tables are missing. Please run the SQL migrations in Supabase dashboard to create 'system_settings' and 'deposit_methods' tables.",
          code: 'TABLES_MISSING'
        });
      }

      // Handle missing column error (Postgres 42703)
      if (error.code === '42703' && updateData.recharge_amounts) {
        console.warn('recharge_amounts column missing, retrying without it...');
        const cleanUpdateData = { ...updateData };
        delete cleanUpdateData.recharge_amounts;
        
        const retry = await supabaseAdmin
          .from('system_settings')
          .update(cleanUpdateData)
          .eq('id', 'global')
          .select()
          .single();
        
        data = retry.data;
        error = retry.error;
      }

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist or is empty, try to initialize
        const { data: newData, error: initError } = await supabaseAdmin
          .from('system_settings')
          .insert({ id: 'global', ...updateData })
          .select()
          .single();
        
        // If insert fails due to missing column, try without recharge_amounts
        if (initError && initError.code === '42703' && updateData.recharge_amounts) {
          const cleanInitData = { id: 'global', ...updateData };
          delete cleanInitData.recharge_amounts;
          const retryInit = await supabaseAdmin
            .from('system_settings')
            .insert(cleanInitData)
            .select()
            .single();
          if (retryInit.error) throw retryInit.error;
          return res.json(retryInit.data);
        }

        if (initError) throw initError;
        return res.json(newData);
      }
      
      if (error) {
        console.error('Update settings error:', error);
        throw error;
      }
    }
    res.json(data);
  } catch (error) {
    console.error('updateSystemSettings 500 Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.addDepositMethod = async (req, res) => {
  try {
    const { slug, name, account_number, account_owner } = req.body;
    const { data, error } = await supabaseAdmin
      .from('deposit_methods')
      .insert({ slug, name, account_number, account_owner, is_active: true })
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST205') {
        return res.status(400).json({ message: "The 'deposit_methods' table is missing. Please run the SQL migrations." });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDepositMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('deposit_methods')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Method deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, account_name, account_number } = req.body;
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .update({ bank_name, account_name, account_number })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    console.log('Fetching admin stats...');
    const [recharges, withdrawals] = await Promise.all([
      supabaseAdmin.from('recharges').select('id').eq('status', 'pending'),
      supabaseAdmin.from('withdrawals').select('id').eq('status', 'pending')
    ]);

    if (recharges.error) console.warn('getAdminStats recharges error:', recharges.error.message);
    if (withdrawals.error) console.warn('getAdminStats withdrawals error:', withdrawals.error.message);

    res.json({
      pendingRecharges: recharges.data?.length || 0,
      pendingWithdrawals: withdrawals.data?.length || 0,
      totalNotifications: (recharges.data?.length || 0) + (withdrawals.data?.length || 0)
    });
  } catch (error) {
    console.error('getAdminStats Catch (General):', error.message);
    res.json({ pendingRecharges: 0, pendingWithdrawals: 0, totalNotifications: 0 });
  }
};

exports.checkSystemStatus = async (req, res) => {
  try {
    const tables = [
      'profiles',
      'system_settings',
      'deposit_methods',
      'recharges',
      'withdrawals',
      'investments',
      'investment_plans',
      'profit_logs',
      'referrals',
      'bank_accounts'
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabaseAdmin.from(table).select('id').limit(1);
        return {
          table,
          exists: !error || (error.code !== 'PGRST205' && error.code !== '42P01'),
          error: error ? error.message : null
        };
      })
    );

    const allGood = results.every((r) => r.exists);
    const missing = results.filter((r) => !r.exists).map((r) => r.table);

    res.json({
      healthy: allGood,
      missing,
      details: results
    });
  } catch (error) {
    res.status(500).json({ healthy: false, error: error.message });
  }
};

exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    // Prevent self-demotion
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own admin status' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Also update Supabase Auth metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { is_admin }
    });

    if (authError) {
      console.warn('Auth metadata update failed:', authError.message);
    }

    res.json({ message: `User admin status ${is_admin ? 'enabled' : 'disabled'}`, user: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('investment_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateActiveInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const { daily_profit, is_active } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('investments')
      .update({ daily_profit, is_active })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
