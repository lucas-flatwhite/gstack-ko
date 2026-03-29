[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/lucas-flatwhite/gstack-ko)

# gstack-ko

> **`gstack-ko`는 [garrytan/gstack](https://github.com/garrytan/gstack)의 한국어 문서/스킬 레이어입니다.**

원본 저장소: https://github.com/garrytan/gstack  
원작자: [Garry Tan](https://x.com/garrytan)

## 저장소 정체성

`gstack-ko`는 독립 실행 포크가 아니라, upstream gstack의 스킬 문서와 운영 문서를 한국어로 제공하는 저장소입니다. 한 줄로 말하면 `문서/스킬 저장소`입니다.

- 한국어 `SKILL.md`를 제공합니다.
- 한국어 README / CONTRIBUTING / ARCHITECTURE / CHANGELOG / AGENTS 같은 문서를 제공합니다.
- upstream sync 시 무엇을 가져오고 무엇을 제외할지 공개 규칙으로 관리합니다.

## 이 저장소가 하지 않는 일

- 실행 코드와 테스트를 유지하지 않습니다.
- 바이너리, 빌드 체계, 설치 스크립트를 배포하지 않습니다.
- upstream와 별개의 제품 포크를 목표로 하지 않습니다.

중요한 점은 간단합니다. **이 저장소는 문서 저장소이고, 실제 실행의 진실 원천은 upstream `gstack`입니다.**

## 포함 범위

| 항목 | gstack-ko | upstream gstack |
|---|---|---|
| 한국어 `SKILL.md` | ✅ | ❌ |
| 한국어 운영 문서 | ✅ | ❌ |
| supporting docs / reference docs | ✅ | ✅ |
| 실행 코드 | ❌ | ✅ |
| 테스트 / fixture | ❌ | ✅ |
| 빌드 / 설치 체계 | ❌ | ✅ |
| 바이너리 | ❌ | ✅ |

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
