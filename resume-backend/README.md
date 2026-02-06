# Resume Backend API

Node.js + Fastify + MongoDB 기반 이력서 관리 REST API 서버

## 📋 프로젝트 개요

이 프로젝트는 사용자가 웹에서 이력서를 생성하고 관리할 수 있는 백엔드 API를 제공합니다. JWT 인증을 사용하며, 사용자별로 하나의 이력서를 생성하고 프로필, 스킬, 경력, 학력, 자격증 정보를 관리할 수 있습니다.

## 🛠️ 기술 스택

- **런타임**: Node.js 20+
- **웹 프레임워크**: Fastify 5.2.0
- **데이터베이스**: MongoDB 7.0+
- **ODM**: Mongoose 8.9.3
- **인증**: JWT (@fastify/jwt 9.0.1)
- **보안**: bcrypt 5.1.1, @fastify/helmet
- **테스트**: Jest 29.7.0, MongoDB Memory Server

## 📁 프로젝트 구조

\`\`\`
resume-backend/
├── src/
│   ├── app.js                      # Fastify 앱 초기화
│   ├── server.js                   # HTTP 서버 진입점
│   ├── config/
│   │   ├── database.js             # MongoDB 연결 설정
│   │   ├── cors.js                 # CORS 정책
│   │   └── env.js                  # 환경 변수 검증
│   ├── models/
│   │   ├── User.js                 # User 스키마
│   │   └── Resume.js               # Resume 스키마
│   ├── routes/
│   │   ├── auth.routes.js          # 인증 라우트
│   │   └── resume.routes.js        # 이력서 CRUD 라우트
│   ├── controllers/
│   │   ├── auth.controller.js      # 인증 로직
│   │   └── resume.controller.js    # 이력서 CRUD 로직
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT 검증
│   │   └── errorHandler.js         # 글로벌 에러 핸들러
│   └── schemas/
│       └── auth.schema.js          # 요청/응답 검증 스키마
├── tests/                          # 테스트 파일
├── scripts/
│   └── seed.js                     # 데이터 시딩 스크립트
├── .env                            # 환경 변수
└── package.json
\`\`\`

## 🚀 시작하기

### 1. 환경 요구사항

- Node.js 20 이상
- MongoDB 7.0 이상 (또는 Docker)

### 2. 설치

\`\`\`bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 필요한 값들을 설정하세요
\`\`\`

### 3. 환경 변수 설정

\`.env\` 파일에 다음 변수들을 설정하세요:

\`\`\`bash
# 서버
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://localhost:27017/resume-db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Bcrypt
BCRYPT_SALT_ROUNDS=10
\`\`\`

**중요**: 프로덕션 환경에서는 반드시 강력한 \`JWT_SECRET\`을 사용하세요 (최소 32자 이상).

### 4. MongoDB 실행

#### Docker 사용 (권장)
\`\`\`bash
docker-compose up -d
\`\`\`

#### 로컬 MongoDB
\`\`\`bash
mongod
\`\`\`

### 5. 데이터 시딩 (선택사항)

테스트용 사용자와 이력서 데이터를 생성합니다:

\`\`\`bash
npm run seed
\`\`\`

기본 로그인 정보 (환경 변수로 변경 가능):
- Email: `SEED_USER_EMAIL` 환경 변수 또는 기본값
- Password: `SEED_USER_PASSWORD` 환경 변수 또는 기본값

### 6. 서버 실행

\`\`\`bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
\`\`\`

서버가 실행되면 다음 주소에서 접근할 수 있습니다:
- API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📚 API 엔드포인트

### 인증 API (Public)

#### 회원가입
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
\`\`\`

#### 로그인
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}

Response:
{
  "token": "eyJhbGc...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
\`\`\`

### 이력서 API (JWT 인증 필요)

모든 이력서 API는 \`Authorization: Bearer <token>\` 헤더가 필요합니다.

#### 이력서 조회
\`\`\`http
GET /api/resume
Authorization: Bearer <token>
\`\`\`

#### 프로필 업데이트
\`\`\`http
PUT /api/resume/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "홍길동",
  "role": "Senior Full Stack Developer",
  "email": "hong@example.com"
}
\`\`\`

#### 경력 추가
\`\`\`http
POST /api/resume/experience
Authorization: Bearer <token>
Content-Type: application/json

{
  "company": "ABC 주식회사",
  "period": "2020.01 ~ 2023.12",
  "position": "Senior Developer",
  "project": "전자상거래 플랫폼 개발",
  "description": "백엔드 API 개발 및 데이터베이스 설계",
  "techStack": ["Node.js", "MongoDB", "Redis"]
}
\`\`\`

전체 API 목록은 서버 실행 후 Swagger 문서를 참고하세요.

## 🧪 테스트

\`\`\`bash
# 전체 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
\`\`\`

## 🔒 보안

- **비밀번호 해싱**: bcrypt (salt rounds: 10)
- **JWT 인증**: 7일 만료
- **CORS**: 프론트엔드 URL만 허용
- **보안 헤더**: Helmet으로 보안 헤더 자동 설정
- **입력 검증**: Fastify JSON Schema 검증
- **환경 변수 검증**: 서버 시작 시 필수 값 확인

## 🛠️ 개발 스크립트

\`\`\`bash
# 개발 서버 (nodemon)
npm run dev

# 프로덕션 서버
npm start

# 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# 데이터 시딩
npm run seed

# 데이터 초기화
npm run seed:clear
\`\`\`

## 🐛 트러블슈팅

### MongoDB 연결 실패
- MongoDB가 실행 중인지 확인하세요
- \`MONGODB_URI\` 환경 변수가 올바른지 확인하세요
- Docker를 사용하는 경우: \`docker-compose up -d\`

### JWT 토큰 에러
- \`JWT_SECRET\`이 설정되어 있는지 확인하세요
- 토큰이 만료되지 않았는지 확인하세요 (기본 7일)

### CORS 에러
- \`FRONTEND_URL\` 환경 변수가 프론트엔드 주소와 일치하는지 확인하세요
- 개발 환경에서는 모든 origin이 허용됩니다

## 📄 라이선스

MIT License
