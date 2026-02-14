# Decision: Codex Parallel Execution Safety Pattern

**Date**: 2026-02-13  
**Status**: Locked In  
**Owner**: Kevin + Baines + Clawdia  

---

## Problem

Spawning 5 Codex agents in parallel on the same project creates **merge conflict risk**:
- Multiple agents writing to same files → conflicts
- Agents importing from incomplete modules → broken imports
- Unused/orphaned code created → technical debt
- No visibility into integration failures → discover problems post-merge

**Solution needed**: Safe parallel pattern with automatic validation.

---

## Decision

Implement **Module Isolation + Validation Agent** pattern:

### 1. Module Isolation
Each parallel Codex agent gets:
- **Dedicated module/directory** (exclusive write access)
- **Explicit dependency declaration** (what it imports, what it exports)
- **File lock** (can't write to other agents' files)
- **Clear task scope** (one responsibility)

Example:
```
Agent 1 → auth/ (authentication)
Agent 2 → api/ (API routes, imports from auth)
Agent 3 → integration/ (external connectors, imports from api)
Agent 4 → security/ (validation, imports from auth + api)
Agent 5 → docs/ (documentation, reads all modules)
```

**Guarantee**: No merge conflicts (each file touched by only one agent).

### 2. Validation Agent
After all parallel agents complete, a **sixth Codex agent** (validator) runs:
- ✅ Verifies all imports resolve
- ✅ Detects orphaned/unused code
- ✅ Runs full test suite
- ✅ Checks for security issues
- ✅ Generates change manifest
- ✅ Reports critical vs. warning issues

**Guarantee**: No surprises post-merge (validation catches integration problems).

---

## Benefits

✅ **5 agents working simultaneously** (N×3 speedup vs. sequential)  
✅ **Zero merge conflicts** (by design, not luck)  
✅ **Automatic integration testing** (validator checks everything)  
✅ **Orphan detection** (unused code identified and flagged)  
✅ **Security scanning** (hardcoded secrets, unsafe patterns caught)  
✅ **Confidence** (merge only after validation passes)  

---

## Implementation

### Files Created
1. **tools/Codex-Module-Isolation.md** — Isolation framework + rules
2. **tools/Codex-Validation-Agent.md** — Validation spec + checks
3. **tools/Codex-Parallel-Task-Template.md** — Task specification format
4. **tools/codex-swarm-integration.md** — Integration with codex-swarm CLI

### How It Works

```
User: "Build a feature with these 5 sub-tasks"
    ↓
Opus Orchestrator (reads declaration, validates)
    ↓
codex-swarm parallel \
  "task 1: module A" \
  "task 2: module B, imports from A" \
  "task 3: module C, imports from B" \
  "task 4: module D, imports from A+B" \
  "task 5: docs, reads all" \
  --isolate-modules \
  --validate-final
    ↓
[5 agents work in parallel]
    ↓
[Validation Agent runs]
    ↓
Report with issues + orphan detection + change manifest
    ↓
If PASS → Merge and deploy
If ISSUES → Review or re-run specific agents
```

---

## Rules (Hard)

1. **Module Declaration Required** — Every parallel task must declare:
   - What module it owns
   - What files it writes
   - What it exports (functions/classes)
   - What it imports (dependencies)
   - What agent depends on it

2. **No Cross-Agent Writes** — Agent 1 can't write to Agent 2's files. Ever.

3. **Dependency Order Matters** — If Agent B imports from Agent A, don't run them in reverse order.

4. **Validation Always Runs** — After parallel execution, validation is mandatory (not optional).

5. **Critical Issues Block Merge** — If validator finds circular imports or hardcoded secrets, block integration.

---

## What Can Go Wrong (Mitigated)

| Risk | Mitigation |
|------|-----------|
| Agent A writes to Agent B's file | File locks + validation check |
| Import fails (Agent B module incomplete) | Validator catches it + reports |
| Unused code accumulates | Orphan detection report |
| Circular dependencies | Validator catches, recommends fix |
| Security issue (hardcoded secret) | Validator flags as critical |
| Tests fail | Validator runs tests, reports failures |
| Missing documentation | Validator checks docstrings |

**Result**: Problems caught BEFORE merge (not AFTER deploy).

---

## Cost-Benefit

### Cost
- 1 extra validation run per parallel task (~30 seconds)
- Must declare dependencies upfront (1-2 minutes per task)

### Benefit
- 80% faster coding (5 agents parallel vs. sequential)
- Zero merge conflicts (by design)
- Automatic integration validation
- Orphan detection + security scanning free

**ROI**: Positive after first 3-4 parallel tasks.

---

## Alternatives Considered

1. **No isolation** — Run 5 agents, hope for no conflicts
   - ❌ High conflict risk
   - ❌ No validation
   - ❌ Orphans accumulate

2. **Sequential execution** — Run agents 1→2→3→4→5
   - ✅ Zero conflicts
   - ❌ 5× slower
   - ❌ Cascading delays if agent fails

3. **Git-based conflict resolution** — Parallel execution + auto-merge conflicts
   - ⚠️ Can work, but error-prone
   - ❌ Requires manual conflict resolution
   - ❌ No orphan detection

**Chosen**: Module isolation + validation (sweet spot).

---

## When to Use This Pattern

**USE for:**
- ✅ Large features with 5+ subtasks
- ✅ Coding tasks that take >5 minutes each
- ✅ Projects where quality/validation matters
- ✅ Parallel work that needs confidence

**Skip for:**
- ❌ Trivial tasks (<1 minute each)
- ❌ Single-file changes
- ❌ Spike/prototype work (no validation needed)

---

## Monitoring & Improvement

After each validation run, track:
- How many issues found?
- How many critical vs. warning?
- How often do orphaned functions get deleted?
- False positive rate (things flagged but actually OK)?

Use this data to:
- Refine isolation rules
- Improve task declarations
- Spot common mistakes
- Tune validator checks

Document findings in: [[tools/Codex-Validation-Agent-performance]]

---

## Related Decisions

- [[decisions/2026-02-13-sonnet-orchestrator-codex-swarm]] — Sonnet → codex-swarm routing
- [[tools/Codex-Module-Isolation]] — Implementation spec
- [[tools/Codex-Validation-Agent]] — Validation spec

---

## Lock-In Checklist

- ✅ Pattern documented (isolation + validation)
- ✅ Rules defined (no cross-agent writes, validation mandatory)
- ✅ Implementation specs created
- ✅ Risk mitigation planned
- ✅ Success criteria defined
- ✅ Monitoring plan set up

**This pattern is LOCKED. All future parallel Codex tasks use it.** 🔒

---

## Next: Test with Real Task

Once locked, we should:
1. Create a test project (small feature, 5 subtasks)
2. Spawn parallel Codex agents with full isolation
3. Run validation
4. Document results in [[tools/Codex-Parallel-First-Run]]
5. Use insights to refine (if needed)

Ready? 👻
