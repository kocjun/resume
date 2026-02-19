/**
 * LinkedIn Guest API 기반 채용 검색
 * Cheerio를 사용한 HTML 파싱
 */
import * as cheerio from 'cheerio';
import { REQUEST_TIMEOUT_MS } from '../config.js';

const LOCATIONS = [
  { query: 'Pangyo', ko: '경기 성남시 판교' },
  { query: 'Gyeonggi-do', ko: '경기' },
  { query: 'Sejong', ko: '세종' },
  { query: 'Cheonan', ko: '천안' },
  { query: 'Daejeon', ko: '대전' },
];

// 영문 location → 한글 매핑
const LOCATION_MAP = {
  pangyo: '판교', bundang: '분당', seongnam: '성남',
  gyeonggi: '경기', suwon: '수원', yongin: '용인', hwaseong: '화성',
  sejong: '세종', cheonan: '천안', daejeon: '대전', cheongju: '청주',
  seoul: '서울', incheon: '인천', busan: '부산', daegu: '대구',
};

function translateLocation(engLocation) {
  if (!engLocation) return '';
  const lower = engLocation.toLowerCase();
  for (const [eng, ko] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(eng)) return ko;
  }
  return engLocation;
}

/**
 * LinkedIn Guest API에서 채용 정보 스크래핑
 */
async function fetchJobs(keyword, location) {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=0`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs = [];

  $('.base-search-card').each((i, elem) => {
    try {
      const $elem = $(elem);
      const title = $elem.find('.base-search-card__title').text().trim();
      const company = $elem.find('.base-search-card__subtitle a').text().trim();
      const jobLocation = $elem.find('.job-search-card__location').text().trim();
      const postedDate = $elem.find('time.job-search-card__listdate').attr('datetime') || '';
      const jobUrl = $elem.find('.base-card__full-link').attr('href') || '';

      if (title && jobUrl) {
        jobs.push({
          title,
          company,
          location: translateLocation(jobLocation) || jobLocation,
          postedDate,
          techStacks: [keyword],
          url: jobUrl.split('?')[0],
          source: 'linkedin',
        });
      }
    } catch (err) {
      // 개별 항목 파싱 실패는 무시
    }
  });

  return jobs;
}

/**
 * LinkedIn에서 채용 정보 스크래핑 (전체 지역)
 */
export async function scrapeLinkedIn({ skills }) {
  try {
    const keyword = skills[0] || 'Java';

    const results = await Promise.allSettled(
      LOCATIONS.map((loc) => fetchJobs(keyword, loc.query))
    );

    const seen = new Set();
    const allJobs = [];

    results.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      result.value.forEach((job) => {
        if (!seen.has(job.url)) {
          seen.add(job.url);
          allJobs.push(job);
        }
      });
    });

    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=South+Korea`;

    return {
      source: 'linkedin',
      displayName: 'LinkedIn',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message: allJobs.length === 0 ? '검색 결과가 없습니다' : undefined,
      jobs: allJobs,
      searchUrl,
    };
  } catch (error) {
    return {
      source: 'linkedin',
      displayName: 'LinkedIn',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
