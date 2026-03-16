# gstack 기여 가이드

gstack를 더 좋게 만들고 싶어 주셔서 감사합니다. 스킬 프롬프트 오타 수정부터 새 워크플로우 구축까지, 이 문서 하나로 빠르게 시작할 수 있게 정리했습니다.

## 빠른 시작

gstack 스킬은 Claude Code가 `skills/` 디렉터리에서 찾는 Markdown 파일입니다. 일반적으로 전역 설치 경로 `~/.claude/skills/gstack/`를 사용합니다. 하지만 gstack 자체를 개발할 때는 작업 트리의 파일을 Claude Code가 직접 읽게 해야 수정이 즉시 반영됩니다.

이를 위해 dev mode를 사용합니다. 저장소를 로컬 `.claude/skills/`에 심링크해 Claude Code가 체크아웃된 소스를 바로 읽도록 만듭니다.

```bash
git clone <repo> && cd gstack
bun install                    # 의존성 설치
bin/dev-setup                  # dev mode 활성화
```

이후 `SKILL.md`를 수정하고 Claude Code에서 `/review` 같은 스킬을 호출하면 변경이 즉시 반영됩니다. 개발을 마쳤다면:

```bash
bin/dev-teardown               # 비활성화, 전역 설치로 복귀
```

## dev mode 동작 방식

`bin/dev-setup`은 저장소 내부에 `.claude/skills/`(gitignore) 디렉터리를 만들고, 작업 트리를 가리키는 심링크를 채웁니다. Claude Code는 로컬 `skills/`를 먼저 보기 때문에 전역 설치보다 로컬 수정이 우선됩니다.

```
gstack/                          <- 작업 트리
├── .claude/skills/              <- dev-setup이 생성 (gitignored)
│   ├── gstack -> ../../         <- 저장소 루트를 가리키는 심링크
│   ├── review -> gstack/review
│   ├── ship -> gstack/ship
│   └── ...                      <- 스킬별 심링크
├── review/
│   └── SKILL.md                 <- 여기 수정 후 /review로 테스트
├── ship/
│   └── SKILL.md
├── browse/
│   ├── src/                     <- TypeScript 소스
│   └── dist/                    <- 컴파일 바이너리 (gitignored)
└── ...
```

## 일상 개발 루프

```bash
# 1. dev mode 진입
bin/dev-setup

# 2. 스킬 수정
vim review/SKILL.md

# 3. Claude Code에서 테스트 (즉시 반영)
#    > /review

# 4. browse 소스를 수정했다면 바이너리 재빌드
bun run build

# 5. 작업 종료 시 정리
bin/dev-teardown
```

## 테스트 및 평가

### 설정

```bash
# 1. .env.example 복사 후 API 키 입력
cp .env.example .env
# .env 편집 -> ANTHROPIC_API_KEY=sk-ant-...

# 2. 의존성 설치(처음 한 번)
bun install
```

Bun은 `.env`를 자동 로드합니다. Conductor 워크스페이스도 메인 워크트리의 `.env`를 자동 상속합니다(아래 "Conductor 워크스페이스" 참고).

### 테스트 계층

| Tier | 명령어 | 비용 | 검증 내용 |
|------|--------|------|-----------|
| 1 - 정적 | `bun test` | 무료 | 명령 검증, snapshot 플래그, SKILL.md 정합성 |
| 2 - E2E | `bun run test:e2e` | 약 $0.50 | Agent SDK 기반 전체 스킬 실행 |
| 3 - LLM eval | `bun run test:eval` | 약 $0.03 | LLM-as-judge 문서 품질 점수 |

```bash
bun test                     # Tier 1만 (<5초, 매 커밋)
bun run test:eval            # Tier 3 (ANTHROPIC_API_KEY 필요)
bun run test:e2e             # Tier 2 (SKILL_E2E=1 필요, Claude Code 내부 실행 불가)
bun run test:all             # Tier 1 + Tier 2
```

### Tier 1: 정적 검증 (무료)

`bun test`로 자동 실행되며 API 키가 필요 없습니다.

- **Skill parser tests** (`test/skill-parser.test.ts`): SKILL.md의 bash 코드블록에서 `$B` 명령을 추출해 `browse/src/commands.ts` 레지스트리와 대조합니다. 오타, 삭제된 명령, 잘못된 snapshot 플래그를 잡습니다.
- **Skill validation tests** (`test/skill-validation.test.ts`): SKILL.md가 실제 존재하는 명령/플래그만 참조하는지, 설명 품질 기준을 만족하는지 검증합니다.
- **Generator tests** (`test/gen-skill-docs.test.ts`): 템플릿 시스템 검증. 플레이스홀더 해석, 플래그 값 힌트(`-d <N>`), 핵심 명령 확장 설명(`is` 상태 목록, `press` 키 예시) 포함 여부를 확인합니다.

### Tier 2: Agent SDK E2E (약 $0.50/회)

실제 Claude Code 세션을 생성해 `/qa` 또는 `/browse`를 호출하고 도구 결과의 오류를 스캔합니다. 스킬이 끝까지 동작하는지를 가장 현실적으로 확인하는 테스트입니다.

```bash
# 일반 터미널에서만 실행 가능 (Claude Code / Conductor 내부 중첩 실행 불가)
SKILL_E2E=1 bun test test/skill-e2e.test.ts
```

- `SKILL_E2E=1` 환경변수로 게이트(실수로 비용이 드는 실행 방지)
- Claude Code 내부 실행 감지 시 자동 skip(Agent SDK 중첩 불가)
- 실패 시 전체 대화 transcript를 저장해 디버깅 가능
- 테스트 위치: `test/skill-e2e.test.ts`, 러너 로직: `test/helpers/session-runner.ts`

### Tier 3: LLM-as-judge (약 $0.03/회)

Claude Haiku로 생성된 SKILL.md 문서를 3개 축으로 채점합니다.

- **Clarity**: 에이전트가 모호성 없이 지시를 이해할 수 있는가
- **Completeness**: 명령/플래그/사용 패턴이 빠짐없이 문서화됐는가
- **Actionability**: 문서 정보만으로 실제 작업 수행이 가능한가

각 축은 1-5점이며 임계값은 모두 **4점 이상**입니다. 또한 `origin/main`의 수기 기준 문서와 비교하는 회귀 테스트가 있어, 생성 문서가 같거나 더 높은 점수를 받아야 합니다.

```bash
# .env에 ANTHROPIC_API_KEY 필요
bun run test:eval
```

- 비용 효율을 위해 `claude-haiku-4-5` 사용
- 테스트 위치: `test/skill-llm-eval.test.ts`
- Agent SDK가 아니라 Anthropic API를 직접 호출하므로 Claude Code 내부에서도 실행 가능

### CI

GitHub Action(`.github/workflows/skill-docs.yml`)이 모든 push/PR에서 `bun run gen:skill-docs --dry-run`을 실행합니다. 생성 결과가 커밋된 SKILL.md와 다르면 CI를 실패시켜 stale 문서를 머지 전에 차단합니다.

테스트는 browse 바이너리를 직접 대상으로 수행하며 dev mode가 필수는 아닙니다.

## SKILL.md 편집 원칙

SKILL.md 파일은 `.tmpl` 템플릿에서 **생성**됩니다. `.md`를 직접 수정하면 다음 빌드 때 덮어씌워집니다.

```bash
# 1. 템플릿 수정
vim SKILL.md.tmpl              # 또는 browse/SKILL.md.tmpl

# 2. 재생성
bun run gen:skill-docs

# 3. 상태 점검
bun run skill:check

# 워치 모드 (저장 시 자동 재생성)
bun run dev:skill
```

browse 명령 추가는 `browse/src/commands.ts`, snapshot 플래그 추가는 `browse/src/snapshot.ts`의 `SNAPSHOT_FLAGS`에서 수행한 뒤 빌드합니다.

## Conductor 워크스페이스

[Conductor](https://conductor.build)로 여러 Claude Code 세션을 병렬 운영할 때, `conductor.json`이 워크스페이스 생명주기를 자동 연결합니다.

| Hook | 스크립트 | 역할 |
|------|----------|------|
| `setup` | `bin/dev-setup` | 메인 워크트리 `.env` 복사, 의존성 설치, 스킬 심링크 |
| `archive` | `bin/dev-teardown` | 스킬 심링크 제거, `.claude/` 정리 |

Conductor가 새 워크스페이스를 만들면 `bin/dev-setup`이 자동 실행됩니다. `git worktree list`로 메인 워크트리를 감지해 `.env`를 복사하고 dev mode를 구성하므로 수동 설정이 거의 필요 없습니다.

**초기 1회 설정:** 메인 저장소 `.env`에 `ANTHROPIC_API_KEY`를 넣어두면 모든 Conductor 워크스페이스가 자동 상속합니다.

## 알아둘 점

- **SKILL.md는 생성 파일**: `.md`가 아니라 `.tmpl`을 수정하고 `bun run gen:skill-docs`를 실행합니다.
- **browse 소스 변경 시 재빌드 필요**: `browse/src/*.ts`를 건드렸다면 `bun run build`를 실행합니다.
- **dev mode는 전역 설치를 가림**: 프로젝트 로컬 스킬이 `~/.claude/skills/gstack`보다 우선합니다. `bin/dev-teardown`으로 원복합니다.
- **Conductor 워크스페이스는 독립 실행**: 각 워크스페이스는 별도 git worktree이며 `conductor.json`으로 `bin/dev-setup`이 자동 실행됩니다.
- **`.env`는 워크트리 간 전파**: 메인 저장소에 한 번 설정하면 Conductor 워크스페이스가 상속합니다.
- **`.claude/skills/`는 gitignored**: 심링크가 커밋되지 않습니다.

## 다른 저장소에서 브랜치 테스트하기

gstack를 한 워크스페이스에서 개발하면서, 다른 프로젝트에서 해당 브랜치를 실사용 테스트해야 할 때가 있습니다. 설치 방식에 따라 방법이 다릅니다.

### 전역 설치만 있는 경우 (프로젝트에 `.claude/skills/gstack/` 없음)

전역 설치를 테스트 브랜치로 맞춥니다.

```bash
cd ~/.claude/skills/gstack
git fetch origin
git checkout origin/<branch>        # 예: origin/v0.3.2
bun install                         # 의존성이 바뀌었을 수 있으므로 실행
bun run build                       # 바이너리 재빌드
```

다른 프로젝트에서 Claude Code를 열면 `~/.claude/skills/`를 자동 사용합니다. 테스트 후 `main` 복귀:

```bash
cd ~/.claude/skills/gstack
git checkout main && git pull
bun run build
```

### 프로젝트에 vendored 복사본이 있는 경우 (`.claude/skills/gstack/` 커밋)

일부 프로젝트는 gstack를 저장소 내부에 복사(vendored)해 사용합니다(`.git` 없음). 이 경우 프로젝트 로컬 스킬이 전역보다 우선이므로 vendored 복사본도 함께 갱신해야 합니다.

1. **전역 설치를 브랜치로 업데이트**(소스 확보):
   ```bash
   cd ~/.claude/skills/gstack
   git fetch origin
   git checkout origin/<branch>      # 예: origin/v0.3.2
   bun install && bun run build
   ```

2. **다른 프로젝트의 vendored 복사본 교체**:
   ```bash
   cd /path/to/other-project

   # 기존 스킬 심링크 및 vendored 복사본 제거
   for s in browse plan-ceo-review plan-eng-review review ship retro qa setup-browser-cookies; do
     rm -f .claude/skills/$s
   done
   rm -rf .claude/skills/gstack

   # 전역 설치본 복사 (.git 제거해서 vendored 상태 유지)
   cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
   rm -rf .claude/skills/gstack/.git

   # 바이너리 재빌드 + 스킬 심링크 재생성
   cd .claude/skills/gstack && ./setup
   ```

3. **변경 검증**: 해당 프로젝트에서 Claude Code를 열고 스킬을 실행합니다.

`main`으로 되돌릴 때는 1-2단계를 반복하되 `git checkout origin/<branch>` 대신 `git checkout main && git pull`을 사용합니다.

## 변경 배포

스킬 편집이 만족스러우면:

```bash
/ship
```

이 명령은 테스트 실행, diff 검토, 버전 업데이트, PR 생성까지 이어집니다. 전체 흐름은 `ship/SKILL.md`를 참고하세요.
