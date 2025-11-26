#!/usr/bin/env node
/**
 * Create test data for metrics testing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function createTestData() {
  console.log('🔧 Creating Test Data for Metrics');
  console.log('═'.repeat(50));

  try {
    // Create a test user first
    console.log('\n1️⃣ Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@sentreso.com',
      password: 'testpass123'
    });

    if (authError) {
      console.log(`   ❌ Auth error: ${authError.message}`);
    } else {
      console.log(`   ✅ Test user created: ${authData.user?.email}`);
    }

    // Create test transactions (using legacy schema to match your queries)
    console.log('\n2️⃣ Creating test transactions...');

    const testTransactions = [
      {
        user_id: authData?.user?.id || 'test-user-id',
        kind: 'sale',
        amount_cfa: 50000,
        category: 'test',
        source: 'Test transaction 1',
        occurred_at: new Date().toISOString()
      },
      {
        user_id: authData?.user?.id || 'test-user-id',
        kind: 'sale',
        amount_cfa: 25000,
        category: 'test',
        source: 'Test transaction 2',
        occurred_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      },
      {
        user_id: authData?.user?.id || 'test-user-id',
        kind: 'expense',
        amount_cfa: 10000,
        category: 'test',
        source: 'Test expense',
        occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ];

    for (const txn of testTransactions) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([txn])
        .select();

      if (error) {
        console.log(`   ❌ Transaction error: ${error.message}`);
      } else {
        console.log(`   ✅ Transaction created: ${txn.kind} ${txn.amount_cfa} CFA`);
      }
    }

    // Create test profile
    console.log('\n3️⃣ Creating test profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: authData?.user?.id || 'test-user-id',
        display_name: 'Test User',
        phone: '+221771234567',
        market: 'Dakar',
        locale: 'fr',
        leaderboard_opt_in: true
      }])
      .select();

    if (profileError) {
      console.log(`   ❌ Profile error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profile created: ${profileData[0]?.display_name}`);
    }

    console.log('\n✅ Test data creation complete!');
    console.log('\n📊 Now you can test the metrics:');
    console.log('   node scripts/email-metrics-manual.js kaneaziz@gmail.com');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

async function main() {
  await createTestData();
}

main();
