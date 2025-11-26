#!/usr/bin/env node
/**
 * Check for real data in the correct project with proper permissions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function checkRealData() {
  console.log('🔍 Checking for Real Data in Sentreso Project');
  console.log('═'.repeat(60));
  console.log(`📊 Project: ${SUPABASE_URL}`);
  console.log(`🆔 Project ID: avltdtbgantbxbrqdxge`);
  console.log('─'.repeat(60));

  try {
    // 1. Check all possible transaction-related tables
    console.log('\n1️⃣ Checking transaction tables:');
    const transactionTables = ['transactions', 'transaction', 'txn', 'ledger', 'payments', 'sales'];

    for (const table of transactionTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(5);

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${count || 0} records`);
          if (data && data.length > 0) {
            console.log(`      Sample: ${JSON.stringify(data[0], null, 2).substring(0, 150)}...`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // 2. Check auth.users (this might have data even if profiles is empty)
    console.log('\n2️⃣ Checking auth users:');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log(`   ❌ Auth users: ${authError.message}`);
      } else {
        console.log(`   ✅ Auth users: ${authUsers?.users?.length || 0} users`);
        if (authUsers?.users && authUsers.users.length > 0) {
          console.log(`      Latest: ${authUsers.users[0].email} | ${authUsers.users[0].created_at}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Auth users: ${err.message}`);
    }

    // 3. Check if we can run your exact SQL query
    console.log('\n3️⃣ Testing your SQL query:');
    try {
      // Your query: SELECT DATE(timezone('Africa/Dakar', occurred_at)) AS dakar_day, COUNT(*) AS txns_count, SUM(CASE WHEN kind='sale' THEN amount_cfa ELSE -amount_cfa END) AS net_amount FROM public.transactions WHERE occurred_at >= timezone('Africa/Dakar', now())::date - 13 GROUP BY DATE(timezone('Africa/Dakar', occurred_at)) ORDER BY dakar_day;

      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT
              DATE(timezone('Africa/Dakar', occurred_at)) AS dakar_day,
              COUNT(*) AS txns_count,
              SUM(CASE WHEN kind='sale' THEN amount_cfa ELSE -amount_cfa END) AS net_amount
            FROM public.transactions
            WHERE occurred_at >= timezone('Africa/Dakar', now())::date - 13
            GROUP BY DATE(timezone('Africa/Dakar', occurred_at))
            ORDER BY dakar_day;
          `
        });

      if (sqlError) {
        console.log(`   ❌ SQL query failed: ${sqlError.message}`);
      } else {
        console.log(`   ✅ SQL query result: ${sqlResult?.length || 0} rows`);
        if (sqlResult && sqlResult.length > 0) {
          sqlResult.forEach(row => {
            console.log(`      ${row.dakar_day}: ${row.txns_count} txns, ${row.net_amount} CFA`);
          });
        }
      }
    } catch (err) {
      console.log(`   ❌ SQL query error: ${err.message}`);
    }

    // 4. Check if there are any tables at all
    console.log('\n4️⃣ Checking all available tables:');
    try {
      // Try to get table names from information_schema
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        console.log(`   ❌ Cannot get table list: ${tablesError.message}`);
      } else {
        console.log(`   📋 Available tables: ${tables?.length || 0}`);
        tables?.forEach(table => {
          console.log(`      - ${table.table_name}`);
        });
      }
    } catch (err) {
      console.log(`   ❌ Table list error: ${err.message}`);
    }

    // 5. Check if the project is paused or has issues
    console.log('\n5️⃣ Project status check:');
    try {
      const { data: health, error: healthError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);

      if (healthError) {
        console.log(`   ❌ Project health: ${healthError.message}`);
      } else {
        console.log(`   ✅ Project is accessible`);
      }
    } catch (err) {
      console.log(`   ❌ Project health error: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  await checkRealData();

  console.log('\n═'.repeat(60));
  console.log('💡 Analysis:');
  console.log('   - If all tables are empty, the database might be in development mode');
  console.log('   - Check if you need to run migrations or seed data');
  console.log('   - Verify you\'re looking at the right project in Supabase Dashboard');
  console.log('   - The transaction data might be in a different environment');
}

main();
