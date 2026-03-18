---
name: plan-design-review
version: 2.0.0
description: |
  디자이너 시각의 플랜 리뷰를 CEO/Eng 리뷰처럼 대화형으로 수행합니다.
  각 디자인 차원을 0-10으로 평가하고, 10점 기준을 설명한 뒤,
  실제 계획을 10점에 가깝게 수정합니다. 계획 모드에서 사용하세요.
  라이브 사이트 시각 감사는 /design-review를 사용하세요.
  "디자인 플랜 리뷰", "디자인 비평" 요청 시 사용하세요.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

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

출력에 `UPGRADE_AVAILABLE <old> <new>`가 표시되면: `~/.claude/skills/gstack/gstack-upgrade/SKILL.md`를 읽고 "인라인 업그레이드 흐름"을 따르세요 (자동 업그레이드가 설정된 경우 자동 업그레이드, 그렇지 않으면 4가지 옵션으로 AskUserQuestion 호출, 거절 시 snooze 상태 기록). `JUST_UPGRADED <from> <to>`가 표시되면: 사용자에게 "Running gstack v{to} (just updated!)"라고 알리고 계속 진행하세요.

## AskUserQuestion 형식

**모든 AskUserQuestion 호출 시 반드시 이 구조를 따르세요:**
1. **상황 재정립:** 프로젝트, 현재 branch (`_BRANCH` 사용), 현재 계획/작업을 명시합니다.
2. **단순화:** 16세도 이해할 수 있는 쉬운 말로 문제를 설명합니다.
3. **권장 사항:** `RECOMMENDATION: [X]를 선택하세요. 이유: [한 줄 설명]`
4. **선택지:** 알파벳 선택지 `A) ... B) ... C) ...`

## 기여자 모드

`_CONTRIB`가 `true`이면 주요 단계마다 경험을 0-10으로 평가하고, 명확한 gstack 개선점이 있을 때만 `~/.gstack/contributor-logs/{slug}.md`에 현장 보고서를 남깁니다.

## Step 0: Base Branch 감지

아래 순서로 base branch를 감지합니다.

1. PR이 있으면:
```bash
gh pr view --json baseRefName -q .baseRefName
```
2. PR이 없으면:
```bash
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
```
3. 둘 다 실패하면 `main`을 사용합니다.

이후 `git diff`, `git log` 등 모든 비교 명령은 감지한 base branch를 기준으로 실행합니다.

# /plan-design-review: 디자이너의 시각 플랜 리뷰

이 스킬은 **라이브 사이트를 검사하는 QA 스킬이 아닙니다.**
목표는 플랜 문서의 디자인 완성도를 끌어올리는 것입니다.

산출물은 "감사 보고서"가 아니라 **개선된 계획**입니다.

## 핵심 원칙

1. 구현 시작 전에 디자인 의사결정을 명시적으로 고정합니다.
2. "모던하고 깔끔하게" 같은 모호한 표현을 구체 규칙으로 바꿉니다.
3. 빈 상태/오류 상태/권한 상태/로딩 상태를 기능의 일부로 다룹니다.
4. 반응형, 접근성, 신뢰 요소를 기본 요구사항으로 포함합니다.
5. AI 생성형 전형 패턴(일명 AI slop)을 의식적으로 회피합니다.

## 사전 감사 (PRE-REVIEW AUDIT)

먼저 컨텍스트를 수집합니다:

```bash
git log --oneline -15
git diff <base-branch> --stat
```

그 다음 아래를 읽습니다:
- 현재 플랜 문서 또는 플랜 관련 diff
- `CLAUDE.md`
- `DESIGN.md` (존재 시 필수)
- `TODOS.md`

확인 항목:
- 이번 플랜의 UI 범위(화면/컴포넌트/사용자 상호작용)
- 기존 디자인 시스템 존재 여부
- 재사용 가능한 기존 패턴
- 이전 디자인 리뷰에서 반복된 문제

UI 범위가 전혀 없으면 사용자에게 "이 플랜은 UI 범위가 없어 디자인 플랜 리뷰 대상이 아닙니다."라고 알리고 종료합니다.

## 0-10 인터랙티브 방식

각 디자인 차원에 대해 아래 루프를 반복합니다.

1. 현재 점수 부여 (0-10)
2. 10점 기준 정의 (무엇이 빠졌는지 명확화)
3. 플랜 문서 직접 수정
4. 수정 후 재평가
5. 실제 선택이 필요한 항목만 AskUserQuestion

## 리뷰 차원 (7개)

### 1) 정보 구조 (IA)
- 화면별 목적, 핵심 행동, 보조 행동, 이탈 경로가 명시됐는가
- 흐름이 사용자 과업 중심으로 연결되는가

### 2) 상호작용 상태 커버리지
- 로딩/빈 상태/오류/권한 없음/성공/재시도 상태가 모두 정의됐는가
- 실패 시 복구 경로가 계획에 있는가

### 3) 시각적 위계 & 밀도
- 사용자가 먼저 봐야 할 1-2-3 요소가 분명한가
- 여백/강조/컴포넌트 밀도 기준이 문서에 명시됐는가

### 4) 타이포그래피 & 카피
- 타입 스케일과 텍스트 역할(헤드라인/본문/보조)이 정의됐는가
- 버튼/에러/도움말 문구 톤 원칙이 있는가

### 5) 반응형 전략
- 모바일/태블릿/데스크톱에서 우선순위 변경 규칙이 있는가
- 좁은 화면에서 숨김/축약/재배치 규칙이 있는가

### 6) 접근성 & 신뢰
- 키보드 포커스, 대비, 터치 타깃, 스크린리더 고려가 명시됐는가
- 파괴적 액션의 안전장치(확인/되돌리기/가드)가 있는가

### 7) AI Slop 리스크
- 전형적 템플릿형 패턴(3열 카드 복제, 과한 보라 그라디언트, 맥락 없는 장식)을 피하는 지침이 있는가
- 브랜드/제품 맥락에 맞는 차별화 근거가 있는가

## AskUserQuestion 트리거

다음 경우에만 질문합니다:
- 제품 전략에 따라 답이 달라지는 디자인 선택
- 완성도 높은 대안이 둘 이상일 때 우선순위 결정
- DESIGN.md와 현재 플랜 간 충돌을 해석해야 할 때

기계적으로 보완 가능한 누락(상태 정의, 접근성 기준, 반응형 규칙)은 질문하지 말고 바로 계획에 반영합니다.

## 출력 형식

최종 출력은 다음 순서를 따릅니다.

1. **총점 변화**
- 초기 점수 → 최종 점수

2. **차원별 점수표**
- 7개 차원의 초기/최종 점수와 핵심 보강점

3. **플랜 반영 내역**
- 실제로 수정한 섹션 요약

4. **남은 의사결정 (있을 때만)**
- 사용자 선택이 필요한 항목과 추천안

5. **구현 전 체크리스트**
- 구현 착수 전에 확인할 디자인 조건

## 추가 규칙 (plan-design-review 전용)

11. **코드 수정 금지.** 이 스킬은 플랜 문서 리뷰/수정 전용입니다.
12. **라이브 사이트 감사 금지.** 라이브 UI 감사/수정은 `/design-review`를 사용합니다.
13. **DESIGN.md 우선 보정.** 디자인 시스템 문서가 있으면 해당 기준을 우선 적용합니다.
