-- Debug Notification System
-- Run these queries to understand the current state of the notification system

-- 1. Check all notification types currently in the database
SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- 2. Check recent notifications (last 24 hours)
SELECT 
    id,
    user_id,
    type,
    title,
    LEFT(message, 100) as message_preview,
    data,
    read,
    created_at
FROM notifications 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check notification constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%notification%type%';

-- 4. Check email logs (recent)
SELECT 
    id,
    recipient,
    subject,
    type,
    status,
    error_message,
    sent_at,
    created_at
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check user profiles for display names (to debug "Someone" issue)
SELECT 
    user_id,
    display_name,
    username,
    email,
    created_at
FROM user_profiles 
WHERE display_name IS NULL OR display_name = ''
LIMIT 10;

-- 6. Check event members table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_members' 
ORDER BY ordinal_position;

-- 7. Check crew members table structure  
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'crew_members' 
ORDER BY ordinal_position;

-- 8. Check invitation tokens table
SELECT 
    id,
    token,
    type,
    invitation_id,
    action,
    user_id,
    expires_at,
    used,
    created_at
FROM invitation_tokens 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 9. Check for any notifications with "Someone" in the title
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    data,
    created_at
FROM notifications 
WHERE title ILIKE '%Someone%'
ORDER BY created_at DESC
LIMIT 10;

-- 10. Check database functions related to notifications
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name ILIKE '%notification%'
   OR routine_name ILIKE '%invitation%'
ORDER BY routine_name;
