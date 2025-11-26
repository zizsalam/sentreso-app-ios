# 📊 Field Analytics Queries - Sentreso Finance

## 🎯 **Query 1: Daily User Onboarding Over Time**

```sql
-- Daily user registrations with cumulative totals
WITH daily_registrations AS (
  SELECT
    DATE(timezone('Africa/Dakar', u.created_at)) AS registration_date,
    COUNT(*) AS new_users
  FROM auth.users u
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(timezone('Africa/Dakar', u.created_at))
),
cumulative_users AS (
  SELECT
    registration_date,
    new_users,
    SUM(new_users) OVER (ORDER BY registration_date) AS total_users
  FROM daily_registrations
)
SELECT
  registration_date,
  new_users,
  total_users,
  ROUND(
    (new_users::DECIMAL / LAG(total_users) OVER (ORDER BY registration_date)) * 100,
    2
  ) AS growth_rate_percent
FROM cumulative_users
ORDER BY registration_date;
```

## 📈 **Query 2: User Activity & Transaction Volume**

```sql
-- User activity metrics with transaction counts
WITH user_activity AS (
  SELECT
    u.id AS user_id,
    u.email,
    p.display_name,
    p.phone,
    p.market,
    DATE(timezone('Africa/Dakar', u.created_at)) AS registration_date,
    COUNT(t.id) AS total_transactions,
    COUNT(t.id) FILTER (WHERE t.occurred_at >= NOW() - INTERVAL '7 days') AS txns_7d,
    COUNT(t.id) FILTER (WHERE t.occurred_at >= NOW() - INTERVAL '14 days') AS txns_14d,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS total_revenue,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS total_expenses,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) -
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS net_profit
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.transactions t ON t.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.id, u.email, p.display_name, p.phone, p.market, u.created_at
)
SELECT
  user_id,
  email,
  display_name,
  phone,
  market,
  registration_date,
  total_transactions,
  txns_7d,
  txns_14d,
  total_revenue,
  total_expenses,
  net_profit,
  CASE
    WHEN total_transactions = 0 THEN 'Inactive'
    WHEN total_transactions BETWEEN 1 AND 5 THEN 'Low Activity'
    WHEN total_transactions BETWEEN 6 AND 20 THEN 'Medium Activity'
    ELSE 'High Activity'
  END AS activity_level
FROM user_activity
ORDER BY registration_date DESC, total_transactions DESC;
```

## 📊 **Query 3: Daily Transaction Volume & Revenue**

```sql
-- Daily transaction metrics with user counts
WITH daily_metrics AS (
  SELECT
    DATE(timezone('Africa/Dakar', t.occurred_at)) AS transaction_date,
    COUNT(DISTINCT t.user_id) AS active_users,
    COUNT(t.id) AS total_transactions,
    COUNT(t.id) FILTER (WHERE t.kind = 'sale') AS sales_count,
    COUNT(t.id) FILTER (WHERE t.kind = 'expense') AS expense_count,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS daily_revenue,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS daily_expenses,
    COALESCE(AVG(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS avg_sale_amount,
    COALESCE(AVG(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS avg_expense_amount
  FROM public.transactions t
  WHERE t.occurred_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(timezone('Africa/Dakar', t.occurred_at))
)
SELECT
  transaction_date,
  active_users,
  total_transactions,
  sales_count,
  expense_count,
  daily_revenue,
  daily_expenses,
  daily_revenue - daily_expenses AS daily_net_profit,
  ROUND(avg_sale_amount, 0) AS avg_sale_amount,
  ROUND(avg_expense_amount, 0) AS avg_expense_amount,
  ROUND(daily_revenue / NULLIF(active_users, 0), 0) AS revenue_per_user,
  ROUND(total_transactions::DECIMAL / NULLIF(active_users, 0), 1) AS transactions_per_user
FROM daily_metrics
ORDER BY transaction_date;
```

## 🎯 **Query 4: User Retention & Engagement**

```sql
-- User retention analysis by registration cohort
WITH user_cohorts AS (
  SELECT
    u.id AS user_id,
    DATE(timezone('Africa/Dakar', u.created_at)) AS registration_date,
    DATE(timezone('Africa/Dakar', MIN(t.occurred_at))) AS first_transaction_date,
    DATE(timezone('Africa/Dakar', MAX(t.occurred_at))) AS last_transaction_date,
    COUNT(t.id) AS total_transactions,
    COUNT(DISTINCT DATE(timezone('Africa/Dakar', t.occurred_at))) AS active_days
  FROM auth.users u
  LEFT JOIN public.transactions t ON t.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.id, u.created_at
),
cohort_analysis AS (
  SELECT
    registration_date,
    COUNT(*) AS registered_users,
    COUNT(first_transaction_date) AS users_with_transactions,
    ROUND(
      COUNT(first_transaction_date)::DECIMAL / COUNT(*) * 100,
      2
    ) AS activation_rate_percent,
    ROUND(AVG(total_transactions), 1) AS avg_transactions_per_user,
    ROUND(AVG(active_days), 1) AS avg_active_days,
    COUNT(*) FILTER (WHERE last_transaction_date >= NOW() - INTERVAL '7 days') AS active_last_7d,
    COUNT(*) FILTER (WHERE last_transaction_date >= NOW() - INTERVAL '14 days') AS active_last_14d
  FROM user_cohorts
  GROUP BY registration_date
)
SELECT
  registration_date,
  registered_users,
  users_with_transactions,
  activation_rate_percent,
  avg_transactions_per_user,
  avg_active_days,
  active_last_7d,
  active_last_14d,
  ROUND(active_last_7d::DECIMAL / registered_users * 100, 2) AS retention_7d_percent,
  ROUND(active_last_14d::DECIMAL / registered_users * 100, 2) AS retention_14d_percent
FROM cohort_analysis
ORDER BY registration_date;
```

## 📱 **Query 5: Market Performance Analysis**

```sql
-- Performance by market/location
WITH market_metrics AS (
  SELECT
    COALESCE(p.market, 'Unknown') AS market,
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') AS new_users_7d,
    COUNT(t.id) AS total_transactions,
    COUNT(t.id) FILTER (WHERE t.occurred_at >= NOW() - INTERVAL '7 days') AS txns_7d,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS total_revenue,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS total_expenses,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) -
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS net_profit
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.transactions t ON t.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY COALESCE(p.market, 'Unknown')
)
SELECT
  market,
  total_users,
  new_users_7d,
  total_transactions,
  txns_7d,
  total_revenue,
  total_expenses,
  net_profit,
  ROUND(total_revenue / NULLIF(total_users, 0), 0) AS revenue_per_user,
  ROUND(total_transactions::DECIMAL / NULLIF(total_users, 0), 1) AS transactions_per_user,
  ROUND(net_profit / NULLIF(total_users, 0), 0) AS profit_per_user
FROM market_metrics
ORDER BY total_users DESC;
```

## 🚀 **Query 6: Executive Dashboard Summary**

```sql
-- High-level metrics for executive dashboard
WITH summary_metrics AS (
  SELECT
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') AS new_users_7d,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days') AS new_users_30d,
    COUNT(t.id) AS total_transactions,
    COUNT(t.id) FILTER (WHERE t.occurred_at >= NOW() - INTERVAL '7 days') AS txns_7d,
    COUNT(t.id) FILTER (WHERE t.occurred_at >= NOW() - INTERVAL '30 days') AS txns_30d,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS total_revenue,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS total_expenses,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) -
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS net_profit
  FROM auth.users u
  LEFT JOIN public.transactions t ON t.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  total_users,
  new_users_7d,
  new_users_30d,
  total_transactions,
  txns_7d,
  txns_30d,
  total_revenue,
  total_expenses,
  net_profit,
  ROUND(total_revenue / NULLIF(total_users, 0), 0) AS avg_revenue_per_user,
  ROUND(total_transactions::DECIMAL / NULLIF(total_users, 0), 1) AS avg_transactions_per_user,
  ROUND(net_profit / NULLIF(total_users, 0), 0) AS avg_profit_per_user,
  ROUND(txns_7d::DECIMAL / NULLIF(new_users_7d, 0), 1) AS txns_per_new_user_7d
FROM summary_metrics;
```

## 📊 **Query 7: Transaction Trends by Hour**

```sql
-- Hourly transaction patterns (useful for understanding usage patterns)
WITH hourly_patterns AS (
  SELECT
    EXTRACT(HOUR FROM timezone('Africa/Dakar', t.occurred_at)) AS hour_of_day,
    COUNT(t.id) AS transaction_count,
    COUNT(t.id) FILTER (WHERE t.kind = 'sale') AS sales_count,
    COUNT(t.id) FILTER (WHERE t.kind = 'expense') AS expense_count,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'sale'), 0) AS hourly_revenue,
    COALESCE(SUM(t.amount_cfa) FILTER (WHERE t.kind = 'expense'), 0) AS hourly_expenses
  FROM public.transactions t
  WHERE t.occurred_at >= NOW() - INTERVAL '7 days'
  GROUP BY EXTRACT(HOUR FROM timezone('Africa/Dakar', t.occurred_at))
)
SELECT
  hour_of_day,
  transaction_count,
  sales_count,
  expense_count,
  hourly_revenue,
  hourly_expenses,
  ROUND(hourly_revenue / NULLIF(sales_count, 0), 0) AS avg_sale_amount,
  ROUND(hourly_expenses / NULLIF(expense_count, 0), 0) AS avg_expense_amount
FROM hourly_patterns
ORDER BY hour_of_day;
```

## 🎯 **Usage Instructions**

### **For Charts & Visualizations:**

1. **User Growth Chart**: Use Query 1 for daily registration trends
2. **Transaction Volume**: Use Query 3 for daily transaction metrics
3. **User Retention**: Use Query 4 for cohort analysis
4. **Market Performance**: Use Query 5 for location-based insights
5. **Executive Summary**: Use Query 6 for high-level KPIs
6. **Usage Patterns**: Use Query 7 for hourly activity patterns

### **For Analysis:**

- **Query 2**: Detailed user activity analysis
- **Query 4**: User retention and engagement metrics
- **Query 5**: Market performance comparison

### **Key Metrics to Track:**

- **User Growth**: Daily new registrations
- **Activation Rate**: % of users who make their first transaction
- **Retention**: % of users active in last 7/14 days
- **Revenue per User**: Average revenue generated per user
- **Transaction Frequency**: Average transactions per user
- **Market Performance**: Performance by location/market

---

## 📈 **Sample Chart Data Export**

To export data for charts, you can modify any query by adding:

```sql
-- Add this to any query for CSV export
COPY (
  -- Your query here
) TO '/tmp/field_analytics.csv' WITH CSV HEADER;
```

Or use the results directly in your analytics tool (PostHog, Google Analytics, etc.).

---

**© 2025 Sentreso Technologies**
*Data-driven insights for field success* 📊🚀
o
