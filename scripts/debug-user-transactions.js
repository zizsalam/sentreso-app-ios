#!/usr/bin/env node
/**
 * Debug script for specific user transaction loading
 * Usage: node scripts/debug-user-transactions.js <user_id>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugUserTransactions(userId) {
  console.log(`🔍 Debugging transactions for user: ${userId}\n`);

  try {
    // Test 1: Direct query to transactions table
    console.log('📊 Test 1: Direct query to transactions table');
    const { data: directData, error: directError } = await supabase
      .from('transactions')
      .select('id, user_id, amount, type, category, description, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (directError) {
      console.log('❌ Direct query error:', directError);
    } else {
      console.log(`✅ Direct query found ${directData.length} transactions`);
      directData.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.type} - ${tx.amount} FCFA - ${tx.description} (${tx.created_at})`);
      });
    }

    // Test 2: Check transactions_active view
    console.log('\n📊 Test 2: transactions_active view');
    const { data: activeData, error: activeError } = await supabase
      .from('transactions_active')
      .select('id, user_id, amount, type, category, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activeError) {
      console.log('❌ Active view error:', activeError);
    } else {
      console.log(`✅ Active view found ${activeData.length} transactions`);
      activeData.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.type} - ${tx.amount} FCFA - ${tx.description} (${tx.created_at})`);
      });
    }

    // Test 3: Check legacy schema
    console.log('\n📊 Test 3: Legacy schema check');
    const { data: legacyData, error: legacyError } = await supabase
      .from('transactions')
      .select('id, user_id, kind, amount_cfa, category, source, occurred_at, created_at')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });

    if (legacyError) {
      console.log('❌ Legacy query error:', legacyError);
    } else {
      console.log(`✅ Legacy query found ${legacyData.length} transactions`);
      legacyData.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.kind} - ${tx.amount_cfa} FCFA - ${tx.source} (${tx.occurred_at || tx.created_at})`);
      });
    }

    // Test 4: Check user authentication
    console.log('\n📊 Test 4: User authentication check');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('❌ User auth error:', userError);
    } else {
      console.log('✅ Current user:', userData.user?.id);
      console.log('   Email:', userData.user?.email);
      console.log('   Matches target user:', userData.user?.id === userId);
    }

    // Test 5: Simulate fetchMyTransactions logic
    console.log('\n📊 Test 5: Simulating fetchMyTransactions logic');
    const { data: currentUserData } = await supabase.auth.getUser();
    const currentUser = currentUserData?.user ?? null;

    console.log('Current user from auth:', currentUser?.id);
    console.log('Target user ID:', userId);
    console.log('User match:', currentUser?.id === userId);

    if (!currentUser) {
      console.log('❌ No current user - this would cause fetchMyTransactions to fail');
    } else if (currentUser.id !== userId) {
      console.log('❌ User mismatch - fetchMyTransactions would query wrong user');
    } else {
      console.log('✅ User matches - fetchMyTransactions should work');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node scripts/debug-user-transactions.js <user_id>');
  console.log('Example: node scripts/debug-user-transactions.js e816ded7-cef4-46a7-9a02-a720d9d4e0ca');
  process.exit(1);
}

debugUserTransactions(userId);
