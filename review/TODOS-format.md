# TODOS.md 형식 레퍼런스

정식 TODOS.md 형식에 대한 공용 레퍼런스입니다. `/ship`(Step 5.5)과 `/plan-ceo-review`(TODOS.md 업데이트 섹션)에서 참조하여 TODO 항목 구조를 일관되게 유지합니다.

---

## 파일 구조

```markdown
# TODOS

## <Skill/Component>     ← 예: ## Browse, ## Ship, ## Review, ## Infrastructure
<항목은 P0 우선, 그다음 P1, P2, P3, P4 순으로 정렬>

## Completed
<완료 표시가 붙은 완료 항목>
```

**섹션:** 스킬/컴포넌트 기준으로 구성합니다 (`## Browse`, `## Ship`, `## Review`, `## QA`, `## Retro`, `## Infrastructure`). 각 섹션 내 항목은 우선순위(P0이 맨 위) 순으로 정렬합니다.

---

## TODO 항목 형식

각 항목은 해당 섹션 아래 H3로 작성합니다:

```markdown
### <Title>

**What:** 작업 한 줄 설명.

**Why:** 해결하는 구체 문제 또는 열어주는 가치.

**Context:** 3개월 뒤 누가 이어받아도 동기, 현재 상태, 시작 지점을 이해할 수 있을 정도의 맥락.

**Effort:** S / M / L / XL
**Priority:** P0 / P1 / P2 / P3 / P4
**Depends on:** <선행조건 또는 "None">
```

**필수 필드:** What, Why, Context, Effort, Priority  
**선택 필드:** Depends on, Blocked by

---

## 우선순위 정의

- **P0** — 차단 이슈: 다음 릴리스 전에 반드시 처리
- **P1** — 크리티컬: 이번 사이클에서 처리 권장
- **P2** — 중요: P0/P1 정리 후 처리
- **P3** — 있으면 좋음: 도입/사용 데이터 확인 후 재검토
- **P4** — 언젠가: 좋은 아이디어지만 긴급도 낮음

---

## 완료 항목 형식

항목이 완료되면 원래 내용을 보존한 채 `## Completed` 섹션으로 옮기고 아래를 추가합니다:

```markdown
**Completed:** vX.Y.Z (YYYY-MM-DD)
```
