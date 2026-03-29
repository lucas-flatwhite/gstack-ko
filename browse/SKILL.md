---
name: browse
version: 1.1.0
description: |
  QA 테스트와 사이트 dogfooding을 위한 빠른 headless 브라우저. 모든 URL 탐색, 요소 조작,
  페이지 상태 검증, 액션 전후 diff, 주석 달린 스크린샷, 반응형 레이아웃 확인,
  폼 및 파일 업로드 테스트, 다이얼로그 처리, 요소 상태 assertion.
  명령당 ~100ms. 기능 테스트, 배포 검증, 사용자 플로우 dogfood, 또는 근거가 있는 버그 보고서 작성 시 사용.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion

---

> Reference-only note: 이 저장소에는 `browse` 바이너리와 실행 코드는 없습니다. 아래 워크플로우는 upstream `garrytan/gstack` 설치본을 기준으로 한 한국어 설명입니다.

## Preamble (먼저 실행)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/gstack/bin/gstack-config get gstack_contributor 2>/dev/null || true)
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
```

출력에 `UPGRADE_AVAILABLE <old> <new>`가 표시되면: `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따르세요 (자동 업그레이드가 설정된 경우 자동으로 진행, 그렇지 않으면 4가지 옵션으로 AskUserQuestion, 거부 시 snooze 상태 저장). `JUST_UPGRADED <from> <to>`가 표시되면: 사용자에게 "gstack v{to} 실행 중 (방금 업데이트됨!)"이라고 알리고 계속 진행합니다.

## AskUserQuestion 형식

**모든 AskUserQuestion 호출 시 반드시 이 구조를 따르세요:**
1. **상황 재확인:** 프로젝트, 현재 branch (preamble에서 출력된 `_BRANCH` 값 사용 — 대화 기록이나 gitStatus의 branch 사용 금지), 현재 계획/작업을 명시합니다. (1-2 문장)
2. **단순화:** 영리한 16세도 이해할 수 있는 평이한 언어로 문제를 설명합니다. 함수명, 내부 전문 용어, 구현 세부사항은 사용하지 않습니다. 구체적인 예시와 비유를 사용합니다. 무엇이라 불리는지가 아닌 무엇을 하는지를 설명합니다.
3. **추천:** `RECOMMENDATION: [X]를 선택하세요. 이유: [한 줄 설명]`
4. **옵션:** 알파벳 옵션: `A) ... B) ... C) ...`

사용자가 20분 동안 이 창을 보지 않았고 코드를 열지 않은 상태라고 가정하세요. 설명을 이해하기 위해 소스를 읽어야 한다면 너무 복잡한 것입니다.

스킬별 지침에서 이 기본 형식 위에 추가 형식 규칙을 추가할 수 있습니다.

## Contributor Mode

`_CONTRIB`가 `true`인 경우: **contributor mode**입니다. 당신은 gstack을 개선하는 데 도움을 주는 gstack 사용자입니다.

**모든 주요 워크플로우 단계가 끝날 때마다** (매 명령 후가 아닌), 사용한 gstack 도구를 되돌아보세요. 0~10점으로 경험을 평가하세요. 10점이 아니라면 이유를 생각해보세요. gstack 코드나 skill 마크다운이 더 잘할 수 있었던 명확하고 실행 가능한 버그나 흥미로운 개선점이 있다면 — field report를 제출하세요. 우리 contributor가 gstack을 더 좋게 만드는 데 도움을 줄 수 있습니다!

**기준 — 이것이 기준선입니다:** 예를 들어, `$B js "await fetch(...)"` 는 gstack이 비동기 컨텍스트로 표현식을 감싸지 않아 `SyntaxError: await is only valid in async functions`로 실패했습니다. 작은 문제지만 입력이 합리적이었고 gstack이 처리했어야 했습니다 — 이런 것이 제출할 가치가 있는 것입니다. 이보다 덜 중요한 것은 무시하세요.

**제출하지 않아도 될 것:** 사용자 앱 버그, 사용자 URL에 대한 네트워크 오류, 사용자 사이트의 인증 실패, 사용자 자신의 JS 로직 버그.

**제출 방법:** `~/.gstack/contributor-logs/{slug}.md`에 **아래 모든 섹션을 포함하여** 작성합니다 (잘라내지 말 것 — Date/Version 푸터까지 모든 섹션 포함):

```
# {Title}

Hey gstack team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what gstack should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {gstack version} | **Skill:** /{skill}
```

Slug: 소문자, 하이픈 사용, 최대 60자 (예: `browse-js-no-await`). 파일이 이미 존재하면 건너뜁니다. 세션당 최대 3개 보고서. 인라인으로 제출하고 계속 진행 — 워크플로우를 중단하지 마세요. 사용자에게 알립니다: "Filed gstack field report: {title}"

# browse: QA 테스트 & Dogfooding

지속적인 headless Chromium. 첫 번째 호출 시 자동 시작 (~3초), 이후 명령당 ~100ms.
상태는 호출 간 유지됩니다 (cookie, 탭, 로그인 세션).

## SETUP (browse 명령 전에 반드시 이 확인 실행)

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
1. 사용자에게 안내합니다: "gstack browse는 최초 1회 빌드가 필요합니다 (~10초). 진행할까요?" 그런 다음 STOP하고 기다립니다.
2. 실행: `cd <SKILL_DIR> && ./setup`
3. `bun`이 설치되지 않은 경우: `curl -fsSL https://bun.sh/install | bash`

## 핵심 QA 패턴

### 1. 페이지가 올바르게 로드되는지 확인
```bash
$B goto https://yourapp.com
$B text                          # 컨텐츠 로드 확인?
$B console                       # JS 오류?
$B network                       # 실패한 요청?
$B is visible ".main-content"    # 핵심 요소 존재?
```

### 2. 사용자 플로우 테스트
```bash
$B goto https://app.com/login
$B snapshot -i                   # 모든 인터랙티브 요소 확인
$B fill @e3 "user@test.com"
$B fill @e4 "password"
$B click @e5                     # 제출
$B snapshot -D                   # diff: 제출 후 무엇이 변경되었나?
$B is visible ".dashboard"       # 성공 상태 존재?
```

### 3. 액션이 작동했는지 확인
```bash
$B snapshot                      # 기준선
$B click @e3                     # 무언가 실행
$B snapshot -D                   # unified diff로 정확히 변경된 것 표시
```

### 4. 버그 보고서를 위한 시각적 근거
```bash
$B snapshot -i -a -o /tmp/annotated.png   # 레이블이 달린 스크린샷
$B screenshot /tmp/bug.png                # 일반 스크린샷
$B console                                # 오류 로그
```

### 5. 모든 클릭 가능한 요소 찾기 (ARIA가 아닌 것 포함)
```bash
$B snapshot -C                   # cursor:pointer, onclick, tabindex가 있는 div 찾기
$B click @c1                     # 조작
```

### 6. 요소 상태 assertion
```bash
$B is visible ".modal"
$B is enabled "#submit-btn"
$B is disabled "#submit-btn"
$B is checked "#agree-checkbox"
$B is editable "#name-field"
$B is focused "#search-input"
$B js "document.body.textContent.includes('Success')"
```

### 7. 반응형 레이아웃 테스트
```bash
$B responsive /tmp/layout        # 모바일 + 태블릿 + 데스크탑 스크린샷
$B viewport 375x812              # 또는 특정 viewport 설정
$B screenshot /tmp/mobile.png
```

### 8. 파일 업로드 테스트
```bash
$B upload "#file-input" /path/to/file.pdf
$B is visible ".upload-success"
```

### 9. 다이얼로그 테스트
```bash
$B dialog-accept "yes"           # 핸들러 설정
$B click "#delete-button"        # 다이얼로그 트리거
$B dialog                        # 표시된 것 확인
$B snapshot -D                   # 삭제 완료 확인
```

### 10. 환경 비교
```bash
$B diff https://staging.app.com https://prod.app.com
```

## Snapshot 플래그

snapshot은 페이지를 이해하고 조작하는 주요 도구입니다.

```
-i        --interactive           인터랙티브 요소만 (버튼, 링크, 입력) @e ref 포함
-c        --compact               컴팩트 (빈 구조 노드 제외)
-d <N>    --depth                 트리 깊이 제한 (0 = 루트만, 기본값: 무제한)
-s <sel>  --selector              CSS 선택자로 범위 지정
-D        --diff                  이전 snapshot에 대한 unified diff (첫 번째 호출이 기준선 저장)
-a        --annotate              빨간 오버레이 박스와 ref 레이블이 달린 스크린샷
-o <path> --output                주석 달린 스크린샷 출력 경로 (기본값: /tmp/browse-annotated.png)
-C        --cursor-interactive    Cursor-interactive 요소 (@c ref — pointer, onclick이 있는 div)
```

모든 플래그는 자유롭게 조합 가능합니다. `-o`는 `-a`와 함께 사용할 때만 적용됩니다.
예시: `$B snapshot -i -a -C -o /tmp/annotated.png`

**Ref 번호 매기기:** @e ref는 트리 순서대로 순차적으로 할당됩니다 (@e1, @e2, ...).
`-C`의 @c ref는 별도로 번호가 매겨집니다 (@c1, @c2, ...).

snapshot 후 @ref를 모든 명령의 선택자로 사용합니다:
```bash
$B click @e3       $B fill @e4 "value"     $B hover @e1
$B html @e2        $B css @e5 "color"      $B attrs @e6
$B click @c1       # cursor-interactive ref (-C에서)
```

**출력 형식:** @ref ID가 있는 들여쓰기된 접근성 트리, 줄당 하나의 요소.
```
  @e1 [heading] "Welcome" [level=1]
  @e2 [textbox] "Email"
  @e3 [button] "Submit"
```

Ref는 탐색 시 무효화됩니다 — `goto` 후 `snapshot`을 다시 실행합니다.

## 전체 명령 목록

### 탐색
| 명령 | 설명 |
|---------|-------------|
| `back` | 뒤로 이동 |
| `forward` | 앞으로 이동 |
| `goto <url>` | URL로 이동 |
| `reload` | 페이지 새로고침 |
| `url` | 현재 URL 출력 |

### 읽기
| 명령 | 설명 |
|---------|-------------|
| `accessibility` | 전체 ARIA 트리 |
| `forms` | JSON으로 폼 필드 |
| `html [selector]` | 선택자의 innerHTML (찾을 수 없으면 오류), 선택자 없으면 전체 페이지 HTML |
| `links` | 모든 링크를 "텍스트 → href" 형식으로 |
| `text` | 정리된 페이지 텍스트 |

### 조작
| 명령 | 설명 |
|---------|-------------|
| `click <sel>` | 요소 클릭 |
| `cookie <name>=<value>` | 현재 페이지 도메인에 cookie 설정 |
| `cookie-import <json>` | JSON 파일에서 cookie 가져오기 |
| `cookie-import-browser [browser] [--domain d]` | Comet, Chrome, Arc, Brave, 또는 Edge에서 cookie 가져오기 (picker 열기, 또는 직접 가져오기에 --domain 사용) |
| `dialog-accept [text]` | 다음 alert/confirm/prompt 자동 수락. 선택적 텍스트는 prompt 응답으로 전송 |
| `dialog-dismiss` | 다음 다이얼로그 자동 거부 |
| `fill <sel> <val>` | 입력 채우기 |
| `header <name>:<value>` | 사용자 정의 요청 헤더 설정 (콜론 구분, 민감한 값 자동 리다이렉션) |
| `hover <sel>` | 요소 호버 |
| `press <key>` | 키 누르기 — Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, Delete, Home, End, PageUp, PageDown, 또는 Shift+Enter 같은 수식어 |
| `scroll [sel]` | 요소를 뷰로 스크롤, 또는 선택자 없으면 페이지 하단으로 스크롤 |
| `select <sel> <val>` | 값, 레이블, 또는 보이는 텍스트로 드롭다운 옵션 선택 |
| `type <text>` | 포커스된 요소에 입력 |
| `upload <sel> <file> [file2...]` | 파일 업로드 |
| `useragent <string>` | user agent 설정 |
| `viewport <WxH>` | viewport 크기 설정 |
| `wait <sel|--networkidle|--load>` | 요소, 네트워크 유휴, 또는 페이지 로드 대기 (타임아웃: 15초) |

### 검사
| 명령 | 설명 |
|---------|-------------|
| `attrs <sel|@ref>` | JSON으로 요소 속성 |
| `console [--clear|--errors]` | Console 메시지 (--errors는 error/warning으로 필터링) |
| `cookies` | JSON으로 모든 cookie |
| `css <sel> <prop>` | 계산된 CSS 값 |
| `dialog [--clear]` | 다이얼로그 메시지 |
| `eval <file>` | 파일에서 JavaScript 실행하고 결과를 문자열로 반환 (경로는 /tmp 또는 cwd 아래여야 함) |
| `is <prop> <sel>` | 상태 확인 (visible/hidden/enabled/disabled/checked/editable/focused) |
| `js <expr>` | JavaScript 표현식 실행하고 결과를 문자열로 반환 |
| `network [--clear]` | 네트워크 요청 |
| `perf` | 페이지 로드 타이밍 |
| `storage [set k v]` | 모든 localStorage + sessionStorage를 JSON으로 읽기, 또는 localStorage를 쓰기 위해 <key> <value> 설정 |

### 시각
| 명령 | 설명 |
|---------|-------------|
| `diff <url1> <url2>` | 페이지 간 텍스트 diff |
| `pdf [path]` | PDF로 저장 |
| `responsive [prefix]` | 모바일 (375x812), 태블릿 (768x1024), 데스크탑 (1280x720) 스크린샷. {prefix}-mobile.png 등으로 저장 |
| `screenshot [--viewport] [--clip x,y,w,h] [selector|@ref] [path]` | 스크린샷 저장 (CSS/@ref로 요소 크롭, --clip 영역, --viewport 지원) |

### Snapshot
| 명령 | 설명 |
|---------|-------------|
| `snapshot [flags]` | 요소 선택을 위한 @e ref가 있는 접근성 트리. 플래그: -i 인터랙티브만, -c 컴팩트, -d N 깊이 제한, -s sel 범위, -D 이전과 diff, -a 주석 달린 스크린샷, -o path 출력, -C cursor-interactive @c ref |

### Meta
| 명령 | 설명 |
|---------|-------------|
| `chain` | JSON stdin에서 명령 실행. 형식: [["cmd","arg1",...],...] |

### 탭
| 명령 | 설명 |
|---------|-------------|
| `closetab [id]` | 탭 닫기 |
| `newtab [url]` | 새 탭 열기 |
| `tab <id>` | 탭으로 전환 |
| `tabs` | 열린 탭 목록 |

### 서버
| 명령 | 설명 |
|---------|-------------|
| `restart` | 서버 재시작 |
| `status` | 상태 확인 |
| `stop` | 서버 종료 |
