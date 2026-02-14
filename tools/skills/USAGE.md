# Skills System — Usage Reference

## Overview

Skills are role templates that constrain agent behavior for specific tasks. Instead of writing lengthy role instructions in every prompt, use `--skill` to auto-inject them.

**Result**: ~60% smaller prompts, consistent behavior, no role drift.

## Available Skills

| Skill | Alias | Purpose | Key Constraint |
|-------|-------|---------|----------------|
| `reviewer` | reviewer | Code review | Report only, no fixes |
| `implementer` | implementer | Write code | File ownership, build verification |
| `qa-validator` | qa | Test & validate | Build→Test→Verify→Conflict check |
| `discovery` | discovery | Research | Document findings, no implementation |
| `wiring` | wiring | Integration | Connect existing code only |

## Usage

### With codex-swarm

```bash
# Single agent with skill
codex-swarm start --skill reviewer "Review the auth module for security issues"

# Parallel agents with different skills
codex-swarm parallel \
  --skill reviewer "Review auth/" \
  --skill implementer "Build the payment module" \
  --skill qa "Validate all modules build and tests pass"
```

### With skill-loader.sh directly

```bash
# Inject skill into a prompt
source tools/skills/skill-loader.sh
inject_skill reviewer "Review the auth module"
# Returns: [full skill template + task prompt]
```

### New Flags

```bash
# --compaction: Enable context window management
# Compacts conversation history when approaching token limits
codex-swarm start --skill implementer --compaction "Build feature X"

# --timeout: Set execution timeout (default: 30m)
codex-swarm start --skill qa --timeout 45m "Run full test suite"

# Combined
codex-swarm parallel \
  --skill reviewer --timeout 15m "Quick review of utils/" \
  --skill implementer --compaction --timeout 60m "Implement new API endpoints"
```

## Skill Details

### Reviewer
- **Use when**: You need code analyzed without changes
- **Output**: Structured review (Critical 🔴 / Warning 🟡 / Info 🔵)
- **Verdict**: BLOCK / APPROVE / APPROVE_WITH_NOTES
- **Example**: `--skill reviewer "Review PR #42 for security and correctness"`

### Implementer  
- **Use when**: You need code written or modified
- **Output**: Working code + build verification checklist
- **Requires**: Declared file ownership before writing
- **Example**: `--skill implementer "Implement user authentication with JWT"`

### QA Validator
- **Use when**: You need to verify work is correct
- **Output**: QA Report (Build→Tests→Verification→Conflicts)
- **Verdict**: SHIP IT / BLOCK
- **Example**: `--skill qa "Validate the payment module after merge"`

### Discovery
- **Use when**: You need research before implementation
- **Output**: Master Improvement List with priority matrix
- **Example**: `--skill discovery "Analyze our API performance bottlenecks"`

### Wiring
- **Use when**: You need to connect modules together
- **Output**: Wiring report (connections made / blocked)
- **Constraint**: No new implementations — only imports, configs, registrations
- **Example**: `--skill wiring "Connect the new auth module to the API router"`

## Prompt Size Comparison

### Before (manual role instructions)
```
You are a code reviewer. Your job is to analyze code and report findings. 
Do not fix anything. Do not modify code. Report issues with severity levels.
Use the following format: Critical issues first, then warnings, then info.
For each issue include the file, line number, description, and why it matters.
Check for: correctness, security, performance, style, architecture.
Be specific. Prioritize. Don't nitpick formatting if there are real bugs.
After review, give a verdict: BLOCK, APPROVE, or APPROVE_WITH_NOTES.

Now review the auth module for security issues.
```
**~500 characters of role setup per prompt**

### After (with --skill)
```bash
codex-swarm start --skill reviewer "Review the auth module for security issues"
```
**~50 characters. Same behavior. 90% reduction in prompt text.**

(The skill template is injected automatically and is more thorough than hand-written instructions.)

## Creating Custom Skills

Add a markdown file to `tools/skills/`:

```markdown
# Skill: MySkill

## Role
You are a [role]. Your job is [purpose].

## Constraints
- [hard rule 1]
- [hard rule 2]

## Output Format
[structured output template]

## Behavior
- [guideline 1]
- [guideline 2]
```

Then reference it: `--skill myskill` (filename without .md).
