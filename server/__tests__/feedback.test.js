import { describe, it, expect, beforeEach } from 'vitest';
import { saveFeedback, getStats } from '../feedbackHandler.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const testFeedback = {
  filename: 'test-image.png',
  status: 'APPROVED',
  feedback_text: 'Test feedback for validation',
};

describe('Feedback Handler', () => {
  describe('saveFeedback', () => {
    it('should save feedback successfully', async () => {
      const result = await saveFeedback(
        testFeedback.filename,
        testFeedback.status,
        testFeedback.feedback_text
      );
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('timestamp');
    });

    it('should return timestamp on success', async () => {
      const result = await saveFeedback(
        'timestamp-test.png',
        'REJECTED',
        'Timestamp test'
      );
      expect(result.success).toBe(true);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle different statuses', async () => {
      const statuses = ['APPROVED', 'REJECTED', 'CLOSE'];
      
      for (const status of statuses) {
        const result = await saveFeedback(
          `test-${status}.png`,
          status,
          `Testing ${status}`
        );
        expect(result.success).toBe(true);
      }
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      const stats = await getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('approved');
      expect(stats).toHaveProperty('rejected');
      expect(stats).toHaveProperty('close');
      expect(stats).toHaveProperty('success_rate');
      expect(stats).toHaveProperty('calculated_at');
    });

    it('should have valid stats values', async () => {
      const stats = await getStats();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.approved).toBe('number');
      expect(typeof stats.rejected).toBe('number');
      expect(typeof stats.close).toBe('number');
      expect(typeof stats.success_rate).toBe('number');
      expect(stats.success_rate).toBeGreaterThanOrEqual(0);
      expect(stats.success_rate).toBeLessThanOrEqual(1);
    });

    it('should have consistent totals', async () => {
      const stats = await getStats();
      const sum = stats.approved + stats.rejected + stats.close;
      expect(sum).toBeLessThanOrEqual(stats.total);
    });

    it('should include patterns object', async () => {
      const stats = await getStats();
      expect(stats).toHaveProperty('patterns');
      expect(typeof stats.patterns).toBe('object');
    });

    it('should calculate success rate correctly', async () => {
      // Save some test feedback
      await saveFeedback('calc-test-1.png', 'APPROVED', 'Test');
      await saveFeedback('calc-test-2.png', 'REJECTED', 'Test');
      
      const stats = await getStats();
      if (stats.total > 0) {
        const expectedRate = stats.approved / stats.total;
        expect(Math.abs(stats.success_rate - expectedRate)).toBeLessThan(0.01);
      }
    });
  });

  describe('Feedback Persistence', () => {
    it('should persist feedback to JSON file', async () => {
      const workspaceDir = path.join(os.homedir(), '.openclaw', 'workspace');
      const feedbackPath = path.join(workspaceDir, '.comfyui-feedback.json');
      
      await saveFeedback('persist-test.png', 'APPROVED', 'Persistence test');
      
      expect(fs.existsSync(feedbackPath)).toBe(true);
      const content = fs.readFileSync(feedbackPath, 'utf-8');
      const data = JSON.parse(content);
      expect(data).toHaveProperty('entries');
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should append to skill-file.md', async () => {
      const workspaceDir = path.join(os.homedir(), '.openclaw', 'workspace');
      const skillPath = path.join(workspaceDir, 'skills', 'comfyui', 'skill-file.md');
      
      await saveFeedback('skill-test.png', 'APPROVED', 'Skill file test');
      
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('## Feedback Entry');
        expect(content).toContain('Status');
        expect(content).toContain('File');
      }
    });
  });
});
