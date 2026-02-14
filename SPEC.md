# ComfyUI Approval Dashboard v2 - Data Specification

## Metadata Schema

Extracted from ComfyUI output files. Sent from server to client via API and Socket.IO.

```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "size": 2048576,
  "width": 1024,
  "height": 1024,
  "created_at": "2026-02-13T22:45:00Z",
  "approval_status": null,
  "batch_id": "batch_123"
}
```

**Fields:**
- `filename` (string): Basename of file (e.g., "output_001.png")
- `size` (integer): File size in bytes
- `width` (integer): Image width in pixels (EXIF or error dimension if unavailable)
- `height` (integer): Image height in pixels
- `created_at` (ISO 8601 timestamp): File creation time
- `approval_status` (enum | null): `APPROVED`, `REJECTED`, `CLOSE`, or `null` (pending)
- `batch_id` (string): Batch identifier extracted from filename or timestamp

---

## Feedback Schema

User-submitted feedback for each image. Persisted to JSON and appended to skill-file.md.

```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "status": "APPROVED",
  "feedback_text": "Perfect! Color balance is excellent.",
  "timestamp": "2026-02-13T22:47:15Z",
  "prompt_ref": "prompt_12345"
}
```

**Fields:**
- `filename` (string): Image filename being approved/rejected
- `status` (enum): `APPROVED`, `REJECTED`, or `CLOSE` (needs fixes)
- `feedback_text` (string): Optional detailed feedback/notes
- `timestamp` (ISO 8601): When feedback was submitted
- `prompt_ref` (string, optional): Reference to ComfyUI prompt that generated the image

---

## Feedback Persistence - skill-file.md Format

Feedback is appended to `~/.openclaw/workspace/skills/comfyui/skill-file.md` in human-readable format:

```markdown
## Feedback Entry - 2026-02-13T22:47:15Z

- **Status:** APPROVED
- **File:** 2026-02-13_comfyui_output_001.png
- **Feedback:** Perfect! Color balance is excellent.
- **Suggestions:** None

---

## Feedback Entry - 2026-02-13T22:48:30Z

- **Status:** REJECTED
- **File:** 2026-02-13_comfyui_output_002.png
- **Feedback:** Colors are too saturated.
- **Suggestions:** Reduce saturation by 20%, adjust white balance

---
```

**Format rules:**
- Each entry starts with `## Feedback Entry - {ISO8601 timestamp}`
- Followed by: Status, File, Feedback (optional), Suggestions (optional)
- Entries separated by `---` (horizontal rule)
- Human-readable, git-friendly (append-only, diff-compatible)

---

## Feedback JSON Persistence - .comfyui-feedback.json

All feedback saved to `~/.openclaw/workspace/.comfyui-feedback.json` (internal, not user-facing).

```json
{
  "entries": [
    {
      "filename": "2026-02-13_comfyui_output_001.png",
      "status": "APPROVED",
      "feedback_text": "Perfect! Color balance is excellent.",
      "timestamp": "2026-02-13T22:47:15Z",
      "prompt_ref": "prompt_12345"
    },
    {
      "filename": "2026-02-13_comfyui_output_002.png",
      "status": "REJECTED",
      "feedback_text": "Colors are too saturated.",
      "timestamp": "2026-02-13T22:48:30Z",
      "prompt_ref": "prompt_12346"
    }
  ]
}
```

---

## Stats Schema

Aggregated statistics. Calculated from feedback entries and cached.

```json
{
  "total": 150,
  "approved": 95,
  "rejected": 35,
  "close": 20,
  "success_rate": 0.633,
  "average_feedback_length": 24.5,
  "patterns": {
    "color_issues": 8,
    "composition_issues": 5,
    "lighting_issues": 3
  },
  "calculated_at": "2026-02-13T22:47:15Z"
}
```

**Fields:**
- `total` (integer): Total images processed
- `approved` (integer): Number approved
- `rejected` (integer): Number rejected
- `close` (integer): Number marked "CLOSE" (needs fixes)
- `success_rate` (float): approved / total (0.0 to 1.0)
- `average_feedback_length` (float): Avg chars in feedback_text
- `patterns` (object): Keyword extraction from feedback (e.g., "color_issues" count)
- `calculated_at` (ISO 8601): When stats were last calculated

Cached to `~/.openclaw/workspace/.comfyui-stats.json` and refreshed on each feedback submission.

---

## Query Filters

### GET /api/images Query Parameters

```
GET /api/images?status=APPROVED&batch=batch_123&from=2026-02-13&to=2026-02-14
```

- `status` (enum, optional): `APPROVED`, `REJECTED`, `CLOSE`, or omit for all
- `batch` (string, optional): Filter by batch_id
- `from` (ISO date, optional): Start date (inclusive)
- `to` (ISO date, optional): End date (inclusive)
- `limit` (integer, optional): Max results (default 100)
- `offset` (integer, optional): Pagination offset (default 0)

---

## File Metadata Extraction

### From File System

- **filename**: `path.basename(filePath)`
- **size**: `fs.statSync(filePath).size`
- **created_at**: `fs.statSync(filePath).birthtimeMs` (or mtime fallback)

### From EXIF (if available)

- **width, height**: EXIF orientation-aware dimensions
- Fallback: default dimensions if EXIF unavailable

### Batch ID

Extracted from filename pattern:
- If filename contains timestamp (e.g., `2026-02-13_...`): use date as batch_id
- Otherwise: use first 8 chars of filename
- Fallback: "unknown_batch"

---

## Real-Time Updates

When feedback is submitted, the server emits:

```json
{
  "event": "feedback:saved",
  "data": {
    "filename": "2026-02-13_comfyui_output_001.png",
    "status": "APPROVED",
    "timestamp": "2026-02-13T22:47:15Z"
  }
}
```

Then immediately broadcasts updated stats:

```json
{
  "event": "stats:updated",
  "data": {
    "total": 150,
    "approved": 95,
    "rejected": 35,
    "close": 20,
    "success_rate": 0.633
  }
}
```

---

## Version Control & Git Safety

- `.comfyui-feedback.json`: Added to `.gitignore` (machine-local, not committed)
- `skill-file.md`: Committed to git (human-readable, append-only, safe for collaboration)
- All feedback visible in git history via skill-file.md
