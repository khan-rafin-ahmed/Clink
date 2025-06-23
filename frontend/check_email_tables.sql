-- Check what email-related tables and policies already exist
-- Run this first to see what's already in your database

-- Check if email tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'email_preferences');

-- Check existing policies on email_logs (if table exists)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'email_logs';

-- Check existing policies on email_preferences (if table exists)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'email_preferences';

-- Check if email-related functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%email%';

-- Check events table for duration columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('duration_type', 'end_time', 'duration_hours');
