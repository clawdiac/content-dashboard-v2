# Decision: Opus Orchestrator Multi-Agent System

**Date:** 2026-02-13  
**Status:** Proposed  
**Author:** Clawdia (subagent)

## Context
Kevin is building AI content production at scale for TikTok/Instagram (NiggaBets meme casino, viral content). The Opus Orchestrator enables complex tasks to be decomposed and executed in parallel by specialized subagents.

## Decision
Implement a multi-agent orchestrator using OpenClaw's native `sessions_spawn` with 4 specialist subagent types: Codex, Content Creator, Trend Scout, Analytics Expert.

## Architecture
- **Orchestrator:** Opus (claude-opus-4-6) — routes tasks, synthesizes results
- **Subagents:** Up to 5 concurrent, each with specialized prompts
- **No external dependencies** — built entirely on OpenClaw primitives

## Key Trade-offs

### 1. Opus as Default vs. Hybrid Model
| | Opus Default | Hybrid (Haiku default + Opus orchestrator) |
|---|---|---|
| Cost | ~$0.03/request base | ~$0.001/request base, $0.03 only for orchestration |
| Quality | Best routing always | Haiku handles simple tasks, Opus for complex |
| **Chosen** | | **✅ Hybrid** |

**Rationale:** Most tasks don't need orchestration. Keep Haiku as default, invoke Opus explicitly for multi-agent work. Saves ~$0.87/day at 30 tasks/day.

### 2. Subagent Model Choice
| | All Opus | Haiku Subagents | Mixed |
|---|---|---|---|
| Cost per orchestrated task | ~$0.15 | ~$0.04 | ~$0.08 |
| Quality | Best | Good for simple tasks | Optimized |
| **Chosen** | | | **✅ Mixed (start Opus, downgrade per type if quality holds)** |

### 3. Codex Model
| | OpenAI Codex | Opus for Code | Haiku for Code |
|---|---|---|---|
| Requires | OpenAI subscription | Nothing extra | Nothing extra |
| Code quality | Specialized | Very good | Acceptable |
| **Chosen** | | **✅ Opus (no Codex subscription yet)** | |

**Rationale:** Kevin doesn't have an OpenAI Codex subscription. Opus handles code well. Revisit if code quality becomes a bottleneck.

## Risks & Mitigations

### High Impact
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cost overrun from excessive spawning | Medium | High | Track costs weekly in performance.md; set spending alerts |
| Subagent timeout on complex tasks | Medium | Medium | 120s timeout for code, 90s for research; orchestrator handles partial results |
| Poor routing (wrong subagent type) | Low | Medium | Test routing accuracy in Phase 2; refine trigger keywords |

### Medium Impact
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Synthesis is just concatenation (no added value) | Medium | Medium | Refine orchestrator prompt; test synthesis quality explicitly |
| Subagents give contradictory information | Low | Medium | Orchestrator prompt includes conflict resolution instructions |
| maxConcurrent (8) hit during parallel use | Low | Low | Monitor; increase if needed |

### Low Impact
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Trend Scout returns stale data | Medium | Low | Prompt emphasizes web_search over training data |
| Content hooks feel formulaic over time | Medium | Low | Rotate prompt variations; inject randomness |

## Limitations
1. **No cross-subagent communication** — Subagents can't talk to each other; only Opus sees all outputs
2. **One level deep** — Subagents cannot spawn their own subagents
3. **No persistent state** — Each subagent starts fresh; no memory of previous tasks
4. **Web search quality** — Trend Scout depends on Brave Search API quality for real-time data
5. **No real TikTok API** — Actual posting/metrics requires API setup not yet done
6. **Token limits** — Very large orchestrated responses may hit context limits during synthesis

## Gotchas
- **Don't spawn subagents for simple tasks.** "What time is it?" should NOT trigger orchestration.
- **Subagent labels matter.** Use descriptive labels for debugging (`content-niggabets-hooks`, not `task-1`).
- **Timeout ≠ failure.** A timed-out subagent may have produced partial useful output — check history.
- **Cost compounds fast.** 4 Opus subagents + 1 Opus orchestrator = ~5x normal cost per request.
- **The config patch doesn't change the default model.** Orchestration is invoked by Opus's judgment, not by config forcing all requests through Opus.

## Config Patch Required
See below — applies to `~/.openclaw/openclaw.json`. The main change is bumping subagent concurrency (already at 8, sufficient) and documenting the model aliases.

## Success Criteria
1. Multi-agent tasks complete in < 120s
2. Routing accuracy > 90% after first week
3. Kevin rates synthesis quality ≥ 4/5 on average
4. Cost stays under $15/month for orchestrated tasks
5. No critical failures in first 2 weeks

## Next Steps
1. Apply config patch
2. Run Phase 1 smoke tests
3. Iterate prompts based on output quality
4. Track performance weekly
