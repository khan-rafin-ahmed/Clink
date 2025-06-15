# 🧾 Thirstee Event Details Page Structure (Revamp v2)

## Layout
- **Page Container:** Max-width 1200px, centered
- **Grid Layout:** 2-Column (`Left: 65%`, `Right: 35%`)
- **Mobile:** Stacks vertically, summary box becomes collapsible

---

## 🟥 Left Column: Main Content (65%)

### 1. Event Header
- 🔥 `Vibe Tag` (e.g. "Wild Vibe", "Chill Night")
- 🔒 `Event Type`: Public / Private
- 🗓️ `Date & Time` (e.g. Sunday, June 15 • 6:00 PM – All Night)
  - ⏱️ `Countdown`: “Starting in 4h 22m” (if <24hrs)
- 📍 `Location Summary` (short name)
- 🎉 `Event Title`: H1 (e.g. “Shot Till You Drop!!!”)
- 💬 `Subtitle` / Tagline (optional): “Just be present and enjoy!!”

---

### 2. Cover Image
- 📷 Image card (16:9 ratio)
  - Position: **Below header info**
  - Style: Rounded corners, soft shadow
  - Optional Overlay Tag: `🥃 Wild Vibe`
  - Max width: 100% of left column

---

### 3. About the Event
- 📝 Full event description (Markdown supported)
- 🗒️ Host Notes (collapsible section)

---

### 4. Vibe Details (Horizontal Cards or Tags)
- 🍸 Drink of the Night: e.g., “Beer”, “Cocktails”, “Mixed”
- 🎭 Party Mood: e.g., “Casual”, “Wild Vibe”, “Chill Night”
- 🧥 Dress Code / Optional Tag (if provided)

---

### 5. Who’s Coming
- 👥 Up to 8 attendees (avatars, nickname or name)
  - Host always first, labeled
  - Remaining attendees with role tags if any (e.g., “Beer God 🍺”)
  - `+N more attending` button for overflow
  - Hover tooltip with quick info

---

### 6. Event Location
- 🗺️ Google Maps Embed
  - Location from database
  - Clickable for directions

---

### 7. Post-Event Additions (if event is in past)
- ⭐ Star Ratings (1–5) + average shown
- 💬 Comments (text + emoji reactions)
- 📸 Gallery (grid/carousel of uploaded attendee photos)
- CTA Buttons:
  - “Leave a Review”
  - “Upload a Photo”

---

## 🟩 Right Column: Summary Sidebar (35%)
### Sticky card with:
- ✅ RSVP Status:
  - “🎉 You're In” (if joined)
  - “🎈 Join the Party” (CTA button)
- 🧑 Host Info:
  - Avatar
  - Username + Nickname
  - Bio line (e.g., “Ready to raise some hell with you!”)
  - Optional: “Message Host” link
- 📅 Add to Calendar (button)
- 🔁 Share Event
- ❌ Cancel RSVP
- 🔒 Invite Only Tag (if private)
- 📍 Recap Location (short string)
- 🕒 Recap Time + Date

---

## 🟨 Footer
- 🔍 Suggested Events (carousel or grid)
- ➕ CTA: “Create your own event on Thirstee”
- 🧃 Branding Tagline:
  > _“Built by Roughin while drinking beers and raising hell 🍻”_

---

## ✅ Design Notes
| Element            | Notes                                           |
|--------------------|--------------------------------------------------|
| Cover Image        | Not full-width, contained in left column         |
| Avatar Styles      | Circular or rounded, custom borders (optional)   |
| Color Palette      | Use Thirstee's dark mode with accent highlights  |
| Emojis             | Light use to match vibe (🥃, 🎉, 🔒)              |
| Responsive Layout  | Collapse right column below on mobile            |

