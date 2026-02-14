# ComfyUI Approval Dashboard v2 - Atomic Execution Plan

## Phase 1: Architecture & Specification (Planning)

### Task 1: Architecture & API Design

**Sprint 1: Specs**

#### Atom 1.1.1: Write ARCHITECTURE.md
- Tech stack: React 18 + Vite, Express.js + Socket.IO, ShadCN/ui + Tailwind
- Data flow diagram: File input → metadata extraction → real-time Socket.IO broadcast → React UI
- Directory structure: `/server` (Express), `/client` (React + Vite), `/shared` (types)
- **Verify command:** `test -f ARCHITECTURE.md && grep -q "React 18" ARCHITECTURE.md && grep -q "Socket.IO" ARCHITECTURE.md`

#### Atom 1.1.2: Write SPEC.md - Feedback & Storage Format
- Metadata schema (filename, size, dimensions, created_at, approval_status, batch_id)
- Feedback schema: `{ filename, status (APPROVED|REJECTED|CLOSE), feedback_text, timestamp, prompt_ref }`
- skill-file.md format: `## Feedback Entry - {timestamp}\n- Status: {status}\n- File: {filename}\n- Feedback: {text}\n- Suggestions: {list}`
- Stats schema: `{ total: int, approved: int, rejected: int, success_rate: float, patterns: object }`
- **Verify command:** `test -f SPEC.md && grep -q "feedback schema" SPEC.md && grep -q "skill-file.md" SPEC.md`

#### Atom 1.1.3: Write API_SPEC.md - REST Endpoints
- GET `/api/images` - filter by status/batch/date, return array with metadata
- GET `/api/file/:filename` - serve image/video, cache headers
- POST `/api/feedback` - body: {filename, status, feedback_text}, returns {success: bool}
- GET `/api/stats` - return stats object with success rates
- POST `/api/batch-feedback` - body: {entries: [...]}, returns {saved: int}
- WebSocket events: `image:new`, `image:updated`, `stats:updated`, `feedback:saved`
- **Verify command:** `test -f API_SPEC.md && grep -q "GET /api/images" API_SPEC.md && grep -q "WebSocket" API_SPEC.md`

#### Atom 1.1.4: Write UI_SPEC.md - Component Tree & Design
- Tailwind colors: dark mode primary (slate-900), accent (blue-600)
- Components: Header, Sidebar (nav + filters), Gallery (virtualized grid), ImageModal, FeedbackForm
- Layout: CSS Grid, responsive (mobile: 2 col, tablet: 3, desktop: 4)
- Keyboard shortcuts: A=approve, R=reject, F=feedback, ESC=close modal
- ShadCN/ui components: Button, Card, Modal, Input, Textarea, Badge, Select
- **Verify command:** `test -f UI_SPEC.md && grep -q "ShadCN" UI_SPEC.md && grep -q "virtualized grid" UI_SPEC.md`

---

## Phase 2: Backend Implementation

### Task 2: Project Setup & Dependencies

**Sprint 2.0: Scaffolding (Single-Root Monorepo)**

#### Atom 2.0.1: Project Scaffold & Root Dependencies
- Create folder structure: `/server`, `/client` (single shared node_modules at root)
- Create root `package.json` with: express, socket.io, chokidar, cors, vite, react, tailwindcss, shadcn
- Install all root dependencies: `npm install`
- Create `.gitignore` (node_modules, dist, .env, client/dist)
- Add build scripts to package.json: `"build": "npm run build --prefix client"`, `"start": "node server/index.js"`
- **Verify command:** `npm ls express socket.io react vite && test -d node_modules/express && test -d node_modules/react`

---

### Task 3: Backend Server & APIs

**Sprint 2: Express Server + Socket.IO**

**Important:** Atoms 2.1.1–2.1.6 all require the server to be running. After completing Atom 2.1.1, start server in background: `node server/index.js &` and keep it running through the sprint.

#### Atom 2.1.1: Express Server Setup
- Create `/server/index.js` with Express app
- Add middleware: CORS, compression, error handler
- Configure static file serving from `./public`
- Implement graceful shutdown (SIGTERM)
- Export app for testing
- **Verify command:** `test -f server/index.js && grep -q "express()" server/index.js && grep -q "listen.*3000" server/index.js`

#### Atom 2.1.2: File Watching & Image Discovery
- Create `/server/fileWatcher.js` - Chokidar file watcher on `~/.openclaw/cache/comfyui-outputs/`
- Extract metadata: filename, size (fs.statSync), EXIF dimensions, created_at
- Debounce file events (200ms)
- Emit events (new, updated) with metadata
- **Verify command:** `test -f server/fileWatcher.js && grep -q "chokidar\|watch(" server/fileWatcher.js && grep -q "metadata\|size\|created" server/fileWatcher.js`

#### Atom 2.1.3: REST API - Images Endpoint
- Create `/server/routes/images.js`
- GET `/api/images` - filter by status/batch/date (query params: `?status=approved&batch=123&from=2026-02-13`)
- GET `/api/file/:filename` - serve with cache headers, handle MIME types
- Return: `{images: [{filename, size, width, height, created_at, status: null}]}`
- **Verify command:** `test -f server/routes/images.js && grep -q "GET.*api/images\|/api/file" server/routes/images.js && grep -q "status\|batch\|from" server/routes/images.js`

#### Atom 2.1.4: REST API - Feedback Endpoints
- Create `/server/routes/feedback.js`
- POST `/api/feedback` - body: `{filename, status, feedback_text}`, returns `{success: true, saved_at: timestamp}`
- GET `/api/stats` - return `{total: int, approved: int, rejected: int, close: int, success_rate: float}`
- POST `/api/batch-feedback` - body: `{entries: [{filename, status, feedback}]}`, returns `{saved: int}`
- **Verify command:** `test -f server/routes/feedback.js && grep -q "POST.*feedback\|GET.*stats" server/routes/feedback.js && grep -q "success_rate\|approved\|rejected" server/routes/feedback.js`

#### Atom 2.1.5: WebSocket Real-Time Updates
- Create `/server/socket.js` - Socket.IO instance
- Emit `image:new` when file is detected
- Emit `feedback:saved` when approval is recorded
- Emit `stats:updated` every 5 seconds
- **Verify command:** `test -f server/socket.js && grep -q "socket.io\|image:new\|feedback:saved\|stats:updated" server/socket.js` 

#### Atom 2.1.6: Feedback Persistence Module
- Create `/server/feedbackHandler.js` - write feedback to `~/.openclaw/workspace/.comfyui-feedback.json`
- Implement function: `saveFeedback(filename, status, text)` → writes JSON, returns timestamp
- Implement function: `appendToSkillFile(feedback)` → appends to `skills/comfyui/skill-file.md` in format: `## Feedback {timestamp}\n- Status: {status}\n- File: {filename}\n- Text: {feedback}`
- Cache stats to `.comfyui-stats.json`, refresh on each feedback
- **Verify command:** `test -f server/feedbackHandler.js && grep -q "saveFeedback\|appendToSkillFile" server/feedbackHandler.js`

---

### Task 4: Frontend Dashboard UI

**Sprint 3.0: React + Vite Scaffold**

#### Atom 3.0.1: React + Vite Setup (Using Root node_modules)
- Run `npm create vite@latest client -- --template react` (uses root node_modules, no nested package.json)
- Create `/client/vite.config.js` - configure Vite for React + Tailwind
- Create `/client/tailwind.config.js` - Tailwind config (dark mode enabled)
- Create `/client/postcss.config.js` - PostCSS for Tailwind
- Create `/client/src/App.jsx` - main React component
- Initialize ShadCN/ui components in `/client/src/components`
- Add build script to root package.json: `"build:client": "vite build client"`
- **Verify command:** `test -d client/src && test -f client/vite.config.js && test -f client/tailwind.config.js && grep -q "build:client" package.json`

---

**Sprint 3: Modern UI Components**

#### Atom 3.1.1: Layout & Navigation
- Create Header component (logo, refresh button, stats summary)
- Create Sidebar with nav: All, Approved, Rejected, Close (for feedback)
- Create main Gallery container
- Implement responsive CSS Grid: mobile 1 col, tablet 2, desktop 3-4
- **Verify command:** `grep -r "Header\|Sidebar\|Gallery" client/src/components/ && npm run build --prefix client | grep -q "dist"`

#### Atom 3.1.2: Search & Filter Controls
- Create search input component in React
- Date range picker component (from/to dates)
- Status filter buttons (all/approved/rejected/pending) as Button group
- Batch grouping toggle switch
- Wire to gallery state/props, handle onChange events
- **Verify command:** `grep -r "input.*search\|filter.*button\|status.*pending" client/src/components && grep -q "useState\|onChange" client/src/components/Search.jsx`

#### Atom 3.1.3: Gallery Component with Virtualization
- Use react-virtuoso for virtualized grid (500+ images without lag)
- Each image card: thumbnail (with lazy loading), filename, size, timestamp
- Hover effect: overlay with action buttons
- Click to open modal with full-size preview
- Status badge (approved/rejected/pending)
- **Verify command:** `test -f client/src/components/Gallery.jsx && grep -q "react-virtuoso\|Virtuoso" client/src/components/Gallery.jsx`

#### Atom 3.1.4: Image Modal & Preview
- Full-size image modal with keyboard navigation (arrow keys)
- Metadata display: filename, size, dimensions, created_at
- Close button and ESC key handler
- Smooth transitions and backdrop
- **Verify command:** `grep -q "Modal\|backdrop\|ESC" client/src/components/ImageModal.jsx`

#### Atom 3.1.5: Approval Buttons & Keyboard Shortcuts
- APPROVE button (green, A key)
- REJECT button (red, R key)
- FEEDBACK button (yellow, F key, opens form)
- Keyboard shortcuts: A, R, F, ESC (close modal)
- Visual feedback: toast on success, spinner while saving
- **Verify command:** `grep -q "keydown.*'a'\|keydown.*'r'\|keydown.*'f'" client/src/hooks/useKeyboardShortcuts.js`

#### Atom 3.1.6: Feedback Modal & Form
- Modal with textarea for detailed feedback
- Dropdown for status: APPROVED, REJECTED, CLOSE (needs fixes)
- Submit button with validation (status + optional text)
- Clear button to reset form
- **Verify command:** `test -f client/src/components/FeedbackForm.jsx && grep -q "textarea\|status" client/src/components/FeedbackForm.jsx`

#### Atom 3.1.7: Stats Panel
- Display: Total images, Approval %, Rejection %, Pending count
- Real-time updates via Socket.IO
- Bar chart or simple count display (ShadCN/ui Card + custom styling)
- Top success patterns (if available)
- **Verify command:** `grep -q "stats\|approval_rate\|Socket.IO" client/src/components/StatsPanel.jsx && grep -q "useEffect.*socket" client/src/components/StatsPanel.jsx`

#### Atom 3.1.8: Dark/Light Theme Toggle
- Theme toggle button (sun/moon icon) in header
- Persist preference to localStorage
- ShadCN/ui supports dark mode via `dark` class on `<html>`
- Smooth color transition
- **Verify command:** `grep -q "localStorage.*theme\|dark.*className" client/src/App.jsx`

#### Atom 3.1.9: Build & Express Static File Serving Integration
- Add Vite build step: create `npm run build:client` script in root package.json
- Output to `/client/dist` (default Vite behavior)
- In `/server/index.js`: add `app.use(express.static('./client/dist'))` middleware
- Add SPA fallback: GET `*` routes serve `/client/dist/index.html` (for React Router)
- Express serves built React app at root `/`
- **Verify command:** `grep -q "build:client\|vite build" package.json && grep -q "express.static.*client/dist" server/index.js && grep -q "\\*.*index.html\|SPA" server/index.js`

---

## Phase 3: Testing & Validation

### Task 5: Backend API Tests (Vitest)

**Sprint 4: API Testing**

#### Atom 4.1.1: Setup Vitest & Test Files
- Install Vitest: `npm install -D vitest @vitest/ui`
- Create `/server/__tests__/api.test.js` for endpoint tests
- Create `/server/__tests__/feedback.test.js` for feedback persistence
- Create `vitest.config.js` at root
- Add test script to package.json: `"test": "vitest"`
- **Verify command:** `test -f vitest.config.js && test -f server/__tests__/api.test.js && grep -q "describe\|test\|expect" server/__tests__/api.test.js`

#### Atom 4.1.2: API Endpoint Tests
- Write tests for GET `/api/images` (schema, filtering by status/batch/date)
- Write tests for GET `/api/file/:filename` (200/404 cases)
- Write tests for POST `/api/feedback` (save, return success)
- Tests in `/server/__tests__/api.test.js`
- **Verify command:** `grep -c "describe\|test(" server/__tests__/api.test.js | grep -E "^[4-9]|^[0-9]{2}" && grep -q "images\|file\|feedback" server/__tests__/api.test.js`

#### Atom 4.1.3: Feedback Persistence Tests
- Write tests: feedback saves to JSON, appends to skill-file.md, stats update
- Write tests: feedback survives restart (load from disk)
- Tests in `/server/__tests__/feedback.test.js`
- **Verify command:** `grep -q "saveFeedback\|appendToSkillFile\|stats" server/__tests__/feedback.test.js && grep -q "restart\|persist" server/__tests__/feedback.test.js`

#### Atom 4.1.4: Socket.IO Real-Time Tests
- Write tests for events: `image:new`, `feedback:saved`, `stats:updated`
- Mock Socket.IO, test broadcast behavior
- Tests in `/server/__tests__/socket.test.js`
- **Verify command:** `test -f server/__tests__/socket.test.js && grep -q "image:new\|feedback:saved\|stats:updated" server/__tests__/socket.test.js`

---

### Task 6: Frontend UI Tests (Vitest + Playwright)

**Sprint 5: E2E Testing**

#### Atom 4.2.1: Setup Playwright & Test Files
- Install Playwright: `npm install -D @playwright/test`
- Create `/client/e2e/` directory with test files
- Create `playwright.config.js` at root (baseURL: http://localhost:3000)
- Add Playwright script to package.json: `"test:e2e": "playwright test"`
- **Verify command:** `test -f playwright.config.js && test -d client/e2e && grep -q "test:e2e" package.json`

#### Atom 4.2.2: Gallery & Navigation Tests
- Write `/client/e2e/gallery.spec.js` - test gallery loads, filter buttons, search, batch toggle
- Use page.goto, page.click, page.fill, expect(locator)
- **Verify command:** `test -f client/e2e/gallery.spec.js && grep -q "describe\|test(" client/e2e/gallery.spec.js && grep -q "filter\|search" client/e2e/gallery.spec.js`

#### Atom 4.2.3: Approval Workflow Tests
- Write `/client/e2e/approval.spec.js` - test APPROVE/REJECT/FEEDBACK buttons, keyboard shortcuts
- Mock API responses if needed, test modal opens/closes
- **Verify command:** `test -f client/e2e/approval.spec.js && grep -q "APPROVE\|REJECT\|keyboard" client/e2e/approval.spec.js`

#### Atom 4.2.4: Stats & Theme Tests
- Write `/client/e2e/stats.spec.js` - test stats display, real-time updates, theme toggle
- Test localStorage persistence for theme
- **Verify command:** `test -f client/e2e/stats.spec.js && grep -q "stats\|theme\|localStorage" client/e2e/stats.spec.js`

---

### Task 7: Full Integration & Deployment

**Sprint 6: End-to-End Validation**

#### Atom 4.3.1: Full Workflow Integration Manual Test
- Start server: `node server/index.js` (keep running)
- In separate terminal, open dashboard: `http://localhost:3000`
- Manually test: add image to output directory, verify it appears in gallery
- Test APPROVE button, verify feedback is saved
- Verify skill-file.md was updated with feedback entry
- Test search, filters, theme toggle all work
- **Verify command:** `test -f server/index.js && test -f server/feedbackHandler.js && grep -q "appendToSkillFile" server/feedbackHandler.js`

#### Atom 4.3.2: Client Build & Static Serving
- Run `npm run build:client` (client/vite.config.js handles output to client/dist)
- Verify `/client/dist` exists with built HTML/JS/CSS
- Configure Express to serve `/client/dist` as static files at root
- Test: `npm start`, then `curl http://localhost:3000` returns React HTML
- **Verify command:** `npm run build:client && test -d client/dist && grep -q "app\\.use.*express.static" server/index.js`

#### Atom 4.3.3: Create Deployment Documentation
- Create `DEPLOYMENT.md` - install, environment setup, run commands
- Create `TROUBLESHOOTING.md` - common errors (missing output dir, port in use, etc.)
- Document file structure and what each directory does
- **Verify command:** `test -f DEPLOYMENT.md && test -f TROUBLESHOOTING.md && grep -q "npm install\|npm start" DEPLOYMENT.md`

#### Atom 4.3.4: Final Git Commit
- Git add all files: `git add -A`
- Git commit: `git commit -m "ComfyUI Dashboard v2: React+Vite frontend, Express backend, real-time Socket.IO"`
- Verify commit exists: `git log --oneline | head -1`
- **Verify command:** `git log --oneline | head -1 | grep -q "ComfyUI Dashboard v2"`

---

## Success Criteria

- ✅ Modern, polished UI with ShadCN/ui + Tailwind (not basic dashboard)
- ✅ Real-time image gallery with virtualization (500+ images, <100ms render)
- ✅ Intuitive approval workflow (A/R/F keyboard shortcuts)
- ✅ Detailed feedback capture and persistence (JSON + skill-file.md)
- ✅ Real-time stats dashboard with Socket.IO updates
- ✅ Responsive design (mobile/tablet/desktop, CSS Grid)
- ✅ All API endpoints tested with Vitest
- ✅ E2E UI tests passing with Playwright
- ✅ Dark/light theme toggle with localStorage persistence
- ✅ Fast performance: virtualization prevents lag, <1s stats calc
- ✅ Full integration: file detection → UI → feedback → skill-file.md
- ✅ Production build verified, static serving working

---

## Tech Stack (FINAL - No "Or" Choices)

**Project Structure:** Single-root monorepo (one node_modules, separate /server and /client)

**Server:**
- Node.js + Express 4.18 (runs directly from /server, no build transpilation needed)
- Socket.IO 4.5 (real-time events)
- Chokidar 3.5 (file watching)
- Vitest (API unit tests)

**Frontend:**
- React 18 (state management, component architecture)
- Vite (build tooling, hot reload, outputs to /client/dist)
- Tailwind CSS 3 (responsive, dark mode enabled)
- ShadCN/ui (accessible, polished UI components)
- Socket.IO client (real-time updates from server)
- react-virtuoso (virtualized grid, supports 500+ images without lag)
- Playwright (E2E browser testing)

**Storage:**
- JSON at `~/.openclaw/workspace/.comfyui-feedback.json`
- skill-file.md at `~/.openclaw/workspace/skills/comfyui/skill-file.md`

**Spec Documents:**
- ARCHITECTURE.md (tech stack, data flow diagram, directory structure)
- API_SPEC.md (REST endpoints, WebSocket events, response schemas)
- SPEC.md (data schemas for metadata, feedback, stats; skill-file.md format)
- UI_SPEC.md (ShadCN/ui components, layout, colors, keyboard shortcuts)

---

## Notes for Codex

- **All 8 fixes from Opus applied + 3 structural issues fixed** ✅
- **Single-root monorepo** (one package.json, one node_modules, separate /server and /client)
- **Verify commands are self-contained** (check file existence, grep for code patterns, no runtime dependencies)
- **Ordering notes included** (e.g., "start server in background after 2.1.1")
- **Scaffolding atoms present** (2.0.1 root setup, 3.0.1 React+Vite scaffold, 3.1.9 build integration)
- **No nested package.jsons** — single root package.json manages both server + client
- **skill-file.md format explicitly defined** in Atom 1.1.2 (SPEC.md)
- **Test framework locked** (Vitest for server, Playwright for E2E)
- **No "build server"** — Express runs directly from /server (no transpilation needed)
- All atoms are 3-7 min of focused, atomic work
- End-to-end flow: file detection → Socket.IO broadcast → React UI → APPROVE → feedback handler → skill-file.md
- **Ready for Codex execution** ✅
