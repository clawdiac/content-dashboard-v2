# Oliver Henry + Larry Article — Viral TikTok AI Agent System

**Source:** X post by @oliverhenry  
**Date:** 2026-02-14  
**Status:** 500K+ views in 1 week, $588/month MRR (growing)

---

## The System (TL;DR)

**Setup:**
- Old gaming PC running OpenClaw + Claude AI agent (Larry)
- OpenAI gpt-image-1.5 for image generation ($0.50/post)
- Postiz API for TikTok posting
- 500+ line skill file encoding all learnings + memory files tracking performance

**Results:**
- 234K views on top post
- 4 posts cleared 100K views
- 108 paying subscribers ($588 MRR) in first week
- 60 seconds human work per post (Oliver adds music, publishes)
- 15-30 minutes AI work (Larry generates everything)

---

## The Format: 6-Slide TikTok Carousels

**Why it works:**
- TikTok data: Slideshows get **2.9x more comments, 1.9x more likes, 2.6x more shares** vs video
- Algorithm actively pushes photo content in 2026
- Underutilized format = less competition

**Specs (locked):**
- Exactly 6 slides
- Text overlay on slide 1 (the hook)
- Story-style caption (relates hook to app naturally)
- Max 5 hashtags
- Portrait orientation (1024x1536)
- Photorealistic images ("iPhone photo" prompts)

---

## The Viral Hook Formula (CRITICAL)

### What Works (50K-234K views):

> **[Another Person] + [Conflict/Doubt] → Showed them AI → They Changed Their Mind**

**Examples that crushed:**
- "My landlord said I can't change anything so I showed her what AI thinks it could look like" → **234K views**
- "I showed my mum what AI thinks our living room could be" → **167K views**
- "My landlord wouldn't let me decorate until I showed her these" → **147K views**

### What Fails (<10K views):

**Self-focused hooks (feature talk, price comparisons):**
- "See your room in 12+ styles before you commit" → 879 views
- "The difference between $500 and $5000 taste" → 2,671 views

**Why:** Nobody cares about features or price. They care about the **human moment** — picturing someone's reaction when the AI shows them something they didn't believe was possible.

---

## The Image Generation Secret: Locked Architecture

**Problem:** Stable Diffusion outputs looked inconsistent (windows moving, beds changing size). Fake.

**Solution:** Lock EVERYTHING except the style.

**Real prompt example:**

```
iPhone photo of a small UK rental kitchen. Narrow galley style kitchen, roughly 2.5m x 4m. 
Shot from the doorway at the near end, looking straight down the length. Countertops along the 
right wall with base cabinets and wall cabinets above. Small window on the far wall, centered, 
single pane, white UPVC frame, about 80cm wide. Left wall bare except for a small fridge freezer 
near the far end. Vinyl flooring. White ceiling, fluorescent strip light. Natural phone camera 
quality, realistic lighting. Portrait orientation. 

[ONLY THIS CHANGES]:
Beautiful modern country style. Sage green painted shaker cabinets with brass cup handles. Solid 
oak butcher block countertop. White metro tile splashback in herringbone. Small herb pots on 
the windowsill...
```

**Rules:**
- Be obsessively specific about architecture (dimensions, furniture, lighting, camera angle)
- Only change the style (colors, decor, materials)
- Include signs of life (TV, mugs, remote, plants) — not derelict/empty
- Include "iPhone photo" + "realistic lighting" to prevent "AI art" look

---

## The Failures That Led to Success

### Image Issues:
- **Wrong orientation:** 1536x1024 (landscape) instead of 1024x1536 (portrait) = black bars = dead engagement
- **Vague prompts:** Rooms looked different every slide (not believable transformations)
- **People:** Don't work in room designs (inconsistency, creepy factor)

### Text Overlay Issues:
- **Too small:** 5% font size instead of 6.5% = unreadable
- **Poor positioning:** Too high, hidden behind status bar
- **Canvas compression:** Long lines getting squashed horizontally = text illegible on phone

### Hook Issues:
- **Self-focused:** "Why does my flat look like a student loan" (confusing) = 905 views
- **Feature-focused:** "See your room in 12+ styles before you commit" = 879 views
- **No conflict:** Nobody cares unless there's a relatable human moment

---

## The Skill File Approach (The Real Magic)

**Larry's TikTok skill file:** 500+ lines, rewritten 20 times in first week

**What it contains:**
- Image specs (sizes, formats, orientation)
- Prompt templates with locked architecture
- Text overlay rules (font %, positioning, line length limits)
- Caption formulas + hashtag strategy
- Hook formats that work + hook brainstorm questions
- Failure log (every mistake becomes a rule)
- Success patterns (every win becomes a formula)

**Key:** Written like training a capable person from scratch. Obsessively specific. Includes examples.

---

## The Memory System

**Memory files track:**
- Every post performance (views, engagement, conversion)
- What hooked people vs what flopped
- Learnings from each failure
- Brainstorming data (trending hooks, competitor analysis)

**When brainstorming hooks (5-15 at once):**
- Reference actual performance data (not guessing)
- Pick best ones based on patterns
- Set up batch generation (cheap via OpenAI Batch API, 50% discount)
- Overnight generation = ready to post by morning

---

## The Workflow

1. **Plan (Oliver + Larry together):**
   - Brainstorm 10-15 hooks
   - Look at performance data
   - Pick best ones, lock in schedule
   - Create brief for each post

2. **Generate (Larry, overnight):**
   - Generate all images using OpenAI Batch API ($0.25/post instead of $0.50)
   - Add text overlays
   - Write captions
   - Upload to TikTok as DRAFTS via Postiz

3. **Finalize (Oliver, 60 seconds):**
   - Open TikTok draft
   - Pick trending sound
   - Paste caption
   - Publish

**Why drafts?** Music can't be added via API, and trending sounds change constantly. Drafts let Oliver add the one human touch that can't be automated.

---

## The Numbers Breakdown

**Performance:**
- 500K+ total views in <1 week
- Top post: 234K views
- 4 posts over 100K views
- 108 paying subscribers = $588/month MRR
- All converting to real downloads, trials, subscriptions

**Cost:**
- $0.50/post (OpenAI gpt-image-1.5)
- $0.25/post (with Batch API)
- Total: ~$5-10/week for 500K views + revenue

**Time:**
- Larry: 15-30 minutes per post
- Oliver: 60 seconds per post
- **Oliver's ROI:** 1 minute → hundreds of thousands of views

---

## Setup Checklist

1. ✅ Linux machine (old computer, Pi, VPS, Mac)
2. ✅ OpenClaw (open source, free)
3. ✅ Image gen API (OpenAI gpt-image-1.5)
4. ✅ Postiz (TikTok API posting)
5. ✅ Skill files (500+ lines of rules + learnings)
6. ✅ Memory files (performance tracking)

**Most important:** The skill files. They're the difference between a useless AI and a genuinely better-than-human content creator.

---

## Key Takeaways for Kevin

### 1. Format > Tool
- The 6-slide carousel format is the moat, not the AI
- Works because TikTok's algorithm favors it + low competition

### 2. Hook Formula is Reproducible
- **[Person] + [Conflict] → Showed them [solution] → Changed mind**
- Not about features, price, or app talk
- About the human moment, the reaction, the surprise

### 3. Skill Files are the Operating System
- Not a static prompt
- Living document that gets updated after every post
- Every failure → new rule
- Every success → new formula
- This is how the agent compounds

### 4. Cost is Negligible vs. Output
- $0.50-0.25 per post
- 500K+ views = viral reach for pocket change
- Time: 60 seconds human, 15-30 minutes AI

### 5. Memory Matters More Than Raw AI Power
- Tracking what works drives better decisions
- Larry doesn't guess on hooks — he references data
- Compounds over time (week 1 was embarrassing, week 2 was 234K)

---

## For NiggaBets Content

**Adapt the formula:**
- Same 6-slide format
- Same hook structure: [Friend/influencer] + [doubt about betting/odds] → showed them [strategy/win] → converted

**Examples:**
- "My homie didn't believe in this casino until I showed him this exact play" → user sees winning strategy
- "My girl said the house always wins until I showed her this" → social proof + FOMO
- "My brother laughed at my strategy until..." → vindication hook

**For ComfyUI integration:**
- Use local generation instead of OpenAI (cost savings, control)
- Use OpenClaw skills to post (not Postiz)
- Same skill file + memory approach
- Track: hooks → views → clicks → conversions

