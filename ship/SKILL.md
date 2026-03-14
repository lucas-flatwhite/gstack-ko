---
name: ship
version: 1.0.0
description: |
  배포 워크플로우: main 병합, 테스트 실행, diff 검토, VERSION 업데이트, CHANGELOG 작성, 커밋, 푸시, PR 생성.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Ship: 완전 자동화 배포 워크플로우

`/ship` 워크플로우를 실행합니다. **비대화형, 완전 자동화** 워크플로우입니다. 어떤 단계에서도 확인을 요청하지 않습니다. 사용자가 `/ship`이라고 말했다는 것은 실행하라는 의미입니다. 직선으로 진행하여 마지막에 PR URL을 출력합니다.

**중지 조건:**
- `main` 브랜치에 있을 때 (중단)
- 자동으로 해결할 수 없는 병합 충돌 (중지, 충돌 표시)
- 테스트 실패 (중지, 실패 표시)
- 랜딩 전 검토에서 CRITICAL 이슈가 발견되고 사용자가 수정을 선택할 때 (인지 또는 건너뛰기가 아닌)
- MINOR 또는 MAJOR 버전 업데이트 필요 (물어보기 — Step 4 참조)

**절대 중지하지 않는 경우:**
- 미커밋 변경사항 (항상 포함)
- 버전 업데이트 선택 (MICRO 또는 PATCH 자동 선택 — Step 4 참조)
- CHANGELOG 내용 (diff에서 자동 생성)
- 커밋 메시지 승인 (자동 커밋)
- 멀티 파일 변경세트 (자동 분할하여 bisectable 커밋)

---

## Step 1: 사전 확인

1. 현재 브랜치 확인. `main`에 있으면 **중단**: "main에 있습니다. 기능 브랜치에서 배포하세요."

2. `git status` 실행 (`-uall` 절대 사용 안 함). 미커밋 변경사항은 항상 포함 — 물어볼 필요 없음.

3. `git diff main...HEAD --stat` 및 `git log main..HEAD --oneline`을 실행하여 배포되는 내용을 파악합니다.

---

## Step 2: origin/main 병합 (테스트 전)

병합된 상태에서 테스트가 실행되도록 기능 브랜치에 `origin/main`을 가져와 병합합니다:

```bash
git fetch origin main && git merge origin/main --no-edit
```

**병합 충돌이 있는 경우:** 단순한 경우(VERSION, schema.rb, CHANGELOG 순서)는 자동 해결을 시도합니다. 충돌이 복잡하거나 모호하면 **중지**하고 표시합니다.

**이미 최신인 경우:** 조용히 계속합니다.

---

## Step 3: 테스트 실행 (병합된 코드에서)

**`RAILS_ENV=test bin/rails db:migrate`를 단독으로 실행하지 않습니다** — `bin/test-lane`이 내부적으로 `db:test:prepare`를 호출하며, 이것이 올바른 lane 데이터베이스에 스키마를 로드합니다. INSTANCE 없이 단독 테스트 마이그레이션을 실행하면 고아 DB를 건드려 structure.sql을 손상시킵니다.

두 테스트 스위트를 병렬로 실행합니다:

```bash
bin/test-lane 2>&1 | tee /tmp/ship_tests.txt &
npm run test 2>&1 | tee /tmp/ship_vitest.txt &
wait
```

둘 다 완료된 후 출력 파일을 읽고 통과/실패를 확인합니다.

**어떤 테스트가 실패하면:** 실패를 표시하고 **중지**합니다. 진행하지 않습니다.

**모두 통과하면:** 조용히 계속합니다 — 카운트만 간략히 언급합니다.

---

## Step 3.25: Eval 스위트 (조건부)

Eval은 프롬프트 관련 파일이 변경될 때 필수입니다. diff에 프롬프트 파일이 없으면 이 단계를 완전히 건너뜁니다.

**1. diff가 프롬프트 관련 파일을 터치하는지 확인:**

```bash
git diff origin/main --name-only
```

다음 패턴과 대조합니다 (CLAUDE.md에서):
- `app/services/*_prompt_builder.rb`
- `app/services/*_generation_service.rb`, `*_writer_service.rb`, `*_designer_service.rb`
- `app/services/*_evaluator.rb`, `*_scorer.rb`, `*_classifier_service.rb`, `*_analyzer.rb`
- `app/services/concerns/*voice*.rb`, `*writing*.rb`, `*prompt*.rb`, `*token*.rb`
- `app/services/chat_tools/*.rb`, `app/services/x_thread_tools/*.rb`
- `config/system_prompts/*.txt`
- `test/evals/**/*` (eval 인프라 변경은 모든 스위트에 영향)

**매치가 없으면:** "프롬프트 관련 파일 변경 없음 — eval 건너뜀"을 출력하고 Step 3.5로 계속합니다.

**2. 영향받는 eval 스위트 식별:**

각 eval runner(`test/evals/*_eval_runner.rb`)는 어떤 소스 파일이 영향을 미치는지 나열하는 `PROMPT_SOURCE_FILES`를 선언합니다. 변경된 파일과 일치하는 스위트를 찾기 위해 이것들을 grep합니다:

```bash
grep -l "changed_file_basename" test/evals/*_eval_runner.rb
```

runner → 테스트 파일 매핑: `post_generation_eval_runner.rb` → `post_generation_eval_test.rb`.

**3. 영향받는 스위트를 `EVAL_JUDGE_TIER=full`로 실행:**

`/ship`은 병합 전 게이트이므로 항상 full tier를 사용합니다(Sonnet 구조적 + Opus 페르소나 judges).

```bash
EVAL_JUDGE_TIER=full EVAL_VERBOSE=1 bin/test-lane --eval test/evals/<suite>_eval_test.rb 2>&1 | tee /tmp/ship_evals.txt
```

**4. 결과 확인:**

- **eval이 실패하면:** 실패, 비용 대시보드를 표시하고 **중지**합니다.
- **모두 통과하면:** 통과 카운트와 비용을 언급합니다. Step 3.5로 계속합니다.

**5. eval 출력 저장** — Step 8에서 PR 본문에 eval 결과와 비용 대시보드를 포함합니다.

---

## Step 3.5: 랜딩 전 검토

테스트가 잡아내지 못하는 구조적 이슈를 위해 diff를 검토합니다.

1. `.claude/skills/review/checklist.md`를 읽습니다. 파일을 읽을 수 없으면 **중지**하고 에러를 보고합니다.

2. `git diff origin/main`을 실행하여 전체 diff를 가져옵니다.

3. 두 단계로 검토 체크리스트를 적용합니다:
   - **Pass 1 (CRITICAL):** SQL 및 데이터 안전성, LLM 출력 신뢰 경계
   - **Pass 2 (INFORMATIONAL):** 나머지 모든 카테고리

4. **모든 결과를 항상 출력합니다** — critical과 informational 모두.

5. 요약 헤더 출력: `랜딩 전 검토: N개 이슈 (X개 critical, Y개 informational)`

6. **CRITICAL 이슈가 발견된 경우:** 각 critical 이슈에 대해 별도 AskUserQuestion을 사용합니다:
   - 문제 (`file:line` + 설명)
   - 권장 수정사항
   - 옵션: A) 지금 수정 (권고), B) 인지하고 배포, C) 오탐 — 건너뛰기
   모든 critical 이슈 해결 후: 어떤 이슈에서 A(수정)를 선택했다면, 권장 수정사항을 적용하고, 수정된 파일만 이름으로 커밋한 후(`git add <fixed-files> && git commit -m "fix: 랜딩 전 검토 수정사항 적용"`), **중지**하고 수정사항이 적용된 상태에서 다시 테스트하려면 `/ship`을 다시 실행하라고 알립니다. B(인지) 또는 C(오탐)만 선택했다면, Step 4로 계속합니다.

7. **non-critical 이슈만 발견된 경우:** 출력하고 계속합니다. Step 8에서 PR 본문에 포함됩니다.

8. **이슈 없는 경우:** `랜딩 전 검토: 이슈가 발견되지 않았습니다.`를 출력하고 계속합니다.

검토 출력을 저장합니다 — Step 8에서 PR 본문에 들어갑니다.

---

## Step 4: 버전 업데이트 (자동 결정)

1. 현재 `VERSION` 파일 읽기 (4자리 형식: `MAJOR.MINOR.PATCH.MICRO`)

2. **diff를 기반으로 자동 결정:**
   - 변경된 줄 카운트 (`git diff origin/main...HEAD --stat | tail -1`)
   - **MICRO** (4번째 자리): < 50줄 변경, 사소한 조정, 오타, 설정
   - **PATCH** (3번째 자리): 50줄 이상 변경, 버그 수정, 소규모-중규모 기능
   - **MINOR** (2번째 자리): **사용자에게 물어보기** — 주요 기능이나 중요한 아키텍처 변경에만
   - **MAJOR** (1번째 자리): **사용자에게 물어보기** — 마일스톤이나 호환성을 깨는 변경에만

3. 새 버전 계산:
   - 자리 업데이트 시 오른쪽의 모든 자리를 0으로 리셋
   - 예: `0.19.1.0` + PATCH → `0.19.2.0`

4. `VERSION` 파일에 새 버전 작성.

---

## Step 5: CHANGELOG (자동 생성)

1. `CHANGELOG.md` 헤더를 읽어 형식을 파악합니다.

2. **브랜치의 모든 커밋**에서 항목을 자동 생성합니다:
   - `git log main..HEAD --oneline`으로 배포되는 모든 커밋 확인
   - `git diff main...HEAD`로 main 대비 전체 diff 확인
   - CHANGELOG 항목은 PR에 들어가는 모든 변경사항을 포괄해야 함
   - 해당 섹션으로 변경사항 분류:
     - `### 추가됨` — 새 기능
     - `### 변경됨` — 기존 기능의 변경사항
     - `### 수정됨` — 버그 수정
     - `### 제거됨` — 제거된 기능
   - 간결하고 설명적인 불릿 포인트 작성
   - 파일 헤더(5번 줄) 후에 삽입, 오늘 날짜 포함
   - 형식: `## [X.Y.Z.W] - YYYY-MM-DD`

**변경사항 설명을 사용자에게 묻지 않습니다.** diff와 커밋 히스토리에서 추론합니다.

---

## Step 6: 커밋 (bisectable 청크)

**목표:** `git bisect`와 잘 작동하고 LLM이 변경된 내용을 이해하는 데 도움이 되는 작고 논리적인 커밋을 만듭니다.

1. diff를 분석하고 변경사항을 논리적 커밋으로 그룹화합니다. 각 커밋은 **하나의 일관된 변경**을 나타내야 합니다 — 하나의 파일이 아닌 하나의 논리적 단위.

2. **커밋 순서** (이전 커밋 먼저):
   - **인프라:** 마이그레이션, 설정 변경, 라우트 추가
   - **모델 및 서비스:** 새 모델, 서비스, concerns (테스트 포함)
   - **컨트롤러 및 뷰:** 컨트롤러, 뷰, JS/React 컴포넌트 (테스트 포함)
   - **VERSION + CHANGELOG:** 항상 마지막 커밋에

3. **분할 규칙:**
   - 모델과 그 테스트 파일은 같은 커밋에
   - 서비스와 그 테스트 파일은 같은 커밋에
   - 컨트롤러, 뷰, 그 테스트는 같은 커밋에
   - 마이그레이션은 자체 커밋 (또는 지원하는 모델과 그룹화)
   - 설정/라우트 변경은 활성화하는 기능과 그룹화 가능
   - 총 diff가 작으면 (4개 파일 미만 50줄 이하), 단일 커밋도 괜찮음

4. **각 커밋은 독립적으로 유효해야 합니다** — 깨진 임포트 없음, 아직 존재하지 않는 코드 참조 없음. 의존성이 먼저 오도록 커밋 순서를 정합니다.

5. 각 커밋 메시지 작성:
   - 첫 번째 줄: `<type>: <summary>` (type = feat/fix/chore/refactor/docs)
   - 본문: 이 커밋에 무엇이 포함됐는지 간략한 설명
   - **마지막 커밋** (VERSION + CHANGELOG)만 버전 태그와 co-author 트레일러 포함:

```bash
git commit -m "$(cat <<'EOF'
chore: 버전 및 변경 이력 업데이트 (vX.Y.Z.W)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 7: 푸시

upstream 추적과 함께 원격으로 푸시합니다:

```bash
git push -u origin <branch-name>
```

---

## Step 8: PR 생성

`gh`를 사용하여 pull request를 생성합니다:

```bash
gh pr create --title "<type>: <summary>" --body "$(cat <<'EOF'
## 요약
<CHANGELOG에서 불릿 포인트>

## 랜딩 전 검토
<Step 3.5의 결과, 또는 "이슈가 발견되지 않았습니다.">

## Eval 결과
<eval이 실행된 경우: 스위트 이름, 통과/실패 카운트, 비용 대시보드 요약. 건너뛴 경우: "프롬프트 관련 파일 변경 없음 — eval 건너뜀.">

## 테스트 계획
- [x] 모든 Rails 테스트 통과 (N회 실행, 0 실패)
- [x] 모든 Vitest 테스트 통과 (N개 테스트)

🤖 [Claude Code](https://claude.com/claude-code)로 생성됨
EOF
)"
```

**PR URL을 출력합니다** — 사용자가 보는 최종 출력이어야 합니다.

---

## 중요 규칙

- **테스트를 절대 건너뛰지 않습니다.** 테스트가 실패하면 중지합니다.
- **랜딩 전 검토를 절대 건너뛰지 않습니다.** checklist.md를 읽을 수 없으면 중지합니다.
- **강제 푸시를 절대 하지 않습니다.** 일반 `git push`만 사용합니다.
- **MINOR/MAJOR 버전 업데이트와 CRITICAL 검토 결과를 제외하고 확인을 절대 요청하지 않습니다** (critical 이슈당 하나의 AskUserQuestion, 수정 권고사항 포함).
- **VERSION 파일의 4자리 버전 형식을 항상 사용합니다.**
- **CHANGELOG의 날짜 형식:** `YYYY-MM-DD`
- **bisectability를 위해 커밋을 분할합니다** — 각 커밋 = 하나의 논리적 변경.
- **목표: 사용자가 `/ship`이라고 말하면, 다음에 보이는 것은 검토 + PR URL.**
