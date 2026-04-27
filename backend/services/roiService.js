const { supabaseAdmin } = require('../config/supabase');

const processDailyRoi = async () => {
  console.log('Starting daily ROI processing...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get all active investments that haven't reached 65 days
    // AND haven't been paid today (last_payout_at is null or before today)
    const { data: investments, error } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('is_active', true)
      .lt('days_paid', 65);

    if (error) throw error;

    const pendingInvestments = investments.filter(inv => {
      if (!inv.last_payout_at) return true;
      const lastPayout = new Date(inv.last_payout_at);
      lastPayout.setHours(0, 0, 0, 0);
      return lastPayout.getTime() < today.getTime();
    });

    console.log(`Processing ${pendingInvestments.length} pending investments...`);

    for (const investment of pendingInvestments) {
      const { id, user_id, daily_profit, days_paid } = investment;

      // 2. Update user wallet
      const { data: user } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance, total_earnings')
        .eq('id', user_id)
        .single();

      if (!user) continue;

      await supabaseAdmin
        .from('profiles')
        .update({
          wallet_balance: (user.wallet_balance || 0) + daily_profit,
          total_earnings: (user.total_earnings || 0) + daily_profit,
        })
        .eq('id', user_id);

      // 3. Log profit
      await supabaseAdmin
        .from('profit_logs')
        .insert({
          user_id: user_id,
          investment_id: id,
          amount: daily_profit,
          type: 'roi',
        });

      // 4. Update investment
      const newDaysPaid = days_paid + 1;
      await supabaseAdmin
        .from('investments')
        .update({
          days_paid: newDaysPaid,
          last_payout_at: new Date(),
          is_active: newDaysPaid < 65,
        })
        .eq('id', id);
    }

    console.log('Daily ROI processing completed.');
  } catch (error) {
    console.error('Error in daily ROI processing:', error.message);
  }
};

module.exports = { processDailyRoi };
