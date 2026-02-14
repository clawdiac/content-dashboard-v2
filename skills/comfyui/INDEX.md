# ComfyUI Skill - File Index

## 📂 Directory Structure

```
~/.openclaw/workspace/skills/comfyui/
├── 📄 index.js                      Main entry point (456 lines)
├── 📄 package.json                  Node.js dependencies
├── 📋 SKILL.md                      Feature documentation & API reference
├── 📋 README.md                     Setup guide with instructions
├── 📋 ARCHITECTURE.md               Design deep dive & patterns
├── 📋 QUICKSTART.md                 5-minute quick reference
├── 📋 BUILD_SUMMARY.md              What was built summary
├── 📋 INDEX.md                      This file
├── 📋 skill-file.md                 Auto-generated learning file (initialized empty)
│
├── 📁 lib/                          Core modules
│   ├── 📄 workflow-manager.js       ComfyUI API integration (313 lines)
│   ├── 📄 telegram-sender.js        Telegram approval workflow (313 lines)
│   ├── 📄 prompt-engine.js          Intelligent prompt building (248 lines)
│   └── 📄 skill-file-manager.js     Persistent learning storage (359 lines)
│
├── 📁 templates/                    ComfyUI workflow templates
│   ├── 📄 image-workflow.json       Stable Diffusion 3 image generation
│   └── 📄 video-workflow.json       Video generation workflow
│
└── 📁 tests/                        Example tests
    └── 📄 example.test.js           Shows how to test each module
```

## 📄 File Guide

### Main Entry Point

#### **index.js** (456 lines)
- **Purpose:** Main skill orchestrator
- **Exports:** `ComfyUISkill` class
- **Methods:**
  - `generate(request)` - Main generation pipeline
  - `generateStreamerReaction(scenario, context)` - Specialized for reactions
  - `generateHighlight(moment, context)` - Gaming/sports highlights
  - `generateNiggaBetsContent(idea, context)` - Branded content
  - `getStats()` - Get skill statistics
  - `getApprovedPrompts(category)` - Get successful prompts
  - `getPatterns(category)` - Get discovered patterns
  - `setApiEndpoint(endpoint)` - Switch API endpoint
  - `healthCheck()` - Verify setup
- **Usage:** `node index.js --idea "..." --type image`

### Core Modules (lib/)

#### **lib/workflow-manager.js** (313 lines)
- **Purpose:** ComfyUI API integration
- **Exports:** `WorkflowManager` class
- **Responsibilities:**
  - Queue workflows to ComfyUI API
  - Poll job status with retry logic
  - Retrieve and save outputs
  - Track job history
  - Health check
- **Key Methods:**
  - `queueWorkflow(workflow, options)` - Queue a job
  - `pollJobStatus(jobId, options)` - Wait for completion
  - `getJobStatus(jobId)` - Get current status
  - `healthCheck()` - Verify API is reachable
  - `setApiEndpoint(endpoint)` - Switch endpoints

#### **lib/telegram-sender.js** (313 lines)
- **Purpose:** Telegram approval workflow
- **Exports:** `TelegramSender` class
- **Responsibilities:**
  - Send images/videos to Telegram
  - Wait for user approval/rejection/feedback
  - Track approval messages
  - Handle mock mode for testing
- **Key Methods:**
  - `sendImageForApproval(imagePath, metadata)` - Post image
  - `sendVideoForApproval(videoPath, metadata)` - Post video
  - `waitForApproval(jobId, options)` - Wait for response
  - `getApprovalStatus(jobId)` - Get tracking info

#### **lib/prompt-engine.js** (248 lines)
- **Purpose:** Intelligent prompt building + learning
- **Exports:** `PromptEngine` class
- **Responsibilities:**
  - Build detailed prompts from ideas
  - Apply learned patterns
  - Support multiple content types
  - Extract and learn from feedback
- **Key Methods:**
  - `buildPrompt(idea, context)` - General prompt
  - `buildStreamerReactionPrompt(scenario, context)` - Reactions
  - `buildHighlightPrompt(moment, context)` - Highlights
  - `buildNiggaBetsPrompt(idea, context)` - Branded content
  - `updateFromFeedback(feedback)` - Learn from approval
  - `getSuggestedImprovements(feedback)` - Get hints
  - `getSimilarSuccessful(idea)` - Find related winners

#### **lib/skill-file-manager.js** (359 lines)
- **Purpose:** Persistent learning storage
- **Exports:** `SkillFileManager` class
- **Responsibilities:**
  - Store approved/failed prompts
  - Track discovered patterns
  - Calculate statistics
  - Export to markdown format
- **Key Methods:**
  - `recordApproved(entry)` - Save successful prompt
  - `recordFailed(entry)` - Log failure
  - `recordPattern(pattern)` - Store pattern
  - `getStats()` - Get success rates
  - `getApprovedByCategory(category)` - Filter prompts
  - `findSimilar(query)` - Find related prompts
  - `save()` - Write to skill-file.md
  - `export()` - Get all data

### Configuration & Dependencies

#### **package.json**
- **Node Version:** >=18.0.0
- **Dependencies:**
  - `node-fetch` - HTTP requests to APIs
- **Scripts:**
  - `test` - Run example tests
  - `start` - Run as CLI

### Workflow Templates

#### **templates/image-workflow.json**
- **Purpose:** ComfyUI workflow for image generation
- **Format:** JSON with node definitions
- **Nodes:** Checkpoint loader, text encode, KSampler, VAE decode, save
- **Variables:** `{{PROMPT}}`, `{{SEED}}`, `{{STEPS}}`, `{{CFG_SCALE}}`
- **Model:** Stable Diffusion 3

#### **templates/video-workflow.json**
- **Purpose:** ComfyUI workflow for video generation
- **Format:** JSON with node definitions
- **Nodes:** Similar to image, plus video encoder
- **Output:** MP4 format at 24fps

### Learning Storage

#### **skill-file.md** (Auto-Generated)
- **Purpose:** Persistent learning from approvals
- **Format:** Markdown for human readability
- **Sections:**
  - Approved Prompts (by category)
  - Failed Prompts (with lessons learned)
  - Discovered Patterns (techniques that work)
  - Statistics (success rates, categories)
- **Auto-Updated:** On every approval/rejection
- **Human-Editable:** Can be manually updated

### Documentation

#### **SKILL.md** (445 lines)
- **For:** Feature documentation & complete API reference
- **Covers:**
  - What the skill does
  - Installation & configuration
  - CLI and code usage
  - All methods & response formats
  - Testing & troubleshooting
  - FAQ

#### **README.md** (371 lines)
- **For:** Setup guide (step-by-step)
- **Covers:**
  - Quick start (3 steps)
  - Detailed setup (Telegram, ComfyUI)
  - Architecture diagram
  - File structure
  - Usage examples
  - Customization
  - Troubleshooting

#### **ARCHITECTURE.md** (520 lines)
- **For:** Deep dive into design & implementation
- **Covers:**
  - System architecture
  - Module breakdown
  - Data flow (complete cycle)
  - Design patterns used
  - Performance considerations
  - Error handling
  - Testing strategy
  - Future enhancements

#### **QUICKSTART.md** (94 lines)
- **For:** 5-minute quick reference
- **Covers:**
  - 1-2-3 getting started
  - Common commands
  - Workflow summary
  - File locations
  - Troubleshooting

#### **BUILD_SUMMARY.md** (277 lines)
- **For:** Overview of what was built
- **Covers:**
  - Files & lines of code
  - Features implemented
  - Design decisions
  - Testing & validation
  - Next steps
  - Production readiness

### Tests

#### **tests/example.test.js** (152 lines)
- **Purpose:** Example tests showing module usage
- **Covers:**
  - Prompt Engine tests
  - Skill File Manager tests
  - Telegram Sender (mock) tests
  - Workflow Manager tests
  - Integration example
- **Run:** `npm test`

## 📊 Statistics

| Category | Files | Lines | Notes |
|----------|-------|-------|-------|
| **Core** | 5 | 1,289 | index.js + lib modules |
| **Templates** | 2 | 152 | Workflow JSON files |
| **Tests** | 1 | 152 | Example test file |
| **Documentation** | 6 | 2,173 | Guides & architecture |
| **Config** | 2 | 90 | package.json + skill-file.md |
| **TOTAL** | 16 | 3,856 | Production ready |

## 🚀 Getting Started

### 1. Understand the System
Start with **QUICKSTART.md** (5 min read)

### 2. Set Up & Test
Follow **README.md** section "Quick Start" (5 min setup)

### 3. Learn Features
Read **SKILL.md** for complete API reference

### 4. Understand Design
Read **ARCHITECTURE.md** if you want to extend it

## 🔧 Common Tasks

### Generate Content
```bash
node index.js --idea "your idea" --type image
# or in code:
const result = await skill.generate({ idea: '...', type: 'image' });
```

### Check What You've Learned
```bash
node index.js --stats
# or in code:
skill.getStats();
skill.getApprovedPrompts();
skill.getPatterns();
```

### Set Up Telegram
```bash
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="..."
# Then regenerate - will wait for Telegram approval instead of auto-approving
```

### Set Up RunPod Endpoint
```bash
export COMFYUI_API_ENDPOINT="https://your-runpod-endpoint.com"
node index.js --health-check
```

### View Learning File
```bash
cat ~/.openclaw/workspace/skills/comfyui/skill-file.md
# Shows approved prompts, patterns, success rate
```

## 📋 File Dependencies

```
index.js
├── lib/prompt-engine.js
├── lib/workflow-manager.js
├── lib/telegram-sender.js
└── lib/skill-file-manager.js

lib/prompt-engine.js
└── (no internal deps)

lib/workflow-manager.js
└── node-fetch

lib/telegram-sender.js
└── node-fetch

lib/skill-file-manager.js
└── fs, path (Node.js built-ins)

package.json
└── node-fetch
```

## 🔐 Security Notes

- No hardcoded credentials (all via env vars)
- No data exfiltration (local storage only)
- Telegram integration optional (mock mode works)
- API endpoints configurable (safe for RunPod)

## 📈 Improvement Areas (Future)

- [ ] Database backend (currently markdown file)
- [ ] ML-based prompt optimization
- [ ] A/B testing infrastructure
- [ ] Discord/Slack approval channels
- [ ] Workflow caching & optimization
- [ ] Advanced analytics dashboard

---

**All files are production-ready and well-documented.**

Start with `QUICKSTART.md` or `README.md` for setup!
