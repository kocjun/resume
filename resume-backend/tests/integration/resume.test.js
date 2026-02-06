import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { buildApp } from '../../src/app.js';
import User from '../../src/models/User.js';
import Resume from '../../src/models/Resume.js';
import { setupTestDB, teardownTestDB } from '../setup.js';

describe('Resume API', () => {
  let app;
  let testUser;
  let authToken;
  let testResume;

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
    // 각 테스트 전에 컬렉션 비우기
    await User.deleteMany({});
    await Resume.deleteMany({});

    // 테스트용 사용자 생성 및 로그인
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'resume@example.com',
        password: 'password123',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'resume@example.com',
        password: 'password123',
      },
    });

    const loginData = JSON.parse(loginResponse.payload);
    authToken = loginData.token;
    testUser = {
      userId: loginData.userId,
      email: loginData.email,
    };

    // 테스트용 이력서 데이터
    testResume = {
      userId: testUser.userId,
      profile: {
        name: '전영창',
        role: 'Full Stack Developer',
        email: 'test@example.com',
        phone: '010-1234-5678',
        address: '서울시 강남구',
        summary: '15년 경력의 풀스택 개발자입니다.',
      },
      skills: [
        {
          category: 'Backend',
          items: ['Java', 'Spring Boot', 'Node.js'],
        },
        {
          category: 'Frontend',
          items: ['Vue.js', 'React'],
        },
      ],
      experience: [
        {
          company: '테스트 회사',
          period: '2023.01 ~ 현재',
          position: '차장',
          project: '테스트 프로젝트',
          description: '프로젝트 설명',
          techStack: ['Java', 'Spring Boot'],
        },
      ],
      education: [
        {
          school: '충남대학교',
          major: '컴퓨터공학과',
          period: '2009년 02월 졸업',
        },
      ],
      certifications: [
        {
          name: '정보처리기사',
          date: '2011.09',
        },
      ],
    };
  });

  describe('GET /api/resume', () => {
    test('should return 401 without authentication token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/resume',
      });

      expect(response.statusCode).toBe(401);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return 404 when resume does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return resume when it exists', async () => {
      // 이력서 생성
      await new Resume(testResume).save();

      const response = await app.inject({
        method: 'GET',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('id'); // _id가 id로 변환됨
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('profile');
      expect(payload.profile.name).toBe(testResume.profile.name);
      expect(payload.skills).toHaveLength(2);
      expect(payload.experience).toHaveLength(1);
      expect(payload.education).toHaveLength(1);
      expect(payload.certifications).toHaveLength(1);
    });

    test('should return only current user resume', async () => {
      // 현재 사용자의 이력서 생성
      await new Resume(testResume).save();

      // 다른 사용자 생성
      const otherUser = await new User({
        email: 'other@example.com',
        password: 'password123',
      }).save();

      // 다른 사용자의 이력서 생성
      await new Resume({
        userId: otherUser._id,
        profile: {
          name: '다른 사용자',
          role: 'Developer',
          email: 'other@example.com',
        },
      }).save();

      // 현재 사용자로 조회
      const response = await app.inject({
        method: 'GET',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      const payload = JSON.parse(response.payload);
      expect(payload.profile.name).toBe('전영창');
      expect(payload.profile.name).not.toBe('다른 사용자');
    });
  });

  describe('POST /api/resume', () => {
    test('should return 401 without authentication token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/resume',
        payload: testResume,
      });

      expect(response.statusCode).toBe(401);
    });

    test('should create a new resume', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          profile: testResume.profile,
          skills: testResume.skills,
          experience: testResume.experience,
          education: testResume.education,
          certifications: testResume.certifications,
        },
      });

      expect(response.statusCode).toBe(201);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('message');
      expect(payload).toHaveProperty('resumeId');
    });

    test('should return 409 if resume already exists', async () => {
      // 이력서 생성
      await new Resume(testResume).save();

      // 중복 생성 시도
      const response = await app.inject({
        method: 'POST',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          profile: testResume.profile,
        },
      });

      expect(response.statusCode).toBe(409);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });

    test('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/resume',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          // profile 누락
          skills: testResume.skills,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
