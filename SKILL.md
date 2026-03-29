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

> Reference-only note: 이 저장소는 `browse` 바이너리, `setup` 스크립트, 테스트를 포함하지 않습니다. 아래 내용은 upstream `garrytan/gstack` 설치본의 동작을 설명하는 한국어 reference이며, 실제 실행은 upstream 환경을 기준으로 해야 합니다.

## Update Check (먼저 실행)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
```

출력이 `UPGRADE_AVAILABLE <old> <new>`이면 `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따릅니다 (업그레이드 여부를 AskUserQuestion으로 확인. 업그레이드하지 않으면 `touch ~/.gstack/last-update-check`).
`JUST_UPGRADED <from> <to>`이면 `gstack v{to}로 실행 중(방금 업데이트됨)`을 알리고 계속합니다.

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
2. `cd <SKILL_DIR> && ./setup` 실행.
3. `bun`이 없으면 `curl -fsSL https://bun.sh/install | bash` 실행.

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

## Snapshot Flags

`snapshot`은 페이지 구조 이해와 상호작용 대상 식별의 기본 도구입니다.

```
-i        --interactive           대화형 요소만(@e ref)
-c        --compact               빈 구조 노드 제외
-d <N>    --depth                 트리 깊이 제한 (0=root만)
-s <sel>  --selector              CSS 셀렉터 범위로 제한
-D        --diff                  이전 snapshot 대비 unified diff
-a        --annotate              ref 라벨이 있는 주석 스크린샷
-o <path> --output                주석 스크린샷 저장 경로
-C        --cursor-interactive    cursor-interactive 요소(@c ref)
```

- 플래그 조합 가능. (`-o`는 `-a`와 함께 사용할 때만 유효)
- 예시: `$B snapshot -i -a -C -o /tmp/annotated.png`
- 스냅샷 후 @ref를 셀렉터처럼 사용할 수 있습니다.

```bash
$B click @e3       $B fill @e4 "value"     $B hover @e1
$B html @e2        $B css @e5 "color"      $B attrs @e6
$B click @c1
```

네비게이션(`goto`) 후에는 ref가 무효화되므로 snapshot을 다시 실행합니다.

## Command Reference

### Navigation
- `goto <url>`: URL 이동
- `back`, `forward`, `reload`, `url`

### Reading
- `text`, `html [selector]`, `links`, `forms`, `accessibility`

### Interaction
- `click`, `fill`, `select`, `hover`, `type`, `press`, `scroll`
- `wait <sel|--networkidle|--load>`
- `upload <sel> <file> [file2...]`
- `viewport <WxH>`, `useragent <string>`
- `cookie <name>=<value>`, `cookie-import <json>`
- `cookie-import-browser [browser] [--domain d]`
- `header <name>:<value>`
- `dialog-accept [text]`, `dialog-dismiss`

### Inspection
- `js <expr>`, `eval <file>`
- `css <sel> <prop>`, `attrs <sel|@ref>`, `is <prop> <sel>`
- `console [--clear|--errors]`, `network [--clear]`, `dialog [--clear]`
- `cookies`, `storage [set k v]`, `perf`

### Visual
- `screenshot [path]`, `pdf [path]`, `responsive [prefix]`
- `diff <url1> <url2>`

### Snapshot / Meta / Tabs / Server
- `snapshot [flags]`
- `chain` (JSON stdin)
- `tabs`, `tab <id>`, `newtab [url]`, `closetab [id]`
- `status`, `restart`, `stop`

## 운영 팁

- 상호작용 직후 `console --errors`를 습관적으로 확인합니다.
- 접근성 트리에서 놓치는 클릭 가능한 div 탐색은 `snapshot -C`를 사용합니다.
- 재현/보고 품질을 위해 스크린샷은 `/tmp` 또는 프로젝트 내 경로에 저장합니다.
