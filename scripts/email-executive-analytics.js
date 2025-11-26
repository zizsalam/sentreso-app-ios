#!/usr/bin/env node
import 'dotenv/config';
/**
 * Executive-focused analytics email with 3 key tables
 * Usage: node scripts/email-executive-analytics.js recipient@example.com
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

async function fetchExecutiveAnalytics() {
  console.log('📊 Fetching executive analytics...\n');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all users - paginate through all pages to get total count
  let allAuthUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 1000 // Max per page
    });

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      break;
    }

    if (data && data.users && data.users.length > 0) {
      allAuthUsers = [...allAuthUsers, ...data.users];
      // If we got less than 1000, we've reached the end
      hasMore = data.users.length === 1000;
      page++;
    } else {
      hasMore = false;
    }
  }

  const totalUsersCount = allAuthUsers.length;
  console.log(`📊 Total users found: ${totalUsersCount}`);

  const authUsers = { users: allAuthUsers };

  // Filter for recent users (last 30 days)
  const recentUsers = authUsers?.users?.filter(user =>
    new Date(user.created_at) >= thirtyDaysAgo
  ) || [];

  const newUsers7d = recentUsers.filter(user =>
    new Date(user.created_at) >= sevenDaysAgo
  ).length;

  const newUsers30d = recentUsers.length;

  // Get transactions from last 30 days
  const { data: allTransactions, error: txnError } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_at', thirtyDaysAgo.toISOString());

  if (txnError) {
    console.log('❌ Transaction query error:', txnError.message);
    return null;
  }

  const totalTransactions = allTransactions?.length || 0;
  const txns7d = allTransactions?.filter(t =>
    new Date(t.occurred_at) >= sevenDaysAgo
  ).length || 0;

  const avgTransactionsPerUser = newUsers30d > 0 ? totalTransactions / newUsers30d : 0;
  const txnsPerNewUser7d = newUsers7d > 0 ? txns7d / newUsers7d : 0;

  const executiveSummary = {
    totalUsers: totalUsersCount,
    newUsers7d,
    newUsers30d,
    totalTransactions,
    txns7d,
    txns30d: totalTransactions,
    avgTransactionsPerUser,
    txnsPerNewUser7d
  };

  // 1. Registration Cohort Retention Report
  const userCohorts = {};
  const userActivity = {};

  // Process each user for cohort analysis
  recentUsers.forEach(user => {
    const registrationDate = new Date(user.created_at).toISOString().split('T')[0];

    if (!userCohorts[registrationDate]) {
      userCohorts[registrationDate] = {
        registration_date: registrationDate,
        registered_users: 0,
        users_with_transactions: 0,
        total_transactions: 0,
        active_days: 0,
        active_last_7d: 0,
        active_last_14d: 0
      };
    }

    userCohorts[registrationDate].registered_users++;

    // Get user's transactions
    const userTransactions = allTransactions?.filter(t => t.user_id === user.id) || [];

    if (userTransactions.length > 0) {
      userCohorts[registrationDate].users_with_transactions++;
      userCohorts[registrationDate].total_transactions += userTransactions.length;

      // Calculate active days
      const activeDays = new Set(userTransactions.map(t =>
        new Date(t.occurred_at).toISOString().split('T')[0]
      )).size;
      userCohorts[registrationDate].active_days += activeDays;

      // Check recent activity
      const lastTransaction = userTransactions
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))[0];

      if (lastTransaction) {
        const daysSinceLastTransaction = Math.floor(
          (Date.now() - new Date(lastTransaction.occurred_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastTransaction <= 7) {
          userCohorts[registrationDate].active_last_7d++;
        }
        if (daysSinceLastTransaction <= 14) {
          userCohorts[registrationDate].active_last_14d++;
        }
      }
    }
  });

  // Calculate retention metrics for cohort analysis
  const cohortRetentionReport = Object.values(userCohorts).map(cohort => ({
    registration_date: cohort.registration_date,
    registered_users: cohort.registered_users,
    users_with_transactions: cohort.users_with_transactions,
    activation_rate_percent: cohort.registered_users > 0 ?
      Math.round((cohort.users_with_transactions / cohort.registered_users) * 100 * 100) / 100 : 0,
    avg_transactions_per_user: cohort.users_with_transactions > 0 ?
      Math.round((cohort.total_transactions / cohort.users_with_transactions) * 100) / 100 : 0,
    avg_active_days: cohort.users_with_transactions > 0 ?
      Math.round((cohort.active_days / cohort.users_with_transactions) * 100) / 100 : 0,
    active_last_7d: cohort.active_last_7d,
    active_last_14d: cohort.active_last_14d,
    retention_7d_percent: cohort.registered_users > 0 ?
      Math.round((cohort.active_last_7d / cohort.registered_users) * 100 * 100) / 100 : 0,
    retention_14d_percent: cohort.registered_users > 0 ?
      Math.round((cohort.active_last_14d / cohort.registered_users) * 100 * 100) / 100 : 0
  })).sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));

  return {
    executiveSummary,
    cohortRetentionReport
  };
}

function generateExecutiveHTMLReport(analytics) {
  const { executiveSummary, cohortRetentionReport } = analytics;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Sentreso Executive Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1f2937;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .executive-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .metric-card h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-card .value {
            font-size: 28px;
            font-weight: 700;
            color: #10B981;
            margin: 0;
        }
        .metric-card .subtitle {
            font-size: 12px;
            color: #9ca3af;
            margin: 4px 0 0 0;
        }
        .section {
            padding: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .section h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .table-container {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .table-container h3 {
            margin: 0 0 15px 0;
            color: #1f2937;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            font-size: 14px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        .positive { color: #10B981; font-weight: 600; }
        .negative { color: #ef4444; font-weight: 600; }
        .neutral { color: #6b7280; }
        .footer {
            background: #f3f4f6;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .insight-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .insight-box h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
        }
        .insight-box p {
            margin: 0;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Sentreso Executive Dashboard</h1>
            <p>Executive Report - ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}</p>
        </div>

        <div class="executive-summary">
            <div class="metric-card">
                <h3>Total Users</h3>
                <p class="value">${executiveSummary.totalUsers.toLocaleString()}</p>
                <p class="subtitle">Last 30 days</p>
            </div>
            <div class="metric-card">
                <h3>New Users (7d)</h3>
                <p class="value">${executiveSummary.newUsers7d.toLocaleString()}</p>
                <p class="subtitle">This week</p>
            </div>
            <div class="metric-card">
                <h3>Transactions</h3>
                <p class="value">${executiveSummary.totalTransactions.toLocaleString()}</p>
                <p class="subtitle">Last 30 days</p>
            </div>
            <div class="metric-card">
                <h3>Txns/User</h3>
                <p class="value">${executiveSummary.avgTransactionsPerUser.toFixed(1)}</p>
                <p class="subtitle">Average per user</p>
            </div>
        </div>

        <div class="insight-box">
            <h3>💡 Executive Insights</h3>
            <p>
                ${executiveSummary.newUsers7d > 0 ?
                  `• ${executiveSummary.newUsers7d} new users this week (${(executiveSummary.newUsers7d/7).toFixed(1)}/day)<br>` :
                  '• No new users this week<br>'
                }
                ${executiveSummary.totalTransactions > 0 ?
                  `• ${executiveSummary.totalTransactions} total transactions (${(executiveSummary.totalTransactions/30).toFixed(1)}/day)<br>` :
                  '• No transactions in 30 days<br>'
                }
                ${executiveSummary.avgTransactionsPerUser > 0 ?
                  `• ${executiveSummary.avgTransactionsPerUser.toFixed(1)} transactions per user` :
                  '• No transactions per user'
                }
            </p>
        </div>

        <div class="table-container">
            <h3>📊 Registration Cohort Retention Report</h3>
            <table>
                <thead>
                    <tr>
                        <th>Registration Date</th>
                        <th>Users</th>
                        <th>With Transactions</th>
                        <th>Activation</th>
                        <th>Txns/User</th>
                        <th>Active Days</th>
                        <th>Active 7d</th>
                        <th>Active 14d</th>
                        <th>Retention 7d</th>
                        <th>Retention 14d</th>
                    </tr>
                </thead>
                <tbody>
                    ${cohortRetentionReport.map(cohort => `
                        <tr>
                            <td><strong>${new Date(cohort.registration_date).toLocaleDateString('en-US')}</strong></td>
                            <td>${cohort.registered_users}</td>
                            <td>${cohort.users_with_transactions}</td>
                            <td class="${cohort.activation_rate_percent >= 50 ? 'positive' : cohort.activation_rate_percent >= 25 ? 'neutral' : 'negative'}">${cohort.activation_rate_percent}%</td>
                            <td>${cohort.avg_transactions_per_user}</td>
                            <td>${cohort.avg_active_days}</td>
                            <td>${cohort.active_last_7d}</td>
                            <td>${cohort.active_last_14d}</td>
                            <td class="${cohort.retention_7d_percent >= 50 ? 'positive' : cohort.retention_7d_percent >= 25 ? 'neutral' : 'negative'}">${cohort.retention_7d_percent}%</td>
                            <td class="${cohort.retention_14d_percent >= 50 ? 'positive' : cohort.retention_14d_percent >= 25 ? 'neutral' : 'negative'}">${cohort.retention_14d_percent}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>📊 Executive report automatically generated by Sentreso Analytics</p>
            <p>Data updated on ${new Date().toLocaleString('en-US')}</p>
        </div>
    </div>

</body>
</html>`;
}

async function sendEmail(recipient, subject, htmlBody) {
  console.log(`📧 Sending executive email to ${recipient}...\n`);

  if (!MAILGUN_API_KEY) {
    throw new Error('Missing MAILGUN_API_KEY env var. Set it before running this script.');
  }

  const formData = new URLSearchParams();
  formData.append('from', `Sentreso Executive <${FROM_EMAIL}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('html', htmlBody);
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
    console.error('❌ Usage: node scripts/email-executive-analytics.js recipient@example.com');
    console.error('   Example: node scripts/email-executive-analytics.js kaneaziz@gmail.com');
    process.exit(1);
  }

  try {
    // Fetch analytics
    console.log('📊 Fetching executive analytics data...');
    const analytics = await fetchExecutiveAnalytics();

    if (!analytics) {
      throw new Error('Failed to fetch analytics data');
    }

    console.log('✅ Executive analytics data fetched successfully');
    console.log(`   • Total users: ${analytics.executiveSummary.totalUsers}`);
    console.log(`   • New users (7d): ${analytics.executiveSummary.newUsers7d}`);
    console.log(`   • Total transactions: ${analytics.executiveSummary.totalTransactions}`);
    console.log(`   • Avg transactions/user: ${analytics.executiveSummary.avgTransactionsPerUser.toFixed(1)}`);

    // Generate HTML report
    console.log('🎨 Generating executive HTML report with tables...');
    const htmlReport = generateExecutiveHTMLReport(analytics);

    // Send email
    const subject = `📊 Sentreso Executive Dashboard - ${new Date().toLocaleDateString('en-US')}`;
    const result = await sendEmail(recipientEmail, subject, htmlReport);

    console.log('✅ Executive email sent successfully!');
    console.log('   Message ID:', result.id);
    console.log('   Recipient:', recipientEmail);
    console.log('   📊 Executive report with cohort retention analysis');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
