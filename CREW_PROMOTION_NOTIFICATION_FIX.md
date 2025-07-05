# 🔔 Crew Promotion Notification Fix

## 🎯 **Issue**
Crew member promotions to co-host are working, but notifications are failing with this error:
```
❌ Error creating notification: 
Object { code: "23514", details: `Failing row contains (..., crew_promotion, ...)`, 
message: 'new row for relation "notifications" violates check constraint "notifications_type_check"' }
```

## 🔍 **Root Cause**
The `notifications` table has a check constraint that only allows specific notification types, but `crew_promotion` is missing from the allowed list.

## ✅ **Solution**
Run the SQL migration to add `crew_promotion` to the allowed notification types.

## 🚀 **How to Apply the Fix**

### **Step 1: Access Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Thirstee project
3. Navigate to **SQL Editor**

### **Step 2: Diagnose Current State (Optional)**
1. Copy the contents of `supabase/migrations/check_notification_types.sql`
2. Paste into the SQL Editor and click **"Run"**
3. This will show you what notification types currently exist

### **Step 3: Run the Safe Migration**
1. Copy the contents of `supabase/migrations/fix_crew_promotion_notification_safe.sql`
2. Paste into the SQL Editor
3. Click **"Run"** to execute

### **Step 4: Verify the Fix**
The migration will:
- ✅ Check existing notification types in your database
- ✅ Safely update the `notifications_type_check` constraint
- ✅ Add `crew_promotion` to allowed notification types
- ✅ Show any problematic types that need attention
- ✅ Display the final constraint definition

## 🧪 **Testing**
After applying the migration:
1. **Promote a crew member** to co-host in the Edit Crew modal
2. **Check for success**: Both the promotion AND notification should work
3. **Verify notification**: User should receive "👑 You've been promoted to co-host!" notification

## 📋 **Updated Notification Types**
After the fix, these notification types are supported:
- `follow_request`
- `follow_accepted` 
- `event_invitation`
- `event_update`
- `crew_invitation`
- `event_rsvp`
- `event_reminder`
- `crew_invite_accepted`
- `event_cancelled`
- `event_rating_reminder`
- `event_invitation_response`
- `crew_promotion` ✅ **NEWLY ADDED**

## 🎉 **Expected Result**
Crew promotions will work completely:
- ✅ Database update succeeds
- ✅ Notification is created successfully
- ✅ User receives proper promotion notification
- ✅ No more constraint violation errors

---

## ⚠️ **If You Get Constraint Violation Error**

If the migration fails with:
```
ERROR: 23514: check constraint "notifications_type_check" of relation "notifications" is violated by some row
```

This means there are existing notifications with types not in our list. The safe migration will:
1. **Identify** all existing notification types
2. **Include** them in the new constraint
3. **Show** you which types are unexpected
4. **Safely** add `crew_promotion` without breaking existing data

**Files Created:**
- `supabase/migrations/check_notification_types.sql` - Diagnostic query
- `supabase/migrations/fix_crew_promotion_notification_safe.sql` - Safe migration
- `supabase/migrations/fix_crew_promotion_notification_type.sql` - Original migration
- `frontend/thirstee-app-prd.md` - Updated database schema documentation
- `frontend/thirstee-design-system-updated.md` - Added fix documentation
