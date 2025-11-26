# 📊 Metrics Charts & Visualization Guide

Create beautiful charts in Supabase Dashboard to visualize your pilot metrics.

## 🎨 Available Charts

### 1. 📈 Daily Onboarding & Activation Trend (Line Chart)

**What it shows:** Daily trend of merchants onboarded and activated over time

**SQL Query:**
```sql
SELECT
  date as x_axis,
  merchants_onboarded as "Intégrés",
  merchants_activated as "Activés"
FROM metrics_daily_summary
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;
```

**Chart Configuration:**
- **Chart Type:** Line Chart
- **X Axis:** `x_axis` (date)
- **Y Axis:** `Intégrés`, `Activés`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid
  - ⬜ Cumulative (off)

**Use Case:** Track daily onboarding and activation trends

---

### 2. 📊 Weekly Performance (Bar Chart)

**What it shows:** Weekly comparison of key metrics

**SQL Query:**
```sql
SELECT
  week_start as x_axis,
  merchants_onboarded as "Intégrés",
  merchants_activated as "Activés",
  total_transactions as "Transactions"
FROM metrics_weekly_summary
WHERE week_start >= CURRENT_DATE - INTERVAL '8 weeks'
ORDER BY week_start ASC;
```

**Chart Configuration:**
- **Chart Type:** Bar Chart
- **X Axis:** `x_axis` (week_start)
- **Y Axis:** `Intégrés`, `Activés`, `Transactions`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Compare weekly performance across multiple metrics

---

### 3. 📈 Week-over-Week Growth (Line Chart with %)

**What it shows:** Growth rate percentage week-over-week

**SQL Query:**
```sql
SELECT
  week_start as x_axis,
  wow_onboarded_pct as "Croissance Intégrés (%)",
  wow_activated_pct as "Croissance Activés (%)",
  wow_transactions_pct as "Croissance Transactions (%)"
FROM get_week_over_week_growth(8)
WHERE wow_onboarded_pct IS NOT NULL
ORDER BY week_start ASC;
```

**Chart Configuration:**
- **Chart Type:** Line Chart
- **X Axis:** `x_axis` (week_start)
- **Y Axis:** All three growth columns
- **Options:**
  - ✅ Show labels
  - ✅ Show grid
  - ⬜ Cumulative (off)

**Use Case:** Visualize growth momentum and identify trends

---

### 4. 🎯 Targets vs Actuals (Bar Chart - Today)

**What it shows:** Today's performance vs targets

**SQL Query:**
```sql
SELECT
  metric as x_axis,
  target as "Objectif",
  actual as "Réel"
FROM get_targets_vs_actuals(4, 5, 3)
WHERE period = 'Today'
ORDER BY metric;
```

**Chart Configuration:**
- **Chart Type:** Bar Chart (Grouped)
- **X Axis:** `x_axis` (metric)
- **Y Axis:** `Objectif`, `Réel`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Quick visual of today's performance vs goals

---

### 5. 📊 Cumulative Onboarding (Area Chart)

**What it shows:** Total merchants onboarded over time (cumulative)

**SQL Query:**
```sql
SELECT
  date as x_axis,
  SUM(merchants_onboarded) OVER (ORDER BY date) as "Total Marchands Intégrés"
FROM metrics_daily_summary
WHERE date >= CURRENT_DATE - INTERVAL '60 days'
ORDER BY date ASC;
```

**Chart Configuration:**
- **Chart Type:** Area Chart
- **X Axis:** `x_axis` (date)
- **Y Axis:** `Total Marchands Intégrés`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid
  - ✅ Cumulative (on)

**Use Case:** Show total growth trajectory

---

### 6. 🔄 Retention Funnel (Bar Chart)

**What it shows:** 7-day retention rates by cohort

**SQL Query:**
```sql
le and straiforward
```

**Chart Configuration:**
- **Chart Type:** Bar Chart (Grouped)
- **X Axis:** `x_axis` (cohort_date)
- **Y Axis:** `Taille Cohorte`, `Retenus (7j)`
- **Secondary Y Axis:** `Taux Rétention (%)`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Track retention performance over time

---

### 7. 👥 Officer Leaderboard (Horizontal Bar Chart)

**What it shows:** Top performing officers by total onboarded

**SQL Query:**
```sql
SELECT
  officer_name as x_axis,
  total_onboarded as "Total Intégrés",
  total_activated as "Total Activés",
  activation_rate_pct as "Taux Activation (%)"
FROM metrics_officer_performance
WHERE total_onboarded > 0
ORDER BY total_onboarded DESC
LIMIT 10;
```

**Chart Configuration:**
- **Chart Type:** Horizontal Bar Chart
- **X Axis:** `x_axis` (officer_name)
- **Y Axis:** `Total Intégrés`, `Total Activés`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Compare officer performance and identify top performers

---

### 8. 📅 Activity Heatmap (Table with Color)

**What it shows:** Daily activity levels (transactions per day)

**SQL Query:**
```sql
SELECT
  TO_CHAR(date, 'Day') as "Jour",
  TO_CHAR(date, 'DD/MM') as "Date",
  total_transactions as "Transactions",
  active_merchants as "Marchands Actifs",
  CASE
    WHEN total_transactions = 0 THEN '⚪ Aucune'
    WHEN total_transactions < 5 THEN '🟡 Faible'
    WHEN total_transactions < 20 THEN '🟠 Moyenne'
    ELSE '🟢 Forte'
  END as "Activité"
FROM metrics_daily_summary
WHERE date >= CURRENT_DATE - INTERVAL '14 days'
ORDER BY date DESC;
```

**Chart Configuration:**
- **Chart Type:** Table (with color indicators)
- **Options:**
  - ✅ Show all columns

**Use Case:** Quick scan of daily activity patterns

---

### 9. 📊 Conversion Funnel (Funnel Chart)

**What it shows:** Conversion from onboarded → activated → retained

**SQL Query:**
```sql
WITH funnel AS (
  SELECT
    'Intégrés' as stage,
    1 as order_num,
    COUNT(DISTINCT user_id) as count
  FROM profiles
  WHERE onboarded_at >= CURRENT_DATE - INTERVAL '30 days'

  UNION ALL

  SELECT
    'Activés' as stage,
    2 as order_num,
    COUNT(DISTINCT user_id) as count
  FROM profiles
  WHERE activated_at >= CURRENT_DATE - INTERVAL '30 days'

  UNION ALL

  SELECT
    'Retenus (7j)' as stage,
    3 as order_num,
    SUM(retained_count) as count
  FROM metrics_retention_cohorts
  WHERE cohort_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  stage as x_axis,
  count as "Nombre"
FROM funnel
ORDER BY order_num;
```

**Chart Configuration:**
- **Chart Type:** Bar Chart (Descending)
- **X Axis:** `x_axis` (stage)
- **Y Axis:** `Nombre`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Visualize the conversion funnel and identify drop-off points

---

### 10. 📈 This Week vs Last Week (Comparison)

**What it shows:** Side-by-side comparison of this week vs last week

**SQL Query:**
```sql
WITH weeks AS (
  SELECT
    CASE
      WHEN week_start = DATE_TRUNC('week', CURRENT_DATE)::date THEN 'Cette semaine'
      WHEN week_start = (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week')::date THEN 'Semaine dernière'
    END as x_axis,
    merchants_onboarded as "Intégrés",
    merchants_activated as "Activés",
    total_transactions as "Transactions"
  FROM metrics_weekly_summary
  WHERE week_start >= (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week')::date
    AND week_start <= DATE_TRUNC('week', CURRENT_DATE)::date
)
SELECT * FROM weeks
WHERE x_axis IS NOT NULL
ORDER BY x_axis DESC;
```

**Chart Configuration:**
- **Chart Type:** Grouped Bar Chart
- **X Axis:** `x_axis`
- **Y Axis:** `Intégrés`, `Activés`, `Transactions`
- **Options:**
  - ✅ Show labels
  - ✅ Show grid

**Use Case:** Quick week-over-week comparison

---

## 🎨 How to Create Charts in Supabase

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/avltdtbgantbxbrqdxge

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Paste SQL Query**
   - Copy one of the SQL queries above
   - Paste into the editor
   - Click "Run" to test

4. **Create Chart**
   - Click "Chart" tab (next to "Results")
   - Configure:
     - **X Axis:** Select the `x_axis` column
     - **Y Axis:** Select metric columns
     - **Chart Type:** Choose appropriate type
     - **Options:** Enable labels, grid, etc.

5. **Save to Custom Reports**
   - Click "Add to custom reports"
   - Give it a name (e.g., "Daily Onboarding Trend")
   - Click "Save"

6. **View in Reports**
   - Go to "Reports" in the left sidebar
   - Your saved charts will appear there
   - You can create a dashboard with multiple charts

---

## 📊 Creating a Dashboard

### Recommended Dashboard Layout:

**Row 1: Overview (Today)**
- Chart 4: Targets vs Actuals (Today)
- Chart 8: Activity Heatmap (Last 14 days)

**Row 2: Trends**
- Chart 1: Daily Onboarding & Activation Trend (30 days)
- Chart 5: Cumulative Onboarding (60 days)

**Row 3: Weekly Performance**
- Chart 2: Weekly Performance (8 weeks)
- Chart 3: Week-over-Week Growth

**Row 4: Conversion & Retention**
- Chart 9: Conversion Funnel (30 days)
- Chart 6: Retention Funnel (30 days)

**Row 5: Team Performance**
- Chart 7: Officer Leaderboard
- Chart 10: This Week vs Last Week

---

## 🔄 Auto-Refresh

To keep charts up-to-date:

1. In Supabase Reports, click on a chart
2. Click "Edit"
3. Enable "Auto-refresh"
4. Set interval (e.g., 5 minutes)
5. Save

---

## 📱 Sharing Charts

### Option 1: Screenshot
- Take a screenshot of the chart
- Share via email/Slack

### Option 2: Export Data
- Click "Download CSV" in the chart
- Share the data file

### Option 3: Embed (Pro Plan)
- Generate embed code
- Add to internal dashboards

---

## 💡 Tips

1. **Use consistent colors** across charts for the same metrics
2. **Add annotations** for important events (e.g., "Campaign launched")
3. **Create multiple dashboards** for different audiences (exec summary, field team, etc.)
4. **Schedule reports** to be generated and emailed automatically
5. **Use filters** to focus on specific time periods or officers

---

## 🎯 Quick Wins

Start with these 3 essential charts:

1. **Daily Onboarding Trend** (Chart 1) - See daily progress
2. **Targets vs Actuals** (Chart 4) - Know if you're on track
3. **Officer Leaderboard** (Chart 7) - Motivate the team

Add more as needed!

---

## 📞 Support

Questions? Check:
- `docs/PILOT_METRICS_GUIDE.md` - Full metrics documentation
- `docs/METRICS_EMAIL_GUIDE.md` - Email reports guide
- Supabase Dashboard → SQL Editor for testing queries
