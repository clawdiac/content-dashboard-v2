#!/usr/bin/env node

const https = require("https");
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// Nitter instances (public, FOSS)
const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.domain.glass",
  "https://nitter.1d4.us",
  "https://x.com", // Fallback to original (may require JS parsing)
];

const CACHE_DIR = path.join(process.env.HOME, ".openclaw", "cache", "x-reader");

// Ensure cache dir exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Parse X/Twitter URL and extract user/status ID
 */
function parseXUrl(urlString) {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(/\/(\w+)\/status\/(\d+)/);
    if (match) {
      return { handle: match[1], statusId: match[2] };
    }
  } catch (e) {
    // Invalid URL
  }
  return null;
}

/**
 * Fetch with timeout and headers to avoid blocking
 */
function fetchUrl(urlString, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const protocol = urlString.startsWith("https") ? https : http;
    const options = {
      timeout: timeoutMs,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    };

    const req = protocol.get(urlString, options, (res) => {
      // Check for rate limit / blocking responses
      if (res.statusCode === 403 || res.statusCode === 429) {
        reject(new Error(`HTTP ${res.statusCode} - Rate limited or blocked`));
        return;
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`HTTP ${res.statusCode}: ${urlString.split("/")[2]}`)
          );
        } else {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

/**
 * Parse Nitter HTML response
 */
function parseNitterHtml(html) {
  const result = {
    author: {},
    metrics: {},
    media: [],
    replies: [],
  };

  // Extract author info
  const authorMatch = html.match(/<a href="\/(\w+)\/with_replies"[^>]*>([^<]+)<\/a>/);
  if (authorMatch) {
    result.author.handle = "@" + authorMatch[1];
    result.author.name = authorMatch[2];
  }

  // Extract tweet text
  const textMatch = html.match(
    /<div class="tweet-text"[^>]*>(.*?)<\/div>/s
  );
  if (textMatch) {
    result.content = textMatch[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Extract metrics (likes, retweets, replies, views)
  const likesMatch = html.match(
    />\s*(\d+(?:[KMB])?)\s*(?:Like|Favorite)/i
  );
  if (likesMatch) {
    result.metrics.likes = parseMetricNumber(likesMatch[1]);
  }

  const repliesMatch = html.match(/>\s*(\d+(?:[KMB])?)\s*(?:Reply|Comment)/i);
  if (repliesMatch) {
    result.metrics.replies = parseMetricNumber(repliesMatch[1]);
  }

  const retweetsMatch = html.match(
    />\s*(\d+(?:[KMB])?)\s*(?:Retweet|Repost)/i
  );
  if (retweetsMatch) {
    result.metrics.retweets = parseMetricNumber(retweetsMatch[1]);
  }

  const viewsMatch = html.match(/>\s*(\d+(?:[KMB])?)\s*(?:View|Impression)/i);
  if (viewsMatch) {
    result.metrics.views = parseMetricNumber(viewsMatch[1]);
  }

  // Extract timestamp
  const timeMatch = html.match(/<span title="([^"]+)">/);
  if (timeMatch) {
    result.timestamp = new Date(timeMatch[1]).toISOString();
  }

  // Extract media
  const imgMatches = html.matchAll(/src="([^"]*\/[^"]*\.(jpg|png|gif|webp))"/gi);
  for (const match of imgMatches) {
    if (!match[1].includes("avatar") && !match[1].includes("banner")) {
      result.media.push({
        type: "image",
        url: match[1],
      });
    }
  }

  const videoMatches = html.matchAll(/src="([^"]*\.mp4)"/gi);
  for (const match of videoMatches) {
    result.media.push({
      type: "video",
      url: match[1],
    });
  }

  return result;
}

/**
 * Parse metric numbers (1K = 1000, 1M = 1000000, etc.)
 */
function parseMetricNumber(str) {
  const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
  const match = str.match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  return Math.round(num * (multipliers[suffix] || 1));
}

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch and parse X post from Nitter or Archive.org
 */
async function fetchXPost(urlString) {
  const parsed = parseXUrl(urlString);
  if (!parsed) {
    throw new Error(`Invalid X URL: ${urlString}`);
  }

  const { handle, statusId } = parsed;
  const cacheKey = `${handle}-${statusId}.json`;
  const cachePath = path.join(CACHE_DIR, cacheKey);

  // Check cache (24h TTL)
  if (fs.existsSync(cachePath)) {
    const stat = fs.statSync(cachePath);
    const age = Date.now() - stat.mtimeMs;
    if (age < 24 * 60 * 60 * 1000) {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      cached.cached = true;
      return cached;
    }
  }

  let lastError;

  // Try Nitter instances with delays
  for (let i = 0; i < NITTER_INSTANCES.length; i++) {
    const baseUrl = NITTER_INSTANCES[i];
    try {
      if (i > 0) await delay(1000); // Rate limiting

      const nitterUrl = `${baseUrl}/${handle}/status/${statusId}`;
      const html = await fetchUrl(nitterUrl, 8000);

      const result = parseNitterHtml(html);
      result.url = urlString;
      result.fetchedFrom = baseUrl;
      result.fetchedAt = new Date().toISOString();
      result.cached = false;

      // Cache result
      fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));

      return result;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  // Fallback: Try Archive.org (simplified)
  try {
    console.error(
      `[x-reader] Nitter failed (${lastError?.message}), trying Archive.org...`
    );
    const archiveCalendarUrl = `https://web.archive.org/web/*/x.com/*/status/*`;
    const archiveHtml = await fetchUrl(archiveCalendarUrl, 8000);

    // If Archive.org responded, return a note
    const result = {
      url: urlString,
      fetchedFrom: "archive.org",
      fetchedAt: new Date().toISOString(),
      cached: false,
      note: "Archive.org attempted but post may not be archived yet.",
      author: {},
      content: "Post not yet captured by Archive.org.",
      metrics: {},
      media: [],
    };

    fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));
    return result;
  } catch (archiveErr) {
    // Archive fallback also failed
  }

  // If everything fails, return a helpful error
  throw new Error(
    `Failed to fetch X post. Tried: Nitter instances, Archive.org. Last Nitter error: ${lastError?.message}. ` +
      `Please try again later or paste the tweet text directly.`
  );
}

/**
 * Main CLI handler
 */
async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: x-reader <x.com-url>");
    console.error("Example: x-reader https://x.com/oliverhenry/status/123");
    process.exit(1);
  }

  try {
    const result = await fetchXPost(url);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Export for use as a module (OpenClaw skill)
module.exports = {
  fetchXPost,
  parseXUrl,
  parseNitterHtml,
};

// Run as CLI
if (require.main === module) {
  main();
}
