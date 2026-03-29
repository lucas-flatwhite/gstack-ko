# gstack-ko 작업 메모

## 저장소 성격

- 이 저장소는 문서/스킬 전용 저장소입니다.
- 실행 코드, 테스트, 빌드 체계는 upstream `garrytan/gstack`가 담당합니다.
- 여기서는 한국어 `SKILL.md`와 운영 문서를 유지합니다.

## 작업 원칙

- 문서와 스킬 설명만 수정합니다.
- 명령어, 옵션, 코드 블록, 경로, 변수명은 번역하지 않습니다.
- 브라우저/QA/upgrade 계열 스킬은 실제 실행이 upstream 의존임을 숨기지 않습니다.
- 정책 판단이 필요하면 `docs/translation-sync-policy.md`를 우선 확인합니다.

## 변경 시 확인할 문서

- `README.md`
- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `docs/translation-sync-policy.md`

## 권장 검증

- `rg -n "문서/스킬 저장소|upstream" README.md CONTRIBUTING.md docs/translation-sync-policy.md`
- `git ls-files`
- `git diff --stat`
