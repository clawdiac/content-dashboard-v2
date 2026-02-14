# Obsidian + QMD + Gemini Embed Stack Proposal

## Vision

Create a seamless knowledge management system where:
1. **Obsidian** = beautiful, single source of truth for all notes & memories
2. **QMD** = intelligent search engine (BM25 + semantic search)
3. **Gemini Embed API** = powerful semantic embeddings
4. These three work together dynamically to surface context automatically

---

## Architecture

```
┌─────────────────┐
│   Obsidian      │  (Write & organize)
│   Vault         │
└────────┬────────┘
         │ (Watch for changes)
         ↓
┌─────────────────┐
│  QMD Collection │  (Index all .md files)
│  (BM25 + Vec)   │
└────────┬────────┘
         │ (Use Gemini Embed API for vectors)
         ↓
┌─────────────────┐
│  Gemini Embed   │  (Semantic embeddings)
│  API            │  (via google-generative-ai)
└────────┬────────┘
         │ (Power semantic search)
         ↓
┌─────────────────┐
│  OpenClaw       │  (Automatic recall)
│  memorySearch   │  (QMD backend + Gemini embeddings)
└─────────────────┘
```

---

## Setup Steps

### Phase 1: Install & Configure Obsidian

1. **Download** Obsidian from obsidian.md (free version is fine)
2. **Create vault** at: `~/.openclaw/workspace/obsidian-vault` (or your preferred location)
3. **Initialize** with structure:
   ```
   obsidian-vault/
   ├── MEMORY.md (symlink to workspace root)
   ├── daily/
   │   └── 2026-02-13.md
   ├── projects/
   │   ├── NiggaBets.md
   │   └── Social-Content-Machine.md
   ├── learnings/
   ├── tools/
   └── decisions/
   ```
4. **Enable daily notes plugin** (Obsidian's native feature)
5. **Optionally**: Enable Git plugin for auto-commits

**Key insight**: Obsidian becomes your writing interface; OpenClaw workspace becomes the indexing source.

---

### Phase 2: Set Up Gemini Embed API

1. **Get API key**:
   - Go to https://ai.google.dev/ (Google AI Studio)
   - Create new API key (free tier available)
   - Save as `GEMINI_API_KEY` in your environment or `.env`

2. **Verify access**:
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent \
     -H "Content-Type: application/json" \
     -H "x-goog-api-key: YOUR_GEMINI_API_KEY" \
     -d '{"model":"models/embedding-001","content":{"parts":[{"text":"test"}]}}'
   ```

3. **OpenClaw will use it** via `memorySearch.provider = "gemini"`

---

### Phase 3: Configure QMD to Index Obsidian Vault

1. **Add Obsidian vault as QMD collection**:
   ```bash
   qmd collection add ~/.openclaw/workspace/obsidian-vault \
     --name obsidian-vault \
     --mask "**/*.md"
   ```

2. **Verify collection**:
   ```bash
   qmd collection list
   qmd status
   ```

3. **Index & embed** (using Gemini):
   ```bash
   qmd update
   qmd embed
   ```

4. **Test search**:
   ```bash
   qmd query "viral hooks for TikTok" -c obsidian-vault --json
   ```

---

### Phase 4: Wire Gemini + QMD + OpenClaw

**Option A: Gemini for OpenClaw's embeddings (recommended)**

Update `openclaw.json`:
```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "gemini",
        model: "embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}"
        }
      }
    }
  }
}
```

**Option B: Keep QMD's bundled embeddings** (faster, local-only)

QMD will use its built-in `embedding-gemma-300M` GGUF model. This works fine; Gemini is optional for QMD but useful for OpenClaw's fallback.

---

### Phase 5: Enable QMD as Memory Backend (Already Done ✅)

Your config already has:
```json5
memory: {
  backend: "qmd",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m" }
  }
}
```

QMD will now:
- Watch `MEMORY.md` + `memory/` folder
- Auto-index every 5 minutes
- Power your `memory_search` calls

---

## How They Work Together

### Write → Index → Search → Recall

1. **You write in Obsidian** → Save `obsidian-vault/projects/NiggaBets.md`
2. **QMD watches** → Detects change (via inotify/FSEvents)
3. **QMD reindexes** (debounced) → Updates SQLite + embeddings
4. **I ask memory_search** → "Tell me about NiggaBets launch timeline"
5. **QMD queries**: 
   - BM25 finds exact matches (keywords like "launch", "timeline")
   - Vector search (via Gemini Embed) finds semantic matches ("go live", "deployment", "release date")
   - Reranker picks the best 6 snippets
6. **OpenClaw receives** → Relevant context automatically injected

### Benefits

✅ **Single source of truth** (Obsidian vault)
✅ **Semantic search** (Gemini embeddings understand intent)
✅ **Fast keyword search** (QMD's BM25 for exact terms)
✅ **Automatic indexing** (no manual updates needed)
✅ **Project-specific recall** (filter by collection in future)
✅ **Hybrid strength** (keywords + semantics)

---

## Implementation Order

1. **Install Obsidian** (5 min)
2. **Create vault structure** (10 min)
3. **Get Gemini API key** (5 min)
4. **Add QMD collection** (5 min)
5. **Test QMD search** (5 min)
6. **Wire Gemini to OpenClaw** (config.patch, restart)
7. **Migrate workspace files** → Obsidian vault
8. **Verify memory_search** → Works with Gemini embeddings

---

## Next Steps (After Implementation)

- [ ] Create project-specific QMD collections (one per major project)
- [ ] Set up Obsidian daily notes → memory/YYYY-MM-DD.md automation
- [ ] Implement project memory proposal (separate per project, indexed by QMD)
- [ ] Add Obsidian backlinks → QMD context graph
- [ ] Create Telegram → Obsidian capture workflow (quick ideas → vault)

---

## Notes

- **Obsidian + symlinks**: You can symlink `workspace/MEMORY.md` into Obsidian vault so it's visible in both places
- **QMD MCP**: QMD has MCP (Model Context Protocol) support; we could expose it to other tools later
- **Gemini free tier**: 60 requests/minute is generous for daily indexing
- **Offline fallback**: QMD's bundled embeddings work offline; Gemini is async online
- **Project isolation**: Future QMD collections per project = ability to search just "NiggaBets" or "Social Content"

---

Shall I proceed with implementation? 👻
