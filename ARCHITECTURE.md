# 아키텍처

이 문서는 `gstack-ko`의 실행 런타임이 아니라, **문서/스킬 전용 저장소로서의 구조와 운영 원칙**을 설명합니다.

## 핵심 설계

`gstack-ko`의 중심은 코드가 아니라 문서입니다.

- 한국어 `SKILL.md`
- 한국어 운영 문서
- upstream sync 원칙

실행 코드와 테스트는 upstream `garrytan/gstack`에 남기고, 이 저장소는 한국어 설명 계층만 유지합니다. 이렇게 해야 upstream 변경을 지속적으로 따라가면서도 유지보수 범위를 통제할 수 있습니다.

## 저장소 구조

저장소는 크게 두 층으로 나뉩니다.

1. **사용자-facing 문서**
   - `README.md`
   - 루트 `SKILL.md`
   - 각 스킬 디렉터리의 `SKILL.md`

2. **운영/유지보수 문서**
   - `CONTRIBUTING.md`
   - `CHANGELOG.md`
   - `CLAUDE.md`
   - `TODOS.md`
   - `docs/translation-sync-policy.md`
   - `docs/superpowers/` 아래의 spec / plan 문서

## 설계 원칙

### 1. 코드보다 경계가 먼저다

이 저장소에서 가장 중요한 것은 “무엇을 포함하지 않는가”를 분명히 하는 것입니다. 실행 코드, 테스트, 빌드 체계까지 따라가기 시작하면 번역 저장소가 아니라 유지보수 포크가 됩니다.

### 2. 문서는 reference로 유지한다

browse, QA, cookie import, upgrade 같은 스킬은 실행 환경 의존성이 큽니다. 이 저장소는 해당 스킬의 한국어 설명을 유지하지만, 실제 실행은 upstream를 기준으로 합니다.

### 3. sync는 선별 작업이다

upstream sync는 전체 저장소를 복제하는 작업이 아닙니다. 문서와 스킬 설명만 선별해서 가져오는 작업입니다. 새 릴리스가 나와도 “무엇을 반영할지”를 먼저 판단해야 합니다.

### 4. 정책 문서가 README보다 우선한다

README는 사용자 소개 문서이고, 실제 운영 기준은 `docs/translation-sync-policy.md`에 둡니다. 기여자 판단이 흔들릴 때는 정책 문서를 기준으로 합니다.
