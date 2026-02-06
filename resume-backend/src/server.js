import { buildApp } from './app.js';
import { connectDB, setupDatabaseEventListeners } from './config/database.js';
import { validateEnv, setEnvDefaults } from './config/env.js';

/**
 * 서버 시작
 */
async function startServer() {
  try {
    // 환경 변수 기본값 설정
    setEnvDefaults();

    // 환경 변수 검증
    validateEnv();

    // MongoDB 연결
    await connectDB();
    setupDatabaseEventListeners();

    // Fastify 앱 빌드
    const app = await buildApp();

    // 서버 시작
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';

    await app.listen({ port, host });

    console.log(`
🚀 Server is running!
📍 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health check: http://localhost:${port}/health
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 서버 시작
startServer();
