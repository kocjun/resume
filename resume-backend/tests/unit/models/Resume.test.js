import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Resume from '../../../src/models/Resume.js';
import User from '../../../src/models/User.js';
import { setupTestDB, teardownTestDB } from '../../setup.js';

describe('Resume Model', () => {
  let testUserId;

  beforeAll(async () => {
    await setupTestDB();
    await mongoose.connect(process.env.MONGODB_URI);

    // 테스트용 사용자 생성
    const user = new User({
      email: 'resume@example.com',
      password: 'password123',
    });
    const savedUser = await user.save();
    testUserId = savedUser._id;
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    await teardownTestDB();
  });

  beforeEach(async () => {
    // 각 테스트 전에 Resume 컬렉션 비우기
    await Resume.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid resume', async () => {
      const validResume = {
        userId: testUserId,
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

      const resume = new Resume(validResume);
      const savedResume = await resume.save();

      expect(savedResume._id).toBeDefined();
      expect(savedResume.userId.toString()).toBe(testUserId.toString());
      expect(savedResume.profile.name).toBe(validResume.profile.name);
      expect(savedResume.skills).toHaveLength(2);
      expect(savedResume.experience).toHaveLength(1);
      expect(savedResume.education).toHaveLength(1);
      expect(savedResume.certifications).toHaveLength(1);
      expect(savedResume.createdAt).toBeDefined();
      expect(savedResume.updatedAt).toBeDefined();
    });

    test('should require userId field', async () => {
      const resumeWithoutUserId = new Resume({
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
      });

      await expect(resumeWithoutUserId.save()).rejects.toThrow();
    });

    test('should enforce unique userId', async () => {
      const resumeData = {
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
      };

      await new Resume(resumeData).save();

      const duplicateResume = new Resume(resumeData);
      await expect(duplicateResume.save()).rejects.toThrow();
    });

    test('should have default empty arrays for optional fields', async () => {
      const minimalResume = new Resume({
        userId: testUserId,
        profile: {
          name: '미니멀',
          role: 'Developer',
          email: 'minimal@example.com',
        },
      });

      const savedResume = await minimalResume.save();

      expect(savedResume.skills).toEqual([]);
      expect(savedResume.experience).toEqual([]);
      expect(savedResume.education).toEqual([]);
      expect(savedResume.certifications).toEqual([]);
    });
  });

  describe('Profile Schema', () => {
    test('should require profile.name field', async () => {
      const resumeWithoutName = new Resume({
        userId: testUserId,
        profile: {
          role: 'Developer',
          email: 'test@example.com',
        },
      });

      await expect(resumeWithoutName.save()).rejects.toThrow();
    });

    test('should require profile.role field', async () => {
      const resumeWithoutRole = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          email: 'test@example.com',
        },
      });

      await expect(resumeWithoutRole.save()).rejects.toThrow();
    });

    test('should require profile.email field', async () => {
      const resumeWithoutEmail = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
        },
      });

      await expect(resumeWithoutEmail.save()).rejects.toThrow();
    });

    test('should allow optional profile fields', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
          // phone, address, summary는 선택 필드
        },
      });

      const savedResume = await resume.save();

      expect(savedResume.profile.phone).toBeUndefined();
      expect(savedResume.profile.address).toBeUndefined();
      expect(savedResume.profile.summary).toBeUndefined();
    });
  });

  describe('Skills Schema', () => {
    test('should validate skills structure', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
        skills: [
          {
            category: 'Backend',
            items: ['Java', 'Node.js'],
          },
        ],
      });

      const savedResume = await resume.save();

      expect(savedResume.skills[0].category).toBe('Backend');
      expect(savedResume.skills[0].items).toEqual(['Java', 'Node.js']);
    });
  });

  describe('Experience Schema', () => {
    test('should validate experience structure', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
        experience: [
          {
            company: '테스트 회사',
            period: '2023.01 ~ 현재',
            project: '프로젝트',
            description: '설명',
            techStack: ['Java'],
          },
        ],
      });

      const savedResume = await resume.save();

      expect(savedResume.experience[0]._id).toBeDefined(); // 서브 문서 _id 생성 확인
      expect(savedResume.experience[0].company).toBe('테스트 회사');
    });

    test('should require experience.company field', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
        experience: [
          {
            period: '2023.01 ~ 현재',
            project: '프로젝트',
          },
        ],
      });

      await expect(resume.save()).rejects.toThrow();
    });
  });

  describe('Population', () => {
    test('should populate userId with User data', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: {
          name: '테스트',
          role: 'Developer',
          email: 'test@example.com',
        },
      });

      await resume.save();

      const populatedResume = await Resume.findOne({ userId: testUserId }).populate('userId');

      expect(populatedResume.userId.email).toBe('resume@example.com');
    });
  });
});
