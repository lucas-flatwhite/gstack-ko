---
name: review
version: 1.0.0
description: |
  랜딩 전 PR 검토. SQL 안전성, LLM 신뢰 경계 위반,
  조건부 사이드 이펙트, 기타 구조적 이슈를 위해 main 대비 diff를 분석합니다.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - AskUserQuestion
---

# 랜딩 전 PR 검토

`/review` 워크플로우를 실행합니다. 테스트가 잡아내지 못하는 구조적 이슈를 위해 현재 브랜치의 main 대비 diff를 분석합니다.

---

## Step 1: 브랜치 확인

1. `git branch --show-current`로 현재 브랜치를 가져옵니다.
2. `main`에 있으면 다음을 출력하고 중지합니다: **"검토할 것이 없습니다 — main에 있거나 main 대비 변경사항이 없습니다."**
3. `git fetch origin main --quiet && git diff origin/main --stat`으로 diff가 있는지 확인합니다. diff가 없으면 동일한 메시지를 출력하고 중지합니다.

---

## Step 2: 체크리스트 읽기

`.claude/skills/review/checklist.md`를 읽습니다.

**파일을 읽을 수 없으면 에러를 보고하고 중지합니다.** 체크리스트 없이 진행하지 않습니다.

---

## Step 3: diff 가져오기

오래된 로컬 main으로 인한 오탐을 방지하기 위해 최신 main을 가져옵니다:

```bash
git fetch origin main --quiet
```

전체 diff를 가져오기 위해 `git diff origin/main`을 실행합니다. 최신 main 대비 커밋된 변경사항과 미커밋 변경사항 모두 포함됩니다.

---

## Step 4: 2단계 검토

두 단계로 diff에 체크리스트 기준을 적용합니다:

1. **Pass 1 (CRITICAL):** SQL 및 데이터 안전성, LLM 출력 신뢰 경계
2. **Pass 2 (INFORMATIONAL):** 조건부 사이드 이펙트, 매직 넘버 및 문자열 결합, 데드 코드 및 일관성, LLM 프롬프트 이슈, 테스트 갭, 뷰/프론트엔드

체크리스트에 지정된 출력 형식을 따릅니다. 억제 항목을 존중합니다 — "DO NOT flag" 섹션에 나열된 항목은 플래그를 달지 않습니다.

---

## Step 5: 결과 출력

**모든 결과를 항상 출력합니다** — critical과 informational 모두. 사용자가 모든 이슈를 볼 수 있어야 합니다.

- CRITICAL 이슈가 발견된 경우: 모든 결과를 출력하고, 각 critical 이슈에 대해 별도 AskUserQuestion을 사용하여 문제, 권장 수정사항, 옵션(A: 지금 수정, B: 인지, C: 오탐 — 건너뛰기)을 제시합니다.
  모든 critical 질문에 답변 후, 각 이슈에 대해 사용자가 선택한 것의 요약을 출력합니다. 사용자가 어떤 이슈에 A(수정)를 선택했다면, 권장 수정사항을 적용합니다. B/C만 선택됐다면 추가 조치 불필요.
- non-critical 이슈만 발견된 경우: 결과를 출력합니다. 추가 조치 불필요.
- 이슈가 없는 경우: `랜딩 전 검토: 이슈가 발견되지 않았습니다.`를 출력합니다.

---

## 중요 규칙

- **코멘트 전에 전체 diff를 읽습니다.** diff에서 이미 해결된 이슈는 플래그를 달지 않습니다.
- **기본적으로 읽기 전용.** critical 이슈에서 사용자가 명시적으로 "지금 수정"을 선택한 경우에만 파일을 수정합니다. 커밋, 푸시, PR 생성은 하지 않습니다.
- **간결하게.** 한 줄 문제, 한 줄 수정. 서두 없음.
- **실제 문제만 플래그합니다.** 괜찮은 것은 건너뜁니다.
