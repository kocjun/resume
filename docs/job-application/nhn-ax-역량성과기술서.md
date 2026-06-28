# 역량·성과 기술서 — NHN AX(AI 전환) 포지션

> 지원자: 전영창 (15+ Years Full Stack Developer)
> 작성 기준: NHN "AX 전환 시스템 인프라 구축·운영 / AI 문서·교육" 채용공고
> 연락처: Yeongchang.jeon@gmail.com · 010-8838-2248 · 경기 화성시

---

## 0. 한 줄 소개

**15년간 Java/Spring 엔터프라이즈 시스템을 설계·구축·운영해 온 시니어 풀스택 개발자이며, 현재 LangChain4j 기반 RAG 플랫폼 '별빛국회'를 직접 만들어 실서비스로 운영하고 있는 — AI 프로덕션을 "이미 만들고 운영하는" 엔지니어입니다.**

학습 단계의 AI 관심자가 아니라, 멀티 LLM 라우팅·벡터 검색·인프라 장애 대응·개인정보 컴플라이언스까지 직접 책임지는 운영자라는 점이 이 포지션과의 핵심 접점입니다.

---

## 1. 지원 직무 적합성 (JD 매핑)

### 필수 자격요건

| 요건                                           | 충족 | 근거                                                                                                                                                                                          |
| ---------------------------------------------- | :--: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux 환경 개발 및 운영 경험                   |  ✅  | 별빛국회 백엔드를 Vultr(Ubuntu 24.04)에서 직접 배포·운영. PostgreSQL 크래시·디스크 풀·LLM 서버 장애를 SSH로 직접 진단·복구. 초기 경력(클루닉스·카이런소프트)에서도 Linux C/C++ 서버 데몬 개발 |
| Claude Code·Codex 등 Agentic AI 활용 개발 경험 |  ✅  | 별빛국회·이력서 플랫폼 전체를 **Claude Code 멀티 에이전트 오케스트레이션**으로 설계·개발·테스트. 에이전트 기반 코드리뷰·검증 워크플로우를 일상적으로 운용                                     |
| Java/Python/Go 1개 이상 BE 개발·운영           |  ✅  | **Java/Spring 15년+** (Spring Boot 3.3 운영 중). Python으로 AI 사이드 프로젝트                                                                                                                |
| AX 전환에 대한 관심·고민                       |  ✅  | 전통 SI 풀스택에서 AI 네이티브 개발로 **실제 전환을 완수**. RAG·LLM 운영을 통한 비용·품질 트레이드오프를 직접 체득                                                                            |

### 우대 사항

| 우대                                | 충족 | 근거                                                                                                |
| ----------------------------------- | :--: | --------------------------------------------------------------------------------------------------- |
| Spring/Gin/FastAPI 등 Web Framework |  ✅  | Spring Boot/Framework 전문 (15년)                                                                   |
| DB/MQ/VM/컨테이너 이해              |  ✅  | PostgreSQL+pgvector·Oracle·MySQL·MSSQL, Redis, Docker, Kafka(MSA)                                   |
| LLM/RAG 등 AI 기술·이론             |  ✅  | LangChain4j RAG 파이프라인, bge-m3 임베딩(1024차원), 벡터 검색, 3단계 LLM 폴백을 **직접 구현·운영** |
| AI Workflow(BMAD 등) 이해           |  ✅  | Claude Code 기반 멀티 에이전트 워크플로우(설계→구현→리뷰→검증) 상시 운용                            |
| 클라우드 환경 서비스 개발           |  ✅  | Vultr·Cloudflare(CDN/DNS/SSL/Tunnel) 기반 서비스 운영                                               |
| FE(React, Tailwind CSS)             |  ✅  | Vue 3 + TypeScript + **Tailwind CSS 4** 프로덕션. React 경험 보유                                   |
| 협업·커뮤니케이션                   |  ✅  | 다수 SI 프로젝트 공통모듈 리드, GitHub/Trello 협업 프로세스 도입 주도                               |
| 개발자·비개발자 대상 문서 작성      |  ✅  | 운영 노하우·설계 문서·핸드오프 문서를 체계적으로 축적·관리                                          |

---

## 2. 핵심 역량 요약

- **엔터프라이즈 백엔드**: Java 17 / Spring Boot 3.3 / JPA, 미션 크리티컬 시스템 아키텍처 설계 및 성능 최적화
- **AI / RAG**: LangChain4j, bge-m3 임베딩, PostgreSQL+pgvector 벡터 검색, 멀티 LLM 라우팅·폴백 설계
- **풀스택 FE**: Vue 3 / TypeScript / Tailwind CSS, Playwright E2E
- **인프라·운영(DevOps)**: Linux(Ubuntu) 운영, Docker, Cloudflare, Prometheus/Grafana 모니터링, 장애 대응, 백업 파이프라인
- **Agentic 개발**: Claude Code 멀티 에이전트 오케스트레이션 기반 설계·구현·검증 자동화

---

## 3. 대표 프로젝트 — 별빛국회 (Starlight Assembly)

> **운영 사이트**: https://starlightassembly.kr/ · **소개 페이지**: https://starlightassembly.kr/review/
> 기간: 2026.02 ~ 현재(운영 중) · 역할: 기획·설계·개발·운영 **단독 수행**

### 3.1 개요

대한민국 국회 의정 활동(법안·의원·회의록)을 시민이 쉽게 이해하도록 돕는 **AI 기반 정치 정보 플랫폼**. 자연어 질의응답 RAG 챗봇, 법안 감시탑, 의원 분석, 데일리 브리핑, 법안 번역기 등을 제공하며 실서비스로 운영 중.

### 3.2 시스템 아키텍처

```
[Vue 3 / TS / Tailwind] ──▶ [Spring Boot 3.3 + LangChain4j] ──▶ [PostgreSQL 16 + pgvector]
                                      │                                   │
                                      ├─ Embedding: bge-m3 (1024d)        └─ Redis 7 (캐시)
                                      └─ LLM 3단계 폴백:
                                          1순위 gemma (oMLX, Mac Studio)
                                          2순위 qwen3:32b (Ollama)
                                          3순위 llama-3.3-70b (Groq API)

인프라: Vultr(Ubuntu 24.04) · Mac Studio LLM 서버 + Cloudflare Tunnel
        Cloudflare(CDN/DNS/SSL) · Docker · Prometheus + Grafana
```

### 3.3 기술적 성취 (직무 직접 연관)

**① RAG 파이프라인 구축**

- LangChain4j 기반 임베딩→벡터검색→프롬프트 합성→생성 파이프라인을 직접 설계
- bge-m3(1024차원) 임베딩 + PostgreSQL/pgvector 유사도 검색으로 법안·회의록 문서 검색

**② 멀티 LLM 라우팅·폴백 (AI 인프라 설계의 핵심)**

- 로컬(oMLX/Ollama) 우선 → 클라우드(Groq) 폴백의 **3단계 라우팅**으로 비용과 가용성을 동시에 확보
- 자체 LLM 서버(Mac Studio)를 Cloudflare Tunnel로 안전하게 노출

**③ 프로덕션 인프라 운영·장애 대응** _(NHN "구축·관리·운영" 요건 직결)_

- PostgreSQL 디스크 풀로 인한 PANIC 크래시 루프를 직접 진단·복구
- LLM 서버 502 장애(버전 불일치) 롤백 복구, Mac Studio IP 변경에 따른 bind 실패 crash loop 복구
- **NAS 백업 파이프라인 구축**(Tailscale + scp, 30일 보관) 및 디스크 사용량 자동 회수
- Prometheus/Grafana 모니터링, 백업·디스크 Email 알림 훅 운영

**④ 품질·컴플라이언스 엔지니어링**

- GitHub Actions CI 재활성화 + **Testcontainers** 통합 테스트
- **Flyway** DB 마이그레이션 운영(repair 포함)
- 개인정보보호(PIPA) **감사 로그(PiiAccessLog)** 설계·운영
- 데이터 적재 잡 스케줄링·스로틀링(법안 1,213건 적재) 및 의원 이미지 최적화

### 3.4 AX·Agentic AI 관점

이 프로젝트는 **AI를 활용하는 서비스이자, AI 에이전트로 만든 서비스**라는 이중 의미를 가집니다. 설계·구현·코드리뷰·검증 전 과정을 Claude Code 멀티 에이전트 오케스트레이션으로 수행하여, NHN이 추구하는 **"개발 영역의 AX 전환"을 본인 프로젝트에 선제 적용**한 사례입니다.

---

## 4. 엔터프라이즈 경력 성과 (선별)

| 기간            | 고객/프로젝트              | 핵심 성과                                                                        | 기술                             |
| --------------- | -------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| 2024.12~2025.06 | 삼성전자DS CP 대외협력포털 | 공통모듈(메뉴/권한/공통코드/통계) 아키텍처 설계·리드, 외부 시스템 인터페이스 4건 | Java, Spring Boot, Vue.js, MSSQL |
| 2020.08~2022.03 | 삼성전자DS 스마트인터락    | 8대 공정 라인 실시간 설비 모니터링, 실시간 JSON API 설계로 대응시간 단축         | Java, Spring, Oracle             |
| 2023.01~2023.09 | 질병관리청 방역통합시스템  | 국가단위 역학조사 데이터 처리, 대용량 Oracle 쿼리 최적화                         | Java, JSP, Oracle                |
| 2024.04~2024.10 | 세메스 CSS 시스템          | 설비 CS 접수~청구 End-to-End 프로세스 설계·구현                                  | Java, Nexacro, Oracle            |
| 2019.03~2020.05 | 통일부·감사원 보안관제     | 레거시에 Vue.js 선제 도입, 컴포넌트 아키텍처 전환·협업 프로세스 체계화           | Java, Vue.js, Spring, MySQL      |

> 전체 경력(15건, 2009~현재)은 이력서( https://starlightassembly.kr 외 포트폴리오 참조 )에 빠짐없이 기재.

---

## 5. AI / Agentic 개발 방식

- **Claude Code 멀티 에이전트 오케스트레이션**: 탐색·계획·구현·리뷰·검증을 역할별 에이전트로 분담
- **에이전트 기반 코드리뷰**: 변경마다 독립 리뷰 에이전트로 회귀·보안 결함 사전 차단(실제로 cherry-pick 회귀 버그를 머지 전 검출·수정한 사례 보유)
- **문서 주도 운영**: 운영 노하우·설계·핸드오프 문서를 지속 축적하여 재현 가능한 운영 체계 유지

---

## 6. 포트폴리오 & 링크

| 항목                                    | 링크                                  |
| --------------------------------------- | ------------------------------------- |
| 별빛국회 (운영 서비스)                  | https://starlightassembly.kr/         |
| 별빛국회 소개 페이지                    | https://starlightassembly.kr/review/  |
| 개인 이력서 웹앱 (Vue3+Fastify+MongoDB) | https://github.com/kocjun/resume      |
| AI Stock (Python AI 주식 분석)          | https://github.com/kocjun/ai-stock    |
| Learn Kafka (이벤트 기반 MSA)           | https://github.com/kocjun/learn-kafka |

---

## 7. 학력 · 자격

- 충남대학교 컴퓨터공학과 졸업 (2009.02)
- 정보처리기사 (2011.09), SCJP (2007.07)

---

## 8. NHN 제출서류 대응 (필수 3종)

| 서류                             | 대응                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| ① JD 관련 역량·성과 기술서 (PDF) | 본 문서를 PDF로 변환하여 제출                                 |
| ② 포트폴리오 (PDF)               | 이력서 웹앱의 PDF Export 기능으로 생성 + 별빛국회 소개 페이지 |
| ③ 상세 md 파일                   | 본 문서(.md)                                                  |

> 병역: **육군 병장 만기전역** (필) · 근무지(판교 삼평동) **통근 가능**.
