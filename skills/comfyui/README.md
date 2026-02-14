# ComfyUI OpenClaw Skill - Setup Guide

**Production-ready skill for AI content generation with Telegram approval workflow and machine learning.**

## Quick Start

### 1. Install Dependencies

```bash
cd ~/.openclaw/workspace/skills/comfyui/
npm install
```

### 2. Configure Environment (Optional)

```bash
# If you have ComfyUI running locally:
export COMFYUI_API_ENDPOINT="http://localhost:8188"

# For Telegram approval workflow:
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

### 3. Test It

```bash
# Mock mode (no Telegram/ComfyUI needed)
node index.js --idea "test image" --type image

# Check skill statistics
node index.js --stats

# Health check
node index.js --health-check
```

## Setup Steps

### Step 1: Set Up Telegram (Optional but Recommended)

The approval workflow sends generated content to Telegram for human review.

#### Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Type `/newbot`
3. Follow prompts to name your bot
4. Save the **Bot Token** (looks like `123456789:ABCdefGHIjklmnoPQRstuvwxyzABC...`)

#### Get Your Chat ID

1. Create a private Telegram channel or use a private chat
2. Add your bot to the channel
3. Send a message: `/start`
4. Use this to get your chat ID:
   ```bash
   curl "https://api.telegram.org/bot123456789:ABCdefGHI.../getUpdates"
   ```
5. Look for `"chat":{"id":123456789}` in the response

#### Set Environment Variables

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

Or add to `~/.zshrc` / `~/.bashrc`:

```bash
# ~/.zshrc or ~/.bashrc
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

### Step 2: Set Up ComfyUI (Later - Will Be RunPod)

**For now:** Skill works in mock mode.

**Later, when RunPod is set up:**

```bash
export COMFYUI_API_ENDPOINT="https://your-runpod-endpoint.com"
```

The skill will automatically queue workflows to that endpoint.

### Step 3: Create Output Directory

```bash
mkdir -p ~/.openclaw/cache/comfyui-outputs
```

## Architecture Overview

```
┌─────────────┐
│  OpenClaw   │
│   Agent     │
└──────┬──────┘
       │ calls skill
       ▼
┌─────────────────────┐
│  ComfyUI Skill      │
│  ┌───────────────┐  │
│  │ Prompt Engine │◄─┼─── Learns from feedback
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │ Workflow Mgr  │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │ queues workflow
           ▼
┌─────────────────┐
│  ComfyUI API    │
│  (LocalHost or  │
│   RunPod)       │
└────────┬────────┘
         │ generates
         ▼
    Image/Video
         │
         ▼
┌──────────────────┐
│ Telegram Sender  │
└────────┬─────────┘
         │ sends for approval
         ▼
     Telegram
         │ user responds
         │ APPROVE/REJECT/FEEDBACK
         ▼
┌──────────────────────┐
│ Skill File Manager   │
│ (Updates learning)   │
└──────────────────────┘
```

## File Structure

```
~/.openclaw/workspace/skills/comfyui/
├── index.js                          # Main skill logic
├── package.json                      # Dependencies
├── SKILL.md                          # Feature documentation
├── README.md                         # This file (setup guide)
├── skill-file.md                     # Auto-generated learning file
│
├── lib/
│   ├── workflow-manager.js           # ComfyUI API integration
│   ├── telegram-sender.js            # Telegram approval workflow
│   ├── prompt-engine.js              # Intelligent prompt building
│   └── skill-file-manager.js         # Persistent skill storage
│
└── templates/
    ├── image-workflow.json           # SD3 image generation template
    └── video-workflow.json           # Video generation template

~/.openclaw/cache/comfyui-outputs/
└── [generated images and videos]
```

## Usage Examples

### Example 1: Generate an Image (Mock Mode)

```bash
node index.js --idea "AI streamer shocked by huge win" --type image
```

Output:
```
🎬 ComfyUI Skill: Generating image
   Idea: AI streamer shocked by huge win
   Category: General

📝 Step 1: Building prompt...
   Prompt: AI streamer character reacting with shocked expression...

⏳ Step 2: Queuing to ComfyUI...
   Job ID: job-1707360000000-abc1234
   Prompt ID: abc123def456...

⏳ Step 3: Waiting for generation (this may take a minute)...
   ✅ Generation complete!
   Saved to: /Users/clawdia/.openclaw/cache/comfyui-outputs/...

📱 Step 4: Sending to Telegram for approval...
   [MOCK] Sending image: ...
   (Auto-approving in mock mode)

📚 Step 5: Updating skill from feedback...
   ✅ Skill updated!

✅ Success!
```

### Example 2: Generate a Specialized Content (Telegram Active)

```bash
# With Telegram configured, will wait for human approval
node index.js --idea "AI reacting to bet loss" --type image --category "AI Streamer Reactions"
```

What happens:
1. Generates image
2. Posts to Telegram with caption
3. Kevin (or you) replies: `APPROVE` / `REJECT` / `[FEEDBACK] make it less sad`
4. Skill learns from the response
5. Updates skill file

### Example 3: Check Skill Stats

```bash
node index.js --stats
```

Output:
```json
{
  "totalApproved": 5,
  "totalFailed": 1,
  "totalPatterns": 8,
  "categories": [
    "AI Streamer Reactions",
    "Gaming Highlights"
  ],
  "successRate": 83.33,
  "lastUpdated": "2026-02-13T21:40:00.000Z"
}
```

### Example 4: Use in Node.js Code

```javascript
import ComfyUISkill from './index.js';

const skill = new ComfyUISkill({
  apiEndpoint: 'https://my-runpod-endpoint.com'
});

// Generate streamer reaction
const result = await skill.generateStreamerReaction('crazy odds hit', {
  emotion: 'shocked',
  intensity: 'high'
});

console.log(result);
// {
//   jobId: "job-...",
//   status: "completed",
//   approvalStatus: "APPROVE",
//   outputPath: "/Users/clawdia/.openclaw/cache/comfyui-outputs/..."
// }

// Get what we've learned
console.log(skill.getStats());
console.log(skill.getApprovedPrompts('AI Streamer Reactions'));
```

## Workflow: End-to-End

### When You Generate Content

1. **You:** "Generate a shocked AI streamer reaction"
2. **Skill:** Builds detailed prompt (+ learned patterns)
3. **Skill:** Queues to ComfyUI
4. **ComfyUI:** Generates image
5. **Skill:** Saves locally to `~/.openclaw/cache/comfyui-outputs/`
6. **Skill:** Sends to Telegram with message:
   ```
   [APPROVAL] AI streamer shocked by big win
   Job ID: job-1707360000000-abc
   
   Reply with:
   ✅ APPROVE
   ❌ REJECT
   📝 [FEEDBACK] your feedback
   ```
7. **You (on Telegram):** Reply `APPROVE`
8. **Skill:** Records the approved prompt + learns patterns
9. **Skill File:** Updated with new learning
10. **Next Time:** Future "shocked reaction" prompts will use learned patterns

### Success Tracking

The skill file (`skill-file.md`) stores:

- ✅ **What works** - Approved prompts that generated good content
- ❌ **What doesn't** - Failed attempts and why
- 🎯 **Patterns** - Techniques that consistently improve quality

Example:
```markdown
## ✅ Approved Prompts

### AI Streamer Reactions
- Idea: AI streamer shocked by big win
  - Prompt: `AI streamer character reacting with shocked expression, close-up face, cinematic lighting...`
  - Result: Perfect reaction, high energy
  - Notes: User approved
  - Date: 2/13/2026

## 🎯 Discovered Patterns
- close-up face composition
- dramatic lighting
- high emotional intensity
- 8k resolution keyword
```

## Troubleshooting

### Telegram Not Working

**Problem:** "TELEGRAM_BOT_TOKEN not set"

**Solution:**
```bash
export TELEGRAM_BOT_TOKEN="your-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

Or run in mock mode (works without Telegram):
```bash
node index.js --idea "test" --type image
```

### ComfyUI Not Reachable

**Problem:** "ComfyUI API error: Connection refused"

**Solution:**
- For now, skill works in mock mode
- When RunPod is ready:
  ```bash
  export COMFYUI_API_ENDPOINT="https://runpod-endpoint"
  node index.js --health-check
  ```

### Health Check

```bash
node index.js --health-check
```

Output:
```json
{
  "apiHealthy": false,
  "hasLearnings": false,
  "endpoint": "http://localhost:8188"
}
```

- `apiHealthy: true` = ComfyUI is reachable
- `hasLearnings: true` = Skill has learned from previous approvals

### Job Stuck/Timeout

Default timeout is 5 minutes. If generation takes longer, adjust in code:

```javascript
const result = await skill.generate({
  idea: "...",
  maxWaitMs: 600000  // 10 minutes
});
```

## Customization

### Add Custom Workflow

1. Export workflow from ComfyUI UI
2. Save to `templates/custom-workflow.json`
3. Use in code:
   ```javascript
   const workflow = skill._loadWorkflow('custom');
   ```

### Adjust Generation Parameters

Edit `lib/prompt-engine.js` and `lib/workflow-manager.js`:

```javascript
// Default quality settings
steps: 30          // Number of denoising steps (higher = better)
cfg: 7.5           // Classifier-free guidance scale
sampler: "dpmpp_2m_karras"  // Sampling algorithm
```

### Extend Categories

Add new categories in `lib/prompt-engine.js`:

```javascript
_getCategoryEnhancements(category) {
  const enhancements = {
    'My Custom Category': ', my custom modifiers...',
  };
  return enhancements[category] || '';
}
```

## Integration with OpenClaw

To call this skill from the main OpenClaw agent:

```javascript
// In your OpenClaw skill registration
/skill/comfyui "generate shocked streamer reaction"
/skill/comfyui "gaming highlight slow motion" --type video
/skill/comfyui --stats
```

The skill will:
1. Process the request
2. Generate content
3. Send to Telegram for approval (if configured)
4. Return results and update learnings

## Production Checklist

- [ ] Set `TELEGRAM_BOT_TOKEN` environment variable
- [ ] Set `TELEGRAM_CHAT_ID` environment variable
- [ ] Create `~/.openclaw/cache/comfyui-outputs/` directory
- [ ] Test with `node index.js --health-check`
- [ ] Generate first content and approve via Telegram
- [ ] Monitor `skill-file.md` for learned patterns
- [ ] Update RunPod endpoint when ready
- [ ] Monitor logs for API errors

## Next Steps

1. **Test Mock Mode** (works now)
   ```bash
   node index.js --idea "test" --type image
   ```

2. **Set Up Telegram** (optional but recommended)
   ```bash
   export TELEGRAM_BOT_TOKEN="..."
   export TELEGRAM_CHAT_ID="..."
   node index.js --idea "test" --type image
   ```

3. **When RunPod Is Ready**
   ```bash
   export COMFYUI_API_ENDPOINT="https://runpod-..."
   node index.js --health-check
   ```

4. **Start Generating**
   ```bash
   node index.js --idea "AI streamer shocked" --category "AI Streamer Reactions"
   ```

## Support & Documentation

- **Feature Guide:** `SKILL.md`
- **API Docs:** `SKILL.md` - API Methods section
- **Learning File:** `skill-file.md` (auto-generated)
- **Code:** `lib/*.js` (well-commented modules)

## License

MIT - Part of OpenClaw workspace

---

**Ready to generate amazing content!** 🚀
