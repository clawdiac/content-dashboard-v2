# MEMORY.md - Long-Term Memory

**Loaded only in main sessions (direct Telegram chats).** Never loaded in group contexts.

---

## 🚨 NEVER FORGET

- Kevin is in Berlin timezone (Europe/Berlin / CET/CEST)
- Primary goal: Mass-produce AI content for Instagram & TikTok
- Tech stack: ComfyUI + partner nodes, Nano Banana Pro, latest video gen models
- **Hard rule:** Show context percentage at end of every message
- Memory strategy: Researching project-specific organization (proposal pending)

---

## Kevin's Expertise & Focus

- AI-generated hyperrealistic viral content
- Memeable concepts, viral hooks, trend-spotting
- Short-form video content (Reels/TikTok format)
- Scale: Speed and volume matter

---

## Key Projects & Businesses

### NiggaBets — Meme Casino (ACTIVE)
- Status: Almost ready for launch
- Theme: Black culture themed casino experience
- Characters: Pimps, crackheads, etc. (non-traditional casino aesthetics)
- Goal: Go viral through wild, unconventional experience
- Notes: High-impact, needs careful brand management

### Social Content Machine
- Viral hooks, memeable concepts, trend-spotting
- Output: Short video content (Reels / TikTok format)
- Status: Ongoing production

---

## Preferences & Rules

### Documentation Pattern (CORE)
- **Modular, lean structure** — One file per tool/function/project/decision
- **Main files are indices** — Link to specific files via `[[filename]]`
- **Never bloat MEMORY.md** — Keep it as directory only
- **Each invocation gets a result file** — `[function-name-YYYY-MM-DD].md`
- **QMD collections per major project** — Search stays focused
- **See:** [[DOCUMENTATION-PATTERN.md]] for full spec

### Tools & APIs
- **Web queries:** Use `web_search` (Brave API) for all searches — no `web_fetch`
- **Models:** Default to Haiku (cheap), Opus as fallback (complex tasks)
- **Memory backend:** QMD (BM25 + vectors + reranking) for token efficiency
- **Embedding:** Local GGUF (embedding-gemma-300M) — free, private, no API keys
- **Automation:** Cron jobs via gateway scheduler

### Communication
- Warm and helpful tone
- Concise, action-focused
- Show context % at end of every message
- Include model used for specific tasks

### Reminders & Monitoring
- Daily health checks at 9 AM Berlin time via Telegram
- Report security audit + update status
- Flag critical issues prominently

---

## Lessons Learned

(To be filled as we work together)

---

## Active Automations & Systems

- **healthcheck:daily-audit** — Daily 9 AM Berlin security audit + update check → Telegram
- **QMD backend** — Auto-indexing memory files + Obsidian vault every 5 min
- **memoryFlush** — Auto-save context before compaction (silent)
- **Opus Orchestrator** — Multi-agent swarm (Opus routes to Codex/Content/Trends/Analytics)
- **codex-swarm** — Parallel Codex execution with module isolation + validation
- **Tailscale** — Installed, pending config (plan: loopback + Serve mode)
- **GitHub Auto-Commit** — clawdiac/clawdia-core private repo (autonomous daily commits, improvements, agent flows)
  - Repo: https://github.com/clawdiac/clawdia-core
  - Cron: Daily at midnight UTC (commits MEMORY.md, SOUL.md, AGENTS.md, tools/, decisions/, references/, memory/)
  - Auto-triggered after agent swarms complete significant improvements

---

## Decisions & Technical Context

### Model Setup (2026-02-13)
- Default: `anthropic/claude-haiku-4-5` (cheap, everyday tasks)
- Fallback: `anthropic/claude-opus-4-6` (complex reasoning)
- Cost optimization: Haiku for routine work, Opus only when needed

### Memory & Documentation Architecture (2026-02-13)
- **QMD backend enabled** (local-first, BM25 + vector + reranking)
- **Local GGUF embeddings** (embedding-gemma-300M, free, private, no API keys)
- **Modular documentation pattern** (granular files, main indices, lean operation)
- **memoryFlush enabled** (auto-save before compaction)
- **Max 6 results per memory search** (token efficiency)
- **See:** [[DOCUMENTATION-PATTERN.md]] for implementation details

### Security Hardening (2026-02-13)
- Tailscale installed, needs login & config
- Plan: Bind Gateway to loopback, expose via Tailscale Serve (tailnet-only)
- Cron-based daily health checks active

---

## OpenClaw Version & Security Status (2026-02-13)

### Current Version
- **Version:** 2026.2.12 (up to date)
- **Release Channel:** stable
- **Last Update:** Feb 13, 2026

### Security Fixes in 2026.2.12
- SSRF hardening: Explicit URL validation with hostname allowlists (`files.urlAllowlist` / `images.urlAllowlist`)
- Removed `soul-evil` hook (security issue, already fixed)
- Nostr API tampering vulnerability patched
- Hook session-routing hardening (stricter sessionKey validation)
- Browser control now requires auth token (loopback routes protected)
- Web content treated as untrusted (browser snapshots/console wrapped)
- Token verification hardening (constant-time comparison + auth-failure throttling)

### Breaking Change: Hook SessionKey Override (2026.2.12)
- `POST /hooks/agent` now rejects sessionKey overrides by default
- To use fixed hook context: set `hooks.defaultSessionKey`
- Use `hooks.allowedSessionKeyPrefixes` for controlled overrides
- Only set `hooks.allowRequestSessionKey: true` if legacy behavior explicitly needed
- **Impact:** Future webhook/integration setup must respect this restriction

### Things to Avoid
- ❌ Don't pass untrusted URLs to `input_file`/`input_image` without validation
- ❌ Don't try to override sessionKey in hooks without proper allowlist config
- ❌ Don't attempt to write skills outside `skills/` root (confined by default)
- ❌ Don't expose unauthenticated browser control or HTTP API endpoints

---

## Locked Architecture Decisions (2026-02-13)

### Multi-Agent System
- **[[decisions/2026-02-13-sonnet-orchestrator-codex-swarm]]** — Sonnet orchestrates, Codex writes code
- **[[decisions/2026-02-13-codex-parallel-safety]]** — Module isolation + validation agent pattern

### Safety Patterns
- **[[tools/Codex-Module-Isolation]]** — Each parallel agent owns one module (no conflicts)
- **[[tools/Codex-Validation-Agent]]** — Post-execution validation (imports, orphans, security, tests)
- **[[tools/Opus-Orchestrator]]** — Full orchestrator spec with 5 subagent types

---

## Next Steps & Open Items

- [ ] Test Codex parallel pattern with real task (first run documentation)
- [ ] Complete Tailscale setup (login + OpenClaw serve mode)
- [ ] Verify QMD with Obsidian vault (memory search integration test)
- [ ] Create SECURITY.md with threat model + rules
- [ ] Create tools/codex-swarm-integration.md (full CLI reference)

