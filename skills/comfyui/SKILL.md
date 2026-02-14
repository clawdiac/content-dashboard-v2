# ComfyUI Skill

**Generate high-quality AI images and videos for content creation with automatic approval workflow and learning system.**

## What It Does

This skill enables OpenClaw to generate AI content (images and videos) using ComfyUI, send results to Telegram for human approval, and automatically learn from feedback to improve future generations.

### Key Features

- 🎬 **Image & Video Generation** - Queue workflows to ComfyUI API
- 📝 **Intelligent Prompts** - Builds detailed prompts from ideas + learned patterns
- 📱 **Telegram Approval** - Sends outputs to Telegram for human review
- 📚 **Learning System** - Tracks what works, what doesn't, discovers patterns
- 🎯 **Specialized Templates** - Pre-built prompts for:
  - AI streamer reactions
  - Gaming/sports highlights  
  - NiggaBets branded content
  - Custom categories

## Installation

```bash
# Skill is at: ~/.openclaw/workspace/skills/comfyui/

# Install dependencies
cd ~/.openclaw/workspace/skills/comfyui/
npm install
```

## Configuration

Set these environment variables or pass them to the constructor:

```bash
# ComfyUI API endpoint (will be set later for RunPod)
export COMFYUI_API_ENDPOINT="http://localhost:8188"

# Telegram credentials for approval workflow
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

## Usage

### From OpenClaw

```javascript
// Call the skill from OpenClaw
const result = await skill.generate({
  idea: "AI streamer shocked by big win",
  type: "image",
  category: "AI Streamer Reactions",
  waitForApproval: true
});
```

### CLI

```bash
# Generate an image
node index.js --idea "AI streamer shocked by big win" --type image

# Generate a video
node index.js --idea "Gaming highlight moment" --type video --category "Gaming Highlights"

# Check skill statistics
node index.js --stats

# Health check
node index.js --health-check
```

### Specialized Methods

```javascript
import ComfyUISkill from './index.js';

const skill = new ComfyUISkill();

// Generate streamer reaction
await skill.generateStreamerReaction('huge win', {
  emotion: 'shocked',
  intensity: 'high'
});

// Generate gaming highlight
await skill.generateHighlight('penalty kick goal', {
  sport: 'soccer',
  contentType: 'video'
});

// Generate NiggaBets content
await skill.generateNiggaBetsContent('crazy odds parlay', {
  contentType: 'image',
  style: 'bold'
});
```

## Response Format

```javascript
{
  jobId: "job-1707360000000-abc1234",
  promptId: "abc123...",
  status: "completed",
  type: "image",
  idea: "AI streamer shocked by big win",
  prompt: "AI streamer character reacting with shocked...",
  outputPath: "/Users/clawdia/.openclaw/cache/comfyui-outputs/...",
  approvalStatus: "APPROVE",
  feedback: null
}
```

## Workflow

### Generation Flow

```
1. Build Prompt
   └─ Idea + learned patterns + quality settings
   
2. Queue to ComfyUI
   └─ Send workflow with prompt to API
   
3. Wait for Generation
   └─ Poll job status every 2 seconds
   
4. Send to Telegram
   └─ Post image/video with approval buttons
   
5. Wait for Response
   └─ Poll Telegram for APPROVE/REJECT/FEEDBACK
   
6. Update Skill File
   └─ Record approved prompts, failed attempts, patterns
```

### Learning System

The skill tracks:

- **Approved Prompts** - Working prompts by category
- **Failed Prompts** - What didn't work and why
- **Discovered Patterns** - Techniques that improve generation

Stored in: `~/.openclaw/workspace/skills/comfyui/skill-file.md`

## Skill File Format

```markdown
# ComfyUI Skill File

## ✅ Approved Prompts (What Works)

### AI Streamer Reactions
- **Idea:** AI streamer shocked by big win
  - **Prompt:** `AI streamer character reacting with shocked expression...`
  - **Result:** High-energy reaction, perfect emotion
  - **Notes:** User approved
  - **Date:** 2/13/2026

## ❌ Failed Prompts (Don't Repeat)

- **Idea:** Generic reaction
  - **Failed Prompt:** `generic reaction`
  - **Why:** Too vague, resulted in low-quality output
  - **Try Instead:** Add specific emotion + intensity descriptors
  - **Date:** 2/13/2026

## 🎯 Discovered Patterns

### AI Streamer Reactions
- **Pattern:** close-up face
  - **Description:** Focus on face dramatically improves emotion clarity
  - **Confidence:** high
  - **Examples:** shocked reaction, angry expression, happy moment

## 📊 Statistics

- **Total Approved:** 5
- **Total Failed:** 2
- **Success Rate:** 71.4%
- **Categories:** AI Streamer Reactions, Gaming Highlights
- **Last Updated:** 2/13/2026
```

## API Methods

### main.generate(request)

Generate content from an idea.

```javascript
await skill.generate({
  idea: "what to create",
  type: "image" | "video",         // default: "image"
  category: "category name",         // optional
  context: { /* custom settings */ },
  waitForApproval: true              // default: true
});
```

### main.generateStreamerReaction(scenario, context)

Specialized method for streamer reactions.

```javascript
await skill.generateStreamerReaction('huge win', {
  emotion: 'shocked',              // shocked, happy, angry, surprised
  intensity: 'high'                // high, medium, low
});
```

### main.generateHighlight(moment, context)

Specialized method for gaming/sports highlights.

```javascript
await skill.generateHighlight('match point', {
  sport: 'tennis',
  contentType: 'video'
});
```

### main.generateNiggaBetsContent(idea, context)

Specialized method for NiggaBets branded content.

```javascript
await skill.generateNiggaBetsContent('crazy parlay', {
  contentType: 'image',
  style: 'bold'  // bold, casual
});
```

### main.getStats()

Get skill statistics.

```javascript
skill.getStats();
// Returns: { totalApproved, totalFailed, successRate, categories, ... }
```

### main.getApprovedPrompts(category)

Get successful prompts (optionally filtered by category).

```javascript
skill.getApprovedPrompts('AI Streamer Reactions');
```

### main.getPatterns(category)

Get discovered patterns.

```javascript
skill.getPatterns();
// Returns patterns used in approved content
```

### main.setApiEndpoint(endpoint)

Set custom ComfyUI API endpoint (e.g., for RunPod).

```javascript
skill.setApiEndpoint('https://runpod-endpoint.example.com');
```

### main.healthCheck()

Verify ComfyUI is reachable and skill is ready.

```javascript
await skill.healthCheck();
// Returns: { apiHealthy, hasLearnings, endpoint }
```

## Testing

### Mock Mode

When Telegram credentials aren't set, the skill runs in mock mode:
- Outputs are saved locally
- Telegram sends are mocked with console output
- Approvals auto-complete (for testing)

Example:

```bash
# Will run in mock mode (no Telegram)
node index.js --idea "test image" --type image
```

### Testing Workflow

```javascript
import ComfyUISkill from './index.js';

// Initialize (will use mock mode without env vars)
const skill = new ComfyUISkill({
  outputDir: '/tmp/test-outputs'
});

// Generate (auto-approves in mock mode)
const result = await skill.generate({
  idea: 'test streamer reaction',
  type: 'image',
  category: 'AI Streamer Reactions'
});

// Check stats
console.log(skill.getStats());

// View learned patterns
console.log(skill.getPatterns());
```

## Telegram Integration

When configured with bot token and chat ID:

1. **Send for Approval**
   - Image/video posted with caption
   - Includes job ID, prompt preview
   - Shows approval options

2. **Approval Responses**
   - `APPROVE` - Marks as successful, learns from prompt
   - `REJECT` - Records failure, suggests improvements
   - `[FEEDBACK] ...` - Treats as revision request

3. **Auto-Learning**
   - Approved prompts saved to skill file
   - Patterns extracted from successful generations
   - Future prompts enhanced with learned techniques

## Directory Structure

```
~/.openclaw/workspace/skills/comfyui/
├── index.js                      # Main entry point
├── package.json                  # Dependencies
├── SKILL.md                      # This file
├── README.md                     # Setup guide
├── skill-file.md                 # Learning storage (generated)
├── lib/
│   ├── workflow-manager.js       # Queue & polling
│   ├── telegram-sender.js        # Approval workflow
│   ├── prompt-engine.js          # Prompt building
│   └── skill-file-manager.js     # Persistent learning
└── templates/
    ├── image-workflow.json       # Image generation template
    └── video-workflow.json       # Video generation template

~/.openclaw/cache/comfyui-outputs/
└── [generated images/videos]
```

## Error Handling

The skill handles:

- **ComfyUI Unreachable** - Returns error with endpoint info
- **Generation Timeout** - Fails after 5 minutes by default
- **Telegram Integration** - Falls back to mock mode if unconfigured
- **Invalid Prompts** - Returns generation error for recovery

All errors are logged with context for debugging.

## Future Enhancements

- [ ] Multi-model support (Stable Diffusion 3, FLUX, etc.)
- [ ] Queue prioritization and batching
- [ ] Advanced prompt optimization (genetic algorithms)
- [ ] Integration with more approval channels (Discord, etc.)
- [ ] Automatic A/B testing of prompt variations
- [ ] Video editing templates and effects

## FAQ

**Q: How do I wire up RunPod?**
A: Set `COMFYUI_API_ENDPOINT` to your RunPod endpoint URL. The skill will queue workflows there instead of localhost.

**Q: Can I use this without Telegram?**
A: Yes! The skill works in mock mode. Approvals auto-complete, outputs are saved locally, but you won't get interactive feedback.

**Q: How does learning work?**
A: Every approved output teaches the skill:
- Prompt is saved as example
- Keywords extracted as patterns
- Future prompts automatically enhanced with learned patterns

**Q: Can I reset the skill file?**
A: Yes: `skillFileManager.reset()` - but this clears all learnings.

**Q: How long does generation take?**
A: Default timeout is 5 minutes. Depends on ComfyUI API (usually 30-60 seconds per image on GPU).

## Support

- Check `skill-file.md` for learned patterns
- View `~/.openclaw/cache/comfyui-outputs/` for generated files
- Monitor logs for API errors and timeouts
- Use `--health-check` to verify setup
