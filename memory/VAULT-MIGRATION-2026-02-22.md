# Vault Migration: Single Source of Truth

**Date:** 2026-02-22 17:32 CET  
**Status:** COMPLETE

## What Changed

**Before:** Fragmented system
- Daily notes → `workspace/memory/`
- QMD indexed from `workspace/memory/`
- Vault read via symlinks from vault back to workspace

**After:** Single source of truth
- Daily notes → `clawdia-vault/daily/` (direct, no symlinks)
- QMD indexes from vault
- Obsidian reads from vault directly
- Compaction prompt writes to vault

## Changes Made

1. ✅ Moved 13 daily files from `workspace/memory/2026-*.md` → `vault/daily/2026-*.md`
2. ✅ Removed symlinks from vault/daily
3. ✅ Updated `scripts/daily-memory-flush.sh` to reference `$VAULT_DAILY` instead of `$WORKSPACE/memory`
4. ✅ Updated `openclaw.json` compaction prompt: writes to `clawdia-vault/daily/YYYY-MM-DD.md` instead of `memory/YYYY-MM-DD.md`
5. ✅ Updated `MEMORY.md` infrastructure docs to reflect new architecture

## Impact

### Daily Workflow (Unchanged from User POV)
1. Session ends → compaction triggered
2. Memory capture writes to `vault/daily/YYYY-MM-DD.md`
3. Cron @ 23:00 orchestrates gap detection + cleanup + QMD sync
4. Obsidian shows everything automatically

### For New Projects/Code
- Add them to repo alongside vault
- Vault stays as global memory + context
- Projects have their own git history in clawdia-core

## Verification

- [x] All 13 daily files moved to vault
- [x] Cron script updated
- [x] Compaction prompt updated
- [x] Vault has correct structure
- [x] Obsidian can see vault (open `clawdia-vault` as vault)

## Next Session

When the next compaction occurs (session ends at ~25k tokens), the prompt will write directly to `vault/daily/2026-02-23.md`. Cron will index it. Everything flows through vault now.

---

**Completed:** ✅  
**Ready:** Yes, vault is now the single authority for all daily memory
