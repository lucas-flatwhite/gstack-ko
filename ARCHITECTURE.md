# 아키텍처

이 문서는 gstack를 **왜 이런 구조로 만들었는지** 설명합니다. 설치와 명령은 `CLAUDE.md`, 기여 방법은 `CONTRIBUTING.md`를 참고하세요.

## 핵심 아이디어

gstack는 Claude Code에 지속형 브라우저와 의견이 반영된 워크플로우 스킬 세트를 제공합니다. 어려운 부분은 브라우저이고, 나머지는 대부분 Markdown입니다.

핵심 인사이트는 다음과 같습니다. 브라우저를 다루는 AI 에이전트에는 **서브초 지연시간**과 **지속 상태**가 필요합니다. 명령마다 브라우저를 콜드 스타트하면 툴 호출마다 3-5초를 기다리게 됩니다. 명령 사이에 브라우저가 종료되면 쿠키, 탭, 로그인 세션이 사라집니다. 그래서 gstack는 장수명 Chromium 데몬을 띄우고 CLI가 localhost HTTP로 통신합니다.

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

첫 호출은 전체 구동으로 약 3초, 이후 호출은 약 100-200ms입니다.

## 왜 Bun인가

Node.js로도 구현할 수 있지만, 여기서는 Bun이 더 적합합니다.

1. **컴파일 바이너리**: `bun build --compile`로 약 58MB 단일 실행파일을 만듭니다. 런타임 `node_modules`, `npx`, PATH 설정이 필요 없습니다. gstack는 `~/.claude/skills/`에 설치되므로 사용자가 Node 프로젝트 관리 부담을 느끼지 않는 점이 중요합니다.

2. **네이티브 SQLite**: 쿠키 복호화 과정에서 Chromium SQLite 쿠키 DB를 직접 읽습니다. Bun은 `new Database()`를 기본 제공하므로 `better-sqlite3`, 네이티브 애드온 컴파일, gyp 의존이 없습니다.

3. **네이티브 TypeScript**: 개발 중 서버를 `bun run server.ts`로 바로 실행합니다. 별도 컴파일 단계나 `ts-node`, 디버깅용 source map 의존이 줄어듭니다. 배포는 컴파일 바이너리, 개발은 소스 파일 중심입니다.

4. **내장 HTTP 서버**: `Bun.serve()`는 빠르고 단순하며 Express/Fastify 같은 프레임워크가 필요 없습니다. 서버 라우트가 약 10개 수준이라 프레임워크 오버헤드가 더 큽니다.

병목은 CLI/서버가 아니라 Chromium입니다. Bun의 빠른 시작 속도는 이점이지만, 채택 이유의 핵심은 컴파일 바이너리와 네이티브 SQLite입니다.

## 데몬 모델

### 명령마다 브라우저를 띄우지 않는 이유

Playwright는 Chromium 시작에 대략 2-3초가 필요합니다. 단일 스크린샷에는 괜찮지만, 20개 이상 명령을 쓰는 QA 세션에서는 시작 오버헤드만 40초 이상이 됩니다. 더 큰 문제는 상태 손실입니다. 쿠키, localStorage, 로그인, 열린 탭이 매번 사라집니다.

데몬 모델의 효과:

- **지속 상태**: 한 번 로그인하면 유지됩니다. 탭도 유지됩니다. localStorage도 명령 간 유지됩니다.
- **서브초 응답**: 첫 호출 이후에는 HTTP POST 한 번으로 처리되어 왕복 100-200ms 수준입니다.
- **자동 라이프사이클**: 첫 사용 시 자동 시작, 30분 유휴 시 자동 종료. 별도 프로세스 관리가 필요 없습니다.

### 상태 파일

서버는 `.gstack/browse.json`을 기록합니다(임시파일 + rename 원자적 쓰기, 권한 0o600).

```json
{ "pid": 12345, "port": 34567, "token": "uuid-v4", "startedAt": "...", "binaryVersion": "abc123" }
```

CLI는 이 파일로 서버를 찾습니다. 파일이 없거나 오래되었거나 PID가 죽었으면 새 서버를 생성합니다.

### 포트 선택

포트는 10000-60000 범위에서 랜덤으로 고르고 충돌 시 최대 5회 재시도합니다. 그래서 Conductor 워크스페이스가 여러 개여도 별도 설정 없이 각자 browse 데몬을 띄울 수 있습니다. 예전 방식(9400-9409 순회)은 멀티 워크스페이스에서 충돌이 잦았습니다.

### 버전 자동 재시작

빌드 시 `browse/dist/.version`에 `git rev-parse HEAD`를 씁니다. CLI 호출 때 실행 중 서버의 `binaryVersion`과 현재 바이너리 버전이 다르면, CLI가 기존 서버를 종료하고 새로 시작합니다. 이로써 "오래된 바이너리" 계열 문제를 원천 차단합니다.

## 보안 모델

### localhost 한정

HTTP 서버는 `0.0.0.0`이 아니라 `localhost`에만 바인딩됩니다. 외부 네트워크에서 접근할 수 없습니다.

### Bearer 토큰 인증

서버 세션마다 랜덤 UUID 토큰을 생성해 상태 파일(권한 0o600)에 기록합니다. 모든 HTTP 요청은 `Authorization: Bearer <token>` 헤더를 포함해야 하며, 불일치 시 401을 반환합니다.

이로써 같은 머신의 다른 프로세스가 browse 서버를 제어하는 것을 막습니다. 쿠키 선택기(`/cookie-picker`)와 헬스체크(`/health`)는 localhost 전용이며 명령 실행을 하지 않기 때문에 예외 처리됩니다.

### 쿠키 보안

쿠키는 gstack가 다루는 데이터 중 민감도가 가장 높습니다. 설계 원칙은 다음과 같습니다.

1. **키체인 접근은 사용자 승인 필요**: 브라우저별 첫 쿠키 가져오기 시 macOS Keychain 대화상자가 뜹니다. 사용자가 "허용" 또는 "항상 허용"을 눌러야 합니다.
2. **복호화는 프로세스 메모리 내부에서만**: 쿠키 값은 메모리에서 복호화(PBKDF2 + AES-128-CBC)되어 Playwright 세션에 로드되고 평문으로 디스크에 쓰지 않습니다.
3. **DB는 읽기 전용**: 브라우저가 사용하는 원본 쿠키 DB 잠금을 피하려고 임시 파일에 복사한 뒤 read-only로 엽니다. 원본 DB를 수정하지 않습니다.
4. **키 캐시는 세션 단위**: Keychain 비밀번호와 파생 AES 키는 서버 세션 생존 동안만 메모리에 유지됩니다. 서버 종료 시 함께 사라집니다.
5. **로그에 쿠키 값 미노출**: 콘솔/네트워크/다이얼로그 로그에 쿠키 값이 들어가지 않으며, `cookies` 출력도 메타데이터 중심이고 값은 잘립니다.

### 셸 인젝션 방지

브라우저 레지스트리(Comet, Chrome, Arc, Brave, Edge)는 하드코딩되어 있습니다. DB 경로도 알려진 상수 조합으로만 생성하며 사용자 입력으로 만들지 않습니다. Keychain 접근은 셸 문자열 보간 대신 인자 배열 기반 `Bun.spawn()`을 사용합니다.

## ref 시스템

Ref(`@e1`, `@e2`, `@c1`)는 CSS 셀렉터나 XPath를 직접 쓰지 않고 페이지 요소를 지정하는 방법입니다.

### 동작 방식

```
1. 에이전트 실행: $B snapshot -i
2. 서버가 Playwright page.accessibility.snapshot() 호출
3. 파서가 ARIA 트리를 순회하며 순차 ref 부여: @e1, @e2, @e3...
4. 각 ref마다 Playwright Locator 생성: getByRole(role, { name }).nth(index)
5. BrowserManager 인스턴스에 Map<string, Locator> 저장
6. 주석이 달린 트리를 plain text로 반환

이후:
7. 에이전트 실행: $B click @e3
8. 서버가 @e3 -> Locator -> locator.click() 순서로 실행
```

### DOM 변형 대신 Locator를 쓰는 이유

DOM에 `data-ref="@e1"`를 주입하는 방식은 다음에서 깨집니다.

- **CSP(Content Security Policy)**: 운영 환경 다수에서 스크립트 기반 DOM 수정이 차단됩니다.
- **React/Vue/Svelte hydration**: 프레임워크 재조정 과정에서 주입 속성이 제거될 수 있습니다.
- **Shadow DOM**: 외부에서 shadow root 내부 요소 접근이 제한됩니다.

Playwright Locator는 DOM 외부 메커니즘으로 접근성 트리와 `getByRole()` 쿼리를 사용합니다. DOM 변형이 없어 CSP, 프레임워크 충돌 리스크가 줄어듭니다.

### ref 라이프사이클

메인 프레임의 `framenavigated` 이벤트가 발생하면 ref를 비웁니다. 탐색 이후 기존 locator는 stale이므로 이 동작이 맞습니다. 에이전트는 `snapshot`을 다시 실행해 새 ref를 받아야 합니다. 잘못된 요소를 클릭하는 것보다 stale ref를 명확히 실패시키는 것이 설계 의도입니다.

### cursor-interactive ref (@c) 탐지

`-C` 플래그는 ARIA 트리에 나타나지 않지만 클릭 가능한 요소를 찾습니다. 예: `cursor: pointer`, `onclick` 속성, 커스텀 `tabindex`. 이 요소들에 별도 네임스페이스(`@c1`, `@c2`) ref를 부여합니다. `<div>`로 렌더링된 커스텀 버튼 컴포넌트 탐지에 유용합니다.

## 로깅 아키텍처

세 가지 링 버퍼(각 50,000개, O(1) push)를 사용합니다.

```
Browser events -> CircularBuffer (in-memory) -> Async flush to .gstack/*.log
```

콘솔, 네트워크, 다이얼로그 이벤트는 각각 독립 버퍼를 갖고 1초마다 비동기 flush합니다. 마지막 flush 이후 신규 항목만 append합니다.

효과:

- HTTP 요청 처리가 디스크 I/O에 막히지 않음
- 서버 크래시 시에도 로그가 남음(최대 1초 손실)
- 메모리 사용량 상한이 명확함(50K x 3)
- 디스크 파일은 append-only라 외부 도구에서 읽기 쉬움

`console`, `network`, `dialog` 명령은 디스크가 아니라 메모리 버퍼를 읽습니다. 디스크 파일은 사후 분석용입니다.

## SKILL.md 템플릿 시스템

### 문제

SKILL.md는 Claude에게 browse 명령 사용법을 알려줍니다. 문서가 실제 구현과 어긋나면 에이전트 오류가 발생합니다. 사람이 수동 관리하는 문서는 코드와 드리프트가 생기기 쉽습니다.

### 해결

```
SKILL.md.tmpl          (사람이 작성한 설명 + 플레이스홀더)
       ↓
gen-skill-docs.ts      (소스 코드 메타데이터 읽기)
       ↓
SKILL.md               (커밋되는 자동 생성 문서)
```

템플릿에는 워크플로우, 팁, 예시처럼 사람 판단이 필요한 내용만 둡니다. `{{COMMAND_REFERENCE}}`, `{{SNAPSHOT_FLAGS}}`는 빌드 시 `commands.ts`, `snapshot.ts`에서 채웁니다. 코드에 있는 명령은 문서에 나오고, 코드에 없는 명령은 문서에 못 나오게 구조적으로 보장합니다.

### 런타임 생성이 아니라 커밋하는 이유

1. **스킬 로드시 즉시 읽혀야 함**: 사용자가 `/browse`를 실행할 때 별도 빌드 단계를 기대할 수 없습니다.
2. **CI에서 최신성 검증 가능**: `gen:skill-docs --dry-run` + `git diff --exit-code`로 stale 문서를 merge 전에 차단합니다.
3. **Git 추적성**: 명령 추가 시점과 커밋 맥락을 `git blame`으로 확인할 수 있습니다.

### 테스트 계층

| Tier | 내용 | 비용 | 속도 |
|------|------|------|------|
| 1 - 정적 검증 | SKILL.md의 `$B` 명령 파싱 후 레지스트리 대조 | 무료 | <2초 |
| 2 - Agent SDK E2E | 실제 Claude 세션 생성 후 `/qa` 실행, 오류 점검 | 약 $0.50 | 약 60초 |
| 3 - LLM-as-judge | Haiku가 문서 명확성/완결성/실행가능성 평가 | 약 $0.03 | 약 10초 |

Tier 1은 매 `bun test`에서 실행하고, Tier 2/3은 env var로 게이트합니다. 무료 검증으로 대부분 이슈를 잡고, 판단이 필요한 영역에만 LLM 비용을 쓰는 전략입니다.

## 명령 디스패치

명령은 부작용 기준으로 분류됩니다.

- **READ** (`text`, `html`, `links`, `console`, `cookies`...): 상태 변경 없음, 재시도 안전, 페이지 상태 반환
- **WRITE** (`goto`, `click`, `fill`, `press`...): 페이지 상태 변경, 멱등 아님
- **META** (`snapshot`, `screenshot`, `tabs`, `chain`...): read/write로 깔끔히 분류되지 않는 서버 레벨 작업

분류는 단순 문서화가 아니라 실제 디스패치 로직에 사용됩니다.

```typescript
if (READ_COMMANDS.has(cmd))  -> handleReadCommand(cmd, args, bm)
if (WRITE_COMMANDS.has(cmd)) -> handleWriteCommand(cmd, args, bm)
if (META_COMMANDS.has(cmd))  -> handleMetaCommand(cmd, args, bm, shutdown)
```

`help` 명령은 세 집합을 모두 반환해서 에이전트가 가용 명령을 자가 탐색할 수 있게 합니다.

## 오류 철학

오류 메시지는 사람이 아니라 AI 에이전트가 바로 행동할 수 있어야 합니다.

- "Element not found" -> "요소를 찾지 못했거나 상호작용 불가입니다. `snapshot -i`로 사용 가능한 요소를 확인하세요."
- "Selector matched multiple elements" -> "여러 요소가 매칭되었습니다. `snapshot`의 @ref를 사용하세요."
- Timeout -> "30초 내 탐색 완료 실패. 페이지가 느리거나 URL이 잘못되었을 수 있습니다."

Playwright 원본 에러는 `wrapError()`에서 내부 스택을 제거하고 실행 가이드를 붙입니다. 사람이 개입하지 않아도 다음 행동을 결정할 수 있어야 합니다.

### 크래시 복구

서버는 self-heal을 시도하지 않습니다. Chromium이 크래시(`browser.on('disconnected')`)하면 서버는 즉시 종료합니다. CLI는 다음 명령에서 서버 종료를 감지하고 자동 재시작합니다. 반쯤 죽은 브라우저에 재연결하려는 복잡한 로직보다 단순하고 신뢰성이 높습니다.

## 의도적으로 넣지 않은 것

- **WebSocket 스트리밍 없음**: HTTP request/response가 단순하고 `curl`로 디버깅 가능하며 충분히 빠릅니다.
- **MCP 프로토콜 없음**: 요청마다 JSON schema 오버헤드와 지속 연결 요구가 있어, plain HTTP + plain text 대비 무겁습니다.
- **멀티유저 지원 없음**: 워크스페이스당 서버 1개, 사용자 1명 가정입니다. 토큰 인증은 다중 테넌시가 아니라 defense-in-depth입니다.
- **Windows/Linux 쿠키 복호화 없음**: 현재는 macOS Keychain만 지원합니다. Linux(GNOME Keyring/kwallet), Windows(DPAPI)는 구조적으로 가능하지만 미구현입니다.
- **iframe 지원 없음**: Playwright는 iframe을 다룰 수 있지만 ref 시스템은 아직 프레임 경계를 넘지 않습니다. 가장 많이 요청되는 미구현 항목입니다.
