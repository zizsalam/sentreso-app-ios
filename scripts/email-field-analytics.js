#!/usr/bin/env node
import 'dotenv/config';
/**
 * Enhanced field analytics email script with HTML charts
 * Usage: node scripts/email-field-analytics.js recipient@example.com
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

async function fetchFieldAnalytics() {
  console.log('📊 Fetching field analytics...\n');

  // 1. Daily User Onboarding Data
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const dailyRegistrations = {};
  const recentUsers = authUsers?.users?.filter(user =>
    new Date(user.created_at) >= thirtyDaysAgo
  ) || [];

  recentUsers.forEach(user => {
    const day = new Date(user.created_at).toISOString().split('T')[0];
    dailyRegistrations[day] = (dailyRegistrations[day] || 0) + 1;
  });

  // 2. Transaction Data
  const { data: allTransactions, error: txnError } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (txnError) {
    console.log('❌ Transaction query error:', txnError.message);
    return null;
  }

  // Group transactions by day
  const dailyTransactions = {};
  const userActivity = {};

  if (allTransactions) {
    allTransactions.forEach(txn => {
      const day = new Date(txn.occurred_at).toISOString().split('T')[0];

      // Daily transactions
      if (!dailyTransactions[day]) {
        dailyTransactions[day] = {
          date: day,
          total_transactions: 0,
          sales_count: 0,
          expense_count: 0,
          daily_revenue: 0,
          daily_expenses: 0,
          active_users: new Set()
        };
      }

      dailyTransactions[day].total_transactions++;
      dailyTransactions[day].active_users.add(txn.user_id);

      if (txn.kind === 'sale') {
        dailyTransactions[day].sales_count++;
        dailyTransactions[day].daily_revenue += txn.amount_cfa || 0;
      } else {
        dailyTransactions[day].expense_count++;
        dailyTransactions[day].daily_expenses += txn.amount_cfa || 0;
      }

      // User activity
      if (!userActivity[txn.user_id]) {
        userActivity[txn.user_id] = {
          user_id: txn.user_id,
          total_transactions: 0,
          total_revenue: 0,
          total_expenses: 0,
          active_days: new Set()
        };
      }

      userActivity[txn.user_id].total_transactions++;
      userActivity[txn.user_id].active_days.add(day);

      if (txn.kind === 'sale') {
        userActivity[txn.user_id].total_revenue += txn.amount_cfa || 0;
      } else {
        userActivity[txn.user_id].total_expenses += txn.amount_cfa || 0;
      }
    });
  }

  // Convert sets to counts
  Object.values(dailyTransactions).forEach(day => {
    day.active_users = day.active_users.size;
  });

  Object.values(userActivity).forEach(user => {
    user.active_days = user.active_days.size;
    user.net_profit = user.total_revenue - user.total_expenses;
  });

  // 3. Market Performance
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, market, display_name, phone');

  const marketPerformance = {};
  Object.values(userActivity).forEach(user => {
    const profile = profiles?.find(p => p.user_id === user.user_id);
    const market = profile?.market || 'Unknown';

    if (!marketPerformance[market]) {
      marketPerformance[market] = {
        market,
        total_users: 0,
        total_transactions: 0,
        total_revenue: 0,
        total_expenses: 0
      };
    }

    marketPerformance[market].total_users++;
    marketPerformance[market].total_transactions += user.total_transactions;
    marketPerformance[market].total_revenue += user.total_revenue;
    marketPerformance[market].total_expenses += user.total_expenses;
  });

  // Calculate net profit for markets
  Object.values(marketPerformance).forEach(market => {
    market.net_profit = market.total_revenue - market.total_expenses;
    market.revenue_per_user = market.total_users > 0 ? market.total_revenue / market.total_users : 0;
    market.transactions_per_user = market.total_users > 0 ? market.total_transactions / market.total_users : 0;
  });

  return {
    dailyRegistrations: Object.entries(dailyRegistrations).map(([date, count]) => ({ date, count })),
    dailyTransactions: Object.values(dailyTransactions).sort((a, b) => new Date(a.date) - new Date(b.date)),
    userActivity: Object.values(userActivity),
    marketPerformance: Object.values(marketPerformance).sort((a, b) => b.total_users - a.total_users),
    totalUsers: recentUsers.length,
    totalTransactions: allTransactions?.length || 0,
    totalRevenue: allTransactions?.filter(t => t.kind === 'sale').reduce((sum, t) => sum + (t.amount_cfa || 0), 0) || 0,
    totalExpenses: allTransactions?.filter(t => t.kind === 'expense').reduce((sum, t) => sum + (t.amount_cfa || 0), 0) || 0
  };
}

function generateHTMLReport(analytics) {
  const {
    dailyRegistrations,
    dailyTransactions,
    userActivity,
    marketPerformance,
    totalUsers,
    totalTransactions,
    totalRevenue,
    totalExpenses
  } = analytics;

  const netProfit = totalRevenue - totalExpenses;
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
  const avgTransactionsPerUser = totalUsers > 0 ? totalTransactions / totalUsers : 0;

  // Generate chart data for user growth
  const userGrowthData = dailyRegistrations.map(d => d.count);
  const userGrowthLabels = dailyRegistrations.map(d => new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }));

  // Generate chart data for daily transactions
  const transactionData = dailyTransactions.map(d => d.total_transactions);
  const revenueData = dailyTransactions.map(d => d.daily_revenue);
  const transactionLabels = dailyTransactions.map(d => new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }));

  // Generate chart data for market performance
  const marketLabels = marketPerformance.map(m => m.market);
  const marketUserData = marketPerformance.map(m => m.total_users);
  const marketRevenueData = marketPerformance.map(m => m.total_revenue);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Sentreso Field Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1f2937;
        }
        .container {
            max-width: 1200px;
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
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        .metric-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10B981;
        }
        .metric-card h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #10B981;
            margin: 0;
        }
        .metric-card .subtitle {
            font-size: 12px;
            color: #9ca3af;
            margin: 4px 0 0 0;
        }
        .chart-section {
            padding: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .chart-section h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #1f2937;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin-bottom: 30px;
        }
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
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
        .positive { color: #10B981; }
        .negative { color: #ef4444; }
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
            <h1>📊 Sentreso Field Analytics</h1>
            <p>Rapport d'analyse terrain - ${new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Utilisateurs Totaux</h3>
                <p class="value">${totalUsers.toLocaleString()}</p>
                <p class="subtitle">30 derniers jours</p>
            </div>
            <div class="metric-card">
                <h3>Transactions Totales</h3>
                <p class="value">${totalTransactions.toLocaleString()}</p>
                <p class="subtitle">30 derniers jours</p>
            </div>
            <div class="metric-card">
                <h3>Revenus Totaux</h3>
                <p class="value">${totalRevenue.toLocaleString()} FCFA</p>
                <p class="subtitle">Ventes uniquement</p>
            </div>
            <div class="metric-card">
                <h3>Bénéfice Net</h3>
                <p class="value ${netProfit >= 0 ? 'positive' : 'negative'}">${netProfit.toLocaleString()} FCFA</p>
                <p class="subtitle">Revenus - Dépenses</p>
            </div>
            <div class="metric-card">
                <h3>Revenu/Utilisateur</h3>
                <p class="value">${Math.round(avgRevenuePerUser).toLocaleString()} FCFA</p>
                <p class="subtitle">Moyenne par utilisateur</p>
            </div>
            <div class="metric-card">
                <h3>Transactions/Utilisateur</h3>
                <p class="value">${avgTransactionsPerUser.toFixed(1)}</p>
                <p class="subtitle">Moyenne par utilisateur</p>
            </div>
        </div>

        <div class="insight-box">
            <h3>💡 Insights Clés</h3>
            <p>
                ${totalUsers > 0 ?
                  `• ${totalUsers} nouveaux utilisateurs en 30 jours (${(totalUsers/30).toFixed(1)}/jour)<br>` :
                  '• Aucun nouvel utilisateur en 30 jours<br>'
                }
                ${totalTransactions > 0 ?
                  `• ${totalTransactions} transactions totales (${(totalTransactions/30).toFixed(1)}/jour)<br>` :
                  '• Aucune transaction en 30 jours<br>'
                }
                ${marketPerformance.length > 0 ?
                  `• ${marketPerformance.length} marchés actifs<br>` :
                  '• Aucun marché actif<br>'
                }
                ${netProfit > 0 ?
                  `• Bénéfice net positif de ${netProfit.toLocaleString()} FCFA` :
                  '• Bénéfice net négatif - focus sur les revenus'
                }
            </p>
        </div>

        <div class="chart-section">
            <h2>📈 Croissance des Utilisateurs</h2>
            <div class="chart-container">
                <canvas id="userGrowthChart"></canvas>
            </div>
        </div>

        <div class="chart-section">
            <h2>💰 Volume des Transactions</h2>
            <div class="chart-container">
                <canvas id="transactionChart"></canvas>
            </div>
        </div>

        <div class="chart-section">
            <h2>🏪 Performance par Marché</h2>
            <div class="chart-container">
                <canvas id="marketChart"></canvas>
            </div>
        </div>

        <div class="table-container">
            <h3>📊 Détails par Marché</h3>
            <table>
                <thead>
                    <tr>
                        <th>Marché</th>
                        <th>Utilisateurs</th>
                        <th>Transactions</th>
                        <th>Revenus (FCFA)</th>
                        <th>Dépenses (FCFA)</th>
                        <th>Bénéfice Net</th>
                        <th>Revenu/User</th>
                    </tr>
                </thead>
                <tbody>
                    ${marketPerformance.map(market => `
                        <tr>
                            <td><strong>${market.market}</strong></td>
                            <td>${market.total_users}</td>
                            <td>${market.total_transactions}</td>
                            <td class="positive">${market.total_revenue.toLocaleString()}</td>
                            <td class="negative">${market.total_expenses.toLocaleString()}</td>
                            <td class="${market.net_profit >= 0 ? 'positive' : 'negative'}">${market.net_profit.toLocaleString()}</td>
                            <td>${Math.round(market.revenue_per_user).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>📊 Rapport généré automatiquement par Sentreso Field Analytics</p>
            <p>Données mises à jour le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
    </div>

    <script>
        // User Growth Chart
        const userGrowthCtx = document.getElementById('userGrowthChart').getContext('2d');
        new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(userGrowthLabels)},
                datasets: [{
                    label: 'Nouveaux Utilisateurs',
                    data: ${JSON.stringify(userGrowthData)},
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Transaction Volume Chart
        const transactionCtx = document.getElementById('transactionChart').getContext('2d');
        new Chart(transactionCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(transactionLabels)},
                datasets: [{
                    label: 'Transactions',
                    data: ${JSON.stringify(transactionData)},
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10B981',
                    borderWidth: 1
                }, {
                    label: 'Revenus (FCFA)',
                    data: ${JSON.stringify(revenueData)},
                    type: 'line',
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

        // Market Performance Chart
        const marketCtx = document.getElementById('marketChart').getContext('2d');
        new Chart(marketCtx, {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(marketLabels)},
                datasets: [{
                    data: ${JSON.stringify(marketUserData)},
                    backgroundColor: [
                        '#10B981',
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#06b6d4',
                        '#84cc16',
                        '#f97316'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

async function sendEmail(recipient, subject, htmlBody) {
  console.log(`📧 Sending HTML email to ${recipient}...\n`);

  if (!MAILGUN_API_KEY) {
    throw new Error('Missing MAILGUN_API_KEY env var. Set it before running this script.');
  }

  const formData = new URLSearchParams();
  formData.append('from', `Sentreso Analytics <${FROM_EMAIL}>`);
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
    console.error('❌ Usage: node scripts/email-field-analytics.js recipient@example.com');
    console.error('   Example: node scripts/email-field-analytics.js kaneaziz@gmail.com');
    process.exit(1);
  }

  try {
    // Fetch analytics
    console.log('📊 Fetching field analytics data...');
    const analytics = await fetchFieldAnalytics();

    if (!analytics) {
      throw new Error('Failed to fetch analytics data');
    }

    console.log('✅ Analytics data fetched successfully');
    console.log(`   • Total users: ${analytics.totalUsers}`);
    console.log(`   • Total transactions: ${analytics.totalTransactions}`);
    console.log(`   • Total revenue: ${analytics.totalRevenue.toLocaleString()} FCFA`);
    console.log(`   • Markets: ${analytics.marketPerformance.length}`);

    // Generate HTML report
    console.log('🎨 Generating HTML report with charts...');
    const htmlReport = generateHTMLReport(analytics);

    // Send email
    const subject = `📊 Sentreso Field Analytics - ${new Date().toLocaleDateString('fr-FR')}`;
    const result = await sendEmail(recipientEmail, subject, htmlReport);

    console.log('✅ HTML email sent successfully!');
    console.log('   Message ID:', result.id);
    console.log('   Recipient:', recipientEmail);
    console.log('   📈 Email includes interactive charts and detailed analytics');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
