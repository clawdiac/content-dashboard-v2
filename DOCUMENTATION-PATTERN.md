# Documentation Pattern - Modular, Lean Structure

## Philosophy

Instead of bloating main memory files, create **granular, focused files** for each tool, function, command, project, and business. Main files act as **directory/index pointers**.

Benefits:
- ✅ Lean, searchable files
- ✅ Each tool/function has dedicated context
- ✅ Easy to find (QMD searches specific files)
- ✅ Scale without bloat
- ✅ Clear ownership (each file has one purpose)

---

## File Structure Pattern

### Main Index Files (Lightweight)

**MEMORY.md**
```markdown
# MEMORY.md - Long-Term Memory

## 🚨 NEVER FORGET
(Critical rules only)

## Projects
- [[projects/NiggaBets]] → Link to detailed project file
- [[projects/Social-Content-Machine]] → Link to project file

## Tools & Functions
- [[tools/ComfyUI]] → Workflow, settings, tips
- [[tools/QMD]] → Search setup, collections
- [[tools/Brave-Search]] → API config, usage

## Businesses
- [[businesses/NiggaBets-metrics]] → KPIs, growth
- [[businesses/SocialMachine-metrics]] → Performance

## Decisions
- [[decisions/2026-02-13-stack-architecture]] → Obsidian + QMD + local embeddings
- [[decisions/2026-02-13-modular-documentation]] → Why this pattern

## Automations
- [[automations/healthcheck-daily-audit]] → Cron job details
- [[automations/qmd-indexing]] → QMD sync schedule
```

**Key:** Only indices + critical rules. Link to specific files.

---

### Detailed Project Files

**projects/NiggaBets.md**
```markdown
# NiggaBets — Meme Casino

[[projects/NiggaBets-vision]] — Project vision & goals
[[projects/NiggaBets-timeline]] — Launch timeline & milestones
[[projects/NiggaBets-brand]] — Design, aesthetic, messaging
[[projects/NiggaBets-viral-strategy]] — Viral mechanics & hooks
[[projects/NiggaBets-content-calendar]] — Scheduled content

## Quick Stats
- Status: Pre-launch
- Last updated: 2026-02-13
```

Each sub-topic gets its own `.md` file.

---

### Tool-Specific Files

**tools/ComfyUI.md** (Index)
```markdown
# ComfyUI Setup & Workflows

[[tools/ComfyUI-installation]] — Install & setup steps
[[tools/ComfyUI-partner-nodes]] — Partner nodes we use
[[tools/ComfyUI-workflows]] — Saved workflows
[[tools/ComfyUI-nano-banana]] — Nano Banana Pro integration
[[tools/ComfyUI-troubleshooting]] — Common issues & fixes
```

Each tool gets granular files for different aspects.

---

### Function/Command Files

When I invoke a tool or run a command, I create:

**functions/generate-viral-hook.md**
```markdown
# Function: Generate Viral Hook

## Purpose
Create memeable, shareable hooks for TikTok/Reels content

## Input
- Platform (TikTok, Instagram, YouTube)
- Content category
- Target audience

## Process
1. Search trends via [[tools/Brave-Search]]
2. Analyze hook patterns from [[projects/Social-Content-Machine-hooks]]
3. Generate 5-10 variations
4. Rate by virality potential

## Output
- Hook list with reasoning
- Recommended hashtags
- Posting time optimization

## Last Run
- Date: 2026-02-13
- Results: [[functions/generate-viral-hook-2026-02-13]]

## Related
- [[projects/NiggaBets-viral-strategy]]
- [[tools/Brave-Search]]
```

---

### Decision Files

**decisions/2026-02-13-modular-documentation.md**
```markdown
# Decision: Modular Documentation Pattern

## What
Implement granular, linked documentation instead of monolithic files

## Why
- Reduce bloat as operations scale
- Better QMD searchability (focused files)
- Easier to update individual aspects
- Clear ownership (each file = one concern)

## Alternatives Considered
- Single MEMORY.md (bloats quickly)
- Nested folders (too deep)
- Wiki structure (overkill)

## Decision
Modular index + detailed files, linked via `[[]]` syntax

## Impact
- All future tools, functions, projects use this pattern
- QMD collections per major project/business
- Memory stays lean even at 50+ files

## Related Decisions
- Stack architecture (Obsidian + QMD)
```

---

### Automation Files

**automations/healthcheck-daily-audit.md**
```markdown
# Automation: Daily Health Check

## Details
- **Job ID**: `healthcheck:daily-audit`
- **Schedule**: 9 AM Berlin time (daily)
- **Command**: `openclaw security audit` + `openclaw update status`
- **Output**: Telegram notification
- **Created**: 2026-02-13

## Cron Config
```
schedule: { kind: "cron", expr: "0 9 * * *", tz: "Europe/Berlin" }
delivery: { mode: "announce", channel: "telegram" }
```

## Runs
- [[automations/healthcheck-daily-audit-2026-02-13]] → Results from first run
```

Each cron job gets its own file + linked run results.

---

## Directory Structure

```
workspace/
├── MEMORY.md                          (index only)
├── SOUL.md                            (your personality)
├── TOOLS.md                           (tool references)
├── DOCUMENTATION-PATTERN.md           (this file)
├── decisions/
│   ├── 2026-02-13-modular-documentation.md
│   ├── 2026-02-13-stack-architecture.md
│   └── [one file per decision]
├── projects/
│   ├── NiggaBets.md                  (index)
│   ├── NiggaBets-vision.md
│   ├── NiggaBets-timeline.md
│   ├── NiggaBets-brand.md
│   ├── NiggaBets-viral-strategy.md
│   └── [one file per aspect]
├── tools/
│   ├── ComfyUI.md                    (index)
│   ├── ComfyUI-installation.md
│   ├── ComfyUI-workflows.md
│   └── [one file per tool feature]
├── functions/
│   ├── generate-viral-hook.md
│   ├── generate-viral-hook-2026-02-13.md  (results)
│   └── [one file per function]
├── automations/
│   ├── healthcheck-daily-audit.md
│   ├── qmd-indexing.md
│   └── [one file per automation]
├── businesses/
│   ├── NiggaBets-metrics.md
│   ├── SocialMachine-metrics.md
│   └── [one file per business]
└── clawdia-vault/
    └── (Obsidian vault with same structure)
```

---

## QMD Collections (Future)

With modular structure, we can create **focused QMD collections**:

```bash
qmd collection add workspace/projects --name projects
qmd collection add workspace/tools --name tools
qmd collection add workspace/functions --name functions
```

Then search scoped to specific collections:
```bash
qmd query "viral TikTok hooks" -c projects
qmd query "ComfyUI workflow" -c tools
```

---

## Best Practices

1. **One file = one concept** (tool, project, decision, function)
2. **Index files link to detail files** using `[[filename]]`
3. **Name files clearly**: `tool-name`, `project-name-aspect`, `decision-YYYY-MM-DD-title`
4. **Each file has header + purpose section**
5. **Link related files** at the bottom
6. **Update MEMORY.md index** when adding major new files (quarterly)
7. **Keep main files lean** — no more than 5KB per file

---

## How I'll Use This

**When you ask me to do something:**
1. Check if dedicated file exists → read it
2. Execute task
3. Create `[function-name-date].md` with results
4. Link result file from main function file
5. Update relevant index files

**Example Flow:**
- You: "Generate viral hooks for NiggaBets"
- I create: `functions/generate-nig-gabets-hooks-2026-02-13.md`
- Link it from: `functions/generate-viral-hook.md`
- Link it from: `projects/NiggaBets-viral-strategy.md`
- Log it in: `MEMORY.md` under recent work

This scales infinitely without bloat. ✅

---

This is your operational DNA. Want me to start implementing it immediately?
