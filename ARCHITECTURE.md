# ComfyUI Approval Dashboard v2 - Architecture

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + ShadCN/ui
- **Backend:** Express.js + Socket.IO
- **Real-time:** Socket.IO bidirectional communication
- **Testing:** Vitest (backend), Playwright (E2E)
- **File Watching:** Chokidar
- **State Management:** React hooks + Socket.IO state sync

## Data Flow

```
File System                 Server                      Client
(ComfyUI outputs)    (Express + Socket.IO)        (React + Vite)
     ↓                           ↓                         ↓
  .jpg/.png    ──Chokidar──>  File Watcher         React Component
   files                         ↓                     Gallery
                          Extract Metadata           ImageModal
                                ↓                   FeedbackForm
                         Socket.IO :image:new        ↓
                                ├──────────────→  Update Gallery
                                ↓
                          User Approval (A/R/F)
                                ↓
                          POST /api/feedback
                                ↓
                         Feedback Handler
                                ├→ .comfyui-feedback.json
                                ├→ skill-file.md append
                                ├→ .comfyui-stats.json
                                └→ Socket.IO :feedback:saved
                                        ↓
                              Update Stats Panel
```

## Directory Structure

```
/Users/clawdia/.openclaw/workspace/
├── /server                    # Express backend
│   ├── index.js              # Server entry point
│   ├── fileWatcher.js        # Chokidar file watching + metadata extraction
│   ├── feedbackHandler.js    # Persistence: JSON + skill-file.md
│   ├── socket.js             # Socket.IO instance + event handlers
│   ├── /routes               # API route modules
│   │   ├── images.js         # GET /api/images, GET /api/file/:filename
│   │   └── feedback.js       # POST /api/feedback, GET /api/stats, POST /api/batch-feedback
│   ├── /public               # Static assets
│   └── /__tests__            # Vitest unit tests
│       ├── api.test.js
│       ├── feedback.test.js
│       └── socket.test.js
│
├── /client                    # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Main React app
│   │   ├── main.jsx          # React entry point
│   │   ├── index.css         # Tailwind imports
│   │   ├── /components       # ShadCN + custom UI
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Gallery.jsx   # Virtualized grid (react-virtuoso)
│   │   │   ├── ImageModal.jsx
│   │   │   ├── FeedbackForm.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   └── StatsPanel.jsx
│   │   ├── /hooks            # Custom React hooks
│   │   │   └── useKeyboardShortcuts.js
│   │   └── /services         # API & WebSocket clients
│   │       └── socketClient.js
│   ├── vite.config.js        # Vite + React setup
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── e2e/                  # Playwright E2E tests
│   │   ├── gallery.spec.js
│   │   ├── approval.spec.js
│   │   └── stats.spec.js
│   └── dist/                 # Built output (Vite build)
│
├── /shared                    # Shared TypeScript types (optional, future)
│
├── package.json              # Root monorepo config
├── vitest.config.js          # Vitest config
├── playwright.config.js      # Playwright config
├── .gitignore
│
└── docs/
    ├── ARCHITECTURE.md       # This file
    ├── SPEC.md              # Data schemas
    ├── API_SPEC.md          # REST + WebSocket spec
    └── UI_SPEC.md           # Component design spec
```

## Monorepo Structure

**Single-root monorepo** with one `package.json` at root:
- All dependencies (Express, React, Vite, testing tools) installed once in `/node_modules`
- `/server` runs directly (no transpilation, uses Node.js CommonJS or ES modules)
- `/client` uses Vite for JSX → JS bundling (outputs to `/client/dist`)
- No nested `package.json` files

### Build Process

1. **Backend:** Node.js runs `/server/index.js` directly (no build step)
2. **Frontend:** `npm run build:client` → Vite bundles React → outputs to `/client/dist`
3. **Server static files:** Express middleware serves `/client/dist` at root (`/`)

## Real-Time Architecture

**Socket.IO Events:**

```
Server → Client (broadcasts):
  image:new           {filename, size, width, height, created_at}
  image:updated       {filename, status}
  feedback:saved      {filename, status, timestamp}
  stats:updated       {total, approved, rejected, close, success_rate}

Client → Server (emit):
  (via POST /api/feedback REST endpoint)
```

## Performance Considerations

- **Virtualization:** react-virtuoso renders only visible images (supports 500+ without lag)
- **Lazy loading:** Image thumbnails load on-demand
- **Socket.IO debouncing:** File watcher debounces events (200ms)
- **Stats caching:** `.comfyui-stats.json` cached, recalculated on each feedback
- **Metadata extraction:** EXIF/size cached in memory for fast filtering

## Security & Data Handling

- **CORS:** Express middleware only allows localhost (or configured origin)
- **File serving:** GET `/api/file/:filename` validates path to prevent directory traversal
- **Feedback persistence:** JSON stored in workspace (not exposed over network)
- **skill-file.md:** Append-only log of all feedback entries (version control safe)

## Deployment Notes

- Single-root `package.json` simplifies CI/CD (one `npm install`, one build)
- Express serves React SPA (static files + SPA fallback for React Router)
- No database required (file-based JSON + markdown persistence)
- Chokidar watches local file system (runs on same machine as ComfyUI)
