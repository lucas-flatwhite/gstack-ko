# gstack-ko: Claude Code 워크플로우 스킬 (한국어)

> **이 저장소는 [garrytan/gstack](https://github.com/garrytan/gstack)의 한국어 번역본입니다.**
> 원본 저장소: https://github.com/garrytan/gstack
> 원작자: Garry Tan (Y Combinator 대표 겸 CEO)

---

**gstack**은 Claude Code를 위한 8개의 특화된 워크플로우 스킬 시스템으로, AI를 범용 어시스턴트에서 역할별 전문가 팀으로 전환합니다. 슬래시 커맨드를 통해 활성화되는 각기 다른 인지 모드를 제공합니다.

## 핵심 스킬

- **`/plan-ceo-review`** — "창업자 모드": 올바른 것을 만들고 있는지 재검토하고, "요청 안에 숨어있는 10점짜리 제품"을 발굴
- **`/plan-eng-review`** — 엔지니어링 리더십 모드: 아키텍처, 데이터 흐름, 다이어그램, 엣지 케이스에 집중
- **`/review`** — "집착형 스태프 엔지니어 모드": CI를 통과하는 프로덕션 장애 버그 포착
- **`/ship`** — 릴리스 자동화: main 동기화, 테스트 실행, 푸시, PR 생성
- **`/browse`** — QA 자동화: 지속적인 Chromium 브라우저로 Claude에게 실행 중인 앱에 대한 시각적 접근 제공
- **`/qa`** — 체계적인 QA 테스트: 건강 점수, 스크린샷, 회귀 추적 포함 (full/quick/regression 모드)
- **`/setup-browser-cookies`** — 세션 관리: 인증된 테스트를 위해 브라우저 쿠키 가져오기
- **`/retro`** — 팀 인식형 엔지니어링 회고: 메트릭과 개인별 피드백 포함

## 핵심 철학

"하나의 흐릿한 범용 모드"를 거부합니다. 대신 창업자의 취향, 엔지니어링 엄밀성, 집착형 리뷰, 빠른 실행이라는 서로 다른 인지 프레임워크를 명시적으로 선택할 수 있습니다. 이는 서로 다른 역할이 서로 다른 사고 패턴을 갖는 실제 팀 구조를 반영합니다.

## 기술 요구사항

- Claude Code
- Git
- Bun v1.0+
- `/browse`는 macOS와 Linux (x64/arm64)용 네이티브 바이너리를 컴파일합니다

## 설치

```bash
# 글로벌 설치
git clone https://github.com/lucas-flatwhite/gstack-ko ~/.claude/skills/gstack
cd ~/.claude/skills/gstack
./setup

# 프로젝트 설치 (팀 공유용)
git clone https://github.com/lucas-flatwhite/gstack-ko .claude/skills/gstack
cd .claude/skills/gstack
./setup
```

## 통합

단독으로 또는 **Conductor** (conductor.build)와 함께 사용하여 병렬 멀티 세션 워크플로우를 구성할 수 있습니다. 한 사람이 각각 격리된 작업공간과 별도 브라우저 인스턴스를 가진 10개의 Claude Code 에이전트를 동시에 실행할 수 있습니다.

스킬은 `~/.claude/skills/gstack/`에 심볼릭 링크로 설치되며, 선택적으로 프로젝트 저장소의 `.claude/skills/gstack/`를 통해 팀과 공유할 수 있습니다.
