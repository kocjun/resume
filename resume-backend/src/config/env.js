/**
 * 환경 변수 검증 및 관리
 */

/**
 * 필수 환경 변수 목록
 */
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

/**
 * 환경 변수 검증
 * 서버 시작 시 필수 환경 변수가 모두 설정되어 있는지 확인
 */
export function validateEnv() {
  const missingVars = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file.'
    );
  }

  // JWT_SECRET 강도 검증 (프로덕션 환경)
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long in production'
      );
    }
    if (jwtSecret.includes('change') || jwtSecret.includes('secret')) {
      throw new Error(
        'JWT_SECRET appears to be a placeholder. Please use a strong secret in production.'
      );
    }
  }

  console.log('✅ Environment variables validated');
}

/**
 * 환경 변수 기본값 설정
 */
export function setEnvDefaults() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.PORT = process.env.PORT || '3001';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '10';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
}
