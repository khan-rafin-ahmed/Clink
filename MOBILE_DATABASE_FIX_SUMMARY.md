# Mobile App Database Relationship Fixes

## 🚨 **Problems Identified**

The mobile app was experiencing critical database errors in multiple areas:

### **1. Event Details Loading Error:**
```
ERROR ❌ Error in getEventById: {"code": "PGRST200", "details": "Searched for a foreign key relationship between 'events' and 'user_profiles' using the hint 'events_created_by_fkey' in the schema 'public', but no matches were found.", "hint": null, "message": "Could not find a relationship between 'events' and 'user_profiles' in the schema cache"}
ERROR Failed to load event: [Error: Unknown error]
```

### **2. Crew Members Loading Error:**
```
ERROR ❌ Error in getCrewMembers: {"code": "PGRST200", "details": "Searched for a foreign key relationship between 'crew_members' and 'user_profiles' in the schema 'public', but no matches were found.", "hint": null, "message": "Could not find a relationship between 'crew_members' and 'user_profiles' in the schema cache"}
ERROR Failed to load crew members: [Error: Unknown error]
```

### **3. Missing Features:**
- Event attendees/hosts not displaying
- Crew members not showing properly
- No "Who's Going" section in events
- User avatars not displaying (only showing initials)
- Crew member counting logic incorrect (host counted twice)

## 🔍 **Root Cause Analysis**

Multiple functions were attempting to use foreign key hints for relationships that don't exist in the database schema:

### **Database Schema Reality:**
- `events.created_by` → `auth.users(id)` ✅ (Foreign key exists)
- `crew_members.user_id` → `auth.users(id)` ✅ (Foreign key exists)
- `user_profiles.user_id` → `auth.users(id)` ✅ (Foreign key exists)
- `events` → `user_profiles` ❌ (No direct foreign key relationship)
- `crew_members` → `user_profiles` ❌ (No direct foreign key relationship)

### **Problematic Code Patterns:**

#### **1. Event Service Issue:**
```typescript
// ❌ This was causing PGRST200 errors in getEventById
const { data: event, error } = await supabase
  .from('events')
  .select(`
    *,
    creator:user_profiles!events_created_by_fkey(
      id,
      display_name,
      avatar_url
    )
  `)
  .eq('id', eventId)
  .single()
```

#### **2. Crew Service Issue:**
```typescript
// ❌ This was causing PGRST200 errors in getCrewMembers
const { data: members, error } = await supabase
  .from('crew_members')
  .select(`
    *,
    user_profiles!inner(
      user_id,
      display_name,
      avatar_url
    )
  `)
```

The foreign key hints were trying to create direct relationships that don't exist because all user-related tables reference `auth.users(id)` as the central point, not each other directly.

## ✅ **Solutions Applied**

### **1. Fixed Event Service (`packages/shared/src/lib/eventService.ts`)**

#### **Fixed `getEventById` Function:**
```typescript
// ✅ Fixed version - separate queries
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    // Get event data first without problematic joins
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .eq('id', eventId)
      .single()

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return null // Event not found
      }
      throw eventError
    }

    // Get creator information separately to avoid foreign key issues
    let creator = null
    if (eventData.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', eventData.created_by)
        .single()

      // Handle cases where profile doesn't exist
      if (creatorError && creatorError.code === 'PGRST116') {
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      } else if (!creatorError && creatorData) {
        creator = creatorData
      } else {
        // Fallback for any other error
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      }
    }

    // Combine the data
    const event = {
      ...eventData,
      creator
    }

    return event
  } catch (error) {
    console.error('❌ Error in getEventById:', error)
    throw error
  }
}
```

#### **Added `getEventMembers` Function:**
```typescript
// ✅ New function to get all event attendees (matches web app logic exactly)
export async function getEventMembers(eventId: string): Promise<any[]> {
  // Create a Set to track unique user IDs to avoid duplicates (same as web app)
  const uniqueAttendeeIds = new Set<string>()
  const allAttendees = []

  // Always include the host as an attendee (same as web app)
  if (eventData.created_by) {
    uniqueAttendeeIds.add(eventData.created_by)
    allAttendees.push({
      user_id: eventData.created_by,
      source: 'host',
      role: 'host'
    })
  }

  // Add RSVP attendees (same as web app - RSVPs first)
  rsvps.forEach(rsvp => {
    if (!uniqueAttendeeIds.has(rsvp.user_id)) {
      uniqueAttendeeIds.add(rsvp.user_id)
      allAttendees.push({ ...rsvp, source: 'rsvp' })
    }
  })

  // Add event members (crew) if they're not already in RSVPs
  members.forEach(member => {
    if (!uniqueAttendeeIds.has(member.user_id)) {
      uniqueAttendeeIds.add(member.user_id)
      allAttendees.push({ ...member, source: 'crew' })
    }
  })

  return allAttendees
}
```

**Key Logic Fix**: Host is counted exactly once, not duplicated. Same deduplication logic as web app.

### **2. Fixed Crew Service (`packages/shared/src/lib/crewService.ts`)**

#### **Fixed `getCrewMembers` Function:**
```typescript
// ✅ Fixed version - separate queries with proper deduplication
export async function getCrewMembers(crewId: string): Promise<any[]> {
  // Get crew creator info
  const { data: crewData } = await supabase
    .from('crews')
    .select('created_by, created_at')
    .eq('id', crewId)
    .single()

  // Get crew members without problematic joins
  const { data: members } = await supabase
    .from('crew_members')
    .select('*')
    .eq('crew_id', crewId)
    .eq('status', 'accepted')

  // Get user profiles separately
  const userIds = [...members?.map(m => m.user_id) || [], crewData.created_by]
  const { data: userProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds)

  // Combine creator and members with deduplication
  const uniqueMemberIds = new Set()
  const allMembers = []

  // Always include creator first
  if (crewData.created_by) {
    uniqueMemberIds.add(crewData.created_by)
    allMembers.push({
      user_id: crewData.created_by,
      role: 'host',
      is_creator: true,
      user_profiles: userProfiles?.find(p => p.user_id === crewData.created_by)
    })
  }

  // Add other members (skip if already added as creator)
  members?.forEach(member => {
    if (!uniqueMemberIds.has(member.user_id)) {
      uniqueMemberIds.add(member.user_id)
      allMembers.push({
        ...member,
        is_creator: false,
        user_profiles: userProfiles?.find(p => p.user_id === member.user_id)
      })
    }
  })

  return allMembers
}
```

#### **Fixed Member Count Calculation:**
```typescript
// ✅ Fixed getUserCrews and getCrewById functions
// OLD (incorrect): memberCount + (crew.created_by === targetUserId ? 0 : 1)
// NEW (correct): memberCount + 1  // Creator always counted
```

### **3. Enhanced Mobile UI**

#### **Added UserAvatar Component (`apps/mobile/src/components/UserAvatar.tsx`):**
- Displays actual user avatar images from `avatar_url`
- Graceful fallback to initials if image fails to load
- Multiple sizes (xs, sm, md, lg, xl) matching web app
- Proper styling with glassmorphism theme

#### **Updated EventDetailScreen (`apps/mobile/src/screens/EventDetailScreen.tsx`):**
- Added "Who's Going" section with correct attendee counting
- Displays all event attendees with roles (Host 👑, Co-Host ⭐, Attendee)
- Shows invitation source (RSVP, Crew, Host)
- Real user avatars with fallback to initials
- Nickname display in gold italic text
- Responsive design matching app's glassmorphism theme

#### **Updated CrewDetailScreen (`apps/mobile/src/screens/CrewDetailScreen.tsx`):**
- Fixed crew member display with correct counting logic
- Real user avatars instead of generic person icons
- Proper role display (Host 👑, Co-Host ⭐, Member)
- Nickname display in gold italic text
- No duplicate counting of crew creator

## 📁 **Files Modified**

### **1. Core Fixes:**
- `packages/shared/src/lib/eventService.ts` - Fixed `getEventById`, added `getEventMembers`
- `packages/shared/src/lib/crewService.ts` - Fixed `getCrewMembers` with proper deduplication

### **2. Mobile UI Components:**
- `apps/mobile/src/components/UserAvatar.tsx` - New component for displaying user avatars

### **3. Mobile UI Enhancements:**
- `apps/mobile/src/screens/EventDetailScreen.tsx` - Added attendees display with real avatars
- `apps/mobile/src/screens/CrewDetailScreen.tsx` - Updated with real avatars and fixed counting

### **3. Documentation Updates:**
- `MOBILE_DATABASE_REFERENCE.md` - Updated with correct query patterns and fix documentation
- `thirstee-monorepo-mobile-prd.md` - Updated with comprehensive fix details
- `MOBILE_DATABASE_FIX_SUMMARY.md` - This comprehensive summary document

### **4. Test File Created:**
- `test-mobile-event-fix.js` - Test script to verify the fixes work

## 🧪 **Testing**

### **Expected Results After Fixes:**
✅ No more `PGRST200` foreign key relationship errors
✅ Event details load successfully in mobile app
✅ Creator profiles display correctly
✅ EventDetailScreen works without crashes and shows all attendees
✅ CrewDetailScreen displays crew members properly
✅ "Who's Going" section shows hosts, co-hosts, and attendees
✅ All event and crew functionality restored

### **Test Commands:**
```bash
# Start mobile app
cd apps/mobile && npm start

# Run type checking (should pass)
cd apps/mobile && npm run type-check

# Test the fixes (if needed)
node test-mobile-event-fix.js
```

### **Manual Testing Checklist:**
- [ ] Open any event → EventDetailScreen loads without errors
- [ ] Verify "Who's Going" section displays attendees with correct count (no duplicates)
- [ ] Check host shows with 👑 crown icon (counted once)
- [ ] Verify co-hosts show with ⭐ star icon
- [ ] Verify real user avatars display (not just initials)
- [ ] Check nicknames display in gold italic text
- [ ] Open any crew → CrewDetailScreen shows members
- [ ] Verify crew host shows with 👑 crown icon (counted once, not duplicated)
- [ ] Check real member avatars display instead of generic person icons
- [ ] **Verify crew member count matches between stats and member list**
- [ ] **Check that creator is always counted in member count (+1)**
- [ ] Verify crew member count is correct across all screens (Profile, CrewDetail, etc.)

## 🎯 **Impact**

These fixes resolve critical mobile app issues where:
- Event detail screens were crashing with database errors
- Crew detail screens couldn't load member information
- Users couldn't see who was attending events
- Users couldn't see crew member lists
- The app was unusable for core event and crew functionality

The solutions maintain the same API interfaces while using more robust data fetching patterns that work with the actual database schema. The mobile app now provides full feature parity with the web app for viewing event attendees and crew members.

## 📚 **Best Practices Established**

### **DO:**
✅ Use separate queries when no direct foreign key exists  
✅ Handle missing profile data gracefully with fallbacks  
✅ Test database relationships before implementing joins  
✅ Use proper error handling for missing data  

### **DON'T:**
❌ Assume foreign key relationships exist without verification  
❌ Use foreign key hints for non-existent relationships  
❌ Ignore database schema constraints  
❌ Skip fallback handling for missing related data  

## 🔄 **Future Considerations**

If direct joins between `events` and `user_profiles` are frequently needed, consider:
1. Creating a database view that pre-joins the tables
2. Adding a stored procedure for common query patterns
3. Using the existing RPC functions that handle these relationships correctly

However, the current separate query approach is more maintainable and less prone to schema-related errors.
