# 🍻 Thirstee Event Details Page – PRD (Upcoming + Past Views)

---

## 🎯 Objective

Redesign the Event Details page for both **upcoming** and **past events** by:
- Improving CTA placement and layout rhythm
- Enhancing user interaction post-event (comments, ratings, photos)
- Drawing UI inspiration from Meetup and Luma, while staying consistent with Thirstee’s brand

---

## ✅ Shared Structure (Both Views)

| Section             | Notes                                                |
|---------------------|------------------------------------------------------|
| Hero Header         | Keep current large image with title overlay          |
| Navigation Buttons  | `← Back`, `Edit`, `Delete`, `Share` above the image |
| Metadata Section    | Date, Time, Tags, Location (horizontal block layout) |
| Host Card           | Name, Avatar, 1-line tagline, “You’re hosting!” badge |
| Who’s Coming        | Avatar stack + guest names + role (Host/Member)     |

---

## 🟡 Upcoming Event View

### 🧱 Layout Order

```
[ Hero Image with Title Overlay ]
↓
[ Event Metadata Section ]
↓
[ CTA: Join This Party 🎉 + subtext ]
↓
[ Host Profile Card ]
↓
[ Event Details (Drink Type + Vibe Tags) ]
↓
[ Event Location (Map Embed) ]
↓
[ Who’s Coming (2-row avatar stack) ]
```

### 🔧 Key Design Enhancements

| Area              | Action |
|------------------|--------|
| RSVP CTA         | Move directly below event metadata<br>Button text: `Join the Party 🎉` |
| Host Card        | Inline avatar + name with compact host badge |
| Map              | Use full-width map with `rounded-xl` |
| Avatars          | 5 visible guests + `+X` badge for overflow |
| Footer Notes     | “Sign in to join” → should collapse under the Join button |

---

## 🟣 Past Event View

### 🧱 Layout Order

```
[ Hero Image ]
↓
[ Metadata + Host ]
↓
[ Toast Recap Block ]
↓
[ Gallery Section ]
↓
[ Comments + Reactions ]
↓
[ Star Rating Summary (if applicable) ]
```

### 🔧 Past Event Blocks

#### 🍻 Toast Recap

| Element       | Design |
|---------------|--------|
| Title         | “Toast Recap” with emoji 🎉🍻 |
| Summary       | "2 attendees gathered for an epic night..." |
| Time + Tagline| Show recap date + total attendees |
| Placement     | Immediately after Host Block, in a soft gold card |

#### 🖼️ Gallery

| Feature          | Design |
|------------------|--------|
| Layout           | 3-column image grid (desktop), 2-column (tablet), 1 (mobile) |
| Upload CTA       | Floating "+ Upload" button top-right |
| Image Viewer     | Lightbox popup when image clicked |

#### 💬 Comments

| Feature     | Design |
|-------------|--------|
| Input Box   | `textarea` + `Post Comment` button |
| Reactions   | Inline reactions like `🔥`, `😂`, `❤️` |
| Avatars     | Shown beside commenter's name |
| Sorting     | “Recent / Most Liked” dropdown (future enhancement) |

#### ⭐ Review Block

| Feature   | Design |
|-----------|--------|
| Rating CTA | If user hasn’t rated, sticky `Leave a ⭐ review` at bottom |
| Review Summary | Star average + comment preview |

---

## 📱 Responsive Design

| Viewport | Layout Behavior |
|----------|------------------|
| Mobile   | Stack sections vertically, CTA full-width |
| Tablet   | Split metadata into two columns |
| Desktop  | Maintain left/right rhythm, use max-w-[800px] for content center |

---

## 🔄 Transition Between Views

| Condition     | Trigger |
|---------------|---------|
| Event Passed  | Swap RSVP CTA for Review Summary + Gallery |
| No Gallery    | Show “Be the first to add photos” CTA card |
| No Comments   | Show placeholder: “No one’s commented yet 👀” |

---

## 🔚 Summary

This PRD provides a dual-state layout that:
- Improves RSVP clarity and join flow for upcoming events
- Encourages engagement through photos, comments, and reviews after an event
- Ensures consistency with Thirstee’s brand and glassmorphism UI

```


Let me know if you'd like this in a downloadable `.md` file or want it saved to your canvas workspace as a separate doc.
