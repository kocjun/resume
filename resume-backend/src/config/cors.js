/**
 * CORS 설정
 * Cross-Origin Resource Sharing 정책
 */

/**
 * CORS 옵션
 */
export const corsOptions = {
  // 허용할 origin 목록
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

    // CORS_ALLOWED_ORIGINS 환경변수로 추가 origin 허용 (콤마 구분)
    if (process.env.CORS_ALLOWED_ORIGINS) {
      process.env.CORS_ALLOWED_ORIGINS.split(',').forEach(o => allowedOrigins.push(o.trim()));
    }

    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // origin이 없는 경우 (같은 origin 요청)
    if (!origin) {
      callback(null, true);
      return;
    }

    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },

  // 자격 증명 허용 (쿠키, Authorization 헤더 등)
  credentials: true,

  // 허용할 HTTP 메서드
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // 허용할 헤더
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],

  // 노출할 헤더
  exposedHeaders: ['X-Total-Count'],

  // Preflight 요청 캐시 시간 (초)
  maxAge: 600, // 10분
};
