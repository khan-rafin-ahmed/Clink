-- SIMPLE TEST: One query at a time to see what's working

-- Test 1: Basic table access
SELECT 'Test 1 - Notifications table:' as test, COUNT(*) as count FROM notifications;

-- Test 2: Recent notifications
SELECT 'Test 2 - Recent notifications:' as test, COUNT(*) as recent_count 
FROM notifications 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Test 3: Check if trigger exists
SELECT 'Test 3 - Trigger exists:' as test, 
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as trigger_exists
FROM information_schema.triggers 
WHERE trigger_name = 'event_invitation_notification_trigger';

-- Test 4: Check if trigger function exists
SELECT 'Test 4 - Trigger function exists:' as test,
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as function_exists
FROM information_schema.routines 
WHERE routine_name = 'handle_event_invitation_notification';

-- Test 5: Try to create a test event member (this should trigger notification)
DO $$
DECLARE
    test_event_id UUID;
    test_user_id UUID;
    test_inviter_id UUID;
BEGIN
    -- Get some real IDs from your database
    SELECT id INTO test_event_id FROM events ORDER BY created_at DESC LIMIT 1;
    SELECT user_id INTO test_user_id FROM user_profiles ORDER BY created_at DESC LIMIT 1;
    SELECT user_id INTO test_inviter_id FROM user_profiles ORDER BY created_at DESC LIMIT 1 OFFSET 1;
    
    IF test_event_id IS NOT NULL AND test_user_id IS NOT NULL AND test_inviter_id IS NOT NULL THEN
        -- Try to insert a test invitation (this should trigger notification)
        INSERT INTO event_members (event_id, user_id, invited_by, status)
        VALUES (test_event_id, test_user_id, test_inviter_id, 'pending');
        
        RAISE NOTICE 'Test invitation created successfully';
        
        -- Clean up immediately
        DELETE FROM event_members 
        WHERE event_id = test_event_id 
        AND user_id = test_user_id 
        AND invited_by = test_inviter_id 
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '1 minute';
        
    ELSE
        RAISE NOTICE 'Could not find test data - event_id: %, user_id: %, inviter_id: %', test_event_id, test_user_id, test_inviter_id;
    END IF;
END $$;

SELECT 'Test complete' as final_result;
