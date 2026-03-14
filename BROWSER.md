# Browser — 기술 세부사항

이 문서는 gstack 헤드리스 브라우저의 커맨드 레퍼런스와 내부 구조를 다룹니다.

## 커맨드 레퍼런스

| 카테고리 | 커맨드 | 용도 |
|----------|--------|------|
| 탐색 | `goto`, `back`, `forward`, `reload`, `url` | 페이지 이동 |
| 읽기 | `text`, `html`, `links`, `forms`, `accessibility` | 콘텐츠 추출 |
| 스냅샷 | `snapshot [-i] [-c] [-d N] [-s sel] [-D] [-a] [-o] [-C]` | ref 얻기, diff, 주석 달기 |
| 상호작용 | `click`, `fill`, `select`, `hover`, `type`, `press`, `scroll`, `wait`, `viewport`, `upload` | 페이지 사용 |
| 검사 | `js`, `eval`, `css`, `attrs`, `is`, `console`, `network`, `dialog`, `cookies`, `storage`, `perf` | 디버그 및 검증 |
| 시각 | `screenshot`, `pdf`, `responsive` | Claude가 보는 것 확인 |
| 비교 | `diff <url1> <url2>` | 환경 간 차이점 발견 |
| 다이얼로그 | `dialog-accept [text]`, `dialog-dismiss` | alert/confirm/prompt 처리 제어 |
| 탭 | `tabs`, `tab`, `newtab`, `closetab` | 멀티 페이지 워크플로우 |
| 쿠키 | `cookie-import`, `cookie-import-browser` | 파일 또는 실제 브라우저에서 쿠키 가져오기 |
| 멀티 스텝 | `chain` (stdin에서 JSON) | 하나의 호출로 커맨드 배치 처리 |

모든 셀렉터 인수는 CSS 셀렉터, `snapshot` 후의 `@e` ref, 또는 `snapshot -C` 후의 `@c` ref를 허용합니다. 총 50+ 커맨드 및 쿠키 가져오기 기능.

## 작동 방식

gstack의 브라우저는 HTTP를 통해 지속적인 로컬 Chromium 데몬과 통신하는 컴파일된 CLI 바이너리입니다. CLI는 씬 클라이언트로 — 상태 파일을 읽고, 커맨드를 전송하고, 응답을 stdout으로 출력합니다. 실제 작업은 [Playwright](https://playwright.dev/)를 통해 서버가 수행합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Code                                                    │
│                                                                 │
│  "browse goto https://staging.myapp.com"                        │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐    HTTP POST     ┌──────────────┐                 │
│  │ browse   │ ──────────────── │ Bun HTTP     │                 │
│  │ CLI      │  localhost:9400  │ server       │                 │
│  │          │  Bearer token    │              │                 │
│  │ compiled │ ◄──────────────  │  Playwright  │──── Chromium    │
│  │ binary   │  plain text      │  API calls   │    (headless)   │
│  └──────────┘                  └──────────────┘                 │
│   ~1ms 시작                      지속적인 데몬                   │
│                                 첫 번째 호출 시 자동 시작        │
│                                 유휴 30분 후 자동 종료           │
└─────────────────────────────────────────────────────────────────┘
```

### 라이프사이클

1. **첫 번째 호출**: CLI가 실행 중인 서버를 위해 `/tmp/browse-server.json`을 확인합니다. 없으면 백그라운드에서 `bun run browse/src/server.ts`를 생성합니다. 서버는 Playwright를 통해 헤드리스 Chromium을 실행하고, 포트(9400-9410)를 선택하고, bearer 토큰을 생성하고, 상태 파일을 작성하고, HTTP 요청을 받기 시작합니다. 약 3초가 소요됩니다.

2. **이후 호출**: CLI가 상태 파일을 읽고, bearer 토큰과 함께 HTTP POST를 전송하고, 응답을 출력합니다. 약 100-200ms 왕복.

3. **유휴 종료**: 30분간 커맨드가 없으면 서버가 종료되고 상태 파일을 정리합니다. 다음 호출 시 자동으로 재시작합니다.

4. **충돌 복구**: Chromium이 충돌하면 서버가 즉시 종료합니다(자가 치유 없음 — 실패를 숨기지 않음). CLI는 다음 호출 시 죽은 서버를 감지하고 새로 시작합니다.

### 주요 컴포넌트

```
browse/
├── src/
│   ├── cli.ts              # 씬 클라이언트 — 상태 파일 읽기, HTTP 전송, 응답 출력
│   ├── server.ts           # Bun.serve HTTP 서버 — 커맨드를 Playwright로 라우팅
│   ├── browser-manager.ts  # Chromium 라이프사이클 — 시작, 탭, ref 맵, 충돌 처리
│   ├── snapshot.ts         # 접근성 트리 → @ref 할당 → Locator 맵 + diff/annotate/-C
│   ├── read-commands.ts    # 비변형 커맨드 (text, html, links, js, css, is, dialog 등)
│   ├── write-commands.ts   # 변형 커맨드 (click, fill, select, upload, dialog-accept 등)
│   ├── meta-commands.ts    # 서버 관리, chain, diff, snapshot 라우팅
│   ├── cookie-import-browser.ts  # macOS 키체인 + PBKDF2/AES-128-CBC로 Chromium 쿠키 복호화 및 가져오기
│   ├── cookie-picker-routes.ts   # /cookie-picker/* HTTP 라우트
│   ├── cookie-picker-ui.ts       # 대화형 쿠키 선택기 자체 포함 HTML 생성기
│   └── buffers.ts          # CircularBuffer<T> + 콘솔/네트워크/다이얼로그 캡처 및 비동기 디스크 플러시
├── test/                   # 통합 테스트 + HTML 픽스처
└── dist/
    └── browse              # 컴파일된 바이너리 (~58MB, Bun --compile)
```

### 스냅샷 시스템

브라우저의 핵심 혁신은 Playwright의 접근성 트리 API를 기반으로 구축된 ref 기반 요소 선택입니다:

1. `page.locator(scope).ariaSnapshot()`이 YAML과 유사한 접근성 트리를 반환합니다
2. 스냅샷 파서가 각 요소에 ref(`@e1`, `@e2`, ...)를 할당합니다
3. 각 ref에 대해 Playwright `Locator`를 빌드합니다 (`getByRole` + nth-child 사용)
4. ref-to-Locator 맵이 `BrowserManager`에 저장됩니다
5. `click @e3`과 같은 이후 커맨드는 Locator를 조회하고 `locator.click()`을 호출합니다

DOM 변형 없음. 주입된 스크립트 없음. Playwright의 네이티브 접근성 API만 사용.

**확장 스냅샷 기능:**
- `--diff` (`-D`): 각 스냅샷을 기준선으로 저장합니다. 다음 `-D` 호출 시 변경된 내용을 보여주는 unified diff를 반환합니다. 액션(클릭, 채우기 등)이 실제로 동작했는지 확인하는 데 사용합니다.
- `--annotate` (`-a`): 각 ref의 경계 상자에 임시 오버레이 div를 삽입하고, ref 레이블이 보이는 스크린샷을 찍은 후 오버레이를 제거합니다. 출력 경로 제어를 위해 `-o <path>`를 사용합니다.
- `--cursor-interactive` (`-C`): `page.evaluate`를 사용하여 비 ARIA 대화형 요소(div with `cursor:pointer`, `onclick`, `tabindex>=0`)를 스캔합니다. 결정론적 `nth-child` CSS 셀렉터로 `@c1`, `@c2`... ref를 할당합니다. ARIA 트리가 놓치지만 사용자가 클릭할 수 있는 요소들입니다.

### 인증

각 서버 세션은 bearer 토큰으로 랜덤 UUID를 생성합니다. 토큰은 chmod 600으로 상태 파일(`/tmp/browse-server.json`)에 기록됩니다. 모든 HTTP 요청에 `Authorization: Bearer <token>`을 포함해야 합니다. 이로 인해 머신의 다른 프로세스가 브라우저를 제어하는 것을 방지합니다.

### 콘솔, 네트워크, 다이얼로그 캡처

서버는 Playwright의 `page.on('console')`, `page.on('response')`, `page.on('dialog')` 이벤트에 훅을 걸습니다. 모든 항목은 O(1) 원형 버퍼(각 50,000 용량)에 유지되고 `Bun.write()`를 통해 디스크에 비동기로 플러시됩니다:

- 콘솔: `/tmp/browse-console.log`
- 네트워크: `/tmp/browse-network.log`
- 다이얼로그: `/tmp/browse-dialog.log`

`console`, `network`, `dialog` 커맨드는 디스크가 아닌 인메모리 버퍼에서 읽습니다.

### 다이얼로그 처리

다이얼로그(alert, confirm, prompt)는 브라우저 잠금을 방지하기 위해 기본적으로 자동 수락됩니다. `dialog-accept`와 `dialog-dismiss` 커맨드로 이 동작을 제어합니다. 프롬프트의 경우 `dialog-accept <text>`가 응답 텍스트를 제공합니다. 모든 다이얼로그는 유형, 메시지, 취해진 액션과 함께 다이얼로그 버퍼에 기록됩니다.

### 멀티 작업공간 지원

각 작업공간은 자체 Chromium 프로세스, 탭, 쿠키, 로그를 갖는 격리된 브라우저 인스턴스를 받습니다.

`CONDUCTOR_PORT`가 설정된 경우 (예: [Conductor](https://conductor.dev)에 의해), browse 포트는 결정론적으로 파생됩니다:

```
browse_port = CONDUCTOR_PORT - 45600
```

| 작업공간 | CONDUCTOR_PORT | Browse 포트 | 상태 파일 |
|---------|---------------|-------------|----------|
| 작업공간 A | 55040 | 9440 | `/tmp/browse-server-9440.json` |
| 작업공간 B | 55041 | 9441 | `/tmp/browse-server-9441.json` |
| Conductor 없음 | — | 9400 (스캔) | `/tmp/browse-server.json` |

`BROWSE_PORT`를 직접 설정할 수도 있습니다.

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `BROWSE_PORT` | 0 (자동 스캔 9400-9410) | HTTP 서버 고정 포트 |
| `CONDUCTOR_PORT` | — | 설정 시 browse 포트 = 이 값 - 45600 |
| `BROWSE_IDLE_TIMEOUT` | 1800000 (30분) | 유휴 종료 타임아웃 (밀리초) |
| `BROWSE_STATE_FILE` | `/tmp/browse-server.json` | 상태 파일 경로 |
| `BROWSE_SERVER_SCRIPT` | 자동 감지 | server.ts 경로 |

### 성능

| 도구 | 첫 번째 호출 | 이후 호출 | 호출당 컨텍스트 오버헤드 |
|------|------------|----------|----------------------|
| Chrome MCP | ~5s | ~2-5s | ~2000 토큰 (스키마 + 프로토콜) |
| Playwright MCP | ~3s | ~1-3s | ~1500 토큰 (스키마 + 프로토콜) |
| **gstack browse** | **~3s** | **~100-200ms** | **0 토큰** (plain text stdout) |

컨텍스트 오버헤드 차이는 빠르게 누적됩니다. 20개 커맨드 브라우저 세션에서 MCP 도구는 프로토콜 프레이밍만으로 30,000-40,000 토큰을 소비합니다. gstack은 0입니다.

### MCP 대신 CLI를 사용하는 이유?

MCP(Model Context Protocol)는 원격 서비스에 잘 작동하지만, 로컬 브라우저 자동화에는 순수한 오버헤드만 추가합니다:

- **컨텍스트 팽창**: 모든 MCP 호출에 전체 JSON 스키마와 프로토콜 프레이밍이 포함됩니다. "페이지 텍스트 가져오기" 같은 간단한 작업이 필요 이상으로 10배 더 많은 컨텍스트 토큰을 소비합니다.
- **연결 취약성**: 지속적인 WebSocket/stdio 연결이 끊기고 재연결에 실패합니다.
- **불필요한 추상화**: Claude Code에는 이미 Bash 도구가 있습니다. stdout으로 출력하는 CLI가 가장 간단한 인터페이스입니다.

gstack은 이 모든 것을 건너뜁니다. 컴파일된 바이너리. 일반 텍스트 입력, 일반 텍스트 출력. 프로토콜 없음. 스키마 없음. 연결 관리 없음.

## 감사의 말

브라우저 자동화 레이어는 Microsoft의 [Playwright](https://playwright.dev/)를 기반으로 구축되었습니다. Playwright의 접근성 트리 API, locator 시스템, 헤드리스 Chromium 관리가 ref 기반 상호작용을 가능하게 합니다. 접근성 트리 노드에 `@ref` 레이블을 할당하고 Playwright Locator로 다시 매핑하는 스냅샷 시스템은 Playwright의 기본 요소 위에 완전히 구축되었습니다. Playwright 팀에 감사드립니다.

## 개발

### 사전 요구사항

- [Bun](https://bun.sh/) v1.0+
- Playwright의 Chromium (`bun install`로 자동 설치)

### 빠른 시작

```bash
bun install              # 의존성 + Playwright Chromium 설치
bun test                 # 통합 테스트 실행 (~3s)
bun run dev <cmd>        # 소스에서 CLI 실행 (컴파일 없음)
bun run build            # browse/dist/browse로 컴파일
```

### 개발 모드 vs 컴파일된 바이너리

개발 중에는 컴파일된 바이너리 대신 `bun run dev`를 사용하세요. Bun으로 `browse/src/cli.ts`를 직접 실행하므로 컴파일 단계 없이 즉각적인 피드백을 얻을 수 있습니다:

```bash
bun run dev goto https://example.com
bun run dev text
bun run dev snapshot -i
bun run dev click @e3
```

컴파일된 바이너리(`bun run build`)는 배포용으로만 필요합니다. Bun의 `--compile` 플래그를 사용하여 `browse/dist/browse`에 단일 ~58MB 실행 파일을 생성합니다.

### 테스트 실행

```bash
bun test                         # 모든 테스트 실행
bun test browse/test/commands              # 커맨드 통합 테스트만 실행
bun test browse/test/snapshot              # 스냅샷 테스트만 실행
bun test browse/test/cookie-import-browser # 쿠키 가져오기 단위 테스트만 실행
```

테스트는 로컬 HTTP 서버(`browse/test/test-server.ts`)를 실행하여 `browse/test/fixtures/`의 HTML 픽스처를 제공하고, 해당 페이지들에 대해 CLI 커맨드를 실행합니다. 3개 파일에 걸쳐 203개 테스트, 총 약 15초.

### 소스 맵

| 파일 | 역할 |
|------|------|
| `browse/src/cli.ts` | 진입점. `/tmp/browse-server.json` 읽기, 서버에 HTTP 전송, 응답 출력. |
| `browse/src/server.ts` | Bun HTTP 서버. 커맨드를 올바른 핸들러로 라우팅. 유휴 타임아웃 관리. |
| `browse/src/browser-manager.ts` | Chromium 라이프사이클 — 시작, 탭 관리, ref 맵, 충돌 감지. |
| `browse/src/snapshot.ts` | 접근성 트리 파싱, `@e`/`@c` ref 할당, Locator 맵 빌드. `--diff`, `--annotate`, `-C` 처리. |
| `browse/src/read-commands.ts` | 비변형 커맨드: `text`, `html`, `links`, `js`, `css`, `is`, `dialog`, `forms` 등. `getCleanText()` 내보내기. |
| `browse/src/write-commands.ts` | 변형 커맨드: `goto`, `click`, `fill`, `upload`, `dialog-accept`, `useragent` (컨텍스트 재생성 포함) 등. |
| `browse/src/meta-commands.ts` | 서버 관리, chain 라우팅, diff (DRY via `getCleanText`), snapshot 위임. |
| `browse/src/cookie-import-browser.ts` | macOS 키체인 + PBKDF2/AES-128-CBC를 통한 Chromium 쿠키 복호화. 설치된 브라우저 자동 감지. |
| `browse/src/cookie-picker-routes.ts` | `/cookie-picker/*` HTTP 라우트 — 브라우저 목록, 도메인 검색, 가져오기, 제거. |
| `browse/src/cookie-picker-ui.ts` | 대화형 쿠키 선택기를 위한 자체 포함 HTML 생성기 (다크 테마, 프레임워크 없음). |
| `browse/src/buffers.ts` | `CircularBuffer<T>` (O(1) 링 버퍼) + 비동기 디스크 플러시를 통한 콘솔/네트워크/다이얼로그 캡처. |

### 활성 스킬에 배포

활성 스킬은 `~/.claude/skills/gstack/`에 있습니다. 변경 후:

1. 브랜치 푸시
2. 스킬 디렉토리에서 풀: `cd ~/.claude/skills/gstack && git pull`
3. 재빌드: `cd ~/.claude/skills/gstack && bun run build`

또는 바이너리를 직접 복사: `cp browse/dist/browse ~/.claude/skills/gstack/browse/dist/browse`

### 새 커맨드 추가

1. `read-commands.ts` (비변형) 또는 `write-commands.ts` (변형)에 핸들러 추가
2. `server.ts`에 라우트 등록
3. 필요한 경우 HTML 픽스처와 함께 `browse/test/commands.test.ts`에 테스트 케이스 추가
4. `bun test`로 검증
5. `bun run build`로 컴파일
