# 변경 이력

## 0.4.1 — 2026-03-16

- Contributor Mode 추가: `gstack-config set gstack_contributor true` 설정 시 오류 상황을 자동으로 정리해 이슈 리포트 형태로 남김
- 세션 인지 강화: gstack 세션이 3개 이상일 때 질문마다 프로젝트/브랜치/작업 컨텍스트를 함께 표기
- 질문 포맷 통일: 모든 스킬에서 권장안(Recommendation)을 포함한 일관된 질문 형식 적용
- `/review` 강화: enum/상수 값 추가 시 switch, allowlist, filter 누락을 추적해 누락 핸들러를 사전 탐지
- 공통 프리앰블 통합: 11개 스킬 템플릿의 `{{UPDATE_CHECK}}`를 `{{PREAMBLE}}`로 통합

## 0.4.0 — 2026-03-16

- `/qa-only` 추가: 코드 수정 없이 QA 리포트만 생성하는 모드
- `/qa` fix loop 추가: 발견 → 수정 → 재검증 사이클을 한 워크플로우에 통합
- `/plan-eng-review` → `/qa` 테스트 플랜 아티팩트 연계
- `{{QA_METHODOLOGY}}` 공통 블록 도입으로 `/qa`, `/qa-only` 방법론 동기화
- eval 효율성 지표(턴/시간/비용) 및 비교 코멘터리 강화
- SPA ref staleness(오래된 ref) 탐지 개선 및 관련 테스트 추가

## 0.3.9 — 2026-03-15

- `bin/gstack-config` 추가: `~/.gstack/config.yaml`의 get/set/list 관리
- 업데이트 체크 고도화: 12시간 캐시, snooze 백오프(24h→48h→1주), `update_check: false` 지원
- 자동 업그레이드 모드(`auto_upgrade`, `GSTACK_AUTO_UPGRADE=1`) 지원
- 업그레이드 프롬프트 4옵션(즉시/항상/나중에/다시 묻지 않기) 도입
- 업그레이드 후 프로젝트 내 vendored gstack 동기화 지원

## 0.3.8 — 2026-03-14

- `TODO.md`와 `TODOS.md`를 `TODOS.md` 단일 문서로 통합
- `/ship`의 TODO 관리 단계 추가(완료 항목 자동 감지/표시)
- `/plan-*`, `/review`, `/qa`, `/retro`에 TODOS 인지 컨텍스트 반영
- `review/TODOS-format.md` 도입으로 TODO 형식 표준화
- Greptile 응답 체계(2-tier, 템플릿, 재분류 제안) 강화

## 0.3.7 — 2026-03-14

- `screenshot` 확장: selector/@ref element crop, `--clip x,y,w,h`, `--viewport` 지원
- 관련 스크린샷 모드 및 오류 경로 테스트 강화

## 0.3.6 — 2026-03-14

- E2E 관측성(heartbeat/progress/NDJSON/partial save) 도입
- `bun run eval:watch`, `eval:list`, `eval:compare`, `eval:summary` 도구 추가
- API 연결 실패 사전 감지 및 `is_error` 판별 로직 보강
- 스킬 템플릿 체계 확장 및 정적/LLM/E2E eval 3계층 체계화
- update-check의 종료 코드 처리 안정화(`|| true`) 및 setup 블록 보강

## 0.3.3 — 2026-03-13

- SKILL 템플릿 시스템(`.tmpl`) 도입 및 문서 자동 생성 파이프라인 구축
- 커맨드/플래그 단일 소스(`commands.ts`, `SNAPSHOT_FLAGS`) 기반으로 문서/검증 일관성 확보
- `skill:check`, `dev:skill`, CI 검증 워크플로우 추가
- ARCHITECTURE 문서, Conductor 통합, `.env` 전파 개선

## 0.3.2 — 2026-03-13

- diff-aware QA 모드 및 프로젝트 로컬 `.gstack/` 상태 관리 도입
- 포트 충돌 완화(랜덤 포트), 바이너리 버전 추적, 레거시 `/tmp` 상태 정리 강화
- Greptile 연동, 로컬 dev 모드, `find-browse` 버전 인지 개선
- `help` 라우팅/응답 포맷, 서버 스크립트 해상도 등 안정성 이슈 다수 수정

## 0.3.1 — 2026-03-12

### Phase 3.5: 브라우저 쿠키 가져오기

- `cookie-import-browser` 커맨드 — 실제 Chromium 브라우저(Comet, Chrome, Arc, Brave, Edge)에서 쿠키를 복호화하여 가져오기
- browse 서버에서 제공하는 대화형 쿠키 선택기 웹 UI (다크 테마, 두 패널 레이아웃, 도메인 검색, 가져오기/제거)
- 비대화형 사용을 위한 `--domain` 플래그를 통한 직접 CLI 가져오기
- Claude Code 통합을 위한 `/setup-browser-cookies` 스킬
- 비동기 10초 타임아웃으로 macOS 키체인 접근 (이벤트 루프 블로킹 없음)
- 브라우저별 AES 키 캐싱 (세션당 브라우저당 키체인 프롬프트 1회)
- DB 잠금 대체 처리: 잠긴 쿠키 DB를 /tmp로 복사하여 안전한 읽기
- 암호화된 쿠키 픽스처를 사용한 18개 단위 테스트

## 0.3.0 — 2026-03-12

### Phase 3: /qa 스킬 — 체계적인 QA 테스트

- 6단계 워크플로우를 갖춘 새 `/qa` 스킬 (초기화, 인증, 탐색, 탐험, 문서화, 마무리)
- 세 가지 모드: full (체계적, 5-10개 이슈), quick (30초 스모크 테스트), regression (기준선 대비 비교)
- 이슈 분류법: 7개 카테고리, 4개 심각도 수준, 페이지별 탐험 체크리스트
- 건강 점수(0-100, 7개 카테고리 가중 평균)를 갖춘 구조화된 리포트 템플릿
- Next.js, Rails, WordPress, SPA를 위한 프레임워크 감지 가이드
- `browse/bin/find-browse` — `git rev-parse --show-toplevel`을 사용한 DRY 바이너리 탐색

### Phase 2: 향상된 브라우저

- 다이얼로그 처리: 자동 수락/거절, 다이얼로그 버퍼, 프롬프트 텍스트 지원
- 파일 업로드: `upload <sel> <file1> [file2...]`
- 엘리먼트 상태 확인: `is visible|hidden|enabled|disabled|checked|editable|focused <sel>`
- ref 레이블이 오버레이된 주석 스크린샷 (`snapshot -a`)
- 이전 스냅샷 대비 스냅샷 비교 (`snapshot -D`)
- 비 ARIA 클릭 가능 요소 스캔 (`snapshot -C`)
- `wait --networkidle` / `--load` / `--domcontentloaded` 플래그
- `console --errors` 필터 (에러 + 경고만)
- `cookie-import <json-file>` (페이지 URL에서 도메인 자동 채우기)
- CircularBuffer O(1) 링 버퍼 (콘솔/네트워크/다이얼로그 버퍼용)
- Bun.write()를 통한 비동기 버퍼 플러시
- page.evaluate + 2초 타임아웃으로 헬스 체크
- Playwright 에러 래핑 — AI 에이전트를 위한 실행 가능한 메시지
- 컨텍스트 재생성 시 쿠키/스토리지/URL 유지 (useragent 수정)
- SKILL.md를 10개의 워크플로우 패턴을 갖춘 QA 지향 플레이북으로 재작성
- 166개 통합 테스트 (기존 ~63개)

## 0.0.2 — 2026-03-12

- 프로젝트 로컬 `/browse` 설치 수정 — 컴파일된 바이너리가 글로벌 설치를 가정하지 않고 자체 디렉토리에서 `server.ts`를 찾도록 수정
- `setup`이 오래된 바이너리를 (없는 것만이 아닌) 재빌드하고 빌드 실패 시 비-0으로 종료
- `chain` 커맨드가 쓰기 커맨드의 실제 에러를 삼키는 문제 수정 (예: "Unknown meta command"로 보고되는 탐색 타임아웃)
- 동일 커맨드에서 서버가 반복 충돌할 때 CLI의 무한 재시작 루프 수정
- 콘솔/네트워크 버퍼를 무제한 증가 대신 50,000개 항목(링 버퍼)으로 제한
- 버퍼가 50,000개 한도에 도달한 후 디스크 플러시가 자동 중지되는 문제 수정
- 업그레이드 시 중첩 심볼릭 링크 생성을 방지하도록 `ln -snf` 수정
- 업그레이드 시 `git pull` 대신 `git fetch && git reset --hard` 사용 (강제 푸시 처리)
- 설치 단순화: 선택적 프로젝트 복사와 함께 글로벌 우선 (서브모듈 방식 대체)
- README 재구성: 히어로, 전후 비교, 데모 트랜스크립트, 문제 해결 섹션
- 여섯 개 스킬 (`/retro` 추가)

## 0.0.1 — 2026-03-11

최초 릴리스.

- 다섯 개 스킬: `/plan-ceo-review`, `/plan-eng-review`, `/review`, `/ship`, `/browse`
- 40+ 커맨드, ref 기반 상호작용, 지속적인 Chromium 데몬을 갖춘 헤드리스 브라우저 CLI
- Claude Code 스킬로 원-커맨드 설치 (서브모듈 또는 글로벌 클론)
- 바이너리 컴파일 및 스킬 심볼릭 링크를 위한 `setup` 스크립트
