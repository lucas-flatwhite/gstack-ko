[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/lucas-flatwhite/gstack-ko)

# gstack-ko

> **`gstack-ko`는 [garrytan/gstack](https://github.com/garrytan/gstack)의 한국어 문서/스킬 전용 저장소입니다.**

원본 저장소: https://github.com/garrytan/gstack  
원작자: [Garry Tan](https://x.com/garrytan)

## 이 저장소가 하는 일

- gstack의 주요 `SKILL.md`를 한국어로 제공합니다.
- README, CONTRIBUTING, ARCHITECTURE, CHANGELOG 같은 운영 문서를 한국어로 제공합니다.
- upstream sync 시 무엇을 반영하고 무엇을 제외할지 공개 규칙으로 관리합니다.

## 이 저장소가 하지 않는 일

- 실행 코드, 테스트, 바이너리를 제공하지 않습니다.
- upstream `gstack`의 독립 포크나 배포판을 목표로 하지 않습니다.
- 브라우저 자동화 런타임, Playwright, build pipeline을 유지하지 않습니다.

브라우저, QA, cookie import, upgrade처럼 실행 환경에 의존하는 기능은 **이 저장소만으로 실행되지 않습니다.** 실제 실행은 upstream `gstack`를 기준으로 해야 합니다.

## 어떤 사람이 보면 좋은가

- gstack의 스킬과 운영 방식을 한국어로 이해하고 싶은 사용자
- upstream 변경을 한국어 문서에 반영하는 기여자
- 한국어 스킬 문구와 워크플로우 설명을 참고하고 싶은 팀

## 포함 범위

| 항목 | gstack-ko | upstream gstack |
|---|---|---|
| 한국어 `SKILL.md` | ✅ | ❌ |
| 한국어 운영 문서 | ✅ | ❌ |
| 실행 코드 | ❌ | ✅ |
| 테스트 / fixture | ❌ | ✅ |
| 빌드 / 설치 체계 | ❌ | ✅ |
| 브라우저 바이너리 | ❌ | ✅ |

## 제공하는 스킬

| 스킬 | 설명 |
|---|---|
| `/plan-ceo-review` | 요청 뒤의 더 큰 제품 문제를 다시 정의합니다. |
| `/plan-eng-review` | 아키텍처, 데이터 흐름, 실패 모드, 테스트 관점을 정리합니다. |
| `/review` | 프로덕션에서 터질 수 있는 리스크를 집요하게 찾습니다. |
| `/ship` | 배포 직전 브랜치 정리와 릴리스 흐름을 돕습니다. |
| `/retro` | 팀과 개인 관점의 회고를 구조화합니다. |
| `/browse` | 브라우저 기반 QA 워크플로우를 설명합니다. 실제 실행은 upstream 의존입니다. |
| `/qa` | 체계적 QA + 수정 워크플로우를 설명합니다. 실제 실행은 upstream 의존입니다. |
| `/qa-only` | 수정 없이 QA 리포트만 작성하는 흐름을 설명합니다. |
| `/setup-browser-cookies` | 브라우저 cookie import 흐름을 설명합니다. 실제 실행은 upstream 의존입니다. |
| `/design-consultation` | 제품 디자인 시스템 설계를 돕습니다. |
| `/plan-design-review` | 디자인 감사 워크플로우를 설명합니다. 실제 실행은 upstream 의존입니다. |
| `/qa-design-review` | 디자인 QA + 수정 워크플로우를 설명합니다. 실제 실행은 upstream 의존입니다. |
| `/document-release` | 배포 후 문서 갱신 흐름을 설명합니다. |
| `/gstack-upgrade` | upstream 설치본을 기준으로 업그레이드 흐름을 설명합니다. |

## 사용하는 법

### 1. gstack를 실제로 실행하고 싶다면

upstream 저장소를 사용하세요.

- upstream: <https://github.com/garrytan/gstack>
- 이 저장소의 한국어 문서는 reference로 사용하세요.

### 2. 한국어 문서와 스킬 설명이 필요하다면

이 저장소를 clone해서 문서와 `SKILL.md`를 읽으면 됩니다.

```bash
git clone https://github.com/lucas-flatwhite/gstack-ko.git
cd gstack-ko
```

### 3. 기여하고 싶다면

먼저 [CONTRIBUTING.md](CONTRIBUTING.md)와 [docs/translation-sync-policy.md](docs/translation-sync-policy.md)를 읽어 주세요. 이 저장소는 문서/스킬 전용 범위를 엄격하게 유지합니다.

## 번역 원칙

- 명령어, 옵션, 코드 블록, 경로, 변수명, 고유 명칭은 번역하지 않습니다.
- 설명 텍스트만 한국어로 유지합니다.
- 실행 동작의 진실 원천은 항상 upstream입니다.

## 관련 문서

- [번역 싱크 원칙](docs/translation-sync-policy.md)
- [기여 가이드](CONTRIBUTING.md)
- [아키텍처](ARCHITECTURE.md)
- [변경 이력](CHANGELOG.md)
