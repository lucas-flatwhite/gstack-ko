# gstack-ko Docs-Only Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `gstack-ko`를 문서/스킬 전용 저장소로 전환하고, 공개 sync 원칙 문서와 이에 맞는 저장소 구조를 확정한다.

**Architecture:** 문서와 스킬을 진실 원천으로 유지하고, 실행 코드와 생성 체계는 upstream에만 남긴다. 저장소 루트 문서와 각 `SKILL.md`는 유지하되, 정책 문서로 sync 판단 기준을 고정하고 코드·테스트·템플릿·보조 스크립트는 추적 대상에서 제거한다.

**Tech Stack:** Markdown, git, ripgrep

---

### Task 1: Add Public Sync Policy And Reframe README

**Files:**
- Create: `docs/translation-sync-policy.md`
- Modify: `README.md`

- [ ] **Step 1: Write the policy document**

```markdown
# 번역 싱크 원칙

## 저장소 정체성

- `gstack-ko`는 한국어 문서/스킬 저장소다.
- 실행 코드와 빌드 체계의 진실 원천은 upstream `garrytan/gstack`에 둔다.
- 이 저장소는 독립 배포판이나 기능 포크를 목표로 하지 않는다.

## 유지 대상

- 루트 `SKILL.md`와 각 스킬 디렉터리의 `SKILL.md`
- `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `CLAUDE.md`, `TODOS.md`
- `docs/` 아래 정책 및 운영 문서

## 반입 금지 대상

- 실행 코드와 테스트
- 빌드 설정, lockfile, 바이너리, 설치 스크립트
- `*.tmpl`, 코드 생성 스크립트, fixture

## Upstream Sync 절차

1. upstream 릴리스 또는 주요 변경을 확인한다.
2. 문서와 스킬 변경만 선별한다.
3. 명령어, 옵션, 코드 블록, 경로, 변수명은 번역하지 않는다.
4. README와 CHANGELOG가 현재 범위를 정확히 반영하는지 검토한다.
5. 범위를 벗어나는 파일은 반입하지 않고, 이미 들어와 있다면 제거한다.

## PR 리뷰 기준

- 문서/스킬 품질 향상인가
- 저장소 범위를 넓히지 않는가
- upstream 링크와 설명 경계가 명확한가
- 코드 반입 PR은 원칙적으로 받지 않는다
```

- [ ] **Step 2: Verify the new policy file includes the required guardrails**

Run: `rg -n "문서/스킬 저장소|반입 금지 대상|Upstream Sync 절차|코드 반입 PR은 원칙적으로 받지 않는다" docs/translation-sync-policy.md`
Expected: 4개 이상의 매치가 출력된다.

- [ ] **Step 3: Rewrite the README introduction and repository-positioning sections**

```markdown
## 이 저장소에 대해

**gstack-ko는 gstack의 한국어 문서/스킬 전용 저장소입니다.**

- 한국어 `SKILL.md`와 운영 문서를 제공합니다.
- 실행 기능의 진실 원천은 upstream `gstack`입니다.
- 브라우저/QA/쿠키 import 같은 실행 기능을 실제로 사용하려면 upstream 저장소를 따라야 합니다.

## 포함 범위

- 한국어 스킬 문서
- 한국어 README / CONTRIBUTING / ARCHITECTURE / CHANGELOG
- 번역 및 sync 운영 정책

## 포함하지 않는 범위

- 실행 코드
- 테스트와 fixture
- 바이너리와 빌드/설치 체계
```

- [ ] **Step 4: Remove README claims that imply this repository ships runnable browser tooling**

Run: `rg -n "바이너리|Playwright|browse/src|bun install|bun run build|테스트 실행" README.md`
Expected: 설치 또는 개발 문맥이 아니라면, 이 저장소 자체의 실행/빌드 지침으로 읽히는 문장이 남아 있지 않다.

- [ ] **Step 5: Verify README now points execution-heavy users to upstream**

Run: `rg -n "upstream|원본 저장소|실행 기능" README.md`
Expected: upstream를 가리키는 설명이 여러 군데에서 확인된다.

- [ ] **Step 6: Commit the policy and README changes**

```bash
git add docs/translation-sync-policy.md README.md
git commit -m "docs: define docs-only sync policy"
```

### Task 2: Reframe Contributor And Maintainer Docs For A Docs-Only Repository

**Files:**
- Modify: `CONTRIBUTING.md`
- Modify: `ARCHITECTURE.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`
- Modify: `TODOS.md`
- Delete: `BROWSER.md`

- [ ] **Step 1: Rewrite CONTRIBUTING around translation, documentation, and sync rules**

```markdown
# gstack-ko 기여 가이드

## 환영하는 기여

- 한국어 번역 품질 개선
- 스킬 설명 문구 개선
- README / CONTRIBUTING / ARCHITECTURE / CHANGELOG 보강
- sync 정책 문서 개선

## 받지 않는 기여

- 실행 코드 추가 또는 수정
- 테스트, fixture, 바이너리 반입
- 빌드/설치 시스템 유지보수

## Sync PR 체크리스트

- 문서/스킬만 변경했는가
- upstream 변경 중 설명 텍스트만 한국어로 반영했는가
- 명령어, 옵션, 코드 블록, 경로, 변수명은 원문을 유지했는가
- README와 CHANGELOG를 함께 검토했는가
```

- [ ] **Step 2: Rewrite maintainer-facing docs to match the reduced scope**

```markdown
## ARCHITECTURE.md
- 저장소 아키텍처의 중심을 "문서 구조와 sync 원칙"으로 재작성한다.
- browse 데몬, Playwright, Bun build 파이프라인 설명은 제거한다.

## CLAUDE.md
- `bun install`, `bun test`, `bun run build` 같은 개발 명령을 제거한다.
- "문서/스킬 번역 저장소" 전용 작업 규칙으로 바꾼다.

## TODOS.md
- browse/ship/review 기능 로드맵을 제거한다.
- 번역 운영, sync 체크리스트, 문서 품질 개선 TODO만 남긴다.

## CHANGELOG.md
- 이번 전환을 한국어 저장소의 운영 원칙 변화로 기록한다.
```

- [ ] **Step 3: Delete the browser-implementation document that no longer fits the repository scope**

Run: `git rm BROWSER.md`
Expected: `BROWSER.md`가 삭제 대상으로 staged 된다.

- [ ] **Step 4: Verify no maintainer doc still describes local build and test workflows for bundled browser code**

Run: `rg -n "bun install|bun test|bun run build|browse/src|Playwright|compiled binary" CONTRIBUTING.md ARCHITECTURE.md CLAUDE.md TODOS.md CHANGELOG.md`
Expected: 남아 있는 경우는 upstream 설명 또는 제거 필요 문장뿐이며, 이 저장소의 로컬 개발 워크플로우로 읽히는 내용은 없다.

- [ ] **Step 5: Commit the maintainer-doc updates**

```bash
git add CONTRIBUTING.md ARCHITECTURE.md CLAUDE.md CHANGELOG.md TODOS.md
git commit -m "docs: realign contributor docs for docs-only repo"
```

### Task 3: Remove Out-Of-Scope Files And Verify The Repository Shape

**Files:**
- Delete: `.env.example`
- Delete: `.github/workflows/skill-docs.yml`
- Delete: `browse/`
- Delete: `design-consultation/SKILL.md.tmpl`
- Delete: `document-release/SKILL.md.tmpl`
- Delete: `gstack-upgrade/SKILL.md.tmpl`
- Delete: `plan-ceo-review/SKILL.md.tmpl`
- Delete: `plan-design-review/SKILL.md.tmpl`
- Delete: `plan-eng-review/SKILL.md.tmpl`
- Delete: `qa-design-review/SKILL.md.tmpl`
- Delete: `qa-only/SKILL.md.tmpl`
- Delete: `qa/SKILL.md.tmpl`
- Delete: `qa/references/issue-taxonomy.md`
- Delete: `qa/templates/qa-report-template.md`
- Delete: `retro/SKILL.md.tmpl`
- Delete: `review/SKILL.md.tmpl`
- Delete: `review/TODOS-format.md`
- Delete: `review/checklist.md`
- Delete: `review/greptile-triage.md`
- Delete: `setup-browser-cookies/SKILL.md.tmpl`
- Delete: `ship/SKILL.md.tmpl`
- Delete: `sync-cleanup.sh`
- Modify: `.gitignore`

- [ ] **Step 1: Remove directories and files that belong to code, tests, generation, or fixtures**

```bash
git rm -r browse
git rm .env.example .github/workflows/skill-docs.yml sync-cleanup.sh
git rm design-consultation/SKILL.md.tmpl document-release/SKILL.md.tmpl gstack-upgrade/SKILL.md.tmpl
git rm plan-ceo-review/SKILL.md.tmpl plan-design-review/SKILL.md.tmpl plan-eng-review/SKILL.md.tmpl
git rm qa-design-review/SKILL.md.tmpl qa-only/SKILL.md.tmpl qa/SKILL.md.tmpl
git rm qa/references/issue-taxonomy.md qa/templates/qa-report-template.md
git rm retro/SKILL.md.tmpl review/SKILL.md.tmpl review/TODOS-format.md review/checklist.md review/greptile-triage.md
git rm setup-browser-cookies/SKILL.md.tmpl ship/SKILL.md.tmpl
```

- [ ] **Step 2: Simplify `.gitignore` to match a Markdown-heavy repository**

```gitignore
.gstack/
.claude/skills/
/tmp/
*.log
.env
.env.local
.env.*
```

- [ ] **Step 3: Verify the tracked file list matches the docs-only policy**

Run: `git ls-files | rg "^(browse/|.*\\.tmpl$|\\.env\\.example$|\\.github/workflows/skill-docs\\.yml$|BROWSER\\.md$|sync-cleanup\\.sh$|qa/references/|qa/templates/|review/checklist\\.md$|review/greptile-triage\\.md$|review/TODOS-format\\.md$)"`
Expected: 출력이 없다.

- [ ] **Step 4: Verify the remaining tree is document- and SKILL-centric**

Run: `find . -maxdepth 2 \\( -type f -o -type d \\) | sort | sed -n '1,220p'`
Expected: 루트 문서, `docs/`, 각 스킬 디렉터리의 `SKILL.md`, 최소한의 git 메타데이터만 보인다.

- [ ] **Step 5: Commit the repository cleanup**

```bash
git add .gitignore
git commit -m "refactor: remove out-of-scope code artifacts"
```

### Task 4: Run Final Verification Before PR

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `ARCHITECTURE.md`
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`
- Modify: `TODOS.md`
- Create: `docs/translation-sync-policy.md`

- [ ] **Step 1: Check policy-to-doc consistency**

Run: `rg -n "문서/스킬 저장소|upstream|코드 반입 PR" README.md CONTRIBUTING.md docs/translation-sync-policy.md`
Expected: 세 파일이 같은 방향을 말하고 있다.

- [ ] **Step 2: Review the full diff for accidental scope expansion**

Run: `git diff --stat HEAD~3..HEAD`
Expected: 문서 추가/수정과 삭제만 보이고, 새 실행 코드나 테스트 파일은 없다.

- [ ] **Step 3: Check working tree is clean before PR preparation**

Run: `git status --short`
Expected: 출력이 없다.

- [ ] **Step 4: Prepare the branch for PR**

```bash
git push -u origin codex/docs-only-sync-policy
```
