# TikTok Content Skill File Template

**Based on:** Larry's 500+ line skill file (Oliver Henry's system)  
**For:** Autonomous AI agent (like Larry) generating viral content

---

## Template: NiggaBets TikTok Slideshows

```markdown
# NiggaBets TikTok Skill File

## Mission
Generate 6-slide TikTok carousels that showcase casino gameplay, wins, and strategy moments. 
Target: [Friend/homie/girlfriend] + [Conflict] → [Proof of win] → [Changed mind]

---

## Format Specs (LOCKED)

### Dimensions & Orientation
- **ALWAYS:** 1024x1536 pixels (portrait)
- **NEVER:** Landscape, square, or any other ratio
- **Why:** Black bars kill engagement. Wrong ratio = instant scroll-past

### Slide Structure
1. **Slide 1:** Hook text overlay + background image
   - Font: Bold, high contrast (white text on dark background recommended)
   - Font size: 6.5% of image height
   - Position: Center, vertical middle (NOT top — avoids status bar)
   - Max line length: 28 characters (prevents horizontal compression)
   - Readable on mobile? TEST EVERY TIME.

2. **Slides 2-6:** Transformation/progression images
   - Consistent style/look (maintain believability)
   - High quality (photorealistic, no AI art artifacts)
   - Readable stats/numbers if overlay needed

### Caption & Hashtags
- **Length:** 150-250 characters
- **Structure:** Hook + call-to-action or app mention
- **Hashtags:** Maximum 5
- **Format:** All caps = LOW ENGAGEMENT. Mix case.
- **Example:** "My homie didn't believe in this casino until I showed him this exact play. Now he's down to try Snugly for betting strategy 🎰 #betting #casino #odds #verification #gaming"

---

## Hook Formula (CRITICAL)

### What Works (100K+ views):
```
[Friend/homie/girl] + [Doesn't believe/Said no/Thinks it's rigged] 
→ [Showed them winning proof/exact moment]
→ [Changed mind/Now convinced]
```

### Real Examples That Hit:
- "My homie said casinos were rigged until I showed him this" ✅ (expected 80K+)
- "My girl called me crazy for betting until she saw my account" ✅ (expected 100K+)
- "My crew laughed at my strategy until [date] happened" ✅ (expected 70K+)
- "They said the house always wins until I showed them this" ✅ (expected 90K+)

### What Fails (<10K views):
- "Check out this amazing casino" ❌ (self-focused)
- "The odds are in your favor if you..." ❌ (feature/educational, no conflict)
- "This bet paid out 234x" ❌ (no human element, no reaction)
- Vague or unclear hooks ❌ ("You won't believe what happened...")

### Hook Brainstorm Questions
Before we use ANY hook, answer:
1. **Who's the other person?** (Specific: friend, mom, girlfriend, homie)
2. **What's their initial belief?** (They said/believed/thought what specifically?)
3. **What's the proof moment?** (How do we show them they're wrong?)
4. **What's their implied reaction?** (Can the user imagine their face?)

If ANY answer is vague, the hook will fail.

---

## Image Generation Rules

### Specs
- **Model:** [Your image gen model, e.g., gpt-image-1.5, ComfyUI, etc.]
- **Prompt structure:** Locked base + style variation
- **Style:** Photorealistic (avoid AI art look)
- **Quality check:** Would this pass for a real phone photo?

### Locked Architecture Template
Every image in a slideshow must maintain:
- Same casino/room/background (coordinates, dimensions, furniture fixed)
- Same camera angle and position
- Same lighting scenario
- ONLY change: The specific moment, outcome, or style variation

**Example for casino table sequence:**
```
High-end casino poker table, overhead shot. Black felt, green cup holders, 
two players visible. Bright overhead lighting. Professional photography quality, 
iPhone 15 Pro night mode. Realistic depth of field.

[ONLY THIS CHANGES]:
[Moment A]: Player studying cards, nervous expression
[Moment B]: Player pushing chips forward (all-in)
[Moment C]: Cards flipped, winner's hand revealed
[Moment D]: Player celebrating, arms up
[Moment E]: Chips stacked, proof of win
[Moment F]: Phone screenshot of winnings
```

### Image Quality Checklist
- ✅ Consistent room/background across all 6 slides
- ✅ Same camera angle (not floating around)
- ✅ Same lighting (not suddenly brighter/darker)
- ✅ Photorealistic (pass phone photo test)
- ✅ No floating objects, broken geometry, inconsistent physics
- ✅ Numbers/amounts visible and readable
- ✅ Portraits of people consistent (if people used)
- ❌ NO: Vague blurry transformations
- ❌ NO: Different rooms/settings between slides
- ❌ NO: "AI art" look (uncanny valley)

---

## Text Overlay Rules (For Slide 1 Hook)

### Typography
- **Font:** Bold, sans-serif (Arial, Helvetica, DM Sans)
- **Color:** White on dark background OR dark on light (HIGH CONTRAST)
- **Size:** 6.5% of image height (TEST ON PHONE)
- **Minimum font:** 48px absolute minimum (larger is safer)

### Positioning
- **Vertical:** Center of image (middle third)
- **Horizontal:** Center or slightly off-center
- **Avoid:** Top (hidden by status bar), bottom (hidden by controls)
- **Padding:** Leave 60px margin on all sides

### Line Breaking
- **Max width:** 28 characters per line (YES, test this)
- **Max lines:** 3 lines (hook should be snappy)
- **Anti-pattern:** Long sentences that wrap and compress

### Real Example
```
Hook: "My homie didn't believe"
       "in the odds until I"
       "showed him THIS"

✅ GOOD: 3 lines, 20-26 chars each, readable at thumbnail size
❌ BAD: "My homie didn't believe in the odds until I showed him this exact moment which changed everything"
```

---

## Content Types & Hooks by Performance Tier

### Tier 1: 100K+ Views (Social Proof + Vindication)
**Setup:** Someone doubting you → you prove them wrong → they believe now

Hook templates:
- "My [relationship] said [specific doubt] until I showed them [specific proof]"
- "They called me crazy until [date/event] proved them wrong"
- "My [person] didn't believe this was possible until they saw it themselves"

### Tier 2: 50K-100K Views (Personal Achievement + Reaction)
**Setup:** You accomplish something surprising → reaction moments

Hook templates:
- "Started with [amount], now I have [result]. My [person] thought I was lying"
- "[Action] seemed impossible until I tried this exact method"

### Tier 3: 10K-50K Views (Educational/Feature-Focused)
**Setup:** Tips, tricks, explanations
- ⚠️ USE SPARINGLY. Only when you pair with Tier 1 or 2 hooks.

### Tier 4: <10K Views (DON'T USE)
❌ Pure feature explanations  
❌ Self-focused "look at me" moments  
❌ Vague or unclear setups  
❌ No human conflict or reaction

---

## Failure Log (UPDATE WEEKLY)

### What Went Wrong & The Fix

**Failure: Text unreadable on phone**
- Cause: Font size 5%, positioned too high
- Fix: Use 6.5% minimum, center vertically
- Rule: Always render at mobile size before posting

**Failure: Room looked different every slide**
- Cause: Vague prompt, no locked architecture
- Fix: Write down exact dimensions, camera angle, furniture placement
- Rule: Copy-paste the architecture description into EVERY prompt

**Failure: Hooks got <5K views**
- Cause: Self-focused feature talk ("Check out this feature")
- Fix: Use [Person] + [Conflict] formula instead
- Rule: Every hook must have BOTH a person and a conflict

**Failure: Black bars on sides of video**
- Cause: 1536x1024 instead of 1024x1536
- Fix: ALWAYS 1024x1536 (portrait)
- Rule: Check image dimensions before generation

---

## Success Patterns (UPDATE WEEKLY)

### What's Working

**Hook pattern:** [Homie/friend] + [Said X was rigged/impossible] → [Showed them proof] → [Believe now]
- Consistently 50K-150K views
- Best performer: "My homie didn't believe until I showed him..."

**Image pattern:** Photorealistic, consistent backgrounds, progression of moments
- Engagement 2x higher when images feel real vs AI-art-y

**Caption pattern:** Hook mention + casual mention of app
- Conversions higher when caption feels natural, not salesy

---

## Pre-Generation Checklist

Before generating images:
- ✅ Hook approved by [human]
- ✅ Locked architecture written out (copy-paste ready)
- ✅ Image dimensions confirmed (1024x1536 portrait)
- ✅ Style variation for each of 6 slides defined
- ✅ Text overlay copy written (max 3 lines, <28 chars each)
- ✅ Caption written (150-250 chars, natural tone)

---

## Post-Generation Checklist

After generating images:
- ✅ All 6 images portrait (1024x1536)?
- ✅ Same background/room across all 6?
- ✅ Same camera angle (not jumping)?
- ✅ Same lighting?
- ✅ Text readable at thumb size?
- ✅ Text positioned center (not top/bottom)?
- ✅ High quality (photorealistic, no weird artifacts)?
- ✅ Caption proofread?
- ✅ Hashtags (max 5)?
- ✅ Trending sound considered?

If ANY NO: Fix before posting.

---

## Performance Tracking (UPDATE AFTER EVERY POST)

```
Date: [YYYY-MM-DD]
Hook: [Exact hook text]
Images: [Consistent? Yes/No]
Text quality: [Readable? Yes/No]
Posted: [Time] at [Peak hour?]
Views (24h): [X]
Views (48h): [X]
Engagement rate: [Likes % | Comments % | Shares %]
Conversions: [Downloads | Signups | Revenue]
Analysis: [What worked | What didn't | Why]
Next iteration: [How to improve]
```

---

## Rules for Next Week's Posts

[CUMULATIVE — Add rules from failures, don't remove old ones]

1. Always 1024x1536 portrait
2. Locked architecture for consistency
3. Font size 6.5% minimum, centered
4. Max 28 characters per line
5. [New rule from this week's failures]
6. [New rule from successful pattern]

---

## Human Approval Gates

Posts need human approval for:
- ❓ Hook vibes (does it feel viral or meh?)
- ❓ Image consistency (real or AI-artsy?)
- ❓ Caption tone (natural or salesy?)
- ❓ Overall quality (would THIS pass a 10-second swipe test?)

Approved: Post to drafts  
Rejected: Update based on feedback, regenerate, resubmit

---

## Tools & APIs
- **Image gen:** [Your model]
- **Posting:** [Postiz / Your tool]
- **Analytics:** [TikTok Analytics / Custom tracking]
- **Music:** [Human adds manually — can't be automated yet]
```

---

## Notes for Kevin

**Fill in:**
- Your specific image generation model (gpt-image-1.5, ComfyUI, Flux, etc.)
- Your posting tool (Postiz, custom API, etc.)
- Your app names (NiggaBets, casino, betting, etc.)
- Your tracking setup (where/how you measure success)

**Update after every post:**
- Add new failures to the failure log
- Document what worked to success patterns
- Update rules for next cycle
- This is how the agent compounds

**The compounding effect:** Week 1 embarrassing → Week 2 decent → Week 3 viral. The skill file is how you encode learning and prevent regression.

