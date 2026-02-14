import express from 'express';
import { saveFeedback, getStats } from '../feedbackHandler.js';

const router = express.Router();

// POST /api/feedback - Submit feedback for a single image
router.post('/feedback', async (req, res) => {
  try {
    const { filename, status, feedback_text } = req.body;

    // Validate required fields
    if (!filename || !status) {
      return res.status(400).json({
        error: 'filename and status are required',
        valid_statuses: ['APPROVED', 'REJECTED', 'CLOSE'],
      });
    }

    // Validate status value
    if (!['APPROVED', 'REJECTED', 'CLOSE'].includes(status)) {
      return res.status(400).json({
        error: 'status must be one of: APPROVED, REJECTED, CLOSE',
        received: status,
      });
    }

    // Save feedback
    const result = await saveFeedback(filename, status, feedback_text || '');

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to save feedback',
        details: result.error,
      });
    }

    res.json({
      success: true,
      saved_at: result.timestamp,
      message: 'Feedback saved and skill-file.md updated',
    });
  } catch (err) {
    console.error('Error in POST /api/feedback:', err);
    res.status(500).json({
      error: 'Failed to save feedback',
      details: err.message,
    });
  }
});

// GET /api/stats - Fetch aggregated statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error in GET /api/stats:', err);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: err.message,
    });
  }
});

// POST /api/batch-feedback - Submit feedback for multiple images
router.post('/batch-feedback', async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({
        error: 'entries must be an array',
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({
        error: 'entries array cannot be empty',
      });
    }

    // Process all entries
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const entry of entries) {
      const { filename, status, feedback_text } = entry;

      // Validate entry
      if (!filename || !status) {
        results.push({
          filename,
          success: false,
          error: 'filename and status are required',
        });
        failCount++;
        continue;
      }

      if (!['APPROVED', 'REJECTED', 'CLOSE'].includes(status)) {
        results.push({
          filename,
          success: false,
          error: `Invalid status: ${status}`,
        });
        failCount++;
        continue;
      }

      // Save feedback for this entry
      const result = await saveFeedback(filename, status, feedback_text || '');

      if (result.success) {
        results.push({
          filename,
          success: true,
        });
        successCount++;
      } else {
        results.push({
          filename,
          success: false,
          error: result.error,
        });
        failCount++;
      }
    }

    // Determine response status
    const statusCode = failCount === 0 ? 200 : 207;

    res.status(statusCode).json({
      success: failCount === 0,
      saved: successCount,
      failed: failCount,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('Error in POST /api/batch-feedback:', err);
    res.status(500).json({
      error: 'Failed to process batch feedback',
      details: err.message,
    });
  }
});

export default router;
