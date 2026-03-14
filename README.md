# gstack-ko

> **이 저장소는 [garrytan/gstack](https://github.com/garrytan/gstack)의 한국어 번역본입니다.**
> 원본 저장소: https://github.com/garrytan/gstack | 원작자: [Garry Tan](https://x.com/garrytan) (Y Combinator 대표 겸 CEO)

---

**gstack은 Claude Code를 하나의 범용 어시스턴트에서 필요할 때 즉시 소환할 수 있는 전문가 팀으로 바꿔줍니다.**

[Claude Code](https://docs.anthropic.com/en/docs/claude-code)를 위한 8개의 의견이 담긴 워크플로우 스킬. 계획 검토, 코드 리뷰, 원-커맨드 배포, 브라우저 자동화, QA 테스트, 엔지니어링 회고 — 모두 슬래시 커맨드로.

### gstack 없이

- 에이전트가 요청을 문자 그대로 받아들입니다 — 올바른 것을 만들고 있는지 절대 묻지 않습니다
- 실제 제품이 더 큰 무언가일 때도 정확히 말한 것을 구현합니다
- "PR 검토해줘"는 매번 일관성 없는 깊이를 줍니다
- "이거 배포해줘"는 무엇을 해야 할지에 대한 긴 대화가 됩니다
- 에이전트는 코드를 작성할 수 있지만 앱을 볼 수 없습니다 — 반은 장님입니다
- QA는 여전히 수동: 브라우저 열고, 클릭하고, 페이지 확인하고, 레이아웃 살펴보기

### gstack과 함께

| 스킬 | 모드 | 하는 일 |
|------|------|---------|
| `/plan-ceo-review` | 창업자 / CEO | 문제를 재사고합니다. 요청 안에 숨어있는 10점짜리 제품을 찾습니다. |
| `/plan-eng-review` | 엔지니어링 매니저 / 테크 리드 | 아키텍처, 데이터 흐름, 다이어그램, 엣지 케이스, 테스트를 확정합니다. |
| `/review` | 집착형 스태프 엔지니어 | CI를 통과하지만 프로덕션에서 터지는 버그를 찾습니다. Greptile 리뷰 코멘트를 트리아지합니다. |
| `/ship` | 릴리스 엔지니어 | main 동기화, 테스트 실행, Greptile 리뷰 해결, 푸시, PR 생성. 준비된 브랜치용이며, 무엇을 만들지 결정하는 용도가 아닙니다. |
| `/browse` | QA 엔지니어 | 에이전트에게 눈을 줍니다. 로그인하고, 앱을 클릭하고, 스크린샷을 찍고, 버그를 발견합니다. 60초 안에 전체 QA 통과. |
| `/qa` | QA 리드 | 체계적인 QA 테스트. 기능 브랜치에서 diff를 자동 분석하고, 영향받는 페이지를 식별하고, 테스트합니다. 전체 탐험, 빠른 스모크 테스트, 회귀 모드도 지원. |
| `/setup-browser-cookies` | 세션 매니저 | 실제 브라우저(Comet, Chrome, Arc, Brave, Edge)의 쿠키를 헤드리스 세션으로 가져옵니다. 수동 로그인 없이 인증된 페이지를 테스트합니다. |
| `/retro` | 엔지니어링 매니저 | 팀 인식형 회고: 당신의 심층 분석 + 모든 기여자의 개인별 칭찬과 성장 기회. |

## 데모: 하나의 기능, 다섯 가지 모드

저는 거의 모든 기능을 계획 모드에서 시작합니다. 무엇을 만들고 싶은지 설명하고, `/plan-ceo-review`로 올바른 것을 만들고 있는지 압박 테스트합니다. 제품 방향이 확정된 후에만 엔지니어링, 검토, 배포, 테스트로 전환합니다.

```
나:     [계획 모드 진입, 기능 설명]
        판매자 사진 업로드를 리스팅 앱에 추가하고 싶어.
        판매자가 물건 사진을 올리면 우리가 리스팅을 만들어줘.

나:     /plan-ceo-review

Claude: "사진 업로드"가 기능이 아닙니다. 실제 과제는 판매자가
        실제로 팔리는 리스팅을 만들도록 돕는 것입니다. 10점짜리
        버전은 이렇게 보입니다: 사진에서 제품을 자동 식별하고,
        웹에서 사양과 가격 비교를 가져오고, 제목과 설명을 초안
        작성하고, 가장 좋은 히어로 이미지를 제안합니다...

나:     /plan-eng-review

Claude: [아키텍처 다이어그램, 업로드 → 분류 → 보강 → 초안 파이프라인
        상태 기계, 비동기 잡 경계, 실패 모드, 테스트 매트릭스]

나:     [계획 모드 종료, 계획 구현]

나:     /review

Claude: 경쟁 조건: 두 탭이 표지 사진 선택을 덮어쓸 수 있습니다.
        신뢰 경계: 초안 생성에 웹 데이터를 가져오면 프롬프트
        인젝션 벡터가 생깁니다. 누락: 실패한 업로드의 고아 파일 정리.

나:     (이슈들 수정)

나:     /ship

Claude: [main 동기화, 테스트 실행, 브랜치 푸시, PR 생성 — 6번의 도구 호출, 완료]

나:     /qa

Claude: 브랜치 diff 분석 중... 파일 8개 변경, 라우트 3개 영향받음.
        [localhost:3000에서 /listings/new, /listings/:id, /api/listings 테스트]
        3개 라우트 모두 동작. 업로드 + 보강 흐름 종단간 통과.

나:     /setup-browser-cookies staging.myapp.com

Claude: Chrome에서 staging.myapp.com의 쿠키 8개를 가져왔습니다.

나:     /qa https://staging.myapp.com --quick

Claude: [스모크 테스트: 홈페이지 + 5개 페이지, 30초]
        건강 점수: 91/100. 중요 이슈 없음. 중간: 모바일 내비 겹침 1개.
```

## 대상 사용자

이미 Claude Code를 많이 사용하고 있으며, 하나의 흐릿한 범용 모드 대신 일관되고 높은 수준의 워크플로우를 원하는 분들을 위해 만들었습니다. 지금 어떤 두뇌가 필요한지 모델에게 말하고 싶은 분들 — 창업자의 취향, 엔지니어링 엄밀성, 집착형 리뷰, 또는 빠른 실행.

이건 초보자를 위한 프롬프트 팩이 아닙니다. 배포하는 사람들을 위한 운영 체제입니다.

## 날아다니는 법: 10개 세션 동시에

gstack은 하나의 Claude Code 세션으로도 강력합니다. 10개면 판도가 바뀝니다.

[Conductor](https://conductor.build)는 여러 Claude Code 세션을 병렬로 실행합니다 — 각각 자체 격리된 작업공간에서. 즉, 한 세션은 스테이징에서 `/qa`를 실행하고, 다른 세션은 PR에서 `/review`를 하고, 세 번째는 기능을 구현하고, 나머지 일곱 개는 다른 브랜치에서 작업할 수 있습니다. 동시에.

각 작업공간은 자동으로 자체 격리된 브라우저 인스턴스를 받습니다 — 별도 Chromium 프로세스, 쿠키, 탭, 그리고 각 프로젝트 루트의 `.gstack/`에 저장된 로그. 포트 충돌 없음, 공유 상태 없음, 설정 불필요. `/browse`와 `/qa` 세션은 10개의 병렬 작업공간에서도 서로 간섭하지 않습니다.

이것이 제가 사용하는 설정입니다. 한 사람, 10개의 병렬 에이전트, 각각 작업에 맞는 인지 모드. 이건 점진적 개선이 아닙니다. 소프트웨어를 만드는 다른 방식입니다.

## 설치

**요구사항:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/), [Bun](https://bun.sh/) v1.0+. `/browse`는 네이티브 바이너리를 컴파일합니다 — macOS와 Linux (x64, arm64)에서 동작합니다.

### Step 1: 내 컴퓨터에 설치

Claude Code를 열고 다음을 붙여넣으세요. Claude가 나머지를 처리합니다.

> gstack-ko를 설치해줘: `git clone https://github.com/lucas-flatwhite/gstack-ko.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` 를 실행하고, CLAUDE.md에 "gstack" 섹션을 추가해서 모든 웹 브라우징에는 gstack의 /browse 스킬을 사용하고, mcp\_\_claude-in-chrome\_\_\* 도구는 절대 사용하지 말고, 사용 가능한 스킬을 나열해줘: /plan-ceo-review, /plan-eng-review, /review, /ship, /browse, /qa, /setup-browser-cookies, /retro. 그런 다음 현재 프로젝트에도 gstack을 추가해서 팀원들이 사용할 수 있게 할지 물어봐.

### Step 2: 팀원들도 쓸 수 있도록 저장소에 추가 (선택사항)

> 이 프로젝트에 gstack을 추가해줘: `cp -Rf ~/.claude/skills/gstack .claude/skills/gstack && rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup` 를 실행하고, 이 프로젝트의 CLAUDE.md에 "gstack" 섹션을 추가해서 모든 웹 브라우징에는 gstack의 /browse 스킬을 사용하고, mcp\_\_claude-in-chrome\_\_\* 도구는 절대 사용하지 말고, 사용 가능한 스킬을 나열하고(/plan-ceo-review, /plan-eng-review, /review, /ship, /browse, /qa, /setup-browser-cookies, /retro), gstack 스킬이 동작하지 않으면 `cd .claude/skills/gstack && ./setup`을 실행해서 바이너리를 빌드하고 스킬을 등록하라고 알려줘.

실제 파일이 저장소에 커밋됩니다(서브모듈이 아님), 그래서 `git clone`만으로 바로 동작합니다. 바이너리와 node\_modules는 gitignore에 포함 — 팀원들은 빌드를 위해 `cd .claude/skills/gstack && ./setup`을 한 번만 실행하면 됩니다 (또는 `/browse`가 처음 사용 시 자동으로 처리합니다).

### 설치되는 것

- 스킬 파일 (마크다운 프롬프트)이 `~/.claude/skills/gstack/`에 (또는 프로젝트 설치의 경우 `.claude/skills/gstack/`에)
- `~/.claude/skills/browse`, `~/.claude/skills/qa`, `~/.claude/skills/review` 등의 심볼릭 링크가 gstack 디렉토리를 가리킴
- 브라우저 바이너리 `browse/dist/browse`에 (~58MB, gitignore됨)
- `node_modules/` (gitignore됨)
- `/retro`는 추세 추적을 위해 프로젝트의 `.context/retros/`에 JSON 스냅샷을 저장

모든 것이 `.claude/` 안에 있습니다. PATH나 백그라운드 프로세스에 아무것도 건드리지 않습니다.

---

## 스킬 사용법

[Garry Tan](https://x.com/garrytan) (Y Combinator 대표 겸 CEO)이 만들었습니다.

AI 코딩 도구가 하나의 흐릿한 모드에 갇혀있는 게 싫어서 gstack을 만들었습니다.

계획은 리뷰가 아닙니다. 리뷰는 배포가 아닙니다. 창업자의 취향은 엔지니어링 엄밀성이 아닙니다. 이 모든 것을 섞으면 보통 네 가지 모두의 평범한 혼합물이 나옵니다.

저는 명시적인 기어를 원합니다.

이 스킬들은 지금 어떤 두뇌를 원하는지 모델에게 말할 수 있게 해줍니다. 창업자, 엔지니어링 매니저, 집착형 리뷰어, 릴리스 머신 — 인지 모드를 필요할 때 전환할 수 있습니다. 그것이 핵심입니다.

---

## `/plan-ceo-review`

이것은 제 **창업자 모드**입니다.

모델이 취향, 야망, 사용자 공감, 그리고 긴 시간적 지평으로 생각하길 원하는 모드입니다. 요청을 문자 그대로 받아들이길 원하지 않습니다. 더 중요한 질문을 먼저 하길 원합니다:

**이 제품은 실제로 무엇을 위한 것인가?**

저는 이것을 **Brian Chesky 모드**라고 생각합니다.

핵심은 명백한 티켓을 구현하는 것이 아닙니다. 사용자의 관점에서 문제를 재사고하고, 필연적이고, 기쁘고, 어쩌면 조금 마법 같은 느낌의 버전을 찾는 것입니다.

### 예시

크레이그리스트 스타일의 리스팅 앱을 만들고 있다고 가정합시다:

> "판매자가 물건 사진을 업로드하게 해줘."

약한 어시스턴트는 파일 선택기를 추가하고 이미지를 저장합니다.

그것은 실제 제품이 아닙니다.

`/plan-ceo-review`에서는 "사진 업로드"가 기능인지조차 묻기를 원합니다. 아마도 진짜 기능은 실제로 팔리는 리스팅을 만들도록 돕는 것일 수 있습니다.

그것이 실제 과제라면 전체 계획이 바뀝니다.

이제 모델은 이런 것들을 물어야 합니다:

* 사진에서 제품을 식별할 수 있나?
* SKU나 모델 번호를 추론할 수 있나?
* 웹을 검색하고 제목과 설명을 자동으로 초안 작성할 수 있나?
* 사양, 카테고리, 가격 비교를 가져올 수 있나?
* 어떤 사진이 히어로 이미지로 가장 잘 전환될지 제안할 수 있나?
* 업로드된 사진이 못생기거나, 어둡거나, 지저분하거나, 신뢰도가 낮을 때 감지할 수 있나?
* 2007년의 죽은 폼 같은 느낌이 아닌 프리미엄 경험으로 만들 수 있나?

이것이 `/plan-ceo-review`가 제게 하는 일입니다.

"이 기능을 어떻게 추가하나?"가 아닌,
**"이 요청 안에 숨어있는 10점짜리 제품은 무엇인가?"**를 묻습니다.

그것은 매우 다른 종류의 힘입니다.

---

## `/plan-eng-review`

이것은 제 **엔지니어링 매니저 모드**입니다.

제품 방향이 올바르다면, 완전히 다른 종류의 지능이 필요합니다. 더 많은 아이디어 확장을 원하지 않습니다. "이것도 있으면 좋겠다"도 원하지 않습니다. 모델이 최고의 기술 리드가 되길 원합니다.

이 모드가 잘 다뤄야 할 것들:

* 아키텍처
* 시스템 경계
* 데이터 흐름
* 상태 전환
* 실패 모드
* 엣지 케이스
* 신뢰 경계
* 테스트 커버리지

그리고 제게 특히 중요한 하나: **다이어그램**.

LLM은 시스템을 그리도록 강제하면 훨씬 더 완전해집니다. 시퀀스 다이어그램, 상태 다이어그램, 컴포넌트 다이어그램, 데이터 흐름 다이어그램, 심지어 테스트 매트릭스까지. 다이어그램은 숨겨진 가정을 명확히 만듭니다. 모호한 계획을 훨씬 어렵게 만듭니다.

그래서 `/plan-eng-review`는 제품 비전을 담을 수 있는 기술적 뼈대를 만드는 곳입니다.

### 예시

같은 리스팅 앱 예시를 봅시다.

`/plan-ceo-review`가 이미 역할을 했다고 가정합니다. 실제 기능이 단순한 사진 업로드가 아니라는 것을 결정했습니다. 이것은 스마트 리스팅 흐름입니다:

* 사진 업로드
* 제품 식별
* 웹에서 리스팅 보강
* 강력한 제목과 설명 초안 작성
* 최적의 히어로 이미지 제안

이제 `/plan-eng-review`가 이어받습니다.

이제 모델이 답해야 할 질문들:

* 업로드, 분류, 보강, 초안 생성을 위한 아키텍처는?
* 어떤 단계가 동기적으로, 어떤 단계가 백그라운드 잡으로 가나?
* 앱 서버, 오브젝트 스토리지, 비전 모델, 검색/보강 API, 리스팅 데이터베이스 간 경계는?
* 업로드는 성공했지만 보강이 실패하면?
* 제품 식별 신뢰도가 낮으면?
* 재시도는 어떻게 작동하나?
* 중복 잡을 어떻게 방지하나?
* 언제 무엇이 저장되고, 무엇을 안전하게 재계산할 수 있나?

그리고 다이어그램이 필요합니다 — 아키텍처 다이어그램, 상태 모델, 데이터 흐름 다이어그램, 테스트 매트릭스.

그것이 `/plan-eng-review`입니다.

"아이디어를 더 작게 만들기"가 아닌,
**"아이디어를 만들 수 있게 만들기"**입니다.

---

## `/review`

이것은 제 **집착형 스태프 엔지니어 모드**입니다.

테스트를 통과한다고 해서 브랜치가 안전한 것이 아닙니다.

`/review`는 CI를 생존하고도 프로덕션에서 얼굴을 강타할 수 있는 버그 종류가 있기 때문에 존재합니다. 이 모드는 더 크게 꿈꾸는 것이 아닙니다. 계획을 더 예쁘게 만드는 것이 아닙니다. 이것을 묻는 것입니다:

**아직 무엇이 깨질 수 있나?**

이것은 스타일 니트픽 통과가 아닌 구조적 감사입니다. 다음과 같은 것들을 찾길 원합니다:

* N+1 쿼리
* 오래된 읽기
* 경쟁 조건
* 나쁜 신뢰 경계
* 누락된 인덱스
* 이스케이핑 버그
* 깨진 불변성
* 나쁜 재시도 로직
* 실제 실패 모드를 놓치면서 통과하는 테스트

### 예시

스마트 리스팅 흐름이 구현되고 테스트가 통과했다고 가정합시다.

`/review`는 여전히 물어야 합니다:

* 리스팅 사진이나 초안 제안을 렌더링할 때 N+1 쿼리를 도입했나?
* 실제 파일을 검증하지 않고 클라이언트 제공 파일 메타데이터를 신뢰하고 있나?
* 두 탭이 경쟁하여 표지 사진 선택이나 아이템 세부 사항을 덮어쓸 수 있나?
* 실패한 업로드가 스토리지에 고아 파일을 영원히 남기나?
* 동시성 하에서 "정확히 하나의 히어로 이미지" 규칙이 깨질 수 있나?
* 보강 API가 부분적으로 실패하면, 우아하게 저하되나 아니면 쓰레기를 저장하나?
* 초안 생성에 웹 데이터를 가져옴으로써 프롬프트 인젝션이나 신뢰 경계 문제를 실수로 만들었나?

그것이 `/review`의 요점입니다.

여기서 칭찬을 원하지 않습니다.
프로덕션 사고가 발생하기 전에 모델이 상상하길 원합니다.

---

## `/ship`

이것은 제 **릴리스 머신 모드**입니다.

무엇을 만들지 결정하고, 기술 계획을 완성하고, 진지한 리뷰를 실행한 후에는 더 이상 대화하고 싶지 않습니다. 실행을 원합니다.

`/ship`은 마지막 단계를 위한 것입니다. 준비된 브랜치를 위한 것이며, 무엇을 만들지 결정하는 용도가 아닙니다.

여기서 모델은 브레인스토밍 파트너처럼 행동하는 것을 멈추고 훈련된 릴리스 엔지니어처럼 행동해야 합니다: main과 동기화하고, 올바른 테스트를 실행하고, 브랜치 상태가 정상인지 확인하고, 저장소가 요구하는 경우 changelog나 버전을 업데이트하고, 푸시하고, PR을 생성하거나 업데이트합니다.

여기서 모멘텀이 중요합니다.

많은 브랜치가 흥미로운 작업이 끝나고 지루한 릴리스 작업만 남았을 때 죽습니다. 사람은 그 부분을 미룹니다. AI는 그러면 안 됩니다.

### 예시

스마트 리스팅 흐름이 완성됐다고 가정합시다.

제품 사고는 완료됐습니다.
아키텍처는 완료됐습니다.
리뷰 통과는 완료됐습니다.
이제 브랜치는 그냥 랜딩되어야 합니다.

그것이 `/ship`이 하는 일입니다.

반복적인 릴리스 위생을 처리해서 에너지를 낭비하지 않게 합니다:

* main과 동기화
* 테스트 재실행
* 이상한 브랜치 상태 확인
* changelog/버전 메타데이터 업데이트
* 브랜치 푸시
* PR 열기 또는 업데이트

이 시점에서 더 이상 아이디어를 원하지 않습니다.
비행기가 착륙하길 원합니다.

---

## Greptile 통합

[Greptile](https://greptile.com)은 PR을 자동으로 검토하는 YC 회사입니다. 실제 버그를 잡아냅니다 — 경쟁 조건, 보안 이슈, CI를 통과하지만 프로덕션에서 터지는 것들. 실제로 한 번 이상 제 목숨을 구했습니다.

**설정:** [greptile.com](https://greptile.com)에서 GitHub 저장소에 Greptile을 설치하세요 — 약 30초 걸립니다. PR을 검토하기 시작하면, gstack이 코멘트를 자동으로 선택합니다. 추가 설정 불필요.

자동화된 리뷰어의 문제는 트리아지입니다. Greptile은 좋지만, 모든 코멘트가 실제 이슈는 아닙니다. 일부는 오탐입니다. 일부는 세 커밋 전에 이미 수정한 것을 플래그합니다. 트리아지 레이어 없이는 코멘트가 쌓여 무시하기 시작합니다 — 그것이 목적을 무너뜨립니다.

gstack이 이를 해결합니다. `/review`와 `/ship`은 이제 Greptile을 인식합니다. Greptile의 코멘트를 읽고, 각각을 분류하고, 액션을 취합니다:

- **유효한 이슈**는 critical 발견사항에 추가되어 배포 전에 수정됩니다
- **이미 수정된 이슈**는 발견에 감사하는 자동 답글이 달립니다
- **오탐**은 반박됩니다 — 확인하면 왜 틀렸는지 설명하는 답글이 나갑니다

결과적으로 이중 레이어 리뷰: Greptile이 PR에서 비동기로 잡고, `/review`와 `/ship`이 일반 워크플로우의 일부로 해당 발견사항을 트리아지합니다.

또한 학습합니다. 확인하는 모든 오탐은 `~/.gstack/greptile-history.md`에 저장됩니다. 이후 실행에서는 코드베이스의 알려진 FP 패턴을 자동으로 건너뜁니다. `/retro`는 시간이 지남에 따라 Greptile의 타율을 추적합니다 — 신호 대 잡음 비율이 개선되는지 확인할 수 있습니다.

### 예시

```
나:     /ship

Claude: [main 동기화, 테스트 실행, 랜딩 전 검토...]

        이 PR에서 Greptile이 코멘트 3개를 찾았습니다:

        [유효] app/services/payment_service.rb:47 — 경쟁 조건:
        동시 청구가 이중 청구될 수 있습니다. 청구 블록 주위에
        DB 레벨의 advisory lock을 권장합니다.
        → https://github.com/you/app/pull/42#discussion_r123

        [이미 수정됨] app/models/user.rb:12 — downcase 전에
        email에 null 체크 누락.
        → 커밋 abc1234에서 이미 수정됨. 자동 답글 중.

        [오탐] lib/auth.rb:88 — "토큰 비교는 상수 시간 비교를
        사용해야 합니다." 우리는 이미 여기서
        ActiveSupport::SecurityUtils.secure_compare를 사용합니다.
        → https://github.com/you/app/pull/42#discussion_r125

        payment_service.rb의 경쟁 조건 수정 중...
        Advisory lock 적용됨. 커밋: fix: Greptile 리뷰 처리 — 동시 청구에 advisory lock

        auth 토큰 코멘트는 오탐입니다 — 이미 secure_compare를 사용합니다.

        오탐 옵션:
          A) Greptile에 설명 답글 달기 (권장)
          B) 어쨌든 수정
          C) 무시

나:     A

Claude: Greptile에 답글 달았습니다. 수정 후 테스트 재실행 중...
        모든 테스트 통과. 버전 업데이트로 계속합니다.

        [PR 본문에 Greptile 검토 섹션 포함하여 PR 생성]
        PR: https://github.com/you/app/pull/42
```

Greptile 코멘트 3개. 실제 수정 1개. 자동 인지 1개. 답글과 함께 오탐 반박 1개. 추가 시간: 약 30초. PR 본문에는 전체 감사 추적이 있습니다.

---

## `/browse`

이것은 제 **QA 엔지니어 모드**입니다.

`/browse`는 루프를 닫는 스킬입니다. 이전에는 에이전트가 생각하고 코딩할 수 있었지만 여전히 반은 장님이었습니다. UI 상태, 인증 흐름, 리다이렉트, 콘솔 에러, 빈 상태, 깨진 레이아웃을 추측해야 했습니다. 이제 그냥 가서 볼 수 있습니다.

그것은 실질적인 변화입니다. 전체 사이클은: 계획, 코딩, 앱 실행, UI 검사, 버그 재현, 수정 확인, 배포. QA는 더 이상 "수동으로 클릭"이 아니라 동일한 에이전트 루프의 일부가 됩니다. 에이전트에게 눈을 줍니다. 이제 지루하고 고맥락의 QA 작업을 스스로 할 수 있습니다: 앱을 클릭하고, 버그를 잡고, 수정을 확인하고, 계속합니다. 진짜 오퍼레이터가 기계 안에 있는 것 같은 느낌입니다.

Microsoft의 [Playwright](https://playwright.dev/)를 기반으로 구축된 지속적인 Chromium 데몬과 통신하는 컴파일된 바이너리입니다. 첫 번째 호출이 브라우저를 시작합니다 (~3초). 그 이후의 모든 호출: ~100-200ms. 브라우저는 커맨드 사이에 실행을 유지하므로, 쿠키, 탭, localStorage가 이어집니다.

브랜치를 푸시한 후, Claude에게 스테이징을 확인하러 가라고 합니다. 전체 QA 통과를 대신 해줍니다:

```
나:     /browse staging.myapp.com — 로그인하고, 가입 흐름을 테스트하고,
       이 브랜치에서 변경한 모든 페이지를 확인해줘

Claude: [18번의 도구 호출, ~60초]

        > browse goto https://staging.myapp.com/signup
        > browse snapshot -i
        > browse fill @e2 "test@example.com"
        > browse fill @e3 "password123"
        > browse click @e5                    (제출)
        > browse screenshot /tmp/signup.png
        > Read /tmp/signup.png

        가입 동작. 온보딩으로 리다이렉트됨. 변경된 페이지 확인 중.

        > browse goto https://staging.myapp.com/dashboard
        > browse screenshot /tmp/dashboard.png
        > Read /tmp/dashboard.png
        > browse console

        대시보드 로드됨. 콘솔 에러 없음. 샘플 데이터로 차트 렌더링.

        > browse goto https://staging.myapp.com/settings/billing
        > browse screenshot /tmp/billing.png
        > Read /tmp/billing.png

        결제 페이지 로드됨. 플랜 선택기에 Free/Pro/Enterprise 표시.
        Stripe 엘리먼트 올바르게 렌더링됨.

        > browse goto https://staging.myapp.com/api/health
        > browse text

        API 헬스 엔드포인트가 {"status":"ok","version":"2.4.1"}를 반환.

        4개 페이지 모두 올바르게 로드됨. 콘솔 에러 없음. 깨진 레이아웃 없음.
        가입 → 온보딩 → 대시보드 흐름이 종단간 동작.
```

18번의 도구 호출, 약 1분. 테스트 사용자를 가입시키고, 변경한 모든 페이지를 탐색하고, 스크린샷을 찍고, 읽고, 에러를 위해 콘솔을 확인하고, API를 검증했습니다. 전체 QA 통과입니다. 브라우저를 열지 않았습니다.

문서 읽기, 배포 검증, 폼 작성, 스크린샷 촬영, 환경 간 페이지 비교, 그리고 Claude가 라이브 URL을 봐야 하는 다른 모든 것에 동작합니다.

**보안 노트:** `/browse`는 지속적인 Chromium 세션을 실행합니다. 쿠키, localStorage, 세션 상태가 커맨드 사이에 이어집니다. 의도하지 않으면 민감한 프로덕션 환경에서 사용하지 마세요 — 이것은 실제 상태를 가진 실제 브라우저입니다. 세션은 30분의 유휴 시간 후 자동으로 종료됩니다.

전체 커맨드 레퍼런스, 기술 내부, 아키텍처 세부사항은 [BROWSER.md](BROWSER.md)를 참조하세요.

---

## `/qa`

이것은 제 **QA 리드 모드**입니다.

`/browse`는 에이전트에게 눈을 줍니다. `/qa`는 테스트 방법론을 줍니다.

가장 일반적인 사용 사례: 기능 브랜치에 있고, 코딩을 막 끝냈고, 모든 것이 동작하는지 확인하고 싶을 때. 그냥 `/qa`라고 하면 됩니다 — git diff를 읽고, 변경사항이 영향을 주는 페이지와 라우트를 식별하고, 브라우저를 실행하고, 각각을 테스트합니다. URL 필요 없음. 수동 테스트 계획 없음. 변경한 코드에서 무엇을 테스트할지 파악합니다.

```
나:     /qa

Claude: main 대비 브랜치 diff 분석 중...
        12개 파일 변경: 컨트롤러 3개, 뷰 2개, 서비스 4개, 테스트 3개

        영향받는 라우트: /listings/new, /listings/:id, /api/listings
        localhost:3000에서 앱 실행 중 감지됨.

        [각 영향받는 페이지 테스트 — 탐색, 폼 작성, 버튼 클릭,
        스크린샷, 콘솔 에러 확인]

        QA 리포트: 3개 라우트 테스트, 모두 동작.
        - /listings/new: 업로드 + 보강 흐름 종단간 동작
        - /listings/:id: 상세 페이지 올바르게 렌더링
        - /api/listings: 예상 형태로 200 반환
        콘솔 에러 없음. 인접 페이지 회귀 없음.
```

네 가지 모드:

- **Diff 인식** (기능 브랜치에서 자동) — `git diff main`을 읽고, 영향받는 페이지를 식별하고, 구체적으로 테스트합니다. "코드 작성"에서 "동작 확인"까지 가장 빠른 경로.
- **Full** — 전체 앱의 체계적인 탐험. 앱 크기에 따라 5-15분. 5-10개의 잘 증명된 이슈를 문서화합니다.
- **Quick** (`--quick`) — 30초 스모크 테스트. 홈페이지 + 상위 5개 탐색 대상. 로드됨? 콘솔 에러? 깨진 링크?
- **Regression** (`--regression baseline.json`) — full 모드 실행 후 이전 기준선과 비교. 어떤 이슈가 수정됐나? 새로 생긴 것은? 점수 변화는?

```
나:     /qa https://staging.myapp.com

Claude: [12개 페이지 탐험, 폼 3개 작성, 흐름 2개 테스트]

        QA 리포트: staging.myapp.com — 건강 점수: 72/100

        수정해야 할 상위 3가지:
        1. CRITICAL: 결제 폼이 필수 필드 비어있어도 제출됨
        2. HIGH: 모바일 nav 메뉴가 항목 선택 후 닫히지 않음
        3. MEDIUM: 대시보드 차트가 1024px 이하에서 사이드바와 겹침

        [전체 리포트와 스크린샷이 .gstack/qa-reports/에 저장됨]
```

리포트와 스크린샷은 `.gstack/qa-reports/`에 누적되어 시간이 지남에 따라 품질을 추적하고 실행을 비교할 수 있습니다.

**인증된 페이지 테스트:** 먼저 `/setup-browser-cookies`로 실제 브라우저 세션을 가져온 후, `/qa`가 로그인 뒤의 페이지를 테스트할 수 있습니다.

---

## `/setup-browser-cookies`

이것은 제 **세션 매니저 모드**입니다.

`/qa`나 `/browse`가 인증된 페이지를 테스트하려면 쿠키가 필요합니다. 헤드리스 브라우저를 통해 매번 수동으로 로그인하는 대신, `/setup-browser-cookies`는 일상 브라우저에서 실제 세션을 직접 가져옵니다.

설치된 Chromium 브라우저(Comet, Chrome, Arc, Brave, Edge)를 자동 감지하고, macOS 키체인을 통해 쿠키를 복호화하고, Playwright 세션에 로드합니다. 대화형 선택기 UI로 어떤 도메인을 가져올지 정확히 선택할 수 있습니다 — 쿠키 값은 절대 표시되지 않습니다.

```
나:     /setup-browser-cookies

Claude: 쿠키 선택기가 열렸습니다 — 브라우저에서 가져올 도메인을
        선택하고 완료되면 알려주세요.

        [브라우저 UI에서 github.com, myapp.com을 선택합니다]

나:     완료

Claude: 2개 도메인 (쿠키 47개) 가져왔습니다. 세션 준비됨.
```

또는 UI를 완전히 건너뛸 수 있습니다:

```
나:     /setup-browser-cookies github.com

Claude: Comet에서 github.com의 쿠키 12개를 가져왔습니다.
```

브라우저별 첫 번째 가져오기 시 macOS 키체인 프롬프트가 나타납니다 — "허용" 또는 "항상 허용"을 클릭하세요.

---

## `/retro`

이것은 제 **엔지니어링 매니저 모드**입니다.

주말에 실제로 무슨 일이 있었는지 알고 싶습니다. 느낌이 아닌 — 데이터로. `/retro`는 커밋 히스토리, 작업 패턴, 배포 속도를 분석하고 솔직한 회고를 작성합니다.

팀을 인식합니다. 커맨드를 실행하는 사람을 식별하고, 자신의 작업에 대해 가장 깊은 분석을 제공하고, 모든 기여자를 구체적인 칭찬과 성장 기회와 함께 분석합니다 — 실제로 1:1에서 할 법한 피드백. 커밋, LOC, 테스트 비율, PR 크기, 수정 비율 같은 메트릭을 계산합니다. 커밋 타임스탬프에서 코딩 세션을 감지하고, 핫스팟 파일을 찾고, 배포 연속 기록을 추적하고, 이번 주 가장 큰 배포를 식별합니다.

```
나:     /retro

Claude: 3월 1일 주: 47 커밋 (기여자 3명), 3.2k LOC, 38% 테스트, PR 12개, 피크: 오후 10시 | 연속: 47일

        ## 당신의 주간
        32 커밋, +2.4k LOC, 41% 테스트. 피크 시간: 오후 9-11시.
        가장 큰 배포: 쿠키 가져오기 시스템 (브라우저 복호화 + 선택기 UI).
        잘 한 것: 암호화, UI, 18개의 단위 테스트를 하나의 집중된 푸시로
        완전한 기능을 배포했습니다...

        ## 팀 분석

        ### Alice
        app/services/에 집중된 12 커밋. 모든 PR이 200 LOC 이하 — 규율 있음.
        성장 기회: 테스트 비율 12% — 결제가 더 복잡해지기 전에 투자할 가치 있음.

        ### Bob
        3 커밋 — 대시보드의 N+1 쿼리 수정. 적지만 영향력 높음.
        성장 기회: 이번 주 활동일 1일 — 막혀있는 것이 있는지 확인 필요.

        [팀 상위 3가지 성과, 개선할 3가지, 다음 주를 위한 3가지 습관]
```

JSON 스냅샷을 `.context/retros/`에 저장하여 다음 실행에서 추세를 보여줄 수 있습니다. `/retro compare`로 이번 주 vs 지난 주를 나란히 비교하세요.

---

## 문제 해결

**스킬이 Claude Code에서 나타나지 않을 때?**
`cd ~/.claude/skills/gstack && ./setup` (또는 프로젝트 설치의 경우 `cd .claude/skills/gstack && ./setup`)을 실행하세요. 심볼릭 링크를 재구성하여 Claude가 스킬을 발견할 수 있게 합니다.

**`/browse`가 실패하거나 바이너리를 찾지 못할 때?**
`cd ~/.claude/skills/gstack && bun install && bun run build`를 실행하세요. 브라우저 바이너리를 컴파일합니다. Bun v1.0+가 필요합니다.

**프로젝트 복사본이 오래됐을 때?**
글로벌에서 다시 복사: `for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do rm -f .claude/skills/$s; done && rm -rf .claude/skills/gstack && cp -Rf ~/.claude/skills/gstack .claude/skills/gstack && rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup`

**`bun`이 설치되지 않았을 때?**
설치: `curl -fsSL https://bun.sh/install | bash`

## 업그레이드

Claude Code에 다음을 붙여넣으세요:

> gstack을 업데이트해줘: `cd ~/.claude/skills/gstack && git fetch origin && git reset --hard origin/main && ./setup` 를 실행해줘. 이 프로젝트에도 gstack이 .claude/skills/gstack에 있으면, 함께 업데이트해줘: `for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do rm -f .claude/skills/$s; done && rm -rf .claude/skills/gstack && cp -Rf ~/.claude/skills/gstack .claude/skills/gstack && rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup`

`setup` 스크립트가 브라우저 바이너리를 재빌드하고 스킬을 다시 심볼릭 링크합니다. 몇 초 걸립니다.

## 제거

Claude Code에 다음을 붙여넣으세요:

> gstack을 제거해줘: `for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do rm -f ~/.claude/skills/$s; done` 를 실행하여 스킬 심볼릭 링크를 제거하고, `rm -rf ~/.claude/skills/gstack` 을 실행하고, CLAUDE.md에서 gstack 섹션을 제거해줘. 이 프로젝트에도 .claude/skills/gstack에 gstack이 있으면, `for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do rm -f .claude/skills/$s; done && rm -rf .claude/skills/gstack` 을 실행하고 프로젝트 CLAUDE.md에서 gstack 섹션도 제거해줘.

## 개발

전체 개발 가이드, 아키텍처, 커맨드 레퍼런스는 [BROWSER.md](BROWSER.md)를 참조하세요.

## 라이선스

MIT
