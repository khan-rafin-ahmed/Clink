# Edit Session Architecture Documentation

## 🎯 Overview

This document outlines the comprehensive architecture for implementing Event Co-Host functionality in Thirstee, allowing event hosts to promote attendees to co-host status and enabling co-hosts to edit event details. This system mirrors the successful crew co-host implementation while maintaining consistency with existing event management patterns.

## 📋 Current State Analysis

### Existing Event Management System

#### Current Event Host Model
- **Single Host**: Only the event creator can edit event details
- **Host Permissions**: Full control over event settings, attendee management, and event lifecycle
- **Attendee Role**: Limited to RSVP status (pending, accepted, declined)
- **Edit Access**: Restricted to original event creator only

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
- **Subject**: "🎉 You're now a co-host of [Event Title]!"
- **Template**: Event co-host promotion template
- **CTA**: "View Event Details"
- **Content**: Role explanation and permissions overview

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

*This architecture document provides the comprehensive foundation for implementing Event Co-Host functionality in Thirstee, enabling collaborative event management while maintaining security, performance, and user experience standards. The system mirrors the successful crew co-host implementation while adapting to the unique requirements of event management.*
