# Opus Orchestrator (Custom Multi-Agent Swarm)

## Vision

An intelligent multi-agent system where **Opus acts as the orchestrator** (analyzing tasks, delegating work) and spawns up to **5 specialized subagents** based on task type.

- **Orchestrator:** Opus (smart task routing, synthesis)
- **Subagent 1-2:** Codex (coding tasks)
- **Subagent 3:** Content (viral hooks, strategy)
- **Subagent 4:** Analytics (metrics, trends, data)
- **Subagent 5:** Trend Scout (research, market intelligence)

Each runs in parallel, reports back to Opus, Opus synthesizes final answer.

---

## Architecture

```
User Request
    ↓
[Opus Orchestrator] (Analyzes task, decides routing)
    ↓
    ├→ Codex Subagent 1 (if code task)
    ├→ Codex Subagent 2 (if parallel coding needed)
    ├→ Content Subagent (if creative/strategy)
    ├→ Analytics Subagent (if data analysis)
    └→ Trend Scout Subagent (if research needed)
    ↓
[Wait for all to complete (parallel execution)]
    ↓
[Opus Synthesizes Results] + Returns to user
```

---

## Implementation (Built on OpenClaw's `sessions_spawn`)

### Core Tools Used

- `sessions_spawn(task, label?, model?, runTimeoutSeconds?)` — Spawn isolated subagent
- `sessions_list(kinds=['subagent'])` — Check subagent status
- `sessions_history(sessionKey)` — Fetch subagent results
- `sessions_send(sessionKey, message)` — Send follow-up to subagent

### Key Constraints (OpenClaw native)

✅ Can spawn **N subagents** from Opus (no limit enforced)  
✅ Subagents run **in parallel** (gateway queues them independently)  
✅ Each can have **different model** (override at spawn time)  
✅ Each subagent has **isolated session** (no cross-talk)  
✅ Subagents **can't spawn other subagents** (one level max)  
✅ Results **auto-announced** back to orchestrator  

⚠️ Subagent max runtime default: 300 seconds (configurable)  
⚠️ Subagent sessions archived after 60 minutes (configurable)  

---

## Opus Routing Logic

Opus decides task type and spawns accordingly:

```
If "code" or "programming" in task:
  → Spawn Codex Subagent (model: openai-codex)
  
If "viral" or "hook" or "content" in task:
  → Spawn Content Subagent (model: opus)
  
If "trend" or "research" or "market" in task:
  → Spawn Trend Scout Subagent (model: opus)
  
If "metric" or "analytics" or "performance" in task:
  → Spawn Analytics Subagent (model: opus)
```

---

## Config Changes Required

### 1. Set Opus as Default (for orchestration)

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",  // Changed from Haiku
        fallbacks: ["anthropic/claude-haiku-4-5"]  // Haiku as fallback
      }
    }
  }
}
```

### 2. Enable Codex (if you have OpenAI Code subscription)

```json5
{
  auth: {
    profiles: {
      "openai-codex": {
        provider: "openai-codex",
        mode: "oauth"  // or "api_key" if using API
      }
    }
  },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "openai-codex/gpt-5.3-codex": { alias: "codex" }
      }
    }
  }
}
```

### 3. Subagent Concurrency (up to 5 parallel)

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 5  // Allow up to 5 parallel subagents
      }
    }
  }
}
```

---

## How Opus Orchestrates (Prompt Strategy)

Opus gets a special system prompt:

```
You are the lead orchestrator in a multi-agent team.

When you receive a task, analyze it and decide:
1. Does it require CODING? Spawn a Codex subagent
2. Does it need VIRAL/CONTENT strategy? Spawn a Content subagent
3. Does it need DATA/ANALYTICS? Spawn an Analytics subagent
4. Does it need RESEARCH/TRENDS? Spawn a Trend Scout subagent

Use sessions_spawn() to spawn subagents in parallel.
Assign each a clear task description and label.
Wait for all to complete.
Synthesize their results into a final, coherent answer.

Example:
  - User: "Generate TikTok hooks and also analyze trending audio"
  - You spawn:
    - Content subagent: "Generate 10 viral TikTok hooks for viral audio trends"
    - Trend Scout: "Analyze current trending audio on TikTok"
  - Wait for both
  - Synthesize: "Here are the hooks [content] based on these trends [research]"
```

---

## Workflow Example

### User Request
```
"Build a NiggaBets launch strategy combining viral content hooks, 
technical setup automation, and market research"
```

### Opus Decision
This needs:
1. **Content Subagent** → Generate viral hooks + strategy
2. **Trend Scout Subagent** → Research market + competitors
3. **Codex Subagent** → Automation scripts/setup

### Opus Spawns (Parallel)
```python
result1 = sessions_spawn(
  task="Generate 10 viral hooks for NiggaBets casino launch. Focus on black culture, meme appeal, shock value. Explain why each will go viral.",
  label="content-niggabets-hooks",
  model="anthropic/claude-opus-4-6",
  runTimeoutSeconds=60
)

result2 = sessions_spawn(
  task="Research current meme casino trends, competitor meme brands, viral African-American culture content on TikTok. What's working right now?",
  label="trend-niggabets-research",
  model="anthropic/claude-opus-4-6",
  runTimeoutSeconds=60
)

result3 = sessions_spawn(
  task="Create automation scripts for: (1) batch image generation via ComfyUI, (2) auto-posting to TikTok/Instagram, (3) metrics collection. Use Python + existing APIs.",
  label="codex-niggabets-automation",
  model="openai-codex/gpt-5.3-codex",  # Codex for code
  runTimeoutSeconds=120
)
```

### Wait + Synthesize
```python
# OpenClaw auto-announces results back to Opus
# Opus receives all 3 results in sequence
# Opus synthesizes:

"NiggaBets Launch Strategy:

VIRAL HOOKS (from Content subagent):
- [10 hooks with reasoning]

MARKET RESEARCH (from Trend Scout):
- [Current trends, what's working]

TECHNICAL AUTOMATION (from Codex):
- [Automation scripts, setup code]

COMBINED STRATEGY:
[Opus synthesizes: how hooks align with trends, 
how automation enables scale, timeline, next steps]"
```

---

## Files to Create

- `[[tools/Opus-Orchestrator]]` (this file)
- `[[tools/Opus-Orchestrator-config]]` — Config changes
- `[[tools/Opus-Orchestrator-prompts]]` — System prompts for Opus + subagents
- `[[tools/Codex-Subagent]]` — Codex specialization
- `[[tools/Content-Subagent]]` — Content specialization
- `[[tools/Trend-Scout-Subagent]]` — Research specialization
- `[[tools/Analytics-Subagent]]` — Data specialization

---

## Next Steps

1. Verify Codex access (or decide on alternative coding model)
2. Update config with Opus + subagent settings
3. Create specialized system prompts for each subagent type
4. Test with a real task: "Analyze [project] and generate strategy"
5. Monitor performance (speed, cost, quality)
6. Document lessons learned + refine routing logic

---

## Cost Optimization

- **Orchestrator uses Opus** (expensive but smart routing) — ~$0.03 per request
- **Subagents default to Opus** (can override to Haiku for cost reduction)
- **Codex only for coding** (expensive specialized model)
- **Consider:** Use Haiku for subagents when possible, Opus only when needed

```json5
// Alternative: Use Haiku for subagents, Opus only for orchestration
sessions_spawn(
  task: "...",
  model: "anthropic/claude-haiku-4-5"  // Cheaper subagent
)
```

---

This is a fully custom architecture, built on OpenClaw's native `sessions_spawn` capability. No external dependencies. Full control. Ready to build?
