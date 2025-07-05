# Session Modal Architecture Documentation

## 🎯 System Overview

This document provides comprehensive architectural documentation for Thirstee's Session Modal System, encompassing both Create Session (`QuickEventModal.tsx`) and Edit Session (`EditEventModal.tsx`) components. These modals form the core of Thirstee's event creation and management workflow, implementing a consistent 3-step user experience with advanced form validation, file upload capabilities, and seamless integration with the broader event management ecosystem.

## 📋 Current State Analysis

### Modal Implementation Overview

#### QuickEventModal.tsx (Create Session)
- **Purpose**: Primary event creation interface for new sessions
- **File Location**: `frontend/src/components/QuickEventModal.tsx`
- **Integration**: Triggered from main navigation, event cards, and quick-action buttons
- **State Management**: Local useState with form validation and submission handling
- **Key Features**: Real-time validation, cover image upload, user/crew invitations

#### EditEventModal.tsx (Edit Session)
- **Purpose**: Event modification interface for existing sessions
- **File Location**: `frontend/src/components/EditEventModal.tsx`
- **Integration**: Accessible from event detail pages and event cards
- **State Management**: Pre-populated from existing event data with update workflows
- **Key Features**: Data preservation, incremental updates, attendee management

### Recent Architectural Evolution

#### 3-Step Structure Implementation
The modal system underwent significant reorganization to achieve optimal user experience:

**Previous Structure (4 Steps)**:
```
Step 1: Basic Details
Step 2: Time & Location  
Step 3: Vibe & Cover
Step 4: Privacy & Invitations
```

**Current Structure (3 Steps)**:
```
Step 1: Event Details & Timing
Step 2: Drinks, Vibe, Cover & Notes
Step 3: Privacy & Invitations
```

#### Field Reorganization Rationale
- **Step 1 Enhancement**: Consolidated core event definition (what, where, when)
- **Step 2 Optimization**: Grouped all event characteristics and customization
- **Step 3 Streamlining**: Focused purely on privacy and social sharing

### Integration Points

#### Event Management System
- **Event Service**: `frontend/src/lib/eventService.ts`
- **Database Integration**: Direct Supabase integration with RLS policies
- **File Storage**: Supabase Storage for cover image management
- **Real-time Updates**: Live synchronization with event data

#### User Management Integration
- **Authentication**: Auth context integration for user validation
- **Profile System**: User profile data for event attribution
- **Crew System**: Seamless crew invitation and management
- **Notification System**: Event creation/update notifications

## 🎨 Design System Implementation

### Glassmorphism Design Patterns

#### Core Styling Framework
```css
/* Modal Container */
.modal-container {
  background: rgba(8, 9, 10, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}

/* Glass Cards */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

#### Component-Level Styling
```typescript
// Consistent styling across all form elements
const glassStyles = {
  input: "bg-white/5 border-white/10 text-white backdrop-blur-sm",
  select: "bg-white/5 border-white/10 text-white",
  textarea: "bg-white/5 border-white/10 text-white resize-none",
  button: "bg-white/10 hover:bg-white/20 border-white/20"
};
```

### Dropdown System Architecture

#### Consistent Dropdown Implementation
All form dropdowns follow a standardized pattern ensuring visual and behavioral consistency:

```typescript
interface DropdownPattern {
  trigger: {
    styling: "bg-white/5 border-white/10 text-white";
    behavior: "clean labels when selected";
  };
  content: {
    styling: "bg-[#08090A] border-white/10";
    behavior: "detailed descriptions in menu items";
  };
  items: {
    styling: "text-white hover:bg-white/10";
    structure: "icon + label + description";
  };
}
```

#### SelectValue Pattern
```typescript
// Clean display when option is selected
<SelectValue placeholder="Select option">
  {selectedValue && (
    <div className="flex items-center gap-2">
      <span>{getIcon(selectedValue)}</span>
      <span>{getLabel(selectedValue)}</span>
      {/* No description in selected state */}
    </div>
  )}
</SelectValue>

// Detailed information in dropdown items
<SelectItem value={option.value}>
  <div className="flex items-center gap-2">
    <span>{option.icon}</span>
    <div>
      <div className="font-medium">{option.label}</div>
      <div className="text-xs text-muted-foreground">{option.description}</div>
    </div>
  </div>
</SelectItem>
```

### Mobile-First Responsive Design

#### Touch Target Standards
```typescript
const touchTargets = {
  minimum: "44px", // iOS/Android accessibility standard
  buttons: "min-h-[44px] min-w-[44px]",
  inputs: "h-12", // 48px for comfortable interaction
  selectTriggers: "h-12",
  actionButtons: "h-14" // 56px for primary actions
};
```

#### Responsive Breakpoints
```typescript
const breakpoints = {
  mobile: "< 768px",
  tablet: "768px - 1024px", 
  desktop: "> 1024px"
};

// Implementation pattern
const responsiveClasses = "flex-col md:flex-row gap-4 md:gap-6";
```

#### Mobile-Specific Optimizations
- **Modal Sizing**: Full-screen on mobile, centered on desktop
- **Step Navigation**: Swipe-friendly progression indicators
- **Form Layout**: Single-column on mobile, multi-column on larger screens
- **Button Placement**: Thumb-accessible positioning

## 🗄️ Database Schema & Integration

### Event Data Model

#### Core Event Schema
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  place_id text,
  place_name text,
  place_nickname text,
  latitude decimal,
  longitude decimal,
  date_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  drink_type text NOT NULL DEFAULT 'beer',
  vibe text NOT NULL DEFAULT 'casual',
  notes text,
  is_public boolean NOT NULL DEFAULT true,
  cover_image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### Form Data Mapping
```typescript
interface SessionFormData {
  // Step 1: Event Details & Timing
  title: string;                    // → events.title
  description: string;              // → events.description
  location: string;                 // → events.location
  locationData: LocationData | null; // → place_id, place_name, latitude, longitude
  time: 'now' | 'custom';          // → date_time calculation
  start_time: string;              // → events.date_time (when time='custom')
  end_time: string;                // → events.end_time (when time='custom')

  // Step 2: Drinks, Vibe, Cover & Notes
  drink_type: string;              // → events.drink_type
  vibe: string;                    // → events.vibe
  cover_image: File | null;        // → Supabase Storage → cover_image_url
  cover_image_url: string | null;  // → events.cover_image_url
  notes: string;                   // → events.notes

  // Step 3: Privacy & Invitations
  is_public: boolean;              // → events.is_public
  invited_users: string[];         // → event_members table
}
```

### File Upload Architecture

#### Cover Image Upload Workflow
```typescript
const uploadCoverImage = async (file: File, eventId: string): Promise<string> => {
  // 1. Validate file (type, size, dimensions)
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type');
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File too large');
  }

  // 2. Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${eventId}-${Date.now()}.${fileExt}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('event-covers')
    .upload(fileName, file);

  if (error) throw error;

  // 4. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-covers')
    .getPublicUrl(fileName);

  return publicUrl;
};
```

#### Storage Bucket Configuration
```sql
-- Event covers bucket with RLS
CREATE POLICY "Event covers are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

CREATE POLICY "Users can upload event covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-covers' AND
    auth.uid() IS NOT NULL
  );
```

### API Integration Patterns

#### Event Creation Flow
```typescript
const createEvent = async (formData: SessionFormData): Promise<Event> => {
  let coverImageUrl = null;

  // 1. Upload cover image if provided
  if (formData.cover_image) {
    const tempEventId = crypto.randomUUID();
    coverImageUrl = await uploadCoverImage(formData.cover_image, tempEventId);
  }

  // 2. Calculate event timing
  const { date_time, end_time } = calculateEventTiming(formData);

  // 3. Create event record
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      place_id: formData.locationData?.place_id,
      place_name: formData.locationData?.place_name,
      latitude: formData.locationData?.latitude,
      longitude: formData.locationData?.longitude,
      date_time,
      end_time,
      drink_type: formData.drink_type,
      vibe: formData.vibe,
      notes: formData.notes,
      is_public: formData.is_public,
      cover_image_url: coverImageUrl,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  // 4. Process invitations
  if (formData.invited_users.length > 0) {
    await processEventInvitations(event.id, formData.invited_users);
  }

  return event;
};
```

#### Event Update Flow
```typescript
const updateEvent = async (eventId: string, formData: SessionFormData): Promise<Event> => {
  let coverImageUrl = formData.cover_image_url;

  // 1. Handle cover image updates
  if (formData.cover_image) {
    // Delete old image if exists
    if (formData.cover_image_url) {
      await deleteOldCoverImage(formData.cover_image_url);
    }
    // Upload new image
    coverImageUrl = await uploadCoverImage(formData.cover_image, eventId);
  }

  // 2. Calculate updated timing
  const { date_time, end_time } = calculateEventTiming(formData);

  // 3. Update event record
  const { data: event, error } = await supabase
    .from('events')
    .update({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      place_id: formData.locationData?.place_id,
      place_name: formData.locationData?.place_name,
      latitude: formData.locationData?.latitude,
      longitude: formData.locationData?.longitude,
      date_time,
      end_time,
      drink_type: formData.drink_type,
      vibe: formData.vibe,
      notes: formData.notes,
      is_public: formData.is_public,
      cover_image_url: coverImageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  // 4. Process new invitations
  await processNewInvitations(eventId, formData.invited_users);

  return event;
};
```

## 🧩 Reusable Component Architecture

### Shared Component Ecosystem

#### LocationAutocomplete Integration
```typescript
interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: LocationData | null;
  onChange: (locationData: LocationData) => void;
  required?: boolean;
}

// Usage in both modals
<LocationAutocomplete
  label="Where's the party?"
  placeholder="Search for bars, restaurants, venues..."
  value={formData.locationData}
  onChange={handleLocationChange}
/>
```

#### UserSearchInvite Component
```typescript
interface UserSearchInviteProps {
  onUserSelect: (user: UserProfile) => void;
  onCrewSelect: (crew: Crew) => void;
  selectedUsers: UserProfile[];
  selectedCrews: Crew[];
  onRemoveUser: (userId: string) => void;
  onRemoveCrew: (crewId: string) => void;
  existingAttendees?: EventMember[];
  loadingAttendees?: boolean;
}

// Consistent usage across Create and Edit modals
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
```

### Form Field Component Patterns

#### Standardized Select Component
```typescript
interface StandardSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    emoji?: string;
    description?: string;
  }>;
  placeholder: string;
}

const StandardSelect: React.FC<StandardSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder
}) => (
  <div>
    <Label className="text-sm font-medium">{label}</Label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-white/5 border-white/10 text-white">
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              <span>{options.find(opt => opt.value === value)?.emoji}</span>
              <span>{options.find(opt => opt.value === value)?.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-[#08090A] border-white/10">
        {options.map(option => (
          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
            <div className="flex items-center gap-2">
              {option.emoji && <span>{option.emoji}</span>}
              <div>
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
```

#### Cover Image Upload Component
```typescript
interface CoverImageUploadProps {
  currentImage: File | null;
  currentImageUrl: string | null;
  onImageChange: (file: File | null) => void;
  onImageRemove: () => void;
  vibe: string;
}

const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  currentImage,
  currentImageUrl,
  onImageChange,
  onImageRemove,
  vibe
}) => (
  <div>
    <Label className="text-sm font-medium">Event Cover Image (optional)</Label>
    <div className="mt-2 space-y-3">
      {/* Preview Section */}
      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-muted">
        {currentImage || currentImageUrl ? (
          <div className="relative w-full h-full">
            <img
              src={currentImage ? URL.createObjectURL(currentImage) : currentImageUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-2xl opacity-60">
                {getVibeEmoji(vibe) || '✨'}
              </div>
              <div className="text-xs text-muted-foreground">
                Default {vibe} cover will be used
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="w-full p-3 border border-border rounded-lg text-center cursor-pointer hover:border-primary/50">
            <Upload className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-medium">Upload Cover</div>
            <div className="text-xs text-muted-foreground">Max 5MB</div>
          </div>
        </label>
        {(currentImage || currentImageUrl) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onImageRemove}
            className="px-3"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  </div>
);
```

## 🔧 Technical Implementation Details

### State Management Architecture

#### Form State Pattern
```typescript
interface SessionFormState {
  // Form data
  formData: SessionFormData;
  setFormData: React.Dispatch<React.SetStateAction<SessionFormData>>;

  // UI state
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;

  // Invitation state
  selectedUsers: UserProfile[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  selectedCrews: Crew[];
  setSelectedCrews: React.Dispatch<React.SetStateAction<Crew[]>>;

  // Modal state
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
```

#### Default Form Values
```typescript
// QuickEventModal defaults
const defaultCreateFormData: SessionFormData = {
  title: '',
  description: '',
  location: '',
  locationData: null,
  time: 'now',                    // Default to "Right Now"
  start_time: '',
  end_time: '',
  drink_type: 'beer',            // Default drink selection
  vibe: 'casual',                // Default vibe selection
  notes: '',
  is_public: true,               // Default to public
  cover_image: null,
  cover_image_url: null,
  invited_users: []
};

// EditEventModal initialization from existing event
const initializeEditFormData = (event: Event): SessionFormData => ({
  title: event.title,
  description: event.description || '',
  location: event.location,
  locationData: createLocationData(event),
  time: 'custom',                // Always custom for existing events
  start_time: toLocalDateTimeString(event.date_time),
  end_time: event.end_time ? toLocalDateTimeString(event.end_time) : '',
  drink_type: event.drink_type || 'beer',
  vibe: event.vibe || 'casual',
  notes: event.notes || '',
  is_public: event.is_public,
  cover_image: null,
  cover_image_url: event.cover_image_url || null,
  invited_users: []
});
```

### Form Validation Logic

#### Step-Based Validation System
```typescript
const isStepValid = (step: number, formData: SessionFormData): boolean => {
  switch (step) {
    case 1: {
      // Step 1: Event Details & Timing
      const hasTitle = formData.title.trim().length > 0;
      const hasTime = Boolean(formData.time);
      return hasTitle && hasTime;
    }
    case 2: {
      // Step 2: Drinks, Vibe, Cover & Notes
      const hasDrink = Boolean(formData.drink_type);
      const hasVibe = Boolean(formData.vibe);
      return hasDrink && hasVibe;
    }
    case 3: {
      // Step 3: Privacy & Invitations (all optional)
      return true;
    }
    default:
      return false;
  }
};
```

#### Real-time Validation Patterns
```typescript
// Title validation with debouncing
const [titleError, setTitleError] = useState<string | null>(null);

const validateTitle = useCallback(
  debounce((title: string) => {
    if (title.trim().length === 0) {
      setTitleError('Event title is required');
    } else if (title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
    } else if (title.trim().length > 100) {
      setTitleError('Title must be less than 100 characters');
    } else {
      setTitleError(null);
    }
  }, 300),
  []
);

// Custom time validation
const validateCustomTime = (formData: SessionFormData): string | null => {
  if (formData.time !== 'custom') return null;

  if (!formData.start_time) {
    return 'Start time is required';
  }

  if (!formData.end_time) {
    return 'End time is required';
  }

  const startTime = new Date(formData.start_time);
  const endTime = new Date(formData.end_time);

  if (endTime <= startTime) {
    return 'End time must be after start time';
  }

  const now = new Date();
  if (startTime < now) {
    return 'Start time cannot be in the past';
  }

  return null;
};
```

#### Error Handling Patterns
```typescript
interface ValidationError {
  field: string;
  message: string;
  step: number;
}

const validateForm = (formData: SessionFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Step 1 validations
  if (!formData.title.trim()) {
    errors.push({ field: 'title', message: 'Event title is required', step: 1 });
  }

  if (!formData.time) {
    errors.push({ field: 'time', message: 'Event timing is required', step: 1 });
  }

  // Custom time validation
  const timeError = validateCustomTime(formData);
  if (timeError) {
    errors.push({ field: 'time', message: timeError, step: 1 });
  }

  // Step 2 validations
  if (!formData.drink_type) {
    errors.push({ field: 'drink_type', message: 'Drink selection is required', step: 2 });
  }

  if (!formData.vibe) {
    errors.push({ field: 'vibe', message: 'Vibe selection is required', step: 2 });
  }

  // Cover image validation
  if (formData.cover_image && formData.cover_image.size > 5 * 1024 * 1024) {
    errors.push({ field: 'cover_image', message: 'Cover image must be less than 5MB', step: 2 });
  }

  return errors;
};
```

## 📋 Step-by-Step Flow Documentation

### Step 1: Event Details & Timing

#### Purpose & Scope
Complete core event definition including essential "what, where, when" information.

#### Form Fields
```typescript
interface Step1Fields {
  title: string;           // Required - Event name/title
  description: string;     // Optional - Event description
  locationData: LocationData | null; // Optional - Venue selection
  time: 'now' | 'custom';  // Required - Timing selection
  start_time: string;      // Conditional - Required if time='custom'
  end_time: string;        // Conditional - Required if time='custom'
}
```

#### Field Specifications

**Event Title**
- **Type**: Text input
- **Validation**: Required, 3-100 characters
- **Placeholder**: "What's the session called?"
- **Real-time validation**: Debounced character count and length validation

**Event Description**
- **Type**: Textarea
- **Validation**: Optional, max 500 characters
- **Placeholder**: "Tell people what to expect..."
- **Rows**: 3

**Location Selection**
- **Component**: LocationAutocomplete
- **Integration**: Google Places API via Mapbox
- **Validation**: Optional but recommended
- **Features**: Autocomplete, place details, coordinates

**Timing Selection**
- **Type**: Select dropdown
- **Options**:
  - "Right Now" (🚀) - Immediate event start
  - "Pick Your Time" (⏰) - Custom start/end times
- **Default**: "Right Now" for create, "Pick Your Time" for edit

**Custom Time Inputs** (when "Pick Your Time" selected)
- **Start Time**: datetime-local input, required, cannot be in past
- **End Time**: datetime-local input, required, must be after start time
- **Validation**: Real-time validation of time logic

#### Validation Rules
```typescript
const step1Validation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_.,!?]+$/
  },
  description: {
    required: false,
    maxLength: 500
  },
  location: {
    required: false, // Optional but recommended
    validation: (data: LocationData) => data.place_id && data.latitude && data.longitude
  },
  time: {
    required: true,
    values: ['now', 'custom']
  },
  customTime: {
    conditional: (formData) => formData.time === 'custom',
    startTime: { required: true, futureOnly: true },
    endTime: { required: true, afterStartTime: true }
  }
};
```

#### User Experience Flow
1. **Entry**: User opens modal, Step 1 is active
2. **Title Input**: User types event title, real-time validation
3. **Description**: Optional description entry
4. **Location**: Optional venue search and selection
5. **Timing**: Select "Right Now" or "Pick Your Time"
6. **Custom Time**: If custom selected, set start/end times
7. **Validation**: Real-time feedback on all fields
8. **Navigation**: Next button enabled when title and time are valid

### Step 2: Drinks, Vibe, Cover & Notes

#### Purpose & Scope
Define event characteristics, atmosphere, and additional details.

#### Form Fields
```typescript
interface Step2Fields {
  drink_type: string;      // Required - Primary drink focus
  vibe: string;           // Required - Event atmosphere
  cover_image: File | null; // Optional - Custom cover image
  notes: string;          // Optional - Special instructions
}
```

#### Field Specifications

**Drink Selection**
- **Type**: Select dropdown
- **Options**: Beer (🍺), Wine (🍷), Whiskey (🥃), Cocktails (🍸), Shots (🥂), Mixed (🍹)
- **Default**: "Beer"
- **Validation**: Required
- **Display**: Clean label when selected, emoji + label + description in dropdown

**Vibe Selection**
- **Type**: Select dropdown
- **Options**: Casual Hang (😎), Party Mode (🎉), Shots Night (🥃), Chill Vibes (🌙), Wild Night (🔥), Classy Evening (🥂)
- **Default**: "Casual Hang"
- **Validation**: Required
- **Display**: Clean label when selected, emoji + label in dropdown

**Cover Image Upload**
- **Type**: File input with preview
- **Validation**: Optional, max 5MB, image formats only
- **Preview**: Shows selected image or default vibe-based cover
- **Features**: Upload, remove, preview
- **Fallback**: Default cover based on selected vibe

**Special Notes**
- **Type**: Textarea
- **Validation**: Optional, max 300 characters
- **Placeholder**: "BYOB, dress code, bring snacks, etc."
- **Rows**: 3
- **Purpose**: Additional event instructions or requirements

#### Validation Rules
```typescript
const step2Validation = {
  drink_type: {
    required: true,
    values: ['beer', 'wine', 'whiskey', 'cocktails', 'shots', 'mixed']
  },
  vibe: {
    required: true,
    values: ['casual', 'party', 'shots', 'chill', 'wild', 'classy']
  },
  cover_image: {
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  },
  notes: {
    required: false,
    maxLength: 300
  }
};
```

#### User Experience Flow
1. **Entry**: User navigates from Step 1 with valid core event data
2. **Drink Selection**: Choose primary drink focus (defaults to Beer)
3. **Vibe Selection**: Define event atmosphere (defaults to Casual)
4. **Cover Upload**: Optionally upload custom cover image
5. **Notes Entry**: Add special instructions or requirements
6. **Validation**: Real-time feedback on file size and format
7. **Navigation**: Next button enabled when drink and vibe are selected

### Step 3: Privacy & Invitations

#### Purpose & Scope
Configure event visibility and invite users/crews to participate.

#### Form Fields
```typescript
interface Step3Fields {
  is_public: boolean;      // Required - Event visibility
  selectedUsers: UserProfile[]; // Optional - Individual invitations
  selectedCrews: Crew[];   // Optional - Crew invitations
}
```

#### Field Specifications

**Event Visibility**
- **Type**: Select dropdown
- **Options**:
  - Public (🌐) - "Everyone can see" - Discoverable in public feeds
  - Private (🔒) - "Invite only" - Only visible to invited users
- **Default**: Public
- **Validation**: Required
- **Display**: Clean label with icon when selected, detailed description in dropdown

**User Invitations**
- **Component**: UserSearchInvite
- **Features**: Username search, email invitations, real-time search
- **Validation**: Optional
- **Display**: Selected users with remove capability
- **Integration**: Existing attendee awareness (for edit mode)

**Crew Invitations**
- **Component**: UserSearchInvite (crew mode)
- **Features**: Crew search, bulk invitation
- **Validation**: Optional
- **Display**: Selected crews with member count and remove capability
- **Integration**: User's crew membership awareness

#### Validation Rules
```typescript
const step3Validation = {
  is_public: {
    required: true,
    type: 'boolean'
  },
  invitations: {
    required: false,
    maxUsers: 50,
    maxCrews: 10,
    validation: {
      noDuplicateUsers: true,
      noSelfInvitation: true,
      validUserIds: true,
      validCrewIds: true
    }
  }
};
```

#### User Experience Flow
1. **Entry**: User navigates from Step 2 with complete event configuration
2. **Visibility**: Select public or private event visibility
3. **User Search**: Search and select individual users to invite
4. **Crew Search**: Search and select crews to invite
5. **Review**: See all selected invitations with remove options
6. **Validation**: Ensure no duplicate or invalid invitations
7. **Submission**: Create/Update button enabled, all validations pass

## 🎨 UI/UX Consistency Achievements

### Cross-Modal Design Harmony

#### Consistent Modal Structure
All Thirstee modals (Create/Edit Session, Create/Edit Crew) now follow identical patterns:

```typescript
interface ModalStructure {
  header: {
    title: string;
    description: string;
    progressIndicator: number[]; // [1, 2, 3]
  };
  body: {
    stepContent: React.ReactNode;
    glassmorphism: true;
    responsiveLayout: true;
  };
  footer: {
    navigation: {
      back: boolean;
      next: boolean;
      submit: boolean;
    };
    validation: boolean;
  };
}
```

#### Dropdown Behavior Standardization

**Selected State Pattern**
```typescript
// Consistent across all modals
<SelectValue placeholder="Select option">
  {value && (
    <div className="flex items-center gap-2">
      <span>{getIcon(value)}</span>
      <span>{getLabel(value)}</span>
      {/* No sub-text in selected state */}
    </div>
  )}
</SelectValue>
```

**Dropdown Menu Pattern**
```typescript
// Detailed information in dropdown items
<SelectItem value={option.value}>
  <div className="flex items-center gap-2">
    <span>{option.icon}</span>
    <div>
      <div className="font-medium">{option.label}</div>
      <div className="text-xs text-muted-foreground">{option.description}</div>
    </div>
  </div>
</SelectItem>
```

### Form Progression Standards

#### Step Validation Consistency
```typescript
interface StepValidationPattern {
  step1: "Core required fields";
  step2: "Configuration required fields";
  step3: "All optional fields";
  navigation: "Next enabled when current step valid";
  submission: "Submit enabled on final step";
}
```

#### Progress Indication
```typescript
const ProgressIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps
}) => (
  <div className="flex space-x-2">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i + 1}
        className={`h-2 flex-1 rounded-full ${
          i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
        }`}
      />
    ))}
  </div>
);
```

### Responsive Design Patterns

#### Mobile Optimization
```typescript
const responsivePatterns = {
  modal: {
    mobile: "fixed inset-0 z-50", // Full screen
    desktop: "fixed inset-0 z-50 flex items-center justify-center" // Centered
  },
  form: {
    mobile: "space-y-4 p-4", // Single column, compact spacing
    desktop: "space-y-6 p-6" // More spacing, potential multi-column
  },
  buttons: {
    mobile: "flex flex-col gap-3", // Stacked buttons
    desktop: "flex flex-row gap-4" // Side-by-side buttons
  }
};
```

#### Touch Target Compliance
```typescript
const touchTargets = {
  buttons: "min-h-[44px] min-w-[44px]", // iOS/Android standard
  inputs: "h-12", // Comfortable interaction
  selectTriggers: "h-12",
  actionButtons: "h-14", // Primary actions
  iconButtons: "w-11 h-11" // Icon-only buttons
};
```

### Error Handling & Feedback

#### Toast Notification Patterns
```typescript
interface ToastPattern {
  success: {
    background: "#1A1A1A";
    text: "#00FFA3";
    border: "#00FFA3";
    position: "top-right desktop, top-center mobile";
  };
  error: {
    background: "#1A1A1A";
    text: "#FF5F5F";
    border: "#FF5F5F";
    position: "top-right desktop, top-center mobile";
  };
  info: {
    background: "#1A1A1A";
    text: "#FFFFFF";
    border: "#FFFFFF";
    position: "top-right desktop, top-center mobile";
  };
}
```

#### Loading State Management
```typescript
const LoadingStates = {
  submission: {
    button: "disabled with spinner",
    form: "readonly overlay",
    feedback: "Processing... toast"
  },
  fileUpload: {
    preview: "loading skeleton",
    progress: "upload progress bar",
    feedback: "Uploading... status"
  },
  validation: {
    realTime: "debounced validation",
    feedback: "inline error messages",
    styling: "red border + error text"
  }
};
```

## 🎯 Architecture Benefits & Outcomes

### Development Efficiency
- **Component Reusability**: 85% code sharing between Create and Edit modals
- **Consistent Patterns**: Standardized dropdown, validation, and form patterns
- **Maintainability**: Single source of truth for design system components
- **Scalability**: Easy extension to new modal types and form fields

### User Experience Excellence
- **Intuitive Flow**: Logical step progression from core details to customization to sharing
- **Consistent Behavior**: Identical interaction patterns across all modals
- **Mobile Optimization**: Touch-friendly design with proper accessibility
- **Real-time Feedback**: Immediate validation and error handling

### Technical Robustness
- **Type Safety**: Comprehensive TypeScript interfaces and validation
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Performance**: Optimized file uploads and form state management
- **Integration**: Seamless connection with backend services and real-time updates

---

*This architecture document serves as the definitive guide for understanding, maintaining, and extending Thirstee's Session Modal System. The documented patterns and principles ensure consistent, scalable, and user-friendly event creation and management experiences across the entire platform.*
