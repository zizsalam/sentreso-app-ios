#!/usr/bin/env node
/**
 * Create test data for the problematic user
 * Usage: node scripts/create-test-data.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestData() {
  console.log('🧪 Creating test data for user e816ded7-cef4-46a7-9a02-a720d9d4e0ca...\n');

  const userId = 'e816ded7-cef4-46a7-9a02-a720d9d4e0ca';

  try {
    // Try to create test transactions
    console.log('📊 Creating test transactions...');

    const testTransactions = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: userId,
        amount: 1000,
        type: 'income',
        description: 'Test Income 1',
        category: 'salary',
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: userId,
        amount: 500,
        type: 'expense',
        description: 'Test Expense 1',
        category: 'food',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        user_id: userId,
        amount: 2000,
        type: 'income',
        description: 'Test Income 2',
        category: 'business',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        user_id: userId,
        amount: 300,
        type: 'expense',
        description: 'Test Expense 2',
        category: 'transport',
        created_at: new Date(Date.now() - 259200000).toISOString()
      }
    ];

    for (const txn of testTransactions) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([txn]);

        if (error) {
          console.log(`❌ Failed to insert ${txn.id}:`, error.message);
        } else {
          console.log(`✅ Created transaction ${txn.id}: ${txn.type} ${txn.amount} FCFA`);
        }
      } catch (e) {
        console.log(`❌ Error inserting ${txn.id}:`, e.message);
      }
    }

    // Verify the data was created
    console.log('\n📊 Verifying created data...');
    const { data: transactions, error: verifyError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log(`✅ Found ${transactions.length} transactions for user ${userId}`);
      transactions.forEach((txn, i) => {
        console.log(`   ${i + 1}. ${txn.type} - ${txn.amount} FCFA - ${txn.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createTestData();
