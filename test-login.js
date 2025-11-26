#!/usr/bin/env node
/**
 * Test login for specific users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd0e.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(email, password) {
  console.log(`\n🔍 Testing login for: ${email}`);
  console.log('─'.repeat(60));

  try {
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.log('❌ Login failed:', error.message);

      // Check if user exists
      console.log('\n📋 Checking user status...');

      // Note: We can't query auth.users directly with anon key
      // But we can try to check if it's an email confirmation issue
      if (error.message.includes('Invalid login credentials')) {
        console.log('⚠️  Possible reasons:');
        console.log('   1. Email not confirmed (check Supabase Dashboard → Authentication → Users)');
        console.log('   2. Wrong password');
        console.log('   3. User does not exist');
        console.log('\n💡 Solution:');
        console.log('   - Go to Supabase Dashboard → Authentication → Users');
        console.log(`   - Search for: ${email}`);
        console.log('   - Check "Email Confirmed" column');
        console.log('   - If not confirmed, click "..." → Confirm email');
      }

      return false;
    }

    console.log('✅ Login successful!');
    console.log('📧 Email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    console.log('✔️  Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('👤 Name:', data.user?.user_metadata?.name || 'Not set');
    console.log('🎭 Role:', data.user?.user_metadata?.role || 'Not set');

    // Sign out
    await supabase.auth.signOut();
    return true;

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🔐 Sentreso Finance - Login Test');
  console.log('═'.repeat(60));

  // Test accounts
  const accounts = [
    { email: 'babou@badousarl.org', password: 'testpass123' },
    { email: 'kaneaziz@gmail.com', password: 'testpass123' },
  ];

  console.log('\n⚠️  Note: Replace passwords with actual passwords used');
  console.log('     (This script uses placeholder passwords)\n');

  for (const account of accounts) {
    await testLogin(account.email, account.password);
  }

  console.log('\n═'.repeat(60));
  console.log('📝 Summary:');
  console.log('   If login fails with "Invalid login credentials":');
  console.log('   → Check Supabase Dashboard for email confirmation status');
  console.log('   → Users created via Dashboard may need manual confirmation');
  console.log('\n🔧 Quick Fix:');
  console.log('   1. Open: https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge/auth/users');
  console.log('   2. Find the user by email');
  console.log('   3. Click "..." menu → "Confirm email"');
  console.log('   4. Try logging in again\n');
}

main();
