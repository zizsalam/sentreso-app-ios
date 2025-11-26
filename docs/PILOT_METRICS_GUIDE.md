# 📊 Pilot Metrics Tracking Guide

This guide shows you how to track and visualize your pilot metrics with week-over-week growth.

## 🎯 Metrics Overview

### Definitions

- **Onboarded** = App installed + identity captured (profile created)
- **Activated** = First transaction recorded
- **Retained** = Still active 7 days later

### Daily Targets (4 Officers)

| Metric | Per Officer/Day | Total/Day | Total/Week |
|--------|----------------|-----------|------------|
| New merchants onboarded | 5 | 20 | 100–120 |
| Merchants activated | 3–4 | 12–16 | 60–80 |
| Retained merchants | — | — | +60% retained |

## 📋 Available Views

### 1. `metrics_daily_summary`
Daily breakdown of onboarding, activation, and transactions.

```sql
SELECT * FROM metrics_daily_summary
ORDER BY date DESC
LIMIT 7;
```

**Columns:**
- `date` - The date
- `merchants_onboarded` - New merchants onboarded this day
- `merchants_activated` - New merchants who recorded their first transaction
- `total_transactions` - Total transactions this day
- `active_merchants` - Unique merchants who transacted this day
- `merchants_onboarded_by_officers` - Merchants onboarded by officers (excludes self-signup)

### 2. `metrics_weekly_summary`
Weekly aggregates with rolling 7-day windows.

```sql
SELECT * FROM metrics_weekly_summary
ORDER BY week_start DESC
LIMIT 8;
```

**Columns:**
- `week_start`, `week_end` - Week boundaries
- `merchants_onboarded` - New merchants this week
- `merchants_activated` - New merchants activated this week
- `total_transactions` - Total transactions this week
- `active_merchants` - Unique active merchants this week

### 3. `metrics_retention_cohorts`
7-day retention rates by cohort.

```sql
SELECT * FROM metrics_retention_cohorts
ORDER BY cohort_date DESC
LIMIT 10;
```

**Columns:**
- `cohort_date` - Date the cohort was activated
- `cohort_size` - Number of merchants activated that day
- `retained_count` - How many were still active 7 days later
- `retention_rate_pct` - % retained
- `officer_id` - Officer who onboarded them (if tracked)

### 4. `metrics_officer_performance`
Per-officer performance metrics.

```sql
SELECT * FROM metrics_officer_performance
ORDER BY total_onboarded DESC;
```

**Columns:**
- `officer_id`, `officer_email`, `officer_name` - Officer info
- `total_onboarded` - Total merchants onboarded by this officer
- `total_activated` - Total merchants activated
- `onboarded_this_week` - Merchants onboarded this week
- `activated_this_week` - Merchants activated this week
- `onboarded_today` - Merchants onboarded today
- `activated_today` - Merchants activated today
- `activation_rate_pct` - % of onboarded merchants who activated

## 🔧 Available RPCs (Functions)

### 1. `get_week_over_week_growth(weeks_back)`
Shows week-over-week growth percentages.

```sql
SELECT * FROM get_week_over_week_growth(8);
```

**Parameters:**
- `weeks_back` (int, default 8) - How many weeks to look back

**Returns:**
- `week_start`, `week_end` - Week boundaries
- `merchants_onboarded`, `merchants_activated`, `total_transactions` - Actuals
- `active_merchants` - Unique active merchants
- `wow_onboarded_pct` - % change vs previous week (onboarded)
- `wow_activated_pct` - % change vs previous week (activated)
- `wow_transactions_pct` - % change vs previous week (transactions)

### 2. `get_targets_vs_actuals(officers, onboarded_per_day, activated_per_day)`
Compares actual performance vs targets.

```sql
SELECT * FROM get_targets_vs_actuals(4, 5, 3);
```

**Parameters:**
- `target_officers` (int, default 4) - Number of officers in the field
- `target_onboarded_per_officer_day` (int, default 5) - Target onboardings per officer per day
- `target_activated_per_officer_day` (int, default 3) - Target activations per officer per day

**Returns:**
- `metric` - The metric name
- `period` - "Today" or "This Week"
- `target` - Target value
- `actual` - Actual value
- `variance` - Difference (actual - target)
- `variance_pct` - % difference
- `status` - "✅ On Track", "⚠️ Below Target", or "❌ Off Track"

## 📱 Using in Your App

### Example: Fetch Weekly Summary

```typescript
import { supabase } from '@/services/supabaseClient';

async function getWeeklySummary() {
  const { data, error } = await supabase
    .from('metrics_weekly_summary')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching weekly metrics:', error);
    return null;
  }

  return data;
}
```

### Example: Fetch Week-over-Week Growth

```typescript
async function getGrowthMetrics() {
  const { data, error } = await supabase
    .rpc('get_week_over_week_growth', { weeks_back: 8 });

  if (error) {
    console.error('Error fetching growth:', error);
    return null;
  }

  return data;
}
```

### Example: Check Targets

```typescript
async function checkTargets() {
  const { data, error } = await supabase
    .rpc('get_targets_vs_actuals', {
      target_officers: 4,
      target_onboarded_per_officer_day: 5,
      target_activated_per_officer_day: 3
    });

  if (error) {
    console.error('Error checking targets:', error);
    return null;
  }

  // Filter for today's metrics
  const today = data?.filter(d => d.period === 'Today') || [];
  const thisWeek = data?.filter(d => d.period === 'This Week') || [];

  return { today, thisWeek };
}
```

## 📈 Creating a Dashboard

### Quick Dashboard Query (SQL)

```sql
-- Today's Performance
SELECT
  'TODAY' as period,
  merchants_onboarded,
  merchants_activated,
  active_merchants,
  total_transactions
FROM metrics_daily_summary
WHERE date = CURRENT_DATE;

-- This Week's Performance
SELECT
  'THIS WEEK' as period,
  merchants_onboarded,
  merchants_activated,
  active_merchants,
  total_transactions
FROM metrics_weekly_summary
WHERE week_start = DATE_TRUNC('week', CURRENT_DATE)::date;

-- Week-over-Week Growth
SELECT * FROM get_week_over_week_growth(4);

-- Targets vs Actuals
SELECT * FROM get_targets_vs_actuals(4, 5, 3);

-- Top Officers This Week
SELECT
  officer_name,
  onboarded_this_week,
  activated_this_week,
  activation_rate_pct
FROM metrics_officer_performance
WHERE onboarded_this_week > 0
ORDER BY onboarded_this_week DESC;

-- Retention Rate (Last 4 Weeks)
SELECT
  cohort_date,
  cohort_size,
  retained_count,
  retention_rate_pct
FROM metrics_retention_cohorts
WHERE cohort_date >= CURRENT_DATE - INTERVAL '4 weeks'
ORDER BY cohort_date DESC;
```

## 🔄 Data Flow

### How Tracking Works

1. **User signs up** → `profiles.onboarded_at` is set (via trigger or manual update)
2. **User records first transaction** → `profiles.activated_at` is automatically set (via trigger)
3. **Metrics views** aggregate this data daily/weekly
4. **RPCs** compute growth rates and compare vs targets

### Setting `onboarded_by` (Officer Attribution)

When an officer onboards a merchant, set the `onboarded_by` field:

```typescript
// When officer creates merchant account
await supabase
  .from('profiles')
  .update({ onboarded_by: officerUserId })
  .eq('id', merchantUserId);
```

Or during registration:

```typescript
await supabase.auth.signUp({
  email: merchantEmail,
  password: merchantPassword,
  options: {
    data: {
      name: merchantName,
      role: 'merchant',
      onboarded_by: officerUserId, // Officer who onboarded them
    },
  },
});
```

## 🎨 Visualization Examples

### Chart 1: Weekly Onboarding & Activation Trend

```typescript
const chartData = weeklyData.map(week => ({
  week: week.week_start,
  onboarded: week.merchants_onboarded,
  activated: week.merchants_activated,
  target_onboarded: 100, // 4 officers × 5/day × 7 days
  target_activated: 60,  // 4 officers × 3/day × 7 days (conservative)
}));
```

### Chart 2: Week-over-Week Growth Bars

```typescript
const growthData = wowData.map(week => ({
  week: week.week_start,
  onboardedGrowth: week.wow_onboarded_pct,
  activatedGrowth: week.wow_activated_pct,
  transactionsGrowth: week.wow_transactions_pct,
}));
```

### Chart 3: Retention Funnel

```typescript
const retentionData = {
  onboarded: cohorts.reduce((sum, c) => sum + c.cohort_size, 0),
  retained: cohorts.reduce((sum, c) => sum + c.retained_count, 0),
  retentionRate: (cohorts.reduce((sum, c) => sum + c.retained_count, 0) /
                  cohorts.reduce((sum, c) => sum + c.cohort_size, 0) * 100).toFixed(1),
};
```

## 🚀 Installation

Run the migration:

```bash
# Via Supabase CLI
supabase db push

# Or in Supabase SQL Editor
# Copy and paste: supabase/migrations/20251012_pilot_metrics.sql
```

Test it:

```bash
node scripts/test-pilot-metrics.js
```

## 🔐 Security

- All views and RPCs are accessible to authenticated users
- RLS policies still apply to underlying tables
- Officer data only visible if `onboarded_by` is set
- No PII exposed in aggregate views

## 📞 Support

Questions? Check the migration file comments or reach out!
