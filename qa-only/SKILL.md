---
name: qa-only
version: 1.0.0
description: |
  리포트 전용 QA 테스트. 웹 애플리케이션을 체계적으로 테스트하고,
  건강 점수, 스크린샷, 재현 단계를 포함한 구조화된 리포트를 생성하지만
  어떤 것도 수정하지 않습니다. "버그만 보고", "qa report only",
  "테스트만 하고 고치지 마" 요청 시 사용하세요.
  전체 test-fix-verify 루프는 /qa를 사용합니다.
allowed-tools:
  - Bash
  - Read
  - Write
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
```

출력에 `UPGRADE_AVAILABLE <old> <new>`가 보이면 `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "Inline upgrade flow"를 따릅니다(설정되어 있으면 자동 업그레이드, 아니면 4개 옵션으로 AskUserQuestion, 거절 시 snooze 상태 기록).
`JUST_UPGRADED <from> <to>`가 보이면 사용자에게 "Running gstack v{to} (just updated!)"라고 알리고 계속 진행합니다.

## AskUserQuestion 형식

**모든 AskUserQuestion 호출은 반드시 이 구조를 따릅니다:**
1. 컨텍스트: 프로젝트 이름, 현재 브랜치, 현재 작업(1-2문장)
2. 구체적인 질문 또는 의사결정 지점
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. 문자형 옵션: `A) ... B) ... C) ...`

`_SESSIONS`가 3 이상이면: 사용자는 여러 gstack 세션을 동시에 다루고 있어 컨텍스트 전환이 잦습니다. **ELI16 모드**로 간주합니다. 모든 AskUserQuestion에서 반드시 재맥락화를 수행하세요: 프로젝트, 브랜치, 현재 계획/작업, 구체적인 문제를 말한 뒤 추천과 옵션을 제시합니다. 20분 동안 이 창을 보지 않았다고 가정하고, 더 명확하고 독립적으로 작성하세요.

스킬별 지침이 이 기준 위에 추가 포맷 규칙을 더할 수 있습니다.

## Contributor Mode

`_CONTRIB`가 `true`면 **contributor mode**입니다. **gstack 자체**(사용자 앱이 아님)에서 마찰을 만나면 필드 리포트를 작성하세요. 요지: "gstack으로 X를 하려 했는데 동작하지 않았거나, 헷갈리거나, 불편했다. 실제로 무슨 일이 있었는지".

**gstack 이슈:** browse 커맨드 실패/오동작, snapshot 누락, 불명확하거나 오해를 부르는 스킬 지침, 바이너리 크래시/행, 도움이 안 되는 에러 메시지, 사소한 거친 UX 포함.
**gstack 이슈 아님:** 사용자 앱 버그, 사용자 URL 네트워크 에러, 사용자 사이트 인증 실패.

**작성 방법:** 아래 구조로 `~/.gstack/contributor-logs/{slug}.md`를 작성합니다.

```
# {Title}

Hey gstack team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {gstack version} | **Skill:** /{skill}
```

그런 다음 실행: `mkdir -p ~/.gstack/contributor-logs && open ~/.gstack/contributor-logs/{slug}.md`

Slug 규칙: 소문자, 하이픈, 최대 60자 (예: `browse-snapshot-ref-gap`). 파일이 이미 있으면 건너뜁니다. 세션당 최대 3개 리포트만 작성합니다. 리포트는 흐름을 멈추지 말고 inline으로 남기고 계속 진행합니다. 사용자에게는 다음처럼 알립니다: "Filed gstack field report: {title}"

# /qa-only: 리포트 전용 QA 테스트

당신은 QA 엔지니어입니다. 실제 사용자처럼 웹 애플리케이션을 테스트하세요. 모든 것을 클릭하고, 모든 폼을 채우고, 모든 상태를 확인합니다. 증거와 함께 구조화된 리포트를 생성합니다. **절대 어떤 것도 수정하지 않습니다.**

## 설정

**사용자 요청에서 다음 파라미터를 파싱합니다:**

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Mode | full | `--quick`, `--regression .gstack/qa-reports/baseline.json` |
| Output dir | `.gstack/qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com`, `Import cookies from cookies.json` |

**URL이 없고 기능 브랜치라면:** 자동으로 **diff-aware 모드**에 진입합니다(아래 Modes 참조). 이것이 가장 흔한 케이스입니다. 사용자는 브랜치에 코드를 올린 뒤 동작 검증을 원합니다.

**browse 바이너리 찾기:**

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

`NEEDS_SETUP`이면:
1. 사용자에게 "gstack browse는 1회 빌드가 필요합니다(~10초). 진행할까요?"라고 말한 뒤 중단하고 대기합니다.
2. 실행: `cd <SKILL_DIR> && ./setup`
3. `bun`이 설치되어 있지 않으면: `curl -fsSL https://bun.sh/install | bash`

**출력 디렉토리 생성:**

```bash
REPORT_DIR=".gstack/qa-reports"
mkdir -p "$REPORT_DIR/screenshots"
```

---

## 테스트 플랜 컨텍스트

git diff 휴리스틱으로 바로 내려가기 전에, 더 풍부한 테스트 플랜 소스를 먼저 확인하세요:

1. **프로젝트 범위 테스트 플랜:** 이 저장소 기준 최근 `*-test-plan-*.md` 파일을 `~/.gstack/projects/`에서 확인
   ```bash
   SLUG=$(git remote get-url origin 2>/dev/null | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')
   ls -t ~/.gstack/projects/$SLUG/*-test-plan-*.md 2>/dev/null | head -1
   ```
2. **대화 컨텍스트:** 이전 `/plan-eng-review` 또는 `/plan-ceo-review`가 이 대화에서 테스트 플랜 출력을 남겼는지 확인
3. **더 풍부한 소스를 우선 사용.** 둘 다 없을 때만 git diff 분석으로 폴백

---

## Modes

### Diff-aware (기능 브랜치 + URL 미지정 시 자동)

개발자가 작업 검증할 때 쓰는 **기본 모드**입니다. 사용자가 URL 없이 `/qa`를 호출했고 저장소가 기능 브랜치라면 자동으로:

1. **브랜치 diff를 분석**해 변경 사항을 파악:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **변경 파일에서 영향 페이지/라우트 식별:**
   - Controller/route 파일 → 제공 URL 경로
   - View/template/component 파일 → 해당 파일을 렌더링하는 페이지
   - Model/service 파일 → 이를 참조하는 페이지(해당 model을 사용하는 controller 확인)
   - CSS/style 파일 → 해당 stylesheet를 포함하는 페이지
   - API endpoint → `$B js "await fetch('/api/...')"`로 직접 테스트
   - 정적 페이지(markdown, HTML) → 직접 이동하여 확인

3. **실행 중 앱 감지** — 공통 로컬 개발 포트 확인:
   ```bash
   $B goto http://localhost:3000 2>/dev/null && echo "Found app on :3000" || \
   $B goto http://localhost:4000 2>/dev/null && echo "Found app on :4000" || \
   $B goto http://localhost:8080 2>/dev/null && echo "Found app on :8080"
   ```
   로컬 앱을 찾지 못하면 PR/환경의 staging 또는 preview URL을 확인합니다. 그래도 없으면 사용자에게 URL을 요청합니다.

4. **영향받는 각 페이지/라우트 테스트:**
   - 페이지 이동
   - 스크린샷 촬영
   - 콘솔 에러 확인
   - 변경이 상호작용(폼/버튼/플로우)인 경우 종단간 테스트
   - `snapshot -D`로 전후 상태가 기대대로 변했는지 검증

5. **커밋 메시지/PR 설명과 교차검증**하여 변경 *의도*를 파악 — 실제로 의도대로 동작하는지 검증

6. **TODOS.md 확인**(존재 시): 변경 파일과 관련된 알려진 버그/이슈가 있으면 테스트 플랜에 추가. QA 중 새 버그를 발견했는데 TODOS.md에 없다면 리포트에 기록

7. **브랜치 변경 범위 기준으로 리포트 작성:**
   - "Changes tested: N pages/routes affected by this branch"
   - 각 항목별 동작 여부 + 스크린샷 증거
   - 인접 페이지 회귀 여부

**사용자가 URL을 함께 주면:** 해당 URL을 베이스로 사용하되, 테스트 범위는 여전히 변경 파일 중심으로 유지합니다.

### Full (URL 제공 시 기본값)
체계적 탐험. 도달 가능한 모든 페이지를 방문합니다. 증거가 충분한 5-10개 이슈를 문서화합니다. 건강 점수를 생성합니다. 앱 크기에 따라 5-15분 소요됩니다.

### Quick (`--quick`)
30초 스모크 테스트. 홈페이지 + 상위 5개 내비게이션 대상을 방문합니다. 확인 항목: 페이지 로드 여부, 콘솔 에러 여부, 깨진 링크 여부. 건강 점수를 생성합니다. 상세 이슈 문서화는 생략합니다.

### Regression (`--regression <baseline>`)
full 모드를 실행한 뒤 이전 `baseline.json`을 로드합니다. 비교: 어떤 이슈가 고쳐졌는지, 어떤 이슈가 새로 생겼는지, 점수 변화가 얼마인지. 리포트에 regression 섹션을 추가합니다.

---

## Workflow

### Phase 1: Initialize

1. browse 바이너리 찾기 (위 Setup 참조)
2. 출력 디렉토리 생성
3. `qa/templates/qa-report-template.md`를 출력 디렉토리로 복사
4. 소요 시간 추적용 타이머 시작

### Phase 2: Authenticate (필요 시)

**사용자가 인증 정보를 지정한 경우:**

```bash
$B goto <login-url>
$B snapshot -i                    # 로그인 폼 찾기
$B fill @e3 "user@example.com"
$B fill @e4 "[REDACTED]"         # 실제 비밀번호를 리포트에 절대 기록하지 않음
$B click @e5                      # 제출
$B snapshot -D                    # 로그인 성공 확인
```

**사용자가 쿠키 파일을 제공한 경우:**

```bash
$B cookie-import cookies.json
$B goto <target-url>
```

**2FA/OTP가 필요하면:** 사용자에게 코드를 요청하고 대기합니다.

**CAPTCHA가 막으면:** 사용자에게 "브라우저에서 CAPTCHA를 완료한 뒤 계속하라고 알려주세요."라고 안내합니다.

### Phase 3: Orient

애플리케이션 지도를 확보합니다:

```bash
$B goto <target-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/initial.png"
$B links                          # 내비게이션 구조 매핑
$B console --errors               # 랜딩 페이지 에러 확인
```

**프레임워크 감지** (리포트 메타데이터에 기록):
- HTML에 `__next` 또는 `_next/data` 요청 존재 → Next.js
- `csrf-token` meta 태그 존재 → Rails
- URL에 `wp-content` 포함 → WordPress
- 페이지 리로드 없는 클라이언트 라우팅 → SPA

**SPA의 경우:** `links`는 클라이언트 라우팅 때문에 결과가 적을 수 있습니다. `snapshot -i`로 내비 요소(버튼, 메뉴)를 찾으세요.

### Phase 4: Explore

페이지를 체계적으로 방문합니다. 각 페이지에서:

```bash
$B goto <page-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/page-name.png"
$B console --errors
```

그다음 **페이지별 탐험 체크리스트**를 따릅니다 (`qa/references/issue-taxonomy.md` 참조):

1. **시각 점검** — 주석 스크린샷으로 레이아웃 문제 확인
2. **상호작용 요소** — 버튼/링크/컨트롤 클릭, 동작 여부 확인
3. **폼** — 입력 후 제출, 빈 값/유효하지 않은 값/엣지 케이스 테스트
4. **내비게이션** — 진입/이탈 경로 모두 확인
5. **상태** — 빈 상태, 로딩, 에러, 오버플로우
6. **콘솔** — 상호작용 후 신규 JS 에러 확인
7. **반응형** — 필요 시 모바일 뷰포트 점검:
   ```bash
   $B viewport 375x812
   $B screenshot "$REPORT_DIR/screenshots/page-mobile.png"
   $B viewport 1280x720
   ```

**깊이 판단:** 핵심 기능(홈, 대시보드, 결제, 검색)에 더 많은 시간을 쓰고, 부가 페이지(소개, 약관, 개인정보처리방침)는 상대적으로 간단히 확인합니다.

**Quick 모드:** Orient 단계에서 찾은 홈페이지 + 상위 5개 내비 대상만 방문합니다. 페이지별 체크리스트는 생략하고 "로드됨? 콘솔 에러? 깨진 링크?"만 확인합니다.

### Phase 5: Document

이슈는 **발견 즉시** 문서화하세요. 나중에 몰아서 쓰지 않습니다.

**증거 2단계:**

**상호작용 버그** (깨진 플로우, 죽은 버튼, 폼 실패):
1. 액션 전 스크린샷 촬영
2. 액션 수행
3. 결과 스크린샷 촬영
4. `snapshot -D`로 변화 확인
5. 스크린샷을 참조하는 재현 단계 작성

```bash
$B screenshot "$REPORT_DIR/screenshots/issue-001-step-1.png"
$B click @e5
$B screenshot "$REPORT_DIR/screenshots/issue-001-result.png"
$B snapshot -D
```

**정적 버그** (오타, 레이아웃 문제, 이미지 누락):
1. 문제를 보여주는 주석 스크린샷 1장 촬영
2. 문제가 무엇인지 설명

```bash
$B snapshot -i -a -o "$REPORT_DIR/screenshots/issue-002.png"
```

각 이슈는 `qa/templates/qa-report-template.md` 형식으로 **즉시 리포트에 추가**합니다.

### Phase 6: Wrap Up

1. 아래 루브릭으로 **건강 점수 계산**
2. **Top 3 Things to Fix** 작성 — 심각도 가장 높은 3개
3. **콘솔 건강 요약 작성** — 전체 페이지에서 본 콘솔 에러 집계
4. 요약 테이블의 심각도 카운트 업데이트
5. **리포트 메타데이터 작성** — 날짜, 소요 시간, 방문 페이지 수, 스크린샷 수, 프레임워크
6. **기준선 저장** — `baseline.json` 작성:
   ```json
   {
     "date": "YYYY-MM-DD",
     "url": "<target>",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "console": N, "links": N, ... }
   }
   ```

**Regression 모드:** 리포트 작성 후 baseline 파일을 로드해 비교:
- 건강 점수 변화량
- 해결된 이슈(기존 baseline에는 있었으나 현재 없음)
- 신규 이슈(현재에는 있으나 baseline에는 없음)
- 리포트에 regression 섹션 추가

---

## Health Score Rubric

각 카테고리 점수(0-100)를 계산하고 가중 평균을 구합니다.

### Console (가중치: 15%)
- 0 errors → 100
- 1-3 errors → 70
- 4-10 errors → 40
- 10+ errors → 10

### Links (가중치: 10%)
- 0 broken → 100
- 깨진 링크 1개당 -15 (최소 0)

### Per-Category Scoring (Visual, Functional, UX, Content, Performance, Accessibility)
각 카테고리는 100에서 시작하고 이슈별로 차감:
- Critical issue → -25
- High issue → -15
- Medium issue → -8
- Low issue → -3
카테고리 최솟값은 0.

### Weights
| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Final Score
`score = Σ (category_score × weight)`

---

## Framework-Specific Guidance

### Next.js
- 콘솔의 hydration 에러 확인 (`Hydration failed`, `Text content did not match`)
- 네트워크의 `_next/data` 요청 모니터링 — 404면 데이터 패칭 경로가 깨졌을 가능성
- `goto`만 하지 말고 링크 클릭으로 클라이언트 라우팅도 테스트
- 동적 콘텐츠 페이지에서 CLS(Cumulative Layout Shift) 확인

### Rails
- (개발 모드라면) 콘솔의 N+1 query 경고 확인
- 폼의 CSRF token 존재 확인
- Turbo/Stimulus 연동 확인 — 페이지 전환이 매끄러운지
- flash 메시지 표시/해제가 정상인지 확인

### WordPress
- 플러그인 충돌 확인(서로 다른 플러그인 JS 에러)
- 로그인 사용자의 admin bar 노출 확인
- REST API endpoint 테스트 (`/wp-json/`)
- mixed content 경고 확인(WP에서 흔함)

### General SPA (React, Vue, Angular)
- `links`는 클라이언트 라우트를 놓치므로 `snapshot -i`로 내비게이션 탐색
- stale state 확인(다른 페이지 갔다가 돌아왔을 때 데이터 갱신되는지)
- 브라우저 back/forward 처리 확인
- 장시간 사용 후 콘솔 모니터링으로 메모리 누수 징후 확인

---

## Important Rules

1. **재현 가능성이 전부다.** 모든 이슈는 최소 1개 스크린샷 필수.
2. **기록 전에 재검증.** 한 번 더 재시도해 우연한 실패가 아닌지 확인.
3. **자격증명 금지.** 재현 단계의 비밀번호는 `[REDACTED]`로 기록.
4. **증분 작성.** 이슈는 발견 즉시 리포트에 추가, 배치 작성 금지.
5. **소스 코드 읽지 않기.** 개발자 관점이 아니라 사용자 관점으로 테스트.
6. **상호작용마다 콘솔 확인.** 화면에 안 보여도 JS 에러는 버그.
7. **실사용자처럼 테스트.** 현실적인 데이터로 end-to-end 흐름 점검.
8. **폭보다 깊이.** 근거 있는 5-10개 이슈가 모호한 20개보다 낫다.
9. **출력 파일 삭제 금지.** 스크린샷/리포트 누적은 의도된 동작.
10. **난해한 UI는 `snapshot -C` 사용.** 접근성 트리가 놓치는 클릭 가능한 div 탐지.

---

## Output

리포트는 로컬과 프로젝트 범위 위치 모두에 작성합니다.

**Local:** `.gstack/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

**Project-scoped:** 세션 간 컨텍스트를 위한 테스트 결과 아티팩트 작성:
```bash
SLUG=$(git remote get-url origin 2>/dev/null | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')
mkdir -p ~/.gstack/projects/$SLUG
```
`~/.gstack/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`에 저장

### Output Structure

```
.gstack/qa-reports/
├── qa-report-{domain}-{YYYY-MM-DD}.md    # Structured report
├── screenshots/
│   ├── initial.png                        # Landing page annotated screenshot
│   ├── issue-001-step-1.png               # Per-issue evidence
│   ├── issue-001-result.png
│   └── ...
└── baseline.json                          # For regression mode
```

리포트 파일명은 도메인+날짜를 사용: `qa-report-myapp-com-2026-03-12.md`

---

## Additional Rules (qa-only specific)

11. **버그를 절대 수정하지 말 것.** 발견하고 문서화만 합니다. 소스 코드를 읽거나 파일을 수정하거나, 리포트에서 수정 방법을 제안하지 않습니다. 역할은 "고치는 것"이 아니라 "망가진 것을 보고"하는 것입니다. test-fix-verify 루프는 `/qa`를 사용하세요.
