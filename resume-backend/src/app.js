import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler.js';
import { corsOptions } from './config/cors.js';

// 환경 변수 로드
dotenv.config();

/**
 * Fastify 앱 빌드
 */
export async function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    ...opts,
  });

  // 보안 헤더 플러그인 등록 (Helmet)
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS 플러그인 등록
  await app.register(cors, corsOptions);

  // JWT 플러그인 등록
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  });

  // 글로벌 에러 핸들러 등록
  await app.register(errorHandler);

  // 헬스 체크 엔드포인트
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 인증 라우트 등록
  const authRoutes = await import('./routes/auth.routes.js');
  await app.register(authRoutes.default, { prefix: '/api/auth' });

  // 이력서 라우트 등록
  const resumeRoutes = await import('./routes/resume.routes.js');
  await app.register(resumeRoutes.default, { prefix: '/api/resume' });

  return app;
}
