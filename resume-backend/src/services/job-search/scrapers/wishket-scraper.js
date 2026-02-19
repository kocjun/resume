/**
 * 위시캣 웹 스크래핑
 * Cheerio를 사용한 HTML 파싱
 * 프리랜서/외주 플랫폼 — 예산, 기간, 근무방식 등 추가 필드 처리
 */
import * as cheerio from 'cheerio';
import { REQUEST_TIMEOUT_MS } from '../config.js';

/**
 * 위시캣에서 프로젝트 목록 스크래핑
 */
async function fetchProjects(keyword) {
  const url = `https://www.wishket.com/project/?keyword=${encodeURIComponent(keyword)}`;

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
    throw new Error(`Wishket returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs = [];

  $('.project-info-box').each((_, elem) => {
    try {
      const $elem = $(elem);
      const titleElem = $elem.find('.project-link');
      const title = titleElem.find('p').text().trim();
      const relativeUrl = titleElem.attr('href');
      const jobUrl = relativeUrl
        ? `https://www.wishket.com${relativeUrl}`
        : '';

      // 예산, 기간 (project-core-info 영역)
      const budget = $elem.find('.budget').text().trim();
      const duration = $elem.find('.term').text().trim();

      // 프로젝트 유형 (기간제/외주)
      const workType = $elem.find('.project-type-mark').text().trim();

      // 근무 위치
      const location = $elem.find('.location-data').text().trim();

      // 기술 태그
      const skills = [];
      $elem.find('.skill-chip').each((__, tag) => {
        const skill = $(tag).text().trim();
        if (skill) skills.push(skill);
      });

      if (title && jobUrl) {
        jobs.push({
          title,
          company: '위시캣 프로젝트',
          location,
          budget: budget || undefined,
          duration: duration || undefined,
          workType: workType || undefined,
          techStacks: skills,
          url: jobUrl,
          source: 'wishket',
        });
      }
    } catch (err) {
      // 개별 항목 파싱 실패는 무시
    }
  });

  return jobs;
}

/**
 * 위시캣에서 프로젝트 검색
 */
export async function scrapeWishket({ skills }) {
  try {
    const keyword = skills[0] || 'Java';

    const allJobs = await fetchProjects(keyword);

    const searchUrl = `https://www.wishket.com/project/?keyword=${encodeURIComponent(keyword)}`;

    return {
      source: 'wishket',
      displayName: '위시캣',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message: allJobs.length === 0 ? '검색 결과가 없습니다' : undefined,
      jobs: allJobs,
      searchUrl,
    };
  } catch (error) {
    return {
      source: 'wishket',
      displayName: '위시캣',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
