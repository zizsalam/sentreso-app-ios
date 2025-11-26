#!/usr/bin/env node
/**
 * HTML version of metrics email with better visuals
 * Usage: node scripts/email-metrics-html.js recipient@example.com
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

// Mailgun config - use environment variables, never hard-code secrets
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sentreso.com';
const MAILGUN_BASE = process.env.MAILGUN_BASE || 'https://api.eu.mailgun.net/v3';
const FROM_EMAIL = process.env.SUPPORT_FROM || 'support@sentreso.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function fetchMetrics() {
  console.log('📊 Fetching metrics...\n');

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Today's transactions
  const { data: todayTransactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_at', `${today}T00:00:00`)
    .lt('occurred_at', `${today}T23:59:59`);

  // Last 14 days transactions
  const { data: last14Days } = await supabase
    .from('transactions')
    .select('*')
    .gte('occurred_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  // Recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('user_id, display_name, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  return { todayTransactions, last14Days, recentUsers };
}

function generateHTMLReport(metrics) {
  const { todayTransactions, last14Days, recentUsers } = metrics;

  const todayTxnCount = todayTransactions?.length || 0;
  const todaySales = todayTransactions?.filter(t => t.kind === 'sale').length || 0;
  const todayNetAmount = todayTransactions?.reduce((sum, t) =>
    sum + (t.kind === 'sale' ? t.amount_cfa : -t.amount_cfa), 0) || 0;

  // Group last 14 days by day
  const dailyData = {};
  if (last14Days) {
    last14Days.forEach(txn => {
      const day = new Date(txn.occurred_at).toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { count: 0, sales: 0, netAmount: 0 };
      }
      dailyData[day].count++;
      if (txn.kind === 'sale') dailyData[day].sales++;
      dailyData[day].netAmount += (txn.kind === 'sale' ? txn.amount_cfa : -txn.amount_cfa);
    });
  }

  const sortedDays = Object.keys(dailyData).sort().slice(-7);

  return `
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
  <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
    <h1>📊 Sentreso - Rapport Quotidien</h1>
    <p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div style="padding: 20px;">
    <h2>📈 Performance du Jour</h2>
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0;">
      <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${todayTxnCount}</div>
      <div>Transactions totales</div>
    </div>
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0;">
      <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${todaySales}</div>
      <div>Ventes</div>
    </div>
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0;">
      <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${todayNetAmount.toLocaleString()} CFA</div>
      <div>Montant net</div>
    </div>

    <h2>📅 Derniers 7 Jours</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">Date</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">Transactions</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">Ventes</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">Montant Net (CFA)</th>
      </tr>
      ${sortedDays.map(day => {
        const data = dailyData[day];
        const dayName = new Date(day).toLocaleDateString('fr-FR', { weekday: 'short' });
        return `
          <tr>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${dayName} ${day}</td>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${data.count}</td>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${data.sales}</td>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${data.netAmount.toLocaleString()}</td>
          </tr>
        `;
      }).join('')}
    </table>

    <h2>👥 Nouveaux Utilisateurs (7 derniers jours)</h2>
    <p><strong>${recentUsers?.length || 0}</strong> nouveaux utilisateurs</p>
    ${recentUsers && recentUsers.length > 0 ? `
      <ul>
        ${recentUsers.slice(0, 5).map(user => `
          <li>${user.display_name || 'Sans nom'} - ${new Date(user.created_at).toLocaleDateString('fr-FR')}</li>
        `).join('')}
      </ul>
    ` : '<p>Aucun nouvel utilisateur cette semaine.</p>'}
  </div>
</body>
</html>
  `;
}

async function sendEmail(recipient, subject, htmlBody) {
  console.log(`📧 Sending HTML email to ${recipient}...\n`);

  if (!MAILGUN_API_KEY) {
    throw new Error('Missing MAILGUN_API_KEY env var. Set it before running this script.');
  }

  // Create a simple text version as fallback
  const textBody = `
SENTRESO - RAPPORT QUOTIDIEN DES MÉTRIQUES
${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

📈 PERFORMANCE DU JOUR
Transactions totales: 0
Ventes: 0
Montant net: 0 CFA

📅 DERNIERS 7 JOURS
Aucune transaction dans les 14 derniers jours.

👥 NOUVEAUX UTILISATEURS
0 nouveaux utilisateurs

Généré automatiquement par Sentreso Metrics
  `;

  const formData = new URLSearchParams();
  formData.append('from', `Sentreso Metrics <${FROM_EMAIL}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('text', textBody);
  formData.append('html', htmlBody);

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
    console.log('❌ Full Mailgun error response:', errorText);
    throw new Error(`Mailgun error: ${errorText}`);
  }

  return await response.json();
}

async function main() {
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('❌ Usage: node scripts/email-metrics-html.js recipient@example.com');
    process.exit(1);
  }

  try {
    const metrics = await fetchMetrics();
    const htmlReport = generateHTMLReport(metrics);
    const subject = `📊 Sentreso Metrics - ${new Date().toLocaleDateString('fr-FR')}`;

    const result = await sendEmail(recipientEmail, subject, htmlReport);

    console.log('✅ HTML email sent successfully!');
    console.log('   Message ID:', result.id);
    console.log('   Recipient:', recipientEmail);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
