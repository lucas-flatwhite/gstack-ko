---
name: setup-browser-cookies
version: 1.0.0
description: |
  실제 브라우저 (Comet, Chrome, Arc, Brave, Edge)의 cookie를 headless browse 세션으로
  가져옵니다. 가져올 cookie 도메인을 선택할 수 있는 인터랙티브 picker UI를 엽니다.
  인증이 필요한 페이지를 QA 테스트하기 전에 사용하세요.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

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

# 브라우저 Cookie 설정

실제 Chromium 브라우저의 로그인 세션을 headless browse 세션으로 가져옵니다.

## 작동 방식

1. browse 바이너리 찾기
2. `cookie-import-browser`를 실행하여 설치된 브라우저를 감지하고 picker UI 열기
3. 사용자가 브라우저에서 가져올 cookie 도메인 선택
4. Cookie가 복호화되어 Playwright 세션에 로드됨

## 단계

### 1. browse 바이너리 찾기

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

### 2. Cookie picker 열기

```bash
$B cookie-import-browser
```

설치된 Chromium 브라우저 (Comet, Chrome, Arc, Brave, Edge)를 자동으로 감지하고
기본 브라우저에서 인터랙티브 picker UI를 엽니다. 여기서 다음을 할 수 있습니다:
- 설치된 브라우저 간 전환
- 도메인 검색
- "+"를 클릭하여 도메인의 cookie 가져오기
- 휴지통 아이콘을 클릭하여 가져온 cookie 제거

사용자에게 알립니다: **"Cookie picker가 열렸습니다 — 브라우저에서 가져올 도메인을 선택한 후 완료되면 알려주세요."**

### 3. 직접 가져오기 (대안)

사용자가 도메인을 직접 지정한 경우 (예: `/setup-browser-cookies github.com`), UI를 건너뜁니다:

```bash
$B cookie-import-browser comet --domain github.com
```

지정된 경우 `comet`을 해당 브라우저로 교체합니다.

### 4. 확인

사용자가 완료되었다고 확인한 후:

```bash
$B cookies
```

가져온 cookie 요약 (도메인별 개수)을 사용자에게 표시합니다.

## 참고 사항

- 브라우저당 첫 번째 가져오기 시 macOS Keychain 다이얼로그가 표시될 수 있습니다 — "허용" / "항상 허용"을 클릭하세요
- Cookie picker는 browse 서버와 동일한 포트에서 제공됩니다 (추가 프로세스 없음)
- UI에는 도메인 이름과 cookie 개수만 표시됩니다 — cookie 값은 노출되지 않습니다
- browse 세션은 명령 간 cookie를 유지하므로 가져온 cookie는 즉시 작동합니다
