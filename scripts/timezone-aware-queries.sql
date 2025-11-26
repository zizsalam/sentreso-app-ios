-- Timezone-aware queries for accurate user counts
-- These queries account for Africa/Dakar timezone

-- 1. Today's registrations in Dakar timezone
SELECT COUNT(*) as today_registrations_dakar
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 2. Today's registrations with timezone conversion
SELECT
    id,
    email,
    created_at,
    timezone('Africa/Dakar', created_at) as dakar_time,
    EXTRACT(HOUR FROM timezone('Africa/Dakar', created_at)) as dakar_hour
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE
ORDER BY created_at DESC;

-- 3. Today's active users (with transactions) in Dakar timezone
SELECT COUNT(DISTINCT user_id) as active_users_today_dakar
FROM transactions
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 4. Today's total transactions in Dakar timezone
SELECT COUNT(*) as today_transactions_dakar
FROM transactions
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 5. Registrations by hour today (Dakar timezone)
SELECT
    EXTRACT(HOUR FROM timezone('Africa/Dakar', created_at)) as dakar_hour,
    COUNT(*) as registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM timezone('Africa/Dakar', created_at))
ORDER BY dakar_hour;

-- 6. Last 24 hours activity (more accurate than today)
SELECT COUNT(DISTINCT user_id) as active_users_last_24h
FROM transactions
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 7. Last 24 hours transactions
SELECT COUNT(*) as transactions_last_24h
FROM transactions
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 8. Recent activity (last 2 days) to catch timezone edge cases
SELECT
    DATE(timezone('Africa/Dakar', created_at)) as dakar_date,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_transactions
FROM transactions
WHERE created_at >= NOW() - INTERVAL '2 days'
GROUP BY DATE(timezone('Africa/Dakar', created_at))
ORDER BY dakar_date DESC;

-- 9. Simple query for today's registrations (no timezone conversion)
SELECT COUNT(*) as today_registrations_simple
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE;

-- 10. Compare UTC vs Dakar timezone results
SELECT
    'UTC' as timezone,
    COUNT(*) as registrations
FROM auth.users
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT
    'Dakar' as timezone,
    COUNT(*) as registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;
