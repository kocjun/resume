# Synology NAS 배포 환경 구성 계획

**생성일**: 2026-02-03
**최종 수정**: 2026-02-03 (Phase 1 완료)
**범위**: Medium (4-5 phases, 10-15시간)
**담당자**: 사용자

---

## ⚠️ 중요 안내 (CRITICAL INSTRUCTIONS)

**각 Phase 완료 후 반드시 수행**:
1. ✅ 완료된 작업 체크박스 표시
2. 🧪 Quality Gate 검증 명령어 실행
3. ⚠️ 모든 Quality Gate 항목 통과 확인
4. 📅 "최종 수정" 날짜 업데이트
5. 📝 Notes 섹션에 학습 내용 기록
6. ➡️ 모든 검증 통과 후 다음 Phase 진행

⛔ **Quality Gate 실패 시 다음 Phase로 진행 금지**

---

## 📋 프로젝트 개요

### 목표
기존 개발 환경(localhost)을 Synology NAS에 Docker Compose 기반 프로덕션 환경으로 마이그레이션하여 외부에서 접근 가능한 이력서 서비스 구축

### 배경
- 현재: 매번 프론트엔드와 백엔드를 수동으로 실행
- 문제: 운영 환경에서 수동 실행 불가, 외부 접근 불가
- 해결: Docker Compose로 서비스 자동화, Nginx 리버스 프록시, SSL 적용

### 주요 요구사항
- ✅ Docker Compose로 모든 서비스 통합 관리
- ✅ Nginx로 프론트엔드 정적 파일 제공 + 리버스 프록시
- ✅ 도메인 연결 및 SSL/TLS (Let's Encrypt) 적용
- ✅ MongoDB 데이터 자동 백업
- ✅ 헬스체크 모니터링
- ✅ 로그 수집 및 관리

### 성공 기준
- [ ] 단일 `docker-compose up -d` 명령으로 전체 서비스 실행
- [ ] 외부 도메인(HTTPS)으로 이력서 사이트 접근 가능
- [ ] 로그인/이력서 편집 기능 정상 동작
- [ ] MongoDB 데이터 영속성 보장
- [ ] 자동 백업 및 모니터링 동작 확인

---

## 🏗️ 아키텍처 설계

### 현재 아키텍처 (개발 환경)
```
┌─────────────────────────────────┐
│  개발자 PC                       │
│                                  │
│  Terminal 1: npm run dev         │
│  (프론트엔드 - Vite:5173)        │
│                                  │
│  Terminal 2: npm run dev         │
│  (백엔드 - Fastify:3001)         │
│                                  │
│  MongoDB: Docker Compose         │
│  (포트 27017)                    │
└─────────────────────────────────┘
```

### 목표 아키텍처 (Synology NAS 프로덕션)
```
┌─────────────────────────────────────────────────────────────┐
│  Synology NAS (Docker Compose)                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Nginx (포트 80/443)                                      │ │
│  │ - SSL 종료 (Let's Encrypt)                              │ │
│  │ - 정적 파일 제공 (/var/www/html)                        │ │
│  │ - 리버스 프록시 (/api -> backend:3001)                  │ │
│  └──────────┬──────────────────────────────────────────────┘ │
│             │                                                  │
│  ┌──────────▼──────────────────────┐                         │
│  │ Backend (Node.js)                │                         │
│  │ - Fastify REST API               │                         │
│  │ - 포트 3001 (내부)               │                         │
│  │ - JWT 인증                       │                         │
│  └──────────┬──────────────────────┘                         │
│             │                                                  │
│  ┌──────────▼──────────────────────┐                         │
│  │ MongoDB                          │                         │
│  │ - 포트 27017 (내부)              │                         │
│  │ - 볼륨: /data/mongodb            │                         │
│  └──────────────────────────────────┘                         │
│                                                               │
│  ┌──────────────────────────────────┐                        │
│  │ 백업 스크립트 (Cron)             │                        │
│  │ - 일일 MongoDB 백업               │                        │
│  └──────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
           │
           │ HTTPS (443)
           ▼
    ┌──────────────┐
    │  외부 사용자  │
    └──────────────┘
```

### 컴포넌트 구성
| 컴포넌트 | 이미지 | 포트 | 볼륨 | 역할 |
|----------|--------|------|------|------|
| nginx | nginx:alpine | 80, 443 | ./nginx/conf.d, ./certbot | 웹서버, 리버스 프록시, SSL |
| backend | node:20-alpine | 3001 (내부) | - | REST API 서버 |
| mongodb | mongo:7.0 | 27017 (내부) | ./data/mongodb | 데이터베이스 |
| certbot | certbot/certbot | - | ./certbot | SSL 인증서 발급/갱신 |

---

## 📅 Phase 별 구현 계획

### Phase 1: Docker 이미지 및 빌드 설정 (2-3시간)
**목표**: 백엔드와 프론트엔드를 Docker 이미지로 빌드 가능하도록 Dockerfile 작성

#### Test Strategy
- **테스트 타입**: 통합 테스트 (Docker 빌드 및 실행)
- **Coverage Target**: Dockerfile 모든 단계 검증
- **Test Scenarios**:
  1. 백엔드 Docker 이미지 빌드 성공
  2. 프론트엔드 정적 파일 빌드 성공
  3. 멀티스테이지 빌드로 이미지 크기 최적화
  4. 컨테이너 실행 시 환경 변수 주입 확인

#### Tasks (TDD Workflow)
##### RED: 빌드 실패 시나리오 확인
- [x] Dockerfile 없이 `docker build` 실패 확인
- [x] 환경 변수 누락 시 빌드/실행 실패 확인

##### GREEN: Dockerfile 작성 및 빌드 성공
- [x] **백엔드 Dockerfile 작성** (`resume-backend/Dockerfile`)
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .

  FROM node:20-alpine
  WORKDIR /app
  COPY --from=builder /app .
  EXPOSE 3001
  CMD ["node", "src/server.js"]
  ```
- [x] **프론트엔드 Dockerfile 작성** (`resume-web/Dockerfile`)
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  # 빌드된 정적 파일만 추출
  FROM scratch AS artifacts
  COPY --from=builder /app/dist /dist
  ```
- [x] **백엔드 이미지 빌드 테스트**
  ```bash
  cd resume-backend
  docker build -t resume-backend:latest .
  docker run -d -p 3001:3001 \
    -e MONGODB_URI=mongodb://host.docker.internal:27017/resume-db \
    -e JWT_SECRET=test-secret \
    resume-backend:latest
  curl http://localhost:3001/health
  ```
- [x] **프론트엔드 빌드 테스트**
  ```bash
  cd resume-web
  docker build -t resume-web-builder:latest --target builder .
  docker create --name extract resume-web-builder:latest
  docker cp extract:/app/dist ./dist
  docker rm extract
  ls -la dist/
  ```

##### REFACTOR: .dockerignore 및 최적화
- [x] `.dockerignore` 파일 추가 (node_modules, .git 제외)
- [x] 빌드 캐시 활용 최적화 (COPY 순서 조정)
- [x] 이미지 크기 확인 및 불필요한 파일 제거

#### Quality Gate
- [x] ✅ 백엔드 Docker 이미지 빌드 성공 (284MB)
- [x] ✅ 프론트엔드 빌드 산출물 (dist 폴더) 생성 확인 (144KB)
- [x] ✅ 백엔드 컨테이너 실행 시 헬스체크 통과
- [x] ✅ 이미지 크기: 백엔드 284MB (적정), 프론트엔드 dist 144KB
- [x] ✅ 빌드 시간 5분 이내 (백엔드 ~10초, 프론트엔드 ~5초)
- [x] ✅ 테스트: `docker build` 에러 없이 완료

#### Dependencies
- Node.js 20+
- Docker Desktop 설치

#### Rollback Strategy
- Dockerfile 삭제 또는 기존 개발 환경으로 복귀
- Git으로 변경사항 되돌리기

---

### Phase 2: Docker Compose 통합 설정 (3-4시간)
**목표**: 모든 서비스를 단일 docker-compose.yml로 통합하여 한 번에 실행

#### Test Strategy
- **테스트 타입**: 통합 테스트 (서비스 간 연결)
- **Coverage Target**: 모든 서비스 연결 및 통신 검증
- **Test Scenarios**:
  1. `docker-compose up -d` 실행 시 모든 컨테이너 정상 시작
  2. Backend → MongoDB 연결 확인
  3. Nginx → Backend 프록시 통신 확인
  4. 프론트엔드 정적 파일 제공 확인
  5. 볼륨 마운트로 데이터 영속성 확인

#### Tasks (TDD Workflow)
##### RED: 통합 환경 없이 테스트 실패 확인
- [ ] 개별 컨테이너 실행 시 네트워크 연결 실패 확인
- [ ] 환경 변수 누락 시 서비스 시작 실패 확인

##### GREEN: Docker Compose 작성 및 서비스 통합
- [ ] **docker-compose.yml 작성** (루트 디렉토리)
  ```yaml
  version: '3.8'

  services:
    mongodb:
      image: mongo:7.0
      container_name: resume-mongodb
      restart: unless-stopped
      environment:
        MONGO_INITDB_DATABASE: resume-db
      volumes:
        - mongodb_data:/data/db
      networks:
        - resume-network
      healthcheck:
        test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
        interval: 10s
        timeout: 5s
        retries: 5

    backend:
      build: ./resume-backend
      container_name: resume-backend
      restart: unless-stopped
      depends_on:
        mongodb:
          condition: service_healthy
      environment:
        NODE_ENV: production
        PORT: 3001
        MONGODB_URI: mongodb://mongodb:27017/resume-db
        JWT_SECRET: ${JWT_SECRET}
        JWT_EXPIRES_IN: 7d
        FRONTEND_URL: https://your-domain.com
        LOG_LEVEL: info
      networks:
        - resume-network
      healthcheck:
        test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
        interval: 30s
        timeout: 10s
        retries: 3

    nginx:
      image: nginx:alpine
      container_name: resume-nginx
      restart: unless-stopped
      depends_on:
        - backend
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./resume-web/dist:/var/www/html:ro
        - ./nginx/conf.d:/etc/nginx/conf.d:ro
        - ./nginx/ssl:/etc/nginx/ssl:ro
        - ./certbot/www:/var/www/certbot:ro
        - ./certbot/conf:/etc/letsencrypt:ro
      networks:
        - resume-network

  volumes:
    mongodb_data:
      driver: local

  networks:
    resume-network:
      driver: bridge
  ```
- [ ] **환경 변수 파일 작성** (`.env.production`)
  ```bash
  JWT_SECRET=<strong-random-secret-here>
  DOMAIN=your-domain.com
  EMAIL=your-email@example.com
  ```
- [ ] **Nginx 설정 파일 작성** (`nginx/conf.d/default.conf`)
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;

      location /.well-known/acme-challenge/ {
          root /var/www/certbot;
      }

      location / {
          return 301 https://$host$request_uri;
      }
  }

  server {
      listen 443 ssl http2;
      server_name your-domain.com;

      ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

      root /var/www/html;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      location /api {
          proxy_pass http://backend:3001;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- [ ] **서비스 실행 테스트**
  ```bash
  docker-compose up -d
  docker-compose ps  # 모든 서비스 running 확인
  docker-compose logs backend  # 백엔드 로그 확인
  docker-compose logs nginx    # Nginx 로그 확인
  ```
- [ ] **연결 테스트**
  ```bash
  # MongoDB 연결 확인
  docker exec resume-backend node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch(err => console.error(err));
  "

  # 백엔드 헬스체크
  curl http://localhost:3001/health

  # Nginx 프록시 테스트
  curl http://localhost/api/health

  # 프론트엔드 정적 파일
  curl http://localhost/
  ```

##### REFACTOR: 설정 최적화
- [ ] 환경 변수 분리 (.env.production 활용)
- [ ] 헬스체크 간격 및 재시도 최적화
- [ ] Nginx 성능 튜닝 (gzip, cache 설정)
- [ ] 로그 로테이션 설정

#### Quality Gate
- [ ] ✅ `docker-compose up -d` 실행 시 모든 컨테이너 정상 시작
- [ ] ✅ `docker-compose ps` 모든 서비스 상태 "Up"
- [ ] ✅ MongoDB 연결 성공 로그 확인
- [ ] ✅ Backend 헬스체크 통과 (200 OK)
- [ ] ✅ Nginx → Backend 프록시 통신 성공
- [ ] ✅ 프론트엔드 페이지 로드 확인 (http://localhost/)
- [ ] ✅ 컨테이너 재시작 시 데이터 유지 확인
- [ ] ✅ 테스트: 전체 스택 연동 확인

#### Dependencies
- Phase 1 완료 (Dockerfile 존재)
- Docker Compose 설치

#### Rollback Strategy
- `docker-compose down -v` 실행
- docker-compose.yml 삭제 또는 이전 버전으로 복구

---

### Phase 3: SSL/TLS 인증서 및 보안 설정 (2-3시간)
**목표**: Let's Encrypt로 SSL 인증서 발급 및 HTTPS 적용, 보안 설정 강화

#### Test Strategy
- **테스트 타입**: 보안 검증 테스트
- **Coverage Target**: SSL, HTTPS, CORS, Rate Limiting
- **Test Scenarios**:
  1. HTTP → HTTPS 리다이렉트 확인
  2. SSL 인증서 유효성 검증
  3. CORS 헤더 확인
  4. Rate Limiting 동작 확인
  5. 보안 헤더 (HSTS, CSP) 확인

#### Tasks (TDD Workflow)
##### RED: 보안 설정 전 취약점 확인
- [ ] HTTP 접근 시 리다이렉트 없음 확인
- [ ] SSL 인증서 없이 HTTPS 접근 실패 확인
- [ ] CORS 설정 없이 크로스 오리진 요청 실패 확인

##### GREEN: SSL 인증서 발급 및 보안 설정
- [ ] **Certbot 초기 설정 스크립트** (`scripts/init-letsencrypt.sh`)
  ```bash
  #!/bin/bash

  domains=(your-domain.com www.your-domain.com)
  email="your-email@example.com"
  staging=0  # 테스트 시 1, 운영 시 0

  # Nginx 임시 설정으로 시작
  docker-compose up -d nginx

  # Certbot으로 인증서 발급
  docker-compose run --rm certbot certonly \
    --webroot --webroot-path /var/www/certbot \
    --email $email \
    --agree-tos \
    --no-eff-email \
    $([ $staging != 0 ] && echo "--staging") \
    -d ${domains[0]} -d ${domains[1]}

  # Nginx 재시작
  docker-compose restart nginx
  ```
- [ ] **Certbot 서비스 추가** (docker-compose.yml)
  ```yaml
  certbot:
    image: certbot/certbot
    container_name: resume-certbot
    volumes:
      - ./certbot/www:/var/www/certbot:rw
      - ./certbot/conf:/etc/letsencrypt:rw
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
  ```
- [ ] **Nginx SSL 설정 강화** (`nginx/conf.d/default.conf` 업데이트)
  ```nginx
  # SSL 설정
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # 보안 헤더
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  # Rate Limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

  location /api {
      limit_req zone=api_limit burst=20 nodelay;
      proxy_pass http://backend:3001;
      # ... 기존 프록시 설정
  }
  ```
- [ ] **백엔드 CORS 설정 업데이트** (`resume-backend/src/config/cors.js`)
  ```javascript
  export const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://your-domain.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
  ```
- [ ] **SSL 인증서 발급 실행**
  ```bash
  chmod +x scripts/init-letsencrypt.sh
  ./scripts/init-letsencrypt.sh
  ```
- [ ] **HTTPS 접근 테스트**
  ```bash
  curl -I https://your-domain.com
  curl https://your-domain.com/api/health

  # SSL 인증서 확인
  echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
  ```

##### REFACTOR: 보안 설정 최적화
- [ ] SSL Labs 테스트 (https://www.ssllabs.com/ssltest/)로 A+ 등급 확인
- [ ] CORS preflight 요청 최적화
- [ ] Rate Limiting 임계값 조정
- [ ] CSP(Content Security Policy) 정책 추가

#### Quality Gate
- [ ] ✅ HTTP → HTTPS 자동 리다이렉트 동작
- [ ] ✅ SSL 인증서 유효성 확인 (만료일 3개월 이후)
- [ ] ✅ HTTPS 접근 시 경고 없음
- [ ] ✅ SSL Labs 테스트 A 등급 이상
- [ ] ✅ CORS 헤더 확인 (`Access-Control-Allow-Origin`)
- [ ] ✅ Rate Limiting 동작 확인 (연속 요청 시 429 응답)
- [ ] ✅ 보안 헤더 확인 (HSTS, X-Frame-Options 등)
- [ ] ✅ 테스트: 보안 검증 통과

#### Dependencies
- Phase 2 완료 (Docker Compose 실행 중)
- 도메인 DNS 설정 완료 (A 레코드 → NAS IP)
- NAS 포트 포워딩 설정 (80, 443)

#### Rollback Strategy
- HTTP만 사용하도록 Nginx 설정 복구
- certbot 볼륨 삭제 후 재시도

---

### Phase 4: 데이터 백업 및 모니터링 (2-3시간)
**목표**: MongoDB 자동 백업, 헬스체크 모니터링, 로그 수집 시스템 구축

#### Test Strategy
- **테스트 타입**: 운영 테스트 (백업, 복구, 모니터링)
- **Coverage Target**: 백업/복구 프로세스, 헬스체크, 로그 수집
- **Test Scenarios**:
  1. MongoDB 백업 스크립트 실행 성공
  2. 백업 파일에서 데이터 복구 확인
  3. 헬스체크 실패 시 알림 발송
  4. 로그 파일 로테이션 동작 확인
  5. 디스크 사용량 모니터링

#### Tasks (TDD Workflow)
##### RED: 백업 및 모니터링 없이 운영 리스크 확인
- [ ] 백업 없이 데이터 손실 시나리오 시뮬레이션
- [ ] 서비스 장애 시 알림 없음 확인
- [ ] 로그 파일 무제한 증가 확인

##### GREEN: 백업 및 모니터링 시스템 구축
- [ ] **MongoDB 백업 스크립트** (`scripts/backup-mongodb.sh`)
  ```bash
  #!/bin/bash

  BACKUP_DIR="/volume1/docker/resume/backups"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_NAME="resume-db-$TIMESTAMP"

  # MongoDB 백업 실행
  docker exec resume-mongodb mongodump \
    --db resume-db \
    --out /tmp/$BACKUP_NAME

  # 백업 파일 추출
  docker cp resume-mongodb:/tmp/$BACKUP_NAME $BACKUP_DIR/

  # 압축
  cd $BACKUP_DIR
  tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
  rm -rf $BACKUP_NAME

  # 7일 이상 된 백업 삭제
  find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

  echo "Backup completed: $BACKUP_NAME.tar.gz"
  ```
- [ ] **백업 복구 스크립트** (`scripts/restore-mongodb.sh`)
  ```bash
  #!/bin/bash

  BACKUP_FILE=$1

  if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-mongodb.sh <backup-file.tar.gz>"
    exit 1
  fi

  # 압축 해제
  tar -xzf $BACKUP_FILE
  BACKUP_DIR=$(basename $BACKUP_FILE .tar.gz)

  # MongoDB로 복구
  docker cp $BACKUP_DIR resume-mongodb:/tmp/
  docker exec resume-mongodb mongorestore \
    --db resume-db \
    /tmp/$BACKUP_DIR/resume-db

  echo "Restore completed from: $BACKUP_FILE"
  ```
- [ ] **Synology Task Scheduler 설정**
  - DSM → 제어판 → 작업 스케줄러 → 생성
  - 사용자 정의 스크립트: `bash /volume1/docker/resume/scripts/backup-mongodb.sh`
  - 스케줄: 매일 새벽 2시
- [ ] **헬스체크 모니터링 스크립트** (`scripts/healthcheck-monitor.sh`)
  ```bash
  #!/bin/bash

  WEBHOOK_URL="https://your-slack-webhook-url"  # Slack, Discord 등

  # 서비스 상태 확인
  services=("resume-nginx" "resume-backend" "resume-mongodb")

  for service in "${services[@]}"; do
    status=$(docker inspect -f '{{.State.Status}}' $service 2>/dev/null)

    if [ "$status" != "running" ]; then
      message="🚨 서비스 다운 알림: $service ($status)"
      curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        $WEBHOOK_URL
    fi
  done

  # API 헬스체크
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
  if [ "$response" != "200" ]; then
    message="🚨 API 헬스체크 실패: HTTP $response"
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$message\"}" \
      $WEBHOOK_URL
  fi
  ```
- [ ] **Docker Compose 로그 설정 추가**
  ```yaml
  services:
    backend:
      logging:
        driver: "json-file"
        options:
          max-size: "10m"
          max-file: "3"

    nginx:
      logging:
        driver: "json-file"
        options:
          max-size: "10m"
          max-file: "3"
  ```
- [ ] **백업 테스트**
  ```bash
  # 백업 실행
  bash scripts/backup-mongodb.sh
  ls -lh backups/

  # 복구 테스트 (테스트 환경에서)
  bash scripts/restore-mongodb.sh backups/resume-db-YYYYMMDD_HHMMSS.tar.gz
  ```
- [ ] **모니터링 테스트**
  ```bash
  # 헬스체크 실행
  bash scripts/healthcheck-monitor.sh

  # 서비스 중지 후 알림 확인
  docker stop resume-backend
  bash scripts/healthcheck-monitor.sh
  docker start resume-backend
  ```

##### REFACTOR: 운영 스크립트 최적화
- [ ] 백업 스크립트 에러 핸들링 추가
- [ ] 로그 중앙 집중화 (선택사항: ELK Stack, Loki)
- [ ] 디스크 사용량 모니터링 추가
- [ ] 알림 채널 다양화 (이메일, SMS)

#### Quality Gate
- [ ] ✅ 백업 스크립트 실행 시 .tar.gz 파일 생성 확인
- [ ] ✅ 백업 파일에서 데이터 복구 성공 확인
- [ ] ✅ 7일 이상 된 백업 자동 삭제 확인
- [ ] ✅ 헬스체크 스크립트 실행 시 정상 상태 확인
- [ ] ✅ 서비스 다운 시 알림 발송 확인
- [ ] ✅ 로그 파일 크기 제한 동작 (10MB 초과 시 로테이션)
- [ ] ✅ Synology Task Scheduler 작업 등록 확인
- [ ] ✅ 테스트: 백업/복구 프로세스 검증

#### Dependencies
- Phase 3 완료 (운영 환경 구동 중)
- Slack/Discord Webhook URL (선택사항)

#### Rollback Strategy
- Task Scheduler 작업 비활성화
- 백업 스크립트 제거

---

### Phase 5: 배포 자동화 및 문서화 (2-3시간)
**목표**: 배포 프로세스 자동화, 운영 문서 작성, 최종 검증

#### Test Strategy
- **테스트 타입**: E2E 테스트 (전체 시스템)
- **Coverage Target**: 배포 프로세스, 사용자 시나리오
- **Test Scenarios**:
  1. 단일 명령으로 전체 스택 배포 성공
  2. 코드 업데이트 후 무중단 배포 확인
  3. 프론트엔드 → 백엔드 → MongoDB 전체 흐름 테스트
  4. 외부 사용자 접근 시나리오 (회원가입, 로그인, 이력서 조회/편집)

#### Tasks (TDD Workflow)
##### RED: 자동화 없이 수동 배포의 복잡성 확인
- [ ] 수동 배포 시 누락되는 단계 문서화
- [ ] 코드 업데이트 시 다운타임 발생 확인

##### GREEN: 배포 스크립트 및 문서 작성
- [ ] **통합 배포 스크립트** (`scripts/deploy.sh`)
  ```bash
  #!/bin/bash

  set -e  # 에러 발생 시 중단

  echo "🚀 Resume 서비스 배포 시작..."

  # 1. Git Pull (선택사항)
  echo "📥 최신 코드 가져오기..."
  git pull origin main

  # 2. 환경 변수 확인
  if [ ! -f .env.production ]; then
    echo "❌ .env.production 파일이 없습니다."
    exit 1
  fi

  # 3. 프론트엔드 빌드
  echo "🏗️  프론트엔드 빌드 중..."
  cd resume-web
  npm ci
  npm run build
  cd ..

  # 4. 백엔드 이미지 빌드
  echo "🏗️  백엔드 이미지 빌드 중..."
  docker-compose build backend

  # 5. 서비스 재시작 (무중단 배포)
  echo "🔄 서비스 재시작 중..."
  docker-compose up -d --no-deps --build backend
  docker-compose restart nginx

  # 6. 헬스체크
  echo "🏥 헬스체크 대기 중..."
  sleep 10
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)

  if [ "$response" = "200" ]; then
    echo "✅ 배포 완료! 서비스가 정상 작동 중입니다."
  else
    echo "❌ 헬스체크 실패 (HTTP $response)"
    exit 1
  fi
  ```
- [ ] **운영 문서 작성** (`docs/DEPLOYMENT.md`)
  ```markdown
  # Synology NAS 배포 가이드

  ## 사전 준비
  1. Synology NAS DSM 7.0 이상
  2. Container Station 설치
  3. Docker 및 Docker Compose 설치
  4. 도메인 DNS 설정 (A 레코드 → NAS 공인 IP)
  5. NAS 포트 포워딩 (80, 443)

  ## 초기 배포
  ```bash
  # 1. 프로젝트 클론
  cd /volume1/docker
  git clone <repository-url> resume
  cd resume

  # 2. 환경 변수 설정
  cp .env.example .env.production
  nano .env.production  # JWT_SECRET, DOMAIN, EMAIL 수정

  # 3. SSL 인증서 발급
  chmod +x scripts/init-letsencrypt.sh
  ./scripts/init-letsencrypt.sh

  # 4. 전체 스택 배포
  chmod +x scripts/deploy.sh
  ./scripts/deploy.sh

  # 5. 데이터 시딩 (최초 1회)
  docker exec resume-backend npm run seed
  ```

  ## 코드 업데이트 배포
  ```bash
  cd /volume1/docker/resume
  ./scripts/deploy.sh
  ```

  ## 백업 설정
  1. DSM → 제어판 → 작업 스케줄러
  2. 생성 → 사용자 정의 스크립트
  3. 스크립트: `bash /volume1/docker/resume/scripts/backup-mongodb.sh`
  4. 스케줄: 매일 02:00

  ## 모니터링 설정
  1. Slack/Discord Webhook URL 생성
  2. `scripts/healthcheck-monitor.sh` 파일에 URL 입력
  3. 작업 스케줄러에 등록 (15분마다 실행)

  ## 트러블슈팅
  - **컨테이너 재시작**: `docker-compose restart <service-name>`
  - **로그 확인**: `docker-compose logs -f <service-name>`
  - **전체 재배포**: `docker-compose down && ./scripts/deploy.sh`
  ```
- [ ] **README.md 업데이트**
  - 배포 섹션 추가
  - 운영 환경 접속 URL 기재
  - 문제 발생 시 연락처
- [ ] **최종 E2E 테스트**
  ```bash
  # 1. 전체 배포
  ./scripts/deploy.sh

  # 2. 외부에서 접근 테스트
  curl https://your-domain.com
  curl https://your-domain.com/api/health

  # 3. 브라우저에서 사용자 시나리오 테스트
  - 회원가입
  - 로그인
  - 이력서 조회
  - 이력서 편집
  - 로그아웃

  # 4. 성능 테스트 (선택사항)
  ab -n 1000 -c 10 https://your-domain.com/api/health
  ```

##### REFACTOR: 배포 프로세스 개선
- [ ] CI/CD 파이프라인 구축 (GitHub Actions, 선택사항)
- [ ] Blue-Green 배포 전략 고려
- [ ] 롤백 자동화 스크립트
- [ ] 배포 알림 (Slack, Discord)

#### Quality Gate
- [ ] ✅ `./scripts/deploy.sh` 실행 시 전체 배포 성공
- [ ] ✅ 코드 업데이트 후 5분 이내 배포 완료
- [ ] ✅ 배포 중 서비스 다운타임 없음 (헬스체크 통과)
- [ ] ✅ 외부 도메인으로 접근 가능 (HTTPS)
- [ ] ✅ 사용자 시나리오 모두 정상 동작
  - [ ] 회원가입/로그인
  - [ ] 이력서 조회
  - [ ] 이력서 편집
- [ ] ✅ 성능 테스트 통과 (초당 100 요청 처리)
- [ ] ✅ 운영 문서 작성 완료 (DEPLOYMENT.md)
- [ ] ✅ 테스트: E2E 전체 시나리오 검증

#### Dependencies
- Phase 4 완료 (백업 및 모니터링 구축)
- Git 저장소 (선택사항)

#### Rollback Strategy
- 이전 Docker 이미지로 롤백
  ```bash
  docker-compose down
  docker image ls  # 이전 이미지 확인
  docker tag resume-backend:previous resume-backend:latest
  docker-compose up -d
  ```

---

## 🎯 전체 프로젝트 요약

### 구현 후 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│  Synology NAS                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 배포 자동화 (scripts/deploy.sh)                          │ │
│  │ - Git Pull → 빌드 → Docker Compose 재시작                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Docker Compose (resume)                                  │ │
│  │                                                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │ │
│  │  │  Nginx   │  │ Backend  │  │ MongoDB  │  │ Certbot │ │ │
│  │  │ (80/443) │─▶│  (3001)  │─▶│  (27017) │  │  (SSL)  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 자동화 (Task Scheduler)                                  │ │
│  │ - 매일 02:00: MongoDB 백업                               │ │
│  │ - 매 15분: 헬스체크 모니터링                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │
           │ HTTPS (443)
           ▼
    ┌──────────────┐
    │  인터넷 사용자 │
    │ (your-domain.com) │
    └──────────────┘
```

### 핵심 개선사항
- ✅ **단일 명령 배포**: `./scripts/deploy.sh`로 전체 스택 배포
- ✅ **무중단 배포**: Docker Compose `--no-deps` 옵션
- ✅ **보안**: HTTPS (Let's Encrypt), 보안 헤더, Rate Limiting
- ✅ **자동화**: 백업, 모니터링, SSL 갱신
- ✅ **영속성**: MongoDB 볼륨, 7일 백업 보관
- ✅ **모니터링**: 헬스체크, 로그 로테이션, 알림

---

## 🚨 위험 요소 및 대응 전략

| 위험 | 확률 | 영향 | 대응 전략 |
|------|------|------|----------|
| SSL 인증서 발급 실패 | 중 | 높음 | Staging 환경에서 테스트 후 운영 적용 |
| 도메인 DNS 전파 지연 | 중 | 중 | 24시간 대기 또는 hosts 파일 수정 테스트 |
| NAS 디스크 공간 부족 | 낮 | 높음 | 백업 자동 삭제 (7일), 디스크 모니터링 |
| MongoDB 데이터 손실 | 낮 | 매우 높음 | 일일 자동 백업, 복구 스크립트 검증 |
| Docker 이미지 빌드 실패 | 중 | 중 | 멀티스테이지 빌드, .dockerignore 최적화 |
| 네트워크 포트 충돌 | 중 | 중 | 포트 변경 가능하도록 환경 변수화 |

---

## 📝 Notes 및 학습 내용

### Phase 1 ✅ 완료 (2026-02-03)
- **멀티스테이지 빌드**: Node.js Alpine을 사용하여 최종 이미지 크기 최적화
- **보안 설정**: non-root 사용자(nodejs:1001)로 컨테이너 실행
- **헬스체크**: Dockerfile에 HEALTHCHECK 명령어 추가하여 자동 상태 모니터링
- **.dockerignore**: node_modules, tests, docs 등 불필요한 파일 제외하여 빌드 속도 향상
- **환경 변수 검증**: 프로덕션 환경에서는 JWT_SECRET 32자 이상 + "secret" 단어 불포함 필수
- **이미지 크기**: 백엔드 284MB (Node.js + 의존성), 프론트엔드 dist 144KB (매우 가벼움)
- **빌드 속도**: 백엔드 ~10초, 프론트엔드 ~5초 (npm ci 캐싱 효과)

### Phase 2
- [ ] 학습 내용 기록

### Phase 3
- [ ] 학습 내용 기록

### Phase 4
- [ ] 학습 내용 기록

### Phase 5
- [ ] 학습 내용 기록

---

## ✅ 최종 검증 체크리스트

- [ ] `docker-compose up -d` 실행 시 모든 서비스 정상 시작
- [ ] https://your-domain.com 접근 시 이력서 페이지 표시
- [ ] 회원가입/로그인 기능 동작
- [ ] 이력서 편집 기능 동작
- [ ] SSL 인증서 유효성 확인 (A+ 등급)
- [ ] MongoDB 백업 자동 실행 확인
- [ ] 헬스체크 모니터링 동작 확인
- [ ] 로그 로테이션 동작 확인
- [ ] 운영 문서 작성 완료 (DEPLOYMENT.md)
- [ ] 롤백 프로세스 검증

---

## 📚 참고 자료

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [Nginx 리버스 프록시 가이드](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt 인증서 발급](https://letsencrypt.org/docs/)
- [Synology Docker 가이드](https://www.synology.com/en-global/dsm/packages/Docker)
- [MongoDB 백업 전략](https://www.mongodb.com/docs/manual/core/backups/)

---

**계획 승인 후 Phase 1부터 순차적으로 진행하세요!**
