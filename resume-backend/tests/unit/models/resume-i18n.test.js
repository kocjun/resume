import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import Resume from '../../../src/models/Resume.js';
import User from '../../../src/models/User.js';
import { setupTestDB, teardownTestDB } from '../../setup.js';

describe('Resume Model — LocalizedString i18n 지원', () => {
  let testUserId;

  beforeAll(async () => {
    await setupTestDB();
    await mongoose.connect(process.env.MONGODB_URI);

    const user = new User({
      email: 'i18n@example.com',
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
    await Resume.deleteMany({});
  });

  // 최소 프로필 헬퍼
  const baseProfile = (overrides = {}) => ({
    name: '테스트',
    role: 'Developer',
    email: 'test@example.com',
    ...overrides,
  });

  describe('profile 필드 LocalizedString', () => {
    test('name — plain String 수용 (하위호환)', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ name: '홍길동' }),
      });
      const saved = await resume.save();
      expect(saved.profile.name).toBe('홍길동');
    });

    test('name — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ name: { ko: '홍길동', en: 'Hong Gil-dong' } }),
      });
      const saved = await resume.save();
      expect(saved.profile.name).toEqual({ ko: '홍길동', en: 'Hong Gil-dong' });
    });

    test('role — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ role: { ko: '풀스택 개발자', en: 'Full Stack Developer' } }),
      });
      const saved = await resume.save();
      expect(saved.profile.role).toEqual({ ko: '풀스택 개발자', en: 'Full Stack Developer' });
    });

    test('summary — plain String 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ summary: '15년 경력의 개발자입니다.' }),
      });
      const saved = await resume.save();
      expect(saved.profile.summary).toBe('15년 경력의 개발자입니다.');
    });

    test('summary — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({
          summary: { ko: '15년 경력의 개발자입니다.', en: '15 years of experience.' },
        }),
      });
      const saved = await resume.save();
      expect(saved.profile.summary).toEqual({
        ko: '15년 경력의 개발자입니다.',
        en: '15 years of experience.',
      });
    });

    test('address — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ address: { ko: '서울시 강남구', en: 'Gangnam-gu, Seoul' } }),
      });
      const saved = await resume.save();
      expect(saved.profile.address).toEqual({ ko: '서울시 강남구', en: 'Gangnam-gu, Seoul' });
    });
  });

  describe('experience 필드 LocalizedString', () => {
    test('company — plain String 수용 (하위호환)', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        experience: [{ company: '테스트 회사', period: '2023.01 ~ 현재', project: '프로젝트' }],
      });
      const saved = await resume.save();
      expect(saved.experience[0].company).toBe('테스트 회사');
    });

    test('company — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        experience: [
          {
            company: { ko: '테스트 회사', en: 'Test Corp' },
            period: '2023.01 ~ 현재',
            project: { ko: '테스트 프로젝트', en: 'Test Project' },
          },
        ],
      });
      const saved = await resume.save();
      expect(saved.experience[0].company).toEqual({ ko: '테스트 회사', en: 'Test Corp' });
      expect(saved.experience[0].project).toEqual({ ko: '테스트 프로젝트', en: 'Test Project' });
    });

    test('position — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        experience: [
          {
            company: '테스트 회사',
            period: '2023.01 ~ 현재',
            project: '프로젝트',
            position: { ko: '차장', en: 'Senior Manager' },
          },
        ],
      });
      const saved = await resume.save();
      expect(saved.experience[0].position).toEqual({ ko: '차장', en: 'Senior Manager' });
    });

    test('description — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        experience: [
          {
            company: '테스트 회사',
            period: '2023.01 ~ 현재',
            project: '프로젝트',
            description: { ko: '프로젝트 설명', en: 'Project description' },
          },
        ],
      });
      const saved = await resume.save();
      expect(saved.experience[0].description).toEqual({
        ko: '프로젝트 설명',
        en: 'Project description',
      });
    });
  });

  describe('education 필드 LocalizedString', () => {
    test('school — plain String 수용 (하위호환)', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        education: [{ school: '충남대학교' }],
      });
      const saved = await resume.save();
      expect(saved.education[0].school).toBe('충남대학교');
    });

    test('school — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        education: [{ school: { ko: '충남대학교', en: 'Chungnam National University' } }],
      });
      const saved = await resume.save();
      expect(saved.education[0].school).toEqual({
        ko: '충남대학교',
        en: 'Chungnam National University',
      });
    });

    test('major — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        education: [
          {
            school: '충남대학교',
            major: { ko: '컴퓨터공학과', en: 'Computer Science' },
          },
        ],
      });
      const saved = await resume.save();
      expect(saved.education[0].major).toEqual({ ko: '컴퓨터공학과', en: 'Computer Science' });
    });
  });

  describe('certifications 필드 LocalizedString', () => {
    test('name — plain String 수용 (하위호환)', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        certifications: [{ name: '정보처리기사' }],
      });
      const saved = await resume.save();
      expect(saved.certifications[0].name).toBe('정보처리기사');
    });

    test('name — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        certifications: [
          { name: { ko: '정보처리기사', en: 'Engineer Information Processing' } },
        ],
      });
      const saved = await resume.save();
      expect(saved.certifications[0].name).toEqual({
        ko: '정보처리기사',
        en: 'Engineer Information Processing',
      });
    });
  });

  describe('skills 필드 LocalizedString', () => {
    test('category — plain String 수용 (하위호환)', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        skills: [{ category: 'Backend', items: ['Node.js'] }],
      });
      const saved = await resume.save();
      expect(saved.skills[0].category).toBe('Backend');
    });

    test('category — { ko, en } 객체 수용', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        skills: [
          { category: { ko: '백엔드', en: 'Backend' }, items: ['Node.js', 'Java'] },
        ],
      });
      const saved = await resume.save();
      expect(saved.skills[0].category).toEqual({ ko: '백엔드', en: 'Backend' });
      expect(saved.skills[0].items).toEqual(['Node.js', 'Java']);
    });
  });

  describe('언어 무관 필드 유지', () => {
    test('email, phone은 여전히 String으로 저장', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile({ phone: '010-1234-5678' }),
      });
      const saved = await resume.save();
      expect(saved.profile.email).toBe('test@example.com');
      expect(saved.profile.phone).toBe('010-1234-5678');
    });

    test('experience.period, techStack[]은 String으로 유지', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        experience: [
          {
            company: '테스트 회사',
            period: '2023.01 ~ 현재',
            project: '프로젝트',
            techStack: ['Java', 'Spring Boot'],
          },
        ],
      });
      const saved = await resume.save();
      expect(saved.experience[0].period).toBe('2023.01 ~ 현재');
      expect(saved.experience[0].techStack).toEqual(['Java', 'Spring Boot']);
    });

    test('education.period, certifications.date는 String으로 유지', async () => {
      const resume = new Resume({
        userId: testUserId,
        profile: baseProfile(),
        education: [{ school: '충남대학교', period: '2009년 02월 졸업' }],
        certifications: [{ name: '정보처리기사', date: '2011.09' }],
      });
      const saved = await resume.save();
      expect(saved.education[0].period).toBe('2009년 02월 졸업');
      expect(saved.certifications[0].date).toBe('2011.09');
    });
  });
});
