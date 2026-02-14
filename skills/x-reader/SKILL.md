# x-reader

Read and parse X (Twitter) posts without authentication.

## Usage

```
x-reader <url>
x-reader https://x.com/oliverhenry/status/2022011925903667547
```

## How It Works

1. **Nitter fallback** — Uses open-source Nitter instances to fetch tweets (no JS required)
2. **HTML parsing** — Extracts text, engagement metrics, media links, timestamps
3. **Structured output** — Returns JSON with full post details
4. **Error handling** — Falls back to multiple Nitter mirrors if one is down

## Output Format

```json
{
  "url": "https://x.com/user/status/123",
  "author": {
    "handle": "@username",
    "name": "Full Name",
    "avatar": "url"
  },
  "content": "Tweet text here",
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
      "url": "media-url",
      "alt": "alt-text"
    }
  ],
  "replies": [
    {
      "author": "@replier",
      "text": "Reply text"
    }
  ]
}
```

## Notes

- Respects Nitter instance rate limits
- Caches results locally for 24h
- No Twitter API key needed
- Fully privacy-respecting (Nitter is FOSS)
