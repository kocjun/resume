import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { buildApp } from '../../src/app.js';
import User from '../../src/models/User.js';
import { setupTestDB, teardownTestDB } from '../setup.js';

describe('Authentication API', () => {
  let app;

  beforeAll(async () => {
    await setupTestDB();
    await mongoose.connect(process.env.MONGODB_URI);
    app = await buildApp({ logger: false });
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await mongoose.disconnect();
    await teardownTestDB();
  });

  beforeEach(async () => {
    // 각 테스트 전에 User 컬렉션 비우기
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: newUser,
      });

      expect(response.statusCode).toBe(201);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('message');
      expect(payload).toHaveProperty('userId');
      expect(payload.userId).toBeTruthy();
    });

    test('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // 첫 번째 사용자 생성
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      // 중복 이메일로 시도
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(409);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return 400 for invalid email', async () => {
      const invalidUser = {
        email: 'not-an-email',
        password: 'password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: invalidUser,
      });

      expect(response.statusCode).toBe(400);
    });

    test('should return 400 for missing password', async () => {
      const userWithoutPassword = {
        email: 'test@example.com',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userWithoutPassword,
      });

      expect(response.statusCode).toBe(400);
    });

    test('should not return password in response', async () => {
      const newUser = {
        email: 'secure@example.com',
        password: 'password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: newUser,
      });

      const payload = JSON.parse(response.payload);
      expect(payload).not.toHaveProperty('password');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'loginuser@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // 테스트용 사용자 생성
      await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: testUser,
      });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: testUser,
      });

      expect(response.statusCode).toBe(200);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('token');
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('email', testUser.email);
      expect(payload.token).toBeTruthy();
    });

    test('should return 401 for incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return 401 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return 400 for missing credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: testUser.email,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should return valid JWT token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: testUser,
      });

      const payload = JSON.parse(response.payload);
      const token = payload.token;

      // JWT 토큰 형식 확인 (3 parts separated by dots)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // JWT 디코딩 테스트
      const decoded = app.jwt.decode(token);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email', testUser.email);
    });
  });
});
