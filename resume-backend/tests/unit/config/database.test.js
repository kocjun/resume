import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../../src/config/database.js';
import { setupTestDB, teardownTestDB } from '../../setup.js';

describe('Database Connection', () => {
  beforeAll(async () => {
    await setupTestDB();
  }, 30000); // 30초 타임아웃 (MongoDB Memory Server 시작 시간)

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
    await teardownTestDB();
  });

  test('should connect to MongoDB successfully', async () => {
    await connectDB();

    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  }, 10000);

  test('should disconnect from MongoDB successfully', async () => {
    await disconnectDB();

    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
  });

  test('should handle connection errors gracefully', async () => {
    // 잘못된 URI로 연결 시도
    const originalUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test';

    await expect(connectDB()).rejects.toThrow();

    // 원래 URI로 복원
    process.env.MONGODB_URI = originalUri;
  }, 10000);
});
