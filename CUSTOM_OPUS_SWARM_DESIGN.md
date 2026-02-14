# Custom Opus Swarm Architecture Design

> Synthesized from deep research of kingbootoshi/codex-orchestrator and adapted for our OpenClaw ecosystem.
> Generated: 2026-02-13

---

## Executive Summary

The codex-orchestrator is a **thin CLI wrapper** (~50KB of TypeScript) that lets Claude Code spawn and manage parallel OpenAI Codex agents via tmux sessions. Its genius is in its simplicity and its **prompt engineering** (the SKILL.md that teaches Claude *how* to be an orchestrator). We should adopt its principles but build something native to OpenClaw's architecture—using our existing subagent system, not tmux.

---

## Part 1: Architecture Principles (What They Got Right)

### 1.1 Military Command Hierarchy
```
USER (Commander) → sets vision, approves plans
  └── ORCHESTRATOR (General) → strategy, synthesis, coordination
       └── WORKER AGENTS (Army) → focused execution
```

**Principle to adopt:** Strict separation between strategic thinking (orchestrator) and execution (workers). The orchestrator NEVER implements—it plans, delegates, monitors, and synthesizes.

### 1.2 The "Skill as Brain" Pattern
Their entire orchestration intelligence lives in a single `SKILL.md` file (~20KB of instructions). The CLI is dumb infrastructure; the prompt makes it smart. This means:
- The orchestrator behavior is **declarative** (written in natural language)
- Easy to iterate on behavior without code changes
- The LLM itself IS the routing/decision engine

**Principle to adopt:** Swarm behavior should be prompt-driven, not hard-coded. The orchestration logic lives in agent instructions, not in routing algorithms.

### 1.3 Minimal Infrastructure, Maximum Leverage
The entire codebase is 5 TypeScript files:
- `cli.ts` (20KB) - argument parsing + command dispatch
- `jobs.ts` (11KB) - job CRUD + status tracking
- `tmux.ts` (9KB) - tmux session management
- `session-parser.ts` (8KB) - parse Codex JSONL for metadata
- `config.ts` (1KB) - constants

**Principle to adopt:** Don't over-engineer the swarm infrastructure. Keep it thin. The LLM does the hard work.

### 1.4 Codebase Map = Shared Context
They use a companion tool (Cartographer) to generate `CODEBASE_MAP.md` which gets injected into every agent's prompt. This gives agents **instant spatial awareness** of the codebase.

**Principle to adopt:** Every worker agent needs a shared context artifact. For us, this could be auto-generated project summaries, file trees, or architecture docs injected into subagent prompts.

---

## Part 2: Orchestration Patterns & Logic

### 2.1 Pipeline-Driven Workflow
```
IDEATION → RESEARCH → SYNTHESIS → PRD → IMPLEMENTATION → REVIEW → TESTING
(Claude)   (Workers)   (Claude)   (Claude)  (Workers)     (Workers)  (Workers)
```

**Key insight:** Strategic stages (ideation, synthesis, PRD) stay with the orchestrator. Execution stages (research, implementation, review, testing) go to workers. The orchestrator is the **bottleneck by design**—it's the quality gate.

### 2.2 Task Routing is Permission-Based
Routing is dead simple—no ML classifiers, no embeddings:
- **Research tasks** → `read-only` sandbox (can't modify files)
- **Implementation tasks** → `workspace-write` sandbox
- **Dangerous tasks** → `danger-full-access` (rarely used)

**Principle to adopt:** Route by permission level, not by task classification. The orchestrator decides what level of access each task needs.

### 2.3 No Retry Logic—Course Correct Instead
There are NO automated retries. Instead:
- Monitor agent output via `capture`
- **Send follow-up messages** mid-task to redirect (`send` command)
- Only `kill` as absolute last resort
- "Don't retry with the same prompt—mutate the approach"

**Principle to adopt:** Prefer course-correction over retry. A redirected agent has accumulated context; a restarted one starts cold.

### 2.4 Session Management
- Each job gets a unique 8-char hex ID
- Jobs stored as JSON files in `~/.codex-agent/jobs/`
- Three files per job: `.json` (metadata), `.prompt` (original prompt), `.log` (terminal output)
- Status detection: check if tmux session still exists + look for completion marker string
- Inactivity timeout: 60 minutes (configurable)
- Completion: detected by `[codex-agent: Session complete]` marker in output

### 2.5 Coordination via Shared Log
Multiple Claude instances coordinate via a shared `agents.log` file in the project root. Each logs:
- What agents they spawned
- What findings came back
- What synthesis was produced

**Principle to adopt:** Swarm coordination needs a shared state artifact. Not a database—a human-readable log that any agent can read and write.

---

## Part 3: Isolation & Validation Strategies

### 3.1 Process Isolation via tmux
Each worker runs in its own tmux session—completely isolated OS process. Benefits:
- No shared memory between agents
- Can attach/detach for debugging
- `script` command captures all terminal output
- Sessions survive orchestrator disconnection

### 3.2 Permission-Based Sandboxing
Three tiers enforced by the Codex CLI itself:
- `read-only`: Can read files, can't write anything
- `workspace-write`: Can modify project files
- `danger-full-access`: Unrestricted (almost never used)

**Principle to adopt:** Least-privilege by default. Research = read-only. Implementation = write. Full access requires explicit opt-in.

### 3.3 Validation = Quality Gates Between Pipeline Stages
No automated validation. Instead, the pipeline enforces manual quality gates:

| Stage Transition | Gate |
|---|---|
| Research → Synthesis | Orchestrator reviews and filters findings |
| PRD → Implementation | User approves PRD |
| Implementation → Review | Typecheck passes |
| Review → Testing | Security + quality checks pass |
| Testing → Done | All tests pass |

### 3.4 Output Capture & Metadata Extraction
After completion, the session-parser extracts from Codex's JSONL session files:
- Token usage (input/output/context window/utilization %)
- Files modified (parsed from `apply_patch` tool calls)
- Summary (last assistant message)

**Principle to adopt:** Rich post-execution metadata enables the orchestrator to make informed decisions about what happened.

---

## Part 4: Prompt Engineering Playbook

### 4.1 Identity Framing ("You Are the General")
The SKILL.md opens with a military metaphor that's extremely effective:
- User = Commander (sets vision)
- Claude = General (strategy + coordination)
- Codex = Army (execution)

This framing prevents the orchestrator from "doing it itself"—the most common failure mode.

### 4.2 Aggressive Default Behavior
```
"This is NOT optional - Codex agents are the default for all execution work."
"For ANY task involving [list]... Spawn Codex agents. Do not do it yourself."
```

**Principle:** Be prescriptive about when to delegate. Without strong defaults, the orchestrator will try to do everything itself.

### 4.3 Patience Programming
An entire section dedicated to timing expectations:
- "Do NOT kill agents just because they have been running for 20 minutes"
- "Do NOT assume something is wrong if an agent runs for 30+ minutes"

**Principle:** LLMs are impatient by default. You must explicitly program patience into the orchestrator.

### 4.4 Synthesis as Core Competency
The SKILL.md teaches the orchestrator how to filter findings:
```
"Agent suggests splitting a 9k token file - likely good"
"Agent suggests types for code we didn't touch - skip, over-engineering"
"Agent contradicts itself - investigate further"
```

**Principle:** The orchestrator's unique value is judgment—knowing what to keep and what to discard.

### 4.5 Context Recovery
After context compaction (when the LLM's context window gets trimmed):
```
1. Read agents.log for state
2. Check running agents via jobs --json
3. Resume from where you left off
```

**Principle:** Design for context loss. The swarm state must be recoverable from files alone.

### 4.6 Trigger-Based Activation
The skill defines triggers in frontmatter:
```yaml
triggers:
  - codex-orchestrator
  - spawn codex
  - delegate to codex
  - start agent
```

Plus natural language detection: "investigate", "research", "implement", etc.

---

## Part 5: Command & Integration Patterns

### 5.1 CLI Design Principles
- **Verb-first commands:** `start`, `status`, `send`, `capture`, `kill`, `jobs`
- **Sensible defaults:** Model, reasoning level, sandbox mode all have strong defaults
- **Progressive disclosure:** Simple use = 1 flag. Power use = many flags.
- **Dual output:** Human-readable tables by default, `--json` for programmatic use
- **Escape hatch:** `attach` lets you drop into the raw tmux session

### 5.2 Flag Patterns Worth Adopting
| Pattern | Example | Why |
|---|---|---|
| Repeatable flags | `-f glob -f glob` | Multiple file includes |
| Mode enums | `-s read-only\|workspace-write` | Constrained choices |
| Dry run | `--dry-run` | Preview before execute |
| Strip formatting | `--strip-ansi` | Clean output for piping |

### 5.3 Bidirectional Communication
The killer feature: `send` command lets you talk to running agents mid-task. This transforms agents from fire-and-forget to interactive.

---

## Part 6: Our Custom Architecture

### What We Build (Not Clone)

We already have OpenClaw's subagent system. We don't need tmux sessions or a new CLI. What we need is:

### 6.1 Opus Swarm Orchestrator Prompt
A `SWARM.md` file that teaches the main agent how to be a swarm orchestrator—equivalent to their SKILL.md but for OpenClaw's architecture:

```
Main Agent (Orchestrator)
  ├── Subagent: Research Worker 1
  ├── Subagent: Research Worker 2
  ├── Subagent: Implementation Worker
  └── Subagent: Review Worker
```

Uses OpenClaw's native `exec` tool with subagent spawning, not tmux.

### 6.2 Swarm State File
An `agents.log` equivalent that lives in the workspace:
- What subagents were spawned and why
- What each returned
- Synthesis notes
- Current pipeline stage

This is our context recovery mechanism.

### 6.3 Context Injection
Before spawning workers, auto-generate or load:
- Project file tree
- Architecture summary (equivalent to CODEBASE_MAP.md)
- Current task PRD
- Relevant file contents

Inject into each subagent's task description.

### 6.4 Permission Tiers for Subagents
Define in the orchestrator prompt:
- **Research subagents:** "Read files only. Do not modify anything. Report findings."
- **Implementation subagents:** "You may create and edit files. Follow the PRD."
- **Review subagents:** "Read all files. Report issues. Do not fix them."

### 6.5 Pipeline Stages
Same pipeline, adapted for OpenClaw:

```
1. IDEATION     → Main agent discusses with user
2. RESEARCH     → Spawn read-only subagents in parallel
3. SYNTHESIS    → Main agent reviews subagent results
4. PLANNING     → Main agent writes plan, user approves
5. EXECUTION    → Spawn implementation subagents
6. REVIEW       → Spawn review subagents
7. VERIFICATION → Spawn test/verify subagents
```

### 6.6 Key Differences from codex-orchestrator

| Aspect | codex-orchestrator | Our Opus Swarm |
|---|---|---|
| Worker runtime | tmux + Codex CLI | OpenClaw native subagents |
| Communication | CLI commands | Subagent return values |
| Mid-task redirect | `send` command | Not needed (subagents complete or fail) |
| Monitoring | `capture`/`watch` | Subagent completion callbacks |
| State | JSON files | Workspace log file |
| Multi-orchestrator | Multiple Claude instances | Single main agent (for now) |
| Context injection | `--map` flag | Inline in subagent task description |

### 6.7 Implementation Plan

**Phase 1: Orchestrator Prompt**
- Write `SWARM.md` with pipeline stages, delegation rules, synthesis patterns
- Add to AGENTS.md as an optional mode

**Phase 2: Swarm State Management**
- Define `swarm-log.md` format
- Auto-create on swarm activation
- Read on context recovery

**Phase 3: Context Generation**
- Auto file tree generation
- Project summary extraction
- Smart file selection for subagent context

**Phase 4: Quality Gates**
- Define gate criteria for each stage transition
- User approval hooks for critical stages

---

## Key Takeaways

1. **The orchestrator is a prompt, not a program.** The LLM IS the routing engine.
2. **Course-correct > retry.** Send new instructions, don't restart.
3. **Patience must be programmed.** LLMs will be impatient without explicit instructions.
4. **Shared state via files.** Human-readable logs, not databases.
5. **Permission-based routing.** Read-only for research, write for implementation.
6. **The orchestrator's value is judgment.** Filtering, synthesizing, deciding.
7. **Design for context loss.** Everything recoverable from files alone.
8. **Strong defaults, minimal flags.** Make the common case trivial.
9. **Identity framing matters.** "You are the general" prevents the orchestrator from implementing.
10. **Pipeline = quality gates.** Each stage transition is a checkpoint.
