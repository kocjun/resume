/**
 * 채용 검색 오케스트레이터
 * 웹 스크래핑 후 백엔드 필터링 방식
 */
import { scrapeSaramin } from './scrapers/saramin-scraper.js';
import { scrapeWanted } from './scrapers/wanted-scraper.js';
import { scrapeJobKorea } from './scrapers/jobkorea-scraper.js';
import { scrapeJumpit } from './scrapers/jumpit-scraper.js';
import { generateLinkedInLinks } from './link-generators.js';
import { filterJobs } from './job-filter.js';
import { LOCATIONS, DEFAULT_SKILLS, CACHE_TTL_MS } from './config.js';

const cache = new Map();

function getCacheKey(skills, locations) {
  return JSON.stringify({
    skills: [...skills].sort(),
    locations: locations.map((l) => l.name).sort(),
  });
}

/**
 * 모든 사이트를 병렬 스크래핑
 * @param {Object} options
 * @param {string[]} options.skills - 검색 키워드 (스킬 목록)
 * @param {Array} options.locations - 근무 희망지 목록
 * @param {Object} options.analysis - 이력서 분석 결과
 * @returns {Promise<Object>} 통합 검색 결과
 */
export async function searchAllSites({ skills, locations, analysis } = {}) {
  const effectiveSkills = skills?.length ? skills : DEFAULT_SKILLS;
  const effectiveLocations = locations?.length ? locations : LOCATIONS;

  // 캐시 확인
  const cacheKey = getCacheKey(effectiveSkills, effectiveLocations);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const params = {
    skills: effectiveSkills,
    locations: effectiveLocations,
    analysis,
  };

  // 모든 사이트 병렬 스크래핑
  const results = await Promise.allSettled([
    scrapeSaramin(params),
    scrapeWanted(params),
    scrapeJobKorea(params),
    scrapeJumpit(params),
    Promise.resolve(generateLinkedInLinks(params)), // 링크드인은 링크만
  ]);

  const sourceNames = ['saramin', 'wanted', 'jobkorea', 'jumpit', 'linkedin'];
  const displayNames = ['사람인', '원티드', '잡코리아', '점핏', 'LinkedIn'];

  const sites = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      const siteData = result.value;

      // 링크드인은 필터링 안 함 (link_only)
      if (siteData.status === 'link_only') {
        return siteData;
      }

      // 스크래핑한 공고 필터링
      if (siteData.jobs?.length > 0 && analysis) {
        const filtered = filterJobs(siteData.jobs, analysis, 20);
        return {
          ...siteData,
          jobs: filtered,
          totalScraped: siteData.jobs.length,
          filteredCount: filtered.length,
        };
      }

      return siteData;
    }

    return {
      source: sourceNames[i],
      displayName: displayNames[i],
      status: 'error',
      message: result.reason?.message || 'Unknown error',
      jobs: [],
    };
  });

  // 전체 사이트에서 공고 수집
  const allJobs = [];
  sites.forEach((site) => {
    if (site.jobs && site.jobs.length > 0) {
      site.jobs.forEach((job) => {
        allJobs.push({
          ...job,
          sourceName: site.displayName,
        });
      });
    }
  });

  // 지역별로 분류 후 각 지역에서 상위 공고 추출 (모든 지역 보장)
  const regionDefs = [
    { key: '판교', match: (t) => t.includes('판교') || t.includes('분당') },
    { key: '세종', match: (t) => t.includes('세종') },
    { key: '천안', match: (t) => t.includes('천안') },
    { key: '대전청주', match: (t) => t.includes('대전') || t.includes('청주') },
    { key: '경기', match: (t) => t.includes('경기') || t.includes('화성') || t.includes('기흥') || t.includes('용인') || t.includes('수원') },
  ];

  const topMatches = [];
  const usedUrls = new Set();

  // 각 지역에서 상위 공고 추출 (지역당 최대 10개)
  regionDefs.forEach((region) => {
    const regionJobs = allJobs
      .filter((job) => {
        const text = ((job.location || '') + ' ' + (job.title || '')).toLowerCase();
        return region.match(text) && !usedUrls.has(job.url);
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    regionJobs.forEach((job) => {
      usedUrls.add(job.url);
      topMatches.push(job);
    });
  });

  // 매칭 점수 기준 내림차순 정렬
  topMatches.sort((a, b) => b.matchScore - a.matchScore);

  const response = {
    sites,
    topMatches, // 상위 10개 추가
    searchedAt: new Date().toISOString(),
    skillsUsed: effectiveSkills,
    locationsUsed: effectiveLocations.map((l) => l.name),
  };

  // 캐시 저장
  cache.set(cacheKey, { data: response, timestamp: Date.now() });

  // 캐시 크기 제한
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    )[0];
    cache.delete(oldest[0]);
  }

  return { ...response, cached: false };
}
