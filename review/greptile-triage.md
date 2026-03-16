# Greptile 코멘트 트리아지

GitHub PR의 Greptile 리뷰 코멘트를 가져오고, 필터링하고, 분류하기 위한 공용 레퍼런스입니다. `/review`(Step 2.5)와 `/ship`(Step 3.75)에서 이 문서를 참조합니다.

---

## 가져오기(Fetch)

PR을 감지하고 코멘트를 가져오려면 아래 명령을 실행합니다. 두 API 호출은 병렬로 실행됩니다.

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null)
```

**둘 중 하나라도 실패하거나 비어 있으면:** Greptile 트리아지는 조용히 건너뜁니다. 이 통합은 부가 기능이며, 워크플로우는 없어도 동작합니다.

```bash
# 라인 단위 리뷰 코멘트 + PR 상단 코멘트를 병렬로 가져오기
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.user.login == "greptile-apps[bot]") | select(.position != null) | {id: .id, path: .path, line: .line, body: .body, html_url: .html_url, source: "line-level"}' > /tmp/greptile_line.json &
gh api repos/$REPO/issues/$PR_NUMBER/comments \
  --jq '.[] | select(.user.login == "greptile-apps[bot]") | {id: .id, body: .body, html_url: .html_url, source: "top-level"}' > /tmp/greptile_top.json &
wait
```

**API 에러가 나거나 두 엔드포인트 합산 Greptile 코멘트가 0개면:** 조용히 건너뜁니다.

라인 단위 코멘트에서 `position != null` 필터를 사용하면 force-push로 인해 구버전이 된 코멘트를 자동 제외할 수 있습니다.

---

## 억제(Suppressions) 확인

`~/.gstack/greptile-history.md`가 있으면 읽습니다. 각 라인은 과거 트리아지 결과를 기록합니다:

```
<date> | <repo> | <type:fp|fix|already-fixed> | <file-pattern> | <category>
```

**카테고리 고정값:** `race-condition`, `null-check`, `error-handling`, `style`, `type-safety`, `security`, `performance`, `correctness`, `other`

가져온 각 코멘트는 아래 조건을 모두 만족하는 히스토리 항목과 매칭합니다:
- `type == fp` (이미 해결된 실제 이슈가 아니라, 기존 false positive만 억제)
- `repo`가 현재 저장소와 일치
- `file-pattern`이 코멘트 파일 경로와 일치
- `category`가 코멘트 이슈 유형과 일치

매칭되면 **SUPPRESSED**로 건너뜁니다.

히스토리 파일이 없거나 파싱 불가 라인이 있어도 해당 라인만 건너뛰고 계속합니다. 잘못된 히스토리 때문에 워크플로우를 실패시키지 않습니다.

---

## 분류(Classify)

억제되지 않은 각 코멘트에 대해:

1. **라인 단위 코멘트:** 해당 `path:line`과 주변 문맥(±10줄) 읽기
2. **상단 코멘트:** 코멘트 본문 전체 읽기
3. 전체 diff(`git diff origin/main`) 및 리뷰 체크리스트와 교차검증
4. 아래 중 하나로 분류:
   - **VALID & ACTIONABLE** — 현재 코드에 실제로 존재하는 버그/레이스 컨디션/보안/정합성 이슈
   - **VALID BUT ALREADY FIXED** — 실제 이슈였으나 브랜치의 후속 커밋에서 이미 해결됨(해결 커밋 SHA 식별)
   - **FALSE POSITIVE** — 코드 오해, 다른 위치에서 이미 처리, 또는 스타일성 노이즈
   - **SUPPRESSED** — 위 억제 단계에서 이미 필터링됨

---

## Reply API

Greptile 코멘트에 답글을 달 때는 코멘트 소스별로 올바른 엔드포인트를 사용합니다.

**라인 단위 코멘트** (`pulls/$PR/comments`에서 온 경우):
```bash
gh api repos/$REPO/pulls/$PR_NUMBER/comments/$COMMENT_ID/replies \
  -f body="<reply text>"
```

**상단 코멘트** (`issues/$PR/comments`에서 온 경우):
```bash
gh api repos/$REPO/issues/$PR_NUMBER/comments \
  -f body="<reply text>"
```

**답글 POST 실패 시**(예: PR 닫힘, 쓰기 권한 없음): 경고만 남기고 계속 진행합니다. 답글 실패로 워크플로우를 중단하지 않습니다.

---

## 히스토리 파일 쓰기

쓰기 전에 디렉토리를 보장합니다:
```bash
mkdir -p ~/.gstack
```

`~/.gstack/greptile-history.md`에 트리아지 결과를 줄 단위로 append합니다:
```
<YYYY-MM-DD> | <owner/repo> | <type> | <file-pattern> | <category>
```

예시:
```
2026-03-13 | garrytan/myapp | fp | app/services/auth_service.rb | race-condition
2026-03-13 | garrytan/myapp | fix | app/models/user.rb | null-check
2026-03-13 | garrytan/myapp | already-fixed | lib/payments.rb | error-handling
```

---

## 출력 형식

출력 헤더에 Greptile 요약을 포함합니다:
```
+ N Greptile comments (X valid, Y fixed, Z FP)
```

분류된 각 코멘트에 대해 표시:
- 분류 태그: `[VALID]`, `[FIXED]`, `[FALSE POSITIVE]`, `[SUPPRESSED]`
- 파일:줄 참조(라인 단위) 또는 `[top-level]`(상단 코멘트)
- 본문 한 줄 요약
- 퍼머링크 URL (`html_url`)
