#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Testing Android Transaction Loading with Current Build...\n');

const supabase = createClient('https://avltdtbgantbxbrqdxge.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc');

// Test users with known transactions
const testUsers = [
  { user_id: 'e816ded7-cef4-46a7-9a02-a720d9d4e0ca', email: 'diattalambert@gmail.com', expected: 10 },
  { user_id: 'a7e0f80e-30ff-45d0-a6e0-c478b276f224', email: 'nenekhadidiatoukane@gmail.com', expected: 58 },
  { user_id: '36f50fbe-c6e7-4035-88c0-95198eaeb64f', email: 'modibo.kone93@gmail.com', expected: 14 }
];

async function testUserTransactions(user) {
  console.log(`📱 Testing user: ${user.email}`);
  console.log(`   User ID: ${user.user_id}`);
  console.log(`   Expected transactions: ${user.expected}`);

  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Found: ${transactions.length} transactions`);

    if (transactions.length === user.expected) {
      console.log(`   ✅ CORRECT: Expected ${user.expected}, got ${transactions.length}`);
    } else {
      console.log(`   ⚠️  MISMATCH: Expected ${user.expected}, got ${transactions.length}`);
    }

    if (transactions.length > 0) {
      console.log(`   📋 Latest transactions:`);
      transactions.slice(0, 3).forEach((txn, i) => {
        console.log(`      ${i + 1}. ${txn.type.toUpperCase()} - ${txn.amount} FCFA - ${txn.description}`);
      });
    }

    return transactions.length === user.expected;
  } catch (e) {
    console.log(`   ❌ Exception: ${e.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🎯 Testing Database Access for Android Build...\n');

  let successCount = 0;
  let totalTests = testUsers.length;

  for (const user of testUsers) {
    const success = await testUserTransactions(user);
    if (success) successCount++;
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results:');
  console.log(`   ✅ Successful: ${successCount}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - successCount}/${totalTests}`);

  if (successCount === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   ✅ Database is working correctly');
    console.log('   ✅ RLS is properly disabled');
    console.log('   ✅ All users can access their transactions');
    console.log('\n💡 The issue is likely in the Android app:');
    console.log('   1. AsyncStorage not working on Android');
    console.log('   2. Network requests failing on Android');
    console.log('   3. Session not persisting on Android');
    console.log('   4. Cache system not working on Android');
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('   There may be database or RLS issues');
  }

  console.log('\n🔧 Android Debugging Steps:');
  console.log('   1. Open Android app and check console logs');
  console.log('   2. Look for "Android:" prefixed messages');
  console.log('   3. Test with user: diattalambert@gmail.com');
  console.log('   4. Check if AsyncStorage is working');
  console.log('   5. Verify network connectivity');
  console.log('   6. Check if session is maintained');
}

runTests().catch(console.error);
