# 📱 Thirstee Mobile Components Library

## 🎯 **Overview**

This document outlines the reusable component library for the Thirstee mobile app, designed with **NativeWind** (Tailwind for React Native) and following the Thirstee design system.

---

## 🏗️ **Component Architecture**

### **Component Categories**
```
src/components/
├── ui/                    # Base UI components
│   ├── Button.tsx         # Primary button component
│   ├── Input.tsx          # Text input component
│   ├── Card.tsx           # Glass effect card
│   ├── Avatar.tsx         # User avatar component
│   ├── Badge.tsx          # Status badges
│   ├── LoadingSpinner.tsx # Loading indicators
│   └── Modal.tsx          # Modal wrapper
├── forms/                 # Form-specific components
│   ├── FormField.tsx      # Form field wrapper
│   ├── DatePicker.tsx     # Date/time picker
│   ├── LocationPicker.tsx # Location selection
│   └── VibePicker.tsx     # Event vibe selector
├── common/                # Cross-screen components
│   ├── Header.tsx         # Screen headers
│   ├── TabBar.tsx         # Custom tab bar
│   ├── SearchBar.tsx      # Search input
│   ├── FilterChips.tsx    # Filter selection
│   └── EmptyState.tsx     # Empty state displays
└── features/              # Feature-specific components
    ├── EventCard.tsx      # Event display card
    ├── UserCard.tsx       # User profile card
    ├── NotificationItem.tsx # Notification list item
    └── RSVPButton.tsx     # RSVP action button
```

---

## 🎨 **Base UI Components**

### **Button Component**
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onPress: () => void
  children: React.ReactNode
  className?: string
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onPress,
  children,
  className = ''
}: ButtonProps) {
  const baseStyles = 'rounded-xl items-center justify-center flex-row'
  
  const variants = {
    primary: 'bg-neon-green',
    secondary: 'bg-bg-glass border border-border-default',
    ghost: 'bg-transparent',
    danger: 'bg-red-500'
  }
  
  const sizes = {
    sm: 'px-3 py-2 min-h-[36px]',
    md: 'px-4 py-3 min-h-[44px]',
    lg: 'px-6 py-4 min-h-[52px]'
  }
  
  const textColors = {
    primary: 'text-black',
    secondary: 'text-text-primary',
    ghost: 'text-text-primary',
    danger: 'text-white'
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#000' : '#FFF'} 
        />
      ) : (
        <Text className={cn('font-semibold', textColors[variant])}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// Usage Examples:
<Button variant="primary" onPress={handleSubmit}>
  Create Event
</Button>

<Button variant="secondary" size="sm" onPress={handleCancel}>
  Cancel
</Button>

<Button variant="ghost" loading={isLoading} onPress={handleSave}>
  Save Changes
</Button>
```

### **Glass Card Component**
```typescript
// src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
  onPress?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ 
  children, 
  className = '', 
  onPress,
  padding = 'md' 
}: CardProps) {
  const baseStyles = 'bg-bg-glass rounded-xl border border-border-default'
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const Component = onPress ? TouchableOpacity : View
  
  return (
    <Component
      onPress={onPress}
      className={cn(baseStyles, paddings[padding], className)}
    >
      {children}
    </Component>
  )
}

// Usage Examples:
<Card>
  <Text className="text-text-primary">Basic card content</Text>
</Card>

<Card onPress={() => navigate('EventDetail')} padding="lg">
  <EventPreview event={event} />
</Card>
```

### **Avatar Component**
```typescript
// src/components/ui/Avatar.tsx
interface AvatarProps {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onPress?: () => void
  showBadge?: boolean
  badgeColor?: string
}

export function Avatar({ 
  src, 
  name, 
  size = 'md', 
  onPress,
  showBadge = false,
  badgeColor = '#00FFA3'
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }
  
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  }
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  const Component = onPress ? TouchableOpacity : View
  
  return (
    <Component onPress={onPress} className="relative">
      <View className={cn(
        sizes[size],
        'rounded-full bg-bg-glass border border-border-default',
        'items-center justify-center overflow-hidden'
      )}>
        {src ? (
          <Image 
            source={{ uri: src }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className={cn(textSizes[size], 'text-text-primary font-semibold')}>
            {initials}
          </Text>
        )}
      </View>
      
      {showBadge && (
        <View 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-base"
          style={{ backgroundColor: badgeColor }}
        />
      )}
    </Component>
  )
}

// Usage Examples:
<Avatar 
  src={user.avatar_url} 
  name={user.display_name}
  size="lg"
  onPress={() => navigate('Profile', { username: user.username })}
/>

<Avatar 
  name="John Doe" 
  size="sm" 
  showBadge 
  badgeColor="#FF5F2E" 
/>
```

### **Badge Component**
```typescript
// src/components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'live' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = ''
}: BadgeProps) {
  const baseStyles = 'rounded-full items-center justify-center'
  
  const variants = {
    default: 'bg-bg-glass border border-border-default',
    live: 'bg-neon-orange',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }
  
  const sizes = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5'
  }
  
  const textColors = {
    default: 'text-text-secondary',
    live: 'text-black',
    success: 'text-white',
    warning: 'text-black',
    error: 'text-white'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm'
  }
  
  return (
    <View className={cn(
      baseStyles,
      variants[variant],
      sizes[size],
      className
    )}>
      <Text className={cn(
        textSizes[size],
        textColors[variant],
        'font-semibold'
      )}>
        {children}
      </Text>
    </View>
  )
}

// Usage Examples:
<Badge variant="live" size="sm">
  LIVE
</Badge>

<Badge variant="success">
  Going
</Badge>

<Badge variant="default">
  Casual
</Badge>
```

---

## 📝 **Form Components**

### **Form Field Component**
```typescript
// src/components/forms/FormField.tsx
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  error, 
  required = false, 
  children,
  className = ''
}: FormFieldProps) {
  return (
    <View className={cn('mb-4', className)}>
      <Text className="text-text-primary font-semibold mb-2">
        {label}
        {required && <Text className="text-red-400"> *</Text>}
      </Text>
      
      {children}
      
      {error && (
        <Text className="text-red-400 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  )
}

// Usage Example:
<FormField label="Event Title" required error={errors.title}>
  <TextInput
    value={title}
    onChangeText={setTitle}
    placeholder="What's the occasion?"
    className="bg-bg-glass rounded-xl p-4 text-text-primary border border-border-default"
  />
</FormField>
```

### **Vibe Picker Component**
```typescript
// src/components/forms/VibePicker.tsx
interface VibePickerProps {
  selectedVibe: string | null
  onVibeSelect: (vibe: string) => void
  className?: string
}

const VIBES = [
  { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { id: 'party', label: 'Party', icon: 'musical-notes-outline' },
  { id: 'chill', label: 'Chill', icon: 'leaf-outline' },
  { id: 'wild', label: 'Wild', icon: 'flash-outline' },
  { id: 'classy', label: 'Classy', icon: 'wine-outline' },
]

export function VibePicker({ 
  selectedVibe, 
  onVibeSelect,
  className = ''
}: VibePickerProps) {
  return (
    <View className={cn('flex-row flex-wrap gap-3', className)}>
      {VIBES.map((vibe) => (
        <TouchableOpacity
          key={vibe.id}
          onPress={() => onVibeSelect(vibe.id)}
          className={cn(
            'flex-row items-center px-4 py-3 rounded-xl border',
            selectedVibe === vibe.id
              ? 'bg-neon-green border-neon-green'
              : 'bg-bg-glass border-border-default'
          )}
        >
          <Ionicons 
            name={vibe.icon as any} 
            size={20} 
            color={selectedVibe === vibe.id ? '#000' : '#71717A'} 
          />
          <Text 
            className={cn(
              'ml-2',
              selectedVibe === vibe.id ? 'text-black' : 'text-text-secondary'
            )}
          >
            {vibe.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// Usage Example:
<FormField label="Vibe">
  <VibePicker 
    selectedVibe={selectedVibe}
    onVibeSelect={setSelectedVibe}
  />
</FormField>
```

---

## 🎯 **Feature Components**

### **Event Card Component**
```typescript
// src/components/features/EventCard.tsx
interface EventCardProps {
  event: Event
  onPress: () => void
  showRSVPStatus?: boolean
  compact?: boolean
}

export function EventCard({ 
  event, 
  onPress, 
  showRSVPStatus = false,
  compact = false 
}: EventCardProps) {
  const eventStatus = getEventStatus(event)
  const attendeeCount = event.attendee_count || 0
  
  return (
    <Card onPress={onPress} padding={compact ? 'sm' : 'md'}>
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-text-primary font-semibold text-lg mb-1">
            {event.title}
          </Text>
          
          <View className="flex-row items-center mb-2">
            <Ionicons name="location-outline" size={16} color="#71717A" />
            <Text className="text-text-secondary ml-1 flex-1">
              {event.place_nickname || event.location}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#71717A" />
            <Text className="text-text-secondary ml-1">
              {formatEventTime(event.start_time)}
            </Text>
          </View>
        </View>
        
        <View className="items-end">
          {eventStatus === 'live' && (
            <Badge variant="live" size="sm" className="mb-2">
              LIVE
            </Badge>
          )}
          
          <Badge variant="default" size="sm">
            {event.vibe}
          </Badge>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color="#71717A" />
          <Text className="text-text-secondary ml-1">
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'}
          </Text>
        </View>
        
        {showRSVPStatus && (
          <Badge variant="success" size="sm">
            Going
          </Badge>
        )}
      </View>
    </Card>
  )
}

// Usage Example:
<EventCard 
  event={event}
  onPress={() => navigate('EventDetail', { eventId: event.id })}
  showRSVPStatus={true}
/>
```

### **Empty State Component**
```typescript
// src/components/common/EmptyState.tsx
interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-6', className)}>
      <Ionicons name={icon as any} size={64} color="#71717A" />
      
      <Text className="text-text-primary text-xl font-semibold mt-4 text-center">
        {title}
      </Text>
      
      <Text className="text-text-secondary text-center mt-2 leading-6">
        {description}
      </Text>
      
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onPress={onAction}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </View>
  )
}

// Usage Examples:
<EmptyState
  icon="calendar-outline"
  title="No upcoming events"
  description="Create your first event or join others in Discover"
  actionLabel="Create Event"
  onAction={() => navigate('CreateEvent')}
/>

<EmptyState
  icon="search-outline"
  title="No events found"
  description="Try adjusting your search or filters"
/>
```

---

## 🎨 **Design System Integration**

### **Consistent Styling Patterns**
```typescript
// Common style patterns used across components

// Glass effect containers
const glassContainer = 'bg-bg-glass rounded-xl border border-border-default'

// Touch targets (minimum 44px)
const touchTarget = 'min-h-[44px] min-w-[44px] items-center justify-center'

// Text hierarchy
const textStyles = {
  h1: 'text-2xl font-bold text-text-primary',
  h2: 'text-xl font-semibold text-text-primary',
  h3: 'text-lg font-semibold text-text-primary',
  body: 'text-base text-text-primary',
  caption: 'text-sm text-text-secondary',
  label: 'text-xs text-text-muted uppercase tracking-wide'
}

// Spacing system
const spacing = {
  xs: 'gap-1',    // 4px
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8'     // 32px
}
```

### **Animation Patterns**
```typescript
// Consistent animation patterns for mobile interactions

// Fade in animation
const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 }
}

// Scale animation for buttons
const scalePress = {
  from: { scale: 1 },
  to: { scale: 0.95 }
}

// Slide up animation for modals
const slideUp = {
  from: { translateY: 100 },
  to: { translateY: 0 }
}
```

---

## 📋 **Component Usage Guidelines**

### **Best Practices**
1. **Consistent Props**: Use consistent prop naming across similar components
2. **Accessibility**: Include proper accessibility labels and hints
3. **Performance**: Use React.memo for expensive components
4. **Responsive**: Ensure components work on different screen sizes
5. **Theming**: Use design tokens from the shared Tailwind config

### **Component Composition**
```typescript
// Example of composing components together
function EventListScreen() {
  const { data: events, isLoading, isEmpty } = useEvents()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (isEmpty) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="No events yet"
        description="Be the first to create an event!"
        actionLabel="Create Event"
        onAction={() => navigate('CreateEvent')}
      />
    )
  }
  
  return (
    <FlatList
      data={events}
      renderItem={({ item }) => (
        <EventCard 
          event={item}
          onPress={() => navigate('EventDetail', { eventId: item.id })}
          showRSVPStatus={true}
        />
      )}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    />
  )
}
```

This component library provides a solid foundation for building consistent, accessible, and performant mobile interfaces that align with the Thirstee design system.
