---
name: review
version: 1.0.0
description: |
  PR 랜딩 전 코드 리뷰. base 브랜치 대비 diff를 분석하여 SQL 안전성, LLM 신뢰 경계 위반,
  조건부 사이드 이펙트 및 기타 구조적 문제를 검출합니다.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
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

출력에 `UPGRADE_AVAILABLE <old> <new>`가 표시되면: `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따르세요 (자동 업그레이드가 설정된 경우 자동 업그레이드, 그렇지 않으면 4개 옵션으로 AskUserQuestion 표시, 거절 시 snooze 상태 기록). `JUST_UPGRADED <from> <to>`가 표시되면: 사용자에게 "Running gstack v{to} (just updated!)"라고 알리고 계속 진행하세요.

## AskUserQuestion 형식

**모든 AskUserQuestion 호출 시 반드시 이 구조를 따르세요:**
1. **Re-ground:** 프로젝트, 현재 브랜치(preamble에서 출력된 `_BRANCH` 값 사용 — 대화 히스토리나 gitStatus의 브랜치 사용 금지), 현재 계획/작업을 명시합니다. (1-2문장)
2. **Simplify:** 똑똑한 16세도 이해할 수 있는 평이한 말로 문제를 설명합니다. 함수명 그대로, 내부 전문 용어, 구현 세부사항은 사용하지 않습니다. 구체적인 예시와 비유를 사용합니다. 어떻게 구현됐는지가 아니라 무엇을 하는지 설명합니다.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [한 줄 이유]`
4. **Options:** 알파벳 옵션: `A) ... B) ... C) ...`

사용자가 20분 동안 이 창을 보지 않았고 코드도 열지 않았다고 가정하세요. 설명을 이해하기 위해 소스 코드를 직접 읽어야 한다면, 설명이 너무 복잡한 것입니다.

스킬별 지침에서 이 기본 형식 위에 추가 규칙을 적용할 수 있습니다.

## Contributor Mode

`_CONTRIB`가 `true`이면: **contributor mode**입니다. gstack을 사용하면서 개선에도 기여하는 사용자입니다.

**각 주요 워크플로 단계 끝에서** (모든 단일 명령 후가 아니라), 사용한 gstack 툴링에 대해 돌아봅니다. 경험을 0~10점으로 평가합니다. 10점이 아니라면 그 이유를 생각해봅니다. 명확하고 실행 가능한 버그가 있거나, gstack 코드나 skill markdown이 더 잘할 수 있었던 통찰력 있는 부분이 있다면 — field report를 작성하세요. 기여자가 우리를 더 나아지게 도와줄 수도 있습니다!

**기준 — 이것이 기준입니다:** 예를 들어, `$B js "await fetch(...)"` 명령이 예전에 `SyntaxError: await is only valid in async functions` 오류로 실패했습니다. gstack이 표현식을 async context로 감싸지 않았기 때문입니다. 작은 문제이지만, 입력은 합리적이었고 gstack이 처리했어야 했습니다 — 이런 것이 보고할 가치가 있는 사례입니다. 이보다 덜 중요한 것은 무시하세요.

**보고할 가치 없는 것:** 사용자 앱 버그, 사용자 URL의 네트워크 오류, 사용자 사이트의 인증 실패, 사용자 자신의 JS 로직 버그.

**보고 방법:** `~/.gstack/contributor-logs/{slug}.md`에 **아래 모든 섹션을** 포함하여 작성합니다 (절대 내용 생략 금지 — Date/Version footer까지 모든 섹션 포함):

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

Slug: 소문자, 하이픈 사용, 최대 60자 (예: `browse-js-no-await`). 파일이 이미 존재하면 건너뜁니다. 세션당 최대 3개 보고서. 워크플로를 멈추지 말고 인라인으로 작성하고 계속 진행합니다. 사용자에게: "Filed gstack field report: {title}"라고 알립니다.

## Step 0: Base 브랜치 감지

이 PR이 타겟하는 브랜치를 결정합니다. 이후 모든 단계에서 이 결과를 "base 브랜치"로 사용합니다.

1. 이 브랜치에 이미 PR이 존재하는지 확인합니다:
   `gh pr view --json baseRefName -q .baseRefName`
   성공하면 출력된 브랜치 이름을 base 브랜치로 사용합니다.

2. PR이 없으면 (명령 실패 시), 저장소의 default 브랜치를 감지합니다:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. 두 명령 모두 실패하면 `main`으로 폴백합니다.

감지된 base 브랜치 이름을 출력합니다. 이후 모든 `git diff`, `git log`,
`git fetch`, `git merge`, `gh pr create` 명령에서 "the base branch"라고 표시된 부분을 감지된 브랜치 이름으로 대체합니다.

---

# PR 랜딩 전 코드 리뷰

`/review` 워크플로를 실행 중입니다. 테스트로는 잡히지 않는 구조적 문제에 대해 현재 브랜치의 diff를 base 브랜치와 비교하여 분석합니다.

---

## Step 1: 브랜치 확인

1. `git branch --show-current`를 실행하여 현재 브랜치를 확인합니다.
2. base 브랜치에 있다면: **"Nothing to review — you're on the base branch or have no changes against it."**을 출력하고 중지합니다.
3. `git fetch origin <base> --quiet && git diff origin/<base> --stat`를 실행하여 diff가 있는지 확인합니다. diff가 없으면 동일한 메시지를 출력하고 중지합니다.

---

## Step 2: 체크리스트 읽기

`.claude/skills/review/checklist.md`를 읽습니다.

**파일을 읽을 수 없으면 즉시 중지하고 오류를 보고합니다.** 체크리스트 없이는 진행하지 않습니다.

---

## Step 2.5: Greptile 리뷰 코멘트 확인

`.claude/skills/review/greptile-triage.md`를 읽고 fetch, filter, classify, **escalation detection** 단계를 따릅니다.

**PR이 없거나, `gh` 실패, API 오류, Greptile 코멘트가 0개인 경우:** 이 단계를 조용히 건너뜁니다. Greptile 연동은 부가적인 기능입니다 — 없어도 리뷰는 작동합니다.

**Greptile 코멘트가 발견된 경우:** 분류 결과(VALID & ACTIONABLE, VALID BUT ALREADY FIXED, FALSE POSITIVE, SUPPRESSED)를 저장합니다 — Step 5에서 필요합니다.

---

## Step 3: Diff 가져오기

오래된 로컬 상태로 인한 false positive를 방지하기 위해 최신 base 브랜치를 fetch합니다:

```bash
git fetch origin <base> --quiet
```

`git diff origin/<base>`를 실행하여 전체 diff를 가져옵니다. 이는 최신 base 브랜치 대비 커밋된 변경사항과 미커밋 변경사항 모두를 포함합니다.

---

## Step 4: 2-pass 리뷰

체크리스트를 두 번의 pass로 diff에 적용합니다:

1. **Pass 1 (CRITICAL):** SQL & 데이터 안전성, 레이스 컨디션 & 동시성, LLM 출력 신뢰 경계, Enum & 값 완전성
2. **Pass 2 (INFORMATIONAL):** 조건부 사이드 이펙트, 매직 넘버 & 문자열 커플링, 데드 코드 & 일관성, LLM 프롬프트 이슈, 테스트 공백, View/Frontend

**Enum & 값 완전성은 diff 외부의 코드를 읽어야 합니다.** diff에서 새로운 enum 값, 상태(status), 티어, 타입 상수가 추가되는 경우, Grep을 사용하여 형제 값을 참조하는 모든 파일을 찾은 후 해당 파일들을 Read하여 새 값이 처리되고 있는지 확인합니다. 이 카테고리는 diff 내부만 보는 것으로는 부족합니다.

체크리스트에 지정된 출력 형식을 따릅니다. 억제 규칙을 존중하세요 — "DO NOT flag" 섹션에 나열된 항목은 절대 지적하지 않습니다.

---

## Step 5: Fix-First 리뷰

**모든 발견 사항은 조치가 필요합니다 — critical 사항만이 아닙니다.**

요약 헤더 출력: `Pre-Landing Review: N issues (X critical, Y informational)`

### Step 5a: 각 발견 사항 분류

각 발견 사항에 대해 checklist.md의 Fix-First Heuristic에 따라 AUTO-FIX 또는 ASK로 분류합니다. Critical 발견은 ASK 쪽으로, informational 발견은 AUTO-FIX 쪽으로 기웁니다.

### Step 5b: 모든 AUTO-FIX 항목 자동 수정

각 수정을 직접 적용합니다. 각 항목에 대해 한 줄 요약을 출력합니다:
`[AUTO-FIXED] [file:line] Problem → what you did`

### Step 5c: ASK 항목 일괄 질문

남은 ASK 항목이 있다면 하나의 AskUserQuestion으로 제시합니다:

- 각 항목을 번호, 심각도 레이블, 문제, 권장 수정 방법과 함께 나열합니다
- 각 항목에 대한 옵션: A) 권장 수정 적용, B) 건너뜀
- 전체 RECOMMENDATION 포함

예시 형식:
```
I auto-fixed 5 issues. 2 need your input:

1. [CRITICAL] app/models/post.rb:42 — Race condition in status transition
   Fix: Add `WHERE status = 'draft'` to the UPDATE
   → A) Fix  B) Skip

2. [INFORMATIONAL] app/services/generator.rb:88 — LLM output not type-checked before DB write
   Fix: Add JSON schema validation
   → A) Fix  B) Skip

RECOMMENDATION: Fix both — #1 is a real race condition, #2 prevents silent data corruption.
```

ASK 항목이 3개 이하인 경우 일괄 처리 대신 개별 AskUserQuestion 호출을 사용할 수 있습니다.

### Step 5d: 사용자 승인 수정 적용

사용자가 "Fix"를 선택한 항목에 대한 수정을 적용합니다. 수정된 내용을 출력합니다.

ASK 항목이 없는 경우 (모두 AUTO-FIX인 경우) 질문을 완전히 건너뜁니다.

### Greptile 코멘트 해결

발견 사항 출력 후, Step 2.5에서 Greptile 코멘트가 분류된 경우:

**출력 헤더에 Greptile 요약 포함:** `+ N Greptile comments (X valid, Y fixed, Z FP)`

코멘트에 답하기 전에 greptile-triage.md의 **Escalation Detection** 알고리즘을 실행하여 Tier 1(친근한) 또는 Tier 2(단호한) 답변 템플릿 중 어느 것을 사용할지 결정합니다.

1. **VALID & ACTIONABLE 코멘트:** 발견 사항에 포함됩니다 — Fix-First 플로우를 따릅니다 (기계적이면 자동 수정, 그렇지 않으면 ASK로 일괄 처리) (A: 지금 수정, B: 인정, C: False positive). 사용자가 A(수정)를 선택하면 greptile-triage.md의 **Fix reply template**을 사용하여 답변합니다 (인라인 diff + 설명 포함). 사용자가 C(false positive)를 선택하면 **False Positive reply template**을 사용하여 답변합니다 (증거 + 재랭크 제안 포함). per-project와 global greptile-history 모두에 저장합니다.

2. **FALSE POSITIVE 코멘트:** 각각 AskUserQuestion으로 제시합니다:
   - Greptile 코멘트 표시: file:line (또는 [top-level]) + 본문 요약 + permalink URL
   - 왜 false positive인지 간결하게 설명
   - 옵션:
     - A) 왜 틀렸는지 Greptile에게 답변 (명확하게 틀린 경우 권장)
     - B) 어쨌든 수정 (노력이 적고 무해한 경우)
     - C) 무시 — 답변하지 않고 수정도 하지 않음

   사용자가 A를 선택하면 greptile-triage.md의 **False Positive reply template**을 사용하여 답변합니다 (증거 + 재랭크 제안 포함). per-project와 global greptile-history 모두에 저장합니다.

3. **VALID BUT ALREADY FIXED 코멘트:** greptile-triage.md의 **Already Fixed reply template**을 사용하여 답변합니다 — AskUserQuestion 불필요:
   - 무엇이 완료되었는지와 수정 commit SHA 포함
   - per-project와 global greptile-history 모두에 저장합니다

4. **SUPPRESSED 코멘트:** 조용히 건너뜁니다 — 이전 triage에서 확인된 known false positive입니다.

---

## Step 5.5: TODOS 교차 참조

저장소 루트의 `TODOS.md`를 읽습니다 (존재하는 경우). PR을 오픈된 TODO와 교차 참조합니다:

- **이 PR이 오픈된 TODO를 완료하는가?** 그렇다면 출력에 해당 항목을 명시합니다: "This PR addresses TODO: <title>"
- **이 PR이 TODO가 되어야 할 작업을 생성하는가?** 그렇다면 informational 발견 사항으로 플래그합니다.
- **관련된 TODO가 이 리뷰의 컨텍스트를 제공하는가?** 그렇다면 관련 발견 사항을 논의할 때 참조합니다.

TODOS.md가 존재하지 않으면 이 단계를 조용히 건너뜁니다.

---

## Step 5.6: 문서 최신성 확인

diff를 문서 파일과 교차 참조합니다. 저장소 루트의 각 `.md` 파일(README.md, ARCHITECTURE.md, CONTRIBUTING.md, CLAUDE.md 등)에 대해:

1. diff의 코드 변경사항이 해당 문서 파일에 설명된 기능, 컴포넌트, 워크플로에 영향을 미치는지 확인합니다.
2. 문서 파일이 이 브랜치에서 업데이트되지 않았지만 설명하는 코드가 변경된 경우, INFORMATIONAL 발견 사항으로 플래그합니다:
   "Documentation may be stale: [file] describes [feature/component] but code changed in this branch. Consider running `/document-release`."

이것은 informational 전용입니다 — 절대 critical이 아닙니다. 수정 방법은 `/document-release`입니다.

문서 파일이 없으면 이 단계를 조용히 건너뜁니다.

---

## 중요 규칙

- **코멘트하기 전에 전체 diff를 읽습니다.** diff에서 이미 해결된 이슈를 플래그하지 않습니다.
- **Fix-first, 읽기 전용이 아닙니다.** AUTO-FIX 항목은 직접 적용됩니다. ASK 항목은 사용자 승인 후에만 적용됩니다. commit, push, PR 생성은 절대 하지 않습니다 — 그것은 /ship의 역할입니다.
- **간결하게 합니다.** 한 줄 문제, 한 줄 수정. 서론 없이.
- **실제 문제만 플래그합니다.** 괜찮은 것은 건너뜁니다.
- **greptile-triage.md의 Greptile 답변 템플릿을 사용합니다.** 모든 답변에는 증거가 포함됩니다. 모호한 답변은 절대 게시하지 않습니다.
