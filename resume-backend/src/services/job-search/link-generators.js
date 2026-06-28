/**
 * LinkedIn 검색 링크 생성기
 * LinkedIn은 스크래핑 대신 검색 URL만 제공
 */

/**
 * LinkedIn 검색 링크 생성
 * @param {Object} params
 * @param {string[]} params.skills - 검색 키워드
 * @param {Array} params.locations - 근무 희망지
 * @returns {Object} LinkedIn 링크 정보
 */
export function generateLinkedInLinks({ skills = [], locations = [] } = {}) {
  const baseUrl = 'https://www.linkedin.com/jobs/search/';

  // 스킬 키워드를 검색어로 조합
  const keywords = skills.slice(0, 5).join(' ');

  // 지역명 추출
  const locationNames = locations.map(loc => loc.name || loc).filter(Boolean);
  const locationQuery = locationNames.length > 0 ? locationNames[0] : '대한민국';

  const searchParams = new URLSearchParams({
    keywords,
    location: locationQuery,
    f_TPR: 'r604800', // 최근 1주일
  });

  const searchUrl = `${baseUrl}?${searchParams.toString()}`;

  // 스킬별 개별 링크도 생성
  const skillLinks = skills.slice(0, 5).map(skill => ({
    skill,
    url: `${baseUrl}?${new URLSearchParams({
      keywords: skill,
      location: locationQuery,
      f_TPR: 'r604800',
    }).toString()}`,
  }));

  return {
    source: 'linkedin',
    displayName: 'LinkedIn',
    status: 'link_only',
    message: 'LinkedIn은 직접 검색을 권장합니다',
    searchUrl,
    skillLinks,
    jobs: [],
  };
}
