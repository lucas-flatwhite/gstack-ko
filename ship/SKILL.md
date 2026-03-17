---
name: ship
version: 1.0.0
description: |
  Ship 워크플로: base 브랜치 감지 및 merge, 테스트 실행, diff 리뷰, VERSION 업데이트, CHANGELOG 작성, commit, push, PR 생성.
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

# Ship: 완전 자동화 Ship 워크플로

`/ship` 워크플로를 실행 중입니다. 이것은 **비대화형, 완전 자동화** 워크플로입니다. 어떤 단계에서도 확인을 요청하지 않습니다. 사용자가 `/ship`을 입력했다는 것은 실행하라는 의미입니다. 끝까지 진행하고 마지막에 PR URL을 출력합니다.

**중지할 상황:**
- base 브랜치에 있는 경우 (중단)
- 자동으로 해결할 수 없는 merge 충돌 (중지, 충돌 표시)
- 테스트 실패 (중지, 실패 내용 표시)
- Pre-landing 리뷰에서 사용자 판단이 필요한 ASK 항목 발견
- MINOR 또는 MAJOR 버전 업 필요 (질문 — Step 4 참조)
- 사용자 결정이 필요한 Greptile 리뷰 코멘트 (복잡한 수정, false positive)
- TODOS.md가 없고 사용자가 생성을 원하는 경우 (질문 — Step 5.5 참조)
- TODOS.md가 정리되지 않았고 사용자가 재정리를 원하는 경우 (질문 — Step 5.5 참조)

**중지하지 않을 상황:**
- 미커밋 변경사항 (항상 포함)
- 버전 업 선택 (MICRO 또는 PATCH 자동 선택 — Step 4 참조)
- CHANGELOG 내용 (diff에서 자동 생성)
- commit 메시지 승인 (자동 commit)
- 다중 파일 변경셋 (bisectable commit으로 자동 분리)
- TODOS.md 완료 항목 감지 (자동 표시)
- 자동 수정 가능한 리뷰 발견 사항 (데드 코드, N+1, 오래된 주석 — 자동 수정)

---

## Step 1: Pre-flight 확인

1. 현재 브랜치를 확인합니다. base 브랜치나 저장소의 default 브랜치에 있다면 **중단**: "You're on the base branch. Ship from a feature branch."

2. `git status`를 실행합니다 (`-uall` 사용 금지). 미커밋 변경사항은 항상 포함됩니다 — 질문할 필요 없습니다.

3. `git diff <base>...HEAD --stat`과 `git log <base>..HEAD --oneline`을 실행하여 ship될 내용을 파악합니다.

---

## Step 2: Base 브랜치 Merge (테스트 전)

테스트가 merge된 상태에서 실행되도록 base 브랜치를 feature 브랜치에 fetch하고 merge합니다:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**merge 충돌이 있는 경우:** 단순한 충돌이면 자동 해결을 시도합니다 (VERSION, schema.rb, CHANGELOG 순서). 충돌이 복잡하거나 모호한 경우 **중지**하고 충돌을 표시합니다.

**이미 최신 상태인 경우:** 조용히 계속 진행합니다.

---

## Step 3: 테스트 실행 (merge된 코드 기준)

**`RAILS_ENV=test bin/rails db:migrate`를 실행하지 마세요** — `bin/test-lane`이 내부적으로 이미
`db:test:prepare`를 호출합니다. 이는 올바른 lane 데이터베이스에 스키마를 로드합니다.
INSTANCE 없이 bare test migrations를 실행하면 orphan DB에 접근하여 structure.sql이 손상됩니다.

두 테스트 스위트를 병렬로 실행합니다:

```bash
bin/test-lane 2>&1 | tee /tmp/ship_tests.txt &
npm run test 2>&1 | tee /tmp/ship_vitest.txt &
wait
```

둘 다 완료된 후 출력 파일을 읽고 통과/실패를 확인합니다.

**테스트가 실패하는 경우:** 실패 내용을 표시하고 **중지합니다**. 계속 진행하지 않습니다.

**모두 통과하는 경우:** 조용히 계속 진행합니다 — 카운트만 간략히 메모합니다.

---

## Step 3.25: Eval 스위트 (조건부)

Eval은 프롬프트 관련 파일이 변경될 때 필수입니다. diff에 프롬프트 파일이 없으면 이 단계를 완전히 건너뜁니다.

**1. diff가 프롬프트 관련 파일에 영향을 미치는지 확인합니다:**

```bash
git diff origin/<base> --name-only
```

다음 패턴과 대조합니다 (CLAUDE.md 기준):
- `app/services/*_prompt_builder.rb`
- `app/services/*_generation_service.rb`, `*_writer_service.rb`, `*_designer_service.rb`
- `app/services/*_evaluator.rb`, `*_scorer.rb`, `*_classifier_service.rb`, `*_analyzer.rb`
- `app/services/concerns/*voice*.rb`, `*writing*.rb`, `*prompt*.rb`, `*token*.rb`
- `app/services/chat_tools/*.rb`, `app/services/x_thread_tools/*.rb`
- `config/system_prompts/*.txt`
- `test/evals/**/*` (eval 인프라 변경은 모든 스위트에 영향)

**일치하는 것이 없으면:** "No prompt-related files changed — skipping evals."를 출력하고 Step 3.5로 계속합니다.

**2. 영향받는 eval 스위트 식별:**

각 eval runner (`test/evals/*_eval_runner.rb`)는 영향을 미치는 소스 파일 목록인 `PROMPT_SOURCE_FILES`를 선언합니다. 이를 grep하여 변경된 파일과 일치하는 스위트를 찾습니다:

```bash
grep -l "changed_file_basename" test/evals/*_eval_runner.rb
```

runner → test 파일 매핑: `post_generation_eval_runner.rb` → `post_generation_eval_test.rb`.

**특수 케이스:**
- `test/evals/judges/*.rb`, `test/evals/support/*.rb`, `test/evals/fixtures/` 변경은 해당 judges/support 파일을 사용하는 모든 스위트에 영향을 미칩니다. eval test 파일의 import를 확인하여 어느 스위트가 해당하는지 파악합니다.
- `config/system_prompts/*.txt` 변경 — eval runner에서 프롬프트 파일명을 grep하여 영향받는 스위트를 찾습니다.
- 어느 스위트가 영향받는지 불확실한 경우, 영향받을 가능성이 있는 모든 스위트를 실행합니다. 과테스트가 회귀를 놓치는 것보다 낫습니다.

**3. 영향받는 스위트를 `EVAL_JUDGE_TIER=full`로 실행합니다:**

`/ship`은 pre-merge 게이트이므로 항상 full tier를 사용합니다 (Sonnet 구조 + Opus 페르소나 judges).

```bash
EVAL_JUDGE_TIER=full EVAL_VERBOSE=1 bin/test-lane --eval test/evals/<suite>_eval_test.rb 2>&1 | tee /tmp/ship_evals.txt
```

여러 스위트를 실행해야 하는 경우 순차적으로 실행합니다 (각각 test lane이 필요). 첫 번째 스위트가 실패하면 즉시 중지합니다 — 남은 스위트에 API 비용을 쓰지 않습니다.

**4. 결과 확인:**

- **eval이 실패하는 경우:** 실패 내용, 비용 대시보드를 표시하고 **중지합니다**. 계속 진행하지 않습니다.
- **모두 통과하는 경우:** 통과 카운트와 비용을 메모합니다. Step 3.5로 계속합니다.

**5. eval 출력 저장** — PR 본문에 eval 결과와 비용 대시보드를 포함합니다 (Step 8).

**Tier 참조 (컨텍스트용 — /ship은 항상 `full` 사용):**
| Tier | 사용 시점 | 속도 (캐시) | 비용 |
|------|-----------|-------------|------|
| `fast` (Haiku) | 개발 반복, 스모크 테스트 | ~5s (14x 빠름) | ~$0.07/run |
| `standard` (Sonnet) | 기본 개발, `bin/test-lane --eval` | ~17s (4x 빠름) | ~$0.37/run |
| `full` (Opus 페르소나) | **`/ship` 및 pre-merge** | ~72s (기준) | ~$1.27/run |

---

## Step 3.5: Pre-Landing 리뷰

테스트로는 잡히지 않는 구조적 문제에 대해 diff를 리뷰합니다.

1. `.claude/skills/review/checklist.md`를 읽습니다. 파일을 읽을 수 없으면 **중지**하고 오류를 보고합니다.

2. `git diff origin/<base>`를 실행하여 전체 diff를 가져옵니다 (최신 fetch된 base 브랜치 대비 feature 변경사항으로 범위 지정).

3. 두 번의 pass로 리뷰 체크리스트를 적용합니다:
   - **Pass 1 (CRITICAL):** SQL & 데이터 안전성, LLM 출력 신뢰 경계
   - **Pass 2 (INFORMATIONAL):** 나머지 모든 카테고리

4. checklist.md의 Fix-First Heuristic에 따라 **각 발견 사항을 AUTO-FIX 또는 ASK로 분류합니다**. Critical 발견은 ASK 쪽으로, informational은 AUTO-FIX 쪽으로 기웁니다.

5. **모든 AUTO-FIX 항목을 자동 수정합니다.** 각 수정을 적용합니다. 수정당 한 줄을 출력합니다:
   `[AUTO-FIXED] [file:line] Problem → what you did`

6. **ASK 항목이 남아 있으면** 하나의 AskUserQuestion으로 제시합니다:
   - 각 항목을 번호, 심각도, 문제, 권장 수정과 함께 나열합니다
   - 항목별 옵션: A) 수정  B) 건너뜀
   - 전체 RECOMMENDATION
   - ASK 항목이 3개 이하인 경우 개별 AskUserQuestion 호출 사용 가능

7. **모든 수정(자동 + 사용자 승인) 후:**
   - 수정이 적용된 경우: 이름으로 수정된 파일을 commit합니다 (`git add <fixed-files> && git commit -m "fix: pre-landing review fixes"`). 그 후 **중지**하고 사용자에게 다시 `/ship`을 실행하도록 안내합니다.
   - 수정이 없는 경우 (모든 ASK 항목을 건너뛰거나 이슈 없음): Step 4로 계속합니다.

8. 요약 출력: `Pre-Landing Review: N issues — M auto-fixed, K asked (J fixed, L skipped)`

   이슈 없는 경우: `Pre-Landing Review: No issues found.`

리뷰 출력을 저장합니다 — Step 8에서 PR 본문에 들어갑니다.

---

## Step 3.75: Greptile 리뷰 코멘트 처리 (PR이 있는 경우)

`.claude/skills/review/greptile-triage.md`를 읽고 fetch, filter, classify, **escalation detection** 단계를 따릅니다.

**PR이 없거나, `gh` 실패, API 오류, Greptile 코멘트가 0개인 경우:** 이 단계를 조용히 건너뜁니다. Step 4로 계속합니다.

**Greptile 코멘트가 발견된 경우:**

출력에 Greptile 요약 포함: `+ N Greptile comments (X valid, Y fixed, Z FP)`

코멘트에 답하기 전에 greptile-triage.md의 **Escalation Detection** 알고리즘을 실행하여 Tier 1(친근한) 또는 Tier 2(단호한) 답변 템플릿 중 어느 것을 사용할지 결정합니다.

각 분류된 코멘트에 대해:

**VALID & ACTIONABLE:** AskUserQuestion 사용:
- 코멘트 (file:line 또는 [top-level] + 본문 요약 + permalink URL)
- `RECOMMENDATION: Choose A because [한 줄 이유]`
- 옵션: A) 지금 수정, B) 인정하고 그냥 ship, C) False positive입니다
- 사용자가 A를 선택하면: 수정을 적용하고 수정된 파일을 commit합니다 (`git add <fixed-files> && git commit -m "fix: address Greptile review — <간략한 설명>"`). greptile-triage.md의 **Fix reply template**을 사용하여 답변합니다 (인라인 diff + 설명 포함). per-project와 global greptile-history 모두에 저장합니다 (type: fix).
- 사용자가 C를 선택하면: greptile-triage.md의 **False Positive reply template**을 사용하여 답변합니다 (증거 + 재랭크 제안 포함). per-project와 global greptile-history 모두에 저장합니다 (type: fp).

**VALID BUT ALREADY FIXED:** greptile-triage.md의 **Already Fixed reply template**을 사용하여 답변합니다 — AskUserQuestion 불필요:
- 무엇이 완료되었는지와 수정 commit SHA 포함
- per-project와 global greptile-history 모두에 저장합니다 (type: already-fixed)

**FALSE POSITIVE:** AskUserQuestion 사용:
- 코멘트와 왜 틀렸다고 생각하는지 표시 (file:line 또는 [top-level] + 본문 요약 + permalink URL)
- 옵션:
  - A) false positive인 이유를 Greptile에게 답변 (명확하게 틀린 경우 권장)
  - B) 어쨌든 수정 (사소한 경우)
  - C) 조용히 무시
- 사용자가 A를 선택하면: greptile-triage.md의 **False Positive reply template**을 사용하여 답변합니다 (증거 + 재랭크 제안 포함). per-project와 global greptile-history 모두에 저장합니다 (type: fp)

**SUPPRESSED:** 조용히 건너뜁니다 — 이전 triage에서 확인된 known false positive입니다.

**모든 코멘트 해결 후:** 수정이 적용된 경우 Step 3의 테스트가 이제 오래된 상태입니다. Step 4로 계속하기 전에 **테스트를 다시 실행합니다** (Step 3). 수정이 없는 경우 Step 4로 계속합니다.

---

## Step 4: 버전 업 (자동 결정)

1. 현재 `VERSION` 파일을 읽습니다 (4자리 형식: `MAJOR.MINOR.PATCH.MICRO`)

2. **diff를 기반으로 업 레벨을 자동 결정합니다:**
   - 변경된 라인 수를 셉니다 (`git diff origin/<base>...HEAD --stat | tail -1`)
   - **MICRO** (4번째 자리): 50줄 미만 변경, 사소한 수정, 오타, 설정
   - **PATCH** (3번째 자리): 50줄 이상 변경, 버그 수정, 소-중형 기능
   - **MINOR** (2번째 자리): **사용자에게 질문** — 주요 기능 또는 상당한 아키텍처 변경에만 해당
   - **MAJOR** (1번째 자리): **사용자에게 질문** — 마일스톤 또는 breaking change에만 해당

3. 새 버전을 계산합니다:
   - 자리를 올리면 오른쪽의 모든 자리는 0으로 초기화됩니다
   - 예시: `0.19.1.0` + PATCH → `0.19.2.0`

4. `VERSION` 파일에 새 버전을 씁니다.

---

## Step 5: CHANGELOG (자동 생성)

1. `CHANGELOG.md` 헤더를 읽어 형식을 파악합니다.

2. **브랜치의 모든 commit**에서 항목을 자동 생성합니다 (최근 것만이 아니라):
   - `git log <base>..HEAD --oneline`으로 ship될 모든 commit 확인
   - `git diff <base>...HEAD`로 base 브랜치 대비 전체 diff 확인
   - CHANGELOG 항목은 PR에 들어가는 모든 변경사항을 포괄해야 합니다
   - 브랜치의 기존 CHANGELOG 항목이 일부 commit을 이미 다루고 있다면, 새 버전의 단일 통합 항목으로 교체합니다
   - 변경사항을 해당 섹션으로 분류합니다:
     - `### Added` — 새 기능
     - `### Changed` — 기존 기능 변경
     - `### Fixed` — 버그 수정
     - `### Removed` — 제거된 기능
   - 간결하고 설명적인 bullet point를 작성합니다
   - 파일 헤더(5번째 줄) 이후에 오늘 날짜로 삽입합니다
   - 형식: `## [X.Y.Z.W] - YYYY-MM-DD`

**사용자에게 변경사항 설명을 요청하지 않습니다.** diff와 commit 히스토리에서 추론합니다.

---

## Step 5.5: TODOS.md (자동 업데이트)

프로젝트의 TODOS.md를 ship될 변경사항과 교차 참조합니다. 완료된 항목은 자동으로 표시합니다. 파일이 없거나 정리가 안 된 경우에만 질문합니다.

`.claude/skills/review/TODOS-format.md`를 읽어 표준 형식 참조서로 사용합니다.

**1. 저장소 루트에 TODOS.md가 존재하는지 확인합니다.**

**TODOS.md가 없는 경우:** AskUserQuestion 사용:
- 메시지: "GStack recommends maintaining a TODOS.md organized by skill/component, then priority (P0 at top through P4, then Completed at bottom). See TODOS-format.md for the full format. Would you like to create one?"
- 옵션: A) 지금 생성, B) 지금은 건너뜀
- A를 선택하면: 기본 틀(# TODOS 제목 + ## Completed 섹션)로 `TODOS.md`를 생성합니다. 3단계로 계속합니다.
- B를 선택하면: Step 5.5의 나머지를 건너뜁니다. Step 6으로 계속합니다.

**2. 구조와 정리 상태를 확인합니다:**

TODOS.md를 읽고 권장 구조를 따르는지 확인합니다:
- `## <Skill/Component>` 헤딩 아래 항목 그룹화
- 각 항목에 P0-P4 값의 `**Priority:**` 필드 포함
- 하단에 `## Completed` 섹션 포함

**정리가 안 된 경우** (priority 필드 없음, 컴포넌트 그룹화 없음, Completed 섹션 없음): AskUserQuestion 사용:
- 메시지: "TODOS.md doesn't follow the recommended structure (skill/component groupings, P0-P4 priority, Completed section). Would you like to reorganize it?"
- 옵션: A) 지금 재정리 (권장), B) 그대로 유지
- A를 선택하면: TODOS-format.md를 따라 제자리에서 재정리합니다. 모든 내용을 보존합니다 — 구조만 재편하고 항목은 절대 삭제하지 않습니다.
- B를 선택하면: 재정리 없이 3단계로 계속합니다.

**3. 완료된 TODO 감지:**

이 단계는 완전 자동 — 사용자 상호작용 없음.

이전 단계에서 이미 수집한 diff와 commit 히스토리를 사용합니다:
- `git diff <base>...HEAD` (base 브랜치 대비 전체 diff)
- `git log <base>..HEAD --oneline` (ship될 모든 commit)

각 TODO 항목에 대해, 이 PR의 변경사항이 해당 항목을 완료하는지 확인합니다:
- commit 메시지와 TODO 제목 및 설명 대조
- TODO에 참조된 파일이 diff에 나타나는지 확인
- TODO에 설명된 작업이 기능 변경사항과 일치하는지 확인

**보수적으로 판단합니다:** diff에 명확한 증거가 있는 경우에만 TODO를 완료로 표시합니다. 불확실한 경우 그대로 둡니다.

**4. 완료된 항목을** 하단의 `## Completed` 섹션으로 이동합니다. 다음을 추가합니다: `**Completed:** vX.Y.Z (YYYY-MM-DD)`

**5. 요약 출력:**
- `TODOS.md: N items marked complete (item1, item2, ...). M items remaining.`
- 또는: `TODOS.md: No completed items detected. M items remaining.`
- 또는: `TODOS.md: Created.` / `TODOS.md: Reorganized.`

**6. 방어 처리:** TODOS.md를 쓸 수 없는 경우 (권한 오류, 디스크 꽉 참), 사용자에게 경고하고 계속합니다. TODOS 실패로 ship 워크플로를 절대 중지하지 않습니다.

이 요약을 저장합니다 — Step 8에서 PR 본문에 들어갑니다.

---

## Step 6: Commit (bisectable chunks)

**목표:** `git bisect`에 잘 맞고 LLM이 변경사항을 이해하는 데 도움이 되는 작고 논리적인 commit을 만듭니다.

1. diff를 분석하고 변경사항을 논리적인 commit으로 그룹화합니다. 각 commit은 **하나의 일관된 변경**을 나타내야 합니다 — 하나의 파일이 아니라 하나의 논리적 단위.

2. **Commit 순서** (이른 commit 먼저):
   - **인프라:** 마이그레이션, 설정 변경, 라우트 추가
   - **모델 & 서비스:** 새 모델, 서비스, concerns (테스트 포함)
   - **컨트롤러 & views:** 컨트롤러, views, JS/React 컴포넌트 (테스트 포함)
   - **VERSION + CHANGELOG + TODOS.md:** 항상 마지막 commit에

3. **분리 규칙:**
   - 모델과 테스트 파일은 같은 commit에
   - 서비스와 테스트 파일은 같은 commit에
   - 컨트롤러, views, 테스트는 같은 commit에
   - 마이그레이션은 별도 commit (또는 지원하는 모델과 그룹화)
   - 설정/라우트 변경은 활성화하는 기능과 그룹화 가능
   - 전체 diff가 작은 경우 (4개 미만 파일의 50줄 미만), 단일 commit도 괜찮습니다

4. **각 commit은 독립적으로 유효해야 합니다** — broken import 없음, 아직 존재하지 않는 코드 참조 없음. 의존성이 먼저 오도록 commit 순서를 지정합니다.

5. 각 commit 메시지를 작성합니다:
   - 첫 번째 줄: `<type>: <summary>` (type = feat/fix/chore/refactor/docs)
   - 본문: 이 commit에 무엇이 포함되는지 간략한 설명
   - **마지막 commit**만 (VERSION + CHANGELOG) 버전 태그와 co-author trailer를 포함합니다:

```bash
git commit -m "$(cat <<'EOF'
chore: bump version and changelog (vX.Y.Z.W)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 7: Push

upstream tracking과 함께 remote에 push합니다:

```bash
git push -u origin <branch-name>
```

---

## Step 8: PR 생성

`gh`를 사용하여 pull request를 생성합니다:

```bash
gh pr create --base <base> --title "<type>: <summary>" --body "$(cat <<'EOF'
## Summary
<bullet points from CHANGELOG>

## Pre-Landing Review
<findings from Step 3.5, or "No issues found.">

## Eval Results
<If evals ran: suite names, pass/fail counts, cost dashboard summary. If skipped: "No prompt-related files changed — evals skipped.">

## Greptile Review
<If Greptile comments were found: bullet list with [FIXED] / [FALSE POSITIVE] / [ALREADY FIXED] tag + one-line summary per comment>
<If no Greptile comments found: "No Greptile comments.">
<If no PR existed during Step 3.75: omit this section entirely>

## TODOS
<If items marked complete: bullet list of completed items with version>
<If no items completed: "No TODO items completed in this PR.">
<If TODOS.md created or reorganized: note that>
<If TODOS.md doesn't exist and user skipped: omit this section>

## Test plan
- [x] All Rails tests pass (N runs, 0 failures)
- [x] All Vitest tests pass (N tests)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**PR URL을 출력합니다** — 사용자가 마지막으로 보게 되는 최종 출력이어야 합니다.

---

## 중요 규칙

- **테스트를 절대 건너뛰지 않습니다.** 테스트가 실패하면 중지합니다.
- **Pre-landing 리뷰를 절대 건너뛰지 않습니다.** checklist.md를 읽을 수 없으면 중지합니다.
- **Force push를 절대 하지 않습니다.** 일반 `git push`만 사용합니다.
- **확인을 절대 요청하지 않습니다** — MINOR/MAJOR 버전 업과 pre-landing 리뷰 ASK 항목(최대 하나의 AskUserQuestion으로 일괄 처리) 제외.
- **항상 VERSION 파일의 4자리 버전 형식을 사용합니다.**
- **CHANGELOG의 날짜 형식:** `YYYY-MM-DD`
- **bisectability를 위해 commit을 분리합니다** — 각 commit = 하나의 논리적 변경.
- **TODOS.md 완료 감지는 보수적이어야 합니다.** diff에서 작업이 완료되었음을 명확히 보여줄 때만 항목을 완료로 표시합니다.
- **greptile-triage.md의 Greptile 답변 템플릿을 사용합니다.** 모든 답변에는 증거가 포함됩니다 (인라인 diff, 코드 참조, 재랭크 제안). 모호한 답변은 절대 게시하지 않습니다.
- **목표는: 사용자가 `/ship`을 입력하면 그 다음에 리뷰 + PR URL이 보이는 것입니다.**
