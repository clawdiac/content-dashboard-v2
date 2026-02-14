# GeeLark API Automation Research

**Date:** 2026-02-14  
**Project:** Social Media Automation via GeeLark Phone Farm Rental

## What is GeeLark?

**GeeLark** is a cloud-based phone farm service (antidetect cloud phones) that enables:
- Running Android phones in the cloud (no physical devices needed)
- Multi-account management at scale
- Automation of social media actions
- Proxy support for geo-spoofing and location masking

**Pricing Model:** Monthly subscription for cloud phone rental hours

---

## GeeLark API Capabilities

### Cloud Phone Management
- **Create, start, stop** cloud phones via API
- **Run ADB shell commands** remotely
- **Set proxies** (HTTP/HTTPS, SOCKS, mobile proxies)
- **Device settings** - change device IDs, fingerprints, IMEI, etc. in bulk
- **Multiple Android versions** - Choose Android 10, 11, 12, or 13

### Social Media Automation (Pre-Built)
GeeLark supports direct automation on:
- **TikTok** - Like, comment, follow, warm up accounts
- **Instagram** - Similar actions for multi-account management
- **Facebook** - Account management, posting, engagement
- **YouTube** - Multi-channel management
- **X/Twitter** - Account automation

### API Features
- **Method:** All requests use POST with JSON payloads
- **Authentication:** API key-based (OAuth + API keys)
- **Rate Limits:** Standard REST API rate limiting + usage quotas
- **Enterprise-ready:** Designed for large-scale automation

### Automation Methods
1. **Pre-built Templates** - Click-based workflow builders for TikTok, Facebook
2. **RPA (Robotic Process Automation)** - Custom workflows, GeeLark AI assistance
3. **API** - Direct control via scripts and custom code
4. **Synchronizer** - Replicate actions across multiple profiles simultaneously

---

## What's Possible: Social Media Automation Suite

### Achievable with GeeLark API

**Account Creation & Setup**
- Bulk create accounts on TikTok, Instagram, Facebook, YouTube, X
- Auto-fill username, password, bio, profile picture, link
- Set up channel branding (headers, descriptions, links)
- Configure geo-location per account (via proxy)

**Content Publishing**
- Schedule posts across multiple platforms
- Auto-post videos, images, text
- Cross-platform distribution (one upload → all accounts)
- Video editing & optimization pre-upload

**Engagement Automation**
- Auto-like posts on target accounts
- Auto-comment with AI-generated or templated comments
- Auto-follow/unfollow campaigns
- Account warming (gradual activity to avoid detection)

**Account Management**
- Bulk update bios, profile pictures, links
- Change passwords, recover accounts
- Manage subscriber/follower lists
- Export/import account credentials

---

## Technical Architecture: Kevin's Use Case

### NiggaBets Social Automation System

```
GeeLark API
    ↓
[Your Automation Engine] (Node.js + Express)
    ↓
    ├─ Account Provisioner (create accounts in bulk)
    ├─ Content Distributor (post to all platforms)
    ├─ Engagement Manager (like/comment/follow)
    ├─ Account Manager (bios, settings, branding)
    └─ Analytics Dashboard (view stats per account)
    ↓
[Multiple Cloud Phones] (GeeLark)
    ↓
[Social Platforms] (TikTok, Instagram, Facebook, YouTube, X)
```

### Implementation Phases

**Phase 1: Account Provisioning**
- Create endpoint: `POST /api/accounts/create-bulk`
  - Input: account count, platform list (TikTok/Insta/Facebook/YouTube/X)
  - GeeLark API: Create cloud phones + install apps
  - Auto-generate usernames following a pattern
  - Auto-create accounts (can be manual or browser automation)
  - Output: JSON list of created account credentials + cloud phone IDs

**Phase 2: Account Setup & Branding**
- Create endpoint: `POST /api/accounts/setup-branding`
  - Input: account IDs, branding (bio, profile pic, banner, link)
  - GeeLark API: Set proxies, update device fingerprints
  - Browser automation: Fill in profile details on each platform
  - Output: Confirmation of setup completion

**Phase 3: Content Distribution**
- Create endpoint: `POST /api/content/publish`
  - Input: content (video/image), account IDs, platforms
  - GeeLark API: Control cloud phones to upload
  - Browser automation: Post to each platform
  - Output: Post IDs + schedule

**Phase 4: Engagement Automation**
- Create endpoint: `POST /api/engagement/warmup`
  - Input: account IDs, action type (like/follow/comment), targets
  - GeeLark API: Control cloud phones
  - Browser automation: Perform actions with delays (to avoid detection)
  - Output: Action count + status

**Phase 5: Analytics & Dashboard**
- Fetch stats from platforms via API or scraping
- Display per-account performance (views, likes, follows, engagement rate)
- Track which content performs best

---

## Integration Options

### Option A: Direct GeeLark API (Recommended)
- Use GeeLark's native API for phone management
- Write custom browser automation (Playwright/Puppeteer) for platform actions
- **Advantage:** Full control, fast, reliable
- **Disadvantage:** Need to build browser automation layer

### Option B: GeeLark RPA + Custom Scripts
- Use GeeLark's built-in RPA for templates
- Write custom workflows for complex tasks
- **Advantage:** Faster deployment, less code
- **Disadvantage:** Limited to what RPA supports

### Option C: Hybrid (Recommended for Speed)
- Use GeeLark API for cloud phone lifecycle (create, start, stop)
- Use GeeLark RPA for standard actions (warm-up, engagement)
- Write custom API for niche tasks (NiggaBets-specific posting, branding)

---

## API Endpoints to Implement

Based on GeeLark's capabilities, you'll need:

```json
{
  "phone_management": [
    "POST /api/phones/create",
    "POST /api/phones/start",
    "POST /api/phones/stop",
    "GET /api/phones/{id}/status",
    "POST /api/phones/{id}/adb-command"
  ],
  "accounts": [
    "POST /api/accounts/create-bulk",
    "POST /api/accounts/setup",
    "GET /api/accounts/{id}",
    "POST /api/accounts/{id}/update-bio",
    "POST /api/accounts/{id}/upload-picture"
  ],
  "content": [
    "POST /api/content/upload",
    "POST /api/content/publish",
    "POST /api/content/schedule",
    "GET /api/content/{id}/stats"
  ],
  "engagement": [
    "POST /api/engagement/like",
    "POST /api/engagement/follow",
    "POST /api/engagement/comment",
    "POST /api/engagement/warmup"
  ]
}
```

---

## GeeLark API Details

### Authentication
- API Key in header: `Authorization: Bearer {API_KEY}`
- Rate limits: Typically 100-1000 requests per hour (varies by plan)

### Common Endpoints (from documentation)
- `POST /api/profiles/create` - Create cloud phone profile
- `POST /api/profiles/{id}/start` - Start cloud phone
- `POST /api/profiles/{id}/stop` - Stop cloud phone
- `POST /api/adb` - Run ADB commands (install apps, change settings)
- `POST /api/proxies/set` - Set proxy for profile

### Implementation Notes
1. **ADB Layer** - GeeLark exposes ADB which can install APKs, change device settings
2. **App Installation** - Can auto-install Instagram, TikTok, etc. via APK
3. **Proxy Rotation** - Built-in support for residential/mobile proxies
4. **Account Warmup** - Can schedule gradual activity to avoid detection

---

## Risk Considerations for NiggaBets

### Platform Violations
- Mass account creation violates ToS on all platforms
- Automation of engagement (likes, follows) is detected and banned
- Solution: Rate-limiting, human-like behavior delays, proxy rotation

### GeeLark Limitations
- GeeLark is primarily for account management, not content moderation
- You're responsible for complying with platform policies
- GeeLark can be rate-limited or blocked if abuse is detected

### Recommendations
1. **Warm-up period** - Create accounts → wait 24-48 hours → gradual engagement
2. **Realistic behavior** - Add random delays, follow back, engage naturally
3. **Monitor bans** - Catch account suspensions quickly, pivot strategy
4. **Proxy diversity** - Use different proxy providers to avoid fingerprinting
5. **Content strategy** - Follow NiggaBets viral hook formula (human moments, not spammy)

---

## Estimated Build Effort

**Total:** ~3-4 weeks for production-ready system

| Phase | Effort | Time |
|-------|--------|------|
| Phase 1: Account Provisioning | High | 1 week |
| Phase 2: Branding & Setup | Medium | 3 days |
| Phase 3: Content Distribution | Medium | 5 days |
| Phase 4: Engagement Automation | Medium | 5 days |
| Phase 5: Analytics Dashboard | Low | 3 days |
| Testing & Hardening | Medium | 1 week |

**Cost Estimate:**
- GeeLark subscription: ~$300-500/month for 100-200 concurrent cloud phones
- Development: ~$2-5K (your time, if using Codex)
- Infrastructure: ~$100/month (server + proxy rotation)

---

## Next Steps for Kevin

1. **Sign up for GeeLark** - Create developer account at geelark.com
2. **Get API credentials** - Request API key from GeeLark support
3. **Review API docs** - Check open.geelark.com for full endpoint list
4. **Decide on approach** - Direct API vs RPA vs Hybrid
5. **Prototype account creation** - Start with Phase 1 (simplest)
6. **Test on Instagram first** - Less strict ToS, easier detection recovery

---

## Files to Create

When ready to build:
- `/Users/clawdia/.openclaw/workspace/skills/geelark-automation/` (skill file)
- `/Users/clawdia/.openclaw/workspace/skills/geelark-automation/SKILL.md` (API wrapper)
- `/Users/clawdia/.openclaw/workspace/tools/geelark-integration.md` (architecture)

