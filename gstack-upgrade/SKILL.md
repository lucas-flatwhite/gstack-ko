---
name: gstack-upgrade
version: 1.0.0
description: |
  gstack을 최신 버전으로 업그레이드합니다. 글로벌 설치와 vendored 설치를
  구분해 적절한 업그레이드 경로를 실행하고, 변경 사항 요약을 보여줍니다.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# /gstack-upgrade

gstack을 최신 버전으로 업그레이드하고 변경 사항을 안내합니다.

## Inline upgrade flow

이 섹션은 모든 스킬 preamble에서 `UPGRADE_AVAILABLE`을 감지했을 때 참조됩니다.

### Step 1: 사용자에게 질문

AskUserQuestion 사용:
- Question: "gstack **v{new}**를 사용할 수 있습니다(현재 v{old}). 지금 업그레이드할까요? 약 10초 소요됩니다."
- Options: ["네, 지금 업그레이드", "나중에 (내일 다시 묻기)"]

**"나중에" 선택 시:** `touch ~/.gstack/last-update-check` 실행 후 현재 스킬을 계속 진행합니다. 업그레이드는 다시 언급하지 않습니다.

### Step 2: 설치 타입 감지

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

### Step 3: 이전 버전 저장

```bash
OLD_VERSION=$(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
```

### Step 4: 업그레이드 실행

**git 설치(global-git, local-git):**
```bash
cd "$INSTALL_DIR"
STASH_OUTPUT=$(git stash 2>&1)
git fetch origin
git reset --hard origin/main
./setup
```
`$STASH_OUTPUT`에 "Saved working directory"가 있으면 사용자에게 알립니다: "참고: 로컬 변경사항을 stash 했습니다. 복원하려면 스킬 디렉토리에서 `git stash pop`을 실행하세요."

**vendored 설치(vendored, vendored-global):**
```bash
PARENT=$(dirname "$INSTALL_DIR")
TMP_DIR=$(mktemp -d)
git clone --depth 1 https://github.com/garrytan/gstack.git "$TMP_DIR/gstack"
mv "$INSTALL_DIR" "$INSTALL_DIR.bak"
mv "$TMP_DIR/gstack" "$INSTALL_DIR"
cd "$INSTALL_DIR" && ./setup
rm -rf "$INSTALL_DIR.bak" "$TMP_DIR"
```

### Step 5: 마커 기록 + 캐시 초기화

```bash
mkdir -p ~/.gstack
echo "$OLD_VERSION" > ~/.gstack/just-upgraded-from
rm -f ~/.gstack/last-update-check
```

### Step 6: What's New 표시

`$INSTALL_DIR/CHANGELOG.md`를 읽고 old→new 사이 버전 항목을 찾아, 테마별 5-7개 불릿으로 요약합니다. 사용자 체감 변경을 우선하고, 내부 리팩터링은 영향이 큰 경우만 포함합니다.

출력 형식:
```
gstack v{new} — upgraded from v{old}!

What's new:
- [bullet 1]
- [bullet 2]
- ...

Happy shipping!
```

### Step 7: 원래 스킬 계속

What's New를 보여준 뒤, 사용자가 원래 호출했던 스킬 흐름으로 복귀해 계속 진행합니다. 추가 액션은 필요 없습니다.

---

## Standalone usage

`/gstack-upgrade`를 직접 호출했을 때(즉 preamble 경유가 아닐 때)는 위 Step 2-6을 실행합니다. 이미 최신 버전이면 사용자에게 이렇게 알립니다: "이미 최신 버전(v{version})입니다."
