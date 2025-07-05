# Invite People Architecture Documentation

## Overview
This document outlines the complete architecture for the "Invite People" functionality implemented in Thirstee. The system allows users to invite both individual users and entire crews to events during both event creation and editing flows.

## Core Components

### 1. Main UI Components

#### UserSearchInvite Component
**Location**: `frontend/src/components/shared/UserSearchInvite.tsx`

**Purpose**: Central component for searching and selecting users/crews for invitations

**Key Features**:
- Real-time user search with debounced input (300ms delay)
- Crew selection from user's own crews
- Selected users/crews management with removal capability
- Existing attendees display to prevent duplicate invitations
- Glassmorphism UI with loading states

**Props Interface**:
```typescript
interface UserSearchInviteProps {
  onUserSelect: (user: UserProfile) => void
  onCrewSelect: (crew: Crew) => void
  selectedUsers: UserProfile[]
  selectedCrews: Crew[]
  onRemoveUser: (userId: string) => void
  onRemoveCrew: (crewId: string) => void
  existingAttendees?: UserProfile[]
  loadingAttendees?: boolean
  className?: string
}
```

**Search Logic**:
- Searches across `display_name`, `nickname`, and `username` fields
- Excludes current user from results
- Filters out already selected users and existing attendees
- Limits results to 10 users per search

#### MemberList Component
**Location**: `frontend/src/components/shared/MemberList.tsx`

**Purpose**: Displays crew members with management actions

**Features**:
- Clickable user avatars with navigation to profiles
- Role-based icons (Crown for creator, Shield for co-host, User for member)
- Management dropdown with promote/demote/remove actions
- Responsive design with glassmorphism styling

#### InviteLinkGenerator Component
**Location**: `frontend/src/components/shared/InviteLinkGenerator.tsx`

**Purpose**: Generates shareable invite links for crews

**Features**:
- Async link generation with loading states
- One-click copy to clipboard functionality
- Toast notifications for user feedback

### 2. Modal Integration

#### EditEventModal Integration
**Location**: `frontend/src/components/EditEventModal.tsx`

**Implementation**: Step 4 of the edit flow
- Loads existing attendees to prevent duplicate invitations
- Handles both user and crew invitations
- Shows invitation count in success messages
- Preserves existing invitation state when editing

#### QuickEventModal Integration (Enhanced)
**Location**: `frontend/src/components/QuickEventModal.tsx`

**Implementation**: Step 3 of the creation flow (alongside privacy)
- Enhanced existing crew invitation functionality
- Added individual user invitation capability via UserSearchInvite component
- Updated 3-step flow: Details/Time → Drinks/Vibe/Cover/Notes → Privacy/Invitations
- **Step 1 Enhancement**: Moved "When's the party?" to Step 1 alongside basic event details
- **Used in UserProfile**: Main session creation modal with full invitation functionality
- **Custom Trigger Support**: Accepts optional trigger prop for flexible UI integration

#### CreateEventModal Integration (Alternative)
**Location**: `frontend/src/components/CreateEventModal.tsx`

**Implementation**: Step 2 of the creation flow
- Optional invitation step during event creation
- No existing attendees to consider
- Allows skipping invitation step
- **Available but not used**: Complete alternative implementation following same architecture

#### EditCrewModal Integration
**Location**: `frontend/src/components/EditCrewModal.tsx`

**Implementation**: Invite tab within crew management
- Dedicated invitation interface for crew management
- Separate send invitations button
- Integrates with crew member loading

## Backend Services

### 3. Member Management Services

#### memberService.ts
**Location**: `frontend/src/lib/memberService.ts`

**Key Functions**:

```typescript
// Individual user invitation
inviteUserToEvent(eventId: string, userId: string, currentUserId: string)

// Bulk user invitations
bulkInviteUsers(eventId: string, userIds: string[], currentUserId: string)

// Crew member auto-add (accepted status)
bulkAddCrewMembersToEvent(eventId: string, userIds: string[], currentUserId: string)

// Crew member invitations (pending status)
bulkInviteCrewMembersToEvent(eventId: string, userIds: string[], currentUserId: string)
```

**Database Operations**:
- Inserts into `event_members` table with appropriate status
- Links user profiles for complete member data
- Handles both 'pending' and 'accepted' statuses

#### crewService.ts
**Location**: `frontend/src/lib/crewService.ts`

**Key Functions**:

```typescript
// Get user's crews for selection
getUserCrews(userId: string): Promise<Crew[]>

// Invite user to crew
inviteUserToCrew(crewId: string, userId: string): Promise<void>

// Enhanced invite with fallback to share link
inviteUserWithFallback(crewId: string, identifier: string)

// Generate crew invite links
createCrewInviteLink(crewId: string, expiryDays?: number): Promise<string>
```

### 4. Event Invitation Services

#### eventInvitationService.ts
**Location**: `frontend/src/lib/eventInvitationService.ts`

**Primary Function**:
```typescript
sendEventInvitationsToCrew(
  eventId: string, 
  crewId: string, 
  currentUserId: string
): Promise<{ success: boolean; invitedCount: number; message: string }>
```

**Process Flow**:
1. Calls Supabase RPC function `send_event_invitations_to_crew`
2. Receives invitation count from database
3. Triggers email notifications if invitations were sent
4. Returns structured response with success status

### 5. Email & Notification System

#### emailService.ts
**Location**: `frontend/src/lib/emailService.ts`

**Key Functions**:
```typescript
sendEventInvitationEmail(recipientEmail: string, invitationData: EventInvitationData)
sendCrewInvitationEmail(recipientEmail: string, invitationData: CrewInvitationData)
```

**Email Templates**:
- Dark-mode design system with glassmorphism
- Mobile-responsive HTML templates
- Branded with Thirstee colors and styling
- Action buttons for accept/decline

#### notificationService.ts
**Location**: `frontend/src/lib/notificationService.ts`

**Features**:
- In-app notification creation
- Push notification support
- Multiple notification types for different invitation scenarios

### 6. Database Functions (RPC)

#### Supabase RPC Functions
**Key Functions**:

```sql
-- Send invitations to crew members
send_event_invitations_to_crew(p_event_id, p_crew_id, p_inviter_id)

-- Send invitations to individual users
send_event_invitations_to_users(p_event_id, p_user_ids, p_inviter_id)

-- Create notifications
create_notification(p_user_id, p_type, p_title, p_message, p_data)
```

**Email Integration**:
- Database functions call Supabase Edge Functions
- Edge Functions integrate with SendGrid for email delivery
- Secure service role key handling for email sending

## Data Flow Architecture

### User Invitation Flow
1. **User Search**: UserSearchInvite component searches user_profiles table
2. **Selection**: Users added to selectedUsers state array
3. **Invitation**: bulkInviteUsers called with selected user IDs
4. **Database**: Records inserted into event_members with 'pending' status
5. **Email**: RPC function triggers email notifications
6. **Feedback**: Toast notification shows invitation count

### Crew Invitation Flow
1. **Crew Selection**: User selects from their own crews via getUserCrews
2. **Crew Processing**: sendEventInvitationsToCrew called with crew ID
3. **Member Resolution**: Database RPC resolves crew members
4. **Bulk Invitation**: Individual invitations created for each crew member
5. **Email Batch**: Email notifications sent to all invited crew members
6. **Response**: Success message with invited member count

### Email Notification Flow
1. **Trigger**: Database RPC functions detect new invitations
2. **Template**: Email templates generated with event/crew data
3. **Delivery**: Supabase Edge Function calls SendGrid API
4. **Tracking**: Email delivery status logged for debugging

## State Management

### Component State
```typescript
// UserSearchInvite internal state
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState<UserProfile[]>([])
const [userCrews, setUserCrews] = useState<Crew[]>([])
const [isSearching, setIsSearching] = useState(false)
const [showResults, setShowResults] = useState(false)

// Parent component state (EditEventModal/CreateEventModal)
const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
const [selectedCrews, setSelectedCrews] = useState<Crew[]>([])
const [existingAttendees, setExistingAttendees] = useState<UserProfile[]>([])
```

### Event Handlers
```typescript
// User selection handlers
const handleUserSelect = (user: UserProfile) => void
const handleRemoveUser = (userId: string) => void

// Crew selection handlers  
const handleCrewSelect = (crew: Crew) => void
const handleRemoveCrew = (crewId: string) => void
```

## Security Considerations

### Authentication
- All invitation functions require authenticated user
- User ID validation prevents unauthorized invitations
- RLS policies protect sensitive data access

### Privacy
- User search respects profile visibility settings
- Private profiles excluded from search results
- Crew member visibility controlled by crew settings

### Email Security
- Service role keys stored as environment variables
- Email templates sanitize user input
- Rate limiting on email sending functions

## Error Handling

### Frontend Error Handling
- Toast notifications for user feedback
- Loading states during async operations
- Graceful fallbacks for failed operations
- Input validation and sanitization

### Backend Error Handling
- Database constraint validation
- Email delivery failure handling
- RPC function error responses
- Logging for debugging and monitoring

## Performance Optimizations

### Search Optimization
- Debounced search input (300ms delay)
- Limited search results (10 users max)
- Efficient database queries with proper indexing

### State Management
- Minimal re-renders with proper dependency arrays
- Cleanup of timeouts and event listeners
- Efficient filtering of existing attendees

### Email Delivery
- Batch email processing for crew invitations
- Async email sending to prevent UI blocking
- Error isolation to prevent cascade failures

## Modal Consolidation

### QuickEventModal Enhancement
**Decision**: Enhanced QuickEventModal with unified invitation functionality while preserving existing 3-step flow

**Rationale**:
- User wanted to keep existing Create Session flow intact
- Replaced confusing dual crew selection with single unified invitation interface
- Consolidated individual user and crew invitations into one clean UserSearchInvite component
- Maintains existing UI/UX while eliminating confusion

**Changes Made**:
- **Simplified UI**: Replaced dual crew selection with single "Invite People (Optional)" section
- **Unified Interface**: Single UserSearchInvite component handles both users and crews
- **Clean State Management**: Only `selectedUsers` and `selectedCrews` arrays needed
- **Streamlined Logic**: Simplified form submission with unified invitation handling
- **Better UX**: Clear, non-confusing invitation interface in Step 3
- **Step Reorganization**: Moved "When's the party?" to Step 1 for logical grouping with basic event details
- **Dropdown Consistency**: Implemented consistent dropdown UI across all form fields

**Implementation Details**:
- **File**: `frontend/src/components/QuickEventModal.tsx`
- **UI Location**: Step 3 - single unified invitation section
- **State Management**: `selectedUsers[]` and `selectedCrews[]` arrays only
- **Invitation Logic**: Handles both individual users and entire crews seamlessly
- **Reset Handling**: Clean state reset when modal closes

### UI Consistency Improvements (Latest Update)

#### Dropdown System Implementation
Following the Edit Crew Modal patterns, implemented consistent dropdown interfaces across all modals:

**QuickEventModal Updates**:
- **Step 2 Enhancement**: Moved vibe selection and cover image from Step 3 to Step 2
- **Dropdown Fields**:
  - "When's the party?" - Select dropdown (Right Now, Pick Your Time)
  - "What's your poison?" - Select dropdown (Beer, Wine, Whiskey, etc.)
  - "What's the vibe?" - Select dropdown (Casual, Party, Chill, etc.)
  - "Who can see this session?" - Select dropdown (Public, Private)

**CreateCrewModal Updates**:
- "What's your crew's vibe?" - Select dropdown with emoji and descriptions
- "Who can see this crew?" - Select dropdown (Public, Private)

**Design System Alignment**:
All dropdowns use consistent glassmorphism styling matching the Edit Crew Modal patterns.

**Before vs After**:
- **Before**: "Invite Your Crew" + "Invite Individual People" + duplicate crew options = confusing
- **After**: Single "Invite People (Optional)" section with unified search = clean and clear

## Implementation Examples

### Event Creation with Invitations
```typescript
// CreateEventModal.tsx - Step 2 Implementation
{step === 2 && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-2">Invite People (Optional)</h3>
      <p className="text-sm text-muted-foreground">
        Invite individual users and crews to your event. You can skip this step and invite people later.
      </p>
    </div>

    <UserSearchInvite
      onUserSelect={handleUserSelect}
      onCrewSelect={handleCrewSelect}
      selectedUsers={selectedUsers}
      selectedCrews={selectedCrews}
      onRemoveUser={handleRemoveUser}
      onRemoveCrew={handleRemoveCrew}
      existingAttendees={[]}
      loadingAttendees={false}
    />
  </div>
)}
```

### Event Editing with Existing Attendees
```typescript
// EditEventModal.tsx - Step 4 Implementation
{step === 4 && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-2">Invite People (Optional)</h3>
      <p className="text-sm text-muted-foreground">
        Invite individual users and crews to your event. Only newly selected people will receive invitations.
      </p>
    </div>

    <UserSearchInvite
      onUserSelect={handleUserSelect}
      onCrewSelect={handleCrewSelect}
      selectedUsers={selectedUsers}
      selectedCrews={selectedCrews}
      onRemoveUser={handleRemoveUser}
      onRemoveCrew={handleRemoveCrew}
      existingAttendees={existingAttendees}
      loadingAttendees={loadingAttendees}
    />
  </div>
)}
```

### Crew Management Invitations
```typescript
// EditCrewModal.tsx - Invite Tab Implementation
<TabsContent value="invite" className="space-y-6 mt-6">
  <UserSearchInvite
    onUserSelect={handleUserSelect}
    onCrewSelect={handleCrewSelect}
    selectedUsers={selectedUsers}
    selectedCrews={selectedCrews}
    onRemoveUser={handleRemoveUser}
    onRemoveCrew={handleRemoveCrew}
    existingAttendees={[]}
    loadingAttendees={false}
  />

  {/* Send Invitations Button */}
  {(selectedUsers.length > 0 || selectedCrews.length > 0) && (
    <div className="flex justify-end">
      <Button onClick={handleSendInvitations} className="bg-primary hover:bg-primary/90">
        Send {selectedUsers.length + selectedCrews.length} Invitation{selectedUsers.length + selectedCrews.length !== 1 ? 's' : ''}
      </Button>
    </div>
  )}
</TabsContent>
```

## Database Schema

*Complete schema synchronized with thirstee-app-prd.md*

### Core Invitation Tables

#### `public.event_members`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`    | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `invited_by`  | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`      | `text`                           | CHECK in (`pending`, `accepted`, `declined`), DEFAULT `pending`                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.crew_members`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `crew_id`     | `uuid`                           | NOT NULL, FK → `public.crews(id)`                                                 |
| `user_id`     | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `status`      | `crew_member_status` (enum)      | NOT NULL, DEFAULT `'pending'`                                                     |
| `role`        | `text`                           | CHECK IN ('member', 'co_host', 'host'), DEFAULT `'member'`                       |
| `invited_by`  | `uuid`                           | FK → `auth.users(id)`                                                             |
| `joined_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.notifications`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `user_id`      | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `type`         | `text`                           | CHECK in (`follow_request`,`follow_accepted`,`event_invitation`,`event_update`,`crew_invitation`,`event_rsvp`,`event_reminder`,`crew_invite_accepted`,`event_cancelled`,`event_rating_reminder`) |
| `title`        | `text`                           | NOT NULL                                                                          |
| `message`      | `text`                           | NOT NULL                                                                          |
| `data`         | `jsonb`                          | DEFAULT `{}`                                                                      |
| `read`         | `boolean`                        | DEFAULT `false`                                                                   |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### Supporting Tables

#### `public.crews`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `name`        | `text`                           | NOT NULL                                                                          |
| `vibe`        | `text`                           | CHECK in (`casual`, `party`, `chill`, `wild`, `classy`, `other`), DEFAULT `casual` |
| `visibility`  | `crew_visibility` (enum)         | NOT NULL, DEFAULT `private`                                                       |
| `description` | `text`                           |                                                                                   |
| `created_by`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.crew_invitations`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `crew_id`     | `uuid`                           | NOT NULL, FK → `public.crews(id)`                                                 |
| `invite_code` | `text`                           | NOT NULL, UNIQUE                                                                  |
| `created_by`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `expires_at`  | `timestamp with time zone`       |                                                                                   |
| `max_uses`    | `integer`                        |                                                                                   |
| `current_uses`| `integer`                        | DEFAULT `0`                                                                       |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.user_profiles`
| Column             | Type                             | Constraints                                                                       |
|--------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`               | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `user_id`          | `uuid`                           | UNIQUE, FK → `auth.users(id)`                                                     |
| `username`         | `text`                           | UNIQUE, NOT NULL                                                                  |
| `display_name`     | `text`                           |                                                                                   |
| `bio`              | `text`                           |                                                                                   |
| `avatar_url`       | `text`                           |                                                                                   |
| `favorite_drink`   | `text`                           |                                                                                   |
| `tagline`          | `text`                           |                                                                                   |
| `join_date`        | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `profile_visibility`| `text`                          | CHECK in (`public`,`crew_only`,`private`), DEFAULT `public`                       |
| `show_crews_publicly`| `boolean`                       | DEFAULT `true`                                                                    |
| `nickname`         | `text`                           |                                                                                   |
| `created_at`       | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`       | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### Email & Token Tables

#### `public.invitation_tokens`
| Column            | Type                             | Constraints                                                                       |
|-------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`              | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `token`           | `text`                           | NOT NULL, UNIQUE                                                                  |
| `invitation_type` | `text`                           | NOT NULL, CHECK IN ('event', 'crew')                                             |
| `invitation_id`   | `uuid`                           | NOT NULL                                                                          |
| `action`          | `text`                           | NOT NULL, CHECK IN ('accept', 'decline')                                         |
| `user_id`         | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `expires_at`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `used`            | `boolean`                        | DEFAULT `false`                                                                   |
| `created_at`      | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`      | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.event_invitations`
| Column        | Type                             | Constraints                                                                       |
|---------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`          | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`    | `uuid`                           | NOT NULL, FK → `public.events(id)`                                                |
| `inviter_id`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `invitee_id`  | `uuid`                           | NOT NULL, FK → `auth.users(id)`                                                   |
| `status`      | `text`                           | CHECK in (`pending`, `accepted`, `declined`), DEFAULT `pending`                   |
| `created_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`  | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.events`
| Column           | Type                             | Constraints                                                                       |
|------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`             | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `title`          | `text`                           | NOT NULL                                                                          |
| `date_time`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `location`       | `text`                           | NOT NULL                                                                          |
| `notes`          | `text`                           |                                                                                   |
| `created_by`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `drink_type`     | `text`                           | CHECK in (`beer`,`wine`,`whiskey`,`cocktails`,`shots`,`mixed`,`other`) or NULL    |
| `vibe`           | `text`                           | CHECK in (`casual`,`party`,`chill`,`wild`,`classy`,`shots`,`other`) or NULL       |
| `is_public`      | `boolean`                        | DEFAULT `true`                                                                    |
| `event_code`     | `text`                           | UNIQUE, CHECK regex `^[A-Z0-9]{6}$` or NULL                                        |
| `latitude`       | `double precision`               | CHECK -90 ≤ latitude ≤ 90 or NULL                                                 |
| `longitude`      | `double precision`               | CHECK -180 ≤ longitude ≤ 180 or NULL                                              |
| `place_id`       | `text`                           |                                                                                   |
| `place_name`     | `text`                           |                                                                                   |
| `crew_id`        | `uuid`                           | FK → `public.crews(id)`                                                           |
| `place_nickname` | `text`                           |                                                                                   |
| `rsvp_count`     | `integer`                        | DEFAULT `1`                                                                       |
| `public_slug`    | `text`                           |                                                                                   |
| `private_slug`   | `text`                           |                                                                                   |
| `cover_image_url`| `text`                           |                                                                                   |

#### `public.rsvps`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`      | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`       | `rsvp_status` (enum)             | NOT NULL, DEFAULT `'maybe'`                                                       |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### Database Enums & Key Relationships

#### Enums
- **`crew_member_status`**: `pending`, `accepted`, `declined`
- **`crew_visibility`**: `public`, `private`
- **`rsvp_status`**: `going`, `maybe`, `not_going`

#### Core Relationships
1. **Event Members**: `event_members.invited_by` → `auth.users(id)`
2. **Crew Members**: `crew_members.invited_by` → `auth.users(id)`
3. **Event-Crew Link**: `events.crew_id` → `crews(id)`
4. **Notifications**: `notifications.user_id` → `auth.users(id)`

#### `public.events`
| Column           | Type                             | Constraints                                                                       |
|------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`             | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `title`          | `text`                           | NOT NULL                                                                          |
| `date_time`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `location`       | `text`                           | NOT NULL                                                                          |
| `notes`          | `text`                           |                                                                                   |
| `created_by`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `drink_type`     | `text`                           | CHECK in (`beer`,`wine`,`whiskey`,`cocktails`,`shots`,`mixed`,`other`) or NULL    |
| `vibe`           | `text`                           | CHECK in (`casual`,`party`,`chill`,`wild`,`classy`,`shots`,`other`) or NULL       |
| `is_public`      | `boolean`                        | DEFAULT `true`                                                                    |
| `event_code`     | `text`                           | UNIQUE, CHECK regex `^[A-Z0-9]{6}$` or NULL                                        |
| `latitude`       | `double precision`               | CHECK -90 ≤ latitude ≤ 90 or NULL                                                 |
| `longitude`      | `double precision`               | CHECK -180 ≤ longitude ≤ 180 or NULL                                              |
| `place_id`       | `text`                           |                                                                                   |
| `place_name`     | `text`                           |                                                                                   |
| `crew_id`        | `uuid`                           | FK → `public.crews(id)`                                                           |
| `place_nickname` | `text`                           |                                                                                   |
| `rsvp_count`     | `integer`                        | DEFAULT `1`                                                                       |
| `public_slug`    | `text`                           |                                                                                   |
| `private_slug`   | `text`                           |                                                                                   |
| `cover_image_url`| `text`                           |                                                                                   |

#### `public.rsvps`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`      | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`       | `rsvp_status` (enum)             | NOT NULL, DEFAULT `'maybe'`                                                       |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### Database Enums & Relationships

#### Key Enums
- **`crew_member_status`**: `pending`, `accepted`, `declined`
- **`crew_visibility`**: `public`, `private`
- **`rsvp_status`**: `going`, `maybe`, `not_going`

#### Invitation Relationships
1. **Event Members**: `event_members.invited_by` → `auth.users(id)`
2. **Crew Members**: `crew_members.invited_by` → `auth.users(id)`
3. **Event-Crew Link**: `events.crew_id` → `crews(id)`
4. **Notification Target**: `notifications.user_id` → `auth.users(id)`

#### `public.events`
| Column           | Type                             | Constraints                                                                       |
|------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`             | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `title`          | `text`                           | NOT NULL                                                                          |
| `date_time`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `location`       | `text`                           | NOT NULL                                                                          |
| `notes`          | `text`                           |                                                                                   |
| `created_by`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `drink_type`     | `text`                           | CHECK in (`beer`,`wine`,`whiskey`,`cocktails`,`shots`,`mixed`,`other`) or NULL    |
| `vibe`           | `text`                           | CHECK in (`casual`,`party`,`chill`,`wild`,`classy`,`shots`,`other`) or NULL       |
| `is_public`      | `boolean`                        | DEFAULT `true`                                                                    |
| `event_code`     | `text`                           | UNIQUE, CHECK regex `^[A-Z0-9]{6}$` or NULL                                        |
| `latitude`       | `double precision`               | CHECK -90 ≤ latitude ≤ 90 or NULL                                                 |
| `longitude`      | `double precision`               | CHECK -180 ≤ longitude ≤ 180 or NULL                                              |
| `place_id`       | `text`                           |                                                                                   |
| `place_name`     | `text`                           |                                                                                   |
| `crew_id`        | `uuid`                           | FK → `public.crews(id)`                                                           |
| `place_nickname` | `text`                           |                                                                                   |
| `rsvp_count`     | `integer`                        | DEFAULT `1`                                                                       |
| `public_slug`    | `text`                           |                                                                                   |
| `private_slug`   | `text`                           |                                                                                   |
| `cover_image_url`| `text`                           |                                                                                   |

#### `public.rsvps`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`      | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`       | `rsvp_status` (enum)             | NOT NULL, DEFAULT `'maybe'`                                                       |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

#### `public.events`
| Column           | Type                             | Constraints                                                                       |
|------------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`             | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `title`          | `text`                           | NOT NULL                                                                          |
| `date_time`      | `timestamp with time zone`       | NOT NULL                                                                          |
| `location`       | `text`                           | NOT NULL                                                                          |
| `notes`          | `text`                           |                                                                                   |
| `created_by`     | `uuid`                           | FK → `auth.users(id)`                                                             |
| `created_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`     | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `drink_type`     | `text`                           | CHECK in (`beer`,`wine`,`whiskey`,`cocktails`,`shots`,`mixed`,`other`) or NULL    |
| `vibe`           | `text`                           | CHECK in (`casual`,`party`,`chill`,`wild`,`classy`,`shots`,`other`) or NULL       |
| `is_public`      | `boolean`                        | DEFAULT `true`                                                                    |
| `event_code`     | `text`                           | UNIQUE, CHECK regex `^[A-Z0-9]{6}$` or NULL                                        |
| `latitude`       | `double precision`               | CHECK -90 ≤ latitude ≤ 90 or NULL                                                 |
| `longitude`      | `double precision`               | CHECK -180 ≤ longitude ≤ 180 or NULL                                              |
| `place_id`       | `text`                           |                                                                                   |
| `place_name`     | `text`                           |                                                                                   |
| `crew_id`        | `uuid`                           | FK → `public.crews(id)`                                                           |
| `place_nickname` | `text`                           |                                                                                   |
| `rsvp_count`     | `integer`                        | DEFAULT `1`                                                                       |
| `public_slug`    | `text`                           |                                                                                   |
| `private_slug`   | `text`                           |                                                                                   |
| `cover_image_url`| `text`                           |                                                                                   |

#### `public.rsvps`
| Column         | Type                             | Constraints                                                                       |
|----------------|----------------------------------|-----------------------------------------------------------------------------------|
| `id`           | `uuid`                           | PRIMARY KEY, NOT NULL, DEFAULT `gen_random_uuid()`                                |
| `event_id`     | `uuid`                           | FK → `public.events(id)`                                                          |
| `user_id`      | `uuid`                           | FK → `auth.users(id)`                                                             |
| `status`       | `rsvp_status` (enum)             | NOT NULL, DEFAULT `'maybe'`                                                       |
| `created_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |
| `updated_at`   | `timestamp with time zone`       | DEFAULT `now()`                                                                   |

### Database Enums

#### `crew_member_status`
- `pending` - User has been invited but hasn't responded
- `accepted` - User has accepted the crew invitation
- `declined` - User has declined the crew invitation

#### `crew_visibility`
- `public` - Crew is visible to all users
- `private` - Crew is only visible to members

#### `rsvp_status`
- `going` - User confirmed attendance
- `maybe` - User is unsure about attendance
- `not_going` - User declined attendance

### Key Relationships

#### Event Invitation Flow
1. **Direct User Invitations**: `event_members` table with `invited_by` reference
2. **Crew Invitations**: Bulk invitations to all `crew_members` with `accepted` status
3. **Public RSVPs**: `rsvps` table for public event participation
4. **Notifications**: `notifications` table for invitation alerts

#### Crew Management Flow
1. **Crew Creation**: `crews` table with `created_by` as initial host
2. **Member Invitations**: `crew_members` table with `pending` status
3. **Role Management**: `role` field supports `member`, `co_host`, `host` hierarchy
4. **Invite Links**: `crew_invitations` table for shareable invitation codes

#### Email Integration
1. **Tokenized Actions**: `invitation_tokens` table for secure email buttons
2. **Invitation Tracking**: `event_invitations` table for email invitation status
3. **Notification Sync**: Database triggers create notifications for all invitations

### RPC Function Examples

#### send_event_invitations_to_crew
```sql
CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
  p_event_id UUID,
  p_crew_id UUID,
  p_inviter_id UUID
) RETURNS TABLE(invited_count INTEGER) AS $$
DECLARE
  member_record RECORD;
  invitation_count INTEGER := 0;
BEGIN
  -- Insert invitations for crew members not already invited/joined
  FOR member_record IN
    SELECT cm.user_id
    FROM crew_members cm
    WHERE cm.crew_id = p_crew_id
      AND cm.status = 'accepted'
      AND cm.user_id != p_inviter_id
      AND NOT EXISTS (
        SELECT 1 FROM event_members em
        WHERE em.event_id = p_event_id AND em.user_id = cm.user_id
      )
  LOOP
    INSERT INTO event_members (event_id, user_id, invited_by, status)
    VALUES (p_event_id, member_record.user_id, p_inviter_id, 'pending');

    invitation_count := invitation_count + 1;
  END LOOP;

  RETURN QUERY SELECT invitation_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Strategy

### Unit Tests
- Component rendering with different prop combinations
- State management and event handlers
- Search functionality and debouncing
- Error handling and edge cases

### Integration Tests
- Full invitation flow from UI to database
- Email notification delivery
- RPC function behavior
- Authentication and authorization

### E2E Tests
- Complete user journey for event creation with invitations
- Event editing with existing attendees
- Crew management invitation flows
- Email delivery and notification systems

## Monitoring & Analytics

### Key Metrics
- Invitation success/failure rates
- Email delivery rates
- User engagement with invitations
- Search performance and usage patterns

### Logging
- Frontend error logging with Sentry integration
- Backend RPC function execution logs
- Email delivery status tracking
- Performance monitoring for search operations

## Future Enhancements

### Planned Features
1. **Advanced Search**: Filters by location, interests, mutual crews
2. **Invitation Templates**: Custom invitation messages
3. **Bulk Operations**: CSV import for large invitation lists
4. **Analytics**: Invitation acceptance rates and metrics
5. **Integration**: Calendar integration for event reminders

### Technical Improvements
1. **Caching**: Redis caching for frequent searches
2. **Real-time**: WebSocket updates for invitation status
3. **Mobile**: Native push notifications
4. **Offline**: Offline invitation queuing
5. **Testing**: Comprehensive test coverage

## Dependencies

### Frontend Dependencies
- React hooks for state management
- Supabase client for database operations
- Sonner for toast notifications
- Lucide React for icons
- Tailwind CSS for styling

### Backend Dependencies
- Supabase database and RPC functions
- Supabase Edge Functions for email
- SendGrid for email delivery
- PostgreSQL for data storage

## Deployment Considerations

### Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Email Configuration (Server-side)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@thirstee.app
```

### Database Migrations
- RPC function deployments
- Table schema updates
- Index optimizations for search performance
- RLS policy updates for security

## Conclusion

The Invite People architecture provides a comprehensive, scalable solution for user and crew invitations in Thirstee. The modular design allows for easy reuse across different contexts (event creation, event editing, crew management) while maintaining consistent user experience and robust error handling.

The system successfully handles complex scenarios like preventing duplicate invitations, managing crew-based invitations, and providing fallback mechanisms for failed operations. The integration of real-time search, email notifications, and responsive UI creates a seamless invitation experience for users.

Key strengths of this architecture:
- **Reusability**: Single component serves multiple use cases
- **Performance**: Optimized search with debouncing and result limiting
- **User Experience**: Clear feedback and loading states
- **Security**: Proper authentication and privacy controls
- **Scalability**: Efficient database operations and email handling
- **Maintainability**: Clean separation of concerns and comprehensive error handling
