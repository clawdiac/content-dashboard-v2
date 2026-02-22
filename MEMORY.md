# MEMORY.md - Long-Term Memory (LEAN)

**Loaded only in main sessions.** Never in group contexts.

---

## 🚨 CRITICAL RULES

- **Kevin:** Berlin timezone (Europe/Berlin) | Goal: Viral AI content (IG + TikTok)
- **Hard rule:** Context % at end of every message | Model transparency (what model used)
- **Model strategy (CORRECTED 2026-02-22):** M2.5 default (restored) — see [[decisions/2026-02-22-model-m25-restored]]
- **No code without Opus orchestration** — TODO.md → Opus verify → Codex execute

## 🟢 CONTENT DASHBOARD V2 COMPLETE (2026-02-21)

**Status: ✅ PRODUCTION READY**

**Built today (Feb 21):**
- P0: GenerationForm API format fix + ModelConfigPanel integration
- P1: All model parameters verified (12+ params per model)
- P2: Multiple reference images fully wired (array support through entire chain)
- P3: Seedance→Kling automatic fallback
- P4: Batch mode UI integrated
- P5: Cost estimates updated to actual API pricing
- Final: Reference image URL parsing + database migration

**Running:** http://localhost:4000 (npm run start - port 3000 was stuck, migrated to 4000)
**Login:** admin@clawdia.ai / admin123
**Features:** Generate page (/generate) with single-item & batch modes, reference images, all model params, cost estimation
**Status:** ✅ Built & deployed | ⏳ Auth blocker identified (user needs to login first before generation works)

**See:** `memory/2026-02-21-final.md` for complete session log with all bugs fixed

---

## 🟡 INFRASTRUCTURE (2026-02-22 RESTRUCTURED)

**Memory Architecture (Single Source of Truth):**
✅ **Vault is primary** — `clawdia-vault/daily/` is where all daily notes live  
✅ QMD indexes from vault (zero API cost, local GGUF)  
✅ Obsidian reads from vault directly  
✅ Compaction prompts write to `vault/daily/YYYY-MM-DD.md`  

**Daily Flow:**
1. Session ends → compaction triggered → memory capture writes to `vault/daily/2026-MM-DD.md`
2. Cron job @ 23:00 orchestrates: gap detection + cleanup + QMD sync
3. Morning: full vault available in Obsidian + searchable via QMD

**Scripts:**
- `scripts/daily-memory-flush.sh` — Master orchestrator (23:00 Berlin)
- `scripts/memory-gap-detect.sh` — Checks for missing dates
- `scripts/cron-session-cleanup.sh` — Archives old sessions
- `scripts/qmd-feed-daily.sh` — Syncs vault to QMD index

---

## 🔧 Active Systems

**QMD + Obsidian:** 4-stage cycle, 15-min staggered intervals, zero API cost (local GGUF)  
**Healthcheck:** Daily 8 AM Berlin (security audit + update check → Telegram)  
**Memory flush:** Auto-save before compaction (durable to file, not tokens)  
**Cron config:** All sync jobs use systemEvent (cheap) + next-heartbeat wake mode (no spam)  
**Telegram API:** Direct file sender for image/video approval workflow (Kevin can ask "which reference?" anytime)

---

## 📊 Open Items

- [x] **Content Dashboard V2 built** (2026-02-19) — 6 phases, 12 pages, 43 components, 0 TS errors
- [x] **V2 deployed & running** (2026-02-21) — localhost:3000, all features working, production-ready
- [ ] **Fix Telegram session bloat** — 147K/200K tokens (optional optimization)
- [ ] **Fix agent routing** — main agent context (optional)
- [x] **GeeLark skill BUILT** (2026-02-14) — 5-phase implementation ready
- [ ] Build Phase 1 script (account provisioning)
- [ ] Obsidian plugin hardening (Phase 1: vault permissions)

---

## 🎯 Projects

**Content Dashboard V2** — ✅ COMPLETE & DEPLOYED (localhost:3000, all features working). See `memory/2026-02-21-complete.md`  
**NiggaBets** — Meme casino, viral hook formula  
**Social Content Machine** — Viral reels/TikTok at scale  
**ComfyUI Dashboard** — Real-time approval workflow (optional future)

---

## 📚 References (Granular Files)

- **Decisions:** `decisions/2026-02-13-*.md` (orchestration, modular docs, codex safety)
- **Tools:** `tools/Opus-Orchestrator.md`, `tools/Codex-Module-Isolation.md`
- **Security:** `security/OBSIDIAN-HARDENING-SUMMARY.md`, `security/obsidian-qmd-optimization.md`
- **Skills:** `skills/x-reader/`, `skills/geelark-api-automation.md` (research complete)

---

**Last updated:** 2026-02-21 23:15 CET (Final: V2 deployed to localhost:4000, all code bugs fixed, auth blocker found - user needs login before generation. See memory/2026-02-21-final.md for complete log.)

## 🚀 Model Strategy Update (2026-02-22 REVISED)
✅ **M2.5 DEFAULT + AUTO-ESCALATION TO OPUS FOR COMPLEX REASONING**
1. **Default:** M2.5 (general work — files, SSH, straightforward reasoning)
2. **Escalate to Opus:** When task is complex (deep reasoning, architecture, debugging) → auto `sessions_spawn(model=opus)`
3. **Haiku:** Only via `/model haiku` for trivial queries
4. **Codex:** Code generation only
**Rationale:** M2.5 is efficient for 90% of work. Opus auto-spawned for truly complex reasoning (no manual switching needed).
**See:** decisions/2026-02-22-model-m25-restored.md

## 🚀 Tier 1 Optimizations (2026-02-15)
✅ **COMPLETED:**
1. **Memory limits tuned:** maxResults 6→3, maxSnippetChars 500→300 (openclaw.json)
2. **Model routing fixed:** Memory searches = Opus ONLY (not Haiku)
3. **Subagent context docs updated:** Future spawns to use lean mode
**Expected savings:** ~109K tokens/session (12% efficiency gain)
