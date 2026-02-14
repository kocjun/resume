/**
 * 스크래핑한 채용 정보 필터링
 * 이력서 분석 결과 기반으로 관련성 높은 공고만 선별
 */

/**
 * 제목/설명에서 경력 요구사항 추출
 * @param {string} text
 * @returns {number|null} 최소 요구 경력 (년)
 */
function extractRequiredExperience(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // 신입 키워드
  if (
    lowerText.includes('신입') ||
    lowerText.includes('junior') ||
    lowerText.includes('entry')
  ) {
    return 0;
  }

  // 경력 년수 패턴 매칭
  const patterns = [
    /(\d+)년\s*이상/,
    /(\d+)년\s*~\s*(\d+)년/,
    /(\d+)\+\s*years?/i,
    /(\d+)\s*years?\s*\+/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // 시니어 키워드
  if (lowerText.includes('시니어') || lowerText.includes('senior')) {
    return 5; // 시니어 = 최소 5년
  }

  return null;
}

/**
 * 텍스트에서 기술 스택 매칭 점수 계산
 * @param {string} text
 * @param {Array} skills - 사용자 스킬 목록
 * @returns {number} 매칭 점수 (0-100)
 */
function calculateSkillMatchScore(text, skills) {
  if (!text || !skills?.length) return 0;

  const lowerText = text.toLowerCase();
  let matchedCount = 0;

  skills.forEach((skill) => {
    const lowerSkill = skill.toLowerCase();
    if (lowerText.includes(lowerSkill)) {
      matchedCount++;
    }
  });

  return Math.min(100, (matchedCount / Math.min(skills.length, 10)) * 100);
}

/**
 * 고용 형태 감지 및 보너스 점수 계산
 * @param {string} text
 * @returns {Object} { isContract: boolean, isFreelance: boolean, bonus: number }
 */
function detectEmploymentType(text) {
  if (!text) return { isContract: false, isFreelance: false, bonus: 0 };

  const lowerText = text.toLowerCase();

  // 계약직 키워드
  const contractKeywords = [
    '계약직',
    '계약',
    'contract',
    '파견',
    '외주',
  ];

  // 프리랜서 키워드
  const freelanceKeywords = [
    '프리랜서',
    '프리랜스',
    'freelance',
    'freelancer',
    '원격',
    '재택',
    '리모트',
    'remote',
  ];

  const isContract = contractKeywords.some((keyword) =>
    lowerText.includes(keyword)
  );
  const isFreelance = freelanceKeywords.some((keyword) =>
    lowerText.includes(keyword)
  );

  // 계약직 또는 프리랜서면 보너스 점수 부여
  let bonus = 0;
  if (isContract) bonus += 30;
  if (isFreelance) bonus += 30;

  return { isContract, isFreelance, bonus };
}

/**
 * 개별 채용 공고 필터링 및 점수 계산
 * @param {Object} job - 채용 공고
 * @param {Object} analysis - 이력서 분석 결과
 * @returns {Object|null} 필터링된 공고 (점수 포함) 또는 null
 */
function filterJob(job, analysis) {
  const { title, experience } = job;
  const userYears = analysis?.yearsOfExperience || 0;
  const userSkills = analysis?.techStack?.primary || [];

  // 제목 + 경력 텍스트 합치기
  const fullText = `${title} ${experience}`.toLowerCase();

  // 1. 경력 요구사항 체크
  const requiredYears = extractRequiredExperience(fullText);
  if (requiredYears !== null) {
    // 요구 경력보다 사용자 경력이 부족하면 제외
    if (userYears < requiredYears) {
      return null;
    }

    // 오버스펙 체크: 요구 경력보다 10년 이상 많으면 감점 (과다 경력)
    if (userYears > requiredYears + 10) {
      // 시니어 공고가 아닌데 너무 경력이 많으면 제외
      if (!fullText.includes('시니어') && !fullText.includes('senior')) {
        return null;
      }
    }
  }

  // 2. 기술 스택 매칭 점수
  const skillScore = calculateSkillMatchScore(fullText, userSkills);

  // 최소 매칭 점수 미달이면 제외
  if (skillScore < 20) {
    return null;
  }

  // 3. 고용 형태 감지 (계약직, 프리랜서)
  const employmentType = detectEmploymentType(fullText);

  // 4. 최종 점수 계산
  let finalScore = skillScore;

  // 시니어 공고에 시니어 지원자면 보너스
  if (
    analysis?.careerLevel === 'senior' &&
    (fullText.includes('시니어') || fullText.includes('senior'))
  ) {
    finalScore += 20;
  }

  // 계약직/프리랜서 보너스
  finalScore += employmentType.bonus;

  return {
    ...job,
    matchScore: Math.round(Math.min(100, finalScore)),
    isContract: employmentType.isContract,
    isFreelance: employmentType.isFreelance,
  };
}

/**
 * 채용 공고 목록 필터링
 * @param {Array} jobs - 채용 공고 목록
 * @param {Object} analysis - 이력서 분석 결과
 * @param {number} limit - 최대 결과 수
 * @returns {Array} 필터링 및 정렬된 공고 목록
 */
export function filterJobs(jobs, analysis, limit = 20) {
  if (!jobs?.length) return [];

  const filtered = jobs
    .map((job) => filterJob(job, analysis))
    .filter((job) => job !== null);

  // 매칭 점수 기준 내림차순 정렬
  filtered.sort((a, b) => b.matchScore - a.matchScore);

  return filtered.slice(0, limit);
}
