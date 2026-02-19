/**
 * 점핏 API 기반 채용 검색
 * api.jumpit.co.kr 내부 REST API를 직접 호출하여 정교한 데이터 수집
 */
import { REQUEST_TIMEOUT_MS } from '../config.js';

// 지역별 검색 키워드
const REGION_KEYWORDS = ['경기', '세종', '천안', '대전', '청주'];

/**
 * 단일 키워드로 점핏 API 호출
 */
async function fetchPositions(keyword, page = 1, limit = 30) {
  const url = `https://api.jumpit.co.kr/api/positions?sort=rsp_rate&keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Jumpit API returned ${response.status}`);
  }

  const data = await response.json();
  return data.result?.positions || [];
}

/**
 * API 응답을 내부 포맷으로 변환
 */
function mapPosition(pos) {
  const location = pos.locations?.join(', ') || '';
  const techStacks = (pos.techStacks || []).map((t) =>
    t.replace(/<[^>]*>/g, '')
  );

  let experience = '';
  if (pos.minCareer != null && pos.maxCareer != null) {
    experience =
      pos.minCareer === 0
        ? `신입~${pos.maxCareer}년`
        : `${pos.minCareer}~${pos.maxCareer}년`;
  }

  let deadline = '';
  if (pos.alwaysOpen) {
    deadline = '상시채용';
  } else if (pos.closedAt) {
    deadline = pos.closedAt.split('T')[0];
  }

  return {
    title: pos.title,
    company: pos.companyName,
    location,
    experience,
    deadline,
    techStacks,
    jobCategory: pos.jobCategory || '',
    url: `https://jumpit.saramin.co.kr/position/${pos.id}`,
    source: 'jumpit',
  };
}

export async function scrapeJumpit({ skills }) {
  try {
    const keyword = skills[0] || 'Java';

    // 모든 지역 키워드를 포함해 병렬 검색
    const searchTerms = REGION_KEYWORDS.map((r) => `${keyword} ${r}`);

    const results = await Promise.allSettled(
      searchTerms.map((term) => fetchPositions(term, 1, 30))
    );

    const seen = new Set();
    const allJobs = [];

    results.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      result.value.forEach((pos) => {
        if (seen.has(pos.id)) return;
        seen.add(pos.id);
        allJobs.push(mapPosition(pos));
      });
    });

    const searchUrl = `https://jumpit.saramin.co.kr/positions?keyword=${encodeURIComponent(keyword)}`;

    return {
      source: 'jumpit',
      displayName: '점핏',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message:
        allJobs.length === 0
          ? '검색 결과가 없습니다'
          : undefined,
      jobs: allJobs,
      searchUrl,
    };
  } catch (error) {
    return {
      source: 'jumpit',
      displayName: '점핏',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
