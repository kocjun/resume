/**
 * 원티드 API 기반 채용 검색
 * wanted.co.kr 내부 REST API를 직접 호출
 */
import { REQUEST_TIMEOUT_MS } from '../config.js';

const REGION_KEYWORDS = ['경기', '세종', '천안', '대전', '청주'];

/**
 * 원티드 API 호출
 */
async function fetchJobs(keyword, limit = 30) {
  const url = `https://www.wanted.co.kr/api/v4/jobs?country=kr&tag_type_ids=518&job_sort=job.latest_order&locations=all&years=-1&limit=${limit}&offset=0&query=${encodeURIComponent(keyword)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Wanted API returned ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * API 응답을 내부 포맷으로 변환
 */
function mapJob(job) {
  const location = job.address?.full_location || job.address?.location || '';

  let experience = '';
  if (job.annual_from != null && job.annual_to != null) {
    experience =
      job.annual_from === 0
        ? `신입~${job.annual_to}년`
        : `${job.annual_from}~${job.annual_to}년`;
  }

  let deadline = '';
  if (job.due_time) {
    deadline = job.due_time.split('T')[0];
  } else {
    deadline = '상시채용';
  }

  return {
    title: job.position,
    company: job.company?.name || '',
    location,
    experience,
    deadline,
    reward: job.reward?.formatted_total || '',
    url: `https://www.wanted.co.kr/wd/${job.id}`,
    source: 'wanted',
  };
}

export async function scrapeWanted({ skills }) {
  try {
    const keyword = skills[0] || 'Java';

    // 기본 키워드 + 지역별 병렬 검색
    const searchTerms = [keyword, ...REGION_KEYWORDS.map((r) => `${keyword} ${r}`)];

    const results = await Promise.allSettled(
      searchTerms.map((term) => fetchJobs(term, 20))
    );

    const seen = new Set();
    const allJobs = [];

    results.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      result.value.forEach((job) => {
        if (seen.has(job.id)) return;
        seen.add(job.id);
        allJobs.push(mapJob(job));
      });
    });

    const searchUrl = `https://www.wanted.co.kr/search?query=${encodeURIComponent(keyword)}&tab=position`;

    return {
      source: 'wanted',
      displayName: '원티드',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message: allJobs.length === 0 ? '검색 결과가 없습니다' : undefined,
      jobs: allJobs,
      searchUrl,
    };
  } catch (error) {
    return {
      source: 'wanted',
      displayName: '원티드',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
