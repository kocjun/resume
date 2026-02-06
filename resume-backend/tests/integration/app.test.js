import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { buildApp } from '../../src/app.js';
import { setupTestDB, teardownTestDB } from '../setup.js';

describe('Fastify App', () => {
  let app;

  beforeAll(async () => {
    await setupTestDB();
    app = await buildApp({ logger: false }); // 테스트 시 로깅 비활성화
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await teardownTestDB();
  });

  test('should have health check endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('status', 'ok');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('uptime');
  });

  test('should have CORS enabled', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'GET',
      },
    });

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('should return 404 for unknown routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/unknown-route',
    });

    expect(response.statusCode).toBe(404);
  });
});
