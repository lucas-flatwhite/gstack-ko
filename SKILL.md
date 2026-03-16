---
name: gstack
version: 1.1.0
description: |
  gstack browse 모드. 지속형 헤드리스 브라우저로 QA 테스트, 사용자 플로우 검증,
  스크린샷/증거 수집, 상태 점검을 수행합니다.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Update Check (먼저 실행)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
```

출력이 `UPGRADE_AVAILABLE <old> <new>`이면 `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따릅니다.
`JUST_UPGRADED <from> <to>`이면 사용자에게 "gstack v{to}로 실행 중(방금 업데이트됨)"이라고 알리고 계속합니다.

# gstack browse: QA 테스트 및 도그푸딩

지속형 헤드리스 Chromium입니다. 첫 호출은 자동 시작(~3초), 이후 커맨드당 약 100ms입니다.
상태(쿠키, 탭, 로그인 세션)가 호출 간 유지됩니다.

## SETUP (browse 커맨드 전에 반드시 실행)

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && B="$_ROOT/.claude/skills/gstack/browse/dist/browse"
[ -z "$B" ] && B=~/.claude/skills/gstack/browse/dist/browse
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

`NEEDS_SETUP`인 경우:
1. 사용자에게 "gstack browse는 1회 빌드가 필요합니다(~10초). 진행할까요?"라고 묻고 대기합니다.
2. `cd <SKILL_DIR> && ./setup` 실행
3. `bun`이 없으면: `curl -fsSL https://bun.sh/install | bash` 실행

## 핵심 QA 패턴

### 사용자 플로우 검증

```bash
$B goto https://app.example.com/login
$B snapshot -i
$B fill @e3 "user@example.com"
$B fill @e4 "password"
$B click @e5
$B snapshot -D
$B is visible ".dashboard"
```

### 액션 전후 변화 검증

```bash
$B snapshot
$B click @e3
$B snapshot -D
```

### 버그 증거 수집

```bash
$B snapshot -i -a -o /tmp/annotated.png
$B screenshot /tmp/bug.png
$B console --errors
```

## 스냅샷 시스템

`snapshot`은 페이지를 이해하고 상호작용 대상을 찾는 핵심 도구입니다.

```
-i        --interactive           대화형 요소만(@e ref: 버튼/링크/입력)
-c        --compact               압축 출력(빈 구조 노드 제외)
-d <N>    --depth                 트리 깊이 제한 (0 = root만, 기본값: 무제한)
-s <sel>  --selector              CSS 셀렉터 범위로 제한
-D        --diff                  이전 snapshot 대비 unified diff(첫 호출은 기준선 저장)
-a        --annotate              ref 라벨이 포함된 주석 스크린샷
-o <path> --output                주석 스크린샷 출력 경로(기본: /tmp/browse-annotated.png)
-C        --cursor-interactive    cursor-interactive 요소(@c ref - pointer/onclick 요소)
```

플래그는 자유롭게 조합할 수 있습니다. `-o`는 `-a`를 함께 쓸 때만 유효합니다.
예시: `$B snapshot -i -a -C -o /tmp/annotated.png`

**Ref 번호 규칙:** @e ref는 트리 순서대로 순차 부여됩니다(@e1, @e2, ...).
`-C`에서 생성되는 @c ref는 별도 번호 체계를 사용합니다(@c1, @c2, ...).

snapshot 이후에는 @ref를 다른 명령의 셀렉터로 사용할 수 있습니다:
```bash
$B click @e3       $B fill @e4 "value"     $B hover @e1
$B html @e2        $B css @e5 "color"      $B attrs @e6
$B click @c1       # cursor-interactive ref (from -C)
```

**출력 형식:** 들여쓰기된 접근성 트리에 @ref ID가 붙으며 요소당 한 줄로 출력됩니다.
```
  @e1 [heading] "Welcome" [level=1]
  @e2 [textbox] "Email"
  @e3 [button] "Submit"
```

페이지 이동 후에는 ref가 무효화되므로 `goto` 뒤에는 `snapshot`을 다시 실행합니다.

## 커맨드 레퍼런스

### 탐색 (Navigation)
| 명령어 | 설명 |
|--------|------|
| `back` | 히스토리 뒤로 |
| `forward` | 히스토리 앞으로 |
| `goto <url>` | URL로 이동 |
| `reload` | 페이지 새로고침 |
| `url` | 현재 URL 출력 |

### 읽기 (Reading)
| 명령어 | 설명 |
|--------|------|
| `accessibility` | 전체 ARIA 트리 |
| `forms` | 폼 필드를 JSON으로 출력 |
| `html [selector]` | selector의 innerHTML(없으면 에러), selector 미지정 시 전체 HTML |
| `links` | 모든 링크를 "텍스트 → href" 형식으로 출력 |
| `text` | 정리된 페이지 텍스트 |

### 상호작용 (Interaction)
| 명령어 | 설명 |
|--------|------|
| `click <sel>` | 요소 클릭 |
| `cookie <name>=<value>` | 현재 페이지 도메인에 쿠키 설정 |
| `cookie-import <json>` | JSON 파일에서 쿠키 가져오기 |
| `cookie-import-browser [browser] [--domain d]` | Comet/Chrome/Arc/Brave/Edge에서 쿠키 가져오기(선택기 또는 --domain 직접 지정) |
| `dialog-accept [text]` | 다음 alert/confirm/prompt를 자동 수락(선택 텍스트는 prompt 응답으로 사용) |
| `dialog-dismiss` | 다음 다이얼로그 자동 취소 |
| `fill <sel> <val>` | 입력 요소 채우기 |
| `header <name>:<value>` | 커스텀 요청 헤더 설정(콜론 구분, 민감값 자동 마스킹) |
| `hover <sel>` | 요소 hover |
| `press <key>` | 키 입력(Enter/Tab/Escape/화살표/Backspace/Delete/Home/End/PageUp/PageDown/Shift+Enter 등) |
| `scroll [sel]` | 요소를 화면에 보이게 스크롤, selector 없으면 페이지 하단으로 스크롤 |
| `select <sel> <val>` | 드롭다운 값을 value/label/표시 텍스트로 선택 |
| `type <text>` | 포커스된 요소에 텍스트 입력 |
| `upload <sel> <file> [file2...]` | 파일 업로드 |
| `useragent <string>` | User-Agent 설정 |
| `viewport <WxH>` | 뷰포트 크기 설정 |
| `wait <sel|--networkidle|--load>` | 요소/네트워크 idle/페이지 로드를 대기(타임아웃 15초) |

### 검사 (Inspection)
| 명령어 | 설명 |
|--------|------|
| `attrs <sel|@ref>` | 요소 속성을 JSON으로 출력 |
| `console [--clear|--errors]` | 콘솔 메시지(--errors로 error/warning만 필터) |
| `cookies` | 모든 쿠키를 JSON으로 출력 |
| `css <sel> <prop>` | 계산된 CSS 값 |
| `dialog [--clear]` | 다이얼로그 메시지 |
| `eval <file>` | 파일의 JavaScript를 실행하고 결과를 문자열로 반환(경로는 /tmp 또는 cwd 하위) |
| `is <prop> <sel>` | 상태 검사(visible/hidden/enabled/disabled/checked/editable/focused) |
| `js <expr>` | JavaScript 표현식을 실행하고 결과를 문자열로 반환 |
| `network [--clear]` | 네트워크 요청 |
| `perf` | 페이지 로드 타이밍 |
| `storage [set k v]` | localStorage + sessionStorage 읽기(JSON), 또는 set <key> <value>로 localStorage 쓰기 |

### 시각 (Visual)
| 명령어 | 설명 |
|--------|------|
| `diff <url1> <url2>` | 두 페이지 간 텍스트 diff |
| `pdf [path]` | PDF로 저장 |
| `responsive [prefix]` | 모바일/태블릿/데스크톱 스크린샷 저장({prefix}-mobile.png 등) |
| `screenshot [path]` | 스크린샷 저장 |

### 스냅샷 (Snapshot)
| 명령어 | 설명 |
|--------|------|
| `snapshot [flags]` | 요소 선택용 @e ref가 포함된 접근성 트리. 플래그: -i, -c, -d N, -s sel, -D, -a, -o path, -C |

### 메타 (Meta)
| 명령어 | 설명 |
|--------|------|
| `chain` | JSON stdin에서 명령 배치 실행. 형식: [["cmd","arg1",...],...] |

### 탭 (Tabs)
| 명령어 | 설명 |
|--------|------|
| `closetab [id]` | 탭 닫기 |
| `newtab [url]` | 새 탭 열기 |
| `tab <id>` | 탭 전환 |
| `tabs` | 열린 탭 목록 |

### 서버 (Server)
| 명령어 | 설명 |
|--------|------|
| `restart` | 서버 재시작 |
| `status` | 헬스 체크 |
| `stop` | 서버 종료 |

## 운영 팁

- 상호작용 직후 `console --errors`를 습관적으로 확인합니다.
- 접근성 트리에서 놓치는 클릭 가능한 div 탐색은 `snapshot -C`를 사용합니다.
- 재현/보고 품질을 위해 스크린샷은 `/tmp` 또는 프로젝트 내 경로에 저장합니다.
