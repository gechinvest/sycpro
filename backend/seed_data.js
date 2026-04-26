const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Seeding system settings...');
  const { error: settingsError } = await supabaseAdmin
    .from('system_settings')
    .upsert({
      id: 'global',
      withdrawal_fee_percent: 2.0,
      min_withdrawal_amount: 400,
      daily_profit_percent: 3.0,
      is_recharge_enabled: true,
      is_withdrawal_enabled: true,
      recharge_amounts: [600, 1000, 2500, 5000, 10000, 20000, 50000, 100000],
      referral_reward_percent_l1: 10.0,
      referral_reward_percent_l2: 5.0,
      referral_reward_percent_l3: 2.0
    });

  if (settingsError) console.error('Error seeding settings:', settingsError.message);
  else console.log('Settings seeded successfully.');

  console.log('Seeding deposit methods...');
  const methods = [
    {
      slug: 'telebirr',
      name: 'Telebirr',
      account_number: '0912345678',
      account_owner: 'INVESTPRO CAPITAL',
      is_active: true
    },
    {
      slug: 'cbe',
      name: 'Commercial Bank of Ethiopia (CBE)',
      account_number: '1000123456789',
      account_owner: 'INVESTPRO CAPITAL',
      is_active: true
    },
    {
      slug: 'abyssinia',
      name: 'Bank of Abyssinia',
      account_number: '55667788',
      account_owner: 'INVESTPRO CAPITAL',
      is_active: true
    }
  ];

  for (const m of methods) {
    const { error: mError } = await supabaseAdmin
      .from('deposit_methods')
      .upsert(m, { onConflict: 'slug' });
    
    if (mError) console.error(`Error seeding method ${m.slug}:`, mError.message);
    else console.log(`Method ${m.slug} seeded successfully.`);
  }

  console.log('Seeding investment plans...');
  const plans = [
    { name: 'Starter', amount: 600, daily_profit_percent: 3.0, duration_days: 30 },
    { name: 'Silver', amount: 1000, daily_profit_percent: 3.5, duration_days: 30 },
    { name: 'Gold', amount: 2500, daily_profit_percent: 4.0, duration_days: 30 },
    { name: 'Platinum', amount: 5000, daily_profit_percent: 4.5, duration_days: 30 },
    { name: 'Diamond', amount: 10000, daily_profit_percent: 5.0, duration_days: 30 }
  ];

  for (const p of plans) {
    // Check if plan exists by name
    const { data: existingPlan } = await supabaseAdmin
      .from('investment_plans')
      .select('id')
      .eq('name', p.name)
      .single();

    if (existingPlan) {
      const { error: pError } = await supabaseAdmin
        .from('investment_plans')
        .update(p)
        .eq('id', existingPlan.id);
      if (pError) console.error(`Error updating plan ${p.name}:`, pError.message);
      else console.log(`Plan ${p.name} updated successfully.`);
    } else {
      const { error: pError } = await supabaseAdmin
        .from('investment_plans')
        .insert({
          id: crypto.randomUUID(),
          ...p
        });
      if (pError) console.error(`Error inserting plan ${p.name}:`, pError.message);
      else console.log(`Plan ${p.name} inserted successfully.`);
    }
  }

  console.log('Data seeding completed.');
}

seedData();
