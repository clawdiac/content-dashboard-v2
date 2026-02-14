# x-reader Skill Setup — 2026-02-14

## Built ✅

Created a custom X (Twitter) post reader skill with **zero dependencies** (Node.js built-in modules only).

### Location
`~/.openclaw/workspace/skills/x-reader/`
- `index.js` — Main implementation
- `SKILL.md` — Skill description
- `package.json` — Metadata
- `README.md` — Full documentation

### How It Works

1. **Nitter fallback** — Tries multiple FOSS Twitter mirror instances
2. **Archive.org** — Falls back to Web Archive snapshots
3. **Manual paste** — User can paste tweet text directly

Output: Structured JSON with author, content, metrics, media, timestamp.

### Current Status

- ✅ Skill scaffolding complete
- ✅ Parsing logic ready
- ⚠️ Nitter instances currently returning 403 (rate limited)
- 🔧 Workaround: Use Archive.org or manual paste for now

### Usage Pattern

```
Me: x-reader https://x.com/oliverhenry/status/2022011925903667547
Kevin: [if Nitter is blocked] Here's the tweet text: "..."
Me: [Stores parsed insights in memory]
```

### Fallback Approach

When automated fetching fails, Kevin can:
1. Copy/paste tweet text directly
2. I parse and extract insights
3. Store in memory for viral analysis

This keeps the workflow moving while we solve infrastructure issues.

### Next Steps

- Test with different Nitter instances
- Add rate-limit handling + exponential backoff
- Integrate with memory store for automatic insight capture
- Build visualization of viral patterns
