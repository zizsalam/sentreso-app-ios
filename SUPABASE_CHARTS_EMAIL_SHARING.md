# 📧 Sharing Supabase Charts via Email

## 🎯 **Option 1: Export Data + Create Charts in Email (RECOMMENDED)**

### **Step 1: Export Query Results**
```sql
-- Export your analytics data to CSV
COPY (
  WITH daily_registrations AS (
    SELECT
      DATE(timezone('Africa/Dakar', u.created_at)) AS registration_date,
      COUNT(*) AS new_users
    FROM auth.users u
    WHERE u.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(timezone('Africa/Dakar', u.created_at))
  )
  SELECT
    registration_date,
    new_users,
    SUM(new_users) OVER (ORDER BY registration_date) AS total_users
  FROM daily_registrations
  ORDER BY registration_date
) TO '/tmp/daily_users.csv' WITH CSV HEADER;
```

### **Step 2: Create Email-Ready Charts**
Use the exported data to create charts in:
- **Google Sheets** → Insert Chart → Share via email
- **Excel** → Create charts → Export as images
- **Canva** → Upload data → Create professional charts
- **Chart.js/Google Charts** → Generate HTML charts for email

---

## 🎯 **Option 2: Automated Email Reports (BEST FOR REGULAR UPDATES)**

### **Create a Supabase Edge Function for Email Reports**

```typescript
// supabase/functions/send-analytics-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get analytics data
    const { data: userData, error: userError } = await supabaseClient
      .from('auth.users')
      .select(`
        id,
        created_at,
        profiles!inner(display_name, market, phone)
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { data: transactionData, error: transactionError } = await supabaseClient
      .from('transactions')
      .select('*')
      .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (userError || transactionError) {
      throw new Error('Failed to fetch data')
    }

    // Generate HTML report
    const htmlReport = generateHTMLReport(userData, transactionData)

    // Send email
    await sendEmail({
      to: 'your-email@example.com',
      subject: '📊 Sentreso Field Analytics Report - Daily',
      html: htmlReport
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Report sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function generateHTMLReport(users: any[], transactions: any[]) {
  // Calculate metrics
  const totalUsers = users.length
  const newUsers7d = users.filter(u =>
    new Date(u.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length

  const totalTransactions = transactions.length
  const totalRevenue = transactions
    .filter(t => t.kind === 'sale')
    .reduce((sum, t) => sum + (t.amount_cfa || 0), 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #10B981; color: white; padding: 20px; border-radius: 8px; }
        .metric { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .metric h3 { margin: 0; color: #1f2937; }
        .metric .value { font-size: 24px; font-weight: bold; color: #10B981; }
        .chart-placeholder { background: #e5e7eb; padding: 40px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Sentreso Field Analytics Report</h1>
        <p>Daily Report - ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="metric">
        <h3>Total Users</h3>
        <div class="value">${totalUsers}</div>
      </div>

      <div class="metric">
        <h3>New Users (7 days)</h3>
        <div class="value">${newUsers7d}</div>
      </div>

      <div class="metric">
        <h3>Total Transactions</h3>
        <div class="value">${totalTransactions}</div>
      </div>

      <div class="metric">
        <h3>Total Revenue (FCFA)</h3>
        <div class="value">${totalRevenue.toLocaleString()}</div>
      </div>

      <div class="chart-placeholder">
        📈 Chart: User Growth Over Time
        <br><small>Export data to create visual charts</small>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Export detailed data from Supabase dashboard</li>
        <li>Create charts in Google Sheets or Excel</li>
        <li>Attach charts to this email</li>
      </ul>
    </body>
    </html>
  `
}

async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  // Use your preferred email service (SendGrid, Mailgun, etc.)
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'reports@sentreso.com' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  })

  if (!response.ok) {
    throw new Error('Failed to send email')
  }
}
```

### **Deploy and Schedule the Function**
```bash
# Deploy the function
supabase functions deploy send-analytics-report

# Schedule daily reports (using cron or external scheduler)
# Call: https://your-project.supabase.co/functions/v1/send-analytics-report
```

---

## 🎯 **Option 3: Supabase Dashboard Screenshots (QUICK & EASY)**

### **Automated Screenshot Service**
```typescript
// Use Puppeteer or Playwright to automate screenshots
import puppeteer from 'puppeteer'

async function captureSupabaseCharts() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Login to Supabase (you'll need to handle auth)
  await page.goto('https://supabase.com/dashboard/project/your-project')

  // Navigate to your charts
  await page.goto('https://supabase.com/dashboard/project/your-project/analytics')

  // Take screenshots of specific charts
  await page.screenshot({ path: 'user-growth-chart.png', fullPage: true })
  await page.screenshot({ path: 'transaction-volume.png', fullPage: true })

  await browser.close()
}

// Send screenshots via email
async function sendChartsEmail() {
  const screenshots = ['user-growth-chart.png', 'transaction-volume.png']

  // Use your email service to send with attachments
  await sendEmailWithAttachments({
    to: 'your-email@example.com',
    subject: '📊 Daily Sentreso Analytics',
    body: 'Please find attached the daily analytics charts.',
    attachments: screenshots
  })
}
```

---

## 🎯 **Option 4: Third-Party Analytics Tools**

### **Connect Supabase to Analytics Platforms**

**1. PostHog Integration**
```typescript
// Send Supabase data to PostHog for better charting
import { PostHog } from 'posthog-node'

const posthog = new PostHog('your-api-key')

// Send user events
posthog.capture({
  distinctId: userId,
  event: 'user_registered',
  properties: {
    market: userMarket,
    registration_date: registrationDate
  }
})

// PostHog will generate charts and can send email reports
```

**2. Google Analytics 4**
```typescript
// Send custom events to GA4
gtag('event', 'user_registration', {
  'custom_parameter_1': market,
  'custom_parameter_2': registrationDate
})

// GA4 can send automated email reports
```

**3. Metabase (Self-hosted)**
```sql
-- Connect Metabase to your Supabase database
-- Create dashboards with your queries
-- Set up email subscriptions for regular reports
```

---

## 🎯 **Option 5: Simple Email Template with Data**

### **Create a Basic HTML Email Template**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .report { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .metric { background: #f8fafc; padding: 15px; margin: 10px 0; border-left: 4px solid #10B981; }
    .chart { background: #e5e7eb; padding: 20px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <h1>📊 Sentreso Field Analytics</h1>
      <p>Daily Report - ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="metric">
      <h3>👥 Total Users: ${totalUsers}</h3>
      <p>New users this week: ${newUsers7d}</p>
    </div>

    <div class="metric">
      <h3>💰 Total Revenue: ${totalRevenue.toLocaleString()} FCFA</h3>
      <p>From ${totalTransactions} transactions</p>
    </div>

    <div class="chart">
      <h3>📈 User Growth Trend</h3>
      <p>Export data from Supabase to create charts</p>
      <p><a href="https://supabase.com/dashboard">View Full Dashboard</a></p>
    </div>

    <p><strong>Key Insights:</strong></p>
    <ul>
      <li>User growth rate: ${growthRate}%</li>
      <li>Average revenue per user: ${avgRevenuePerUser} FCFA</li>
      <li>Most active market: ${topMarket}</li>
    </ul>
  </div>
</body>
</html>
```

---

## 🚀 **Recommended Approach**

### **For Quick Results:**
1. **Export data** from Supabase using the queries I provided
2. **Create charts** in Google Sheets or Excel
3. **Screenshot or export** charts as images
4. **Send via email** with the images attached

### **For Automated Reports:**
1. **Set up Supabase Edge Function** (Option 2)
2. **Schedule daily/weekly reports**
3. **Include both data and basic charts** in HTML email

### **For Professional Dashboards:**
1. **Connect to Metabase** or similar BI tool
2. **Create interactive dashboards**
3. **Set up email subscriptions**

---

## 📋 **Quick Implementation Steps**

### **Immediate (5 minutes):**
```sql
-- Run this in Supabase SQL Editor
COPY (
  SELECT
    DATE(timezone('Africa/Dakar', u.created_at)) AS date,
    COUNT(*) AS new_users
  FROM auth.users u
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(timezone('Africa/Dakar', u.created_at))
  ORDER BY date
) TO '/tmp/user_growth.csv' WITH CSV HEADER;
```

### **Then:**
1. Download the CSV file
2. Import into Google Sheets
3. Create a line chart
4. Share the chart via email

**This gives you professional charts in your email within minutes!** 📊📧

---

**© 2025 Sentreso Technologies**
*Data-driven insights delivered to your inbox* 📈✉️
