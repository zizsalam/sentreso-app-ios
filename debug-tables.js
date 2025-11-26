#!/usr/bin/env node
/**
 * Debug script to check what tables exist and have data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function debugTables() {
  console.log('🔍 Debugging Database Tables');
  console.log('═'.repeat(50));

  // List of tables to check
  const tablesToCheck = [
    'transactions',
    'transaction',
    'txn',
    'ledger',
    'payments',
    'sales',
    'profiles',
    'users',
    'customers',
    'merchants'
  ];

  console.log('\n📊 Checking tables for data:');

  for (const tableName of tablesToCheck) {
    try {
      // Try to get count and sample data
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: ${count || 0} records`);
        if (data && data.length > 0) {
          console.log(`      Sample: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`);
        }
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ${err.message}`);
    }
  }

  // Check if we can see the schema
  console.log('\n🔍 Checking schema information:');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log('   ❌ Cannot access schema info:', error.message);
    } else {
      console.log('   📋 Available tables:');
      data?.forEach(table => {
        console.log(`      - ${table.table_name}`);
      });
    }
  } catch (err) {
    console.log('   ❌ Schema check failed:', err.message);
  }

  // Check profiles table specifically (we know this should exist)
  console.log('\n👥 Checking profiles table:');
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('   ❌ Profiles error:', profilesError.message);
    } else {
      console.log(`   ✅ Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('   Sample profile:');
        console.log(`      User ID: ${profiles[0].user_id}`);
        console.log(`      Display Name: ${profiles[0].display_name}`);
        console.log(`      Created: ${profiles[0].created_at}`);
      }
    }
  } catch (err) {
    console.log('   ❌ Profiles check failed:', err.message);
  }
}

async function main() {
  await debugTables();

  console.log('\n═'.repeat(50));
  console.log('💡 Analysis:');
  console.log('   - If transactions table is empty, check if data is in another table');
  console.log('   - Verify the correct table name for transaction data');
  console.log('   - Check if data exists in a different schema or database');
}

main();
