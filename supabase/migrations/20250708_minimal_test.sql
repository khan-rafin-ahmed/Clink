-- MINIMAL TEST: Just basic queries to see if anything works

SELECT 'Step 1' as step, 'Starting test' as status;

SELECT 'Step 2' as step, COUNT(*) as notification_count FROM notifications;

SELECT 'Step 3' as step, COUNT(*) as user_count FROM user_profiles;

SELECT 'Step 4' as step, COUNT(*) as event_count FROM events;

SELECT 'Step 5' as step, 'Test complete' as status;
