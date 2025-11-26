#!/usr/bin/env node
/**
 * Test script for Pilot Metrics
 * Demonstrates how to query the metrics views and RPCs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  'https://avltdtbgantbxbrqdxge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc'
);

const divider = () => console.log('\n' + '='.repeat(70) + '\n');

async function testMetrics() {
  console.log('🚀 Testing Sentreso Pilot Metrics\n');

  // 1. Daily Summary (last 7 days)
  divider();
  console.log('📊 DAILY SUMMARY (Last 7 Days)');
  divider();

  const { data: daily, error: dailyError } = await supabase
    .from('metrics_daily_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(7);

  if (dailyError) {
    console.error('❌ Error:', dailyError.message);
  } else {
    console.table(daily);
  }

  // 2. Weekly Summary (last 4 weeks)
  divider();
  console.log('📈 WEEKLY SUMMARY (Last 4 Weeks)');
  divider();

  const { data: weekly, error: weeklyError } = await supabase
    .from('metrics_weekly_summary')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(4);

  if (weeklyError) {
    console.error('❌ Error:', weeklyError.message);
  } else {
    console.table(weekly);
  }

  // 3. Week-over-Week Growth
  divider();
  console.log('📊 WEEK-OVER-WEEK GROWTH (Last 4 Weeks)');
  divider();

  const { data: wow, error: wowError } = await supabase
    .rpc('get_week_over_week_growth', { weeks_back: 4 });

  if (wowError) {
    console.error('❌ Error:', wowError.message);
  } else {
    console.table(wow);
  }

  // 4. Retention Cohorts
  divider();
  console.log('🔄 RETENTION COHORTS (7-Day Retention)');
  divider();

  const { data: retention, error: retentionError } = await supabase
    .from('metrics_retention_cohorts')
    .select('*')
    .order('cohort_date', { ascending: false })
    .limit(10);

  if (retentionError) {
    console.error('❌ Error:', retentionError.message);
  } else {
    console.table(retention);
  }

  // 5. Officer Performance
  divider();
  console.log('👥 OFFICER PERFORMANCE');
  divider();

  const { data: officers, error: officersError } = await supabase
    .from('metrics_officer_performance')
    .select('*')
    .order('total_onboarded', { ascending: false });

  if (officersError) {
    console.error('❌ Error:', officersError.message);
  } else {
    console.table(officers);
  }

  // 6. Targets vs Actuals
  divider();
  console.log('🎯 TARGETS vs ACTUALS');
  console.log('(4 officers, 5 onboarded/day, 3 activated/day per officer)');
  divider();

  const { data: targets, error: targetsError } = await supabase
    .rpc('get_targets_vs_actuals', {
      target_officers: 4,
      target_onboarded_per_officer_day: 5,
      target_activated_per_officer_day: 3
    });

  if (targetsError) {
    console.error('❌ Error:', targetsError.message);
  } else {
    console.table(targets);
  }

  divider();
  console.log('✅ All metrics queries completed!\n');
}

testMetrics().catch(console.error);
