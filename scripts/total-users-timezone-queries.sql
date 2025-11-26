-- TIMEZONE-AWARE QUERIES FOR TOTAL USERS
-- These queries use Africa/Dakar timezone for accurate counts

-- 1. Total Users (All Time)
SELECT COUNT(*) as total_users
FROM auth.users;

-- 2. Today's Registrations - Dakar Timezone
SELECT COUNT(*) as today_registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 3. Last 24 Hours Registrations
SELECT COUNT(*) as registrations_last_24h
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 4. Daily Registrations (Last 7 Days) - Dakar Timezone
SELECT
    DATE(timezone('Africa/Dakar', created_at)) as registration_date,
    COUNT(*) as new_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timezone('Africa/Dakar', created_at))
ORDER BY registration_date DESC;

-- 5. Active Users Today (With Transactions) - Dakar Timezone
SELECT COUNT(DISTINCT user_id) as active_users_today
FROM transactions
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 6. Total Active Users (All Time)
SELECT COUNT(DISTINCT user_id) as total_active_users
FROM transactions;

-- 7. Registration Rate Analysis
SELECT
    COUNT(*) as total_registered,
    COUNT(DISTINCT t.user_id) as total_active,
    ROUND(COUNT(DISTINCT t.user_id)::DECIMAL / COUNT(*) * 100, 2) as activation_rate_percent
FROM auth.users u
LEFT JOIN transactions t ON t.user_id = u.id;

-- 8. Today's Registrations by Hour (Dakar Time)
SELECT
    EXTRACT(HOUR FROM timezone('Africa/Dakar', created_at)) as dakar_hour,
    COUNT(*) as registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM timezone('Africa/Dakar', created_at))
ORDER BY dakar_hour;

-- 9. Compare UTC vs Dakar Timezone
SELECT
    'UTC' as timezone,
    COUNT(*) as today_registrations
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
    'Dakar' as timezone,
    COUNT(*) as today_registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 10. Weekly Growth (Dakar Timezone)
SELECT
    DATE_TRUNC('week', timezone('Africa/Dakar', created_at)) as week_start,
    COUNT(*) as weekly_registrations
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', timezone('Africa/Dakar', created_at))
ORDER BY week_start DESC;

-- 11. Monthly Growth (Dakar Timezone)
SELECT
    DATE_TRUNC('month', timezone('Africa/Dakar', created_at)) as month_start,
    COUNT(*) as monthly_registrations
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', timezone('Africa/Dakar', created_at))
ORDER BY month_start DESC;

-- 12. Today's Activity Summary
SELECT
    'Today' as period,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT t.user_id) as active_users,
    COUNT(t.id) as total_transactions
FROM auth.users u
LEFT JOIN transactions t ON t.user_id = u.id
    AND DATE(timezone('Africa/Dakar', t.created_at)) = CURRENT_DATE
WHERE DATE(timezone('Africa/Dakar', u.created_at)) = CURRENT_DATE;
