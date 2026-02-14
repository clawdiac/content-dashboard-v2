# Decision: Modular, Lean Documentation Pattern

**Date**: 2026-02-13  
**Status**: Approved & Active  
**Owner**: Kevin (requested), Clawdia (implementation)

---

## Problem Identified

Single bloated documentation files (MEMORY.md, project files, etc.) don't scale:
- Become unmanageable at 50+ projects/tools
- Difficult to search and update specific aspects
- Force context inflation in every session
- Don't leverage QMD's focused collection search

---

## Decision

Implement **modular, granular documentation**:
- One `.md` file per **tool**, **function**, **project**, **business**, **decision**, **automation**
- Main files (MEMORY.md, project indices) act as **directory pointers** only
- Each file links to specific files via `[[filename]]` Obsidian syntax
- Every tool invocation creates a **result file** with date: `[function-name-YYYY-MM-DD].md`
- QMD collections per major project for focused search

---

## Why This Works

### Benefits
✅ **Lean operation** — Main files stay <5KB, focused on direction  
✅ **Infinite scale** — Can have 100+ files without bloat  
✅ **QMD search power** — Create collections per project/tool  
✅ **Clear ownership** — Each file has one responsibility  
✅ **Easy updates** — Change one aspect without touching others  
✅ **Context efficiency** — Load only what's needed for the task  

### Example Flow
1. You ask: "Generate viral TikTok hooks for NiggaBets"
2. I read: `[[functions/generate-viral-hook]]` (setup)
3. I read: `[[projects/NiggaBets-viral-strategy]]` (context)
4. I execute & create: `functions/generate-viral-hook-2026-02-13.md` (results)
5. I link result from both parent files
6. Next time: I search QMD for "viral hooks NiggaBets" → finds both context file + results

---

## Structure

### File Naming Convention
- Projects: `projects/[ProjectName].md` (index) + `projects/[ProjectName-aspect].md` (detail)
- Tools: `tools/[ToolName].md` (index) + `tools/[ToolName-feature].md` (detail)
- Functions: `functions/[function-name].md` (setup) + `functions/[function-name-YYYY-MM-DD].md` (results)
- Decisions: `decisions/YYYY-MM-DD-slug.md`
- Automations: `automations/[automation-name].md` (setup) + `automations/[automation-name-YYYY-MM-DD].md` (results)

### Main Index Files (Lightweight)
- **MEMORY.md** — Critical rules + directory to projects/tools/automations
- **projects/NiggaBets.md** — Links to vision, timeline, brand, strategy, content calendar
- **tools/ComfyUI.md** — Links to installation, workflows, partner nodes, troubleshooting

---

## Implementation

### Immediate
- ✅ Create DOCUMENTATION-PATTERN.md (reference guide)
- ✅ Update MEMORY.md with this decision
- ✅ Start using pattern for all new tools/functions/projects
- ✅ Create initial directory structure

### Future
- [ ] Migrate existing notes to modular structure (as needed)
- [ ] Create QMD collections per major business/project
- [ ] Document each tool with dedicated files
- [ ] Build function library (generate-viral-hook, analyze-trends, etc.)

---

## Alternatives Considered

1. **Single MEMORY.md** — Becomes unmaintainable at 50+ files
2. **Nested folder structure** — Too deep, hard to navigate
3. **Wiki/knowledge base** — Overkill for our needs
4. **Flat directory** — Gets chaotic without clear naming

**Chosen: Modular indices** (sweet spot between flat and nested)

---

## Related Decisions
- [[decisions/2026-02-13-stack-architecture]] — Obsidian + QMD + local embeddings
- [[DOCUMENTATION-PATTERN.md]] — Full implementation spec

---

## Success Metrics

- [ ] All new tools documented in modular files
- [ ] All projects have aspect-specific files
- [ ] QMD searches stay focused (<2s response time)
- [ ] MEMORY.md stays <5KB (index-only)
- [ ] Can easily add 20 more projects without friction
