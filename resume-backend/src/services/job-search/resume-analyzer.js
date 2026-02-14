/**
 * 이력서 데이터 분석 및 검색 조건 자동 추출
 */

/**
 * 경력 기간을 계산하여 연차 추출
 * @param {Array} experience - 경력 목록
 * @returns {number} 총 경력 연차
 */
function calculateYearsOfExperience(experience) {
  if (!experience?.length) return 0;

  const periods = experience.map((exp) => {
    const match = exp.period?.match(/(\d{4})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})/);
    if (!match) return 0;

    const [, startYear, startMonth, endYear, endMonth] = match;
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1);
    const end = new Date(parseInt(endYear), parseInt(endMonth) - 1);
    const months = (end - start) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0, months / 12);
  });

  return Math.round(periods.reduce((sum, years) => sum + years, 0));
}

/**
 * 경력 연차 기반 직급 레벨 결정
 * @param {number} years - 경력 연차
 * @returns {string} 직급 레벨
 */
function determineCareerLevel(years) {
  if (years >= 15) return 'senior'; // 시니어/리드급
  if (years >= 10) return 'senior'; // 시니어
  if (years >= 5) return 'mid'; // 중급
  if (years >= 3) return 'junior-mid'; // 주니어-중급
  return 'junior'; // 주니어
}

/**
 * 기술 스택 빈도 분석하여 주력/보조 기술 분류
 * @param {Array} experience - 경력 목록
 * @param {Array} skills - 스킬 목록
 * @returns {Object} 주력/보조/관심 기술
 */
function analyzeTechStack(experience, skills) {
  const techFrequency = new Map();

  // 경력에서 기술 스택 빈도 계산
  experience?.forEach((exp) => {
    exp.techStack?.forEach((tech) => {
      techFrequency.set(tech, (techFrequency.get(tech) || 0) + 1);
    });
  });

  // 스킬 목록에서 추가
  skills?.forEach((skillCategory) => {
    skillCategory.items?.forEach((item) => {
      if (!techFrequency.has(item)) {
        techFrequency.set(item, 0.5); // 경력에 없는 스킬은 낮은 가중치
      }
    });
  });

  // 빈도순 정렬
  const sorted = [...techFrequency.entries()].sort((a, b) => b[1] - a[1]);

  // 상위 5개 주력, 다음 5개 보조, 나머지 관심 기술
  return {
    primary: sorted.slice(0, 5).map(([tech]) => tech), // 주력 기술
    secondary: sorted.slice(5, 10).map(([tech]) => tech), // 보조 기술
    interest: sorted.slice(10, 15).map(([tech]) => tech), // 관심 기술
  };
}

/**
 * 최근 포지션 기반 선호 직무 추출
 * @param {Array} experience - 경력 목록
 * @returns {Array} 선호 직무 키워드
 */
function extractPreferredRoles(experience) {
  if (!experience?.length) return [];

  // 최근 3개 프로젝트의 포지션 분석
  const recentExperience = experience.slice(0, 3);
  const roles = new Set();

  recentExperience.forEach((exp) => {
    const position = exp.position?.toLowerCase() || '';
    const project = exp.project?.toLowerCase() || '';
    const description = exp.description?.toLowerCase() || '';

    // 키워드 매칭
    if (position.includes('프리랜서') || position.includes('차장')) {
      roles.add('시니어 개발자');
    }
    if (
      description.includes('설계') ||
      description.includes('아키텍처') ||
      description.includes('구조')
    ) {
      roles.add('아키텍트');
    }
    if (description.includes('백엔드') || description.includes('api')) {
      roles.add('백엔드 개발자');
    }
    if (description.includes('풀스택') || description.includes('full')) {
      roles.add('풀스택 개발자');
    }
    if (project.includes('si') || description.includes('프로젝트')) {
      roles.add('프로젝트 개발자');
    }
  });

  return [...roles];
}

/**
 * 이력서 전체 분석하여 검색 조건 추출
 * @param {Object} resume - 이력서 데이터
 * @returns {Object} 분석된 검색 조건
 */
export function analyzeResume(resume) {
  if (!resume) {
    return {
      yearsOfExperience: 0,
      careerLevel: 'junior',
      techStack: { primary: [], secondary: [], interest: [] },
      preferredRoles: [],
      summary: '이력서 데이터 없음',
    };
  }

  const years = calculateYearsOfExperience(resume.experience);
  const careerLevel = determineCareerLevel(years);
  const techStack = analyzeTechStack(resume.experience, resume.skills);
  const preferredRoles = extractPreferredRoles(resume.experience);

  return {
    yearsOfExperience: years,
    careerLevel,
    careerLevelKorean:
      careerLevel === 'senior'
        ? '시니어/리드급'
        : careerLevel === 'mid'
          ? '중급'
          : '주니어',
    techStack,
    preferredRoles,
    summary: `${years}년차 ${preferredRoles[0] || '개발자'} (${techStack.primary.slice(0, 3).join(', ')})`,
  };
}

/**
 * 분석 결과 기반 검색 키워드 생성
 * @param {Object} analysis - 분석 결과
 * @returns {Array} 최적화된 검색 키워드
 */
export function generateSearchKeywords(analysis) {
  const keywords = [];

  // 주력 기술 우선
  keywords.push(...analysis.techStack.primary.slice(0, 3));

  // 경력 레벨이 시니어면 관련 키워드 추가
  if (analysis.careerLevel === 'senior') {
    keywords.push('시니어', 'Senior', 'Lead');
  }

  // 선호 직무
  if (analysis.preferredRoles.length > 0) {
    keywords.push(analysis.preferredRoles[0]);
  }

  return keywords.filter((k, i, arr) => arr.indexOf(k) === i); // 중복 제거
}
