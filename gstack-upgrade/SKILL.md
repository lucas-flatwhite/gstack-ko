---
name: gstack-upgrade
version: 1.1.0
description: |
  gstack를 최신 버전으로 업그레이드합니다. 전역 설치 및 벤더링된 설치를 감지하고
  업그레이드를 실행한 후 새로운 기능을 표시합니다.
  "gstack 업그레이드", "gstack 업데이트", "최신 버전으로 올려줘" 요청 시 사용하세요.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# /gstack-upgrade

gstack을 최신 버전으로 업그레이드하고 새로운 기능을 표시합니다.

## Inline upgrade flow

이 섹션은 `UPGRADE_AVAILABLE`을 감지했을 때 모든 스킬 preamble에서 참조됩니다.

### Step 1: 사용자에게 묻기 (또는 자동 업그레이드)

먼저 자동 업그레이드가 활성화되어 있는지 확인합니다:
```bash
_AUTO=""
[ "${GSTACK_AUTO_UPGRADE:-}" = "1" ] && _AUTO="true"
[ -z "$_AUTO" ] && _AUTO=$(~/.claude/skills/gstack/bin/gstack-config get auto_upgrade 2>/dev/null || true)
echo "AUTO_UPGRADE=$_AUTO"
```

**`AUTO_UPGRADE=true` 또는 `AUTO_UPGRADE=1`인 경우:** AskUserQuestion을 건너뜁니다. "Auto-upgrading gstack v{old} → v{new}..."를 로그에 기록하고 바로 Step 2로 진행합니다. 자동 업그레이드 중 `./setup`이 실패하면 백업(`.bak` 디렉토리)에서 복원하고 사용자에게 경고합니다: "Auto-upgrade failed — restored previous version. Run `/gstack-upgrade` manually to retry."

**그렇지 않으면** AskUserQuestion을 사용합니다:
- 질문: "gstack **v{new}**를 사용할 수 있습니다 (현재 v{old}). 지금 업그레이드하겠습니까?"
- 옵션: ["지금 업그레이드", "항상 최신 상태 유지", "나중에", "다시 묻지 않기"]

**"지금 업그레이드"를 선택한 경우:** Step 2로 진행합니다.

**"항상 최신 상태 유지"를 선택한 경우:**
```bash
~/.claude/skills/gstack/bin/gstack-config set auto_upgrade true
```
사용자에게 알립니다: "자동 업그레이드가 활성화되었습니다. 향후 업데이트는 자동으로 설치됩니다." 그런 다음 Step 2로 진행합니다.

**"나중에"를 선택한 경우:** 점진적 백오프로 snooze 상태를 기록합니다 (첫 번째 snooze = 24시간, 두 번째 = 48시간, 세 번째 이후 = 1주일), 그런 다음 현재 스킬을 계속 진행합니다. 업그레이드에 대해 다시 언급하지 않습니다.
```bash
_SNOOZE_FILE=~/.gstack/update-snoozed
_REMOTE_VER="{new}"
_CUR_LEVEL=0
if [ -f "$_SNOOZE_FILE" ]; then
  _SNOOZED_VER=$(awk '{print $1}' "$_SNOOZE_FILE")
  if [ "$_SNOOZED_VER" = "$_REMOTE_VER" ]; then
    _CUR_LEVEL=$(awk '{print $2}' "$_SNOOZE_FILE")
    case "$_CUR_LEVEL" in *[!0-9]*) _CUR_LEVEL=0 ;; esac
  fi
fi
_NEW_LEVEL=$((_CUR_LEVEL + 1))
[ "$_NEW_LEVEL" -gt 3 ] && _NEW_LEVEL=3
echo "$_REMOTE_VER $_NEW_LEVEL $(date +%s)" > "$_SNOOZE_FILE"
```
참고: `{new}`는 `UPGRADE_AVAILABLE` 출력의 원격 버전입니다 — update check 결과에서 대입합니다.

snooze 기간을 사용자에게 알립니다: "다음 알림은 24시간 후" (또는 레벨에 따라 48시간 또는 1주일). 팁: "자동 업그레이드를 위해 `~/.gstack/config.yaml`에서 `auto_upgrade: true`를 설정하세요."

**"다시 묻지 않기"를 선택한 경우:**
```bash
~/.claude/skills/gstack/bin/gstack-config set update_check false
```
사용자에게 알립니다: "업데이트 확인이 비활성화되었습니다. 다시 활성화하려면 `~/.claude/skills/gstack/bin/gstack-config set update_check true`를 실행하세요."
현재 스킬을 계속 진행합니다.

### Step 2: 설치 유형 감지

```bash
if [ -d "$HOME/.claude/skills/gstack/.git" ]; then
  INSTALL_TYPE="global-git"
  INSTALL_DIR="$HOME/.claude/skills/gstack"
elif [ -d ".claude/skills/gstack/.git" ]; then
  INSTALL_TYPE="local-git"
  INSTALL_DIR=".claude/skills/gstack"
elif [ -d ".claude/skills/gstack" ]; then
  INSTALL_TYPE="vendored"
  INSTALL_DIR=".claude/skills/gstack"
elif [ -d "$HOME/.claude/skills/gstack" ]; then
  INSTALL_TYPE="vendored-global"
  INSTALL_DIR="$HOME/.claude/skills/gstack"
else
  echo "ERROR: gstack not found"
  exit 1
fi
echo "Install type: $INSTALL_TYPE at $INSTALL_DIR"
```

위에서 출력된 설치 유형과 디렉토리 경로는 이후 모든 단계에서 사용됩니다.

### Step 3: 이전 버전 저장

Step 2의 출력에서 설치 디렉토리를 사용합니다:

```bash
OLD_VERSION=$(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
```

### Step 4: 업그레이드

Step 2에서 감지된 설치 유형과 디렉토리를 사용합니다:

**git 설치의 경우** (global-git, local-git):
```bash
cd "$INSTALL_DIR"
STASH_OUTPUT=$(git stash 2>&1)
git fetch origin
git reset --hard origin/main
./setup
```
`$STASH_OUTPUT`에 "Saved working directory"가 포함되면 사용자에게 경고합니다: "참고: 로컬 변경사항이 stash되었습니다. 스킬 디렉토리에서 `git stash pop`을 실행하여 복원하세요."

**벤더링된 설치의 경우** (vendored, vendored-global):
```bash
PARENT=$(dirname "$INSTALL_DIR")
TMP_DIR=$(mktemp -d)
git clone --depth 1 https://github.com/garrytan/gstack.git "$TMP_DIR/gstack"
mv "$INSTALL_DIR" "$INSTALL_DIR.bak"
mv "$TMP_DIR/gstack" "$INSTALL_DIR"
cd "$INSTALL_DIR" && ./setup
rm -rf "$INSTALL_DIR.bak" "$TMP_DIR"
```

### Step 4.5: 로컬 벤더링된 복사본 동기화

Step 2의 설치 디렉토리를 사용합니다. 업데이트가 필요한 로컬 벤더링된 복사본이 있는지 확인합니다:

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
LOCAL_GSTACK=""
if [ -n "$_ROOT" ] && [ -d "$_ROOT/.claude/skills/gstack" ]; then
  _RESOLVED_LOCAL=$(cd "$_ROOT/.claude/skills/gstack" && pwd -P)
  _RESOLVED_PRIMARY=$(cd "$INSTALL_DIR" && pwd -P)
  if [ "$_RESOLVED_LOCAL" != "$_RESOLVED_PRIMARY" ]; then
    LOCAL_GSTACK="$_ROOT/.claude/skills/gstack"
  fi
fi
echo "LOCAL_GSTACK=$LOCAL_GSTACK"
```

`LOCAL_GSTACK`이 비어 있지 않으면 새로 업그레이드된 기본 설치에서 복사하여 업데이트합니다 (README 벤더링 설치와 동일한 방식):
```bash
mv "$LOCAL_GSTACK" "$LOCAL_GSTACK.bak"
cp -Rf "$INSTALL_DIR" "$LOCAL_GSTACK"
rm -rf "$LOCAL_GSTACK/.git"
cd "$LOCAL_GSTACK" && ./setup
rm -rf "$LOCAL_GSTACK.bak"
```
사용자에게 알립니다: "`$LOCAL_GSTACK`의 벤더링된 복사본도 업데이트되었습니다 — 준비되면 `.claude/skills/gstack/`을 commit하세요."

### Step 5: 마커 쓰기 + 캐시 초기화

```bash
mkdir -p ~/.gstack
echo "$OLD_VERSION" > ~/.gstack/just-upgraded-from
rm -f ~/.gstack/last-update-check
rm -f ~/.gstack/update-snoozed
```

### Step 6: 새로운 기능 표시

`$INSTALL_DIR/CHANGELOG.md`를 읽습니다. 이전 버전과 새 버전 사이의 모든 버전 항목을 찾습니다. 주제별로 그룹화하여 5-7개의 bullet으로 요약합니다. 너무 많은 내용을 보여주지 않도록 — 사용자에게 보이는 변경사항에 집중합니다. 중요한 내용이 아닌 한 내부 리팩터링은 건너뜁니다.

형식:
```
gstack v{new} — v{old}에서 업그레이드됨!

새로운 기능:
- [bullet 1]
- [bullet 2]
- ...

즐거운 작업 되세요!
```

### Step 7: 계속 진행

새로운 기능을 표시한 후, 사용자가 처음에 실행한 스킬을 계속 진행합니다. 업그레이드가 완료되었으므로 추가 작업이 필요하지 않습니다.

---

## 단독 사용

`/gstack-upgrade`로 직접 실행 시 (preamble에서 호출하지 않고):

1. 캐시를 우회하여 강제로 새로운 업데이트 확인:
```bash
~/.claude/skills/gstack/bin/gstack-update-check --force
```
출력을 사용하여 업그레이드 가능 여부를 확인합니다.

2. `UPGRADE_AVAILABLE <old> <new>`인 경우: 위의 Step 2-6을 따릅니다.
3. 출력이 없는 경우 (최신 버전): 사용자에게 알립니다 "이미 최신 버전 (v{version})을 사용 중입니다."
