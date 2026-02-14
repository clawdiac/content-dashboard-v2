import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app, httpServer } from '../index.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
let server;

beforeAll(() => {
  server = httpServer.listen(3001);
});

afterAll(() => {
  server.close();
});

describe('Images API', () => {
  it('should return images array', async () => {
    const response = await fetch(`http://localhost:3001/api/images`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('images');
    expect(Array.isArray(data.images)).toBe(true);
  });

  it('should filter by status', async () => {
    const response = await fetch(`http://localhost:3001/api/images?status=APPROVED`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.images)).toBe(true);
  });

  it('should reject invalid status', async () => {
    const response = await fetch(`http://localhost:3001/api/images?status=INVALID`);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should support pagination', async () => {
    const response = await fetch(`http://localhost:3001/api/images?limit=10&offset=0`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('offset');
  });

  it('should filter by date range', async () => {
    const from = '2026-01-01';
    const to = '2026-12-31';
    const response = await fetch(`http://localhost:3001/api/images?from=${from}&to=${to}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.images)).toBe(true);
  });
});

describe('Feedback API', () => {
  it('should reject feedback without status', async () => {
    const response = await fetch(`http://localhost:3001/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'test.png' }),
    });
    expect(response.status).toBe(400);
  });

  it('should reject invalid status', async () => {
    const response = await fetch(`http://localhost:3001/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'test.png',
        status: 'INVALID',
      }),
    });
    expect(response.status).toBe(400);
  });

  it('should accept valid feedback', async () => {
    const response = await fetch(`http://localhost:3001/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'test.png',
        status: 'APPROVED',
        feedback_text: 'Great!',
      }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });
});

describe('Stats API', () => {
  it('should return stats', async () => {
    const response = await fetch(`http://localhost:3001/api/stats`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('approved');
    expect(data).toHaveProperty('rejected');
    expect(data).toHaveProperty('success_rate');
  });

  it('should have valid stats structure', async () => {
    const response = await fetch(`http://localhost:3001/api/stats`);
    const data = await response.json();
    expect(typeof data.total).toBe('number');
    expect(typeof data.approved).toBe('number');
    expect(typeof data.rejected).toBe('number');
    expect(typeof data.success_rate).toBe('number');
    expect(data.success_rate).toBeGreaterThanOrEqual(0);
    expect(data.success_rate).toBeLessThanOrEqual(1);
  });
});
