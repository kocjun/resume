/**
 * 점핏 웹 스크래핑 (Puppeteer)
 * 여러 지역을 하나의 브라우저에서 탭으로 병렬 검색
 */
import puppeteer from 'puppeteer';
import { REQUEST_TIMEOUT_MS } from '../config.js';

// 검색 대상 지역 키워드
const REGION_KEYWORDS = ['경기', '세종', '천안', '대전', '청주'];

/**
 * 단일 페이지에서 공고 추출
 */
async function extractJobs(page) {
  return page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('a[href*="/position/"]');

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const url = href.startsWith('http')
        ? href
        : `https://www.jumpit.co.kr${href}`;

      let title = '';
      let company = '';

      const titleElem =
        link.querySelector('[class*="title"]') ||
        link.querySelector('[class*="Title"]') ||
        link.querySelector('h2') ||
        link.querySelector('h3') ||
        link.querySelector('strong');

      if (titleElem) {
        title = titleElem.textContent.trim();
      } else {
        const fullText = link.textContent.trim();
        const lines = fullText.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          title = lines[0].trim();
        }
      }

      const companyElem =
        link.querySelector('[class*="company"]') ||
        link.querySelector('[class*="Company"]') ||
        link.querySelector('[class*="corp"]');
      if (companyElem) {
        company = companyElem.textContent.trim();
      }

      if (title && title.length > 5 && title.length < 200) {
        const exists = results.some((r) => r.url === url);
        if (!exists) {
          results.push({ title, company, url });
        }
      }
    });

    return results.slice(0, 30);
  });
}

export async function scrapeJumpit({ skills }) {
  let browser;
  try {
    const keyword = skills[0] || 'Java';

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    // 여러 지역을 탭으로 병렬 검색
    const pages = await Promise.all(
      REGION_KEYWORDS.map(async (region) => {
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
          } else {
            req.continue();
          }
        });

        const searchText = `${keyword} ${region}`;
        const url = `https://www.jumpit.co.kr/positions?keyword=${encodeURIComponent(searchText)}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: REQUEST_TIMEOUT_MS });
        return { page, region };
      })
    );

    // 각 탭에서 공고 추출
    const seen = new Set();
    const allJobs = [];

    for (const { page, region } of pages) {
      try {
        const jobs = await extractJobs(page);
        jobs.forEach((job) => {
          if (!seen.has(job.url)) {
            seen.add(job.url);
            allJobs.push({
              ...job,
              location: region,
              experience: '',
              deadline: '',
              source: 'jumpit',
            });
          }
        });
      } catch (err) {
        // 개별 지역 실패는 무시
      }
    }

    await browser.close();

    const searchUrl = `https://www.jumpit.co.kr/positions?keyword=${encodeURIComponent(keyword)}`;

    return {
      source: 'jumpit',
      displayName: '점핏',
      status: allJobs.length > 0 ? 'ok' : 'error',
      message: allJobs.length === 0 ? '검색 결과가 없거나 페이지 구조가 변경됨' : undefined,
      jobs: allJobs,
      searchUrl,
    };
  } catch (error) {
    if (browser) await browser.close();
    return {
      source: 'jumpit',
      displayName: '점핏',
      status: 'error',
      message: error.message,
      jobs: [],
    };
  }
}
