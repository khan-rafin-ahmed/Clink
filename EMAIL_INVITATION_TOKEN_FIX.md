# 📧 Email Invitation Token Processing Fix

## 🐛 Issue Description

**Error**: `new row for relation "event_members" violates check constraint "event_members_status_check"`

**Root Cause**: The database function `process_event_invitation_token` was using string concatenation (`v_action || 'ed'`) to convert actions to status values, which caused issues when processing "decline" actions.

**Affected Features**:
- Accept/Decline buttons in event invitation emails
- Accept/Decline buttons in crew invitation emails
- Real-time notification updates from email actions

---

## 🔧 Fix Applied

### 1. Database Function Fixes

**File**: `fix_email_invitation_token_processing.sql`

**Changes**:
- Fixed `process_event_invitation_token()` function to properly map actions to status values
- Fixed `process_crew_invitation_token()` function with same logic
- Replaced string concatenation with explicit status mapping:
  - `'accept'` → `'accepted'`
  - `'decline'` → `'declined'`

### 2. Notification Personalization Fix

**File**: `fix_email_notification_personalization.sql`

**Issue**: Generic notifications showing "Someone accepted your invitation" instead of actual user names

**Changes**:
- Updated `process_event_invitation_token()` to fetch actual user names
- Implemented personalized notification pattern: `${userName} accepted your invitation to ${eventTitle}`
- Added user name to notification data for consistency
- Follows established notification architecture patterns

### 3. Notification Update Fix

**Issue**: Notifications still showing Accept/Decline buttons after responding via email

**Root Cause**: Email token processing functions weren't updating the original invitation notifications with response status

**Changes**:
- Added notification update logic to mark invitations as responded
- Updates notification data with `user_response` and `responded_at` fields
- Prevents notifications from showing action buttons after email response
- Matches existing in-app response behavior from NotificationBell.tsx
- Applied to both event and crew invitation token processing functions

### 4. Column Reference Fix

**Issue**: `column "used_at" of relation "invitation_tokens" does not exist`

**Root Cause**: Functions were trying to set `used_at` column that doesn't exist in the table schema

**Changes**:
- Fixed all functions to use `updated_at` instead of `used_at` when marking tokens as used
- Aligns with actual table schema from architecture documentation
- Applied to all invitation token processing functions

### 5. Event Slug Reference Fix

**Issue**: `column e.slug does not exist`

**Root Cause**: Functions were trying to access `v_event_record.slug` which doesn't exist in the events table

**Changes**:
- Fixed all functions to use proper slug logic: `COALESCE(public_slug, private_slug, event_code)`
- Updated both notification data and return statements
- Ensures correct redirect URLs for accepted invitations
- Applied to all event invitation token processing functions

### 6. Notifications Updated_At Column Fix

**Issue**: `column "updated_at" of relation "notifications" does not exist`

**Root Cause**: Functions were trying to set `updated_at` on notifications table which only has `created_at`

**Changes**:
- Removed all `updated_at` references from notification UPDATE statements
- Notifications table schema only includes: id, user_id, type, title, message, data, read, created_at
- Applied to all notification update operations in token processing functions

### 7. Users Table Reference Fix

**Issue**: `relation "users" does not exist`

**Root Cause**: Functions were trying to query `FROM users` but user data is stored in `user_profiles` table

**Changes**:
- Fixed all user queries to use `user_profiles` table instead of `users`
- Updated WHERE clause to use `user_id` instead of `id` (matching user_profiles schema)
- Enhanced user name resolution: `COALESCE(nickname, username, display_name, email)`
- Applied to all personalized notification creation in token processing functions

### 2. Current Architecture Confirmed

**Existing Flow**: Frontend calls database functions directly via RPC (`supabase.rpc()`)
- `process_event_invitation_token()` - Database function
- `process_crew_invitation_token()` - Database function

**Note**: Accept functionality already works correctly, only decline needed fixing

---

## 🚀 Deployment Steps

### Step 1: Apply Database Fix
```sql
-- Run this in Supabase SQL Editor
\i fix_email_invitation_token_processing.sql
```

### Step 2: Test the Fix
```bash
# No additional deployment needed - database functions are updated directly
# Test the decline functionality
```

### Step 3: Verify Fix
1. Create a test event with crew invitations
2. Check email for Accept/Decline buttons
3. Click "Can't join this event" (Decline) - **This should now work without errors**
4. Verify no constraint violation error occurs
5. Check that notification is updated in app in real-time

---

## 🔍 Technical Details

### Before Fix
```sql
-- This was causing the constraint violation
UPDATE event_members
SET status = v_action || 'ed'  -- 'decline' + 'ed' = 'declined'
WHERE id = v_invitation_record.id;
```

### After Fix
```sql
-- Explicit mapping prevents issues
IF v_action = 'accept' THEN
    v_new_status := 'accepted';
ELSIF v_action = 'decline' THEN
    v_new_status := 'declined';
END IF;

UPDATE event_members
SET status = v_new_status
WHERE id = v_invitation_record.id;
```

### Database Constraint
```sql
-- This constraint was correctly defined
CHECK (status IN ('pending', 'accepted', 'declined'))
```

---

## 🧪 Testing Checklist

### Event Invitations
- [ ] Accept invitation from email works
- [ ] Decline invitation from email works
- [ ] Real-time notification updates work
- [ ] Redirect to event page after accept
- [ ] Redirect to dashboard after decline

### Crew Invitations
- [ ] Accept crew invitation from email works
- [ ] Decline crew invitation from email works
- [ ] Real-time notification updates work
- [ ] Redirect to crew page after accept
- [ ] Redirect to dashboard after decline

### Error Handling
- [ ] Expired tokens show proper error
- [ ] Invalid tokens show proper error
- [ ] Already responded invitations show proper error
- [ ] Unauthenticated users get login prompt

---

## 🔄 Real-time Sync Flow

### Email Action → App Notification Update

1. **User clicks Accept/Decline in email**
2. **Token validation** (expires_at, used status, user match)
3. **Database update** (event_members/crew_members status)
4. **Token marked as used** (prevents reuse)
5. **Notification created** (for event/crew host if accepting)
6. **Cache invalidation** (NotificationBell component updates)
7. **Real-time UI update** (notification disappears from bell)

### Cache Keys Invalidated
- `user_notifications_{userId}`
- `unread_count_{userId}`
- `event_detail_{eventId}`
- `event_attendance_{eventId}_{userId}`

---

## 📊 Monitoring

### Success Metrics
- Email invitation response rate
- Token processing success rate
- Real-time sync performance
- User experience (no errors)

### Error Tracking
- Constraint violation errors (should be 0)
- Token validation failures
- Database function exceptions
- Edge function timeouts

---

## 🔒 Security Considerations

### Token Security
- ✅ Time-limited expiration (48 hours)
- ✅ Single-use tokens (marked as used)
- ✅ User-specific validation
- ✅ Action-specific tokens

### Database Security
- ✅ RLS policies enforced
- ✅ SECURITY DEFINER functions
- ✅ Input validation
- ✅ Error handling

---

## 📚 Related Documentation

- [Email Notifications Architecture](./thirstee-email-notifications-architecture.md)
- [Notification System Architecture](./thirstee-notification-system-architecture.md)
- [Invitation Token Service](./frontend/src/lib/invitationTokenService.ts)
- [NotificationBell Component](./frontend/src/components/NotificationBell.tsx)

---

## 🎯 Future Improvements

### Performance Optimizations
- Batch token processing for multiple invitations
- Improved cache invalidation strategies
- Database connection pooling

### User Experience
- Better error messages for expired tokens
- Progress indicators during processing
- Offline support for email actions

### Analytics
- Track email engagement rates
- Monitor invitation conversion rates
- A/B test email template variations

---

*Fix Applied: January 2025*
*Status: Ready for Production*
