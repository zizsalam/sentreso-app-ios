# 📧 Metrics Email Reports Guide

Send automated or manual metrics reports via email.

## 🚀 Quick Start (Manual - No Deployment Needed)

The easiest way to send metrics reports is using the manual script:

```bash
node scripts/email-metrics-manual.js recipient@example.com
```

**Example:**
```bash
node scripts/email-metrics-manual.js kaneaziz@gmail.com
```

This will:
1. Fetch all current metrics from Supabase
2. Format a beautiful text report
3. Send it via Mailgun to the specified email
4. Show a preview in your terminal

## 📊 What's Included in the Report

The email report contains:

### 📊 Today's Performance
- Merchants onboarded
- Merchants activated
- Total transactions
- Active merchants
- Merchants onboarded by officers

### 📅 Last 7 Days Summary
Daily breakdown of all key metrics

### 📈 Weekly Summary
Last 4 weeks performance

### 🎯 Targets vs Actuals
Comparison against your goals:
- 4 officers
- 5 onboardings per officer per day
- 3 activations per officer per day

Shows status: ✅ On Track, ⚠️ Below Target, or ❌ Off Track

### 👥 Officer Performance (if tracked)
Individual officer metrics:
- Total onboarded
- Total activated
- Today's numbers
- This week's numbers

## 🔧 Setup

### Prerequisites

Make sure you have `node-fetch` installed:

```bash
npm install node-fetch
```

### Configuration

The script uses these settings (edit `scripts/email-metrics-manual.js` if needed):

```javascript
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sentreso.com';
const FROM_EMAIL = process.env.SUPPORT_FROM || 'support@sentreso.com';
```

## 📅 Automated Daily/Weekly Reports (Advanced)

For automated reports, you can:

### Option 1: Cron Job (Local/Server)

Create a cron job to run daily at 8 AM:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 8 AM)
0 8 * * * cd /path/to/sentreso-app && node scripts/email-metrics-manual.js kaneaziz@gmail.com
```

### Option 2: Supabase Edge Function (Cloud)

Deploy the Edge Function for cloud-based automation:

```bash
# Deploy the function
supabase functions deploy send-metrics-report

# Set environment variables in Supabase Dashboard
# Settings → Edge Functions → Secrets:
# - MAILGUN_API_KEY
# - MAILGUN_DOMAIN
# - MAILGUN_BASE
# - SUPPORT_FROM

# Test it
node scripts/send-metrics-email.js kaneaziz@gmail.com daily
```

Then set up a scheduled trigger in Supabase:

1. Go to Database → Functions
2. Create a new SQL function:

```sql
create or replace function trigger_daily_metrics_email()
returns void
language plpgsql
as $$
begin
  perform
    net.http_post(
      url := 'https://avltdtbgantbxbrqdxge.supabase.co/functions/v1/send-metrics-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object(
        'recipient_email', 'kaneaziz@gmail.com',
        'report_type', 'daily'
      )
    );
end;
$$;
```

3. Create a pg_cron job:

```sql
select cron.schedule(
  'daily-metrics-report',
  '0 8 * * *', -- Every day at 8 AM
  'select trigger_daily_metrics_email();'
);
```

### Option 3: GitHub Actions (CI/CD)

Create `.github/workflows/daily-metrics.yml`:

```yaml
name: Daily Metrics Report

on:
  schedule:
    - cron: '0 8 * * *'  # Every day at 8 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - run: node scripts/email-metrics-manual.js abdoul@sentreso.com
        env:
          RECIPIENT_EMAIL: abdoul@sentreso.com
```

## 📧 Multiple Recipients

To send to multiple people, create a wrapper script:

```bash
#!/bin/bash
# send-to-team.sh

node scripts/email-metrics-manual.js kaneaziz@gmail.com
node scripts/email-metrics-manual.js abdoul@sentreso.com
node scripts/email-metrics-manual.js team@sentreso.com
```

Make it executable:
```bash
chmod +x send-to-team.sh
./send-to-team.sh
```

## 🎨 Customizing the Report

Edit `scripts/email-metrics-manual.js` to customize:

### Change Targets

```javascript
const { data: targetsData } = await supabase
  .rpc('get_targets_vs_actuals', {
    target_officers: 6,              // Change number of officers
    target_onboarded_per_officer_day: 10,  // Change daily target
    target_activated_per_officer_day: 5    // Change activation target
  });
```

### Change Time Periods

```javascript
// Show last 14 days instead of 7
const { data: last14Days } = await supabase
  .from('metrics_daily_summary')
  .select('*')
  .order('date', { ascending: false })
  .limit(14);  // Changed from 7
```

### Add Custom Sections

Add your own queries and formatting:

```javascript
// Add retention metrics
const { data: retentionData } = await supabase
  .from('metrics_retention_cohorts')
  .select('*')
  .order('cohort_date', { ascending: false })
  .limit(7);

// Format and add to report
report += '\n🔄 RÉTENTION (7 JOURS)\n';
report += '─'.repeat(70) + '\n';
// ... your formatting
```

## 🔐 Security Notes

- **Never commit Mailgun or other API keys to Git**
- Always use environment variables, for example:

```javascript
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
```

Then run:

```bash
MAILGUN_API_KEY=your-key MAILGUN_DOMAIN=sentreso.com SUPPORT_FROM=support@sentreso.com node scripts/email-metrics-manual.js recipient@example.com
```

## 🐛 Troubleshooting

### "Invalid API key" error
- Check that your Supabase anon key is correct in the script
- Verify the key hasn't expired

### "Mailgun error"
- Verify your Mailgun API key is correct
- Check that the domain is verified in Mailgun
- Ensure DNS records are properly configured

### No data in report
- Run `node scripts/test-pilot-metrics.js` to verify metrics are working
- Check that users have transactions in the database
- Verify the migration ran successfully

### Email not received
- Check spam folder
- Verify recipient email is correct
- Check Mailgun logs in dashboard

## 📞 Support

Questions? Check:
- `docs/PILOT_METRICS_GUIDE.md` - Full metrics documentation
- `supabase/migrations/20251012_pilot_metrics.sql` - Database schema
- Supabase Dashboard → Logs for errors

## 🎉 Example Output

```
══════════════════════════════════════════════════════════════════════
  SENTRESO - RAPPORT QUOTIDIEN DES MÉTRIQUES
  samedi 12 octobre 2025
══════════════════════════════════════════════════════════════════════

📊 PERFORMANCE DU JOUR
──────────────────────────────────────────────────────────────────────
Date: 2025-10-12
  • Marchands intégrés:        0
  • Marchands activés:         0
  • Transactions totales:      0
  • Marchands actifs:          0
  • Intégrés par agents:       0

📅 DERNIERS 7 JOURS
──────────────────────────────────────────────────────────────────────
Date       │ Intégrés │ Activés │ Transactions │ Actifs
───────────┼──────────┼─────────┼──────────────┼────────
2025-10-12 │        0 │       0 │            0 │      0
2025-10-11 │        0 │       0 │            0 │      0
...

🎯 OBJECTIFS vs RÉALISATIONS
──────────────────────────────────────────────────────────────────────
Configuration: 4 agents, 5 intégrations/jour, 3 activations/jour

Métrique              │ Période     │ Objectif │ Réel │ Écart │ Statut
──────────────────────┼─────────────┼──────────┼──────┼───────┼────────────────
Merchants Onboarded   │ Today       │       20 │    0 │   -20 │ ❌ Off Track
Merchants Activated   │ Today       │       12 │    0 │   -12 │ ❌ Off Track
...
```
