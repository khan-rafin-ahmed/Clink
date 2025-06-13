# Manual Testing Guide for Event Creation Fixes

## Overview
This guide provides step-by-step instructions to manually test the two critical fixes applied to the Thirstee app:

1. **Event Date/Time Classification Bug Fix**
2. **Crew Invitation Visibility Fix**

## Prerequisites

1. **Apply Database Migration**: First, apply the database migration by running the SQL from `supabase/migrations/fix_event_date_timezone_and_crew_invites.sql` in your Supabase dashboard.

2. **Start the Application**: 
   ```bash
   cd frontend
   npm run dev
   ```

3. **Have Multiple Test Accounts**: You'll need at least 2 user accounts to test crew invitations.

## Test 1: Event Date/Time Classification Fix

### Scenario: Events with future dates should appear in "Upcoming" tab

**Steps:**
1. **Login** to the Thirstee app
2. **Create a new event** with the following details:
   - Title: "Test Future Event"
   - Date: Set to 6+ days in the future
   - Time: Any time
   - Location: Any location
   - Make it public or private
3. **Navigate to your profile page**
4. **Check the "Upcoming Events" tab**

**Expected Result:** ✅ The event should appear in the "Upcoming Events" tab

**Previous Bug:** ❌ The event would incorrectly appear in the "Past Events" tab

### Additional Test Cases:
- **Event 1 hour from now**: Should be in "Upcoming"
- **Event tomorrow**: Should be in "Upcoming"  
- **Event 1 week from now**: Should be in "Upcoming"
- **Event 1 hour ago**: Should be in "Past"

## Test 2: Crew Invitation Visibility Fix

### Scenario: Crew members should see events they were invited to

**Setup:**
1. **Create a crew** with multiple members:
   - Login as User A (crew creator)
   - Go to profile page
   - Create a new crew
   - Invite User B to the crew
   - User B should accept the crew invitation

**Steps:**
1. **Login as User A** (crew creator)
2. **Create a new event** using the QuickEventModal:
   - Title: "Crew Test Event"
   - Date: Any future date
   - Location: Any location
   - **Important**: In the "Invite Your Crew" section, select the crew you created
   - Verify that crew members are shown as "will automatically join"
   - Create the event
3. **Login as User B** (crew member)
4. **Navigate to profile page**
5. **Check the "Upcoming Events" tab**

**Expected Result:** ✅ User B should see the "Crew Test Event" in their "Upcoming Events" tab

**Previous Bug:** ❌ User B would not see the event at all

### Verification Steps:
1. **Check event details**: User B should be able to click on the event and see full details
2. **Check attendee list**: User B should appear in the attendee list
3. **Check event source**: The event should show that User B joined via crew invitation

## Test 3: Deduplication Logic

### Scenario: Users shouldn't see duplicate events if they're both RSVP'd and crew-invited

**Steps:**
1. **Create an event** and invite a crew (as in Test 2)
2. **Have a crew member also RSVP** to the same event manually
3. **Check the crew member's profile page**

**Expected Result:** ✅ The event should appear only once in the "Upcoming Events" tab

**Previous Risk:** ❌ Without deduplication, the event might appear twice

## Test 4: Cross-Timezone Testing

### Scenario: Events should be classified correctly regardless of user's timezone

**Steps:**
1. **Change your system timezone** (if possible) or test with users in different timezones
2. **Create events** with various future dates
3. **Verify classification** remains consistent

**Expected Result:** ✅ Events should be classified as upcoming/past consistently across timezones

## Debugging Tips

### If Test 1 Fails (Date Classification):
1. **Check browser console** for any JavaScript errors
2. **Verify the database migration** was applied correctly
3. **Check if events are being created** with correct UTC timestamps

### If Test 2 Fails (Crew Invitations):
1. **Verify crew creation** worked correctly
2. **Check the event_members table** in Supabase dashboard:
   ```sql
   SELECT * FROM event_members WHERE event_id = 'your-event-id';
   ```
3. **Verify the user is in the crew**:
   ```sql
   SELECT * FROM crew_members WHERE user_id = 'user-b-id';
   ```

### Database Queries for Verification:

**Check event classification:**
```sql
SELECT id, title, date_time, 
       CASE 
         WHEN date_time >= NOW() THEN 'upcoming'
         ELSE 'past'
       END as classification
FROM events 
WHERE created_by = 'your-user-id'
ORDER BY date_time;
```

**Check crew invitations:**
```sql
SELECT e.title, em.user_id, em.status, em.invited_by
FROM events e
JOIN event_members em ON e.id = em.event_id
WHERE e.id = 'your-event-id';
```

## Success Criteria

✅ **All tests pass** if:
1. Future events appear in "Upcoming" tab regardless of how far in the future
2. Crew members can see events they were invited to during event creation
3. No duplicate events appear in profile tabs
4. Event classification works consistently across different timezones

## Rollback Plan

If any issues are discovered:
1. **Revert frontend changes** in `frontend/src/pages/UserProfile.tsx`
2. **Revert database function** by running the previous version of `get_user_accessible_events`
3. **Report specific failure scenarios** for further investigation
