# Event Edit Troubleshooting Guide

## 🚨 Critical Issue: "You do not have permission to edit this event"

This error occurs when the required database functions for event editing are missing from the Supabase database.

## Root Cause

The `can_user_edit_event` database function is missing, causing the permission check to fail even for event creators.

## Quick Fix

The frontend includes fallback logic that should allow event creators to edit their events even without the database functions. If you're still getting the error:

1. **Check Browser Console**: Look for warnings like "RPC function not available"
2. **Verify Authentication**: Ensure you're logged in
3. **Confirm Ownership**: Make sure you created the event you're trying to edit

## Complete Solution

### Step 1: Apply the Migration

```bash
cd /path/to/your/project
npx supabase db push
```

This applies the migration file: `supabase/migrations/20250712_add_event_edit_permissions.sql`

### Step 2: Verify Database Functions

In Supabase SQL Editor, run:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_event_role',
    'can_user_edit_event',
    'promote_event_member_to_cohost',
    'demote_event_cohost'
);
```

Should return 4 functions.

### Step 3: Check event_members Table

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'event_members' 
AND column_name = 'role';
```

Should show the `role` column exists.

### Step 4: Test Permissions

```sql
-- Replace with actual IDs
SELECT can_user_edit_event('your-event-id', 'your-user-id');
SELECT get_user_event_role('your-event-id', 'your-user-id');
```

## Required Database Functions

### 1. `can_user_edit_event`
```sql
CREATE OR REPLACE FUNCTION can_user_edit_event(
  p_event_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
```
**Purpose**: Checks if user can edit event (hosts and co-hosts only)

### 2. `get_user_event_role`
```sql
CREATE OR REPLACE FUNCTION get_user_event_role(
  p_event_id UUID,
  p_user_id UUID
) RETURNS TEXT
```
**Purpose**: Returns user's role ('host', 'co_host', 'attendee', 'none')

### 3. Co-Host Management Functions
- `promote_event_member_to_cohost`
- `demote_event_cohost`

## Fallback Logic

The frontend includes fallback logic in:

### `frontend/src/lib/eventService.ts`
- Catches RPC errors
- Falls back to checking `events.created_by = user.id`
- Logs warnings when functions are missing

### `frontend/src/lib/eventRoleService.ts`
- Gracefully handles missing RPC functions
- Uses direct table queries as fallback
- Maintains functionality even without database functions

## Prevention

To prevent this issue in the future:

1. **Always run migrations**: `npx supabase db push` after pulling changes
2. **Check function dependencies**: Verify required functions exist before deploying
3. **Monitor console warnings**: Watch for RPC function errors
4. **Test edit functionality**: Always test event editing after database changes

## Files Modified for This Fix

- `supabase/migrations/20250712_add_event_edit_permissions.sql` (new)
- `frontend/src/lib/eventService.ts` (updated with fallback logic)
- `frontend/src/lib/eventRoleService.ts` (updated with fallback logic)
- `edit-session-architecture.md` (updated with troubleshooting info)
- `frontend/thirstee-app-prd.md` (updated with critical dependencies)

## Testing

After applying the fix:

1. Create a test event
2. Try to edit the event
3. Check browser console for any RPC warnings
4. Verify "Save Changes" works without errors
5. Test co-host functionality if applicable

## Support

If issues persist:
1. Check Supabase dashboard for function existence
2. Verify RLS policies allow event updates
3. Ensure user authentication is working
4. Review browser console for detailed error messages
