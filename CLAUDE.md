# gstack 개발

## 명령어

```bash
bun install          # 의존성 설치
bun test             # 테스트 실행 (browse + snapshot + skill validation)
bun run test:eval    # LLM-as-judge 평가 실행 (ANTHROPIC_API_KEY 필요)
bun run test:e2e     # E2E 스킬 테스트 실행 (SKILL_E2E=1 필요, 실행당 약 $0.50)
bun run dev <cmd>    # 개발 모드 CLI 실행 (예: bun run dev goto https://example.com)
bun run build        # 문서 생성 + 바이너리 컴파일
bun run gen:skill-docs  # 템플릿에서 SKILL.md 재생성
bun run skill:check  # 모든 스킬 헬스 대시보드
bun run dev:skill    # 변경 감지 자동 재생성 + 검증 워치 모드
```

## 프로젝트 구조

```
gstack/
├── browse/          # 헤드리스 브라우저 CLI (Playwright)
│   ├── src/         # CLI + 서버 + 명령어
│   │   ├── commands.ts  # 명령 레지스트리 (single source of truth)
│   │   └── snapshot.ts  # SNAPSHOT_FLAGS 메타데이터 배열
│   ├── test/        # 통합 테스트 + 픽스처
│   └── dist/        # 컴파일된 바이너리
├── scripts/         # 빌드 + DX 도구
│   ├── gen-skill-docs.ts  # 템플릿 -> SKILL.md 생성기
│   ├── skill-check.ts     # 헬스 대시보드
│   └── dev-skill.ts       # 워치 모드
├── test/            # 스킬 검증 + eval 테스트
│   ├── helpers/     # skill-parser.ts, session-runner.ts
│   ├── skill-validation.test.ts  # Tier 1: 정적 명령 검증
│   ├── gen-skill-docs.test.ts    # Tier 1: 생성기 + 품질 eval
│   ├── skill-e2e.test.ts         # Tier 2: Agent SDK E2E
│   └── skill-llm-eval.test.ts   # Tier 3: LLM-as-judge
├── ship/            # Ship 워크플로우 스킬
├── review/          # PR 리뷰 스킬
├── plan-ceo-review/ # /plan-ceo-review 스킬
├── plan-eng-review/ # /plan-eng-review 스킬
├── retro/           # 회고 스킬
├── setup            # 1회성 설정: 바이너리 빌드 + 스킬 심링크
├── SKILL.md         # SKILL.md.tmpl에서 생성됨 (직접 수정 금지)
├── SKILL.md.tmpl    # 템플릿: 여기 수정 후 gen:skill-docs 실행
└── package.json     # browse 빌드 스크립트
```

## SKILL.md 워크플로우

SKILL.md 파일은 `.tmpl` 템플릿에서 **생성**됩니다. 문서를 수정하려면:

1. `.tmpl` 파일을 수정합니다 (예: `SKILL.md.tmpl`, `browse/SKILL.md.tmpl`)
2. `bun run gen:skill-docs`를 실행합니다 (`bun run build` 시 자동 포함)
3. `.tmpl`과 생성된 `.md`를 함께 커밋합니다

새 browse 명령을 추가하려면 `browse/src/commands.ts`에 추가하고 다시 빌드합니다.
새 snapshot 플래그를 추가하려면 `browse/src/snapshot.ts`의 `SNAPSHOT_FLAGS`에 추가하고 다시 빌드합니다.

## 브라우저 상호작용

브라우저 상호작용(QA, 도그푸딩, 쿠키 설정)이 필요하면 `/browse` 스킬 또는 `$B <command>` 바이너리를 사용합니다.
`mcp__claude-in-chrome__*` 도구는 느리고 불안정하며 이 프로젝트 표준이 아니므로 사용하지 않습니다.

## 활성 스킬 배포

활성 스킬은 `~/.claude/skills/gstack/`에 있습니다. 변경 후:

1. 브랜치를 푸시합니다
2. 스킬 디렉터리에서 fetch + reset: `cd ~/.claude/skills/gstack && git fetch origin && git reset --hard origin/main`
3. 재빌드: `cd ~/.claude/skills/gstack && bun run build`

또는 바이너리만 직접 복사: `cp browse/dist/browse ~/.claude/skills/gstack/browse/dist/browse`
