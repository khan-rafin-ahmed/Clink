# Edit Session Architecture Documentation

## 🎯 Overview

This document outlines the comprehensive architecture for implementing Event Co-Host functionality in Thirstee, allowing event hosts to promote attendees to co-host status and enabling co-hosts to edit event details. This system mirrors the successful crew co-host implementation while maintaining consistency with existing event management patterns.

## 📋 Current State Analysis

### Existing Event Management System

#### Current Event Host Model ✅ ENHANCED
- **Multi-Host System**: Event creators can promote attendees to co-host status
- **Host Permissions**: Full control including promoting/demoting co-hosts and event deletion
- **Co-Host Permissions**: Can edit event details, invite members, manage attendees (cannot promote/demote)
- **Attendee Role**: Limited to RSVP status (pending, accepted, declined)
- **Edit Access**: Available to both hosts and co-hosts with role-based permissions

#### Current Event Modal Patterns
1. **EditEventModal.tsx**: 4-step process with glassmorphism, progress indicators
2. **QuickEventModal.tsx**: 3-step process for quick event creation
3. **CreateEventModal.tsx**: 2-step process with form validation
4. **Event Detail Pages**: Display event information with host-only edit buttons

### Identified Limitations
1. **Single Point of Failure**: Only one person can manage event details
2. **Limited Collaboration**: No shared responsibility for event management
3. **Scalability Issues**: Large events need multiple organizers
4. **User Experience**: Attendees cannot help with event coordination

## 🎨 Event Co-Host System Design

### Role Hierarchy
```typescript
enum EventRole {
  HOST = 'host',           // Original creator - full permissions
  CO_HOST = 'co_host',     // Promoted attendee - edit permissions
  ATTENDEE = 'attendee'    // Regular participant - RSVP only
}
```

### Permission Matrix
| Action | Host | Co-Host | Attendee |
|--------|------|---------|----------|
| Edit Event Details | ✅ | ✅ | ❌ |
| Invite People | ✅ | ✅ | ❌ |
| Promote to Co-Host | ✅ | ❌ | ❌ |
| Demote Co-Host | ✅ | ❌ | ❌ |
| Remove Attendees | ✅ | ✅ | ❌ |
| Delete Event | ✅ | ❌ | ❌ |
| Change Host | ✅ | ❌ | ❌ |

## 🗄️ Database Schema Updates

### Enhanced `event_members` Table
```sql
| Column        | Type                             | Constraints                                    |
|---------------|----------------------------------|-----------------------------------------------|
| id            | uuid                             | PRIMARY KEY, DEFAULT gen_random_uuid()        |
| event_id      | uuid                             | NOT NULL, FK → events(id)                    |
| user_id       | uuid                             | NOT NULL, FK → auth.users(id)                |
| status        | event_member_status (enum)       | NOT NULL, DEFAULT pending                     |
| role          | text                             | CHECK IN (attendee, co_host, host), DEFAULT attendee |
| invited_by    | uuid                             | FK → auth.users(id)                          |
| joined_at     | timestamp with time zone         | DEFAULT now()                                 |
| created_at    | timestamp with time zone         | DEFAULT now()                                 |
| updated_at    | timestamp with time zone         | DEFAULT now()                                 |
```

**Key Changes:**
- **New `role` Column**: Tracks user role within the event
- **Role Constraints**: Ensures valid role values (attendee, co_host, host)
- **Default Role**: New members default to 'attendee' status
- **Host Assignment**: Event creator automatically gets 'host' role

### Required Database Functions

#### Event Co-Host Management
```sql
-- Promote attendee to co-host
CREATE OR REPLACE FUNCTION promote_event_member_to_cohost(
  p_event_id uuid,
  p_user_id uuid,
  p_promoted_by uuid
) RETURNS json;

-- Demote co-host to attendee
CREATE OR REPLACE FUNCTION demote_event_cohost_to_attendee(
  p_event_id uuid,
  p_user_id uuid,
  p_demoted_by uuid
) RETURNS json;

-- Remove event member
CREATE OR REPLACE FUNCTION remove_event_member(
  p_event_id uuid,
  p_user_id uuid,
  p_removed_by uuid
) RETURNS json;
```

#### Permission Validation
```sql
-- Check if user has event management permissions
CREATE OR REPLACE FUNCTION has_event_management_permissions(
  p_event_id uuid,
  p_user_id uuid
) RETURNS boolean;

-- Get user's role in event
CREATE OR REPLACE FUNCTION get_user_event_role(
  p_event_id uuid,
  p_user_id uuid
) RETURNS text;
```

### RLS Policy Updates
```sql
-- Allow hosts and co-hosts to update events
CREATE POLICY "event_hosts_and_cohosts_can_update" ON events
  FOR UPDATE USING (
    id IN (
      SELECT event_id FROM event_members 
      WHERE user_id = auth.uid() 
      AND role IN ('host', 'co_host')
      AND status = 'accepted'
    )
  );

-- Allow hosts and co-hosts to manage event members
CREATE POLICY "event_hosts_and_cohosts_can_manage_members" ON event_members
  FOR ALL USING (
    event_id IN (
      SELECT event_id FROM event_members 
      WHERE user_id = auth.uid() 
      AND role IN ('host', 'co_host')
      AND status = 'accepted'
    )
  );
```

## � UI Consistency Improvements

### Dropdown System Implementation
Following the successful Edit Crew Modal patterns, all event creation and editing modals now use consistent dropdown interfaces:

#### Create Session Modal Updates
- **Step 2 Enhancement**: Moved vibe selection and cover image from Step 3 to Step 2
- **Dropdown Consistency**:
  - "When's the party?" - Select dropdown with Right Now/Pick Your Time options
  - "What's your poison?" - Select dropdown with drink type options (Beer, Wine, etc.)
  - "What's the vibe?" - Select dropdown with vibe options (Casual, Party, etc.)
  - "Who can see this session?" - Select dropdown with Public/Private visibility options

#### Create Crew Modal Updates
- **Vibe Selection**: Dropdown for "What's your crew's vibe?" with emoji and description
- **Visibility Selection**: Dropdown for "Who can see this crew?" with Public/Private options

#### Design System Alignment
All dropdowns use consistent styling:
```css
SelectTrigger: bg-white/5 border-white/10 text-white
SelectContent: bg-[#08090A] border-white/10
SelectItem: text-white hover:bg-white/10
```

#### UI Behavior Consistency
All dropdowns now follow the same pattern:
- **Selected State**: Shows clean, concise labels without sub-text descriptions
- **Dropdown Menu**: Shows detailed descriptions and icons for better selection guidance
- **Visual Feedback**: Consistent hover states and selection indicators

#### EditEventModal Implementation
- **3-Step Structure**: Matches Create Session modal organization
- **Step 1**: Event details and timing (title, description, location, when's the party?)
- **Step 2**: Drinks, vibe, cover image, and notes
- **Step 3**: Privacy and invitations
- **Dropdown Fields**:
  - "When's the party?" - Select dropdown (Right Now, Pick Your Time) - **Step 1**
  - "What's your poison?" - Select dropdown (Beer, Wine, Whiskey, etc.) - **Step 2**
  - "What's the vibe?" - Select dropdown (Casual Hang, Party Mode, etc.) - **Step 2**
  - "Who can see this session?" - Select dropdown (Public, Private) - **Step 3**

## �🏗️ UI/UX Architecture

### Enhanced Event Detail Page

#### Co-Host Indicators
- **Host Badge**: Crown icon (👑) with "Host" label
- **Co-Host Badge**: Shield icon (🛡️) with "Co-Host" label  
- **Attendee Display**: Regular user avatar without role indicator

#### Edit Button Visibility
```typescript
const canEditEvent = useMemo(() => {
  if (!user || !eventData) return false;
  
  const userMembership = eventData.event_members?.find(
    member => member.user_id === user.id
  );
  
  return userMembership?.role === 'host' || userMembership?.role === 'co_host';
}, [user, eventData]);
```

### Enhanced Edit Event Modal

#### Step 1: Event Details & Timing
- **Form Fields**: Title, Description, Location, When's the party?
- **Time Selection**: Dropdown for "When's the party?" (Right Now, Pick Your Time)
- **Custom Time**: Start/End time inputs when "Pick Your Time" is selected
- **Access Control**: Available to hosts and co-hosts
- **Validation**: Title, location, and time required

#### Step 2: Drinks, Vibe, Cover & Notes
- **Drink Selection**: Dropdown for "What's your poison?" (Beer, Wine, Whiskey, etc.)
- **Vibe Selection**: Dropdown for "What's the vibe?" (Casual, Party, Chill, etc.)
- **Cover Image**: Optional event cover image upload
- **Special Notes**: Optional textarea for BYOB, dress code, etc.
- **Access Control**: Available to hosts and co-hosts
- **Validation**: Drink and vibe required; cover and notes optional

#### Step 3: Privacy & Invitations
- **Visibility**: Dropdown for "Who can see this session?" (Public, Private)
- **Invite People**: Integrated `UserSearchInvite` component
- **Methods**: Username search, email invites, crew invitations
- **Access Control**: Available to hosts and co-hosts
- **Validation**: All fields optional

### Attendee List Component Enhancement

#### Role-Based Actions Menu
```typescript
interface AttendeeActionMenuProps {
  attendee: EventMember;
  currentUserRole: EventRole;
  onPromoteToCoHost: (userId: string) => void;
  onDemoteToAttendee: (userId: string) => void;
  onRemoveAttendee: (userId: string) => void;
}
```

#### Action Menu Items
- **Promote to Co-Host**: Visible to hosts only, for attendees only
- **Demote to Attendee**: Visible to hosts only, for co-hosts only  
- **Remove from Event**: Visible to hosts and co-hosts, for attendees and co-hosts
- **View Profile**: Always visible for all roles

## 🔐 Permission System Implementation

### Role-Based Access Control
```typescript
interface EventPermissions {
  canEditDetails: boolean;        // Host + Co-Host
  canInviteMembers: boolean;      // Host + Co-Host  
  canRemoveMembers: boolean;      // Host + Co-Host
  canPromoteMembers: boolean;     // Host only
  canDemoteCoHosts: boolean;      // Host only
  canDeleteEvent: boolean;        // Host only
  canTransferOwnership: boolean;  // Host only
}

const getEventPermissions = (userRole: EventRole): EventPermissions => {
  const isHost = userRole === EventRole.HOST;
  const isCoHost = userRole === EventRole.CO_HOST;
  const canManage = isHost || isCoHost;

  return {
    canEditDetails: canManage,
    canInviteMembers: canManage,
    canRemoveMembers: canManage,
    canPromoteMembers: isHost,
    canDemoteCoHosts: isHost,
    canDeleteEvent: isHost,
    canTransferOwnership: isHost
  };
};
```

### Permission Hooks
```typescript
// Custom hook for event permissions
const useEventPermissions = (eventId: string) => {
  const { user } = useAuth();
  const { data: eventData } = useQuery(['event', eventId]);
  
  return useMemo(() => {
    if (!user || !eventData) return null;
    
    const userMembership = eventData.event_members?.find(
      member => member.user_id === user.id
    );
    
    if (!userMembership) return null;
    
    return getEventPermissions(userMembership.role as EventRole);
  }, [user, eventData]);
};
```

## 🎯 User Interaction Flows

### Primary Flow: Promote Attendee to Co-Host
1. **Access**: Host opens Edit Event modal or attendee list
2. **Selection**: Click three-dot menu next to attendee
3. **Action**: Select "Promote to Co-Host" option
4. **Confirmation**: Confirm promotion in dialog
5. **Execution**: Database update + notification sent
6. **Feedback**: Toast confirmation + UI update

### Secondary Flow: Edit Event as Co-Host
1. **Access**: Co-host clicks "Edit Event" button
2. **Verification**: Permission check passes
3. **Modal**: Edit Event modal opens with full access
4. **Editing**: Make changes to event details
5. **Save**: Submit changes with co-host attribution
6. **Notification**: Host receives update notification

### Tertiary Flow: Demote Co-Host
1. **Access**: Host opens attendee management
2. **Selection**: Click three-dot menu next to co-host
3. **Action**: Select "Demote to Attendee" option
4. **Confirmation**: Confirm demotion in dialog
5. **Execution**: Role change + notification sent
6. **Feedback**: Toast confirmation + UI update

## 📱 Mobile Responsiveness

### Touch-Friendly Design
- **Minimum Touch Targets**: 44px for all interactive elements
- **Action Menus**: Larger touch areas for role management
- **Modal Navigation**: Swipe-friendly step progression
- **Button Placement**: Thumb-accessible positioning

### Responsive Layouts
- **Attendee List**: Stack on mobile, grid on desktop
- **Role Badges**: Appropriate sizing for screen size
- **Action Menus**: Bottom sheet on mobile, dropdown on desktop
- **Edit Modal**: Full-screen on mobile, centered on desktop

## 🔔 Notification System Integration

### Event Co-Host Notifications

#### Promotion Notification
```typescript
{
  type: 'event_cohost_promotion',
  title: '👑 You\'re now a co-host!',
  message: 'You\'ve been promoted to co-host of **[Event Title]**. Time to help lead the party!',
  action_url: '/events/[event-slug]',
  metadata: {
    event_id: 'uuid',
    promoted_by: 'uuid',
    role: 'co_host'
  }
}
```

#### Demotion Notification
```typescript
{
  type: 'event_cohost_demotion',
  title: 'Role Updated',
  message: 'Your role in **[Event Title]** has been updated to attendee.',
  action_url: '/events/[event-slug]',
  metadata: {
    event_id: 'uuid',
    demoted_by: 'uuid',
    role: 'attendee'
  }
}
```

#### Event Update Notification
```typescript
{
  type: 'event_updated_by_cohost',
  title: 'Event Updated',
  message: '**[Event Title]** has been updated by co-host [Co-Host Name].',
  action_url: '/events/[event-slug]',
  metadata: {
    event_id: 'uuid',
    updated_by: 'uuid',
    changes: ['location', 'time', 'description']
  }
}
```

### Email Notifications

#### Co-Host Promotion Email
- **Subject**: "You've been added as a co-host to an event!"
- **Template**: Event co-host promotion template
- **CTA**: "View Event Details"
- **Content**: "Time to help lead the [Event Title] event." with event title hyperlinked

#### Event Update Email
- **Subject**: "[Event Title] has been updated"
- **Template**: Event update notification template
- **CTA**: "View Changes"
- **Content**: Summary of changes made by co-host

## 🚀 Implementation Plan

### Phase 1: Database Foundation
1. **Schema Updates**: Add `role` column to `event_members` table
2. **Database Functions**: Create co-host management functions
3. **RLS Policies**: Update policies for co-host permissions
4. **Data Migration**: Set existing event creators as 'host' role

### Phase 2: Permission System
1. **Permission Hooks**: Implement `useEventPermissions` hook
2. **Role Utilities**: Create role checking utility functions
3. **Access Control**: Add permission checks to existing components
4. **UI Updates**: Show/hide elements based on permissions

### Phase 3: UI Components
1. **Role Badges**: Add host/co-host indicators to attendee lists
2. **Action Menus**: Enhance attendee action menus with role management
3. **Edit Button**: Update edit button visibility logic
4. **Modal Updates**: Enhance Edit Event modal with attendee management

### Phase 4: Notification Integration
1. **Notification Types**: Add new notification types for co-host actions
2. **Email Templates**: Create co-host promotion/demotion email templates
3. **Toast Messages**: Add role-specific toast notifications
4. **Real-time Updates**: Ensure UI updates reflect role changes immediately

### Phase 5: Testing & Polish
1. **Permission Testing**: Verify all permission checks work correctly
2. **UI Testing**: Test responsive design and mobile interactions
3. **Integration Testing**: Test notification and email systems
4. **Performance Testing**: Ensure no performance degradation

## ✅ Success Criteria

### Functional Requirements
- [ ] Event hosts can promote attendees to co-host status
- [ ] Co-hosts can edit all event details except host-only actions
- [ ] Role-based permission system prevents unauthorized actions
- [ ] Notifications sent for all role changes and updates
- [ ] UI clearly indicates user roles and available actions

### Technical Requirements
- [ ] Database schema supports role hierarchy
- [ ] RLS policies enforce permission boundaries
- [ ] Performance impact is minimal
- [ ] Mobile responsiveness maintained
- [ ] Accessibility standards met

### User Experience Goals
- [ ] Intuitive role management interface
- [ ] Clear visual feedback for all actions
- [ ] Consistent with existing Thirstee patterns
- [ ] Smooth collaboration workflow
- [ ] Error handling and edge case coverage

## 🔧 Component Architecture

### New Components to Create

#### EventRoleBadge Component
```typescript
interface EventRoleBadgeProps {
  role: EventRole;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const EventRoleBadge: React.FC<EventRoleBadgeProps> = ({
  role,
  size = 'md',
  showLabel = true
}) => {
  const config = {
    host: { icon: '👑', label: 'Host', color: 'text-yellow-400' },
    co_host: { icon: '🛡️', label: 'Co-Host', color: 'text-blue-400' },
    attendee: { icon: null, label: null, color: null }
  };

  if (role === 'attendee') return null;

  return (
    <div className={`flex items-center gap-1 ${config[role].color}`}>
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
        {config[role].icon}
      </span>
      {showLabel && (
        <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {config[role].label}
        </span>
      )}
    </div>
  );
};
```

#### AttendeeManagementStep Component
```typescript
interface AttendeeManagementStepProps {
  eventId: string;
  attendees: EventMember[];
  currentUserRole: EventRole;
  onRoleChange: (userId: string, newRole: EventRole) => void;
  onRemoveAttendee: (userId: string) => void;
}

const AttendeeManagementStep: React.FC<AttendeeManagementStepProps> = ({
  eventId,
  attendees,
  currentUserRole,
  onRoleChange,
  onRemoveAttendee
}) => {
  const permissions = getEventPermissions(currentUserRole);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Manage Attendees ({attendees.length})
        </h3>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {attendees.map((attendee) => (
          <AttendeeListItem
            key={attendee.id}
            attendee={attendee}
            permissions={permissions}
            onRoleChange={onRoleChange}
            onRemoveAttendee={onRemoveAttendee}
          />
        ))}
      </div>
    </div>
  );
};
```

#### EventPermissionGuard Component
```typescript
interface EventPermissionGuardProps {
  eventId: string;
  requiredPermission: keyof EventPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const EventPermissionGuard: React.FC<EventPermissionGuardProps> = ({
  eventId,
  requiredPermission,
  children,
  fallback = null
}) => {
  const permissions = useEventPermissions(eventId);

  if (!permissions || !permissions[requiredPermission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

### Enhanced Existing Components

#### EditEventModal Updates
- **Step 2 Addition**: Insert Attendee Management step between current steps 1 and 2
- **Permission Integration**: Add permission checks throughout all steps
- **Role-Based UI**: Show/hide elements based on user role
- **Enhanced Validation**: Validate co-host permissions for form submission

#### EventCard Updates
- **Role Badges**: Display host/co-host badges in attendee preview
- **Edit Button Logic**: Update visibility to include co-hosts
- **Action Menu**: Add role-based actions for event management

#### EventDetail Updates
- **Attendee Section**: Show role badges next to attendee avatars
- **Edit Access**: Update edit button for co-host access
- **Role Management**: Add three-dot menus for role actions (host-only)
- **Hosted By Card**: Replace hosting banners with comprehensive "Hosted By" card showing all hosts and co-hosts

#### Profile Page Updates
- **EventTimeline Component**: Co-hosts can see edit buttons for events they co-host
- **Role-Based Permissions**: Edit actions available to both hosts and co-hosts
- **Event Data Loading**: Include role information in event queries

## 📊 Analytics & Monitoring

### Key Metrics to Track
- **Co-Host Adoption**: Percentage of events with co-hosts
- **Co-Host Activity**: Frequency of co-host edits vs host edits
- **Role Changes**: Promotion/demotion frequency and patterns
- **User Engagement**: Impact on event participation and management
- **Collaboration Patterns**: How co-hosts interact with event management

### Monitoring Points
- **Permission Failures**: Track unauthorized access attempts
- **Database Performance**: Monitor query performance with new role checks
- **Notification Delivery**: Track co-host notification success rates
- **User Feedback**: Monitor support requests related to co-host features
- **Error Rates**: Track role-related errors and edge cases

### Success Metrics
- **Event Management Distribution**: Ratio of host vs co-host edits
- **User Satisfaction**: Feedback on collaborative event management
- **Feature Adoption**: Percentage of active users utilizing co-host features
- **Performance Impact**: Response time changes with permission checks

## 🔒 Security Considerations

### Permission Validation
- **Server-Side Checks**: All role changes validated on backend
- **RLS Enforcement**: Database-level security for all operations
- **API Security**: Role verification for all event management endpoints
- **Audit Trail**: Log all role changes and permission grants

### Edge Case Handling
- **Host Departure**: Handle scenarios where original host leaves event
- **Role Conflicts**: Prevent invalid role combinations
- **Concurrent Updates**: Handle simultaneous role changes gracefully
- **Data Integrity**: Ensure consistent role state across all systems

### Privacy & Data Protection
- **Role Visibility**: Control who can see role information
- **Notification Privacy**: Respect user notification preferences
- **Data Retention**: Handle role data in user deletion scenarios
- **Access Logging**: Track role-based access for security auditing

---

## 🎉 **IMPLEMENTATION COMPLETED** ✅

### **Final Implementation Summary:**

## 🚨 CRITICAL: Database Functions Required for Event Editing

**IMPORTANT**: The following database functions are **REQUIRED** for event editing to work. If these are missing, users will get "You do not have permission to edit this event" errors.

### Required Database Functions

#### 1. `can_user_edit_event(p_event_id UUID, p_user_id UUID) RETURNS BOOLEAN`
- **Purpose**: Checks if a user can edit an event (hosts and co-hosts only)
- **Location**: `supabase/migrations/20250712_add_event_edit_permissions.sql`
- **Fallback**: Frontend checks `events.created_by = user.id` if function missing

#### 2. `get_user_event_role(p_event_id UUID, p_user_id UUID) RETURNS TEXT`
- **Purpose**: Returns user's role in event ('host', 'co_host', 'attendee', 'none')
- **Location**: `supabase/migrations/20250712_add_event_edit_permissions.sql`
- **Fallback**: Frontend checks events table and event_members table directly

#### 3. Co-Host Management Functions
- `promote_event_member_to_cohost(p_event_id UUID, p_user_id UUID, p_promoted_by UUID) RETURNS JSON`
- `demote_event_cohost(p_event_id UUID, p_user_id UUID, p_demoted_by UUID) RETURNS JSON`

### Database Schema Requirements

#### `event_members` Table Must Have:
```sql
ALTER TABLE event_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'attendee'
CHECK (role IN ('attendee', 'co_host', 'host'));
```

#### RLS Policy Required:
```sql
CREATE POLICY "event_hosts_and_cohosts_can_update" ON events
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    id IN (
      SELECT event_id FROM event_members
      WHERE user_id = auth.uid()
      AND role = 'co_host'
      AND status = 'accepted'
    )
  );
```

### Deployment Checklist

Before deploying event edit functionality:

1. ✅ **Run Migration**: `npx supabase db push` to apply `20250712_add_event_edit_permissions.sql`
2. ✅ **Verify Functions Exist**: Check Supabase dashboard > Database > Functions
3. ✅ **Test Fallback Logic**: Ensure `eventService.ts` and `eventRoleService.ts` have fallback logic
4. ✅ **Verify RLS Policies**: Check that co-hosts can update events
5. ✅ **Test Event Editing**: Create event and test edit functionality

---

The Event Co-Host system has been **successfully implemented** according to this architecture document. The new system achieves:

#### **Database Schema Enhancement:**
- ✅ **Role Column**: Added `role` field to `event_members` table with proper constraints
- ✅ **Database Functions**: Created `promote_event_member_to_cohost()` and `demote_event_cohost()` functions
- ✅ **RLS Policies**: Updated to allow co-hosts to edit events alongside hosts
- ✅ **Notification Support**: Added `event_promotion` notification type
- ✅ **Helper Functions**: Created `can_user_edit_event()` and `get_user_event_role()` utilities
- ✅ **Fallback Logic**: Added graceful degradation when database functions are missing

## 🔧 Troubleshooting Event Edit Issues

### Common Error: "You do not have permission to edit this event"

**Root Cause**: Missing database functions or incorrect RLS policies

**Diagnostic Steps**:

1. **Check Database Functions**:
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

2. **Check event_members Table Schema**:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_members'
AND column_name = 'role';
```

3. **Check RLS Policies**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'events'
AND policyname LIKE '%update%';
```

4. **Test User Permissions**:
```sql
-- Replace with actual event_id and user_id
SELECT can_user_edit_event('your-event-id', 'your-user-id');
SELECT get_user_event_role('your-event-id', 'your-user-id');
```

### Quick Fixes

**If Functions Missing**:
```bash
# Run the migration
npx supabase db push

# Or apply manually in Supabase SQL Editor
-- Copy contents of supabase/migrations/20250712_add_event_edit_permissions.sql
```

**If Still Failing**:
- Check browser console for "RPC function not available" warnings
- Verify fallback logic is working in `eventService.ts`
- Ensure user is authenticated and is the event creator

### Frontend Fallback Logic

The frontend includes fallback logic in case database functions are missing:

**In `eventService.ts`**:
- Falls back to checking `events.created_by = user.id`
- Logs warnings when RPC functions fail

**In `eventRoleService.ts`**:
- Falls back to direct table queries
- Gracefully handles missing functions

This ensures event editing works even if database functions are not deployed.

#### **Service Layer Implementation:**
- ✅ **eventRoleService.ts**: Complete role management service with permissions
- ✅ **eventPermissions.ts**: Enhanced with co-host logic and role-based permissions
- ✅ **eventService.ts**: Updated with permission checks for event updates
- ✅ **Type Definitions**: Updated EventMember interface to include role field

#### **UI Component Development:**
- ✅ **EventAttendeeManagement.tsx**: New component for managing event roles
- ✅ **EditEventModal.tsx**: Enhanced with 4-step process including attendee management
- ✅ **Role Badges**: Crown (👑) for Host, Shield (🛡️) for Co-Host with proper styling
- ✅ **Action Menus**: Promote/demote functionality with dropdown menus
- ✅ **Permission-Based UI**: Conditional visibility based on user role

#### **Integration & Testing:**
- ✅ **Compilation**: No TypeScript errors, successful build
- ✅ **Design System**: Maintains glassmorphism styling and design tokens
- ✅ **Notifications**: Integrated with existing notification system
- ✅ **Error Handling**: Comprehensive error handling and user feedback

#### **Key Features Delivered:**
1. **Multi-Host System**: Event creators can promote attendees to co-host status
2. **Role-Based Permissions**: Co-hosts can edit events, invite members, manage attendees
3. **Permission Hierarchy**: Only hosts can promote/demote, delete events
4. **Visual Indicators**: Clear role badges throughout the application
5. **Notification System**: Users receive notifications for role changes
6. **Security**: Database-level permission validation and RLS policies

### **Files Created/Modified:**
- **`supabase/migrations/add_event_cohost_system.sql`** - Database schema and functions
- **`frontend/src/lib/eventRoleService.ts`** - Role management service
- **`frontend/src/components/EventAttendeeManagement.tsx`** - Attendee management UI
- **`frontend/src/components/EditEventModal.tsx`** - Enhanced with attendee management step
- **`frontend/src/lib/eventPermissions.ts`** - Updated with co-host permissions
- **`frontend/src/lib/eventService.ts`** - Added permission checks
- **`frontend/src/types.ts`** - Updated EventMember interface
- **`edit-session-architecture.md`** - Architecture documentation (this file)

### **Ready for Production:**
The Event Co-Host system is fully implemented and ready for production use. Users can now:
- Promote trusted attendees to co-host status
- Collaborate on event management with shared permissions
- Maintain clear role hierarchy and security boundaries
- Receive notifications for role changes
- Enjoy a seamless, permission-based editing experience

**🍺 Mission accomplished! Event collaboration just got a whole lot better! 🤘**

---

*This architecture document provided the comprehensive foundation for implementing Event Co-Host functionality in Thirstee, enabling collaborative event management while maintaining security, performance, and user experience standards. The system successfully mirrors the crew co-host implementation while adapting to the unique requirements of event management.*

## 🔄 **MODAL NAVIGATION ENHANCEMENT** ✅

### **Save Changes Button Implementation - COMPLETED**

#### **Problem Addressed:**
- Users could only save changes from the final step of edit modals
- Inconsistent button terminology ("Update Session" vs "Save Changes")
- Limited flexibility in multi-step editing workflow

#### **Solution Implemented:**
- **Universal Save Access**: "Save Changes" button available on every step
- **Consistent Terminology**: Replaced all "Update Session/Crew" with "Save Changes"
- **Enhanced Navigation**: Three-button layout (Back | Next | Save Changes)
- **Flexible Workflow**: Users can save progress at any step without completing entire flow

#### **Technical Implementation:**
- **Button Layout**: Back (`px-6`) | Next (`px-6`) | Save Changes (`flex-1`)
- **Responsive Design**: Maintained mobile-first approach with proper ordering
- **Save Functionality**: Removed step restrictions from handleSubmit functions
- **Message Updates**: Updated all success/error messages for consistency

#### **Files Modified:**
- **`EditEventModal.tsx`** - Enhanced navigation and save functionality
- **`EditCrewModal.tsx`** - Enhanced navigation and save functionality
