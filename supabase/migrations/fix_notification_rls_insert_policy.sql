-- Fix Notification RLS Insert Policy
-- This adds the missing INSERT policy for the notifications table

-- Add INSERT policy for notifications table
-- Users should be able to create notifications for any user (system notifications)
-- This is needed for the notification service to work properly
CREATE POLICY "System can create notifications for users" ON notifications
FOR INSERT WITH CHECK (true);

-- Alternative more restrictive policy (commented out):
-- Users can only create notifications for themselves
-- CREATE POLICY "Users can create notifications for themselves" ON notifications
-- FOR INSERT WITH CHECK (user_id = auth.uid());

-- Ensure all notification types are included in the constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'follow_request', 'follow_accepted', 'event_invitation', 'event_update', 
    'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted', 
    'event_cancelled', 'event_rating_reminder', 'event_invitation_response',
    'crew_promotion'
));
