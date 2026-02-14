# Opus Orchestrator - Configuration

## Changes Required to openclaw.json

### Current State
```json5
{
  model: "anthropic/claude-haiku-4-5",  // Haiku (cheap)
  fallback: "anthropic/claude-opus-4-6"  // Opus (fallback)
}
```

### New State (Opus Orchestrator Enabled)
```json5
{
  model: {
    primary: "anthropic/claude-opus-4-6",  // Opus (orchestrator)
    fallbacks: [
      "anthropic/claude-haiku-4-5"  // Haiku (fallback for cost)
    ]
  },
  models: {
    "anthropic/claude-opus-4-6": { alias: "opus" },
    "anthropic/claude-haiku-4-5": { alias: "haiku" },
    "openai-codex/gpt-5.3-codex": { alias: "codex" }  // If you have Codex
  },
  subagents: {
    maxConcurrent: 5  // Up to 5 parallel subagents
  }
}
```

---

## Implementation Steps

### Option A: Opus Orchestrator (Full Power)
```bash
openclaw models set anthropic/claude-opus-4-6
# (Keep Haiku as fallback - already configured)
```

Then add Codex (optional, for code tasks):
```bash
openclaw onboard --auth-choice openai-codex
# or manual: OpenAI Code subscription setup
```

### Option B: Hybrid (Cost-Optimized)
Keep Haiku as primary for most tasks, but Opus for orchestration:
```bash
# Keep Haiku default
openclaw models set anthropic/claude-haiku-4-5
# Haiku handles routine tasks

# But when spawning Opus orchestrator:
sessions_spawn(task: "...", model: "anthropic/claude-opus-4-6")
# Explicitly ask for Opus when needed
```

### Option C: Full Switch to Opus
```bash
# Everything uses Opus (most expensive, but best quality)
openclaw models set anthropic/claude-opus-4-6
```

---

## My Recommendation

**Hybrid Approach (Option B):**
- **Default:** Haiku (for everyday tasks, cost-efficient)
- **Orchestrator:** Spawn Opus explicitly when handling complex multi-agent tasks
- **Codex:** Optional (only if you have active OpenAI Code subscription)

This balances cost (~$0.01/task) with quality (Opus for strategy).

---

## Config Patch (Ready to Apply)

To enable Opus orchestrator + 5 concurrent subagents:

```bash
openclaw gateway restart  # First, ensure fresh state

# Then apply config:
openclaw gateway --subagents.maxConcurrent 5
```

Or manually edit `~/.openclaw/openclaw.json`:

```json5
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": ["anthropic/claude-haiku-4-5"]
      },
      "models": {
        "anthropic/claude-opus-4-6": { "alias": "opus" },
        "anthropic/claude-haiku-4-5": { "alias": "haiku" },
        "openai-codex/gpt-5.3-codex": { "alias": "codex" }
      },
      "subagents": {
        "maxConcurrent": 5
      }
    }
  }
}
```

---

## Testing the Setup

Once configured, test with:

```
You (to Clawdia): "I need a NiggaBets launch strategy. 
Research trends, generate viral hooks, and write automation scripts."

Clawdia (Opus orchestrator) will:
1. Decide this needs 3 subagents
2. Spawn Trend Scout, Content, Codex subagents in parallel
3. Wait for all to complete
4. Synthesize results into final strategy
```

---

## Cost Impact

### Before (Haiku only)
- Per request: ~$0.001
- Orchestration quality: Medium

### After (Opus orchestrator)
- Per request: ~$0.03 (Opus) + subagent costs
- Orchestration quality: High (better routing, synthesis)
- If subagents are Haiku: ~$0.03 + $0.003*3 = ~$0.04 total

### Budget Estimation
- 10 orchestrator tasks/day = $0.30/day = ~$10/month overhead
- Scales well as you do more tasks

---

## Next: Ready to Apply?

Should I:
1. ✅ Keep Haiku as default (safer, cheaper)
2. ✅ Add Opus config for orchestrator mode
3. ✅ Configure subagents to use Haiku (cost optimization)
4. ✅ Set max concurrent to 5
5. ✅ Create system prompts for orchestrator + subagents

Then restart gateway and you're ready to launch multi-agent swarms!
