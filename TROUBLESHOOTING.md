# ComfyUI Approval Dashboard v2 - Troubleshooting

## Common Issues & Solutions

### Server Issues

#### 1. Port 3000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

---

#### 2. Server Crashes on Startup

**Error:** `Cannot find module...`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Ensure Node.js is v18+
node --version  # Should be v18.0.0 or higher
```

---

#### 3. File Watcher Not Detecting Images

**Error:** New images in `~/.openclaw/cache/comfyui-outputs/` don't appear

**Solutions:**
1. **Directory doesn't exist:**
   ```bash
   mkdir -p ~/.openclaw/cache/comfyui-outputs
   ```

2. **Wrong file extension:**
   - Supported: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.mp4`, `.webm`, `.avi`, `.mov`
   - Check filename is lowercase extension

3. **File still writing:**
   - File watcher waits 2 seconds for write to finish
   - Ensure ComfyUI has fully written file before checking

4. **Permission issues:**
   ```bash
   chmod 755 ~/.openclaw/cache/comfyui-outputs
   ```

5. **Check server logs:**
   ```bash
   # If running in foreground, watch for "New image detected"
   # If background, check logs:
   ps aux | grep "node server"
   ```

---

### API Issues

#### 4. GET /api/images Returns Empty

**Cause:** No images in watch directory yet

**Solutions:**
1. Add test image:
   ```bash
   touch ~/.openclaw/cache/comfyui-outputs/test.png
   ```

2. Check watch directory is configured:
   ```bash
   curl -s http://localhost:3000/api/images | jq .
   # Should show { images: [...], total: ... }
   ```

#### 5. POST /api/feedback Returns 400 Bad Request

**Error:** `"status is required and must be one of..."`

**Solution:**
```bash
# Valid request:
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.png",
    "status": "APPROVED",
    "feedback_text": "Good"
  }'

# Status must be exactly: APPROVED, REJECTED, or CLOSE
```

---

#### 6. GET /api/stats Returns 0 for Everything

**Cause:** No feedback saved yet

**Solution:**
```bash
# Submit feedback first
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.png",
    "status": "APPROVED",
    "feedback_text": "Test"
  }'

# Then check stats
curl http://localhost:3000/api/stats | jq .
```

---

### Frontend Issues

#### 7. Dashboard Blank/Not Loading

**Causes:**
1. Server not running: `curl http://localhost:3000`
2. Build not completed: `npm run build:client`
3. Browser cache: Clear with Ctrl+Shift+Delete (Chrome)

**Solutions:**
```bash
# Ensure server is running
npm start

# Rebuild client
npm run build:client

# Check browser console (F12 → Console)
# Look for JavaScript errors
```

---

#### 8. Images Not Showing in Gallery

**Cause:** Images not detected by file watcher

**Check:**
1. API returns images: `curl http://localhost:3000/api/images | jq .`
2. If API returns images, issue is frontend (check console)
3. If API returns empty, issue is file watcher (see issue #4)

---

#### 9. Approval Buttons Not Working

**Cause:** API not responding to feedback

**Solutions:**
1. Check API is working:
   ```bash
   curl -X POST http://localhost:3000/api/feedback \
     -H "Content-Type: application/json" \
     -d '{"filename":"test.png","status":"APPROVED"}'
   ```

2. Check browser console for errors (F12)

3. Verify feedback is saved:
   ```bash
   cat ~/.openclaw/workspace/.comfyui-feedback.json | jq .
   ```

---

#### 10. Theme Toggle Not Working

**Solution:**
1. Check localStorage is enabled (not incognito mode)
2. Check browser console for errors
3. Try clearing localStorage:
   ```javascript
   // In browser console (F12)
   localStorage.clear()
   location.reload()
   ```

---

### WebSocket Issues

#### 11. Real-Time Updates Not Working

**Symptoms:** Stats don't update, new images don't appear automatically

**Check:**
1. Open browser DevTools (F12)
2. Go to Network → WS (WebSocket) tab
3. Refresh page
4. Look for `/socket.io` connection
5. Should show `Connected` status

**Solutions:**
```bash
# Check server is running
curl http://localhost:3000

# Check WebSocket endpoint is accessible
# (Browser will attempt automatically on page load)

# Fallback to polling (if WebSocket blocked):
# Edit client/src/hooks/useSocket.js
# Change: transports: ['websocket', 'polling']
# To: transports: ['polling']
```

---

### Feedback Persistence Issues

#### 12. Feedback Not Saving to skill-file.md

**Check:**
1. Directory exists:
   ```bash
   ls -la ~/.openclaw/workspace/skills/comfyui/
   ```

2. File is writable:
   ```bash
   touch ~/.openclaw/workspace/skills/comfyui/skill-file.md
   ```

3. JSON file is saving:
   ```bash
   cat ~/.openclaw/workspace/.comfyui-feedback.json | jq .
   ```

**Solution:**
```bash
# Create directory if needed
mkdir -p ~/.openclaw/workspace/skills/comfyui

# Set permissions
chmod 755 ~/.openclaw/workspace/skills
chmod 755 ~/.openclaw/workspace/skills/comfyui
chmod 644 ~/.openclaw/workspace/skills/comfyui/skill-file.md
```

---

#### 13. Feedback File Corrupted

**Error:** `Unexpected token` when reading `.comfyui-feedback.json`

**Solution:**
```bash
# Backup corrupted file
mv ~/.openclaw/workspace/.comfyui-feedback.json ~/.comfyui-feedback.backup.json

# Restart server to create new file
npm start

# The new empty file will be created
```

---

### Performance Issues

#### 14. Dashboard Slow with Many Images

**Cause:** Too many images loaded at once

**Solutions:**
1. **Pagination:** Add `?limit=50&offset=0` to API calls
2. **Filtering:** Use status/date filters to reduce results
3. **Browser:** Close other tabs, increase RAM available
4. **Network:** Check Network tab (F12) for slow image loading
   - Images should cache after first load
   - Check `Cache-Control: max-age=31536000` header

---

#### 15. High Memory Usage

**Cause:** Too many Socket.IO connections or large feedback file

**Solutions:**
```bash
# Check feedback file size
ls -lh ~/.openclaw/workspace/.comfyui-feedback.json

# If > 100MB, consider archiving old feedback
# Restart server
npm start
```

---

### Testing Issues

#### 16. Tests Fail to Run

**Error:** `Cannot find module 'vitest'`

**Solution:**
```bash
npm install --save-dev vitest @vitest/ui
npm test
```

---

#### 17. E2E Tests Timeout

**Cause:** Server not starting or page not loading

**Solution:**
```bash
# Ensure server is running
npm start

# In another terminal, run E2E tests
npm run test:e2e

# If timeout, try with longer timeout:
npm run test:e2e -- --timeout=60000
```

---

### Logs & Debugging

#### Where Are the Logs?

**Server logs:**
```bash
# If running in foreground, logs appear in terminal
# If running in background:
cat /tmp/comfyui-server.log

# Tail logs in real-time
tail -f /tmp/comfyui-server.log

# Search for errors
grep -i error /tmp/comfyui-server.log
```

**Browser console:**
```
Press F12 → Console tab
Look for red errors, yellow warnings, or blue info messages
```

**Network requests:**
```
Press F12 → Network tab
Check /api/* requests for 200 status
Check WebSocket (WS) for "connected" status
```

---

## Debug Commands

### Check Server Status

```bash
# Is port 3000 listening?
netstat -an | grep 3000

# Is Node process running?
ps aux | grep "node server"

# Can you reach the server?
curl -v http://localhost:3000
```

### Check File Watcher

```bash
# Does watch directory exist?
ls -la ~/.openclaw/cache/comfyui-outputs/

# Are there files in it?
find ~/.openclaw/cache/comfyui-outputs -type f | head -5

# Check file permissions
ls -la ~/.openclaw/cache/comfyui-outputs/yourimage.png
```

### Check Feedback Persistence

```bash
# Is feedback saved?
cat ~/.openclaw/workspace/.comfyui-feedback.json | jq .

# Is skill file updated?
tail -20 ~/.openclaw/workspace/skills/comfyui/skill-file.md

# Are stats calculated?
cat ~/.openclaw/workspace/.comfyui-stats.json | jq .
```

### Test API Endpoints

```bash
# Get images
curl http://localhost:3000/api/images | jq .

# Get stats
curl http://localhost:3000/api/stats | jq .

# Submit feedback
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.png","status":"APPROVED"}'
```

---

## Performance Benchmarks

**Expected performance:**
- Page load: < 2 seconds
- Gallery render (100 images): < 500ms
- Approval submit: < 200ms (including file I/O)
- Stats update: < 100ms

If you're seeing slower performance:
1. Check browser Network tab for slow resources
2. Check disk I/O (feedback file writes)
3. Monitor CPU/RAM usage (`top` or Activity Monitor)
4. Check for Node.js memory leaks (`node --inspect server/index.js`)

---

## Still Stuck?

1. Check server logs: `tail -f /tmp/comfyui-server.log`
2. Check browser console: Press F12
3. Enable debug mode:
   ```bash
   DEBUG=* npm start
   ```
4. Check all prerequisites are installed:
   ```bash
   node --version  # Should be v18+
   npm --version   # Should be v8+
   npm ls          # Check dependencies
   ```
