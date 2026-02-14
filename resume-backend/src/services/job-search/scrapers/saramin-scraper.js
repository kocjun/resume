/**
 * 사람인 웹 스크래핑
 * Cheerio를 사용한 HTML 파싱
 * 여러 지역을 병렬로 검색
 */
import * as cheerio from 'cheerio';
import { REQUEST_TIMEOUT_MS } from '../config.js';

// 검색 대상 지역 코드
const REGION_CODES = [
  { code: '102000', name: '경기도' },
  { code: '118000', name: '세종시' },
  { code: '115000', name: '충남(천안)' },
  { code: '105000', name: '대전' },
  { code: '110000', name: '충북(청주)' },
];

/**
 * 단일 지역에서 채용 정보 스크래핑
 */
async function scrapeRegion(keyword, regionCode) {
  const encoded = encodeURIComponent(keyword);
  const url = `https://www.saramin.co.kr/zf_user/search?searchword=${encoded}&loc_mcd=${regionCode}`;

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
    throw new Error(`Saramin returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs = [];

  $('.item_recruit').each((i, elem) => {
    try {
      const $elem = $(elem);
      const titleElem = $elem.find('.job_tit a');
      const title = titleElem.text().trim();
      const relativeUrl = titleElem.attr('href');
      const jobUrl = relativeUrl
        ? `https://www.saramin.co.kr${relativeUrl}`
        : '';
      const company = $elem.find('.corp_name a').text().trim();
      const location = $elem.find('.job_condition span:first').text().trim();
      const experience = $elem.find('.job_condition span').eq(1).text().trim();
      const deadline = $elem.find('.job_date .date').text().trim();

      if (title && jobUrl) {
        jobs.push({
          title,
          company,
          location,
          experience,
          url: jobUrl,
          deadline,
          source: 'saramin',
        });
      }
    } catch (err) {
      // 개별 항목 파싱 실패는 무시
    }
  });

  return { jobs, searchUrl: url };
}

/**
 * 사람인에서 채용 정보 스크래핑 (전체 지역)
 */
export async function scrapeSaramin({ skills }) {
  try {
    const keyword = skills[0] || 'Java';

    // 모든 지역을 병렬로 검색
    const results = await Promise.allSettled(
      REGION_CODES.map((region) => scrapeRegion(keyword, region.code))
    );

    // URL 기준 중복 제거하며 결과 합산
    const seen = new Set();
    const allJobs = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.jobs) {
        result.value.jobs.forEach((job) => {
          if (!seen.has(job.url)) {
            seen.add(job.url);
            allJobs.push(job);
          }
        });
      }
    });

    const firstUrl = `https://www.saramin.co.kr/zf_user/search?searchword=${encodeURIComponent(keyword)}`;

    return {
      source: 'saramin',
      displayName: '사람인',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message: allJobs.length === 0 ? '검색 결과 없음' : undefined,
      jobs: allJobs,
      searchUrl: firstUrl,
    };
  } catch (error) {
    return {
      source: 'saramin',
      displayName: '사람인',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
