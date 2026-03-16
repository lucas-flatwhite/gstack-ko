# Greptile 코멘트 트리아지

GitHub PR의 Greptile 리뷰 코멘트를 수집, 필터링, 분류하기 위한 공용 레퍼런스입니다. `/review`(2.5단계)와 `/ship`(3.75단계) 모두 이 문서를 참조합니다.

---

## 수집 (Fetch)

아래 명령으로 PR을 감지하고 코멘트를 가져옵니다. 두 API 호출은 병렬로 실행합니다.

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)
PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null)
```

**둘 중 하나라도 실패하거나 비어 있으면:** Greptile 트리아지를 조용히 건너뜁니다. 이 통합은 부가 기능이며, 없어도 워크플로우는 동작합니다.

```bash
# 라인 단위 리뷰 코멘트 + PR 최상위 코멘트를 병렬로 수집
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.user.login == "greptile-apps[bot]") | select(.position != null) | {id: .id, path: .path, line: .line, body: .body, html_url: .html_url, source: "line-level"}' > /tmp/greptile_line.json &
gh api repos/$REPO/issues/$PR_NUMBER/comments \
  --jq '.[] | select(.user.login == "greptile-apps[bot]") | {id: .id, body: .body, html_url: .html_url, source: "top-level"}' > /tmp/greptile_top.json &
wait
```

**API 에러가 나거나 두 엔드포인트 모두 Greptile 코멘트가 0개면:** 조용히 건너뜁니다.

라인 단위 코멘트의 `position != null` 필터는 force-push로 오래된 코멘트를 자동으로 제외합니다.

---

## 억제 규칙 확인 (Suppressions Check)

`~/.gstack/greptile-history.md`가 있으면 읽습니다. 각 라인은 이전 트리아지 결과를 기록합니다:

```
<date> | <repo> | <type:fp|fix|already-fixed> | <file-pattern> | <category>
```

**카테고리**(고정 집합): `race-condition`, `null-check`, `error-handling`, `style`, `type-safety`, `security`, `performance`, `correctness`, `other`

각 코멘트가 아래 조건과 매칭되면:
- `type == fp` (이미 수정된 실제 이슈가 아니라, 알려진 false positive만 억제)
- `repo`가 현재 저장소와 일치
- `file-pattern`이 코멘트의 파일 경로와 일치
- `category`가 코멘트의 이슈 유형과 일치

해당 코멘트를 **SUPPRESSED**로 처리하고 스킵합니다.

히스토리 파일이 없거나 일부 라인이 파싱 불가여도 해당 라인만 건너뛰고 계속 진행합니다. malformed history 파일 때문에 실패하면 안 됩니다.

---

## 분류 (Classify)

억제되지 않은 각 코멘트에 대해:

1. **라인 단위 코멘트:** 지정된 `path:line`과 주변 컨텍스트(±10줄) 읽기
2. **최상위 코멘트:** 코멘트 본문 전체 읽기
3. 코멘트를 전체 diff(`git diff origin/main`) 및 리뷰 체크리스트와 대조
4. 분류:
   - **VALID & ACTIONABLE**: 현재 코드에 실제로 존재하는 버그/경합/보안/정합성 문제
   - **VALID BUT ALREADY FIXED**: 실제 이슈였지만 브랜치의 후속 커밋에서 이미 해결됨. 해결 커밋 SHA를 식별
   - **FALSE POSITIVE**: 코드를 잘못 이해했거나, 다른 곳에서 이미 처리된 항목이거나, 실질적 문제 없는 스타일 노이즈
   - **SUPPRESSED**: 위 억제 검사에서 이미 필터링된 항목

---

## 답글 API (Reply APIs)

Greptile 코멘트에 답글을 달 때는 코멘트 출처에 맞는 엔드포인트를 사용합니다.

**라인 단위 코멘트** (`pulls/$PR/comments`에서 온 경우):
```bash
gh api repos/$REPO/pulls/$PR_NUMBER/comments/$COMMENT_ID/replies \
  -f body="<reply text>"
```

**최상위 코멘트** (`issues/$PR/comments`에서 온 경우):
```bash
gh api repos/$REPO/issues/$PR_NUMBER/comments \
  -f body="<reply text>"
```

**답글 POST가 실패하면**(예: PR closed, 쓰기 권한 없음): 경고만 하고 계속 진행합니다. 답글 실패로 워크플로우를 중단하지 않습니다.

---

## 히스토리 파일 기록 (History File Writes)

쓰기 전에 디렉터리가 있는지 보장합니다:
```bash
mkdir -p ~/.gstack
```

`~/.gstack/greptile-history.md`에 트리아지 결과를 라인 단위로 append합니다:
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
- 파일:라인 (라인 단위) 또는 `[top-level]` (최상위)
- 본문 1줄 요약
- 퍼머링크 URL (`html_url` 필드)
