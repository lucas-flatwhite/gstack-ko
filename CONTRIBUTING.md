# gstack-ko 기여 가이드

`gstack-ko`는 문서/스킬 전용 저장소입니다. 기여는 환영하지만, 범위는 엄격하게 관리합니다. 코드 반입 PR은 원칙적으로 받지 않습니다.

## 먼저 읽을 문서

- [README.md](README.md)
- [docs/translation-sync-policy.md](docs/translation-sync-policy.md)
- [AGENTS.md](AGENTS.md)

## 환영하는 기여

- 한국어 번역 품질 개선
- 오탈자 및 어조 수정
- `SKILL.md` 설명 문구 보강
- README, AGENTS, CONTRIBUTING, CHANGELOG 같은 운영 문서 개선
- upstream 변경을 반영한 문서 sync
- reference 문서의 맥락 보강

## 받지 않는 기여

다음 유형의 PR은 원칙적으로 받지 않습니다.

- 실행 코드 추가 또는 수정
- 테스트, fixture, 바이너리 반입
- 빌드/설치 체계 유지보수
- lockfile, CI workflow, 코드 생성 체계 반입

## 번역 규칙

- 명령어, 옵션, 코드 블록, 경로, 변수명, 고유 명칭은 원문 유지
- 설명 텍스트만 한국어로 번역
- upstream 동작을 설명할 때도 코드 자체를 복제하지 않음

## Sync PR 체크리스트

PR을 열기 전에 아래를 확인하세요.

- 문서와 스킬 설명만 변경했는가
- upstream 변경 중 설명 텍스트만 한국어로 반영했는가
- 범위 밖 자산을 새로 반입하지 않았는가
- README와 정책 문서가 현재 저장소 방향과 모순되지 않는가
- 실행 의존성이 있는 스킬에는 upstream reference 성격이 드러나는가

## 작업 방식

1. upstream 변경을 확인합니다.
2. 문서와 `SKILL.md`만 선별합니다.
3. 포함/제외 대상은 `docs/translation-sync-policy.md` 기준으로 다시 확인합니다.
4. 저장소 정체성에 영향을 주는 변경이면 README, AGENTS, CHANGELOG를 함께 갱신합니다.

## PR 작성 팁

- 제목은 변경 목적이 드러나게 작성합니다.
- 본문에는 어떤 upstream 변경을 반영했는지 짧게 적습니다.
- 코드 반입이 아닌 문서 sync 또는 문서 개선 PR임을 명확히 적습니다.
