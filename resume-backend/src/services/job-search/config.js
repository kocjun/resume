/**
 * 채용 검색 설정 상수
 * 실제 검증된 사이트 파라미터 사용
 */

export const LOCATIONS = [
  { name: '경기도 성남시', saraminCode: '102000', wantedName: 'seoul.gangnam' }, // 경기도
  { name: '화성시', saraminCode: '102000', wantedName: 'all' }, // 경기도
  { name: '기흥구', saraminCode: '102000', wantedName: 'all' }, // 경기도 용인
  { name: '세종시', saraminCode: '118000', wantedName: 'sejong' }, // 세종
  { name: '천안시', saraminCode: '115000', wantedName: 'cheonan' }, // 충남
  { name: '대전', saraminCode: '105000', wantedName: 'daejeon' }, // 대전
];

export const DEFAULT_SKILLS = [
  'Java', 'Spring Boot', 'Vue.js', 'JPA', 'Node.js',
  'React', 'JavaScript', 'TypeScript',
  'Oracle', 'MySQL', 'Docker', 'AWS',
];

export const EXPERIENCE_YEARS = 15;

export const CACHE_TTL_MS =
  (parseInt(process.env.JOB_SEARCH_CACHE_TTL_MINUTES) || 30) * 60 * 1000;

export const REQUEST_TIMEOUT_MS = 10000;
