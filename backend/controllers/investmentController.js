const { supabase, supabaseAdmin } = require('../config/supabase');
const paymentService = require('../services/paymentService');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getSettings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .single();
    
    const defaultSettings = {
      withdrawal_fee_percent: 2.0,
      min_withdrawal_amount: 400,
      daily_profit_percent: 3.0,
      is_recharge_enabled: true,
      is_withdrawal_enabled: true,
      recharge_amounts: [500, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
      referral_reward_percent_l1: 10.0,
      referral_reward_percent_l2: 5.0,
      referral_reward_percent_l3: 2.0
    };

    if (error) {
      console.warn('Public settings fetch error, using defaults:', error.message);
      return res.json(defaultSettings);
    }

    res.json(data || defaultSettings);
  } catch (error) {
    console.error('getSettings error:', error.message);
    res.json({
      withdrawal_fee_percent: 2.0,
      min_withdrawal_amount: 400,
      daily_profit_percent: 3.0,
      is_recharge_enabled: true,
      is_withdrawal_enabled: true,
      recharge_amounts: [500, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
      referral_reward_percent_l1: 10.0,
      referral_reward_percent_l2: 5.0,
      referral_reward_percent_l3: 2.0
    });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('investment_plans').select('*').order('amount', { ascending: true });
    if (error) {
      console.warn('getPlans error:', error.message);
      return res.json([]);
    }
    res.json(data);
  } catch (error) {
    console.error('getPlans catch error:', error);
    res.json([]);
  }
};

exports.getDepositMethods = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('deposit_methods')
      .select('*')
      .eq('is_active', true)
      .order('slug', { ascending: true });
    
    if (error) {
      console.warn('getDepositMethods error (likely table missing):', error.message);
      // Return empty array instead of 500 error to avoid frontend crash
      // We log the warning but don't stop the user from viewing the page
      return res.json([]); 
    }
    
    res.json(data);
  } catch (error) {
    console.error('getDepositMethods catch error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.rechargeWallet = async (req, res) => {
  try {
    const { amount, ftId, gateway = 'manual' } = req.body;
    const userId = req.user.id;
    const file = req.file;

    let status = 'pending';
    let isAutoVerified = false;
    let screenshotUrl = null;
    let verificationGateway = gateway;

    // 1. Handle Automatic Verification if gateway is not manual
    if (gateway !== 'manual') {
      // If gateway is a UUID, fetch the slug first
      if (gateway.length === 36) { // UUID length
        const { data: method } = await supabaseAdmin
          .from('deposit_methods')
          .select('slug')
          .eq('id', gateway)
          .single();
        if (method) {
          verificationGateway = method.slug;
        }
      }

      const verified = await paymentService.verify(verificationGateway, ftId, parseFloat(amount));
      if (verified) {
        status = 'approved';
        isAutoVerified = true;
      } else {
        // Instead of 400, set to pending for manual review
        status = 'pending';
        isAutoVerified = false;
        console.log(`Auto-verification failed for ${gateway} (FTID: ${ftId}), falling back to manual review.`);
      }
    }

    // Manual or failed auto-verification requires a screenshot if not already provided
    if (status === 'pending' && !file) {
      return res.status(400).json({ message: 'Screenshot is required for manual verification review' });
    }

    if (file) {
      try {
        const isCloudinaryConfigured = 
          process.env.CLOUDINARY_API_KEY && 
          !process.env.CLOUDINARY_API_KEY.includes('your_');

        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'recharges',
          });
          screenshotUrl = result.secure_url;
          fs.unlinkSync(file.path);
        } else {
          // Fallback to local storage
          console.log('Cloudinary not configured, using local storage fallback');
          screenshotUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
          // We don't unlink the file because we are serving it locally
        }
      } catch (uploadError) {
        console.error('Upload error (falling back to local):', uploadError.message);
        screenshotUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
      }
    }

    // 2. Create recharge record
    console.log('Creating recharge for user:', userId, 'amount:', amount);
    const { data: recharge, error: subError } = await supabaseAdmin
      .from('recharges')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        ft_id: ftId,
        screenshot_url: screenshotUrl,
        payment_gateway: verificationGateway,
        is_auto_verified: isAutoVerified,
        status: status,
        reviewed_at: isAutoVerified ? new Date() : null,
      })
      .select()
      .single();

    if (subError) {
      console.error('Recharge Insert Error:', subError);
      throw subError;
    }

    // 3. If auto-approved, update user wallet immediately
    if (status === 'approved') {
      const { data: profile } = await supabaseAdmin.from('profiles').select('wallet_balance').eq('id', userId).single();
      await supabaseAdmin.from('profiles').update({
        wallet_balance: (profile.wallet_balance || 0) + parseFloat(amount)
      }).eq('id', userId);
    }

    res.status(201).json({ 
      message: status === 'approved' 
        ? 'Wallet recharged successfully via automatic verification!' 
        : (isAutoVerified === false && gateway !== 'manual' 
            ? 'Automatic verification failed. Your request has been submitted for manual admin review.' 
            : 'Recharge request submitted successfully, awaiting manual approval'),
      status 
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

exports.buyPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // 1. Get plan details
    const { data: plan } = await supabaseAdmin
      .from('investment_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // 2. Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (profile.wallet_balance < plan.amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // 3. Deduct balance and create investment
    await supabaseAdmin
      .from('profiles')
      .update({ wallet_balance: profile.wallet_balance - plan.amount })
      .eq('id', userId);

    const dailyProfit = plan.amount * (plan.daily_profit_percent / 100);
    const { data: investment, error: invError } = await supabaseAdmin
      .from('investments')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: plan.amount,
        daily_profit: dailyProfit,
      })
      .select()
      .single();

    if (invError) throw invError;

    // 4. Distribute Referral Commissions (fetch from system settings)
    const distributeCommissions = async () => {
      console.log(`Starting commission distribution for investment: ${investment.id}, user: ${userId}`);
      try {
        // Fetch current settings for commissions
        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('system_settings')
          .select('referral_reward_percent_l1, referral_reward_percent_l2, referral_reward_percent_l3')
          .eq('id', 'global')
          .maybeSingle();

        if (settingsError) {
          console.error('Error fetching system settings for commissions:', settingsError);
        }

        const commissionRates = { 
          1: (settings?.referral_reward_percent_l1 || 10.0) / 100, 
          2: (settings?.referral_reward_percent_l2 || 5.0) / 100, 
          3: (settings?.referral_reward_percent_l3 || 2.0) / 100 
        };
        
        console.log('Commission rates applied:', commissionRates);
        
        let currentUserId = userId;

        for (let level = 1; level <= 3; level++) {
          // Get the referrer of the current user
          const { data: currentUser, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('referrer_id')
            .eq('id', currentUserId)
            .single();

          if (userError || !currentUser || !currentUser.referrer_id) {
            console.log(`No referrer found for level ${level} (currentUser: ${currentUserId})`);
            break;
          }

          const referrerId = currentUser.referrer_id;
          const commissionAmount = plan.amount * commissionRates[level];
          
          console.log(`Level ${level}: Distributing ${commissionAmount} ETB to referrer ${referrerId}`);

          // Update Referrer's Wallet
          const { data: referrerProfile, error: refProfileError } = await supabaseAdmin
            .from('profiles')
            .select('wallet_balance, total_earnings')
            .eq('id', referrerId)
            .single();

          if (refProfileError || !referrerProfile) {
            console.error(`Referrer profile not found for ID ${referrerId}:`, refProfileError);
            continue;
          }

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              wallet_balance: (referrerProfile.wallet_balance || 0) + commissionAmount,
              total_earnings: (referrerProfile.total_earnings || 0) + commissionAmount
            })
            .eq('id', referrerId);
          
          if (updateError) {
            console.error(`Failed to update referrer ${referrerId} wallet:`, updateError);
          } else {
            console.log(`Successfully updated wallet for referrer ${referrerId}`);
          }

          // Log in Referrals table
          const { error: logError } = await supabaseAdmin.from('referrals').insert({
            referrer_id: referrerId,
            referred_id: userId,
            level: level,
            commission_amount: commissionAmount,
            source_investment_id: investment.id
          });
          
          if (logError) console.error('Failed to log referral record:', logError);

          // Log in Profit Logs for history
          const { error: profitError } = await supabaseAdmin.from('profit_logs').insert({
            user_id: referrerId,
            amount: commissionAmount,
            type: 'referral_commission'
          });
          
          if (profitError) console.error('Failed to log profit record:', profitError);

          // Move up to the next level's referrer
          currentUserId = referrerId;
        }
      } catch (err) {
        console.error('Commission distribution FATAL error:', err);
      }
    };

    // Run commission distribution in background
    distributeCommissions();

    res.status(201).json({ message: 'Investment plan purchased successfully!', investment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyInvestments = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('investments')
      .select('*, investment_plans(*)')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoiHistory = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profit_logs')
      .select('*, investments(investment_plans(name))')
      .eq('user_id', req.user.id)
      .in('type', ['roi', 'referral_commission', 'registration_bonus'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Format for frontend
    const formattedData = data.map(log => {
      let planName = 'Investment';
      if (log.type === 'roi') {
        planName = log.investments?.investment_plans?.name || 'Investment';
      } else if (log.type === 'referral_commission') {
        planName = 'Referral Bonus';
      } else if (log.type === 'registration_bonus') {
        planName = 'Registration Bonus';
      }

      return {
        ...log,
        plan: planName,
        date: log.created_at
      };
    });

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const fetchLevelData = async (referrerIds) => {
      if (!referrerIds || (Array.isArray(referrerIds) && referrerIds.length === 0)) {
        return [];
      }

      const ids = Array.isArray(referrerIds) ? referrerIds : [referrerIds];
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id, 
          full_name, 
          phone, 
          created_at, 
          wallet_balance,
          investments!investments_user_id_fkey (id, is_active)
        `)
        .in('referrer_id', ids);
      
      if (error) {
        console.error('Fetch Level Error:', error);
        throw error;
      }

      // Map data to include is_active based on if they have any active investment
      return (data || []).map(profile => {
        const activeInvestments = profile.investments || [];
        const isActive = activeInvestments.some(inv => inv.is_active === true);
        
        // Remove the raw investments data before sending to frontend
        const { investments, ...profileData } = profile;
        return {
          ...profileData,
          is_active: isActive
        };
      });
    };

    // 1. Fetch Level 1
    const level1 = await fetchLevelData(userId);
    const level1Ids = level1.map(u => u.id);

    // 2. Fetch Level 2
    let level2 = [];
    if (level1Ids.length > 0) {
      level2 = await fetchLevelData(level1Ids);
    }
    const level2Ids = level2.map(u => u.id);

    // 3. Fetch Level 3
    let level3 = [];
    if (level2Ids.length > 0) {
      level3 = await fetchLevelData(level2Ids);
    }

    res.json({
      level1,
      level2,
      level3,
      counts: {
        l1: level1.length,
        l2: level2.length,
        l3: level3.length,
        total: level1.length + level2.length + level3.length
      }
    });
  } catch (error) {
    console.error('Detailed Get My Referrals Error:', error);
    res.status(500).json({ 
      message: 'Failed to load referral data', 
      details: error.message 
    });
  }
};

// Bank Accounts
exports.getBankAccounts = async (req, res) => {
  try {
    // Defensively fetch only known columns or all if schema cache is fixed
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .select('id, bank_name, account_number, is_default, created_at, user_id, account_name')
      .eq('user_id', req.user.id);
    
    if (error) {
      console.warn('getBankAccounts column error, attempting fallback select:', error.message);
      // If specific column fails (like account_name), try without it to at least return some data
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('bank_accounts')
        .select('id, bank_name, account_number, is_default, created_at, user_id')
        .eq('user_id', req.user.id);
      
      if (fallbackError) throw fallbackError;
      return res.json(fallbackData.map(b => ({ ...b, account_name: 'N/A' })));
    }
    res.json(data);
  } catch (error) {
    console.error('getBankAccounts Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addBankAccount = async (req, res) => {
  try {
    const { bank_name, account_name, account_number } = req.body;
    const userId = req.user.id;

    // Check if it's the first account to make it default
    const { count } = await supabaseAdmin
      .from('bank_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const insertData = {
      user_id: userId,
      bank_name,
      account_number,
      is_default: (count || 0) === 0
    };

    // Only add account_name if it doesn't cause a schema cache error (though insert usually works)
    if (account_name) insertData.account_name = account_name;

    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('addBankAccount Error:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Bank account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Withdrawals
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccountId, password } = req.body;
    const userId = req.user.id;

    // 1. Verify user profile and password
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile.withdraw_password) {
      return res.status(400).json({ message: 'Withdrawal password not set' });
    }
    if (profile.withdraw_password !== password) {
      return res.status(400).json({ message: 'Incorrect withdrawal password' });
    }
    if (profile.wallet_balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    if (amount < 400) {
      return res.status(400).json({ message: 'Minimum withdrawal is 400 ETB' });
    }

    const fee = amount * 0.02; // 2% fee
    const netAmount = amount - fee;

    // 2. Deduct balance and create request
    await supabaseAdmin
      .from('profiles')
      .update({ wallet_balance: profile.wallet_balance - amount })
      .eq('id', userId);

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        fee,
        net_amount: netAmount,
        bank_account_id: bankAccountId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Withdrawal request submitted', withdrawal: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch recharges
    const { data: recharges } = await supabaseAdmin
      .from('recharges')
      .select('id, amount, status, submitted_at, payment_gateway')
      .eq('user_id', userId);

    // Fetch withdrawals
    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', userId);

    // Fetch investments (purchases)
    const { data: investments } = await supabaseAdmin
      .from('investments')
      .select('id, amount, start_date, plan_id, investment_plans(name)')
      .eq('user_id', userId);

    // Fetch profit logs (ROI, Referral, Bonus)
    const { data: profits } = await supabaseAdmin
      .from('profit_logs')
      .select('id, amount, type, created_at')
      .eq('user_id', userId);

    // Combine and format
    const transactions = [
      ...(recharges || []).map(r => ({
        id: r.id,
        type: 'recharge',
        amount: r.amount,
        status: r.status,
        date: r.submitted_at,
        title: `Recharge via ${r.payment_gateway.toUpperCase()}`
      })),
      ...(withdrawals || []).map(w => ({
        id: w.id,
        type: 'withdraw',
        amount: -w.amount,
        status: w.status,
        date: w.created_at,
        title: 'Withdrawal'
      })),
      ...(investments || []).map(i => ({
        id: i.id,
        type: 'purchase',
        amount: -i.amount,
        status: 'completed',
        date: i.start_date,
        title: `Purchase ${i.investment_plans?.name || 'Plan'}`
      })),
      ...(profits || []).map(p => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        status: 'completed',
        date: p.created_at,
        title: p.type === 'roi' ? 'Daily ROI' : p.type === 'referral_commission' ? 'Referral Bonus' : 'Registration Bonus'
      }))
    ];

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance, total_earnings')
      .eq('id', userId)
      .single();

    // 2. Get Total Recharge (Approved only)
    const { data: recharges } = await supabaseAdmin
      .from('recharges')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'approved');
    const totalRecharge = (recharges || []).reduce((sum, r) => sum + parseFloat(r.amount), 0);

    // 3. Get Total Withdraw
    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved']);
    const totalWithdraw = (withdrawals || []).reduce((sum, w) => sum + parseFloat(w.amount), 0);

    // 4. Get Team Stats
    const { data: teamProfits } = await supabaseAdmin
      .from('profit_logs')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'referral_commission');
    const teamIncome = (teamProfits || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // 5. Get Total Team Size (All 3 levels)
    const getTeamSize = async (referrerIds) => {
      if (!referrerIds || (Array.isArray(referrerIds) && referrerIds.length === 0)) return [];
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .in('referrer_id', Array.isArray(referrerIds) ? referrerIds : [referrerIds]);
      return (data || []).map(u => u.id);
    };

    const l1Ids = await getTeamSize(userId);
    const l2Ids = await getTeamSize(l1Ids);
    const l3Ids = await getTeamSize(l2Ids);
    const totalTeamSize = l1Ids.length + l2Ids.length + l3Ids.length;

    res.json({
      walletBalance: profile?.wallet_balance || 0,
      totalEarnings: profile?.total_earnings || 0,
      totalRecharge,
      totalWithdraw,
      teamIncome,
      teamSize: totalTeamSize
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
};
