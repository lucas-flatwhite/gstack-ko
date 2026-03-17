---
name: document-release
version: 1.0.0
description: |
  배포 후 문서 업데이트. 모든 프로젝트 문서를 읽고, diff와 교차 대조하여,
  README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md를 배포된 내용에 맞게 업데이트하고,
  CHANGELOG 문체를 다듬으며, TODOS를 정리하고, 선택적으로 VERSION을 올립니다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## 프리앰블 (먼저 실행)

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

출력에 `UPGRADE_AVAILABLE <old> <new>`가 표시되면: `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "인라인 업그레이드 흐름"을 따릅니다(설정된 경우 자동 업그레이드, 그렇지 않으면 4가지 선택지로 AskUserQuestion 호출, 거절 시 스누즈 상태 기록). `JUST_UPGRADED <from> <to>`가 표시되면: 사용자에게 "gstack v{to} 실행 중 (방금 업데이트됨!)"을 알리고 계속 진행합니다.

## AskUserQuestion 형식

**모든 AskUserQuestion 호출 시 다음 구조를 반드시 따르세요:**
1. **재정립:** 프로젝트, 현재 branch(대화 이력이나 gitStatus의 branch가 아닌 프리앰블에서 출력된 `_BRANCH` 값 사용), 현재 계획/작업을 명시합니다. (1-2문장)
2. **단순화:** 영리한 16세도 이해할 수 있는 쉬운 말로 문제를 설명합니다. 함수명 그대로, 내부 전문 용어, 구현 세부 사항은 쓰지 않습니다. 구체적인 예시와 비유를 사용합니다. 명칭이 아닌 동작을 설명합니다.
3. **추천:** `RECOMMENDATION: [X] 선택 — [한 줄 이유]`
4. **선택지:** 알파벳으로 나열: `A) ... B) ... C) ...`

사용자가 20분 동안 이 창을 보지 않았고 코드도 열어두지 않았다고 가정합니다. 설명을 이해하기 위해 소스를 읽어야 한다면, 너무 복잡한 것입니다.

각 스킬별 지침은 이 기준에 추가 형식 규칙을 더할 수 있습니다.

## Contributor 모드

`_CONTRIB`가 `true`이면: **contributor 모드**입니다. gstack을 사용하면서 개선에도 기여하는 역할입니다.

**각 주요 워크플로우 단계 끝에서** (모든 명령 후가 아닌), 사용한 gstack 도구에 대해 되돌아봅니다. 경험을 0~10점으로 평가합니다. 10점이 아니라면 이유를 생각합니다. 명확하고 실행 가능한 버그나 gstack 코드 또는 스킬 마크다운이 더 잘 처리할 수 있었던 흥미로운 사항이 있다면 현장 보고서를 제출합니다.

**기준 보정 — 이 정도 수준입니다:** 예를 들어, gstack이 표현식을 async context로 감싸지 않아서 `$B js "await fetch(...)"` 실행 시 `SyntaxError: await is only valid in async functions`가 발생했던 사례. 사소하지만, 입력은 합당했고 gstack이 처리했어야 했습니다 — 이런 것이 제출할 만한 사항입니다. 이보다 덜 중요한 것은 무시합니다.

**제출하지 않을 것:** 사용자 앱 버그, 사용자 URL 네트워크 오류, 사용자 사이트 인증 실패, 사용자 JS 로직 버그.

**제출 방법:** `~/.gstack/contributor-logs/{slug}.md`에 **아래의 모든 섹션을 포함하여** 작성합니다(Date/Version 푸터까지 모든 섹션 포함, 생략 금지):

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

Slug: 소문자, 하이픈, 최대 60자 (예: `browse-js-no-await`). 파일이 이미 존재하면 건너뜁니다. 세션당 최대 3개. 인라인으로 제출하고 계속 진행합니다 — 워크플로우를 멈추지 않습니다. 사용자에게 알립니다: "Filed gstack field report: {title}"

## Step 0: base branch 감지

이 PR이 어느 branch를 대상으로 하는지 파악합니다. 이후 모든 단계에서 이 결과를 "base branch"로 사용합니다.

1. 이 branch에 이미 PR이 있는지 확인합니다:
   `gh pr view --json baseRefName -q .baseRefName`
   성공하면 출력된 branch 이름을 base branch로 사용합니다.

2. PR이 없으면 (명령 실패 시), 저장소의 기본 branch를 감지합니다:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. 두 명령 모두 실패하면 `main`으로 대체합니다.

감지된 base branch 이름을 출력합니다. 이후 모든 `git diff`, `git log`,
`git fetch`, `git merge`, `gh pr create` 명령에서 지침에 "base branch"라고 적힌 부분을 감지된 branch 이름으로 대체합니다.

---

# Document Release: 배포 후 문서 업데이트

`/document-release` 워크플로우를 실행 중입니다. 이것은 `/ship` **이후** (코드 commit 완료, PR 존재 또는 곧 생성 예정), **PR이 merge되기 전**에 실행됩니다. 목표: 프로젝트의 모든 문서 파일이 정확하고, 최신이며, 친근하고 사용자 중심의 문체로 작성되어 있는지 확인합니다.

대부분 자동화됩니다. 명확한 사실적 업데이트는 직접 진행합니다. 위험하거나 주관적인 결정에만 멈춥니다.

**멈추는 경우:**
- 위험하거나 불확실한 문서 변경 (내러티브, 철학, 보안, 섹션 삭제, 대규모 재작성)
- VERSION 올림 결정 (아직 올리지 않은 경우)
- 새로운 TODOS 항목 추가
- 사실이 아닌 내러티브 측면의 교차 문서 모순

**절대 멈추지 않는 경우:**
- diff에서 명확하게 확인되는 사실적 수정
- 표/목록에 항목 추가
- 경로, 개수, 버전 번호 업데이트
- 오래된 교차 참조 수정
- CHANGELOG 문체 다듬기 (사소한 표현 조정)
- TODOS 완료 표시
- 교차 문서 사실적 불일치 (예: 버전 번호 불일치)

**절대 하지 않을 것:**
- CHANGELOG 항목 덮어쓰기, 교체, 재생성 — 문체만 다듬고, 모든 내용 보존
- 묻지 않고 VERSION 올리기 — 버전 변경 시 항상 AskUserQuestion 사용
- CHANGELOG.md에 `Write` 도구 사용 — 항상 정확한 `old_string` 매칭과 함께 `Edit` 사용

---

## Step 1: 사전 점검 및 Diff 분석

1. 현재 branch를 확인합니다. base branch에 있으면 **중단**: "base branch에 있습니다. feature branch에서 실행하세요."

2. 변경된 내용에 대한 컨텍스트를 수집합니다:

```bash
git diff <base>...HEAD --stat
```

```bash
git log <base>..HEAD --oneline
```

```bash
git diff <base>...HEAD --name-only
```

3. 저장소의 모든 문서 파일을 찾습니다:

```bash
find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.gstack/*" -not -path "./.context/*" | sort
```

4. 변경 사항을 문서와 관련된 카테고리로 분류합니다:
   - **새 기능** — 새 파일, 새 명령, 새 스킬, 새 기능
   - **동작 변경** — 수정된 서비스, 업데이트된 API, 설정 변경
   - **기능 제거** — 삭제된 파일, 제거된 명령
   - **인프라** — 빌드 시스템, 테스트 인프라, CI

5. 간단한 요약을 출력합니다: "N개 파일 변경 M개 commit 분석 중. 검토할 문서 파일 K개 발견."

---

## Step 2: 파일별 문서 감사

각 문서 파일을 읽고 diff와 교차 대조합니다. 다음 일반적인 기준을 사용합니다
(현재 프로젝트에 맞게 적용 — gstack에 특화된 기준이 아닙니다):

**README.md:**
- diff에서 확인되는 모든 기능과 역량을 설명하고 있는가?
- 설치/설정 지침이 변경 사항과 일치하는가?
- 예시, 데모, 사용 설명이 여전히 유효한가?
- 문제 해결 단계가 여전히 정확한가?

**ARCHITECTURE.md:**
- ASCII 다이어그램과 컴포넌트 설명이 현재 코드와 일치하는가?
- 설계 결정과 "왜" 설명이 여전히 정확한가?
- 보수적으로 — diff에서 명확히 모순되는 것만 업데이트합니다. Architecture 문서는 자주 변경되지 않는 것을 설명합니다.

**CONTRIBUTING.md — 신규 기여자 스모크 테스트:**
- 처음 기여하는 사람처럼 설정 지침을 따라갑니다.
- 나열된 명령이 정확한가? 각 단계가 성공할 것인가?
- 테스트 티어 설명이 현재 테스트 인프라와 일치하는가?
- 워크플로우 설명(개발 설정, contributor 모드 등)이 최신인가?
- 처음 기여하는 사람을 혼란스럽게 하거나 실패할 부분을 표시합니다.

**CLAUDE.md / 프로젝트 지침:**
- 프로젝트 구조 섹션이 실제 파일 트리와 일치하는가?
- 나열된 명령과 스크립트가 정확한가?
- 빌드/테스트 지침이 package.json (또는 동등한 파일)의 내용과 일치하는가?

**기타 .md 파일:**
- 파일을 읽고 목적과 대상 독자를 파악합니다.
- diff와 교차 대조하여 파일 내용과 모순되는 부분이 있는지 확인합니다.

각 파일에 대해 필요한 업데이트를 분류합니다:

- **자동 업데이트** — diff에서 명확히 확인되는 사실적 수정: 표에 항목 추가, 파일 경로 업데이트, 개수 수정, 프로젝트 구조 트리 업데이트.
- **사용자에게 묻기** — 내러티브 변경, 섹션 삭제, 보안 모델 변경, 대규모 재작성 (한 섹션에 약 10줄 이상), 관련성이 불분명한 경우, 완전히 새로운 섹션 추가.

---

## Step 3: 자동 업데이트 적용

Edit 도구를 사용해 모든 명확하고 사실적인 업데이트를 직접 진행합니다.

수정된 각 파일에 대해 **구체적으로 무엇이 변경되었는지** 한 줄 요약을 출력합니다 — "README.md 업데이트"가 아닌 "README.md: /new-skill을 스킬 표에 추가, 스킬 개수를 9에서 10으로 업데이트"처럼.

**절대 자동 업데이트하지 않을 것:**
- README 소개 또는 프로젝트 포지셔닝
- ARCHITECTURE 철학 또는 설계 근거
- 보안 모델 설명
- 어떤 문서에서도 전체 섹션 삭제 금지

---

## Step 4: 위험하거나 불확실한 변경 사항에 대해 묻기

Step 2에서 식별된 위험하거나 불확실한 업데이트 각각에 대해 AskUserQuestion을 사용합니다:
- 컨텍스트: 프로젝트 이름, branch, 어떤 문서 파일, 무엇을 검토 중인지
- 구체적인 문서 결정 사항
- `RECOMMENDATION: [X] 선택 — [한 줄 이유]`
- C) 건너뛰기 — 그대로 유지를 포함한 선택지

각 답변 후 승인된 변경 사항을 즉시 적용합니다.

---

## Step 5: CHANGELOG 문체 다듬기

**중요 — CHANGELOG 항목을 절대 덮어쓰지 않습니다.**

이 단계는 문체를 다듬습니다. CHANGELOG 내용을 재작성, 교체, 재생성하지 않습니다.

에이전트가 기존 CHANGELOG 항목을 보존해야 할 때 교체한 실제 사고가 발생했습니다. 이 스킬은 절대 그렇게 해서는 안 됩니다.

**규칙:**
1. 먼저 CHANGELOG.md 전체를 읽습니다. 이미 있는 내용을 파악합니다.
2. 기존 항목 내의 표현만 수정합니다. 항목을 삭제, 재정렬, 교체하지 않습니다.
3. CHANGELOG 항목을 처음부터 재생성하지 않습니다. 항목은 `/ship`이 실제 diff와 commit 이력으로 작성한 것입니다. 그것이 진실의 원천입니다. 당신은 산문을 다듬는 것이지, 역사를 재작성하는 것이 아닙니다.
4. 항목이 틀렸거나 불완전해 보이면 AskUserQuestion을 사용합니다 — 조용히 수정하지 않습니다.
5. 정확한 `old_string` 매칭과 함께 Edit 도구를 사용합니다 — CHANGELOG.md를 덮어쓰기 위해 Write를 사용하지 않습니다.

**이 branch에서 CHANGELOG가 수정되지 않은 경우:** 이 단계를 건너뜁니다.

**이 branch에서 CHANGELOG가 수정된 경우**, 항목의 문체를 검토합니다:

- **판매 테스트:** 각 항목을 읽는 사용자가 "오, 좋은데, 써보고 싶다"라고 생각할 것인가? 아니라면 내용이 아닌 표현을 재작성합니다.
- 사용자가 지금 **할 수 있는 것**으로 시작합니다 — 구현 세부 사항이 아닌.
- "이제 ...할 수 있습니다" 형식, "...을 리팩토링했습니다"가 아닌.
- commit 메시지처럼 읽히는 항목을 표시하고 재작성합니다.
- 내부/contributor 변경 사항은 별도의 "### For contributors" 하위 섹션에 넣습니다.
- 사소한 문체 조정은 자동으로 수정합니다. 재작성이 의미를 바꿀 경우 AskUserQuestion을 사용합니다.

---

## Step 6: 교차 문서 일관성 및 발견 가능성 확인

각 파일을 개별적으로 감사한 후, 교차 문서 일관성 검토를 수행합니다:

1. README의 기능/역량 목록이 CLAUDE.md(또는 프로젝트 지침)가 설명하는 것과 일치하는가?
2. ARCHITECTURE의 컴포넌트 목록이 CONTRIBUTING의 프로젝트 구조 설명과 일치하는가?
3. CHANGELOG의 최신 버전이 VERSION 파일과 일치하는가?
4. **발견 가능성:** 모든 문서 파일이 README.md 또는 CLAUDE.md에서 도달 가능한가? ARCHITECTURE.md가 존재하는데 README나 CLAUDE.md 어디에도 링크되어 있지 않으면 표시합니다. 모든 문서는 두 진입점 파일 중 하나에서 발견 가능해야 합니다.
5. 문서 간 모순을 표시합니다. 명확한 사실적 불일치(예: 버전 번호 불일치)는 자동으로 수정합니다. 내러티브 모순은 AskUserQuestion을 사용합니다.

---

## Step 7: TODOS.md 정리

이것은 `/ship`의 Step 5.5를 보완하는 두 번째 검토입니다. 표준 TODO 항목 형식에 대해서는 `review/TODOS-format.md`(있는 경우)를 읽습니다.

TODOS.md가 없으면 이 단계를 건너뜁니다.

1. **아직 완료 표시가 안 된 항목:** diff와 열린 TODO 항목을 교차 대조합니다. 이 branch의 변경으로 TODO가 명확히 완료된 경우, `**Completed:** vX.Y.Z.W (YYYY-MM-DD)`와 함께 완료 섹션으로 이동합니다. 보수적으로 — diff에서 명확한 증거가 있는 항목만 표시합니다.

2. **설명 업데이트가 필요한 항목:** TODO가 대폭 변경된 파일이나 컴포넌트를 참조하는 경우, 설명이 오래된 것일 수 있습니다. AskUserQuestion으로 TODO를 업데이트, 완료, 또는 그대로 유지할지 확인합니다.

3. **새로운 미뤄진 작업:** diff에서 `TODO`, `FIXME`, `HACK`, `XXX` 주석을 확인합니다. 의미 있는 미뤄진 작업을 나타내는 것(사소한 인라인 노트가 아닌)에 대해, AskUserQuestion으로 TODOS.md에 캡처할지 묻습니다.

---

## Step 8: VERSION 올림 확인

**중요 — 묻지 않고 절대 VERSION을 올리지 않습니다.**

1. **VERSION이 없으면:** 조용히 건너뜁니다.

2. 이 branch에서 VERSION이 이미 수정되었는지 확인합니다:

```bash
git diff <base>...HEAD -- VERSION
```

3. **VERSION이 올라가지 않은 경우:** AskUserQuestion 사용:
   - RECOMMENDATION: C(건너뛰기) 선택 — 문서만의 변경은 버전 올림이 필요한 경우가 드뭅니다
   - A) PATCH 올리기 (X.Y.Z+1) — 문서 변경이 코드 변경과 함께 배포되는 경우
   - B) MINOR 올리기 (X.Y+1.0) — 중요한 독립 릴리스인 경우
   - C) 건너뛰기 — 버전 올림 불필요

4. **VERSION이 이미 올라간 경우:** 조용히 건너뛰지 않습니다. 대신, 올림이 이 branch의 전체 변경 범위를 커버하는지 확인합니다:

   a. 현재 VERSION의 CHANGELOG 항목을 읽습니다. 어떤 기능을 설명하고 있는가?
   b. 전체 diff를 읽습니다(`git diff <base>...HEAD --stat`와 `git diff <base>...HEAD --name-only`). 현재 버전의 CHANGELOG 항목에 **언급되지 않은** 중요한 변경 사항(새 기능, 새 스킬, 새 명령, 대규모 리팩토링)이 있는가?
   c. **CHANGELOG 항목이 모든 것을 커버하면:** 건너뜁니다 — "VERSION: 이미 vX.Y.Z로 올라감, 모든 변경 사항 포함."을 출력합니다.
   d. **커버되지 않은 중요한 변경 사항이 있으면:** AskUserQuestion으로 현재 버전이 커버하는 것 vs 새로운 것을 설명하고 묻습니다:
      - RECOMMENDATION: A 선택 — 새 변경 사항은 자체 버전이 필요합니다
      - A) 다음 patch로 올리기 (X.Y.Z+1) — 새 변경 사항에 자체 버전 부여
      - B) 현재 버전 유지 — 기존 CHANGELOG 항목에 새 변경 사항 추가
      - C) 건너뛰기 — 버전 그대로 유지, 나중에 처리

   핵심 인사이트: "기능 A"를 위해 설정된 VERSION 올림은 기능 B가 자체 버전 항목을 받기에 충분히 중요하다면 "기능 B"를 조용히 흡수해서는 안 됩니다.

---

## Step 9: Commit 및 출력

**먼저 빈 변경 확인:** `git status`를 실행합니다(`-uall` 플래그 절대 사용 금지). 이전 단계에서 수정된 문서 파일이 없으면 "모든 문서가 최신 상태입니다."를 출력하고 commit 없이 종료합니다.

**Commit:**

1. 이름으로 수정된 문서 파일을 staging합니다 (`git add -A` 또는 `git add .` 절대 사용 금지).
2. 단일 commit 생성:

```bash
git commit -m "$(cat <<'EOF'
docs: update project documentation for vX.Y.Z.W

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

3. 현재 branch에 push:

```bash
git push
```

**PR body 업데이트 (멱등성, 레이스 안전):**

1. PID 고유 임시 파일에 기존 PR body를 읽습니다:

```bash
gh pr view --json body -q .body > /tmp/gstack-pr-body-$$.md
```

2. 임시 파일에 이미 `## Documentation` 섹션이 있으면 해당 섹션을 업데이트된 내용으로 교체합니다. 없으면 끝에 `## Documentation` 섹션을 추가합니다.

3. Documentation 섹션에는 **doc diff 미리보기**를 포함합니다 — 수정된 각 파일에 대해 구체적으로 변경된 내용을 설명합니다 (예: "README.md: /document-release를 스킬 표에 추가, 스킬 개수를 9에서 10으로 업데이트").

4. 업데이트된 body를 다시 작성합니다:

```bash
gh pr edit --body-file /tmp/gstack-pr-body-$$.md
```

5. 임시 파일을 정리합니다:

```bash
rm -f /tmp/gstack-pr-body-$$.md
```

6. `gh pr view`가 실패하면 (PR 없음): "PR을 찾을 수 없습니다 — body 업데이트를 건너뜁니다."라는 메시지와 함께 건너뜁니다.
7. `gh pr edit`이 실패하면: "PR body를 업데이트할 수 없습니다 — 문서 변경 사항은 commit에 있습니다."라고 경고하고 계속합니다.

**구조화된 문서 상태 요약 (최종 출력):**

모든 문서 파일의 상태를 한눈에 볼 수 있는 요약을 출력합니다:

```
Documentation health:
  README.md       [status] ([details])
  ARCHITECTURE.md [status] ([details])
  CONTRIBUTING.md [status] ([details])
  CHANGELOG.md    [status] ([details])
  TODOS.md        [status] ([details])
  VERSION         [status] ([details])
```

status는 다음 중 하나입니다:
- Updated — 변경된 내용 설명 포함
- Current — 변경 불필요
- Voice polished — 표현 조정됨
- Not bumped — 사용자가 건너뛰기 선택
- Already bumped — /ship에 의해 버전이 설정됨
- Skipped — 파일이 존재하지 않음

---

## 중요 규칙

- **편집 전 읽기.** 파일을 수정하기 전에 항상 전체 내용을 읽습니다.
- **CHANGELOG를 절대 덮어쓰지 않습니다.** 문체만 다듬습니다. 항목을 삭제, 교체, 재생성하지 않습니다.
- **VERSION을 묻지 않고 올리지 않습니다.** 항상 묻습니다. 이미 올라간 경우에도 변경 전체 범위를 커버하는지 확인합니다.
- **변경된 내용을 명확히 합니다.** 모든 편집에는 한 줄 요약이 있습니다.
- **일반 기준, 프로젝트 특화 아님.** 감사 검토는 어떤 저장소에서도 작동합니다.
- **발견 가능성이 중요합니다.** 모든 문서 파일은 README 또는 CLAUDE.md에서 도달 가능해야 합니다.
- **문체: 친근하고, 사용자 중심이며, 모호하지 않게.** 코드를 본 적 없는 영리한 사람에게 설명하듯 작성합니다.
