# HANDOFF.md

## Goal

이력서 시스템에 한국어/영어 다국어(i18n) 지원을 추가한다. UI 라벨과 이력서 데이터 모두 한/영 전환 가능, PDF 출력 시 선택된 언어로 출력.

---

## Current Status: 🔧 PDF 500 에러 디버깅 필요

구현은 거의 완료 (95%). Docker 환경에서 PDF 생성 시 500 에러 발생 — 디버깅 필요.

**완료된 커밋 (8개):**

| 커밋 | 내용 |
|------|------|
| `2f60091` | Resume 스키마 LocalizedString (Mixed 타입) 지원 |
| `9c2913c` | PDF 템플릿 `renderResumePDF(resume, lang)` + L() 헬퍼 |
| `2b2f351` | vue-i18n 설치 + ko/en locale 파일 + useLocalized composable |
| `5fbba8b` | 전체 Vue 컴포넌트 i18n 적용 + 네비게이션 KO/EN 토글 버튼 |
| `3adb852` | data.json 다국어 `{ ko, en }` 형식 변환 |
| `220dc98` | API client `downloadPDF(lang)` lang 파라미터 추가 |
| `267e44a` | DB 마이그레이션 스크립트 `scripts/migrate-i18n.js` |
| `6cdf07e` | 테스트 환경 rate limiter 비활성화 |

**미커밋 변경:**
- `resume-backend/src/controllers/resume.controller.js` — DB에 resume 없을 때 data.json fallback 로직 추가 (line 366-376 부근)

---

## What Worked

- **백엔드 테스트**: 75개 전체 통과 (`cd resume-backend && npm test`)
- **프론트엔드 빌드**: 정상 (`cd resume-web && npm run build`)
- **스키마 변경**: `mongoose.Schema.Types.Mixed`로 String과 `{ ko, en }` 객체 모두 수용
- **vue-i18n 10**: `legacy: false` 모드, Composition API와 호환
- **useLocalized composable**: `localized(field)` — 현재 locale 값 추출, ko fallback
- **Docker 기동**: mongodb/backend/nginx 컨테이너 정상 실행
- **Admin 로그인**: env 기반 인증 정상 동작

## What Didn't Work

- **PDF 500 에러**: Docker 환경에서 `GET /api/resume/pdf?lang=ko` 호출 시 500 에러
  - DB에 resume 데이터 없음 (admin은 env 기반 로그인이라 DB에 resume 없음)
  - data.json fallback 로직을 추가했지만 500 에러 지속
  - **원인 추정**: Puppeteer가 Docker 컨테이너 내에서 실패할 수 있음, 또는 data.json 경로 문제 (Docker 내 경로는 `/resume-web/src/data.json`으로 마운트됨)
  - `docker logs resume-backend` 로 에러 상세 확인 필요

---

## 핵심 파일 구조

```
resume-backend/
  src/models/Resume.js          — LocalizedString (Mixed) 스키마
  src/templates/resume-pdf.js   — renderResumePDF(resume, lang), L() 헬퍼, SECTION_TITLES
  src/controllers/resume.controller.js — generatePDF에서 ?lang= 처리 + data.json fallback
  scripts/migrate-i18n.js       — DB 마이그레이션 스크립트

resume-web/
  src/i18n/index.js             — vue-i18n 인스턴스 (localStorage 저장, 기본값 ko)
  src/i18n/locales/ko.json      — 한글 UI 라벨
  src/i18n/locales/en.json      — 영문 UI 라벨
  src/composables/useLocalized.js — localized(field) 헬퍼
  src/data.json                 — fallback 데이터 (모든 텍스트 { ko, en } 형태)
  src/App.vue                   — 네비게이션에 KO/EN 토글 버튼
  src/views/ResumeView.vue      — t() + localized() 적용
  src/components/*.vue          — 전부 i18n 적용됨
  src/api/client.js             — downloadPDF(lang) 파라미터 추가
```

---

## Next Steps

### 1. PDF 500 에러 디버깅 (최우선)

```bash
# 백엔드 로그에서 에러 상세 확인
docker logs resume-backend 2>&1 | grep -A5 "error\|Error\|500"
```

가능한 원인:
- Docker 컨테이너 내 data.json 경로: `/resume-web/src/data.json` (docker-compose volumes 참조)
- Puppeteer 크래시 (메모리 부족, Chromium 미설치 등)
- `renderResumePDF`에 전달되는 data.json의 `{ ko, en }` 형식이 escapeHtml에서 `[object Object]` 출력되는지 확인

### 2. 미커밋 변경사항 커밋

```bash
git add resume-backend/src/controllers/resume.controller.js
git commit -m "fix(backend): fallback to data.json when no resume in DB for PDF generation"
```

### 3. 수동 검증 (PDF 해결 후)

- [ ] 토글 버튼 KO/EN 전환
- [ ] UI 라벨 한/영 전환
- [ ] 이력서 데이터 한/영 표시
- [ ] 새로고침 후 언어 유지
- [ ] PDF 한글/영문 출력
- [ ] 영문 데이터 없을 때 한글 fallback

---

## 설계 문서

`docs/plans/2026-03-04-i18n-design.md` — 전체 설계 및 구현 계획

## Docker 기동

```bash
cd resume-web && npm run build   # 프론트엔드 빌드 먼저
docker-compose up -d --build     # 서비스 시작
```

## Admin 계정

`.env` 파일의 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 참조
