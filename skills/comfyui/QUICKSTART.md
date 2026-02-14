# ComfyUI Skill - Quick Start (5 Minutes)

## 1. Install

```bash
cd ~/.openclaw/workspace/skills/comfyui/
npm install
```

## 2. Test It (Mock Mode)

```bash
node index.js --idea "AI streamer shocked by huge win" --type image
```

Output should show:
- ✓ Prompt building
- ✓ Workflow queued
- ✓ Auto-approved (mock mode)
- ✓ Skill updated

## 3. Set Up Telegram (Optional)

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC..."
export TELEGRAM_CHAT_ID="987654321"
```

Then re-run - it will wait for your approval on Telegram instead of auto-approving.

## 4. Common Commands

```bash
# Generate image
node index.js --idea "your idea" --type image

# Generate video
node index.js --idea "your idea" --type video

# Add category for learning
node index.js --idea "your idea" --category "AI Streamer Reactions"

# Check what you've learned
node index.js --stats

# Verify setup
node index.js --health-check
```

## 5. Use in Code

```javascript
import ComfyUISkill from './index.js';

const skill = new ComfyUISkill();

// Simple generation
const result = await skill.generate({
  idea: 'shocked AI streamer',
  type: 'image'
});

// Get stats
console.log(skill.getStats());

// Specialize for different content
await skill.generateStreamerReaction('big win', { emotion: 'shocked' });
await skill.generateHighlight('goal scored', { sport: 'soccer' });
await skill.generateNiggaBetsContent('crazy odds', { style: 'bold' });
```

## Workflow

```
You: Generate content
  ↓
Skill: Builds prompt + queues
  ↓
ComfyUI: Generates (or mocked)
  ↓
Skill: Saves locally
  ↓
Telegram: Posts for approval (or auto-approves)
  ↓
You: Approve/Reject/Feedback
  ↓
Skill: Updates learning file
  ↓
Next Time: Prompts improve automatically
```

## File Locations

- **Skill:** `~/.openclaw/workspace/skills/comfyui/`
- **Outputs:** `~/.openclaw/cache/comfyui-outputs/`
- **Learning:** `~/.openclaw/workspace/skills/comfyui/skill-file.md`

## Help

- **Feature Guide:** `SKILL.md`
- **Setup Guide:** `README.md`
- **Architecture:** `ARCHITECTURE.md`
- **Code Examples:** `tests/example.test.js`

## Troubleshooting

**"TELEGRAM_BOT_TOKEN not set"**
→ It's OK, runs in mock mode. To enable: `export TELEGRAM_BOT_TOKEN="..."`

**"ComfyUI API error"**
→ Expected in mock mode. When RunPod is ready: `export COMFYUI_API_ENDPOINT="..."`

**"Approval timeout"**
→ Reply on Telegram within the time limit: `APPROVE` / `REJECT` / `[FEEDBACK] ...`

**How to reset?**
→ Delete `skill-file.md` - it will regenerate empty
→ Delete `~/.openclaw/cache/comfyui-outputs/` - to clear outputs

## Next Steps

1. ✅ Run `npm install`
2. ✅ Test with `node index.js --idea "test" --type image`
3. ✅ (Optional) Set up Telegram env vars
4. ✅ Generate your first content
5. ✅ Approve on Telegram (if configured)
6. ✅ Check `skill-file.md` to see learning
7. ✅ Generate more - watch quality improve!

---

Ready! 🚀 Start generating amazing content!
