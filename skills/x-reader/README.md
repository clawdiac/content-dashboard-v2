# x-reader Skill

Read and parse X (Twitter) posts without API keys using open-source infrastructure.

## Installation

The skill is built-in to this workspace. No npm install needed (uses only Node.js built-in modules).

## Usage

### As a CLI command

```bash
x-reader https://x.com/oliverhenry/status/2022011925903667547
```

### From OpenClaw

```
/x-reader https://x.com/oliverhenry/status/2022011925903667547
```

### From JavaScript/Node

```javascript
const { fetchXPost } = require("./index.js");

const post = await fetchXPost("https://x.com/user/status/123");
console.log(post);
```

## How It Works

The skill tries multiple strategies to fetch posts:

1. **Nitter instances** (open-source Twitter frontend)
   - No authentication needed
   - No JavaScript required
   - Multiple mirrors for redundancy
   
2. **Archive.org snapshots** (fallback)
   - Grabs historical snapshots
   - Works when live sources are down
   
3. **Manual fallback** (when all automated methods fail)
   - Copy/paste tweet text directly
   - I'll parse and store it in memory

## Output Format

```json
{
  "url": "https://x.com/oliverhenry/status/2022011925903667547",
  "author": {
    "handle": "@oliverhenry",
    "name": "Oliver Henry"
  },
  "content": "The full tweet text here...",
  "metrics": {
    "likes": 1234,
    "replies": 56,
    "retweets": 789,
    "views": 50000
  },
  "timestamp": "2026-02-13T19:55:00Z",
  "media": [
    {
      "type": "image|video|gif",
      "url": "https://..."
    }
  ],
  "fetchedFrom": "https://nitter.poast.org",
  "fetchedAt": "2026-02-14T03:59:32.426Z",
  "cached": false
}
```

## Caching

- Results are cached for **24 hours** locally
- Cache location: `~/.openclaw/cache/x-reader/`
- Automatic cache hits if the same URL is requested again

## Limitations

- Some Nitter instances may block high-volume requests (add delays)
- Media extraction relies on HTML structure (may need updates if X/Nitter changes)
- Replies are not currently extracted (can be added)
- Rate limiting may apply to Archive.org

## Troubleshooting

### 403 Forbidden / Rate Limited

**Why:** Nitter instances block automated requests to prevent abuse.

**Solution:** 
1. Try again later (Nitter load balancing)
2. Use Archive.org snapshots
3. Manually paste the tweet text

### No author/content extracted

**Why:** Nitter HTML structure differs from expected format.

**Solution:** Update the parsing regex in `parseNitterHtml()` or use manual paste.

### Archive.org fallback not working

**Why:** Post not yet archived, or Archive.org is rate limiting.

**Solution:** Use manual paste approach.

## Future Improvements

- [ ] Extract tweet replies automatically
- [ ] Support for threads (multiple tweets)
- [ ] Detect quote tweets
- [ ] Extract embedded links
- [ ] Support for media/video URLs
- [ ] Rate limit detection and exponential backoff
- [ ] Multiple Nitter instance pooling
- [ ] Firecrawl integration (if API available)

## Manual Fallback Pattern

When all automated methods fail:

```
Kevin: Here's that tweet: "Some tweet text here... [engagement details]"

Me: Got it. Parsed the tweet. Storing insights in memory for viral analysis.
```

## Privacy

- Uses FOSS infrastructure (Nitter)
- No API keys required
- No tracking or logging to external services
- Cache stored locally only
