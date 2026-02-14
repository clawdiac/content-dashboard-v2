# Opus Orchestrator — Testing Plan

## Phase 1: Smoke Tests (Day 1)

### Test 1.1: Single Subagent Spawn
```
Prompt: "Write a Python script that generates 5 random meme captions"
Expected: Opus spawns 1 Codex subagent, returns code
Pass criteria: Subagent completes, code is runnable
```

### Test 1.2: Multi-Subagent Parallel
```
Prompt: "I need viral TikTok hooks AND research on trending casino memes"
Expected: Opus spawns Content + Trend Scout in parallel
Pass criteria: Both complete, Opus synthesizes into unified response
```

### Test 1.3: All Subagent Types
```
Prompt: "Build a NiggaBets launch plan: hooks, market research, analytics framework, and automation scripts"
Expected: Opus spawns all 4 types (Content, Trend Scout, Analytics, Codex)
Pass criteria: All 4 complete within 120s, synthesis is coherent
```

## Phase 2: Routing Accuracy (Day 2-3)

### Test 2.1: Correct Type Detection
| Input | Expected Subagent(s) |
|-------|---------------------|
| "Write a TikTok upload script" | Codex |
| "What meme formats are trending?" | Trend Scout |
| "Generate 10 viral hooks for NiggaBets" | Content |
| "Analyze our engagement rate vs competitors" | Analytics |
| "Research trends AND write hooks based on them" | Trend Scout + Content |
| "Full campaign: research + content + automation" | Trend Scout + Content + Codex |

### Test 2.2: Edge Cases
| Input | Expected Behavior |
|-------|------------------|
| "What time is it?" | No subagents (direct answer) |
| "Summarize this article" | No subagents (direct answer) |
| "Do everything for NiggaBets" | Opus asks for clarification OR spawns all |
| Very long prompt (2000+ chars) | Opus correctly parses and routes |

## Phase 3: Quality & Synthesis (Day 3-5)

### Test 3.1: Synthesis Quality
```
Prompt: Complex multi-part task
Evaluate:
- Does Opus correctly combine subagent outputs?
- Is the synthesis more than just concatenation?
- Are contradictions between subagents resolved?
- Is there a clear executive summary?
```

### Test 3.2: Failure Handling
| Scenario | Expected |
|----------|----------|
| Subagent times out | Opus reports partial results + what failed |
| Subagent returns low-quality output | Opus notes limitation, doesn't pass through garbage |
| 5/5 subagent slots used + new request | Queued or graceful rejection |

## Phase 4: Performance Benchmarks (Week 1)

### Metrics to Track
| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total response time | < 120s for multi-agent | Timestamp first message → final response |
| Subagent success rate | > 95% | Completed / spawned |
| Routing accuracy | > 90% | Manual review of 20 tasks |
| Synthesis quality | ≥ 4/5 | Kevin rates usefulness |
| Cost per orchestrated task | < $0.10 | Sum of all model costs |

## Phase 5: Stress Test (Week 2)

### Test 5.1: Concurrent Load
- Send 3 orchestrated tasks in rapid succession
- Verify subagents don't conflict or block each other
- Check maxConcurrent (8) isn't exceeded

### Test 5.2: Long-Running Tasks
- Code generation task that takes >90s
- Verify timeout handling works
- Verify orchestrator waits patiently

## Test Log Template
```markdown
| Date | Test | Input (summary) | Subagents Spawned | Time | Quality (1-5) | Notes |
|------|------|-----------------|-------------------|------|---------------|-------|
| | | | | | | |
```

## Go/No-Go Criteria
- [ ] Phase 1 all pass
- [ ] Phase 2 routing accuracy > 85%
- [ ] Phase 3 synthesis rated ≥ 3/5 on 5 tests
- [ ] Phase 4 meets target benchmarks
- [ ] No critical failures in Phase 5
