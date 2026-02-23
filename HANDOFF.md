# HANDOFF.md

## Goal

resume 프로젝트를 Docker로 로컬 환경에서 정상 기동하고, `http://192.168.10.58`에서 로그인이 가능하도록 만든다.

---

## Current Status: ✅ 완전 완료

모든 작업이 완료되었습니다.

**현재 실행 중인 컨테이너:**
| 컨테이너 | 상태 | 포트 |
|---------|------|------|
| resume-mongodb | healthy | 27017 |
| resume-backend | healthy | 3001 (내부) |
| resume-nginx | healthy | 80, 443 |
| resume-certbot | running | - |

- `http://192.168.10.58` 로그인 ✅
- 이미지 재빌드 완료 (CORS 설정 영구 반영) ✅

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `nginx/conf.d/nas.conf` | `selfsigned.crt` → `localhost.crt` 로 SSL 인증서 경로 수정 |
| `.env` | `CORS_ALLOWED_ORIGINS=http://192.168.10.58` 추가 |
| `docker-compose.yml` | `CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-}` 환경변수 추가 |

---

## 해결한 문제들

1. **nginx `selfsigned.crt` 오류** — `nginx/conf.d/nas.conf`가 없는 인증서 참조
   - → `ssl_certificate /etc/nginx/ssl/localhost.crt`로 수정

2. **MongoDB 포트 27017 충돌** — 이전 `resume-mongo` 컨테이너가 점유
   - → `docker stop resume-mongo`로 해결

3. **backend ↔ MongoDB 네트워크 미연결** — 오래된 컨테이너가 새 네트워크에 미연결
   - → `docker compose down && docker compose up -d --force-recreate`로 해결

4. **CORS 오류** — 컨테이너 이미지의 `cors.js`가 `CORS_ALLOWED_ORIGINS` 지원 없는 구버전
   - → macOS Terminal에서 직접 `docker compose build backend` 후 재배포

---

## 다음에 기동할 때

```bash
# 포트 충돌 컨테이너 정리 (필요 시)
docker stop resume-mongo && docker rm resume-mongo

# 기동
docker compose down && docker compose up -d --force-recreate
```

## 참고

- Admin 계정: `.env`의 `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Docker 이미지 재빌드가 필요할 때는 macOS **Terminal 앱**에서 실행 (Claude Code 세션은 키체인 접근 불가)
