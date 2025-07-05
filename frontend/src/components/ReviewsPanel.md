# ReviewsPanel Component

A Google Reviews-style component for displaying event ratings and reviews with a clean, professional header layout.

## Features

### ✅ Google Reviews Header Layout
- **Event/Place Name**: Displayed prominently on the left
- **Large Numeric Rating**: 4xl font size (e.g., "4.4")
- **Star Icons**: Full/half star support with amber-400 styling
- **Review Count**: "X reviews" text with proper pluralization
- **Info Icon**: Clickable info icon for additional context
- **Write Review Button**: Pill-shaped button on the right

### ✅ Empty State
- **Centered Design**: Large outlined star icon in a rounded background
- **Clear Messaging**: "No reviews yet" with encouraging subtext
- **Consistent Button**: "Write a review" button remains in header

### ✅ Responsive Design
- **Mobile**: Stacked layout with title and button vertically aligned
- **Desktop**: Horizontal layout with all elements in one row
- **Dark Mode**: Full support with appropriate color variants

## Props

```typescript
interface ReviewsPanelProps {
  eventName: string        // Event or place name to display
  averageRating: number    // Average rating (float, e.g., 4.4)
  reviewCount: number      // Total number of reviews (integer)
  event: Event            // Full event object for functionality
  className?: string      // Additional CSS classes
}
```

## Usage

### Basic Usage
```tsx
import { ReviewsPanel } from '@/components/ReviewsPanel'

<ReviewsPanel
  eventName="Loki Restaurant & Bar"
  averageRating={4.4}
  reviewCount={737}
  event={eventData}
/>
```

### With Custom Styling
```tsx
<ReviewsPanel
  eventName="Amazing Cocktail Night"
  averageRating={4.8}
  reviewCount={156}
  event={eventData}
  className="shadow-lg border-2"
/>
```

### Empty State Example
```tsx
<ReviewsPanel
  eventName="New Event"
  averageRating={0}
  reviewCount={0}
  event={eventData}
/>
```

## Integration

### Replaces EventRatingDisplay
This component replaces the previous `EventRatingDisplay` component with:
- Better visual hierarchy matching Google Reviews
- Improved star styling (amber-400 instead of theme colors)
- More professional empty state design
- Responsive layout optimizations

### Database Integration
- Uses existing `event_ratings` table structure
- Maintains all rating permissions and validation
- Integrates with `EventRatingModal` for rating submission
- Supports user rating management (view, edit, delete)

## Styling

### Colors
- **Stars**: `white` for filled stars (consistent with design system)
- **Text**: Proper contrast with gray-900/white for dark mode
- **Borders**: Subtle gray-200/gray-700 borders
- **Background**: White/gray-900 with rounded corners

### Typography
- **Rating Number**: `text-4xl font-bold` with tabular numbers
- **Event Name**: `text-xl font-semibold`
- **Review Count**: `text-sm font-medium`
- **Empty State**: `text-lg font-bold` for title

### Layout
- **Padding**: Consistent 6-unit padding (p-6)
- **Gaps**: Proper spacing with gap-3 and gap-4
- **Responsive**: Uses sm: breakpoints for mobile/desktop

## Testing

Visit `/test-ratings` to see various examples:
- High ratings (4.8 with 156 reviews)
- Medium ratings (3.5 with 42 reviews)
- Empty state (0 reviews)
- Different event names and scenarios

## Dependencies

- `@/components/ui/button` - For the write review button
- `@/components/EventRatingModal` - For rating submission
- `@/lib/auth-context` - For user authentication
- `@/lib/eventRatingService` - For rating operations
- `lucide-react` - For Star, Info, and Edit icons
- `@/lib/utils` - For className utilities
