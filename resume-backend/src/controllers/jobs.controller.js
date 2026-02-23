import { searchAllSites } from '../services/job-search/index.js';
import { analyzeResume, generateSearchKeywords } from '../services/job-search/resume-analyzer.js';
import Resume from '../models/Resume.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resumeDataFallback = JSON.parse(
  readFileSync(join(__dirname, '../../../resume-web/src/data.json'), 'utf-8')
);

/**
 * 채용 정보 검색
 * GET /api/jobs/search
 */
export async function searchJobs(request, reply) {
  try {
    let resumeData = null;

    // 인증된 사용자: DB에서 이력서 조회
    if (request.user?.userId) {
      const userId = request.user.userId;
      if (userId === 'env-admin') {
        // env-admin은 첫 번째 이력서 사용
        resumeData = await Resume.findOne().lean();
      } else {
        resumeData = await Resume.findOne({ userId }).lean();
      }
    }

    // 이력서가 없으면 fallback 데이터 사용
    if (!resumeData) {
      resumeData = resumeDataFallback;
    }

    // 이력서 분석
    const analysis = analyzeResume(resumeData);

    // 분석 결과 기반 최적화된 키워드 생성
    const optimizedKeywords = generateSearchKeywords(analysis);

    // 쿼리 파라미터로 스킬 오버라이드 가능
    let searchSkills = optimizedKeywords;
    if (request.query.skills) {
      searchSkills = request.query.skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // 검색 실행
    const result = await searchAllSites({
      skills: searchSkills,
      analysis, // 분석 결과 전달
    });

    // 분석 정보를 응답에 포함
    result.resumeAnalysis = {
      yearsOfExperience: analysis.yearsOfExperience,
      careerLevel: analysis.careerLevelKorean,
      primaryTech: analysis.techStack.primary,
      preferredRoles: analysis.preferredRoles,
      summary: analysis.summary,
    };

    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Job search failed' });
  }
}
