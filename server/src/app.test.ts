import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { monthRange } from './data/index.js';

describe('GET /api/clients', () => {
  it('serves the client tree with a month for every value', async () => {
    const res = await request(createApp()).get('/api/clients').expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.months).toHaveLength(12);
    expect(res.body.months[0]).toBe('2024-02');
    expect(res.body.months[11]).toBe('2025-01');
    expect(res.body.company.name).toBe('Company');
    expect(res.body.company.branches.map((b: { name: string }) => b.name)).toEqual([
      'Branch 1',
      'Branch 2',
      'Branch 3',
    ]);
  });

  it('simulates failures only when allowed', async () => {
    await request(createApp()).get('/api/clients?fail=1').expect(200);

    const res = await request(createApp({ allowSimulation: true }))
      .get('/api/clients?fail=1')
      .expect(500);
    expect(res.body).toEqual({
      error: { code: 'SIMULATED_FAILURE', message: 'Simulated server error' },
    });
  });

  it('returns JSON 404s for unknown API routes', async () => {
    const res = await request(createApp()).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('monthRange', () => {
  it('rolls over year boundaries', () => {
    expect(monthRange('2024-11', 3)).toEqual(['2024-11', '2024-12', '2025-01']);
  });
});
