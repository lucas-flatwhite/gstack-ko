# 변경 이력

## 0.5.0 — 2026-03-16

- **이제 사이트의 디자인 리뷰를 받을 수 있습니다.** `/plan-design-review`는 사이트를 열고 시니어 제품 디자이너처럼 검토합니다 — 타이포그래피, 간격, 계층 구조, 색상, 반응형, 인터랙션, AI 양산 디자인 감지. 카테고리별 등급(A-F), "디자인 점수"와 "AI 양산 점수"로 구성된 이중 헤드라인, 그리고 직설적인 첫인상 리포트를 제공합니다.
- **발견한 문제를 직접 수정할 수도 있습니다.** `/design-review`는 동일한 디자이너 시각의 감사를 실행한 후, `style(design):` 커밋과 수정 전후 스크린샷을 통해 디자인 이슈를 반복적으로 수정합니다. 기본적으로 CSS-safe 모드로 동작하며, 스타일 변경에 최적화된 엄격한 자기 규제 휴리스틱을 적용합니다.
- **실제 디자인 시스템을 파악할 수 있습니다.** 두 스킬 모두 JS를 통해 라이브 사이트의 폰트, 색상, 헤딩 크기 체계, 간격 패턴을 추출합니다 — 그리고 추론된 시스템을 `DESIGN.md` 기준선으로 저장하는 것을 제안합니다. 이제 실제로 몇 가지 폰트를 사용하고 있는지 알 수 있습니다.
- **AI 양산 감지가 핵심 지표입니다.** 모든 리포트는 두 가지 점수로 시작합니다: 디자인 점수와 AI 양산 점수. AI 양산 체크리스트는 가장 흔한 AI 생성 패턴 10가지를 잡아냅니다 — 3열 기능 그리드, 보라색 그래디언트, 장식용 블롭, 이모지 불릿, 진부한 히어로 문구.
- **디자인 회귀 추적.** 리포트는 `design-baseline.json`을 생성합니다. 다음 실행에서는 자동으로 비교합니다: 카테고리별 등급 변화, 새로 발견된 문제, 해결된 문제. 디자인 점수가 개선되는 과정을 추적할 수 있습니다.
- **10개 카테고리에 걸친 80개 항목 디자인 감사 체크리스트**: 시각적 계층 구조, 타이포그래피, 색상/대비, 간격/레이아웃, 인터랙션 상태, 반응형, 모션, 콘텐츠/마이크로카피, AI 양산, 퍼포먼스-as-디자인. Vercel의 100개 이상 규칙, Anthropic의 프론트엔드 디자인 스킬, 그리고 6개의 다른 디자인 프레임워크에서 추출했습니다.

### 기여자를 위한 내용

- `gen-skill-docs.ts`에 `{{DESIGN_METHODOLOGY}}` 리졸버 추가 — `/plan-design-review`와 `/design-review` 템플릿 양쪽에 공유 디자인 감사 방법론을 주입합니다. `{{QA_METHODOLOGY}}` 패턴을 따릅니다.
- `~/.gstack-dev/plans/`를 장기 비전 문서용 로컬 플랜 디렉토리로 추가 (체크인하지 않음). CLAUDE.md와 TODOS.md 업데이트됨.
- TODOS.md에 `/setup-design-md` 추가 (P2): 처음부터 대화형 DESIGN.md 생성.

## 0.4.5 — 2026-03-16

- **이제 리뷰 발견사항이 목록에만 나열되지 않고 실제로 수정됩니다.** `/review`와 `/ship`은 이전에 정보성 발견사항(데드 코드, 테스트 공백, N+1 쿼리)을 출력하고 무시했습니다. 이제 모든 발견사항이 조치됩니다: 명백한 기계적 수정은 자동으로 적용되고, 진짜 모호한 문제는 8개의 개별 질문 대신 하나의 질문으로 묶입니다. 자동 수정된 항목마다 `[AUTO-FIXED] 파일:라인 문제 → 처리 내용`이 표시됩니다.
- **"그냥 수정"과 "먼저 물어봐"의 경계를 직접 제어할 수 있습니다.** 데드 코드, 오래된 주석, N+1 쿼리는 자동 수정됩니다. 보안 이슈, 경쟁 조건, 설계 결정은 판단을 위해 표면화됩니다. 분류 기준이 한 곳(`review/checklist.md`)에 있어서 `/review`와 `/ship` 양쪽이 동기화됩니다.

### 수정된 문제

- **`$B js "const x = await fetch(...); return x.status"`가 이제 동작합니다.** `js` 커맨드가 모든 것을 표현식으로 감쌌기 때문에 `const`, 세미콜론, 멀티라인 코드가 모두 오류가 났습니다. 이제 구문을 감지하고 `eval`처럼 블록 래퍼를 사용합니다.
- **드롭다운 옵션 클릭이 더 이상 영원히 멈추지 않습니다.** 에이전트가 스냅샷에서 `@e3 [option] "Admin"`을 보고 `click @e3`을 실행하면, gstack이 이제 해당 옵션을 자동 선택합니다 — Playwright 클릭이 불가능한 상황에 멈추지 않습니다.
- **클릭이 잘못된 도구일 때 gstack이 알려줍니다.** CSS 선택자로 `<option>`을 클릭하면 이전에는 알 수 없는 Playwright 오류로 타임아웃됐습니다. 이제 다음과 같이 안내합니다: `"드롭다운 옵션에는 'click' 대신 'browse select'를 사용하세요."`

### 기여자를 위한 내용

- Gate Classification → Severity Classification 이름 변경 (severity는 표시 순서를 결정하며, 프롬프트 표시 여부를 결정하지 않음).
- `review/checklist.md`에 Fix-First Heuristic 섹션 추가 — AUTO-FIX vs ASK 분류의 정규 기준.
- 새 유효성 검사 테스트: `Fix-First Heuristic이 checklist에 존재하고 review + ship에서 참조됨`.
- `read-commands.ts`에서 `needsBlockWrapper()`와 `wrapForEvaluate()` 헬퍼 추출 — `js`와 `eval` 커맨드 양쪽에서 공유 (DRY).
- `BrowserManager`에 `getRefRole()` 추가 — `resolveRef` 반환 타입을 변경하지 않고 ref 선택자의 ARIA 역할을 노출.
- 클릭 핸들러가 `[role=option]` ref를 DOM `tagName` 확인을 통해 부모 `<select>`의 `selectOption()`으로 자동 라우팅 — 커스텀 listbox 컴포넌트를 막지 않도록.
- 새 테스트 6개: 멀티라인 js, 세미콜론, 구문 키워드, 단순 표현식, option 자동 라우팅, CSS option 오류 안내.

## 0.4.4 — 2026-03-16

- **새 릴리스가 반나절이 아닌 한 시간 안에 감지됩니다.** 업데이트 확인 캐시가 12시간으로 설정되어 있어 하루 종일 구버전에 머물 수 있었습니다. 이제 "최신 버전입니다"는 60분 후 만료되어 한 시간 내에 업그레이드를 확인하게 됩니다. "업그레이드 가능"은 12시간 동안 알림을 유지합니다 (그것이 목적이므로).
- **`/gstack-upgrade`는 항상 실제로 확인합니다.** `/gstack-upgrade`를 직접 실행하면 이제 캐시를 우회하여 GitHub에 새로 확인합니다. 더 이상 이미 최신 버전인데 "이미 최신 버전입니다"가 나오지 않습니다.

### 기여자를 위한 내용

- `last-update-check` 캐시 TTL 분리: `UP_TO_DATE`는 60분, `UPGRADE_AVAILABLE`은 720분.
- `bin/gstack-update-check`에 `--force` 플래그 추가 (확인 전 캐시 파일 삭제).
- 새 테스트 3개: `--force`가 UP_TO_DATE 캐시를 무효화, `--force`가 UPGRADE_AVAILABLE 캐시를 무효화, `utimesSync`를 이용한 60분 TTL 경계 테스트.

## 0.4.3 — 2026-03-16

- **새 `/document-release` 스킬.** `/ship` 실행 후, merge 전에 실행하세요 — 프로젝트의 모든 문서 파일을 읽고, diff와 교차 참조하여, README, ARCHITECTURE, CONTRIBUTING, CHANGELOG, TODOS를 실제 배포 내용과 일치하도록 업데이트합니다. 위험한 변경사항은 질문으로 표면화되고, 나머지는 자동입니다.
- **이제 모든 질문이 항상 명확합니다.** 이전에는 gstack이 충분한 컨텍스트와 평이한 영어 설명을 제공하기까지 3회 이상의 세션이 필요했습니다. 이제 모든 질문 — 단일 세션에서도 — 이 프로젝트, 브랜치, 진행 상황을 컨텍스트 전환 중에도 이해할 수 있을 만큼 간단하게 설명합니다. 더 이상 "더 쉽게 설명해줘"가 필요 없습니다.
- **브랜치 이름이 항상 정확합니다.** gstack이 대화 시작 시점의 스냅샷에 의존하는 대신 런타임에 현재 브랜치를 감지합니다. 세션 중간에 브랜치를 변경해도 gstack이 따라갑니다.

### 기여자를 위한 내용

- ELI16 규칙을 기본 AskUserQuestion 형식에 병합 — `_SESSIONS >= 3` 조건부 없이 두 형식 대신 하나.
- preamble bash 블록에 `_BRANCH` 감지 추가 (`git branch --show-current`와 fallback).
- 브랜치 감지 및 단순화 규칙에 대한 회귀 방지 테스트 추가.

## 0.4.2 — 2026-03-16

- **`$B js "await fetch(...)"` 이 이제 그냥 동작합니다.** `$B js` 또는 `$B eval`의 모든 `await` 표현식이 자동으로 async 컨텍스트로 감싸집니다. 더 이상 `SyntaxError: await은 async 함수 내에서만 유효합니다`가 발생하지 않습니다. 단일 라인 eval 파일은 값을 직접 반환하고, 멀티라인 파일은 명시적 `return`을 사용합니다.
- **기여자 모드가 이제 반응만 하지 않고 성찰합니다.** 무언가 깨질 때만 보고서를 작성하는 대신, 기여자 모드는 이제 주기적인 성찰을 유도합니다: "gstack 경험을 0-10으로 평가해보세요. 10이 아니라면 왜 그런지 생각해보세요." 수동 감지로는 놓치는 사용성 문제와 마찰을 잡아냅니다. 보고서에는 이제 0-10 평가와 "이것을 10으로 만들려면 무엇이 필요한가"가 포함됩니다.
- **스킬이 이제 브랜치 타겟을 존중합니다.** `/ship`, `/review`, `/qa`, `/plan-ceo-review`가 `main`을 가정하는 대신 PR이 실제로 타겟하는 브랜치를 감지합니다. 스택된 브랜치, feature 브랜치를 타겟하는 Conductor 워크스페이스, `master`를 사용하는 저장소 모두 이제 그냥 동작합니다.
- **`/retro`가 모든 기본 브랜치에서 동작합니다.** `master`, `develop`, 또는 다른 기본 브랜치 이름을 사용하는 저장소가 자동으로 감지됩니다 — 더 이상 브랜치 이름이 달라 빈 회고가 나오지 않습니다.
- **새로운 `{{BASE_BRANCH_DETECT}}` 플레이스홀더** — 스킬 작성자용. 어느 템플릿에도 추가하면 3단계 브랜치 감지 (PR 기준 → 저장소 기본값 → fallback)를 무료로 얻을 수 있습니다.
- **3개의 새로운 E2E 스모크 테스트**가 ship, review, retro 스킬에서 기준 브랜치 감지가 종단간 동작하는지 검증합니다.

### 기여자를 위한 내용

- `// await`에 대한 오탐을 방지하기 위한 주석 제거를 포함한 `hasAwait()` 헬퍼 추가.
- 스마트 eval 래핑: 단일 라인 → 표현식 `(...)`, 멀티라인 → 명시적 `return`이 있는 블록 `{...}`.
- async 래핑 단위 테스트 6개, 기여자 모드 preamble 유효성 검사 테스트 40개 추가.
- 보정 예시를 역사적("이전에 실패했음")으로 프레임화하여 수정 후 라이브 버그가 있음을 암시하지 않도록.
- CLAUDE.md에 "SKILL 템플릿 작성" 섹션 추가 — bash 표현 대신 자연어, 동적 브랜치 감지, 자체 포함 코드 블록에 대한 규칙.
- Hardcoded-main 회귀 테스트가 모든 `.tmpl` 파일에서 하드코딩된 `main`이 있는 git 커맨드를 검사.
- QA 템플릿 정리: `REPORT_DIR` 쉘 변수 제거, 포트 감지를 산문으로 단순화.
- gstack-upgrade 템플릿: bash 블록 간 변수 참조에 대한 명시적 교차 단계 산문.

## 0.4.1 — 2026-03-16

- **gstack이 이제 자신의 실수를 알아챕니다.** 기여자 모드를 켜면(`gstack-config set gstack_contributor true`) gstack이 무엇이 잘못됐는지 자동으로 기록합니다 — 무엇을 하고 있었는지, 무엇이 깨졌는지, 재현 단계. 다음에 무언가 짜증스러우면 버그 리포트는 이미 작성됩니다. gstack을 포크해서 직접 수정하세요.
- **여러 세션을 동시에 진행 중? gstack이 따라갑니다.** gstack 창을 3개 이상 열고 있을 때, 모든 질문이 이제 어떤 프로젝트, 어떤 브랜치, 무엇을 작업 중인지 알려줍니다. 더 이상 "이게 어느 창이지?"라며 멍하니 바라보지 않아도 됩니다.
- **이제 모든 질문에 추천이 함께 제공됩니다.** 옵션을 던져놓고 생각하게 만드는 대신, gstack이 무엇을 선택할지와 이유를 알려줍니다. 모든 스킬에 걸쳐 동일한 명확한 형식으로.
- **`/review`가 이제 잊혀진 enum 핸들러를 찾아냅니다.** 새 상태, 등급, 또는 타입 상수를 추가했나요? `/review`가 변경한 파일뿐만 아니라 코드베이스 전체의 모든 switch 문, allowlist, 필터를 추적합니다 — "값은 추가했지만 처리를 빠뜨린" 류의 버그를 배포 전에 잡아냅니다.

### 기여자를 위한 내용

- 11개 스킬 템플릿 전체에서 `{{UPDATE_CHECK}}`를 `{{PREAMBLE}}`로 이름 변경 — 이제 하나의 시작 블록이 업데이트 확인, 세션 추적, 기여자 모드, 질문 형식을 처리.
- plan-ceo-review와 plan-eng-review의 질문 형식을 DRY화 — preamble 기준을 복제하는 대신 참조하도록.
- CLAUDE.md에 CHANGELOG 스타일 가이드와 vendored symlink 인식 문서 추가.

## 0.4.0 — 2026-03-16

### 추가된 기능
- **QA-only 스킬** (`/qa-only`) — 수정 없이 버그를 찾고 문서화하는 리포트 전용 QA 모드. 에이전트가 코드를 건드리지 않고 팀에 깔끔한 버그 리포트를 전달할 수 있습니다.
- **QA 수정 루프** — `/qa`가 이제 찾기-수정-검증 사이클을 실행합니다: 버그를 발견하고, 수정하고, commit하고, 다시 이동하여 수정이 적용됐는지 확인합니다. 깨진 상태에서 배포까지 하나의 커맨드.
- **Plan-to-QA 아티팩트 흐름** — `/plan-eng-review`가 테스트 플랜 아티팩트를 작성하면 `/qa`가 자동으로 가져갑니다. 이제 수동 복사 붙여넣기 없이 엔지니어링 리뷰에서 QA 테스트로 바로 연결됩니다.
- **`{{QA_METHODOLOGY}}` DRY 플레이스홀더** — `/qa`와 `/qa-only` 템플릿 양쪽에 공유 QA 방법론 블록이 주입됩니다. 테스팅 표준을 업데이트하면 두 스킬이 동기화됩니다.
- **Eval 효율성 지표** — 턴 수, 소요 시간, 비용이 모든 eval 화면에서 자연어 **요약** 코멘트와 함께 표시됩니다. 프롬프트 변경이 에이전트를 빠르게 했는지 느리게 했는지 한눈에 확인하세요.
- **`generateCommentary()` 엔진** — 비교 델타를 해석하여 직접 분석하지 않아도 됩니다: 회귀를 플래그하고, 개선 사항을 기록하고, 전체 효율성 요약을 생성합니다.
- **Eval list 열** — `bun run eval:list`가 이제 실행당 턴 수와 소요 시간을 표시합니다. 비싸거나 느린 실행을 즉시 발견하세요.
- **Eval summary 테스트별 효율성** — `bun run eval:summary`가 실행 간 테스트별 평균 턴/소요 시간/비용을 표시합니다. 어떤 테스트가 시간이 지남에 따라 가장 많은 비용을 쓰는지 파악하세요.
- **`judgePassed()` 단위 테스트** — 합격/불합격 판단 로직을 추출하고 테스트했습니다.
- **3개의 새로운 E2E 테스트** — qa-only 수정 금지 가드레일, commit 검증이 있는 qa 수정 루프, plan-eng-review 테스트 플랜 아티팩트.
- **브라우저 ref 오래됨 감지** — `resolveRef()`가 이제 페이지 변경 후 오래된 ref를 감지하기 위해 엘리먼트 수를 확인합니다. SPA 탐색이 더 이상 누락된 엘리먼트에서 30초 타임아웃을 일으키지 않습니다.
- ref 오래됨에 대한 새로운 스냅샷 테스트 3개.

### 변경 사항
- QA 스킬 프롬프트가 명시적인 두 사이클 워크플로우(찾기 → 수정 → 검증)로 재구성됨.
- `formatComparison()`이 비용과 함께 테스트별 턴 수와 소요 시간 델타를 표시.
- `printSummary()`가 턴 수와 소요 시간 열을 표시.
- `eval-store.test.ts`에서 기존 `_partial` 파일 어설션 버그 수정.

### 수정된 문제
- 브라우저 ref 오래됨 — 페이지 변경 전에 수집된 ref(예: SPA 탐색)가 이제 감지되어 재수집됩니다. 동적 사이트에서 불안정한 QA 실패의 한 종류가 제거됩니다.

## 0.3.9 — 2026-03-15

### 추가된 기능
- **`bin/gstack-config` CLI** — `~/.gstack/config.yaml`을 위한 간단한 get/set/list 인터페이스. update-check와 upgrade 스킬이 영구 설정에 사용합니다 (auto_upgrade, update_check).
- **스마트 업데이트 확인** — 12시간 캐시 TTL (기존 24시간), 사용자가 업그레이드를 거절할 때 지수적 스누즈 백오프(24시간 → 48시간 → 1주일), `update_check: false` 설정 옵션으로 확인 완전 비활성화. 새 버전 릴리스 시 스누즈 초기화.
- **자동 업그레이드 모드** — 설정에서 `auto_upgrade: true` 또는 `GSTACK_AUTO_UPGRADE=1` 환경 변수로 업그레이드 프롬프트를 건너뛰고 자동 업데이트.
- **4가지 선택지 업그레이드 프롬프트** — "지금 업그레이드", "항상 최신 버전 유지", "나중에" (스누즈), "다시 묻지 않기" (비활성화).
- **Vendored 복사본 동기화** — `/gstack-upgrade`가 기본 설치를 업그레이드한 후 현재 프로젝트의 로컬 vendored 복사본을 감지하고 업데이트합니다.
- 새 테스트 25개: gstack-config CLI용 11개, update-check의 스누즈/설정 경로용 14개.

### 변경 사항
- README 업그레이드/문제 해결 섹션이 긴 붙여넣기 커맨드 대신 `/gstack-upgrade`를 참조하도록 단순화됨.
- Upgrade 스킬 템플릿이 설정 편집을 위한 `Write` 도구 권한과 함께 v1.1.0으로 업그레이드됨.
- 모든 SKILL.md preamble이 새 업그레이드 흐름 설명으로 업데이트됨.

## 0.3.8 — 2026-03-14

### 추가된 기능
- **TODOS.md를 단일 진실의 원천으로** — `TODO.md`(로드맵)와 `TODOS.md`(단기 계획)를 스킬/컴포넌트별로 정리하고 P0-P4 우선순위 및 완료 섹션이 있는 하나의 파일로 병합했습니다.
- **`/ship` 5.5단계: TODOS.md 관리** — diff에서 완료된 항목을 자동 감지하고, 버전 주석과 함께 완료 표시하고, TODOS.md가 없거나 구조화되지 않은 경우 생성/재구성을 제안합니다.
- **크로스 스킬 TODOS 인식** — `/plan-ceo-review`, `/plan-eng-review`, `/retro`, `/review`, `/qa`가 이제 프로젝트 컨텍스트를 위해 TODOS.md를 읽습니다. `/retro`는 백로그 건강 지표(미완료 수, P0/P1 항목, 변동률)를 추가합니다.
- **공유 `review/TODOS-format.md`** — `/ship`과 `/plan-ceo-review`가 형식 불일치를 방지하기 위해 참조하는 정규 TODO 항목 형식 (DRY).
- **Greptile 2단계 답글 시스템** — 첫 번째 답글에는 Tier 1 (친근하게, 인라인 diff + 설명), Greptile이 이전 답글 후 재플래그할 때는 Tier 2 (단호하게, 완전한 증거 체인 + 재분류 요청).
- **Greptile 답글 템플릿** — `greptile-triage.md`의 수정(인라인 diff), 이미 수정됨(처리 내용), 오탐(증거 + 재분류 제안)을 위한 구조화된 템플릿. 모호한 한 줄 답글을 대체합니다.
- **Greptile 에스컬레이션 감지** — 코멘트 스레드에서 이전 GStack 답글을 감지하고 자동으로 Tier 2로 에스컬레이션하는 명시적 알고리즘.
- **Greptile 심각도 재분류** — Greptile이 이슈 심각도를 잘못 분류할 때 답글에 이제 `**제안된 재분류:**`가 포함됩니다.
- 스킬 전체에 걸친 `TODOS-format.md` 참조에 대한 정적 유효성 검사 테스트.

### 수정된 문제
- **`.gitignore` 추가 실패가 자동으로 무시됨** — `ensureStateDir()`의 빈 `catch {}`를 ENOENT 전용 무시로 교체; ENOENT 외 오류(EACCES, ENOSPC)는 `.gstack/browse-server.log`에 기록.

### 변경 사항
- `TODO.md` 삭제 — 모든 항목이 `TODOS.md`에 병합됨.
- `/ship` 3.75단계와 `/review` 5단계가 이제 `greptile-triage.md`의 답글 템플릿과 에스컬레이션 감지를 참조.
- `/ship` 6단계 commit 순서에 VERSION + CHANGELOG와 함께 마지막 commit에 TODOS.md 포함.
- `/ship` 8단계 PR 본문에 TODOS 섹션 포함.

## 0.3.7 — 2026-03-14

### 추가된 기능
- **스크린샷 엘리먼트/영역 클리핑** — `screenshot` 커맨드가 이제 CSS 선택자 또는 @ref를 통한 엘리먼트 크롭(`screenshot "#hero" out.png`, `screenshot @e3 out.png`), 영역 클립(`screenshot --clip x,y,w,h out.png`), 뷰포트 전용 모드(`screenshot --viewport out.png`)를 지원합니다. Playwright의 네이티브 `locator.screenshot()`과 `page.screenshot({ clip })`을 사용합니다. 전체 페이지가 기본값입니다.
- 모든 스크린샷 모드(뷰포트, CSS, @ref, clip)와 오류 경로(알 수 없는 플래그, 상호 배제, 잘못된 좌표, 경로 유효성 검사, 존재하지 않는 선택자)를 커버하는 새 테스트 10개.

## 0.3.6 — 2026-03-14

### 추가된 기능
- **E2E 관찰 가능성** — 하트비트 파일(`~/.gstack-dev/e2e-live.json`), 실행별 로그 디렉토리(`~/.gstack-dev/e2e-runs/{runId}/`), progress.log, 테스트별 NDJSON 트랜스크립트, 영구 실패 트랜스크립트. 모든 I/O는 치명적이지 않음.
- **`bun run eval:watch`** — 라이브 터미널 대시보드가 하트비트와 부분 eval 파일을 1초마다 읽습니다. 완료된 테스트, 턴/도구 정보가 있는 현재 테스트, 오래됨 감지(>10분), progress.log용 `--tail` 지원.
- **증분 eval 저장** — `savePartial()`이 각 테스트 완료 후 `_partial-e2e.json`을 씁니다. 충돌에 안전: 부분 결과가 종료된 실행에서도 살아남습니다. 절대 정리되지 않습니다.
- **기계 가독성 진단** — eval JSON에 `exit_reason`, `timeout_at_turn`, `last_tool_call` 필드. 자동화된 수정 루프를 위한 `jq` 쿼리를 가능하게 합니다.
- **API 연결 사전 확인** — E2E 스위트가 테스트 예산을 소모하기 전에 ConnectionRefused에서 즉시 오류를 냅니다.
- **`is_error` 감지** — `claude -p`가 API 실패 시 `is_error: true`와 함께 `subtype: "success"`를 반환할 수 있습니다. 이제 `error_api`로 올바르게 분류됩니다.
- **Stream-json NDJSON 파서** — `claude -p --output-format stream-json --verbose`에서 실시간 E2E 진행을 위한 `parseNDJSON()` 순수 함수.
- **Eval 영속성** — 결과가 자동 비교와 함께 `~/.gstack-dev/evals/`에 저장됩니다.
- **Eval CLI 도구** — eval 이력 검사를 위한 `eval:list`, `eval:compare`, `eval:summary`.
- **9개 스킬 모두 `.tmpl` 템플릿으로 변환** — plan-ceo-review, plan-eng-review, retro, review, ship이 이제 `{{UPDATE_CHECK}}` 플레이스홀더를 사용합니다. 업데이트 확인 preamble을 위한 단일 진실의 원천.
- **3단계 eval 스위트** — Tier 1: 정적 유효성 검사 (무료), Tier 2: `claude -p`를 통한 E2E (~$3.85/실행), Tier 3: LLM-as-judge (~$0.15/실행). `EVALS=1`로 활성화.
- **심어진 버그 결과 테스트** — 알려진 버그가 있는 eval fixture, LLM judge가 감지 점수를 매깁니다.
- 하트비트 스키마, progress.log 형식, NDJSON 명명, savePartial, finalize, watcher 렌더링, 오래됨 감지, 치명적이지 않은 I/O를 커버하는 관찰 가능성 단위 테스트 15개.
- plan-ceo-review, plan-eng-review, retro 스킬에 대한 E2E 테스트.
- 업데이트 확인 종료 코드 회귀 테스트.
- `test/helpers/skill-parser.ts` — git remote 감지를 위한 `getRemoteSlug()`.

### 수정된 문제
- **에이전트에 대한 browse 바이너리 검색 실패** — `find-browse` 간접 참조를 SKILL.md 설정 블록의 명시적 `browse/dist/browse` 경로로 교체.
- **에이전트를 혼란스럽게 하는 업데이트 확인 종료 코드 1** — 업데이트가 없을 때 비정상 종료를 방지하기 위해 `|| true` 추가.
- **browse/SKILL.md에 설정 블록 누락** — `{{BROWSE_SETUP}}` 플레이스홀더 추가.
- **plan-ceo-review 타임아웃** — 테스트 디렉토리에서 git 저장소 초기화, 코드베이스 탐색 건너뛰기, 타임아웃을 420초로 증가.
- 심어진 버그 eval 안정성 — 단순화된 프롬프트, 낮춰진 감지 기준선, max_turns 불안정성에 강인.

### 변경 사항
- **템플릿 시스템 확장** — `gen-skill-docs.ts`에 `{{UPDATE_CHECK}}`와 `{{BROWSE_SETUP}}` 플레이스홀더. browse를 사용하는 모든 스킬이 단일 진실의 원천에서 생성됨.
- 14개 커맨드 설명이 특정 인수 형식, 유효한 값, 오류 동작, 반환 타입으로 풍부해짐.
- 설정 블록이 먼저 워크스페이스 로컬 경로를 확인(개발용), 글로벌 설치로 fallback.
- LLM eval judge가 Haiku에서 Sonnet 4.6으로 업그레이드됨.
- `generateHelpText()`가 COMMAND_DESCRIPTIONS에서 자동 생성됨 (손으로 유지하는 도움말 텍스트를 대체).

## 0.3.3 — 2026-03-13

### 추가된 기능
- **SKILL.md 템플릿 시스템** — `{{COMMAND_REFERENCE}}`와 `{{SNAPSHOT_FLAGS}}` 플레이스홀더가 있는 `.tmpl` 파일이 빌드 시 소스 코드에서 자동 생성됩니다. 문서와 코드 간 커맨드 불일치를 구조적으로 방지합니다.
- **커맨드 레지스트리** (`browse/src/commands.ts`) — 카테고리와 풍부한 설명이 있는 모든 browse 커맨드의 단일 진실의 원천. 부작용 없음, 빌드 스크립트와 테스트에서 안전하게 import 가능.
- **스냅샷 플래그 메타데이터** (`browse/src/snapshot.ts`의 `SNAPSHOT_FLAGS` 배열) — 메타데이터 기반 파서가 손으로 코딩한 switch/case를 대체합니다. 한 곳에서 플래그를 추가하면 파서, 문서, 테스트가 업데이트됩니다.
- **Tier 1 정적 유효성 검사** — 43개 테스트: SKILL.md 코드 블록에서 `$B` 커맨드를 파싱하고, 커맨드 레지스트리와 스냅샷 플래그 메타데이터에 대해 유효성 검사
- **Tier 2 E2E 테스트** Agent SDK를 통해 — 실제 Claude 세션을 생성하고, 스킬을 실행하고, browse 오류를 스캔합니다. `SKILL_E2E=1` 환경 변수로 활성화 (~$0.50/실행)
- **Tier 3 LLM-as-judge eval** — Haiku가 생성된 문서의 명확성/완성도/실용성을 점수화(임계값 ≥4/5), 손으로 유지하는 기준선에 대한 회귀 테스트. `ANTHROPIC_API_KEY` 필요
- **`bun run skill:check`** — 모든 스킬, 커맨드 수, 유효성 검사 상태, 템플릿 신선도를 보여주는 건강 대시보드
- **`bun run dev:skill`** — 템플릿 또는 소스 파일 변경 시 SKILL.md를 재생성하고 유효성 검사하는 감시 모드
- **CI 워크플로우** (`.github/workflows/skill-docs.yml`) — push/PR 시 `gen:skill-docs` 실행, 생성된 출력이 커밋된 파일과 다르면 실패
- 수동 재생성을 위한 `bun run gen:skill-docs` 스크립트
- LLM-as-judge eval을 위한 `bun run test:eval`
- `test/helpers/skill-parser.ts` — Markdown에서 `$B` 커맨드를 추출하고 유효성 검사
- `test/helpers/session-runner.ts` — 오류 패턴 스캔 및 트랜스크립트 저장이 있는 Agent SDK 래퍼
- **ARCHITECTURE.md** — 데몬 모델, 보안, ref 시스템, 로깅, 충돌 복구를 다루는 설계 결정 문서
- **Conductor 통합** (`conductor.json`) — 워크스페이스 설정/해제를 위한 수명주기 훅
- **`.env` 전파** — `bin/dev-setup`이 Conductor 워크스페이스로 메인 worktree에서 `.env`를 자동으로 복사
- API 키 설정을 위한 `.env.example` 템플릿

### 변경 사항
- 빌드가 이제 바이너리 컴파일 전에 `gen:skill-docs`를 실행
- `parseSnapshotArgs`가 메타데이터 기반으로 동작 (`SNAPSHOT_FLAGS`를 반복하며 switch/case 대체)
- `server.ts`가 인라인으로 선언하는 대신 `commands.ts`에서 커맨드 세트를 import
- SKILL.md와 browse/SKILL.md가 이제 생성된 파일 (`.tmpl`을 편집하세요)

## 0.3.2 — 2026-03-13

### 수정된 문제
- 쿠키 import 선택기가 이제 HTML 대신 JSON을 반환 — `jsonResponse()`가 스코프 밖의 `url`을 참조하여 모든 API 호출이 충돌했음
- `help` 커맨드가 올바르게 라우팅됨 (META_COMMANDS 디스패치 순서로 인해 도달 불가능했음)
- 글로벌 설치의 오래된 서버가 더 이상 로컬 변경사항을 가리지 않음 — `resolveServerScript()`에서 레거시 `~/.claude/skills/gstack` fallback 제거
- 충돌 로그 경로가 `/tmp/`에서 `.gstack/`으로 업데이트됨

### 추가된 기능
- **Diff 인식 QA 모드** — 기능 브랜치에서 `/qa`가 자동으로 `git diff`를 분석하고, 영향받는 페이지/라우트를 식별하고, localhost에서 실행 중인 앱을 감지하여 변경된 내용만 테스트합니다. URL 불필요.
- **프로젝트 로컬 browse 상태** — 상태 파일, 로그, 모든 서버 상태가 이제 프로젝트 루트의 `.gstack/` 안에 있습니다(`git rev-parse --show-toplevel`로 감지). 더 이상 `/tmp` 상태 파일이 없습니다.
- **공유 설정 모듈** (`browse/src/config.ts`) — CLI와 서버의 경로 해결을 중앙화하고, 중복된 포트/상태 로직을 제거합니다
- **랜덤 포트 선택** — 9400-9409를 스캔하는 대신 서버가 10000-60000 사이의 랜덤 포트를 선택합니다. CONDUCTOR_PORT 마법 오프셋 없음. 워크스페이스 간 포트 충돌 없음.
- **바이너리 버전 추적** — 상태 파일에 `binaryVersion` SHA 포함; 바이너리가 재빌드될 때 CLI가 자동으로 서버를 재시작
- **레거시 /tmp 정리** — CLI가 이전 `/tmp/browse-server*.json` 파일을 스캔하고 제거하며, 신호를 보내기 전에 PID 소유권을 검증
- **Greptile 통합** — `/review`와 `/ship`이 이제 Greptile 봇 코멘트를 가져오고 분류하며; `/retro`가 주간 Greptile 타율을 추적
- **로컬 개발 모드** — `bin/dev-setup`이 인플레이스 개발을 위해 저장소에서 스킬을 심볼릭 링크; `bin/dev-teardown`이 글로벌 설치를 복원
- `help` 커맨드 — 에이전트가 모든 커맨드와 스냅샷 플래그를 자체 발견 가능
- META 신호 프로토콜이 있는 버전 인식 `find-browse` — 오래된 바이너리를 감지하고 에이전트에게 업데이트를 요청
- git SHA를 origin/main과 비교하는 `browse/dist/find-browse` 컴파일된 바이너리 (4시간 캐시)
- 빌드 시간에 작성되는 `.version` 파일 (바이너리 버전 추적용)
- 쿠키 선택기(13개 테스트)와 find-browse 버전 확인(10개 테스트)에 대한 라우트 수준 테스트
- git 루트 감지, BROWSE_STATE_FILE 오버라이드, ensureStateDir, readVersionHash, resolveServerScript, 버전 불일치 감지를 커버하는 설정 해결 테스트(14개 테스트)
- CLAUDE.md에 브라우저 상호 작용 안내 — Claude가 `mcp__claude-in-chrome__*` 도구를 사용하지 않도록 방지
- 빠른 시작, 개발 모드 설명, 다른 저장소에서 브랜치를 테스트하는 지침이 있는 CONTRIBUTING.md

### 변경 사항
- 상태 파일 위치: `.gstack/browse.json` (이전: `/tmp/browse-server.json`)
- 로그 파일 위치: `.gstack/browse-{console,network,dialog}.log` (이전: `/tmp/browse-*.log`)
- 원자적 상태 파일 쓰기: `.json.tmp` → 이름 변경 (부분 읽기 방지)
- CLI가 생성된 서버에 `BROWSE_STATE_FILE`을 전달 (서버가 모든 경로를 여기서 파생)
- SKILL.md 설정이 META 신호를 파싱하고 `META:UPDATE_AVAILABLE`을 처리
- `/qa` SKILL.md가 diff 인식을 기본값으로 하는 네 가지 모드(diff 인식, full, quick, 회귀)를 설명
- `jsonResponse`/`errorResponse`가 위치 매개변수 혼동을 방지하기 위해 옵션 객체를 사용
- 빌드 스크립트가 `browse`와 `find-browse` 바이너리 모두 컴파일, `.bun-build` 임시 파일 정리
- README가 Greptile 설정 지침, diff 인식 QA 예시, 개정된 데모 트랜스크립트로 업데이트됨

### 제거된 기능
- `CONDUCTOR_PORT` 마법 오프셋 (`browse_port = CONDUCTOR_PORT - 45600`)
- 포트 스캔 범위 9400-9409
- `~/.claude/skills/gstack/browse/src/server.ts`로의 레거시 fallback
- `DEVELOPING_GSTACK.md` (CONTRIBUTING.md로 이름 변경)

## 0.3.1 — 2026-03-12

### Phase 3.5: 브라우저 쿠키 import

- `cookie-import-browser` 커맨드 — 실제 Chromium 브라우저(Comet, Chrome, Arc, Brave, Edge)에서 쿠키를 복호화하고 import
- browse 서버에서 제공하는 대화형 쿠키 선택기 웹 UI (다크 테마, 두 패널 레이아웃, 도메인 검색, import/제거)
- 비대화형 사용을 위한 `--domain` 플래그로 직접 CLI import
- Claude Code 통합을 위한 `/setup-browser-cookies` 스킬
- 비동기 10초 타임아웃이 있는 macOS 키체인 접근 (이벤트 루프 블로킹 없음)
- 브라우저별 AES 키 캐싱 (세션당 브라우저별 키체인 프롬프트 한 번)
- DB 잠금 fallback: 안전한 읽기를 위해 잠긴 쿠키 DB를 /tmp에 복사
- 암호화된 쿠키 fixture가 있는 단위 테스트 18개

## 0.3.0 — 2026-03-12

### Phase 3: /qa 스킬 — 체계적인 QA 테스트

- 6단계 워크플로우(초기화, 인증, 파악, 탐험, 문서화, 마무리)가 있는 새로운 `/qa` 스킬
- 세 가지 모드: full (체계적, 5-10개 이슈), quick (30초 스모크 테스트), regression (기준선과 비교)
- 이슈 분류법: 7개 카테고리, 4개 심각도 수준, 페이지별 탐험 체크리스트
- 7개 카테고리에 걸쳐 가중치 적용된 건강 점수(0-100)가 있는 구조화된 리포트 템플릿
- Next.js, Rails, WordPress, SPA에 대한 프레임워크 감지 안내
- `browse/bin/find-browse` — `git rev-parse --show-toplevel`을 사용한 DRY 바이너리 검색

### Phase 2: 향상된 브라우저

- 대화 처리: 자동 수락/거절, 대화 버퍼, 프롬프트 텍스트 지원
- 파일 업로드: `upload <sel> <file1> [file2...]`
- 엘리먼트 상태 확인: `is visible|hidden|enabled|disabled|checked|editable|focused <sel>`
- ref 레이블이 오버레이된 주석 스크린샷 (`snapshot -a`)
- 이전 스냅샷에 대한 스냅샷 diff (`snapshot -D`)
- 비 ARIA 클릭 가능 엘리먼트를 위한 커서 상호작용 엘리먼트 스캔 (`snapshot -C`)
- `wait --networkidle` / `--load` / `--domcontentloaded` 플래그
- `console --errors` 필터 (오류 + 경고만)
- 페이지 URL에서 자동 도메인 채우기가 있는 `cookie-import <json-file>`
- 콘솔/네트워크/대화 버퍼를 위한 O(1) 원형 버퍼 CircularBuffer
- Bun.write()를 사용한 비동기 버퍼 플러시
- page.evaluate + 2초 타임아웃으로 헬스 체크
- Playwright 오류 래핑 — AI 에이전트를 위한 실행 가능한 메시지
- 쿠키/스토리지/URL을 보존하는 컨텍스트 재생성 (useragent 수정)
- 10개의 워크플로우 패턴이 있는 QA 지향 플레이북으로 SKILL.md 재작성
- 통합 테스트 166개 (이전: ~63개)

## 0.0.2 — 2026-03-12

- 프로젝트 로컬 `/browse` 설치 수정 — 컴파일된 바이너리가 이제 글로벌 설치가 있다고 가정하는 대신 자신의 디렉토리에서 `server.ts`를 해결
- `setup`이 누락된 바이너리뿐만 아니라 오래된 바이너리도 재빌드하고 빌드 실패 시 비정상 종료
- 쓰기 커맨드의 실제 오류를 삼키는 `chain` 커맨드 수정 (예: 탐색 타임아웃이 "알 수 없는 meta 커맨드"로 보고됨)
- 동일한 커맨드에서 서버가 반복 충돌할 때 CLI의 무한 재시작 루프 수정
- 50k 항목 위로 끝없이 커지는 대신 콘솔/네트워크 버퍼를 50k 항목으로 제한 (원형 버퍼)
- 버퍼가 50k 제한에 도달한 후 디스크 플러시가 조용히 멈추는 문제 수정
- 업그레이드 시 중첩 심볼릭 링크 생성을 방지하기 위해 setup의 `ln -snf` 수정
- 업그레이드에 `git pull` 대신 `git fetch && git reset --hard` 사용 (force-push 처리)
- 설치 단순화: 선택적 프로젝트 복사가 있는 글로벌 우선 방식 (서브모듈 방식 대체)
- README 재구성: 히어로, 이전/이후, 데모 트랜스크립트, 문제 해결 섹션
- 6개 스킬 (`/retro` 추가)

## 0.0.1 — 2026-03-11

초기 릴리스.

- 5개 스킬: `/plan-ceo-review`, `/plan-eng-review`, `/review`, `/ship`, `/browse`
- 40개 이상의 커맨드, ref 기반 상호 작용, 영구 Chromium 데몬이 있는 헤드리스 브라우저 CLI
- Claude Code 스킬로 한 커맨드 설치 (서브모듈 또는 글로벌 클론)
- 바이너리 컴파일 및 스킬 심볼릭 링크를 위한 `setup` 스크립트
