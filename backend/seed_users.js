const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding users...');

  const users = [
    {
      email: '251912345678@smartyield.net',
      password: 'adminpassword123',
      phone: '251912345678',
      full_name: 'System Administrator',
      is_admin: true
    },
    {
      email: '251712345678@smartyield.net',
      password: 'userpassword123',
      phone: '251712345678',
      full_name: 'Test User',
      is_admin: false
    }
  ];

  for (const u of users) {
    console.log(`Creating user: ${u.email}`);
    
    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        phone: u.phone
      }
    });

    if (authError) {
      if (authError.code === 'email_exists' || (authError.message && authError.message.includes('already registered'))) {
        console.log(`User ${u.email} already exists in Auth. Updating...`);
        // Try to get the user ID
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData.users.find(user => user.email === u.email);
        if (existingUser) {
           console.log(`User ${u.email} found. Updating password and profile...`);
           // Update password to ensure it matches our seed
           const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
             password: u.password
           });
           if (updateAuthError) console.error(`Error updating password for ${u.email}:`, updateAuthError.message);
           
           // Update profile if it exists or create it
           await updateProfile(existingUser.id, u);
        }
      } else {
        console.error(`Error creating ${u.email}:`, JSON.stringify(authError, null, 2));
      }
      continue;
    }

    await updateProfile(authData.user.id, u);
  }

  console.log('Seeding completed.');
}

async function updateProfile(userId, u) {
  // The trigger might have already created the profile, but we want to ensure is_admin is set
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: u.full_name,
      phone: u.phone,
      email: u.email,
      is_admin: u.is_admin,
      referral_code: u.is_admin ? 'ADMIN1' : 'USER01',
      wallet_balance: 1000, // Give them some initial balance
      total_earnings: 0
    });

  if (profileError) {
    console.error(`Error updating profile for ${u.email}:`, profileError.message);
  } else {
    console.log(`Profile updated for ${u.email} (Admin: ${u.is_admin})`);
  }
}

seed();
