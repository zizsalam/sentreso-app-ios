#!/usr/bin/env node
/**
 * Manual script to send metrics report via email
 * Usage: node scripts/send-metrics-email.js recipient@example.com [daily|weekly|full]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function sendMetricsReport() {
  const recipientEmail = process.argv[2];
  const reportType = process.argv[3] || 'daily';

  if (!recipientEmail) {
    console.error('❌ Usage: node scripts/send-metrics-email.js recipient@example.com [daily|weekly|full]');
    process.exit(1);
  }

  console.log(`📧 Sending ${reportType} metrics report to ${recipientEmail}...`);

  try {
    const { data, error } = await supabase.functions.invoke('send-metrics-report', {
      body: {
        recipient_email: recipientEmail,
        report_type: reportType,
        target_officers: 4,
        target_onboarded_per_day: 5,
        target_activated_per_day: 3
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    console.log('✅ Success:', data);
  } catch (err) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }
}

sendMetricsReport();
