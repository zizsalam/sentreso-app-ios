-- Simple query for today's registrations
-- This should be more accurate than the complex query

-- 1. Count today's registrations (simple version)
SELECT COUNT(*) as today_registrations
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE;

-- 2. Show today's registrations with details
SELECT
    id,
    email,
    created_at,
    EXTRACT(HOUR FROM created_at) as registration_hour
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 3. Count registrations by hour today
SELECT
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as registrations
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 4. Today's activity (users with transactions today)
SELECT COUNT(DISTINCT user_id) as active_users_today
FROM transactions
WHERE DATE(created_at) = CURRENT_DATE;

-- 5. Today's total transactions
SELECT COUNT(*) as today_transactions
FROM transactions
WHERE DATE(created_at) = CURRENT_DATE;

-- 6. Simple daily registration count (last 7 days)
SELECT
    DATE(created_at) as registration_date,
    COUNT(*) as new_users
FROM auth.users
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;
