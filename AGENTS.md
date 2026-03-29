# gstack-ko 에이전트 안내

`gstack-ko`는 upstream `gstack`의 한국어 문서/스킬 레이어입니다. 이 저장소에서 에이전트가 기본적으로 따라야 할 원칙은 아래와 같습니다.

## 우선 원칙

- 이 저장소는 문서/스킬 전용 저장소다.
- 실행 코드, 테스트, 바이너리, 빌드 체계는 upstream `garrytan/gstack`의 책임이다.
- 한국어 `SKILL.md`와 supporting docs를 유지하는 것이 1차 목적이다.

## 수정해도 되는 것

- 루트 문서
- 각 스킬 디렉터리의 `SKILL.md`
- supporting reference docs
- 정책 문서와 sync 운영 문서

## 수정하면 안 되는 것

- 실행 코드 반입
- 테스트나 fixture 반입
- build / install / CI 자산 반입

## 번역 규칙

- 명령어, 옵션, 코드 블록, 경로, 변수명, 고유 명칭은 번역하지 않는다.
- 설명 텍스트만 한국어로 유지한다.
- 실행 동작은 upstream를 기준으로 설명한다.

## 작업 전 확인 문서

- `README.md`
- `CONTRIBUTING.md`
- `docs/translation-sync-policy.md`
