#!/usr/bin/env node
import 'dotenv/config';
/**
 * Quick manual script to email metrics report
 * No Edge Function deployment needed - runs directly
 * Usage: node scripts/email-metrics-manual.js recipient@example.com
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Use the correct project from Supabase dashboard with service role key to bypass RLS
const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2MjkyNSwiZXhwIjoyMDY2NDM4OTI1fQ.uTWh8tp56TrZToKbcbuHdisxFxI38PKWvmZQ5WTw_Tk';

// Mailgun config via env vars
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sentreso.com';
const MAILGUN_BASE = process.env.MAILGUN_BASE || 'https://api.eu.mailgun.net/v3';
const FROM_EMAIL = process.env.SENDER_FROM || `no-reply@${MAILGUN_DOMAIN}`;
const REPLY_TO = process.env.SUPPORT_FROM || 'support@sentreso.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function fetchMetrics() {
  console.log('📊 Fetching metrics...\n');

  // Get all transactions from last 14 days and group them manually
  // This matches your working SQL query structure
  const { data: allTransactions, error: txnError } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  if (txnError) {
    console.log('❌ Transaction query error:', txnError.message);
    return { dailyData: [], todayData: null, activeUsers: [], recentUsers: [] };
  }


  // Group transactions by day (matching your SQL query logic)
  const dailyData = {};
  if (allTransactions) {
    allTransactions.forEach(txn => {
      // Convert to Dakar timezone (UTC+0, same as your query)
      const day = new Date(txn.occurred_at).toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { dakar_day: day, txns_count: 0, net_amount: 0 };
      }
      dailyData[day].txns_count++;
      // Calculate net amount like your SQL: CASE WHEN kind='sale' THEN amount_cfa ELSE -amount_cfa END
      const amount = txn.kind === 'sale' ? (txn.amount_cfa || 0) : -(txn.amount_cfa || 0);
      dailyData[day].net_amount += amount;
    });
  }

  // Convert to array and sort by date
  const dailyArray = Object.values(dailyData).sort((a, b) => new Date(a.dakar_day) - new Date(b.dakar_day));

  // Get today's data specifically
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyArray.find(day => day.dakar_day === today);

  // Active users: users who have both logged in AND made transactions in last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Get users with transactions in last 14 days
  const { data: usersWithTransactions } = await supabase
    .from('transactions')
    .select('user_id')
    .gte('occurred_at', fourteenDaysAgo);

  // Get unique user IDs who made transactions
  const activeUserIds = [...new Set(usersWithTransactions?.map(t => t.user_id) || [])];

  // Get profile details for these active users
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select(`
      user_id,
      display_name,
      phone,
      market,
      locale,
      leaderboard_opt_in,
      created_at
    `)
    .in('user_id', activeUserIds)
    .not('user_id', 'is', null);

  // Recent user registrations (last 7 days) - using auth.users for accurate signup tracking
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  // Filter auth users created in last 7 days
  const recentUsers = authUsers?.users?.filter(user =>
    new Date(user.created_at) >= new Date(sevenDaysAgo)
  ).map(user => ({
    user_id: user.id,
    display_name: user.email, // Use email as display name since profiles might not exist
    created_at: user.created_at
  })) || [];

  return { dailyData: dailyArray, todayData, activeUsers, recentUsers, activeUserIds };
}

function formatReport(metrics) {
  const { dailyData, todayData, activeUsers, recentUsers, activeUserIds } = metrics;

  let report = '';

  // Get Senegal timezone date
  const senegalDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Dakar'
  });

  // Header
  report += '═'.repeat(80) + '\n';
  report += '  SENTRESO - RAPPORT QUOTIDIEN DES MÉTRIQUES\n';
  report += `  ${senegalDate}\n`;
  report += '═'.repeat(80) + '\n\n';

  // Today's Performance
  report += '📊 PERFORMANCE DU JOUR\n';
  report += '─'.repeat(80) + '\n';
  const todayTxnCount = todayData?.txns_count || 0;
  const todaySales = todayData?.sales || 0;
  const todayNetAmount = todayData?.net_amount || 0;
  const newUsersToday = recentUsers?.filter(u =>
    new Date(u.created_at).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).length || 0;

  report += `Date: ${new Date().toISOString().split('T')[0]}\n`;
  report += `  • Transactions totales:      ${todayTxnCount}\n`;
  report += `  • Ventes:                    ${todaySales}\n`;
  report += `  • Montant net (CFA):         ${todayNetAmount.toLocaleString()}\n`;
  report += `  • Nouveaux utilisateurs:     ${newUsersToday}\n\n`;

  // Last 14 Days
  report += '📅 DERNIERS 14 JOURS\n';
  report += '─'.repeat(80) + '\n';
  if (dailyData && dailyData.length > 0) {
    const totalTransactions14d = dailyData.reduce((sum, day) => sum + day.txns_count, 0);
    const totalSales14d = dailyData.reduce((sum, day) => sum + (day.sales || 0), 0);
    const totalNetAmount14d = dailyData.reduce((sum, day) => sum + (day.net_amount || 0), 0);

    report += `  • Total transactions:        ${totalTransactions14d}\n`;
    report += `  • Total ventes:              ${totalSales14d}\n`;
    report += `  • Montant net total (CFA):   ${totalNetAmount14d.toLocaleString()}\n`;
    report += `  • Moyenne quotidienne:       ${(totalTransactions14d / dailyData.length).toFixed(1)} transactions/jour\n\n`;
  } else {
    report += 'Aucune transaction dans les 14 derniers jours.\n\n';
  }

  // User Statistics
  report += '👥 STATISTIQUES UTILISATEURS\n';
  report += '─'.repeat(80) + '\n';
  const totalActiveUsers = activeUsers?.length || 0;
  const newUsers7d = recentUsers?.length || 0;
  const totalTransactions14d = dailyData?.reduce((sum, day) => sum + day.txns_count, 0) || 0;

  // Calculate unique users from transactions (fallback if profiles are missing)
  const uniqueUsersFromTransactions = activeUserIds?.length || 0;

  report += `  • Utilisateurs actifs (14j):  ${totalActiveUsers > 0 ? totalActiveUsers : uniqueUsersFromTransactions} (${totalActiveUsers > 0 ? 'profiles + transactions' : 'transactions uniquement'})\n`;
  report += `  • Nouveaux utilisateurs (7j): ${newUsers7d} (inscriptions récentes)\n`;
  report += `  • Total transactions (14j):   ${totalTransactions14d}\n`;


  report += '\n';

  report += '═'.repeat(80) + '\n';
  report += 'Généré automatiquement par Sentreso Metrics\n';

  return report;
}

async function sendEmail(recipient, subject, body) {
  console.log(`📧 Sending email to ${recipient}...\n`);

  if (!MAILGUN_API_KEY) {
    throw new Error('Missing MAILGUN_API_KEY env var. Set it before running this script.');
  }

  const formData = new URLSearchParams();
  formData.append('from', `Sentreso Metrics <${FROM_EMAIL}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('text', body);
  formData.append('h:Reply-To', REPLY_TO);

  const response = await fetch(
    `${MAILGUN_BASE}/${MAILGUN_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun error: ${errorText}`);
  }

  const result = await response.json();
  return result;
}

async function main() {
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('❌ Usage: node scripts/email-metrics-manual.js recipient@example.com');
    console.error('   Example: node scripts/email-metrics-manual.js kaneaziz@gmail.com');
    process.exit(1);
  }

  try {
    // Fetch metrics
    const metrics = await fetchMetrics();

    // Format report
    const report = formatReport(metrics);

    // Print to console
    console.log('📄 REPORT PREVIEW:\n');
    console.log(report);
    console.log('\n');

    // Send email
    const subject = `📊 Sentreso - Rapport Quotidien des Métriques - ${new Date().toLocaleDateString('fr-FR')}`;
    const result = await sendEmail(recipientEmail, subject, report);

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.id);
    console.log('   Recipient:', recipientEmail);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
