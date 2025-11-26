#!/usr/bin/env node
/**
 * Debug script to check what's actually in the transactions table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function debugTransactions() {
  console.log('🔍 Debugging Transactions Data');
  console.log('═'.repeat(50));

  const today = new Date().toISOString().split('T')[0];
  console.log(`📅 Today's date: ${today}`);
  console.log(`🕐 Current time: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));

  try {
    // 1. Check total transactions count
    console.log('\n1️⃣ Total transactions in database:');
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('id, occurred_at, kind, amount_cfa, user_id')
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.log('❌ Error:', allError.message);
    } else {
      console.log(`📊 Found ${allTransactions?.length || 0} recent transactions:`);
      allTransactions?.forEach((txn, i) => {
        console.log(`   ${i+1}. ${txn.occurred_at} | ${txn.kind} | ${txn.amount_cfa} CFA | User: ${txn.user_id}`);
      });
    }

    // 2. Check today's transactions with different date formats
    console.log('\n2️⃣ Today\'s transactions (different approaches):');

    // Approach 1: Simple date string
    const { data: today1, error: today1Error } = await supabase
      .from('transactions')
      .select('*')
      .gte('occurred_at', `${today}T00:00:00`)
      .lt('occurred_at', `${today}T23:59:59`);

    console.log(`   Method 1 (${today}T00:00:00 to ${today}T23:59:59): ${today1?.length || 0} transactions`);
    if (today1Error) console.log('   Error:', today1Error.message);

    // Approach 2: Date range
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');
    const { data: today2, error: today2Error } = await supabase
      .from('transactions')
      .select('*')
      .gte('occurred_at', startOfDay.toISOString())
      .lte('occurred_at', endOfDay.toISOString());

    console.log(`   Method 2 (Date objects): ${today2?.length || 0} transactions`);
    if (today2Error) console.log('   Error:', today2Error.message);

    // Approach 3: Just date (no time)
    const { data: today3, error: today3Error } = await supabase
      .from('transactions')
      .select('*')
      .like('occurred_at', `${today}%`);

    console.log(`   Method 3 (LIKE ${today}%): ${today3?.length || 0} transactions`);
    if (today3Error) console.log('   Error:', today3Error.message);

    // 3. Check last 14 days
    console.log('\n3️⃣ Last 14 days transactions:');
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const { data: last14, error: last14Error } = await supabase
      .from('transactions')
      .select('*')
      .gte('occurred_at', fourteenDaysAgo.toISOString())
      .order('occurred_at', { ascending: false });

    console.log(`   Found ${last14?.length || 0} transactions in last 14 days`);
    if (last14Error) {
      console.log('   Error:', last14Error.message);
    } else if (last14 && last14.length > 0) {
      console.log('   Recent transactions:');
      last14.slice(0, 5).forEach((txn, i) => {
        console.log(`     ${i+1}. ${txn.occurred_at} | ${txn.kind} | ${txn.amount_cfa} CFA`);
      });
    }

    // 4. Check if there are any transactions at all
    console.log('\n4️⃣ Any transactions in database?');
    const { data: anyTxn, error: anyError } = await supabase
      .from('transactions')
      .select('id, occurred_at')
      .limit(1);

    if (anyError) {
      console.log('   ❌ Error accessing transactions table:', anyError.message);
    } else if (anyTxn && anyTxn.length > 0) {
      console.log(`   ✅ Yes, found transactions. Latest: ${anyTxn[0].occurred_at}`);
    } else {
      console.log('   ❌ No transactions found in database');
    }

    // 5. Check table structure
    console.log('\n5️⃣ Checking table access:');
    const { data: tableCheck, error: tableError } = await supabase
      .from('transactions')
      .select('*')
      .limit(0);

    if (tableError) {
      console.log('   ❌ Cannot access transactions table:', tableError.message);
    } else {
      console.log('   ✅ Can access transactions table');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  await debugTransactions();

  console.log('\n═'.repeat(50));
  console.log('💡 Next steps:');
  console.log('   1. Check if transactions table exists and has data');
  console.log('   2. Verify date format in database');
  console.log('   3. Check timezone handling');
  console.log('   4. Fix the metrics script based on findings');
}

main();
