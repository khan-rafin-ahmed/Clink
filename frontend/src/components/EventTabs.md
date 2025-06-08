# EventTabs Component

A reusable tabbed interface component for organizing events into "Upcoming" and "Past" categories with smooth animations and localStorage persistence.

## Features

### ✅ **Tabbed Interface**
- **Upcoming Events Tab**: Shows future events with calendar icon
- **Past Events Tab**: Shows completed events with clock icon
- **Event Counts**: Displays number of events in each tab
- **Responsive Design**: Adapts to mobile and desktop layouts

### ✅ **Animations & Transitions**
- **Smooth Tab Switching**: Fade-in animations when switching tabs
- **Duration Control**: 200ms transition duration for smooth UX
- **CSS Classes**: Uses `animate-in fade-in-50 duration-200` for content

### ✅ **Persistence**
- **localStorage Support**: Remembers last selected tab on page reload
- **Configurable Storage Key**: Different keys for different pages
- **Default Tab**: Falls back to "upcoming" if no saved preference

### ✅ **Mobile Responsive**
- **Grid Layout**: Full width on mobile, auto-width on desktop
- **Touch Friendly**: Large tap targets for mobile users
- **Adaptive Spacing**: Proper spacing for all screen sizes

## Props

```typescript
interface EventTabsProps {
  upcomingEvents: any[]        // Array of upcoming events
  pastEvents: any[]           // Array of past events
  upcomingContent: ReactNode  // Content to render in upcoming tab
  pastContent: ReactNode      // Content to render in past tab
  className?: string          // Additional CSS classes
  storageKey?: string         // localStorage key (default: 'eventTabs_selectedTab')
  showCounts?: boolean        // Show event counts in tabs (default: true)
}
```

## Usage Examples

### Basic Usage
```tsx
import { EventTabs } from '@/components/EventTabs'

<EventTabs
  upcomingEvents={upcomingEvents}
  pastEvents={pastEvents}
  upcomingContent={<EventGrid events={upcomingEvents} />}
  pastContent={<EventGrid events={pastEvents} />}
/>
```

### With Custom Storage Key
```tsx
<EventTabs
  upcomingEvents={upcomingEvents}
  pastEvents={pastEvents}
  upcomingContent={upcomingContent}
  pastContent={pastContent}
  storageKey="dashboard_eventTabs"
  className="mt-8"
/>
```

### Without Event Counts
```tsx
<EventTabs
  upcomingEvents={upcomingEvents}
  pastEvents={pastEvents}
  upcomingContent={upcomingContent}
  pastContent={pastContent}
  showCounts={false}
/>
```

## Integration

### Dashboard Page
- **Storage Key**: `dashboard_eventTabs`
- **Content**: Event cards with edit/delete actions
- **Events**: User's created events only

### UserProfile Page  
- **Storage Key**: `userProfile_eventTabs`
- **Content**: Event cards with host actions for owned events
- **Events**: User's created and joined events

## Styling

### Tab Styling
- **Active Tab**: Primary color with proper contrast
- **Inactive Tab**: Muted colors with hover effects
- **Icons**: Calendar for upcoming, Clock for past
- **Counts**: Rounded badges with appropriate colors

### Content Styling
- **Spacing**: Consistent 6-unit spacing (`mt-6 space-y-4`)
- **Animations**: Fade-in effect on tab content change
- **Layout**: Maintains existing grid layouts

### Responsive Behavior
- **Mobile**: Full-width tabs, stacked layout
- **Desktop**: Auto-width tabs, horizontal layout
- **Breakpoints**: Uses `lg:` prefix for desktop styles

## Event Filtering

The component works with the `filterEventsByDate` utility function:

```typescript
import { filterEventsByDate } from '@/lib/eventUtils'

const { upcoming, past } = filterEventsByDate(events)

<EventTabs
  upcomingEvents={upcoming}
  pastEvents={past}
  // ... other props
/>
```

## Dependencies

- `@/components/ui/tabs` - Base tabs component from shadcn/ui
- `lucide-react` - Icons (Calendar, Clock)
- `@/lib/utils` - className utility function
- `localStorage` - Tab persistence (browser API)

## Browser Support

- ✅ **localStorage**: Supported in all modern browsers
- ✅ **CSS Animations**: Supported with fallbacks
- ✅ **Touch Events**: Full mobile support
- ✅ **Accessibility**: Proper ARIA attributes from shadcn/ui tabs
