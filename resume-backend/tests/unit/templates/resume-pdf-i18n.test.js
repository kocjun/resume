import { renderResumePDF } from '../../../src/templates/resume-pdf.js';

const makeResume = (overrides = {}) => ({
  profile: {
    name: { ko: '홍길동', en: 'Gil-dong Hong' },
    role: { ko: '백엔드 개발자', en: 'Backend Developer' },
    email: 'hong@example.com',
    phone: '010-1234-5678',
    address: { ko: '서울', en: 'Seoul' },
    summary: { ko: '열정적인 개발자입니다.', en: 'A passionate developer.' },
  },
  skills: [
    { category: { ko: '언어', en: 'Languages' }, items: ['JavaScript', 'Python'] },
  ],
  experience: [
    {
      company: { ko: '(주)테스트', en: 'Test Corp' },
      position: { ko: '개발자', en: 'Developer' },
      project: { ko: '프로젝트 A', en: 'Project A' },
      description: { ko: '백엔드 개발', en: 'Backend development' },
      period: '2022.01 - 2023.01',
      techStack: ['Node.js'],
    },
  ],
  education: [
    {
      school: { ko: '한국대학교', en: 'Korea University' },
      major: { ko: '컴퓨터공학', en: 'Computer Science' },
      period: '2015 - 2019',
    },
  ],
  certifications: [
    { name: { ko: '정보처리기사', en: 'Engineer Information Processing' }, date: '2020.05' },
  ],
  personalProjects: [
    {
      name: 'MyProject',
      link: 'https://github.com/example',
      description: { ko: '개인 프로젝트 설명', en: 'Personal project description' },
    },
  ],
  ...overrides,
});

describe('renderResumePDF i18n', () => {
  describe('lang=ko', () => {
    it('한글 콘텐츠를 출력한다', () => {
      const html = renderResumePDF(makeResume(), 'ko');
      expect(html).toContain('홍길동');
      expect(html).toContain('백엔드 개발자');
      expect(html).toContain('서울');
      expect(html).toContain('열정적인 개발자입니다.');
      expect(html).toContain('언어');
      expect(html).toContain('(주)테스트');
      expect(html).toContain('백엔드 개발');
      expect(html).toContain('한국대학교');
      expect(html).toContain('정보처리기사');
      expect(html).toContain('개인 프로젝트 설명');
    });

    it('한글 섹션 제목을 출력한다', () => {
      const html = renderResumePDF(makeResume(), 'ko');
      expect(html).toContain('경력사항');
      expect(html).toContain('스킬');
      expect(html).toContain('학력');
      expect(html).toContain('자격증');
      expect(html).toContain('개인 프로젝트');
    });

    it('html lang 속성이 ko이다', () => {
      const html = renderResumePDF(makeResume(), 'ko');
      expect(html).toContain('<html lang="ko">');
    });
  });

  describe('lang=en', () => {
    it('영문 콘텐츠를 출력한다', () => {
      const html = renderResumePDF(makeResume(), 'en');
      expect(html).toContain('Gil-dong Hong');
      expect(html).toContain('Backend Developer');
      expect(html).toContain('Seoul');
      expect(html).toContain('A passionate developer.');
      expect(html).toContain('Languages');
      expect(html).toContain('Test Corp');
      expect(html).toContain('Backend development');
      expect(html).toContain('Korea University');
      expect(html).toContain('Engineer Information Processing');
      expect(html).toContain('Personal project description');
    });

    it('영문 섹션 제목을 출력한다', () => {
      const html = renderResumePDF(makeResume(), 'en');
      expect(html).toContain('Experience');
      expect(html).toContain('Skills');
      expect(html).toContain('Education');
      expect(html).toContain('Certifications');
      expect(html).toContain('Personal Projects');
    });

    it('html lang 속성이 en이다', () => {
      const html = renderResumePDF(makeResume(), 'en');
      expect(html).toContain('<html lang="en">');
    });
  });

  describe('lang 미지정 (기본값 ko)', () => {
    it('lang 없이 호출하면 ko 콘텐츠를 출력한다', () => {
      const html = renderResumePDF(makeResume());
      expect(html).toContain('홍길동');
      expect(html).toContain('경력사항');
      expect(html).toContain('<html lang="ko">');
    });
  });

  describe('en 값이 빈 경우 ko fallback', () => {
    it('en 값이 없으면 ko 값으로 대체한다', () => {
      const resume = makeResume();
      resume.profile.name = { ko: '홍길동', en: '' };
      resume.experience[0].company = { ko: '(주)테스트', en: '' };
      const html = renderResumePDF(resume, 'en');
      expect(html).toContain('홍길동');
      expect(html).toContain('(주)테스트');
    });
  });

  describe('plain string (하위호환)', () => {
    it('localized 객체가 아닌 plain string 필드는 그대로 출력된다', () => {
      const resume = makeResume();
      resume.profile.name = '이순신';
      resume.profile.role = 'Full Stack Developer';
      resume.experience[0].company = 'ACME Corp';
      resume.experience[0].description = 'Built systems';

      const htmlKo = renderResumePDF(resume, 'ko');
      expect(htmlKo).toContain('이순신');
      expect(htmlKo).toContain('Full Stack Developer');
      expect(htmlKo).toContain('ACME Corp');
      expect(htmlKo).toContain('Built systems');

      const htmlEn = renderResumePDF(resume, 'en');
      expect(htmlEn).toContain('이순신');
      expect(htmlEn).toContain('Full Stack Developer');
      expect(htmlEn).toContain('ACME Corp');
      expect(htmlEn).toContain('Built systems');
    });
  });
});
