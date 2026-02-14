# ComfyUI Approval Dashboard v2 - API Specification

## REST API Endpoints

### Images Endpoints

#### GET /api/images

Fetch list of images with optional filtering.

**Query Parameters:**
```
GET /api/images?status=APPROVED&batch=batch_123&from=2026-02-13&to=2026-02-14&limit=50&offset=0
```

- `status` (enum, optional): `APPROVED`, `REJECTED`, `CLOSE`
- `batch` (string, optional): Filter by batch_id
- `from` (ISO date, optional): Start date (inclusive)
- `to` (ISO date, optional): End date (inclusive)
- `limit` (integer, optional): Max results, default 100
- `offset` (integer, optional): Pagination offset, default 0

**Response (200 OK):**
```json
{
  "images": [
    {
      "filename": "2026-02-13_comfyui_output_001.png",
      "size": 2048576,
      "width": 1024,
      "height": 1024,
      "created_at": "2026-02-13T22:45:00Z",
      "approval_status": null,
      "batch_id": "batch_123"
    },
    {
      "filename": "2026-02-13_comfyui_output_002.png",
      "size": 2097152,
      "width": 1024,
      "height": 1024,
      "created_at": "2026-02-13T22:45:30Z",
      "approval_status": "APPROVED",
      "batch_id": "batch_123"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid status value",
  "valid_options": ["APPROVED", "REJECTED", "CLOSE"]
}
```

---

#### GET /api/file/:filename

Serve image or video file with cache headers.

**Parameters:**
- `filename` (string, URL-encoded): Image filename (e.g., `2026-02-13_output_001.png`)

**Response (200 OK):**
- Binary image/video data
- Headers:
  - `Content-Type`: Detected from file (image/png, image/jpeg, video/mp4, etc.)
  - `Cache-Control`: public, max-age=31536000 (1 year, immutable)
  - `ETag`: hash of file

**Response (404 Not Found):**
```json
{
  "error": "File not found",
  "filename": "2026-02-13_output_001.png"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid filename - path traversal detected"
}
```

---

### Feedback Endpoints

#### POST /api/feedback

Submit approval/rejection feedback for a single image.

**Request Body:**
```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "status": "APPROVED",
  "feedback_text": "Perfect! Color balance is excellent."
}
```

**Fields:**
- `filename` (required, string): Image filename
- `status` (required, enum): `APPROVED`, `REJECTED`, or `CLOSE`
- `feedback_text` (optional, string): Detailed feedback

**Response (200 OK):**
```json
{
  "success": true,
  "saved_at": "2026-02-13T22:47:15Z",
  "message": "Feedback saved and skill-file.md updated"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "status is required and must be one of: APPROVED, REJECTED, CLOSE"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to save feedback",
  "details": "Cannot write to skill-file.md"
}
```

---

#### GET /api/stats

Fetch aggregated statistics.

**Query Parameters:** None

**Response (200 OK):**
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

---

#### POST /api/batch-feedback

Submit feedback for multiple images in a single request.

**Request Body:**
```json
{
  "entries": [
    {
      "filename": "2026-02-13_output_001.png",
      "status": "APPROVED",
      "feedback_text": "Great!"
    },
    {
      "filename": "2026-02-13_output_002.png",
      "status": "REJECTED",
      "feedback_text": "Too dark"
    },
    {
      "filename": "2026-02-13_output_003.png",
      "status": "CLOSE",
      "feedback_text": "Needs adjustments"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "saved": 3,
  "failed": 0,
  "timestamp": "2026-02-13T22:47:15Z",
  "results": [
    { "filename": "2026-02-13_output_001.png", "success": true },
    { "filename": "2026-02-13_output_002.png", "success": true },
    { "filename": "2026-02-13_output_003.png", "success": true }
  ]
}
```

**Response (207 Multi-Status):**
```json
{
  "success": false,
  "saved": 2,
  "failed": 1,
  "timestamp": "2026-02-13T22:47:15Z",
  "results": [
    { "filename": "2026-02-13_output_001.png", "success": true },
    { "filename": "2026-02-13_output_002.png", "success": false, "error": "Invalid status" },
    { "filename": "2026-02-13_output_003.png", "success": true }
  ]
}
```

---

## WebSocket Events

### Client → Server

(No client-to-server events; feedback submitted via REST API)

### Server → Client

Emitted from server to connected clients in real-time.

---

#### Event: image:new

Emitted when a new image is detected in the output directory.

**Data:**
```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "size": 2048576,
  "width": 1024,
  "height": 1024,
  "created_at": "2026-02-13T22:45:00Z",
  "batch_id": "batch_123"
}
```

---

#### Event: image:updated

Emitted when an image's approval status changes (feedback submitted).

**Data:**
```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "approval_status": "APPROVED"
}
```

---

#### Event: feedback:saved

Emitted after feedback is successfully saved to JSON and skill-file.md.

**Data:**
```json
{
  "filename": "2026-02-13_comfyui_output_001.png",
  "status": "APPROVED",
  "timestamp": "2026-02-13T22:47:15Z"
}
```

---

#### Event: stats:updated

Emitted every 5 seconds (periodic broadcast) with current stats.

**Data:**
```json
{
  "total": 150,
  "approved": 95,
  "rejected": 35,
  "close": 20,
  "success_rate": 0.633,
  "calculated_at": "2026-02-13T22:47:15Z"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 207 | Multi-Status - Batch operation with mixed results |
| 400 | Bad Request - Invalid parameters or body |
| 404 | Not Found - File or resource not found |
| 500 | Internal Server Error - Server failure |

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Optional additional context"
}
```

---

## Rate Limiting

No rate limiting in v2.0 (can be added in future versions).

---

## CORS

Express configured to allow requests from:
- `http://localhost:3000` (local development)
- `http://localhost:*` (any local port)

Production: configure via environment variable `ALLOWED_ORIGIN`.

---

## WebSocket Connection

Client connects to server at `/socket.io`:
```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

Events listened:
- `connect` - Connected to server
- `disconnect` - Disconnected from server
- `image:new` - New image detected
- `feedback:saved` - Feedback saved
- `stats:updated` - Stats refreshed
- `error` - Server error
