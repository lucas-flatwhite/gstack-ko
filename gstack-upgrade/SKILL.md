---
name: gstack-upgrade
version: 1.0.0
description: |
  gstack를 최신 버전으로 업그레이드합니다. 전역 설치와 vendored 설치를 감지하고,
  업그레이드를 실행한 뒤 변경 사항을 요약해서 보여줍니다.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# /gstack-upgrade

gstack를 최신 버전으로 업그레이드하고 변경 사항을 보여줍니다.

## 인라인 업그레이드 플로우

이 섹션은 모든 스킬 프리앰블에서 `UPGRADE_AVAILABLE`를 감지했을 때 참조합니다.

### 1단계: 사용자에게 확인

`AskUserQuestion` 사용:
- 질문: "gstack **v{new}** 버전을 사용할 수 있습니다(현재 v{old}). 지금 업그레이드할까요? 약 10초 걸립니다."
- 옵션: `["네, 지금 업그레이드", "나중에(내일 다시 묻기)"]`

**"나중에"를 선택한 경우:** `touch ~/.gstack/last-update-check`를 실행해 24시간 타이머를 리셋하고 현재 스킬을 계속 진행합니다. 업그레이드는 다시 언급하지 않습니다.

### 2단계: 설치 타입 감지

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

### 3단계: 기존 버전 저장

```bash
OLD_VERSION=$(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
```

### 4단계: 업그레이드 실행

**git 설치인 경우** (`global-git`, `local-git`):
```bash
cd "$INSTALL_DIR"
STASH_OUTPUT=$(git stash 2>&1)
git fetch origin
git reset --hard origin/main
./setup
```
`$STASH_OUTPUT`에 `Saved working directory`가 포함되어 있으면 사용자에게 경고합니다: "참고: 로컬 변경사항이 stash에 저장되었습니다. 스킬 디렉터리에서 `git stash pop`을 실행해 복원하세요."

**vendored 설치인 경우** (`vendored`, `vendored-global`):
```bash
PARENT=$(dirname "$INSTALL_DIR")
TMP_DIR=$(mktemp -d)
git clone --depth 1 https://github.com/garrytan/gstack.git "$TMP_DIR/gstack"
mv "$INSTALL_DIR" "$INSTALL_DIR.bak"
mv "$TMP_DIR/gstack" "$INSTALL_DIR"
cd "$INSTALL_DIR" && ./setup
rm -rf "$INSTALL_DIR.bak" "$TMP_DIR"
```

### 5단계: 마커 기록 + 캐시 정리

```bash
mkdir -p ~/.gstack
echo "$OLD_VERSION" > ~/.gstack/just-upgraded-from
rm -f ~/.gstack/last-update-check
```

### 6단계: What's New 표시

`$INSTALL_DIR/CHANGELOG.md`를 읽고, 구버전과 신버전 사이의 버전 항목을 찾습니다. 테마별로 5-7개 불릿으로 요약합니다. 과도하게 길어지지 않게 사용자 체감 변화 중심으로 작성하고, 의미 있는 경우가 아니면 내부 리팩터링은 생략합니다.

형식:
```
gstack v{new} - v{old}에서 업그레이드 완료!

새로운 점:
- [bullet 1]
- [bullet 2]
- ...

Happy shipping!
```

### 7단계: 원래 작업 계속

What's New를 보여준 뒤, 사용자가 처음 호출했던 스킬 흐름을 계속 진행합니다. 업그레이드는 여기서 종료입니다.

---

## 단독 사용

프리앰블이 아닌 직접 `/gstack-upgrade`로 호출된 경우에는 위 2-6단계를 수행합니다. 이미 최신 버전이라면 사용자에게 다음과 같이 알립니다: "이미 최신 버전(v{version})입니다."
