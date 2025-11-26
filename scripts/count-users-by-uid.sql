-- COUNT TOTAL USERS THROUGH UID
-- These queries count users by their unique identifiers

-- 1. Total Users by UID Count
SELECT COUNT(*) as total_users_by_uid
FROM auth.users;

-- 2. Unique UID Count
SELECT COUNT(DISTINCT id) as unique_uids
FROM auth.users;

-- 3. UID Analysis with Details
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_uids,
    COUNT(*) - COUNT(DISTINCT id) as duplicate_uids
FROM auth.users;

-- 4. UID Count by Status
SELECT
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Unconfirmed'
    END as status,
    COUNT(*) as user_count
FROM auth.users
GROUP BY CASE
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
END;

-- 5. UID Count by Registration Date (Dakar Timezone)
SELECT
    DATE(timezone('Africa/Dakar', created_at)) as registration_date,
    COUNT(*) as users_registered
FROM auth.users
GROUP BY DATE(timezone('Africa/Dakar', created_at))
ORDER BY registration_date DESC;

-- 6. Active UIDs (With Transactions)
SELECT COUNT(DISTINCT user_id) as active_uids
FROM transactions;

-- 7. UID vs Transaction Analysis
SELECT
    COUNT(DISTINCT u.id) as total_uids,
    COUNT(DISTINCT t.user_id) as active_uids,
    COUNT(DISTINCT u.id) - COUNT(DISTINCT t.user_id) as inactive_uids
FROM auth.users u
LEFT JOIN transactions t ON t.user_id = u.id;

-- 8. UID Count by Provider
SELECT
    COALESCE(raw_app_meta_data->>'provider', 'email') as provider,
    COUNT(*) as user_count
FROM auth.users
GROUP BY COALESCE(raw_app_meta_data->>'provider', 'email');

-- 9. UID Growth Over Time
SELECT
    DATE_TRUNC('day', timezone('Africa/Dakar', created_at)) as date,
    COUNT(*) as daily_registrations,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', timezone('Africa/Dakar', created_at))) as cumulative_uids
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timezone('Africa/Dakar', created_at))
ORDER BY date;

-- 10. UID Validation Check
SELECT
    'Total Records' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
    'Unique UIDs' as metric,
    COUNT(DISTINCT id) as count
FROM auth.users
UNION ALL
SELECT
    'Active UIDs' as metric,
    COUNT(DISTINCT user_id) as count
FROM transactions;

-- 11. Today's UID Registrations (Dakar Timezone)
SELECT COUNT(*) as today_uid_registrations
FROM auth.users
WHERE DATE(timezone('Africa/Dakar', created_at)) = CURRENT_DATE;

-- 12. UID Count by Last 24 Hours
SELECT COUNT(*) as uids_last_24h
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 13. UID Count by Last 7 Days
SELECT COUNT(*) as uids_last_7_days
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 14. UID Count by Last 30 Days
SELECT COUNT(*) as uids_last_30_days
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 15. UID Count Summary
SELECT
    'All Time' as period,
    COUNT(*) as total_uids
FROM auth.users
UNION ALL
SELECT
    'Last 24 Hours' as period,
    COUNT(*) as total_uids
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
    'Last 7 Days' as period,
    COUNT(*) as total_uids
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT
    'Last 30 Days' as period,
    COUNT(*) as total_uids
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days';
