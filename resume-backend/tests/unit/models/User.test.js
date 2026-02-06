import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../../src/models/User.js';
import { setupTestDB, teardownTestDB } from '../../setup.js';

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDB();
    await mongoose.connect(process.env.MONGODB_URI);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await teardownTestDB();
  });

  beforeEach(async () => {
    // 각 테스트 전에 User 컬렉션 비우기
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid user', async () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User(validUser);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(validUser.email);
      expect(savedUser.password).not.toBe(validUser.password); // 비밀번호 해싱 확인
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should require email field', async () => {
      const userWithoutEmail = new User({
        password: 'password123',
      });

      await expect(userWithoutEmail.save()).rejects.toThrow();
    });

    test('should require password field', async () => {
      const userWithoutPassword = new User({
        email: 'test@example.com',
      });

      await expect(userWithoutPassword.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await new User(userData).save();

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      for (const email of invalidEmails) {
        const user = new User({ email, password: 'password123' });
        await expect(user.save()).rejects.toThrow();
      }
    });

    test('should lowercase email', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'mySecretPassword123';
      const user = new User({
        email: 'hash@example.com',
        password: plainPassword,
      });

      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt 해시 패턴
    });

    test('should not rehash password if not modified', async () => {
      const user = new User({
        email: 'nohash@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      const originalHash = savedUser.password;

      // 다른 필드 업데이트
      savedUser.email = 'newemail@example.com';
      await savedUser.save();

      expect(savedUser.password).toBe(originalHash);
    });
  });

  describe('comparePassword Method', () => {
    test('should return true for correct password', async () => {
      const plainPassword = 'correctPassword123';
      const user = new User({
        email: 'compare@example.com',
        password: plainPassword,
      });

      const savedUser = await user.save();
      const isMatch = await savedUser.comparePassword(plainPassword);

      expect(isMatch).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const user = new User({
        email: 'compare2@example.com',
        password: 'correctPassword123',
      });

      const savedUser = await user.save();
      const isMatch = await savedUser.comparePassword('wrongPassword');

      expect(isMatch).toBe(false);
    });
  });
});
