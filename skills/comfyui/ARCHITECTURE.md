# ComfyUI Skill - Architecture & Design

## Overview

The ComfyUI skill is a modular, extensible system for AI content generation with integrated learning and approval workflows.

### Core Design Principles

1. **Modularity** - Each component has a single responsibility
2. **Extensibility** - Easy to add new content types, models, approval channels
3. **Learning** - System improves over time from user feedback
4. **Transparency** - All decisions and learnings are logged and queryable
5. **Resilience** - Graceful degradation (works in mock mode without external APIs)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   ComfyUISkill (index.js)               │
│         Main orchestrator for entire workflow           │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┬──────────────────┐
       │               │               │                  │
       ▼               ▼               ▼                  ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Prompt      │ │ Workflow     │ │ Telegram     │ │ Skill File   │
│ Engine      │ │ Manager      │ │ Sender       │ │ Manager      │
│             │ │              │ │              │ │              │
│ - Build     │ │ - Queue      │ │ - Send image │ │ - Store      │
│   prompt    │ │   workflows  │ │ - Send video │ │   learnings  │
│ - Learn     │ │ - Poll       │ │ - Wait for   │ │ - Track      │
│   patterns  │ │   status     │ │   approval   │ │   stats      │
│ - Extract   │ │ - Get outputs│ │ - Handle     │ │ - Export     │
│   features  │ │ - Health     │ │   feedback   │ │   data       │
│             │ │   check      │ │              │ │              │
└─────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
      │                │               │               │
      └────────────────┼───────────────┴───────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   Persistent Storage   │
          │                        │
          │ - skill-file.md        │
          │ - Approved prompts     │
          │ - Failed attempts      │
          │ - Patterns discovered  │
          └────────────────────────┘
```

## Module Breakdown

### 1. PromptEngine (lib/prompt-engine.js)

**Responsibility:** Build detailed prompts from ideas and learned patterns

**Key Methods:**
- `buildPrompt(idea, context)` - General prompt building
- `buildStreamerReactionPrompt(scenario, context)` - Specialized for reactions
- `buildHighlightPrompt(moment, context)` - Gaming/sports highlights
- `buildNiggaBetsPrompt(idea, context)` - NiggaBets branded content
- `updateFromFeedback(feedback)` - Learn from user responses
- `getSuggestedImprovements(feedback)` - Get hints for revisions

**Data Flow:**
```
Idea + Context
    ↓
Check Skill File for Similar Successful Prompts
    ↓
Apply Learned Patterns
    ↓
Add Quality Modifiers
    ↓
Add Category-Specific Enhancements
    ↓
Detailed Prompt
```

**Learning Mechanism:**
```
User Approves Output
    ↓
Extract Keywords from Prompt
    ↓
Score Them as Positive Patterns
    ↓
Apply to Future Similar Prompts
    ↓
Gradual Quality Improvement
```

### 2. WorkflowManager (lib/workflow-manager.js)

**Responsibility:** Queue workflows to ComfyUI and track execution

**Key Methods:**
- `queueWorkflow(workflow, options)` - Send to ComfyUI API
- `pollJobStatus(jobId, options)` - Check status and get outputs
- `getJobStatus(jobId)` - Get current status without waiting
- `healthCheck()` - Verify API is reachable
- `setApiEndpoint(endpoint)` - Switch between local/RunPod/custom

**Job Lifecycle:**
```
Queue Workflow
    ↓
Store in this.jobs (Map)
    ↓
Poll Status Every 2 Seconds
    ├─ Status: processing → wait
    ├─ Status: completed → return outputs
    └─ Status: failed → throw error
    ↓
Timeout After 5 Minutes
```

**State Tracking:**
```
jobs = Map {
  'job-1707360000000-abc1234': {
    jobId: '...',
    promptId: '...',
    status: 'completed' | 'processing' | 'failed',
    createdAt: Date,
    outputs: Object,
    error: String
  }
}
```

### 3. TelegramSender (lib/telegram-sender.js)

**Responsibility:** Send outputs to Telegram and handle approval workflow

**Key Methods:**
- `sendImageForApproval(imagePath, metadata)` - Post image with approval buttons
- `sendVideoForApproval(videoPath, metadata)` - Post video with approval buttons
- `waitForApproval(jobId, options)` - Poll for user response
- `getApprovalStatus(jobId)` - Get tracking info

**Approval Flow:**
```
Generate Content (image/video)
    ↓
Post to Telegram with Caption:
  [APPROVAL] Idea - Approve?
  Reply with:
    APPROVE
    REJECT
    [FEEDBACK] your suggestion
    ↓
Poll Telegram Every 5 Seconds
    ├─ User replies APPROVE → record success
    ├─ User replies REJECT → record failure
    └─ User replies [FEEDBACK] → record feedback request
    ↓
Return Response + Feedback
```

**Mock Mode:**
- When TELEGRAM_BOT_TOKEN is not set
- Auto-generates message IDs
- Auto-approves immediately
- Still tracks locally (for testing)

### 4. SkillFileManager (lib/skill-file-manager.js)

**Responsibility:** Persistent storage and learning tracking

**Key Methods:**
- `recordApproved(entry)` - Save successful prompt
- `recordFailed(entry)` - Log failed attempt
- `recordPattern(pattern)` - Save discovered pattern
- `getStats()` - Get success rates and stats
- `findSimilar(query)` - Find related approved prompts
- `getApprovedByCategory(category)` - Filter by type
- `getPatterns(category)` - Get discovered patterns
- `export()` - Get all data for analysis

**Data Structure:**
```javascript
{
  approvedPrompts: [
    {
      id: '...',
      prompt: 'detailed prompt text',
      idea: 'user idea',
      result: 'description of output',
      notes: 'why it worked',
      category: 'AI Streamer Reactions',
      timestamp: '2026-02-13T...'
    }
  ],
  failedPrompts: [
    {
      id: '...',
      prompt: 'failed prompt',
      idea: 'user idea',
      failure: 'why it failed',
      fix: 'suggested improvement',
      category: '...',
      timestamp: '...'
    }
  ],
  patterns: [
    {
      id: '...',
      text: 'close-up face',
      description: 'why this pattern helps',
      category: 'AI Streamer Reactions',
      confidence: 'high',
      examples: ['reaction1', 'reaction2'],
      timestamp: '...'
    }
  ],
  metadata: {
    created: Date,
    lastUpdated: Date,
    totalApproved: Number,
    totalFailed: Number
  }
}
```

**Markdown Export:**
- Readable skill file at `skill-file.md`
- Shows categories, success rates, patterns
- Human-editable format
- Auto-regenerated on updates

## Data Flow: Complete Generation Cycle

### Step 1: Idea Input

```
User/Agent: "Generate shocked AI streamer"
    ↓
ComfyUISkill.generate({
  idea: "...",
  type: "image",
  category: "AI Streamer Reactions",
  waitForApproval: true
})
```

### Step 2: Prompt Building

```
PromptEngine.buildStreamerReactionPrompt()
    ↓
Check SkillFileManager for:
  - Similar successful prompts
  - Learned patterns for category
  - Successful techniques
    ↓
Apply patterns:
  - "close-up face"
  - "dramatic lighting"
  - "cinematic quality"
    ↓
Result: "AI streamer character reacting with shocked expression,
         close-up face, dramatic lighting, cinematic quality,
         high quality, highly detailed, professional..."
```

### Step 3: Workflow Population

```
Load image-workflow.json template
    ↓
Find "CLIPTextEncode (Positive)" node
    ↓
Replace {{PROMPT}} with built prompt
    ↓
Set random seed, steps=30, cfg=7.5
    ↓
Populate workflow = {
  "1": { checkpoint loader },
  "2": { text encode with prompt },
  "3": { negative encode },
  ...
}
```

### Step 4: Queue to ComfyUI

```
WorkflowManager.queueWorkflow(populatedWorkflow)
    ↓
POST to ComfyUI API
    ↓
Response: { prompt_id: "abc123..." }
    ↓
Store in jobs Map
    ↓
Return jobId to caller
```

### Step 5: Poll for Completion

```
WorkflowManager.pollJobStatus(jobId)
    ↓
Every 2 seconds:
  GET /history/{promptId}
  
  If result.outputs exists:
    → status = 'completed'
    → return outputs
    
  If result.error exists:
    → status = 'failed'
    → throw error
    
  If neither:
    → status = 'processing'
    → wait and retry
    ↓
After 5 minutes timeout:
    → throw timeout error
```

### Step 6: Save Locally

```
Extract output images/videos from API response
    ↓
Save to ~/.openclaw/cache/comfyui-outputs/
    ↓
Return file path
```

### Step 7: Send to Telegram

```
TelegramSender.sendImageForApproval(
  outputPath,
  { idea, jobId, prompt }
)
    ↓
Telegram Bot API:
  POST /sendPhoto
    - chat_id
    - photo (binary)
    - caption: [APPROVAL] idea...
    
Response: { message_id: 123 }
    ↓
Store approval tracking:
  approvalMessages[jobId] = {
    messageId: 123,
    status: 'pending_approval',
    idea: "...",
    timestamp: Date
  }
```

### Step 8: Wait for Approval

```
TelegramSender.waitForApproval(jobId)
    ↓
Every 5 seconds:
  GET Telegram updates
  
  Loop through messages:
    If reply_to_message.message_id == approvalMessageId:
      
      If text includes "APPROVE":
        → status = 'approved'
        → return { response: 'APPROVE' }
      
      If text includes "REJECT":
        → status = 'rejected'
        → return { response: 'REJECT' }
      
      If text includes "[FEEDBACK]":
        → status = 'feedback'
        → extract and return feedback
    ↓
After 1 hour timeout:
    → throw timeout error
```

### Step 9: Update Skill File

```
ComfyUISkill._learnFromFeedback(
  jobId, idea, prompt, response
)
    ↓
If response === 'APPROVE':
  SkillFileManager.recordApproved({
    prompt,
    idea,
    result: "...",
    category: "..."
  })
  
  PromptEngine.updateFromFeedback({
    response: 'APPROVE',
    prompt
  })
  
  Extract pattern keywords:
    "close-up", "dramatic", "cinematic", etc.
    ↓
  Score these as positive patterns
    ↓
  Store in patterns array
    ↓
  Save to skill-file.md
```

### Step 10: Return Result

```
Return {
  jobId: "job-...",
  promptId: "abc...",
  status: "completed",
  type: "image",
  idea: "...",
  prompt: "...",
  outputPath: "...",
  approvalStatus: "APPROVE",
  feedback: null
}
```

## Design Patterns Used

### 1. Strategy Pattern
Different content types use different prompt builders:
```javascript
if (category === 'AI Streamer Reactions')
  return buildStreamerReactionPrompt();
else if (category === 'Gaming Highlights')
  return buildHighlightPrompt();
else
  return buildPrompt();
```

### 2. Template Pattern
Workflow templates + variable injection:
```javascript
const template = loadWorkflow('image');
populateWorkflow(template, prompt);
```

### 3. Observer Pattern
Skill file manager "observes" approvals:
```javascript
recordApproved(entry) {
  // Records approval
  // Extracts patterns
  // Updates stats
  // Saves file
}
```

### 4. Builder Pattern
Prompt building with incremental enhancements:
```javascript
prompt = idea;
prompt += qualityModifier();
prompt += categoryEnhancements();
prompt += technicalSpecs();
```

### 5. Facade Pattern
Main ComfyUISkill class provides simple interface:
```javascript
await skill.generate({ idea, type });
// Hides complexity of prompt engine, workflow manager, telegram, etc.
```

## Extensibility Points

### Add New Content Type

1. Create specialized method in PromptEngine:
```javascript
buildCustomContentPrompt(idea, context) {
  return `Custom prompt for ${idea}...`;
}
```

2. Add to ComfyUISkill:
```javascript
async generateCustomContent(idea, context) {
  return this.generate({
    idea,
    type: 'image',
    category: 'Custom Type',
    context
  });
}
```

3. ComfyUISkill automatically routes through learning system

### Add New Approval Channel

1. Create new sender class (e.g., DiscordSender):
```javascript
export class DiscordSender {
  async sendForApproval(path, metadata) { ... }
  async waitForApproval(jobId) { ... }
}
```

2. Swap in main skill:
```javascript
this.approvalSender = new DiscordSender(config);
```

### Add New Quality Modifier

Edit `PromptEngine._getQualityModifier()`:
```javascript
ultra: ', ultra high quality, ..., stunning, perfectionist',
broadcast: ', broadcast quality, studio lighting, ...'
```

### Custom Workflow Node

1. Create workflow in ComfyUI UI
2. Export JSON
3. Save to `templates/custom-workflow.json`
4. Use: `skill._loadWorkflow('custom')`

## Performance Considerations

### Job Polling
- Default interval: 2 seconds (configurable)
- Max wait: 5 minutes (configurable)
- Exponential backoff available for production

### Telegram Polling
- Interval: 5 seconds
- Max wait: 1 hour
- Could use webhooks for production

### Skill File I/O
- Writes to disk on every approval/failure
- Could batch writes for high-throughput scenarios
- Markdown format is human-readable but slower than JSON

### Memory
- `jobs` Map stores all job metadata
- `approvalMessages` Map stores Telegram tracking
- `skillData` loaded into PromptEngine
- Could use database for production scale

## Error Handling

### API Failures
```javascript
try {
  await workflowManager.queueWorkflow(...);
} catch (error) {
  // Logged with context
  // Thrown to caller
  // Caller decides retry strategy
}
```

### Timeout Handling
```javascript
while (Date.now() - startTime < maxWaitMs) {
  // Try operation
  // Caught on timeout
  // Throw with max wait info
}
```

### Invalid State
```javascript
const job = this.jobs.get(jobId);
if (!job) {
  throw new Error(`Job not found: ${jobId}`);
}
```

## Testing Strategy

### Unit Tests (per module)
- PromptEngine: test prompt building variations
- WorkflowManager: test queue/poll logic
- SkillFileManager: test storage operations
- TelegramSender: test in mock mode

### Integration Tests
- End-to-end generation (with mock ComfyUI)
- Approval workflow (with mock Telegram)
- Learning validation

### Example Tests
See `tests/example.test.js` for test patterns

## Future Enhancements

1. **Async Queue**
   - Use actual job queue (Bull, etc.)
   - Better concurrency handling
   - Persistent job storage

2. **Advanced Learning**
   - ML model for prompt optimization
   - A/B testing infrastructure
   - Statistical analysis of patterns

3. **Multi-Channel Approval**
   - Discord support
   - Slack support
   - Web UI

4. **Workflow Optimization**
   - Cache popular workflows
   - Optimize for speed/quality tradeoff
   - Model selection based on category

5. **Analytics**
   - Track generation success over time
   - Category performance
   - User preference learning

---

**Design Philosophy:** Keep it simple, modular, and extensible. Each component should be testable and replaceable independently.
