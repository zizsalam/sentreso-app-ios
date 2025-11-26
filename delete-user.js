#!/usr/bin/env node
/**
 * Delete user and ask them to sign up again
 * User: taphals@yahoo.fr
 * User ID: 179765ea-b422-411e-8b08-12b29f4c6ff7
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd0e.x_tYhcxmxENG_7qAimEWh7oi5nQSnrd2fwyW1b4oqc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteUserAccount() {
  const email = 'taphals@yahoo.fr';
  const userId = '179765ea-b422-411e-8b08-12b29f4c6ff7';

  console.log('🗑️  Delete User Account');
  console.log('═'.repeat(50));
  console.log(`📧 Email: ${email}`);
  console.log(`🆔 User ID: ${userId}`);
  console.log('─'.repeat(50));

  console.log('\n⚠️  WARNING: This will permanently delete the user account!');
  console.log('📋 This action will:');
  console.log('   - Remove user from Supabase Auth');
  console.log('   - Delete user data from database tables');
  console.log('   - User will need to sign up again');

  console.log('\n🔧 Manual Steps Required:');
  console.log('   1. Go to Supabase Dashboard → Authentication → Users');
  console.log(`   2. Search for: ${email}`);
  console.log('   3. Click on the user');
  console.log('   4. Click "Delete user" button');
  console.log('   5. Confirm deletion');

  console.log('\n📋 Additional cleanup (if needed):');
  console.log('   - Check customers table for records created by this user');
  console.log('   - Check transactions table for user-related data');
  console.log('   - Remove any profile data if exists');

  console.log('\n✅ After deletion, tell the user:');
  console.log('   "Your account has been reset. Please sign up again');
  console.log('    using the same email address to create a new account."');

  console.log('\n🔗 Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge/auth/users');
}

async function checkUserData() {
  const userId = '179765ea-b422-411e-8b08-12b29f4c6ff7';

  console.log('\n🔍 Checking user data before deletion...');
  console.log('─'.repeat(50));

  try {
    // Check if user has created any customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email, created_at')
      .eq('created_by', userId);

    if (customersError) {
      console.log('❌ Error checking customers:', customersError.message);
    } else {
      console.log(`📊 Customers created by user: ${customers?.length || 0}`);
      if (customers && customers.length > 0) {
        console.log('   Customer records found:');
        customers.forEach(customer => {
          console.log(`   - ${customer.name} (${customer.email})`);
        });
      }
    }

    // Check transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, created_at')
      .eq('user_id', userId);

    if (transactionsError) {
      console.log('❌ Error checking transactions:', transactionsError.message);
    } else {
      console.log(`💰 Transactions for user: ${transactions?.length || 0}`);
      if (transactions && transactions.length > 0) {
        console.log('   Transaction records found:');
        transactions.forEach(txn => {
          console.log(`   - ${txn.amount} (${txn.created_at})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Error checking user data:', error.message);
  }
}

async function main() {
  await checkUserData();
  await deleteUserAccount();

  console.log('\n═'.repeat(50));
  console.log('📝 Summary:');
  console.log('   1. Manually delete user from Supabase Dashboard');
  console.log('   2. Clean up any related data if needed');
  console.log('   3. Tell user to sign up again');
  console.log('   4. User will have a fresh account');
}

main();


