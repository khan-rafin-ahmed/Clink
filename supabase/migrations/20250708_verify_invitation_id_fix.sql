-- VERIFY: Check if the invitation_id fix worked

-- 1. Show recent event_invitation notifications with their invitation_id status
SELECT 
    'Recent invitation notifications:' as info,
    id,
    LEFT(title, 50) as title_preview,
    data->>'invitation_id' as invitation_id,
    data->>'event_title' as event_title,
    CASE 
        WHEN data->>'invitation_id' IS NOT NULL AND data->>'invitation_id' != '' AND data->>'invitation_id' != 'null' 
        THEN '✅ Has invitation_id'
        ELSE '❌ Missing invitation_id'
    END as status,
    created_at
FROM notifications 
WHERE type = 'event_invitation'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Count fixed vs unfixed notifications
SELECT 
    'Summary:' as info,
    COUNT(*) as total_recent_invitations,
    COUNT(*) FILTER (
        WHERE data->>'invitation_id' IS NOT NULL 
        AND data->>'invitation_id' != '' 
        AND data->>'invitation_id' != 'null'
    ) as with_invitation_id,
    COUNT(*) FILTER (
        WHERE data->>'invitation_id' IS NULL 
        OR data->>'invitation_id' = '' 
        OR data->>'invitation_id' = 'null'
    ) as missing_invitation_id
FROM notifications 
WHERE type = 'event_invitation'
AND created_at > NOW() - INTERVAL '7 days';

-- 3. Show any notifications that still need user response (should be updatable now)
SELECT 
    'Notifications awaiting response (should be updatable now):' as info,
    id,
    user_id,
    LEFT(title, 40) as title_preview,
    data->>'invitation_id' as invitation_id,
    data->>'user_response' as user_response,
    created_at
FROM notifications 
WHERE type = 'event_invitation'
AND (data->>'user_response' IS NULL OR data->>'user_response' = '')
AND created_at > NOW() - INTERVAL '3 days'
ORDER BY created_at DESC
LIMIT 5;
