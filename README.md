[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/lucas-flatwhite/gstack-ko)

# gstack-ko

> **`gstack-ko`는 [garrytan/gstack](https://github.com/garrytan/gstack)의 한국어 문서/스킬 레이어입니다.**

원본 저장소: https://github.com/garrytan/gstack<br>
원작자: [Garry Tan](https://x.com/garrytan)

## 대표 스킬

`gstack-ko`의 첫 가치는 한국어 `SKILL.md`입니다. 아래 스킬들은 이 저장소에서 한국어 reference로 읽을 수 있는 대표 문서들입니다.

표기 기준:

- `upstream 의존`: 실제 실행에는 upstream `gstack` 환경이 필요합니다.
- `reference-only`: 이 저장소는 설명 문서만 제공하며 실행 코드는 포함하지 않습니다.

### 문제 재정의와 설계

| 스킬 | 설명 |
|---|---|
| `/plan-ceo-review` | 요청 뒤에 숨은 더 큰 제품 문제를 다시 정의합니다. |
| `/plan-eng-review` | 아키텍처, 데이터 흐름, 실패 모드, 테스트 관점을 정리합니다. |
| `/design-consultation` | 제품 디자인 시스템 설계를 돕습니다. |
| `/plan-design-review` | 디자인 감사 워크플로우를 설명합니다. `upstream 의존` |
| `/office-hours` | 제품/전략 관점에서 방향을 점검하는 reference 문서를 제공합니다. |
| `/autoplan` | 계획 생성 계열 워크플로우를 설명합니다. `upstream 의존` |

### 리뷰와 QA

| 스킬 | 설명 |
|---|---|
| `/review` | 프로덕션에서 터질 수 있는 리스크를 집요하게 찾습니다. |
| `/qa` | 체계적 QA + 수정 워크플로우를 설명합니다. `reference-only`, `upstream 의존` |
| `/qa-only` | 수정 없이 QA 리포트만 작성하는 흐름을 설명합니다. |
| `/design-review` | 디자인 리뷰 워크플로우를 설명합니다. `upstream 의존` |
| `/qa-design-review` | 디자인 QA + 수정 워크플로우를 설명합니다. `upstream 의존` |
| `/browse` | 브라우저 기반 QA 워크플로우를 설명합니다. `reference-only`, `upstream 의존` |
| `/setup-browser-cookies` | 브라우저 cookie import 흐름을 설명합니다. `reference-only`, `upstream 의존` |

### 운영과 릴리스

| 스킬 | 설명 |
|---|---|
| `/ship` | 배포 직전 브랜치 정리와 릴리스 흐름을 돕습니다. |
| `/document-release` | 배포 후 문서 갱신 흐름을 설명합니다. |
| `/land-and-deploy` | 배포 절차를 설명합니다. `upstream 의존` |
| `/canary` | canary 배포 워크플로우를 설명합니다. `upstream 의존` |
| `/benchmark` | 성능/비교 측정 워크플로우를 설명합니다. `upstream 의존` |
| `/gstack-upgrade` | upstream 설치본을 기준으로 업그레이드 흐름을 설명합니다. `upstream 의존` |
| `/retro` | 팀과 개인 관점의 회고를 구조화합니다. |

### 유틸리티와 안전

| 스킬 | 설명 |
|---|---|
| `/codex` | Codex 환경에서의 작업 가이드를 제공합니다. |
| `/cso` | 보안 검토 계열 문서를 제공합니다. |
| `/careful` | 신중한 실행 모드의 reference 문서를 제공합니다. |
| `/freeze` | 변경 동결 워크플로우를 설명합니다. |
| `/guard` | 가드레일 중심 워크플로우를 설명합니다. |
| `/unfreeze` | 동결 해제 워크플로우를 설명합니다. |

## 저장소 정체성

`gstack-ko`는 독립 실행 포크가 아니라, upstream gstack의 스킬 문서와 운영 문서를 한국어로 제공하는 저장소입니다. 한 줄로 말하면 `문서/스킬 저장소`입니다.

- 한국어 `SKILL.md`를 제공합니다.
- 한국어 README / CONTRIBUTING / ARCHITECTURE / CHANGELOG / AGENTS 같은 문서를 제공합니다.
- upstream sync 시 무엇을 가져오고 무엇을 제외할지 공개 규칙으로 관리합니다.

핵심 스킬 문서는 이 저장소 안에서 그대로 `SKILL.md`로 유지합니다. `SKILL.ko.md` 같은 병행 파일은 운영하지 않습니다. 이 저장소 자체가 한국어 reference layer이기 때문입니다.

## 이 저장소가 하지 않는 일

- 실행 코드와 테스트를 유지하지 않습니다.
- 바이너리, 빌드 체계, 설치 스크립트를 배포하지 않습니다.
- upstream와 별개의 제품 포크를 목표로 하지 않습니다.

중요한 점은 간단합니다. **이 저장소는 문서 저장소이고, 실제 실행의 진실 원천은 upstream `gstack`입니다.**

브라우저, QA, cookie import, upgrade처럼 실행 환경에 의존하는 기능은 **이 저장소만으로 실행되지 않습니다.** 실제 실행은 upstream `gstack`를 기준으로 해야 합니다.

## 포함 범위

| 항목 | gstack-ko | upstream gstack |
|---|---|---|
| 한국어 `SKILL.md` | ✅ | ❌ |
| 한국어 운영 문서 | ✅ | ❌ |
| supporting docs / reference docs | ✅ | ✅ |
| 정책 및 sync 문서 | ✅ | ❌ |
| 실행 코드 | ❌ | ✅ |
| 테스트 / fixture | ❌ | ✅ |
| 빌드 / 설치 체계 | ❌ | ✅ |
| 바이너리 | ❌ | ✅ |

## 어떤 사람이 보면 좋은가

- gstack의 스킬과 운영 방식을 한국어로 이해하고 싶은 사용자
- upstream 변경을 한국어 문서에 반영하는 기여자
- 한국어 스킬 문구와 워크플로우 설명을 참고하고 싶은 팀

## 제공하는 것

현재 저장소에는 planning, review, QA, design, deploy, safety, utility 계열을 포함한 gstack 스킬 문서가 한국어로 정리되어 있습니다. 대표적으로 다음 범주를 다룹니다.

- 제품/전략: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/autoplan`
- 리뷰/QA: `/review`, `/qa`, `/qa-only`, `/design-review`, `/browse`
- 배포/운영: `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/document-release`
- 유틸리티/안전: `/codex`, `/cso`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`

각 스킬은 한국어 설명을 제공하지만, 실행 의존성이 있는 스킬은 upstream 설치본을 기준으로 사용해야 합니다.

## 실제로 실행하려면

실행은 upstream 저장소를 기준으로 하세요.

- upstream: <https://github.com/garrytan/gstack>
- 이 저장소의 문서는 한국어 reference로 사용하세요.

특히 `/browse`, `/qa`, `/design-review`, `/setup-browser-cookies`, `/land-and-deploy`, `/setup-deploy`, `/canary`, `/benchmark`, `/gstack-upgrade` 같은 스킬은 이 저장소만으로는 동작하지 않습니다.

## 기여하려면

먼저 아래 문서를 읽어 주세요.

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/translation-sync-policy.md](docs/translation-sync-policy.md)
- [AGENTS.md](AGENTS.md)

이 저장소는 문서/스킬 전용 범위를 엄격하게 유지합니다. 코드, 테스트, 빌드 자산을 다시 들여오는 방향의 PR은 받지 않습니다.

## 번역 원칙

- 명령어, 옵션, 코드 블록, 경로, 변수명, 고유 명칭은 번역하지 않습니다.
- 설명 텍스트만 한국어로 유지합니다.
- upstream 동작은 설명하되, 코드 자체를 복제하지 않습니다.

## 관련 문서

- [번역 싱크 원칙](docs/translation-sync-policy.md)
- [기여 가이드](CONTRIBUTING.md)
- [에이전트 안내](AGENTS.md)
- [아키텍처 레퍼런스](ARCHITECTURE.md)
- [브라우저 레퍼런스](BROWSER.md)
- [빌더 철학](ETHOS.md)
- [변경 이력](CHANGELOG.md)
