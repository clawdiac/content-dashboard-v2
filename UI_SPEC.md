# ComfyUI Approval Dashboard v2 - UI Specification

## Design System

### Color Palette (Tailwind + Dark Mode)

- **Primary:** `slate-900` (dark background), `slate-800` (secondary)
- **Accent:** `blue-600` (buttons, active states), `blue-500` (hover)
- **Success:** `green-600` (approved, checkmark)
- **Danger:** `red-600` (rejected, X)
- **Warning:** `yellow-500` (close/needs fixes)
- **Text:** `slate-50` (light text on dark), `slate-900` (dark text on light)
- **Border:** `slate-700` (dark mode), `slate-300` (light mode)

### Typography

- **Font Family:** System stack (Helvetica, Arial, sans-serif)
- **Heading 1:** 28px, font-bold, slate-50
- **Heading 2:** 20px, font-semibold, slate-100
- **Body:** 14px, font-normal, slate-200
- **Small:** 12px, font-normal, slate-400

### Spacing & Layout

- **Grid Gap:** 16px (gutters between cards)
- **Padding:** 16px (cards), 24px (sections)
- **Border Radius:** 8px (cards), 4px (buttons)
- **Responsive Grid:**
  - **Mobile** (< 640px): 1 column
  - **Tablet** (640px - 1024px): 2 columns
  - **Desktop** (> 1024px): 3-4 columns
  - Use CSS Grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

---

## Component Tree

```
<App>
  <Header>
    Logo
    Refresh Button
    Theme Toggle (sun/moon icon)
    Stats Summary (inline: Total | Approved | Rejected | Pending)
  </Header>

  <div layout="flex">
    <Sidebar>
      Navigation Buttons:
        - All
        - Approved
        - Rejected
        - Close (needs fixes)
      Filter Panel:
        - Search input (filename, batch)
        - Date range picker (from/to)
        - Status multi-select (checkboxes)
      Batch Toggle Switch
    </Sidebar>

    <main>
      <SearchFilters>
        Search input
        Date range picker
        Status filter buttons
        Batch toggle
        Apply / Clear buttons
      </SearchFilters>

      <Gallery>
        Virtualized Grid (react-virtuoso)
        Image Cards (thumbnail, filename, metadata)
        Hover Overlay (action buttons)
        Click to open modal
      </Gallery>

      <ImageModal>
        Full-size image preview
        Image metadata
        Action buttons (approve, reject, feedback)
        Close button (X)
        Keyboard navigation (arrow keys)
      </ImageModal>

      <FeedbackForm>
        Status dropdown (APPROVED, REJECTED, CLOSE)
        Textarea for feedback
        Submit button
        Clear button
      </FeedbackForm>

      <StatsPanel>
        Stat cards:
          - Total: 150
          - Approved: 95 (63.3%)
          - Rejected: 35 (23.3%)
          - Pending: 20 (13.3%)
        Bar chart (simple CSS bars)
        Real-time updates via Socket.IO
      </StatsPanel>
    </main>
  </div>
</App>
```

---

## Component Specifications

### Header

**Location:** Top of page, sticky

**Elements:**
- Logo/Title: "ComfyUI Approval Dashboard"
- Refresh Button: onClick → fetch latest images + stats (GET /api/images, GET /api/stats)
- Theme Toggle: sun/moon icon, onClick → toggle `dark` class on `<html>`
- Stats Summary: `150 total | 95 approved | 35 rejected | 20 pending`

**Styling:**
- Height: 60px
- Background: `bg-slate-900 border-b border-slate-700`
- Flexbox: space-between items center

---

### Sidebar

**Location:** Left side, fixed/sticky

**Sections:**

#### Navigation Buttons
```
[All] [Approved] [Rejected] [Close]
```
- Radio button behavior (select one)
- onClick → filter gallery by status
- Active: `bg-blue-600`, Inactive: `bg-slate-700`

#### Filter Panel
- **Search Input:** Placeholder "Search filename..."
  - onChange → filter images by filename substring
- **Date Range Picker:**
  - From: input type="date"
  - To: input type="date"
  - onChange → filter by created_at between range
- **Status Checkboxes:**
  - ☐ Approved ☐ Rejected ☐ Close ☐ Pending
  - onChange → multi-select filter
- **Batch Toggle:** Switch for "Group by batch"
  - Reorganizes gallery into batch sections

#### Clear Filters
- Button: "Clear All" → reset all filters

**Styling:**
- Width: 250px
- Background: `bg-slate-800`
- Border-right: `border-slate-700`
- Padding: 16px
- Gap: 8px between elements

---

### SearchFilters (Top Bar)

**Location:** Above gallery

**Elements:**
- Search input (filename)
- Date range (from/to)
- Status filter buttons: All, Approved, Rejected, Close, Pending
- Apply button
- Clear filters button

**Styling:**
- Flexbox, gap 8px
- Background: `bg-slate-800`
- Padding: 12px
- Border-bottom: `border-slate-700`

---

### Gallery (Virtualized Grid)

**Component:** react-virtuoso (virtualized grid, no lag with 500+ images)

**Card Design:**

```
┌─────────────────────────┐
│  [Image Thumbnail]      │  ← 200x200px, aspect-ratio maintained
│                         │
├─────────────────────────┤
│ filename.png            │  ← Bold, 12px
│ 2.1 MB · 1024×1024 · 2  │  ← Small text, gray
│ 2026-02-13 22:45:00 UTC │
├─────────────────────────┤
│  [APPROVED] (badge)     │  ← Green badge or icon
└─────────────────────────┘

Hover Overlay:
┌─────────────────────────┐
│    [Approve] [Reject]   │  ← Buttons appear on hover
│     [Feedback]          │
└─────────────────────────┘
```

**Properties:**
- Grid: CSS Grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Gap: 16px
- Card: `rounded-lg border border-slate-700 overflow-hidden`
- Thumbnail: `object-cover`, lazy loading, 200×200px
- Status Badge: `absolute top-2 right-2`, green/red/yellow pill
- Hover Overlay: `absolute inset-0 bg-black/50 flex items-center justify-center gap-2`

**Keyboard Navigation:**
- Arrow keys: navigate between cards
- Enter: select card, open modal

---

### ImageModal

**Trigger:** Click on gallery card

**Layout:**
```
┌─────────────────────────────────────────┐
│ [X]  Full Image Preview                 │  ← Close button (top-right)
├─────────────────────────────────────────┤
│                                         │
│          [Full-Size Image]              │  ← Max-height: 60vh
│                                         │
├─────────────────────────────────────────┤
│ Metadata:                               │
│  • Filename: 2026-02-13_output_001.png │
│  • Size: 2.1 MB                        │
│  • Dimensions: 1024×1024               │
│  • Created: 2026-02-13 22:45:00 UTC    │
│  • Status: Approved (badge)            │
├─────────────────────────────────────────┤
│  [Approve (A)]  [Reject (R)] [Feedback]│  ← Buttons
└─────────────────────────────────────────┘
```

**Properties:**
- Modal: `fixed inset-0 bg-black/70 flex items-center justify-center z-50`
- Content: `bg-slate-900 rounded-lg max-w-4xl max-h-90vh overflow-auto`
- Close button: top-right, X icon, onClick → close modal
- Metadata: list format, gray text

**Keyboard Navigation:**
- Left arrow: previous image
- Right arrow: next image
- ESC: close modal
- A: approve
- R: reject
- F: open feedback form

**Interactions:**
- Click outside modal: close
- Smooth fade-in/fade-out transitions

---

### FeedbackForm (Modal)

**Trigger:** Click "Feedback" button

**Layout:**
```
┌──────────────────────────────────┐
│ [X]  Detailed Feedback           │
├──────────────────────────────────┤
│ Status:                          │
│  [ APPROVED ▼ ]                 │  ← Dropdown
│                                 │
│ Feedback (optional):            │
│  [ ___________________         ]│  ← Textarea, 4 rows
│  [ ___________________         ]│
│                                 │
│  [Submit (F)] [Clear]           │  ← Buttons
└──────────────────────────────────┘
```

**Properties:**
- Modal: `fixed bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-lg`
- Status Dropdown: ShadCN Select component
- Feedback Textarea: `border border-slate-700 p-3 rounded bg-slate-800 text-slate-50 resize-none`
- Submit Button: `bg-blue-600 hover:bg-blue-500`
- Clear Button: `bg-slate-700 hover:bg-slate-600`

**Validation:**
- Status is required
- Feedback text optional but recommended
- On submit: POST /api/feedback → toast success
- On error: toast error message

---

### StatsPanel

**Location:** Below gallery (or sidebar)

**Layout:**
```
┌─────────────────────────────────┐
│ APPROVAL STATISTICS             │
├─────────────────────────────────┤
│ Total: 150                      │
│ ████████░░░░░░░░░░░░░░░░░░░░░ 63% Approved
│                                 │
│ Rejected: 35 (23%)              │
│ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                 │
│ Pending: 20 (13%)               │
│ █░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                 │
│ Success Rate: 63.3%             │
│ ████████░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────┤
│ Last Updated: 22:47:15          │
└─────────────────────────────────┘
```

**Properties:**
- Card: `bg-slate-800 rounded-lg p-6 border border-slate-700`
- Stat Row: flex, space-between
- Progress Bar: `w-full h-2 bg-slate-700 rounded overflow-hidden`
  - Fill: `bg-green-600` or `bg-red-600` based on status
- Real-time: Socket.IO listener for `stats:updated` event

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| A | Approve (modal only) |
| R | Reject (modal only) |
| F | Open Feedback form (modal only) |
| ESC | Close modal / Close feedback form |
| → | Next image (modal navigation) |
| ← | Previous image (modal navigation) |
| / | Focus search input |

---

## ShadCN/ui Components Used

- **Button** - All clickable buttons (approve, reject, feedback, clear, refresh)
- **Card** - Stats panel, image cards
- **Modal/Dialog** - Image preview, feedback form
- **Input** - Search, date range inputs
- **Textarea** - Feedback text input
- **Badge** - Status indicators (Approved, Rejected, Pending)
- **Select** - Status dropdown in feedback form
- **Switch** - Batch grouping toggle
- **Skeleton** - Loading placeholders for image thumbnails
- **Toast/Toaster** - Success/error notifications

---

## Dark/Light Theme

**Implementation:**
- Store preference in localStorage: `localStorage.setItem('theme', 'dark' | 'light')`
- On mount, read localStorage and apply class to `<html>`: `html.classList.toggle('dark', isDarkMode)`
- Toggle button: sun/moon icon, onClick → toggle class + save to localStorage
- Tailwind `dark:` prefix handles all color changes

**Default:** Dark mode (slate-900 background, slate-50 text)

---

## Responsiveness

**Mobile-First Approach:**

```css
/* Mobile: 1 column */
.gallery { grid-cols-1; }

/* Tablet: 2 columns */
@media (min-width: 640px) { grid-cols-2; }

/* Desktop: 3 columns */
@media (min-width: 1024px) { grid-cols-3; }

/* Large Desktop: 4 columns */
@media (min-width: 1280px) { grid-cols-4; }

/* Sidebar: hidden on mobile, visible on tablet+ */
.sidebar { display: none; }
@media (min-width: 768px) { display: block; }
```

---

## Loading & Error States

**Loading:**
- Skeleton cards in gallery
- Spinner in refresh button
- Spinner in action buttons during submission

**Errors:**
- Toast notifications (error message)
- Retry button in error card
- Network error message in sidebar

**Empty States:**
- Message: "No images found. Check filter settings."
- Icon: folder-open or image icon

---

## Performance Considerations

- **Lazy Loading:** Image thumbnails load on-demand
- **Virtualization:** react-virtuoso renders only visible cards (500+ images no lag)
- **Debouncing:** Search input debounced 300ms
- **Memoization:** Gallery cards memoized to prevent unnecessary re-renders
- **Socket.IO:** Subscribe to stats updates only (not every image change initially)
