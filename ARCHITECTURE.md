# 아키텍처

이 문서는 gstack를 **왜** 이런 방식으로 설계했는지 설명합니다. 설정/커맨드는 `CLAUDE.md`, 기여 방법은 `CONTRIBUTING.md`를 참고하세요.

## 핵심 아이디어

gstack는 Claude Code에 지속형 브라우저와 의견이 반영된 워크플로우 스킬 집합을 제공합니다. 어려운 부분은 브라우저이고, 나머지는 Markdown입니다.

핵심 통찰은 다음입니다. 브라우저를 조작하는 AI 에이전트는 **서브초 지연**과 **지속 상태**가 필요합니다. 커맨드마다 브라우저가 콜드 스타트되면 호출당 3-5초를 기다리게 됩니다. 커맨드 사이에 브라우저가 죽으면 쿠키/탭/로그인 세션을 잃습니다. 그래서 gstack는 장수명 Chromium 데몬을 띄우고 CLI가 localhost HTTP로 통신합니다.

```
Claude Code                     gstack
─────────                      ──────
                               ┌──────────────────────┐
  Tool call: $B snapshot -i    │  CLI (compiled binary)│
  ─────────────────────────→   │  • reads state file   │
                               │  • POST /command      │
                               │    to localhost:PORT   │
                               └──────────┬───────────┘
                                          │ HTTP
                               ┌──────────▼───────────┐
                               │  Server (Bun.serve)   │
                               │  • dispatches command  │
                               │  • talks to Chromium   │
                               │  • returns plain text  │
                               └──────────┬───────────┘
                                          │ CDP
                               ┌──────────▼───────────┐
                               │  Chromium (headless)   │
                               │  • persistent tabs     │
                               │  • cookies carry over  │
                               │  • 30min idle timeout  │
                               └───────────────────────┘
```

첫 호출에서 전체가 시작됩니다(약 3초). 이후 호출은 약 100-200ms입니다.

## 왜 Bun인가

Node.js로도 구현할 수 있습니다. 여기서는 Bun이 더 적합한 이유가 있습니다.

1. **컴파일 바이너리 제공.** `bun build --compile`은 단일 약 58MB 실행 파일을 만듭니다. 런타임 `node_modules`, `npx`, PATH 설정이 필요 없습니다. gstack가 `~/.claude/skills/`에 설치되는 특성상 사용자가 Node 프로젝트를 직접 관리하지 않아도 되는 점이 중요합니다.

2. **네이티브 SQLite.** 쿠키 복호화는 Chromium의 SQLite 쿠키 DB를 직접 읽습니다. Bun은 `new Database()`가 내장이라 `better-sqlite3`, 네이티브 addon 빌드, gyp 의존이 없습니다. 머신별 깨짐 포인트가 줄어듭니다.

3. **네이티브 TypeScript.** 개발 중 서버는 `bun run server.ts`로 실행됩니다. 별도 컴파일 단계, `ts-node`, 디버깅용 소스맵 부담이 없습니다. 컴파일 바이너리는 배포용이고 소스 파일은 개발용입니다.

4. **내장 HTTP 서버.** `Bun.serve()`는 빠르고 단순하며 Express/Fastify가 필요 없습니다. 서버 라우트는 약 10개 수준이라 프레임워크 추가는 오버헤드입니다.

병목은 항상 Chromium이지 CLI/서버가 아닙니다. Bun의 빠른 시작 속도(컴파일 바이너리 약 1ms vs Node 약 100ms)는 부가 이점일 뿐, 핵심 선택 이유는 컴파일 바이너리와 네이티브 SQLite입니다.

## 데몬 모델

### 왜 커맨드마다 브라우저를 띄우지 않는가

Playwright는 Chromium을 약 2-3초에 실행할 수 있습니다. 스크린샷 한 번이면 감수할 수 있지만, QA 세션처럼 20회 이상 커맨드가 오가면 시작 오버헤드만 40초 이상입니다. 더 큰 문제는 상태 손실입니다. 쿠키, localStorage, 로그인 세션, 열린 탭이 매번 사라집니다.

데몬 모델의 효과:

- **지속 상태.** 한 번 로그인하면 유지됩니다. 탭을 열면 유지됩니다. localStorage가 커맨드 간 지속됩니다.
- **서브초 커맨드.** 첫 호출 뒤에는 HTTP POST만 수행합니다. Chromium 작업 포함 왕복 100-200ms.
- **자동 라이프사이클.** 첫 사용 시 자동 시작, 30분 유휴 시 자동 종료. 별도 프로세스 관리 불필요.

### 상태 파일

서버는 `.gstack/browse.json`을 작성합니다(tmp + rename 원자적 쓰기, 권한 0o600):

```json
{ "pid": 12345, "port": 34567, "token": "uuid-v4", "startedAt": "...", "binaryVersion": "abc123" }
```

CLI는 이 파일을 읽어 서버를 찾습니다. 파일이 없거나 오래됐거나 PID가 죽었으면 새 서버를 띄웁니다.

### 포트 선택

10000-60000 범위 랜덤 포트(충돌 시 최대 5회 재시도)를 사용합니다. 따라서 Conductor 워크스페이스 10개가 동시에 돌아도 포트 설정/충돌 없이 각자 browse 데몬을 운영할 수 있습니다. 과거 9400-9409 스캔 방식은 다중 워크스페이스에서 자주 깨졌습니다.

### 버전 자동 재시작

빌드 시 `git rev-parse HEAD`를 `browse/dist/.version`에 기록합니다. CLI 호출마다 바이너리 버전과 서버의 `binaryVersion`을 비교해 다르면 기존 서버를 종료하고 새로 시작합니다. "오래된 바이너리" 계열 버그를 원천 차단합니다.

## 보안 모델

### localhost 전용

HTTP 서버는 `0.0.0.0`이 아닌 `localhost`에 바인딩됩니다. 네트워크에서 직접 접근할 수 없습니다.

### Bearer 토큰 인증

서버 세션마다 무작위 UUID 토큰을 생성해 상태 파일(권한 0o600, 소유자 전용 읽기)에 기록합니다. 모든 HTTP 요청은 `Authorization: Bearer <token>`을 포함해야 하며, 토큰 불일치 시 401을 반환합니다.

동일 머신의 다른 프로세스가 browse 서버를 임의 호출하는 것을 막습니다. 쿠키 선택 UI(`/cookie-picker`)와 헬스체크(`/health`)는 예외지만 localhost 한정이며 커맨드 실행 기능이 없습니다.

### 쿠키 보안

쿠키는 gstack가 다루는 데이터 중 가장 민감합니다. 설계 원칙:

1. **키체인 접근은 사용자 승인 필요.** 브라우저별 첫 쿠키 가져오기 시 macOS 키체인 대화상자가 뜨며, 사용자가 "허용" 또는 "항상 허용"을 선택해야 합니다. gstack는 자격증명을 묵시적으로 읽지 않습니다.

2. **복호화는 프로세스 메모리 내에서만 수행.** 쿠키 값은 메모리에서(PBKDF2 + AES-128-CBC) 복호화되어 Playwright 컨텍스트로 로드되며, 평문으로 디스크에 저장되지 않습니다. 쿠키 선택 UI는 값 자체를 노출하지 않고 도메인/개수만 표시합니다.

3. **DB는 읽기 전용.** 실행 중 브라우저와 SQLite lock 충돌을 피하려고 Chromium 쿠키 DB를 임시 파일로 복사해 읽기 전용으로 엽니다. 실제 브라우저 쿠키 DB를 수정하지 않습니다.

4. **키 캐시는 세션 단위.** 키체인 비밀번호와 파생 AES 키는 서버 생존 기간 동안만 메모리에 캐시됩니다. 서버 종료(유휴 타임아웃/명시적 종료) 시 캐시도 사라집니다.

5. **로그에 쿠키 값 비노출.** console/network/dialog 로그에 쿠키 값이 포함되지 않습니다. `cookies` 커맨드는 메타데이터(도메인, 이름, 만료 등)만 출력하며 값은 잘립니다.

### 셸 인젝션 방지

브라우저 레지스트리(Comet, Chrome, Arc, Brave, Edge)는 하드코딩되어 있습니다. DB 경로는 사용자 입력이 아닌 고정 상수 조합으로 구성됩니다. 키체인 접근은 셸 문자열 보간이 아니라 명시적 인자 배열 기반 `Bun.spawn()`으로 호출됩니다.

## Ref 시스템

Refs(`@e1`, `@e2`, `@c1`)는 CSS selector/XPath 없이 페이지 요소를 지정하기 위한 식별자입니다.

### 동작 방식

```
1. 에이전트 실행: $B snapshot -i
2. 서버가 Playwright page.accessibility.snapshot() 호출
3. 파서가 ARIA 트리를 순회하며 @e1, @e2, @e3... 순차 할당
4. 각 ref에 대해 Playwright Locator 생성: getByRole(role, { name }).nth(index)
5. BrowserManager 인스턴스에 Map<string, Locator> 저장
6. 주석이 달린 트리를 plain text로 반환

이후:
7. 에이전트 실행: $B click @e3
8. 서버가 @e3 → Locator 해석 → locator.click() 실행
```

### DOM 변조 대신 Locator를 쓰는 이유

겉보기에 쉬운 방법은 DOM에 `data-ref="@e1"`를 주입하는 것입니다. 하지만 다음 환경에서 깨집니다.

- **CSP(Content Security Policy).** 많은 프로덕션 사이트가 스크립트 기반 DOM 변경을 제한합니다.
- **React/Vue/Svelte hydration.** 프레임워크 reconciliation 과정에서 주입 속성이 제거될 수 있습니다.
- **Shadow DOM.** 외부에서 shadow root 내부 접근이 제한됩니다.

Playwright Locator는 DOM 외부 추상입니다. Chromium 내부 접근성 트리와 `getByRole()` 질의를 이용하므로 DOM 변조/CSP/프레임워크 충돌 문제를 피할 수 있습니다.

### Ref 라이프사이클

메인 프레임 `framenavigated` 이벤트 시 ref를 초기화합니다. 탐색 후에는 기존 locator가 stale이기 때문에 이것이 올바른 동작입니다. 에이전트는 새 `snapshot`을 실행해 최신 ref를 받아야 합니다. 의도는 명확합니다: stale ref는 조용히 오동작하지 말고 명시적으로 실패해야 합니다.

### Cursor-interactive refs (@c)

`-C` 플래그는 ARIA 트리에 없지만 실제로 클릭 가능한 요소를 찾습니다. 예: `cursor: pointer` 스타일 요소, `onclick` 속성, 커스텀 `tabindex`. 이들은 별도 네임스페이스 `@c1`, `@c2`로 할당됩니다. 프레임워크가 `<div>`로 렌더링한 커스텀 버튼 계열을 잡아내는 데 유용합니다.

## 로깅 아키텍처

3개의 링 버퍼(각 50,000 엔트리, O(1) push):

```
Browser events → CircularBuffer (in-memory) → Async flush to .gstack/*.log
```

console/network/dialog 이벤트 각각 독립 버퍼를 가지며, flush는 1초마다 수행됩니다. 서버는 마지막 flush 이후 신규 엔트리만 append합니다. 이 구조의 장점:

- HTTP 요청 처리가 디스크 I/O에 의해 막히지 않음
- 서버 크래시 시에도 로그 대부분 보존(최대 1초 손실)
- 메모리 상한 고정(50K × 3)
- 디스크 파일은 append-only라 외부 도구가 읽기 쉬움

`console`, `network`, `dialog` 커맨드는 디스크가 아니라 인메모리 버퍼를 읽습니다. 디스크 파일은 사후 디버깅 용도입니다.

## SKILL.md 템플릿 시스템

### 문제

SKILL.md는 Claude에게 browse 커맨드 사용법을 지시합니다. 문서가 존재하지 않는 플래그를 안내하거나 새 커맨드를 누락하면 에이전트 오류로 이어집니다. 수동 문서는 결국 코드와 드리프트합니다.

### 해결

```
SKILL.md.tmpl          (사람이 작성한 설명 + 플레이스홀더)
       ↓
gen-skill-docs.ts      (소스 코드 메타데이터 읽기)
       ↓
SKILL.md               (커밋되는 자동 생성 결과)
```

템플릿은 워크플로우/팁/예시처럼 사람 판단이 필요한 부분을 담습니다. `{{COMMAND_REFERENCE}}`, `{{SNAPSHOT_FLAGS}}`는 빌드 시 `commands.ts`, `snapshot.ts`에서 채워집니다. 구조적으로 코드-문서 정합성을 강제합니다.

### 런타임 생성이 아니라 커밋하는 이유

1. **Claude는 스킬 로드 시 SKILL.md를 읽습니다.** 사용자가 `/browse`를 호출할 때 별도 빌드가 돌지 않으므로 파일이 미리 존재하고 정확해야 합니다.
2. **CI로 최신성 검증 가능.** `gen:skill-docs --dry-run` + `git diff --exit-code`로 stale 문서를 머지 전 차단합니다.
3. **Git blame 추적성.** 특정 커맨드가 언제 어떤 커밋에서 추가됐는지 기록이 남습니다.

### 테스트 티어

| Tier | What | Cost | Speed |
|------|------|------|-------|
| 1 — Static validation | SKILL.md의 모든 `$B` 커맨드를 파싱해 레지스트리와 검증 | 무료 | <2초 |
| 2 — E2E via Agent SDK | 실제 Claude 세션에서 `/qa` 실행 후 오류 확인 | 약 $0.50 | 약 60초 |
| 3 — LLM-as-judge | Haiku가 문서 명확성/완전성/실행가능성 채점 | 약 $0.03 | 약 10초 |

Tier 1은 `bun test`마다 실행됩니다. Tier 2/3은 env var로 게이트됩니다. 원칙은 "문제의 95%를 무료 계층에서 잡고, 판단형 문제에만 LLM을 쓰자"입니다.

## 커맨드 디스패치

커맨드는 부작용 기준으로 분류됩니다.

- **READ** (`text`, `html`, `links`, `console`, `cookies`, ...): 상태 변경 없음. 재시도 안전. 페이지 상태 조회.
- **WRITE** (`goto`, `click`, `fill`, `press`, ...): 페이지 상태 변경. 멱등 아님.
- **META** (`snapshot`, `screenshot`, `tabs`, `chain`, ...): read/write로 깔끔히 분리되지 않는 서버 레벨 작업.

이는 단순 정리가 아니라 실제 디스패치 로직에 사용됩니다.

```typescript
if (READ_COMMANDS.has(cmd))  → handleReadCommand(cmd, args, bm)
if (WRITE_COMMANDS.has(cmd)) → handleWriteCommand(cmd, args, bm)
if (META_COMMANDS.has(cmd))  → handleMetaCommand(cmd, args, bm, shutdown)
```

`help` 커맨드는 세 집합을 모두 반환해 에이전트가 사용 가능한 커맨드를 자가 탐색할 수 있게 합니다.

## 에러 철학

에러 메시지의 대상은 사람이 아니라 AI 에이전트입니다. 메시지는 반드시 "다음 액션"을 제공해야 합니다.

- "Element not found" → "Element not found or not interactable. Run `snapshot -i` to see available elements."
- "Selector matched multiple elements" → "Selector matched multiple elements. Use @refs from `snapshot` instead."
- Timeout → "Navigation timed out after 30s. The page may be slow or the URL may be wrong."

Playwright 기본 에러는 `wrapError()`를 거쳐 내부 스택 트레이스를 제거하고 가이드를 추가합니다. 인간 개입 없이도 에이전트가 다음 행동을 결정할 수 있어야 합니다.

### 크래시 복구

서버는 자체 치유를 시도하지 않습니다. Chromium이 크래시(`browser.on('disconnected')`)하면 서버가 즉시 종료합니다. CLI가 다음 커맨드에서 죽은 서버를 감지하고 자동 재시작합니다. 반쯤 죽은 브라우저 프로세스에 재연결하려는 방식보다 단순하고 신뢰성이 높습니다.

## 의도적으로 넣지 않은 것

- **WebSocket 스트리밍 없음.** HTTP 요청/응답이 더 단순하고 curl로 디버깅 가능하며 성능도 충분합니다. 스트리밍은 복잡도 대비 이득이 작습니다.
- **MCP 프로토콜 없음.** MCP는 요청마다 JSON 스키마 오버헤드와 지속 연결을 요구합니다. plain HTTP + plain text 출력이 토큰/디버깅 관점에서 더 가볍습니다.
- **멀티유저 지원 없음.** 워크스페이스당 서버 1개, 사용자 1명을 가정합니다. 토큰 인증은 멀티테넌시가 아니라 defense-in-depth 용도입니다.
- **Windows/Linux 쿠키 복호화 없음.** 현재 지원 자격증명 저장소는 macOS Keychain뿐입니다. Linux(GNOME Keyring/kwallet), Windows(DPAPI)는 아키텍처상 가능하지만 미구현입니다.
- **iframe 지원 없음.** Playwright 자체는 iframe을 다루지만, ref 시스템은 아직 프레임 경계를 넘지 못합니다. 요청이 가장 많은 미구현 기능입니다.
