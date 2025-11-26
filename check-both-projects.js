#!/usr/bin/env node
/**
 * Check both Supabase projects to see which one has data
 */

import { createClient } from '@supabase/supabase-js';

const PROJECT1_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const PROJECT1_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const PROJECT2_URL = 'https://pvteukbvatoxxalxwgcf.supabase.co';
// We need the anon key for project 2 - let me try to find it or use a placeholder

async function checkProject(projectName, url, key) {
  console.log(`\n🔍 Checking ${projectName}:`);
  console.log(`   URL: ${url}`);

  try {
    const supabase = createClient(url, key);

    // Check transactions
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, occurred_at, kind, amount_cfa')
      .limit(3);

    if (txnError) {
      console.log(`   ❌ Transactions: ${txnError.message}`);
    } else {
      console.log(`   ✅ Transactions: ${transactions?.length || 0} records`);
      if (transactions && transactions.length > 0) {
        console.log(`      Latest: ${transactions[0].occurred_at} | ${transactions[0].kind} | ${transactions[0].amount_cfa} CFA`);
      }
    }

    // Check profiles
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('user_id, display_name, created_at')
      .limit(3);

    if (profError) {
      console.log(`   ❌ Profiles: ${profError.message}`);
    } else {
      console.log(`   ✅ Profiles: ${profiles?.length || 0} records`);
      if (profiles && profiles.length > 0) {
        console.log(`      Latest: ${profiles[0].display_name} | ${profiles[0].created_at}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Connection error: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Checking Both Supabase Projects');
  console.log('═'.repeat(60));

  await checkProject('Project 1 (avltdtbgantbxbrqdxge)', PROJECT1_URL, PROJECT1_KEY);

  // For project 2, we need the correct anon key
  console.log('\n📋 Project 2 (pvteukbvatoxxalxwgcf) - Need correct anon key');
  console.log('   This project is mentioned in AUTH_README.md');
  console.log('   Please provide the anon key for this project to check it');

  console.log('\n═'.repeat(60));
  console.log('💡 Next steps:');
  console.log('   1. Check which project has the actual data');
  console.log('   2. Update metrics scripts to use the correct project');
  console.log('   3. Or provide the anon key for project 2 to verify');
}

main();
