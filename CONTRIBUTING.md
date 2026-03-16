# gstack 기여 가이드

gstack를 더 좋게 만들고 싶어 해주셔서 감사합니다. 스킬 프롬프트 오타 수정부터 완전히 새로운 워크플로우 구축까지, 이 문서로 빠르게 개발을 시작할 수 있습니다.

## 빠른 시작

gstack 스킬은 Claude Code가 `skills/` 디렉토리에서 발견하는 Markdown 파일입니다. 보통은 `~/.claude/skills/gstack/`(글로벌 설치)에 위치합니다. 하지만 gstack 자체를 개발할 때는 작업 트리의 스킬을 Claude Code가 바로 읽어야 복사/배포 없이 수정 사항이 즉시 반영됩니다.

이 역할을 dev mode가 수행합니다. 저장소를 로컬 `.claude/skills/`에 심링크해 Claude Code가 체크아웃된 소스를 직접 읽도록 만듭니다.

```bash
git clone <repo> && cd gstack
bun install                    # 의존성 설치
bin/dev-setup                  # dev mode 활성화
```

이제 `SKILL.md`를 수정하고 Claude Code에서 스킬(예: `/review`)을 호출하면 변경이 바로 반영됩니다. 개발을 마치면:

```bash
bin/dev-teardown               # 비활성화 — 글로벌 설치로 복귀
```

## dev mode 동작 방식

`bin/dev-setup`은 저장소 내부(깃 무시됨)에 `.claude/skills/` 디렉토리를 만들고, 작업 트리를 가리키는 심링크를 채웁니다. Claude Code는 로컬 `skills/`를 먼저 보기 때문에 글로벌 설치보다 현재 수정본이 우선됩니다.

```
gstack/                          <- 작업 트리
├── .claude/skills/              <- dev-setup이 생성 (gitignored)
│   ├── gstack -> ../../         <- 저장소 루트로 되돌아가는 심링크
│   ├── review -> gstack/review
│   ├── ship -> gstack/ship
│   └── ...                      <- 스킬당 하나씩 심링크
├── review/
│   └── SKILL.md                 <- 여기 수정 후 /review로 테스트
├── ship/
│   └── SKILL.md
├── browse/
│   ├── src/                     <- TypeScript 소스
│   └── dist/                    <- 컴파일된 바이너리 (gitignored)
└── ...
```

## 일상 워크플로우

```bash
# 1. dev mode 진입
bin/dev-setup

# 2. 스킬 수정
vim review/SKILL.md

# 3. Claude Code에서 테스트 — 변경 즉시 반영
#    > /review

# 4. browse 소스를 수정했다면 바이너리 재빌드
bun run build

# 5. 작업 종료 시 정리
bin/dev-teardown
```

## 테스트 및 eval

### 설정

```bash
# 1. .env.example 복사 후 API 키 설정
cp .env.example .env
# .env 편집 → ANTHROPIC_API_KEY=sk-ant-...

# 2. 의존성 설치(미설치 시)
bun install
```

Bun은 `.env`를 자동 로드하므로 추가 설정이 필요 없습니다. Conductor 워크스페이스도 메인 워크트리의 `.env`를 자동 상속합니다(아래 "Conductor 워크스페이스" 참조).

### 테스트 티어

| Tier | Command | Cost | 테스트 대상 |
|------|---------|------|-------------|
| 1 — Static | `bun test` | 무료 | 커맨드 검증, snapshot 플래그, SKILL.md 정합성 |
| 2 — E2E | `bun run test:e2e` | 약 $0.50 | Agent SDK 기반 스킬 전체 실행 |
| 3 — LLM eval | `bun run test:eval` | 약 $0.03 | LLM-as-judge 문서 품질 평가 |

```bash
bun test                     # Tier 1 전용 (커밋마다 실행, <5초)
bun run test:eval            # Tier 3: LLM-as-judge (.env의 ANTHROPIC_API_KEY 필요)
bun run test:e2e             # Tier 2: E2E (SKILL_E2E=1 필요, Claude Code 내부 실행 불가)
bun run test:all             # Tier 1 + Tier 2
```

### Tier 1: 정적 검증(무료)

`bun test`로 자동 실행됩니다. API 키가 필요 없습니다.

- **스킬 파서 테스트** (`test/skill-parser.test.ts`)  
  SKILL.md bash 코드 블록에서 모든 `$B` 커맨드를 추출해 `browse/src/commands.ts` 레지스트리와 대조합니다. 오타, 제거된 커맨드, 잘못된 snapshot 플래그를 잡아냅니다.
- **스킬 검증 테스트** (`test/skill-validation.test.ts`)  
  SKILL.md가 실제 존재하는 커맨드/플래그만 참조하는지, 설명 품질 기준을 만족하는지 검증합니다.
- **생성기 테스트** (`test/gen-skill-docs.test.ts`)  
  템플릿 시스템을 검증합니다. 플레이스홀더 해석, 플래그 값 힌트 포함 여부(예: `-d`가 아니라 `-d <N>`), 핵심 커맨드 설명 보강(`is`의 유효 상태, `press`의 키 예시)을 확인합니다.

### Tier 2: Agent SDK E2E (약 $0.50/회)

실제 Claude Code 세션을 띄워 `/qa` 또는 `/browse`를 실행하고 tool 결과에서 오류를 탐지합니다. "정말 end-to-end로 동작하는가"에 가장 가까운 테스트입니다.

```bash
# 일반 터미널에서 실행해야 함 — Claude Code/Conductor 내부 중첩 실행 불가
SKILL_E2E=1 bun test test/skill-e2e.test.ts
```

- `SKILL_E2E=1` 환경변수로 게이트(고비용 실행 실수 방지)
- Claude Code 내부 실행이 감지되면 자동 skip(Agent SDK 중첩 불가)
- 실패 시 디버깅용 전체 대화 로그 저장
- 테스트: `test/skill-e2e.test.ts`, 러너 로직: `test/helpers/session-runner.ts`

### Tier 3: LLM-as-judge (약 $0.03/회)

생성된 SKILL.md 문서를 Claude Haiku로 3가지 관점에서 평가합니다:

- **Clarity** — 모호함 없이 지침을 이해할 수 있는가
- **Completeness** — 커맨드/플래그/사용 패턴이 충분히 문서화됐는가
- **Actionability** — 문서 정보만으로 작업 수행이 가능한가

각 항목 1-5점, 통과 기준은 **모든 항목 4점 이상**입니다. 또한 `origin/main`의 수기 기준 문서와 비교해 생성 문서 점수가 같거나 더 높아야 하는 회귀 테스트도 포함됩니다.

```bash
# .env에 ANTHROPIC_API_KEY 필요
bun run test:eval
```

- 비용 효율을 위해 `claude-haiku-4-5` 사용
- 테스트 위치: `test/skill-llm-eval.test.ts`
- Agent SDK가 아닌 Anthropic API 직접 호출이므로 Claude Code 내부 포함 어디서나 실행 가능

### CI

GitHub Action(`.github/workflows/skill-docs.yml`)이 모든 push/PR에서 `bun run gen:skill-docs --dry-run`을 실행합니다. 생성된 SKILL.md가 커밋본과 다르면 CI가 실패합니다. 병합 전에 문서 드리프트를 차단합니다.

테스트는 browse 바이너리를 직접 대상으로 하므로 dev mode가 필수는 아닙니다.

## SKILL.md 편집

SKILL.md는 `.tmpl` 템플릿에서 **생성**됩니다. `.md`를 직접 수정하면 다음 빌드에서 덮어써집니다.

```bash
# 1. 템플릿 수정
vim SKILL.md.tmpl              # 또는 browse/SKILL.md.tmpl

# 2. 재생성
bun run gen:skill-docs

# 3. 헬스 확인
bun run skill:check

# 또는 watch 모드 사용 — 저장 시 자동 재생성
bun run dev:skill
```

browse 커맨드를 추가하려면 `browse/src/commands.ts`를 수정하세요. snapshot 플래그를 추가하려면 `browse/src/snapshot.ts`의 `SNAPSHOT_FLAGS`를 수정한 뒤 재빌드합니다.

## Conductor 워크스페이스

[Conductor](https://conductor.build)로 여러 Claude Code 세션을 병렬 실행할 때, `conductor.json`이 워크스페이스 라이프사이클을 자동 연결합니다.

| Hook | Script | 역할 |
|------|--------|------|
| `setup` | `bin/dev-setup` | 메인 워크트리의 `.env` 복사, deps 설치, 스킬 심링크 구성 |
| `archive` | `bin/dev-teardown` | 스킬 심링크 제거, `.claude/` 디렉토리 정리 |

Conductor가 새 워크스페이스를 만들면 `bin/dev-setup`이 자동 실행됩니다. `git worktree list`로 메인 워크트리를 감지해 `.env`를 복사하고 dev mode를 구성합니다.

**첫 설정:** 메인 저장소의 `.env`에 `ANTHROPIC_API_KEY`를 넣어두면(`.env.example` 참고), 모든 Conductor 워크스페이스가 자동 상속합니다.

## 알아두면 좋은 점

- **SKILL.md는 생성 파일입니다.** `.md`가 아니라 `.tmpl`을 수정하고 `bun run gen:skill-docs`를 실행하세요.
- **browse 소스 변경 시 재빌드 필요.** `browse/src/*.ts`를 수정했다면 `bun run build`를 실행하세요.
- **dev mode는 글로벌 설치를 가립니다.** 프로젝트 로컬 스킬이 `~/.claude/skills/gstack`보다 우선합니다. `bin/dev-teardown`으로 복구됩니다.
- **Conductor 워크스페이스는 독립적입니다.** 각 워크스페이스는 별도 git worktree이며 `bin/dev-setup`이 자동 실행됩니다.
- **`.env`는 worktree 간 전파됩니다.** 메인 저장소에서 1회 설정하면 모든 Conductor 워크스페이스가 상속합니다.
- **`.claude/skills/`는 gitignored입니다.** 심링크는 커밋되지 않습니다.

## 다른 저장소에서 브랜치 테스트하기

gstack를 한 워크스페이스에서 개발하면서 다른 프로젝트(예: 실제 앱)에서 브랜치를 검증하려면, 해당 프로젝트의 gstack 설치 방식에 따라 절차가 달라집니다.

### 글로벌 설치만 있는 경우 (프로젝트에 `.claude/skills/gstack/` 없음)

글로벌 설치를 대상 브랜치로 전환합니다.

```bash
cd ~/.claude/skills/gstack
git fetch origin
git checkout origin/<branch>        # 예: origin/v0.3.2
bun install                         # deps 변경 가능성 반영
bun run build                       # 바이너리 재빌드
```

이제 다른 프로젝트에서 Claude Code를 열면 `~/.claude/skills/`의 스킬을 자동 사용합니다. 끝나면 main으로 복귀:

```bash
cd ~/.claude/skills/gstack
git checkout main && git pull
bun run build
```

### 프로젝트에 vendored 복사본이 있는 경우 (`.claude/skills/gstack/`가 체크인된 형태)

일부 프로젝트는 gstack를 저장소 내부에 복사해 사용합니다(복사본 내부 `.git` 없음). 로컬 스킬이 글로벌보다 우선하므로 vendored 복사본도 같이 교체해야 합니다.

1. **글로벌 설치를 대상 브랜치로 전환**(소스 확보):
   ```bash
   cd ~/.claude/skills/gstack
   git fetch origin
   git checkout origin/<branch>      # 예: origin/v0.3.2
   bun install && bun run build
   ```

2. **다른 프로젝트의 vendored 복사본 교체:**
   ```bash
   cd /path/to/other-project

   # 기존 스킬 심링크 및 vendored 복사본 제거
   for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do
     rm -f .claude/skills/$s
   done
   rm -rf .claude/skills/gstack

   # 글로벌 설치에서 복사(.git 제거로 vendored 상태 유지)
   cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
   rm -rf .claude/skills/gstack/.git

   # 바이너리 재빌드 + 스킬 심링크 재생성
   cd .claude/skills/gstack && ./setup
   ```

3. **변경 테스트:** 해당 프로젝트에서 Claude Code를 열고 스킬을 실행합니다.

main으로 되돌릴 때는 1-2단계를 `git checkout main && git pull` 기준으로 반복하면 됩니다(`git checkout origin/<branch>` 대신).

## 변경사항 릴리스

스킬 수정이 만족스러우면:

```bash
/ship
```

이 워크플로우는 테스트 실행, diff 리뷰, 버전 업데이트, PR 생성을 자동으로 진행합니다. 자세한 내용은 `ship/SKILL.md`를 참조하세요.
