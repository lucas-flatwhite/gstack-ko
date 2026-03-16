---
name: browse
version: 1.1.0
description: |
  QA 테스트 및 사이트 도그푸딩을 위한 빠른 헤드리스 브라우저. URL 탐색,
  요소 상호작용, 페이지 상태 검증, 액션 전후 diff, 주석 스크린샷 촬영,
  반응형 레이아웃 확인, 폼/업로드 테스트, 다이얼로그 처리를 수행합니다.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

## Update Check (먼저 실행)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
```

출력이 `UPGRADE_AVAILABLE <old> <new>`이면 `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따릅니다.
`JUST_UPGRADED <from> <to>`이면 `gstack v{to}로 실행 중(방금 업데이트됨)`을 알리고 계속합니다.

# browse: QA 테스트 및 도그푸딩

지속형 헤드리스 Chromium. 첫 호출 자동 시작(~3초), 이후 커맨드당 약 100ms.
상태(쿠키, 탭, 로그인 세션)는 호출 간 유지됩니다.

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
2. `cd <SKILL_DIR> && ./setup` 실행.
3. `bun`이 없으면 `curl -fsSL https://bun.sh/install | bash` 실행.

## 핵심 QA 패턴

### 1) 페이지 로드 검증
```bash
$B goto https://yourapp.com
$B text
$B console --errors
$B network
$B is visible ".main-content"
```

### 2) 사용자 플로우 검증
```bash
$B goto https://app.com/login
$B snapshot -i
$B fill @e3 "user@test.com"
$B fill @e4 "password"
$B click @e5
$B snapshot -D
$B is visible ".dashboard"
```

### 3) 액션 전후 변화 확인
```bash
$B snapshot
$B click @e3
$B snapshot -D
```

### 4) 버그 증거 수집
```bash
$B snapshot -i -a -o /tmp/annotated.png
$B screenshot /tmp/bug.png
$B console --errors
```

### 5) cursor-interactive 요소 탐색
```bash
$B snapshot -C
$B click @c1
```

## Snapshot Flags

```
-i        --interactive           대화형 요소만(@e ref)
-c        --compact               빈 구조 노드 제외
-d <N>    --depth                 트리 깊이 제한
-s <sel>  --selector              CSS 셀렉터 범위 제한
-D        --diff                  이전 snapshot 대비 diff
-a        --annotate              주석 스크린샷
-o <path> --output                주석 스크린샷 저장 경로
-C        --cursor-interactive    cursor-interactive 요소(@c ref)
```

- 플래그 조합 가능. (`-o`는 `-a`와 함께 사용)
- 예시: `$B snapshot -i -a -C -o /tmp/annotated.png`
- 스냅샷 후 @ref를 셀렉터처럼 사용합니다.

```bash
$B click @e3       $B fill @e4 "value"     $B hover @e1
$B html @e2        $B css @e5 "color"      $B attrs @e6
$B click @c1
```

`goto` 후에는 ref가 무효화되므로 snapshot을 다시 실행합니다.

## 전체 커맨드 목록

### Navigation
- `goto <url>`, `back`, `forward`, `reload`, `url`

### Reading
- `text`, `html [selector]`, `links`, `forms`, `accessibility`

### Interaction
- `click`, `fill`, `select`, `hover`, `type`, `press`, `scroll`
- `wait <sel|--networkidle|--load>`
- `upload <sel> <file> [file2...]`
- `cookie <name>=<value>`, `cookie-import <json>`
- `cookie-import-browser [browser] [--domain d]`
- `header <name>:<value>`
- `dialog-accept [text]`, `dialog-dismiss`
- `viewport <WxH>`, `useragent <string>`

### Inspection
- `js <expr>`, `eval <file>`, `css <sel> <prop>`, `attrs <sel|@ref>`, `is <prop> <sel>`
- `console [--clear|--errors]`, `network [--clear]`, `dialog [--clear]`
- `cookies`, `storage [set k v]`, `perf`

### Visual / Snapshot / Meta / Tabs / Server
- `screenshot [path]`, `pdf [path]`, `responsive [prefix]`, `diff <url1> <url2>`
- `snapshot [flags]`
- `chain`
- `tabs`, `tab <id>`, `newtab [url]`, `closetab [id]`
- `status`, `restart`, `stop`
