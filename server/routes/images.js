import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getAllImages, WATCH_DIR } from '../fileWatcher.js';

const router = express.Router();

// GET /api/images - Fetch images with filtering
router.get('/images', async (req, res) => {
  try {
    const { status, batch, from, to, limit = 100, offset = 0 } = req.query;

    // Validate status parameter
    if (status && !['APPROVED', 'REJECTED', 'CLOSE'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status value',
        valid_options: ['APPROVED', 'REJECTED', 'CLOSE', null],
      });
    }

    // Get all images
    let images = await getAllImages();

    // Apply filters
    if (status) {
      images = images.filter(img => img.approval_status === status);
    }

    if (batch) {
      images = images.filter(img => img.batch_id === batch);
    }

    if (from) {
      const fromDate = new Date(from);
      images = images.filter(img => new Date(img.created_at) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // End of day
      images = images.filter(img => new Date(img.created_at) <= toDate);
    }

    // Pagination
    const total = images.length;
    const paginatedImages = images.slice(
      parseInt(offset, 10),
      parseInt(offset, 10) + parseInt(limit, 10)
    );

    res.json({
      images: paginatedImages,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (err) {
    console.error('Error in GET /api/images:', err);
    res.status(500).json({
      error: 'Failed to fetch images',
      details: err.message,
    });
  }
});

// GET /api/file/:filename - Serve file with cache headers
router.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename - path traversal detected',
      });
    }

    const filePath = path.join(WATCH_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        filename,
      });
    }

    // Verify file is in watched directory (additional security check)
    const realPath = fs.realpathSync(filePath);
    const realWatchDir = fs.realpathSync(WATCH_DIR);
    if (!realPath.startsWith(realWatchDir)) {
      return res.status(400).json({
        error: 'Invalid filename - path traversal detected',
      });
    }

    // Detect MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Set cache headers (1 year = immutable)
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': `"${filename}"`,
    });

    // Stream file
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ error: 'Failed to stream file' });
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Error in GET /api/file/:filename:', err);
    res.status(500).json({
      error: 'Failed to serve file',
      details: err.message,
    });
  }
});

export default router;
