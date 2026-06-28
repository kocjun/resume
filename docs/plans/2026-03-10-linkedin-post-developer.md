# Claude Code 커스터마이징 가이드 — 개발자용 LinkedIn 게시물

Claude Code, 기본으로 쓰면 50%만 쓰는 겁니다.

반년간 7개 프로젝트(Spring Boot, Fastify, FastAPI, Vue, React, Swift)를 동시에 관리하면서 정리한 3단계 커스터마이징 가이드입니다.

---

## Layer 1: 프로젝트 컨텍스트 관리

### CLAUDE.md — 프로젝트별 지침서

모든 프로젝트 루트에 CLAUDE.md를 만듭니다. AI가 매 세션마다 읽는 "팀 위키"입니다.

```markdown
# CLAUDE.md
## 아키텍처
- Backend: Fastify 5 + Mongoose 8 (MVC 패턴)
- Frontend: Vue 3 <script setup> + Tailwind CSS 4

## 컨벤션
- Pure JavaScript (TypeScript 없음)
- Backend: kebab-case / Frontend: PascalCase
- Conventional Commits 사용

## 주요 명령어
- npm run dev (backend :3001, frontend :5173)
- npm test (Jest + mongodb-memory-server)
```

이것만으로도 "이 프로젝트에서는 TypeScript 쓰지 마세요", "테스트는 Jest로 하세요" 같은 반복 지시가 사라집니다.

### 플러그인 — 전문 도구 확장

설치한 플러그인 13개 중 핵심:

- **LSP 플러그인** (typescript-lsp, pyright-lsp, swift-lsp): 심볼 탐색, 정의 이동, 리네이밍이 에디터 수준으로 동작
- **security-scanning**: SAST 자동 분석, OWASP Top 10 기반 취약점 탐지
- **code-review-ai**: 코드 리뷰 에이전트 자동 호출
- **superpowers**: brainstorming → planning → TDD → verification 워크플로우 스킬 세트

```json
// ~/.claude/settings.json
{
  "language": "korean",
  "env": {
    "ENABLE_LSP_TOOL": "true",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Layer 2: 자동화와 피드백 루프

### Hooks — 코드 편집마다 자동 검증

Claude Code의 Hook 시스템으로 4개 자동화를 구성했습니다.

**1) 코드 편집 시 Codex 자동 검증 (PostToolUse)**

```bash
# ~/.claude/hooks/codex-validator.sh
# Edit/Write 도구 실행 후 트리거
# .py, .js, .ts, .java, .go 등 코드 파일만 필터링
# 500줄 이하 파일에 대해 OpenAI Codex가 보안/버그/성능 3줄 리뷰
```

코드를 수정할 때마다 다른 AI가 자동으로 교차 검증합니다. 보안 취약점이나 명백한 버그를 즉시 잡아냅니다.

**2) 작업 완료 시 품질 체크 (Stop)**

```bash
# ~/.claude/hooks/codex-task-validator.sh
# Claude 응답 완료 시 트리거
# 마지막 3개 assistant 메시지를 추출해서 Codex로 작업 완성도 검증
# "✅ 작업 완료" 또는 미진한 부분 하이라이트
```

**3) Superpowers 자동 활성화 (UserPromptSubmit)**

모든 프롬프트에 brainstorming/debugging/TDD 스킬이 자동으로 활성화되어 체계적인 워크플로우를 강제합니다.

### 커스텀 스킬 22개

가장 자주 쓰는 스킬들:

- **commit-helper**: `git diff --staged` 분석 → Conventional Commits 형식 메시지 자동 생성 (feat/fix/docs/refactor 등)
- **kanban**: 프로젝트별 SQLite DB 기반 7단계 AI 태스크 보드 (요구사항→계획→리뷰→구현→리뷰→테스트→완료)
- **verify-collection-***: 도메인별 일관성 검증 (백엔드 엔티티↔서비스↔컨트롤러, 프론트엔드 타입↔API 연동)
- **karpathy-guidelines**: Karpathy 코딩 가이드라인 적용 (think, simple, surgical, goal-driven)

### Statusline — 4줄 실시간 대시보드

```
•CWD: ~/workspace/resume | CPU: 12% | MEM: 67% | 14:32
•GIT: main | ~3 +1 | ↑2
•MODEL: opus-4-6 | MCP: 2 | Skills: 3 | Session: 1h 23m
•CTX: [██████████░░░░░] 71% 143K/200K | OAuth: [████░] 40% | Week: [██░░░] 25%
```

Python 스크립트(`statusline-colorful.py`)로 구현. 핵심은 **컨텍스트 윈도우 사용률** — 200K 토큰 중 얼마나 썼는지 실시간 확인. OAuth API 사용량과 주간 사용량도 추적합니다.

---

## Layer 3: 멀티에이전트 오케스트레이션

### oh-my-claudecode (OMC) — 30+ 전문 에이전트

OMC는 Claude Code 위에 멀티에이전트 레이어를 올립니다.

**에이전트 카탈로그 (일부)**:

| 역할 | 모델 | 용도 |
|------|------|------|
| explore | haiku | 코드베이스 탐색, 심볼 매핑 |
| planner | opus | 태스크 분해, 실행 계획 |
| executor | sonnet | 코드 구현, 리팩토링 |
| debugger | sonnet | 근본 원인 분석, 회귀 격리 |
| verifier | sonnet | 완료 증거 수집, 테스트 적정성 |
| security-reviewer | sonnet | 취약점, 인증/인가 검토 |
| architect | opus | 시스템 설계, 경계 정의 |

**모델 라우팅**: 작업 복잡도에 따라 자동 분배
- haiku: 빠른 조회, 가벼운 스캔 (수 초)
- sonnet: 표준 구현, 디버깅, 리뷰 (수 분)
- opus: 아키텍처 설계, 복잡한 리팩토링 (수십 분)

### 팀 파이프라인

```
team-plan → team-prd → team-exec → team-verify → team-fix(루프)
```

각 단계에 전문 에이전트가 배치됩니다:
- **plan**: explore + planner가 코드베이스 분석 후 실행 계획 수립
- **exec**: executor + 태스크별 전문가(designer, test-engineer, build-fixer) 병렬 투입
- **verify**: verifier + security-reviewer + code-reviewer가 교차 검증
- **fix**: 검증 실패 시 자동으로 수정 → 재검증 루프

### ultrawork 모드 — 최대 병렬 처리

```json
// ~/.claude/.omc-config.json
{
  "defaultExecutionMode": "ultrawork",
  "team": { "maxAgents": 5 }
}
```

기본 실행 모드를 ultrawork로 설정하면, 독립적인 태스크 5개를 동시에 처리합니다. "이 파일 수정하는 동안 저 테스트 돌려주세요"가 아니라, 알아서 병렬화합니다.

### MCP 연동 — 외부 AI 전문가 호출

- **Codex(OpenAI)**: 아키텍처 리뷰, 계획 검증, 보안 분석에 강점
- **Gemini(Google)**: UI/UX 리뷰, 문서 작성, 대용량 컨텍스트(1M 토큰) 분석에 강점

Hook으로 자동 호출되므로, 별도 조작 없이 코드 편집 → Codex 검증 → Claude 구현의 멀티 AI 파이프라인이 동작합니다.

---

여러분의 Claude Code 세팅은 어떤가요? 커스터마이징 팁이 있다면 댓글로 공유해주세요.

#ClaudeCode #AI개발도구 #개발자생산성 #AIEngineering #멀티에이전트 #DevTools
