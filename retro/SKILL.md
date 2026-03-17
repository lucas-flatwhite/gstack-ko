---
name: retro
version: 2.0.0
description: |
  주간 엔지니어링 회고. commit 기록, 작업 패턴,
  코드 품질 지표를 영속적인 기록 및 트렌드 추적과 함께 분석합니다.
  팀 인식: 칭찬과 성장 영역을 포함한 개인별 기여 내역을 분석합니다.
allowed-tools:
  - Bash
  - Read
  - Write
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

## 기본 branch 감지

데이터 수집 전에 저장소의 기본 branch 이름을 감지합니다:
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

실패하면 `main`으로 대체합니다. 아래 지침에서 `origin/<default>`라고 표시된 곳에 감지된 이름을 사용합니다.

---

# /retro — 주간 엔지니어링 회고

commit 기록, 작업 패턴, 코드 품질 지표를 분석하는 포괄적인 엔지니어링 회고를 생성합니다. 팀 인식: 명령을 실행하는 사용자를 식별하고, 개인별 칭찬과 성장 기회를 포함하여 모든 기여자를 분석합니다. Claude Code를 힘의 배증기로 사용하는 시니어 IC/CTO 수준의 빌더를 위해 설계되었습니다.

## 사용자 호출
사용자가 `/retro`를 입력하면 이 스킬을 실행합니다.

## 인수
- `/retro` — 기본값: 최근 7일
- `/retro 24h` — 최근 24시간
- `/retro 14d` — 최근 14일
- `/retro 30d` — 최근 30일
- `/retro compare` — 현재 기간 vs 이전 동일 기간 비교
- `/retro compare 14d` — 명시적 기간으로 비교

## 지침

인수를 파싱하여 시간 창을 결정합니다. 인수가 없으면 기본값으로 7일 사용. git log 쿼리에는 `--since="N days ago"`, `--since="N hours ago"`, 또는 `--since="N weeks ago"` (`w` 단위의 경우)를 사용합니다. 모든 시간은 **태평양 시간**으로 보고해야 합니다 (타임스탬프 변환 시 `TZ=America/Los_Angeles` 사용).

**인수 유효성 검사:** 인수가 숫자 뒤에 `d`, `h`, `w`가 오는 형식, `compare` 단어, 또는 `compare` 뒤에 숫자와 `d`/`h`/`w`가 오는 형식과 일치하지 않으면 이 사용법을 표시하고 중단합니다:
```
Usage: /retro [window]
  /retro              — last 7 days (default)
  /retro 24h          — last 24 hours
  /retro 14d          — last 14 days
  /retro 30d          — last 30 days
  /retro compare      — compare this period vs prior period
  /retro compare 14d  — compare with explicit window
```

### Step 1: 원시 데이터 수집

먼저 origin을 fetch하고 현재 사용자를 식별합니다:
```bash
git fetch origin <default> --quiet
# 회고를 실행하는 사람 식별
git config user.name
git config user.email
```

`git config user.name`으로 반환된 이름이 이 회고를 읽는 사람인 **"당신"**입니다. 다른 모든 작성자는 팀원입니다. 이를 내러티브 방향으로 사용합니다: "당신의" commit vs 팀원 기여.

다음 모든 git 명령을 병렬로 실행합니다 (독립적입니다):

```bash
# 1. 기간 내 모든 commit (타임스탬프, 제목, 해시, 작성자, 변경된 파일, 삽입, 삭제)
git log origin/<default> --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. 작성자가 포함된 commit당 테스트 vs 전체 LOC 분석
#    각 commit 블록은 COMMIT:<hash>|<author>로 시작하고, numstat 라인이 이어집니다.
#    테스트 파일 (test/|spec/|__tests__/ 패턴 일치)과 프로덕션 파일을 분리합니다.
git log origin/<default> --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. 세션 감지 및 시간별 분포를 위한 commit 타임스탬프 (작성자 포함)
#    태평양 시간 변환에는 TZ=America/Los_Angeles 사용
TZ=America/Los_Angeles git log origin/<default> --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. 가장 자주 변경된 파일 (hotspot 분석)
git log origin/<default> --since="<window>" --format="" --name-only | grep -v '^$' | sort | uniq -c | sort -rn

# 5. commit 메시지의 PR 번호 (#NNN 패턴 추출)
git log origin/<default> --since="<window>" --format="%s" | grep -oE '#[0-9]+' | sed 's/^#//' | sort -n | uniq | sed 's/^/#/'

# 6. 작성자별 파일 hotspot (누가 무엇을 건드리는지)
git log origin/<default> --since="<window>" --format="AUTHOR:%aN" --name-only

# 7. 작성자별 commit 수 (빠른 요약)
git shortlog origin/<default> --since="<window>" -sn --no-merges

# 8. Greptile 분류 기록 (사용 가능한 경우)
cat ~/.gstack/greptile-history.md 2>/dev/null || true

# 9. TODOS.md 백로그 (사용 가능한 경우)
cat TODOS.md 2>/dev/null || true
```

### Step 2: 지표 계산

이 지표들을 요약 테이블로 계산하고 제시합니다:

| 지표 | 값 |
|--------|-------|
| main의 commit | N |
| 기여자 | N |
| merge된 PR | N |
| 총 삽입 | N |
| 총 삭제 | N |
| 순 LOC 추가 | N |
| 테스트 LOC (삽입) | N |
| 테스트 LOC 비율 | N% |
| 버전 범위 | vX.Y.Z.W → vX.Y.Z.W |
| 활성 일수 | N |
| 감지된 세션 | N |
| 평균 LOC/세션-시간 | N |
| Greptile 신호 | N% (Y 포착, Z 오탐) |

그 아래에 **기여자별 리더보드**를 표시합니다:

```
Contributor         Commits   +/-          Top area
You (garry)              32   +2400/-300   browse/
alice                    12   +800/-150    app/services/
bob                       3   +120/-40     tests/
```

commit 수 내림차순으로 정렬합니다. 현재 사용자 (`git config user.name`에서)는 항상 첫 번째로 표시되며 "You (name)"으로 레이블이 붙습니다.

**Greptile 신호 (기록이 있는 경우):** `~/.gstack/greptile-history.md` (Step 1 명령 8에서 fetch됨)를 읽습니다. 날짜로 회고 기간 내의 항목을 필터링합니다. 유형별 항목 수 계산: `fix`, `fp`, `already-fixed`. 신호 비율 계산: `(fix + already-fixed) / (fix + already-fixed + fp)`. 기간 내 항목이 없거나 파일이 없으면 Greptile 지표 행을 건너뜁니다. 파싱할 수 없는 라인은 자동으로 건너뜁니다.

**백로그 건강도 (TODOS.md가 있는 경우):** `TODOS.md` (Step 1 명령 9에서 fetch됨)를 읽습니다. 계산:
- 총 열린 TODO (items in `## Completed` 섹션 제외)
- P0/P1 수 (critical/urgent 항목)
- P2 수 (중요 항목)
- 이 기간 완료된 항목 (회고 기간 내 날짜가 있는 Completed 섹션의 항목)
- 이 기간 추가된 항목 (기간 내 TODOS.md를 수정한 commit에 대한 git log 교차 참조)

지표 테이블에 포함:
```
| 백로그 건강도 | N 열림 (X P0/P1, Y P2) · Z 이번 기간 완료 |
```

TODOS.md가 없으면 백로그 건강도 행을 건너뜁니다.

### Step 3: Commit 시간 분포

태평양 시간의 시간별 히스토그램을 막대 차트로 표시합니다:

```
Hour  Commits  ████████████████
 00:    4      ████
 07:    5      █████
 ...
```

다음을 식별하고 언급합니다:
- 피크 시간
- 데드존
- 패턴이 이중 모드 (아침/저녁)인지 연속적인지
- 야간 코딩 클러스터 (오후 10시 이후)

### Step 4: 작업 세션 감지

연속 commit 사이의 **45분 간격** 임계값을 사용하여 세션을 감지합니다. 각 세션에 대해 보고합니다:
- 시작/종료 시간 (태평양 시간)
- commit 수
- 소요 시간 (분)

세션 분류:
- **딥 세션** (50분 이상)
- **미디엄 세션** (20-50분)
- **마이크로 세션** (<20분, 일반적으로 단일 commit 즉석 처리)

계산:
- 총 활성 코딩 시간 (세션 소요 시간 합계)
- 평균 세션 길이
- 활성 시간당 LOC

### Step 5: Commit 유형 분석

conventional commit 접두사 (feat/fix/refactor/test/chore/docs)로 분류. 퍼센트 막대로 표시:

```
feat:     20  (40%)  ████████████████████
fix:      27  (54%)  ███████████████████████████
refactor:  2  ( 4%)  ██
```

fix 비율이 50%를 초과하면 플래그 — 이것은 리뷰 격차를 나타낼 수 있는 "빠른 배포, 빠른 수정" 패턴을 나타냅니다.

### Step 6: Hotspot 분석

가장 많이 변경된 파일 상위 10개 표시. 플래그:
- 5회 이상 변경된 파일 (churn hotspot)
- hotspot 목록의 테스트 파일 vs 프로덕션 파일
- VERSION/CHANGELOG 빈도 (버전 규율 지표)

### Step 7: PR 크기 분포

commit diff에서 PR 크기를 추정하고 버킷으로 분류:
- **Small** (<100 LOC)
- **Medium** (100-500 LOC)
- **Large** (500-1500 LOC)
- **XL** (1500+ LOC) — 파일 수와 함께 플래그

### Step 8: 포커스 점수 + 이번 주 최고 배포

**포커스 점수:** 단일 최다 변경 최상위 디렉토리 (예: `app/services/`, `app/views/`)를 건드리는 commit의 비율을 계산합니다. 높은 점수 = 더 깊은 집중 작업. 낮은 점수 = 분산된 컨텍스트 전환. 보고 형식: "포커스 점수: 62% (app/services/)"

**이번 주 최고 배포:** 기간 내 가장 LOC가 많은 단일 PR을 자동 식별합니다. 강조:
- PR 번호와 제목
- 변경된 LOC
- 왜 중요한지 (commit 메시지와 변경된 파일에서 추론)

### Step 9: 팀원 분석

각 기여자 (현재 사용자 포함)에 대해 계산:

1. **Commit과 LOC** — 총 commit, 삽입, 삭제, 순 LOC
2. **집중 영역** — 가장 많이 건드린 디렉토리/파일 (상위 3개)
3. **Commit 유형 믹스** — 개인 feat/fix/refactor/test 분류
4. **세션 패턴** — 코딩 시간 (피크 시간), 세션 수
5. **테스트 규율** — 개인 테스트 LOC 비율
6. **최대 배포** — 기간 내 최고 영향력 commit 또는 PR

**현재 사용자 ("당신")의 경우:** 이 섹션은 가장 깊은 처리를 받습니다. 솔로 회고의 모든 세부 사항 포함 — 세션 분석, 시간 패턴, 포커스 점수. 1인칭으로 구성: "당신의 피크 시간...", "당신의 최대 배포..."

**각 팀원의 경우:** 작업한 내용과 패턴에 대해 2-3 문장을 작성합니다. 그런 다음:

- **칭찬** (1-2 구체적인 것): 실제 commit에 근거합니다. "잘 했어요"가 아닌 — 정확히 무엇이 좋았는지 말합니다. 예시: "45% 테스트 커버리지로 3번의 집중 세션에서 전체 auth 미들웨어 재작성 배포", "모든 PR이 200 LOC 미만 — 규율 있는 분해."
- **성장 기회** (1 구체적인 것): 비판이 아닌 레벨업 제안으로 구성합니다. 실제 데이터에 근거합니다. 예시: "이번 주 테스트 비율이 12% — 더 복잡해지기 전에 payment 모듈에 테스트 커버리지를 추가하면 보상이 있을 것", "같은 파일에 5개의 fix commit은 원래 PR에 리뷰 과정이 필요했을 수 있음을 시사합니다."

**기여자가 한 명뿐인 경우 (솔로 저장소):** 팀 분석을 건너뛰고 이전처럼 진행 — 회고는 개인적입니다.

**Co-Authored-By 트레일러가 있는 경우:** commit 메시지의 `Co-Authored-By:` 라인을 파싱합니다. 해당 작성자에게 기본 작성자와 함께 commit을 귀속합니다. AI 공동 작성자 (예: `noreply@anthropic.com`)는 기록하되 팀원으로 포함하지 않습니다 — 대신 "AI 지원 commit"을 별도 지표로 추적합니다.

### Step 10: 주간 트렌드 (기간이 14일 이상인 경우)

시간 창이 14일 이상이면 주별로 분할하고 트렌드를 표시합니다:
- 주당 commit 수 (총계 및 작성자별)
- 주당 LOC
- 주당 테스트 비율
- 주당 fix 비율
- 주당 세션 수

### Step 11: 연속 기록 추적

오늘부터 거슬러 올라가며 origin/<default>에 1개 이상의 commit이 있는 연속 일수를 세어 팀 기록과 개인 기록 모두 추적합니다:

```bash
# 팀 기록: 모든 고유 commit 날짜 (태평양 시간) — 하드 컷오프 없음
TZ=America/Los_Angeles git log origin/<default> --format="%ad" --date=format:"%Y-%m-%d" | sort -u

# 개인 기록: 현재 사용자의 commit만
TZ=America/Los_Angeles git log origin/<default> --author="<user_name>" --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```

오늘부터 거꾸로 세어봅니다 — 최소 1개의 commit이 있는 연속 일수는 얼마나 되는가? 이것은 전체 기록을 쿼리하므로 어떤 길이의 연속 기록도 정확히 보고됩니다. 둘 다 표시:
- "팀 배포 연속 기록: 47일 연속"
- "당신의 배포 연속 기록: 32일 연속"

### Step 12: 기록 로드 및 비교

새 스냅샷을 저장하기 전에 이전 회고 기록을 확인합니다:

```bash
ls -t .context/retros/*.json 2>/dev/null
```

**이전 회고가 있는 경우:** Read 도구를 사용하여 가장 최근 것을 로드합니다. 주요 지표의 변화를 계산하고 **마지막 회고 대비 트렌드** 섹션을 포함합니다:
```
                    Last        Now         Delta
Test ratio:         22%    →    41%         ↑19pp
Sessions:           10     →    14          ↑4
LOC/hour:           200    →    350         ↑75%
Fix ratio:          54%    →    30%         ↓24pp (improving)
Commits:            32     →    47          ↑47%
Deep sessions:      3      →    5           ↑2
```

**이전 회고가 없는 경우:** 비교 섹션을 건너뛰고 다음을 추가합니다: "첫 번째 회고 기록 — 트렌드를 확인하려면 다음 주에 다시 실행하세요."

### Step 13: 회고 기록 저장

모든 지표 계산 (연속 기록 포함) 및 비교를 위한 이전 기록 로드 후, JSON 스냅샷을 저장합니다:

```bash
mkdir -p .context/retros
```

오늘의 다음 시퀀스 번호를 결정합니다 (실제 날짜로 `$(date +%Y-%m-%d)` 대체):
```bash
# 오늘 기존 회고 수를 세어 다음 시퀀스 번호 획득
today=$(TZ=America/Los_Angeles date +%Y-%m-%d)
existing=$(ls .context/retros/${today}-*.json 2>/dev/null | wc -l | tr -d ' ')
next=$((existing + 1))
# .context/retros/${today}-${next}.json으로 저장
```

이 스키마로 JSON 파일을 저장하기 위해 Write 도구를 사용합니다:
```json
{
  "date": "2026-03-08",
  "window": "7d",
  "metrics": {
    "commits": 47,
    "contributors": 3,
    "prs_merged": 12,
    "insertions": 3200,
    "deletions": 800,
    "net_loc": 2400,
    "test_loc": 1300,
    "test_ratio": 0.41,
    "active_days": 6,
    "sessions": 14,
    "deep_sessions": 5,
    "avg_session_minutes": 42,
    "loc_per_session_hour": 350,
    "feat_pct": 0.40,
    "fix_pct": 0.30,
    "peak_hour": 22,
    "ai_assisted_commits": 32
  },
  "authors": {
    "Garry Tan": { "commits": 32, "insertions": 2400, "deletions": 300, "test_ratio": 0.41, "top_area": "browse/" },
    "Alice": { "commits": 12, "insertions": 800, "deletions": 150, "test_ratio": 0.35, "top_area": "app/services/" }
  },
  "version_range": ["1.16.0.0", "1.16.1.0"],
  "streak_days": 47,
  "tweetable": "Week of Mar 1: 47 commits (3 contributors), 3.2k LOC, 38% tests, 12 PRs, peak: 10pm",
  "greptile": {
    "fixes": 3,
    "fps": 1,
    "already_fixed": 2,
    "signal_pct": 83
  }
}
```

**참고:** `~/.gstack/greptile-history.md`가 존재하고 시간 창 내의 항목이 있는 경우에만 `greptile` 필드를 포함합니다. `TODOS.md`가 존재하는 경우에만 `backlog` 필드를 포함합니다. 둘 중 하나에 데이터가 없으면 해당 필드를 완전히 생략합니다.

TODOS.md가 있을 때 JSON에 백로그 데이터 포함:
```json
  "backlog": {
    "total_open": 28,
    "p0_p1": 2,
    "p2": 8,
    "completed_this_period": 3,
    "added_this_period": 1
  }
```

### Step 14: 내러티브 작성

출력을 다음과 같이 구성합니다:

---

**트윗 가능한 요약** (다른 모든 것 이전, 첫 번째 줄):
```
Week of Mar 1: 47 commits (3 contributors), 3.2k LOC, 38% tests, 12 PRs, peak: 10pm | Streak: 47d
```

## 엔지니어링 회고: [날짜 범위]

### 요약 테이블
(Step 2에서)

### 마지막 회고 대비 트렌드
(Step 11에서, 저장 전에 로드 — 첫 번째 회고이면 건너뜀)

### 시간 & 세션 패턴
(Step 3-4에서)

팀 전체 패턴이 의미하는 바를 해석하는 내러티브:
- 가장 생산적인 시간이 언제이고 무엇이 그것을 이끄는지
- 세션이 시간이 지남에 따라 길어지는지 짧아지는지
- 활성 코딩의 하루 예상 시간 (팀 집계)
- 주목할 패턴: 팀원들이 같은 시간에 코딩하는가 아니면 교대로 하는가?

### 배포 속도
(Step 5-7에서)

다음을 다루는 내러티브:
- Commit 유형 믹스와 그것이 드러내는 것
- PR 크기 규율 (PR이 작게 유지되고 있는가?)
- Fix-chain 감지 (같은 서브시스템에 대한 fix commit 시퀀스)
- 버전 bump 규율

### 코드 품질 신호
- 테스트 LOC 비율 트렌드
- Hotspot 분석 (같은 파일이 계속 변경되고 있는가?)
- 분할했어야 할 XL PR
- Greptile 신호 비율과 트렌드 (기록이 있는 경우): "Greptile: X% 신호 (Y 유효 포착, Z 오탐)"

### 집중 & 하이라이트
(Step 8에서)
- 해석이 포함된 포커스 점수
- 이번 주 최고 배포 강조

### 당신의 주간 (개인 심층 분석)
(Step 9에서, 현재 사용자만)

이것은 사용자가 가장 관심 있는 섹션입니다. 다음을 포함합니다:
- 개인 commit 수, LOC, 테스트 비율
- 세션 패턴과 피크 시간
- 집중 영역
- 최대 배포
- **잘 한 것** (commit에 근거한 2-3 구체적인 것)
- **레벨업 방향** (1-2 구체적이고 실행 가능한 제안)

### 팀 분석
(Step 9에서, 각 팀원 — 솔로 저장소이면 건너뜀)

각 팀원에 대해 (commit 수 내림차순으로 정렬), 섹션을 작성합니다:

#### [이름]
- **배포한 것**: 기여 내용, 집중 영역, commit 패턴에 대한 2-3 문장
- **칭찬**: 1-2 구체적으로 잘 한 것, 실제 commit에 근거. 진심어린 것 — 1:1에서 실제로 말할 것을 말합니다. 예시:
  - "3개의 작고 검토 가능한 PR로 전체 auth 모듈 정리 — 교과서적인 분해"
  - "새로운 endpoint마다 통합 테스트 추가, 행복한 경로만이 아닌"
  - "대시보드의 2초 로딩 시간을 유발하던 N+1 쿼리 수정"
- **성장 기회**: 1 구체적이고 건설적인 제안. 비판이 아닌 투자로 구성합니다. 예시:
  - "payment 모듈의 테스트 커버리지가 8% — 그 위에 다음 기능이 올라오기 전에 투자할 가치 있음"
  - "5개의 PR 중 3개가 800+ LOC — 이것들을 분할하면 더 일찍 이슈를 포착하고 리뷰가 더 쉬워질 것"
  - "모든 commit이 오전 1-4시 사이에 됨 — 지속 가능한 페이스가 장기적으로 코드 품질에 중요함"

**AI 협업 참고:** 많은 commit에 `Co-Authored-By` AI 트레일러가 있는 경우 (예: Claude, Copilot), AI 지원 commit 비율을 팀 지표로 언급합니다. 판단 없이 중립적으로 구성 — "N%의 commit이 AI 지원이었음" — 판단 없이.

### 팀 상위 3가지 성과
기간 내 팀 전체에서 배포된 가장 영향력 있는 3가지를 식별합니다. 각각:
- 무엇이었는지
- 누가 배포했는지
- 왜 중요한지 (제품/아키텍처 영향)

### 개선할 3가지
구체적이고 실행 가능하며 실제 commit에 근거합니다. 개인 및 팀 수준 제안을 혼합합니다. "더 잘하기 위해 팀이 할 수 있는 것은..."으로 표현합니다.

### 다음 주 3가지 습관
작고 실용적이며 현실적입니다. 각각 채택하는 데 5분 미만이 걸려야 합니다. 최소 하나는 팀 지향적이어야 합니다 (예: "당일 서로의 PR 리뷰").

### 주간 트렌드
(해당하는 경우, Step 10에서)

---

## Compare Mode

사용자가 `/retro compare` (또는 `/retro compare 14d`)를 실행할 때:

1. `--since="7 days ago"`를 사용하여 현재 창의 지표 계산
2. `--since`와 `--until`을 모두 사용하여 직전 동일 길이 창의 지표 계산 (예: 7일 창의 경우 `--since="14 days ago" --until="7 days ago"`)
3. 변화와 화살표가 포함된 나란히 비교 테이블 표시
4. 가장 큰 개선과 저하를 강조하는 간단한 내러티브 작성
5. 현재 창 스냅샷만 `.context/retros/`에 저장 (일반 회고 실행과 동일); 이전 창 지표는 유지하지 **않습니다**.

## 톤

- 격려하지만 솔직하게, 과한 칭찬 없이
- 구체적이고 명확하게 — 항상 실제 commit/코드에 근거
- 일반적인 칭찬 건너뜀 ("잘 했어요!") — 정확히 무엇이 좋았고 왜인지 말합니다
- 개선을 레벨업으로 구성, 비판이 아닌
- **칭찬은 1:1에서 실제로 말할 것처럼 느껴져야 합니다** — 구체적이고, 근거가 있고, 진심어린
- **성장 제안은 투자 조언처럼 느껴져야 합니다** — "이것이 당신의 시간을 투자할 가치가 있는 이유..." 이지 "당신이 실패했다..."가 아닌
- 팀원을 서로 부정적으로 비교하지 않습니다. 각 사람의 섹션은 독립적으로 서 있습니다.
- 총 출력을 약 3000-4500 단어로 유지 (팀 섹션 수용을 위해 약간 더 길게)
- 데이터에는 마크다운 테이블과 코드 블록을, 내러티브에는 산문을 사용
- 대화에 직접 출력 — 파일 시스템에 쓰지 않음 (`.context/retros/` JSON 스냅샷 제외)

## 중요 규칙

- 모든 내러티브 출력은 대화에서 직접 사용자에게 전달됩니다. 유일하게 작성되는 파일은 `.context/retros/` JSON 스냅샷입니다.
- 모든 git 쿼리에는 `origin/<default>` 사용 (오래될 수 있는 로컬 main 사용 금지)
- 표시용 모든 타임스탬프를 태평양 시간으로 변환 (`TZ=America/Los_Angeles` 사용)
- 기간에 commit이 없으면 그렇게 말하고 다른 기간을 제안합니다
- LOC/시간을 가장 가까운 50으로 반올림
- merge commit을 PR 경계로 처리
- CLAUDE.md나 다른 문서를 읽지 않음 — 이 스킬은 자급자족합니다
- 첫 번째 실행 시 (이전 회고 없음), 비교 섹션을 우아하게 건너뜁니다
