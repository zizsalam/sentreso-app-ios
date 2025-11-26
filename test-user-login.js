#!/usr/bin/env node
/**
 * Test login for specific user: taphals@yahoo.fr
 * User ID: 179765ea-b422-411e-8b08-12b29f4c6ff7
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd0e.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificUser() {
  const email = 'taphals@yahoo.fr';
  const userId = '179765ea-b422-411e-8b08-12b29f4c6ff7';

  console.log('🔍 Testing connection issue for specific user');
  console.log('═'.repeat(70));
  console.log(`📧 Email: ${email}`);
  console.log(`🆔 User ID: ${userId}`);
  console.log('─'.repeat(70));

  try {
    // Test 1: Try to get user by ID (requires service role key)
    console.log('\n1️⃣ Checking user status...');

    // Test 2: Try different password combinations
    console.log('\n2️⃣ Testing common password patterns...');
    const commonPasswords = [
      'password123',
      'Password123',
      'password',
      '123456',
      'taphals123',
      'yahoo123',
      'testpass123'
    ];

    for (const password of commonPasswords) {
      console.log(`\n🔐 Testing password: ${password}`);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          console.log(`   ❌ ${error.message}`);

          // Analyze specific error types
          if (error.message.includes('Invalid login credentials')) {
            console.log('   📋 This means either:');
            console.log('      - Wrong password');
            console.log('      - Email not confirmed');
            console.log('      - User doesn\'t exist');
          } else if (error.message.includes('Email not confirmed')) {
            console.log('   📋 Email confirmation required!');
          } else if (error.message.includes('Too many requests')) {
            console.log('   📋 Rate limited - wait a few minutes');
          }
        } else {
          console.log('   ✅ LOGIN SUCCESSFUL!');
          console.log(`   📧 Email: ${data.user?.email}`);
          console.log(`   🆔 User ID: ${data.user?.id}`);
          console.log(`   ✔️  Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
          console.log(`   👤 Name: ${data.user?.user_metadata?.name || 'Not set'}`);
          console.log(`   🎭 Role: ${data.user?.user_metadata?.role || 'Not set'}`);

          // Sign out
          await supabase.auth.signOut();
          return;
        }
      } catch (err) {
        console.log(`   ❌ Unexpected error: ${err.message}`);
      }
    }

    console.log('\n3️⃣ All password attempts failed. Possible issues:');
    console.log('   📋 Email not confirmed in Supabase Dashboard');
    console.log('   📋 Wrong password (user needs to reset)');
    console.log('   📋 User account disabled or deleted');
    console.log('   📋 Network connectivity issues');

    console.log('\n🔧 Recommended solutions:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge/auth/users');
    console.log(`   2. Search for: ${email}`);
    console.log('   3. Check "Email Confirmed" status');
    console.log('   4. If not confirmed: Click "..." → "Confirm email"');
    console.log('   5. If confirmed: Reset password for user');
    console.log('   6. Check user metadata and role settings');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }
}

async function main() {
  await testSpecificUser();

  console.log('\n═'.repeat(70));
  console.log('📝 Next Steps:');
  console.log('   1. Check Supabase Dashboard for user status');
  console.log('   2. Confirm email if needed');
  console.log('   3. Reset password if email is confirmed');
  console.log('   4. Test login again');
  console.log('\n🔗 Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge/auth/users');
}

main();


