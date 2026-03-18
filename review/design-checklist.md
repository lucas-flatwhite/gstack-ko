# 디자인 리뷰 체크리스트 (Lite)

> **DESIGN_METHODOLOGY의 부분집합** — 여기에 항목을 추가할 때는 `scripts/gen-skill-docs.ts`의 `generateDesignMethodology()`도 함께 업데이트해야 하며, 반대도 동일합니다.

## 지침

이 체크리스트는 **렌더링 결과가 아니라 diff에 포함된 소스 코드**에 적용합니다. 변경된 프론트엔드 파일을 각 파일 단위로 전체 읽고(일부 hunk만 보지 않음), 안티패턴을 표시하세요.

**트리거:** diff가 프론트엔드 파일을 건드린 경우에만 실행합니다. 감지는 `gstack-diff-scope`를 사용합니다:

```bash
eval $(~/.claude/skills/gstack/bin/gstack-diff-scope <base> 2>/dev/null)
```

`SCOPE_FRONTEND=false`이면 전체 디자인 리뷰를 조용히 건너뜁니다.

**DESIGN.md 보정:** 저장소 루트에 `DESIGN.md` 또는 `design-system.md`가 있으면 먼저 읽으세요. 모든 발견 사항은 프로젝트에 명시된 디자인 시스템 기준으로 보정합니다. DESIGN.md에서 명시적으로 허용한 패턴은 이슈로 올리지 않습니다. DESIGN.md가 없으면 보편적 디자인 원칙을 사용합니다.

---

## 신뢰도 티어

각 항목은 탐지 신뢰도 태그를 가집니다:

- **[HIGH]** — grep/패턴 매칭으로 높은 신뢰도로 탐지 가능. 확정적 발견.
- **[MEDIUM]** — 패턴 집계/휴리스틱 기반 탐지. 이슈로 제시하되 노이즈 가능성 있음.
- **[LOW]** — 시각적 의도 이해가 필요한 영역. "가능성 이슈 - 시각 검증 또는 /design-review 실행"으로 제시.

---

## 분류

**AUTO-FIX** (기계적 CSS 수정만, HIGH 신뢰도, 디자인 판단 불필요):
- 대체 없이 `outline: none` → `outline: revert` 또는 `&:focus-visible { outline: 2px solid currentColor; }` 추가
- 신규 CSS의 `!important` → 제거하고 specificity를 정상화
- 본문 텍스트 `font-size` < 16px → 16px로 상향

**ASK** (그 외 전체, 디자인 판단 필요):
- AI 양산 디자인, 타이포 구조, 간격 선택, 인터랙션 상태 누락, DESIGN.md 위반

**LOW 신뢰도 항목**은 항상 "Possible: [설명]. 시각 검증 또는 /design-review 실행" 형태로 제시하고 AUTO-FIX하지 않습니다.

---

## 출력 형식

```text
Design Review: N issues (X auto-fixable, Y need input, Z possible)

AUTO-FIXED:
- [file:line] 문제 설명 → 적용한 수정

NEEDS INPUT:
- [file:line] 문제 설명
  Recommended fix: 제안 수정

POSSIBLE (verify visually):
- [file:line] 가능성 이슈 — /design-review로 시각 검증
```

이슈가 없으면: `Design Review: No issues found.`

프론트엔드 변경이 없으면: 출력 없이 조용히 종료.

---

## 카테고리

### 1. AI Slop 감지 (6개) - 최우선

신뢰할 수 있는 디자인 스튜디오가 보통 배포하지 않는, AI 생성형 UI의 전형적 패턴입니다.

- **[MEDIUM]** 보라/인디고 계열 그라디언트 배경 또는 파랑-보라 스킴. `#6366f1`~`#8b5cf6` 대역의 `linear-gradient`, 또는 해당 계열로 해석되는 CSS 변수 확인.
- **[LOW]** 3열 기능 카드 복제 패턴: 컬러 원형 아이콘 + 굵은 제목 + 2줄 설명이 3회 대칭 반복.
- **[LOW]** 섹션 장식용 컬러 원형 아이콘 컨테이너 (`border-radius: 50%` + 배경색).
- **[HIGH]** 과도한 중앙 정렬. 제목/본문/카드에 `text-align: center`가 과밀(텍스트 컨테이너의 60% 초과)하면 플래그.
- **[MEDIUM]** 과도한 균일 둥근 모서리. 큰 radius(16px+)가 카드/버튼/입력/컨테이너에 거의 동일하게 반복(80% 초과)되면 플래그.
- **[MEDIUM]** 상투적 히어로 카피: "Welcome to [X]", "Unlock the power of...", "Your all-in-one solution for...", "Revolutionize your...", "Streamline your workflow" 등.

### 2. 타이포그래피 (4개)

- **[HIGH]** 본문 텍스트 `font-size` < 16px (`body`, `p`, base text class 등).
- **[HIGH]** diff에서 도입된 font-family가 3개 초과.
- **[HIGH]** 헤딩 레벨 점프 (`h1` 다음 `h3` 등)로 계층이 깨짐.
- **[HIGH]** 금지 폰트 사용: Papyrus, Comic Sans, Lobster, Impact, Jokerman.

### 3. 간격 및 레이아웃 (4개)

- **[MEDIUM]** DESIGN.md에 간격 스케일이 있는데 4px/8px 체계에서 벗어나는 임의 간격값 사용.
- **[MEDIUM]** 반응형 보완 없이 컨테이너에 고정폭(`width: NNNpx`) 사용.
- **[MEDIUM]** 텍스트 컨테이너에 `max-width`가 없어 줄 길이가 과도하게 길어짐.
- **[HIGH]** 신규 CSS에 `!important` 사용.

### 4. 인터랙션 상태 (3개)

- **[MEDIUM]** 버튼/링크/입력에 hover/focus 상태 정의 누락.
- **[HIGH]** 대체 포커스 표시 없이 `outline: none` 또는 `outline: 0` 사용.
- **[LOW]** 터치 타깃 44px 미만 가능성(유효 크기 계산 필요).

### 5. DESIGN.md 위반 (조건부 3개)

루트에 `DESIGN.md` 또는 `design-system.md`가 있을 때만 적용:

- **[MEDIUM]** 명시 팔레트 외 색상 사용
- **[MEDIUM]** 명시 타이포그래피 외 폰트 사용
- **[MEDIUM]** 명시 간격 스케일 외 값 사용

---

## 억제 규칙

아래는 플래그하지 않습니다:
- DESIGN.md에 의도적 패턴으로 명시된 항목
- third-party/vendor CSS (`node_modules`, `vendor` 등)
- CSS reset / normalize 스타일시트
- 테스트 fixture 파일
- 생성물/압축 CSS
