#!/usr/bin/env node
/**
 * Reset password for specific user: taphals@yahoo.fr
 * User ID: 179765ea-b422-411e-8b08-12b29f4c6ff7
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd0e.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPasswordForUser() {
  const email = 'taphals@yahoo.fr';

  console.log('🔄 Password Reset for User');
  console.log('═'.repeat(50));
  console.log(`📧 Email: ${email}`);
  console.log('─'.repeat(50));

  try {
    console.log('\n📤 Sending password reset email...');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://sentreso.com/reset-password', // Update with your app's reset URL
    });

    if (error) {
      console.log('❌ Error sending reset email:', error.message);

      if (error.message.includes('User not found')) {
        console.log('\n📋 User not found. This means:');
        console.log('   - Email address is incorrect');
        console.log('   - User was deleted from Supabase');
        console.log('   - User was never created');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('\n📋 Email not confirmed. Solution:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Users');
        console.log('   2. Find the user by email');
        console.log('   3. Click "..." menu → "Confirm email"');
        console.log('   4. Then try password reset again');
      }

      return false;
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('\n📋 Instructions for user:');
    console.log('   1. Check email inbox (and spam folder)');
    console.log('   2. Click the reset link in the email');
    console.log('   3. Set a new password');
    console.log('   4. Try logging in with the new password');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  const success = await resetPasswordForUser();

  console.log('\n═'.repeat(50));
  if (success) {
    console.log('✅ Password reset initiated successfully!');
    console.log('📧 User should receive an email shortly.');
  } else {
    console.log('❌ Password reset failed.');
    console.log('🔧 Manual steps needed:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge/auth/users');
    console.log('   2. Search for: taphals@yahoo.fr');
    console.log('   3. Check user status and email confirmation');
    console.log('   4. Manually confirm email if needed');
    console.log('   5. Or create a new account for the user');
  }
}

main();


