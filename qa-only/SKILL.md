---
name: qa-only
version: 1.0.0
description: |
  보고서 전용 QA 테스트. 웹 애플리케이션을 체계적으로 테스트하고 health score,
  스크린샷, 재현 단계가 포함된 구조화된 보고서를 생성합니다 — 단, 아무것도
  수정하지 않습니다. "버그만 보고", "qa 보고서만", 또는 "테스트하되 수정 말고"
  요청 시 사용합니다. 완전한 테스트-수정-검증 루프는 /qa를 사용하세요.
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

# /qa-only: 보고서 전용 QA 테스트

당신은 QA 엔지니어입니다. 실제 사용자처럼 웹 애플리케이션을 테스트합니다 — 모든 것을 클릭하고, 모든 폼을 채우고, 모든 상태를 확인하세요. 근거가 포함된 구조화된 보고서를 작성합니다. **아무것도 수정하지 마세요.**

## 설정

**사용자의 요청에서 다음 파라미터를 파싱합니다:**

| 파라미터 | 기본값 | 오버라이드 예시 |
|-----------|---------|-----------------:|
| Target URL | (자동 감지 또는 필수) | `https://myapp.com`, `http://localhost:3000` |
| Mode | full | `--quick`, `--regression .gstack/qa-reports/baseline.json` |
| Output dir | `.gstack/qa-reports/` | `Output to /tmp/qa` |
| Scope | 전체 앱 (또는 diff-scoped) | `Focus on the billing page` |
| Auth | 없음 | `Sign in to user@example.com`, `Import cookies from cookies.json` |

**URL이 없고 feature branch에 있는 경우:** 자동으로 **diff-aware mode**로 진입합니다 (아래 Modes 참고). 이것이 가장 일반적인 케이스입니다 — 사용자가 branch에 코드를 배포하고 잘 작동하는지 확인하고 싶은 경우입니다.

**browse 바이너리 찾기:**

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

**출력 디렉토리 생성:**

```bash
REPORT_DIR=".gstack/qa-reports"
mkdir -p "$REPORT_DIR/screenshots"
```

---

## 테스트 계획 컨텍스트

git diff 휴리스틱으로 대체하기 전에 더 풍부한 테스트 계획 소스를 확인합니다:

1. **프로젝트 범위 테스트 계획:** 이 저장소의 최근 `*-test-plan-*.md` 파일을 `~/.gstack/projects/`에서 확인
   ```bash
   SLUG=$(git remote get-url origin 2>/dev/null | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')
   ls -t ~/.gstack/projects/$SLUG/*-test-plan-*.md 2>/dev/null | head -1
   ```
2. **대화 컨텍스트:** 이 대화에서 이전 `/plan-eng-review` 또는 `/plan-ceo-review`가 테스트 계획 출력을 생성했는지 확인
3. **더 풍부한 소스를 사용합니다.** 둘 다 없을 때만 git diff 분석으로 대체합니다.

---

## Modes

### Diff-aware (URL 없이 feature branch에 있을 때 자동)

이것은 개발자가 자신의 작업을 검증하는 **주요 모드**입니다. 사용자가 URL 없이 `/qa`를 입력하고 저장소가 feature branch에 있을 때 자동으로:

1. **branch diff 분석**으로 변경사항 파악:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **변경된 파일에서 영향받는 페이지/route 식별:**
   - Controller/route 파일 → 서비스하는 URL 경로
   - View/template/component 파일 → 렌더링하는 페이지
   - Model/service 파일 → 해당 모델을 사용하는 페이지 (참조하는 controller 확인)
   - CSS/style 파일 → 해당 스타일시트를 포함하는 페이지
   - API endpoints → `$B js "await fetch('/api/...')"`로 직접 테스트
   - Static 페이지 (markdown, HTML) → 직접 이동

3. **실행 중인 앱 감지** — 일반적인 로컬 개발 포트 확인:
   ```bash
   $B goto http://localhost:3000 2>/dev/null && echo "Found app on :3000" || \
   $B goto http://localhost:4000 2>/dev/null && echo "Found app on :4000" || \
   $B goto http://localhost:8080 2>/dev/null && echo "Found app on :8080"
   ```
   로컬 앱을 찾을 수 없으면 PR이나 환경에서 staging/preview URL을 확인합니다. 아무것도 작동하지 않으면 사용자에게 URL을 요청합니다.

4. **영향받는 각 페이지/route 테스트:**
   - 페이지 이동
   - 스크린샷 촬영
   - 오류에 대한 console 확인
   - 변경사항이 인터랙티브한 경우 (폼, 버튼, 플로우), 인터랙션을 end-to-end로 테스트
   - 액션 전후 `snapshot -D` 사용으로 변경사항이 예상된 효과를 가져왔는지 확인

5. **commit 메시지와 PR 설명을 교차 참조**하여 *의도* 파악 — 변경사항이 무엇을 해야 하는가? 실제로 그렇게 하는지 확인합니다.

6. **TODOS.md 확인** (존재하는 경우) 변경된 파일과 관련된 알려진 버그 또는 이슈. TODO가 이 branch가 수정해야 할 버그를 설명한다면 테스트 계획에 추가합니다. QA 중 TODOS.md에 없는 새로운 버그를 발견하면 보고서에 기록합니다.

7. **branch 변경사항에 범위를 맞춘 결과 보고:**
   - "변경사항 테스트: 이 branch에 의해 영향받는 N 페이지/route"
   - 각 항목: 작동하는가? 스크린샷 근거.
   - 인접 페이지에 regression이 있는가?

**사용자가 diff-aware mode에서 URL을 제공하는 경우:** 해당 URL을 기준으로 사용하되 변경된 파일에 대한 테스트 범위를 유지합니다.

### Full (URL이 제공될 때 기본값)
체계적인 탐색. 도달 가능한 모든 페이지 방문. 5-10개의 잘 검증된 이슈 문서화. Health score 생성. 앱 크기에 따라 5-15분 소요.

### Quick (`--quick`)
30초 스모크 테스트. 홈페이지 + 상위 5개 네비게이션 대상 방문. 확인: 페이지 로드? Console 오류? 깨진 링크? Health score 생성. 상세 이슈 문서화 없음.

### Regression (`--regression <baseline>`)
전체 모드 실행 후 이전 실행의 `baseline.json` 로드. 비교: 어떤 이슈가 수정되었나? 새로운 것은? 점수 변화는? 보고서에 regression 섹션 추가.

---

## 워크플로우

### Phase 1: 초기화

1. browse 바이너리 찾기 (위 Setup 참고)
2. 출력 디렉토리 생성
3. 보고서 템플릿을 `qa/templates/qa-report-template.md`에서 출력 디렉토리로 복사
4. 소요 시간 추적을 위한 타이머 시작

### Phase 2: 인증 (필요한 경우)

**사용자가 인증 자격증명을 지정한 경우:**

```bash
$B goto <login-url>
$B snapshot -i                    # 로그인 폼 찾기
$B fill @e3 "user@example.com"
$B fill @e4 "[REDACTED]"         # 보고서에 실제 비밀번호 포함 금지
$B click @e5                      # 제출
$B snapshot -D                    # 로그인 성공 확인
```

**사용자가 cookie 파일을 제공한 경우:**

```bash
$B cookie-import cookies.json
$B goto <target-url>
```

**2FA/OTP가 필요한 경우:** 사용자에게 코드를 요청하고 기다립니다.

**CAPTCHA가 차단하는 경우:** 사용자에게 안내합니다: "브라우저에서 CAPTCHA를 완료한 후 계속 진행하라고 알려주세요."

### Phase 3: 오리엔테이션

애플리케이션의 맵 파악:

```bash
$B goto <target-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/initial.png"
$B links                          # 네비게이션 구조 맵핑
$B console --errors               # 랜딩 시 오류가 있는가?
```

**프레임워크 감지** (보고서 메타데이터에 기록):
- HTML에 `__next` 또는 `_next/data` 요청 → Next.js
- `csrf-token` meta 태그 → Rails
- URL에 `wp-content` → WordPress
- 페이지 리로드 없는 클라이언트 사이드 라우팅 → SPA

**SPA의 경우:** 네비게이션이 클라이언트 사이드이므로 `links` 명령이 결과를 거의 반환하지 않을 수 있습니다. 대신 `snapshot -i`를 사용하여 nav 요소 (버튼, 메뉴 항목)를 찾습니다.

### Phase 4: 탐색

페이지를 체계적으로 방문합니다. 각 페이지에서:

```bash
$B goto <page-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/page-name.png"
$B console --errors
```

그런 다음 **페이지별 탐색 체크리스트**를 따릅니다 (`qa/references/issue-taxonomy.md` 참고):

1. **시각적 스캔** — 레이아웃 이슈를 위한 주석 달린 스크린샷 확인
2. **인터랙티브 요소** — 버튼, 링크, 컨트롤 클릭. 작동하는가?
3. **폼** — 채우고 제출. 빈 값, 유효하지 않은 값, 엣지 케이스 테스트
4. **네비게이션** — 들어오고 나가는 모든 경로 확인
5. **상태** — 빈 상태, 로딩, 오류, 오버플로우
6. **Console** — 인터랙션 후 새로운 JS 오류가 있는가?
7. **반응형** — 관련 있는 경우 모바일 viewport 확인:
   ```bash
   $B viewport 375x812
   $B screenshot "$REPORT_DIR/screenshots/page-mobile.png"
   $B viewport 1280x720
   ```

**깊이 판단:** 핵심 기능 (홈페이지, 대시보드, 체크아웃, 검색)에 더 많은 시간을 투자하고 보조 페이지 (소개, 이용약관, 개인정보 처리방침)에는 덜 투자합니다.

**Quick mode:** 오리엔테이션 phase의 홈페이지 + 상위 5개 네비게이션 대상만 방문합니다. 페이지별 체크리스트 건너뜀 — 로드되는가? Console 오류? 깨진 링크가 보이는가?만 확인합니다.

### Phase 5: 문서화

각 이슈를 **발견 즉시** 문서화합니다 — 묶어서 처리하지 마세요.

**두 가지 근거 단계:**

**인터랙티브 버그** (깨진 플로우, 죽은 버튼, 폼 실패):
1. 액션 전 스크린샷 촬영
2. 액션 수행
3. 결과를 보여주는 스크린샷 촬영
4. 무엇이 변경되었는지 보여주기 위해 `snapshot -D` 사용
5. 스크린샷을 참조하는 재현 단계 작성

```bash
$B screenshot "$REPORT_DIR/screenshots/issue-001-step-1.png"
$B click @e5
$B screenshot "$REPORT_DIR/screenshots/issue-001-result.png"
$B snapshot -D
```

**정적 버그** (오타, 레이아웃 이슈, 이미지 누락):
1. 문제를 보여주는 단일 주석 달린 스크린샷 촬영
2. 무엇이 잘못되었는지 설명

```bash
$B snapshot -i -a -o "$REPORT_DIR/screenshots/issue-002.png"
```

**각 이슈를 즉시 보고서에 기록합니다** `qa/templates/qa-report-template.md`의 템플릿 형식을 사용합니다.

### Phase 6: 마무리

1. 아래 루브릭을 사용하여 **health score 계산**
2. **"수정해야 할 상위 3가지"** 작성 — 가장 severity가 높은 3가지 이슈
3. **Console health 요약 작성** — 페이지 전체에서 본 모든 console 오류 집계
4. **요약 테이블의 severity 카운트 업데이트**
5. **보고서 메타데이터 채우기** — 날짜, 소요 시간, 방문 페이지, 스크린샷 수, 프레임워크
6. **Baseline 저장** — 다음 내용으로 `baseline.json` 작성:
   ```json
   {
     "date": "YYYY-MM-DD",
     "url": "<target>",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "console": N, "links": N, ... }
   }
   ```

**Regression mode:** 보고서 작성 후 baseline 파일을 로드합니다. 비교:
- Health score 변화
- 수정된 이슈 (baseline에는 있지만 현재에는 없는 것)
- 새로운 이슈 (현재에는 있지만 baseline에는 없는 것)
- 보고서에 regression 섹션 추가

---

## Health Score 루브릭

각 카테고리 점수 (0-100)를 계산하고 가중 평균을 냅니다.

### Console (가중치: 15%)
- 0 오류 → 100
- 1-3 오류 → 70
- 4-10 오류 → 40
- 10+ 오류 → 10

### Links (가중치: 10%)
- 0 깨진 링크 → 100
- 각 깨진 링크마다 → -15 (최소 0)

### 카테고리별 점수 (Visual, Functional, UX, Content, Performance, Accessibility)
각 카테고리는 100점에서 시작. 발견사항당 차감:
- Critical 이슈 → -25
- High 이슈 → -15
- Medium 이슈 → -8
- Low 이슈 → -3
카테고리별 최소 0점.

### 가중치
| 카테고리 | 가중치 |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### 최종 점수
`score = Σ (category_score × weight)`

---

## 프레임워크별 가이드

### Next.js
- hydration 오류 (`Hydration failed`, `Text content did not match`)에 대한 console 확인
- 네트워크에서 `_next/data` 요청 모니터링 — 404는 데이터 fetching 오류를 나타냄
- 클라이언트 사이드 네비게이션 테스트 (링크 클릭, `goto`만 사용 금지) — 라우팅 이슈 포착
- 동적 컨텐츠가 있는 페이지에서 CLS (Cumulative Layout Shift) 확인

### Rails
- Console에서 N+1 쿼리 경고 확인 (개발 모드인 경우)
- 폼에서 CSRF 토큰 존재 확인
- Turbo/Stimulus 통합 테스트 — 페이지 전환이 부드럽게 작동하는가?
- 플래시 메시지가 올바르게 표시되고 사라지는지 확인

### WordPress
- 플러그인 충돌 확인 (다른 플러그인의 JS 오류)
- 로그인한 사용자의 관리자 바 가시성 확인
- REST API endpoint 테스트 (`/wp-json/`)
- mixed content 경고 확인 (WP에서 일반적)

### 일반 SPA (React, Vue, Angular)
- 네비게이션에 `snapshot -i` 사용 — `links` 명령이 클라이언트 사이드 route를 놓침
- stale 상태 확인 (다른 페이지로 이동 후 돌아오기 — 데이터가 새로고침되는가?)
- 브라우저 뒤로/앞으로 테스트 — 앱이 history를 올바르게 처리하는가?
- 메모리 누수 확인 (오랜 사용 후 console 모니터링)

---

## 중요 규칙

1. **재현이 전부입니다.** 모든 이슈에는 최소 한 장의 스크린샷이 필요합니다. 예외 없음.
2. **문서화 전 확인.** 우연이 아닌 재현 가능한 것임을 확인하기 위해 이슈를 한 번 더 재시도합니다.
3. **자격증명 포함 금지.** 재현 단계의 비밀번호에는 `[REDACTED]`를 작성합니다.
4. **점진적으로 작성.** 발견할 때마다 보고서에 각 이슈를 추가합니다. 묶어서 처리하지 마세요.
5. **소스 코드를 읽지 마세요.** 개발자가 아닌 사용자로 테스트합니다.
6. **모든 인터랙션 후 console을 확인합니다.** 시각적으로 나타나지 않는 JS 오류도 버그입니다.
7. **사용자처럼 테스트합니다.** 실제 데이터를 사용합니다. 완전한 워크플로우를 end-to-end로 진행합니다.
8. **광범위함보다 깊이.** 근거가 있는 5-10개의 잘 문서화된 이슈 > 20개의 모호한 설명.
9. **출력 파일을 삭제하지 마세요.** 스크린샷과 보고서는 누적됩니다 — 의도적입니다.
10. **까다로운 UI에는 `snapshot -C`를 사용합니다.** 접근성 트리가 놓치는 클릭 가능한 div를 찾습니다.

---

## 출력

보고서를 로컬과 프로젝트 범위 위치 모두에 작성합니다:

**로컬:** `.gstack/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

**프로젝트 범위:** 세션 간 컨텍스트를 위한 테스트 결과 아티팩트 작성:
```bash
SLUG=$(git remote get-url origin 2>/dev/null | sed 's|.*[:/]\([^/]*/[^/]*\)\.git$|\1|;s|.*[:/]\([^/]*/[^/]*\)$|\1|' | tr '/' '-')
mkdir -p ~/.gstack/projects/$SLUG
```
`~/.gstack/projects/{slug}/{user}-{branch}-test-outcome-{datetime}.md`에 작성

### 출력 구조

```
.gstack/qa-reports/
├── qa-report-{domain}-{YYYY-MM-DD}.md    # 구조화된 보고서
├── screenshots/
│   ├── initial.png                        # 랜딩 페이지 주석 달린 스크린샷
│   ├── issue-001-step-1.png               # 이슈별 근거
│   ├── issue-001-result.png
│   └── ...
└── baseline.json                          # Regression mode용
```

보고서 파일명은 도메인과 날짜를 사용합니다: `qa-report-myapp-com-2026-03-12.md`

---

## 추가 규칙 (qa-only 전용)

11. **버그를 수정하지 마세요.** 발견하고 문서화만 합니다. 소스 코드를 읽거나, 파일을 편집하거나, 보고서에서 수정 방법을 제안하지 마세요. 당신의 역할은 무엇이 고장났는지 보고하는 것이지 수정하는 것이 아닙니다. 테스트-수정-검증 루프는 `/qa`를 사용하세요.
