/**
 * 원티드 검색 링크 생성
 * CloudFront 봇 차단으로 인해 스크래핑 불가
 */

/**
 * 원티드 검색 링크 생성
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Object>} 검색 링크 정보
 */
export async function scrapeWanted({ skills }) {
  const keyword = skills[0] || 'Java';
  const encoded = encodeURIComponent(keyword);

  // 개발 직군으로 검색
  const url = `https://www.wanted.co.kr/wdlist/518?country=kr&job_sort=job.latest_order&query=${encoded}`;

  return {
    source: 'wanted',
    displayName: '원티드',
    status: 'link_only',
    message: 'CloudFront 봇 차단으로 스크래핑 제한 - 검색 링크 제공',
    jobs: [],
    searchUrl: url,
  };
}
