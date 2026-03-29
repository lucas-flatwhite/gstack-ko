# README Skill-First Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `main` 기준 새 브랜치에서 `gstack-ko`를 문서/스킬 전용 저장소 방향으로 정리하고, README를 스킬 중심의 혼합형 구조로 재구성한다.

**Architecture:** 먼저 기존 `docs-only` 전환 결과를 새 브랜치에 반영해 저장소 정체성과 파일 범위를 맞춘다. 그 다음 README를 상단 스킬 중심 구조로 다시 쓰고, 정책 문서와 supporting docs가 같은 메시지를 말하는지 점검한다.

**Tech Stack:** Markdown, git, ripgrep

---

### Task 1: Bring Docs-Only Baseline Onto The New Branch

**Files:**
- Modify: repository tree via cherry-pick
- Verify: `README.md`, `docs/translation-sync-policy.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `CLAUDE.md`, `TODOS.md`

- [ ] **Step 1: Check the docs-only commit history to reuse the existing refactor**

Run: `git log --oneline codex/docs-only-sync-policy -n 4`
Expected: docs-only transition commits are listed and reusable from the new branch.

- [ ] **Step 2: Cherry-pick the main docs-only refactor commit**

Run: `git cherry-pick 40e1a0e`
Expected: the commit applies cleanly or reports conflicts that can be resolved inline.

- [ ] **Step 3: Verify the docs-only baseline files now exist**

Run: `rg --files README.md CONTRIBUTING.md ARCHITECTURE.md CHANGELOG.md CLAUDE.md TODOS.md docs/translation-sync-policy.md`
Expected: all target docs are present in the new branch.

### Task 2: Rewrite README Into A Skill-First Hybrid Structure

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the current product-pitch README with a repository-positioning README**

Edit `README.md` so the top flow is:

```markdown
# gstack-ko

> `gstack-ko`는 `garrytan/gstack`의 한국어 문서/스킬 전용 저장소입니다.

## 대표 스킬
- 카테고리형으로 대표 스킬을 소개한다.
- 실행 의존 스킬은 `reference-only` 또는 `upstream 의존` 표기를 붙인다.

## 이 저장소는 무엇인가
- 한국어 `SKILL.md`
- 한국어 운영 문서
- sync 정책 문서

## 이 저장소는 무엇이 아닌가
- 실행 코드 저장소가 아님
- 테스트/바이너리/빌드 체계 포함 안 함
- 실제 실행은 upstream 기준
```

- [ ] **Step 2: Keep the skill list prominent without looking like an installer or runnable distribution**

Run: `rg -n "대표 스킬|reference-only|upstream 의존|실행 코드" README.md`
Expected: README 상단에 스킬 가치와 저장소 경계가 모두 보인다.

- [ ] **Step 3: Remove install language that implies this repository ships runnable tooling**

Run: `rg -n "git clone|심볼릭 링크|Playwright 바이너리|설치" README.md`
Expected: 실행 설치 안내 대신 reference 사용 안내만 남아 있거나, 저장소 정체성과 충돌하는 문장은 제거된다.

### Task 3: Verify Policy Consistency And Commit

**Files:**
- Modify: `README.md`
- Verify: `docs/translation-sync-policy.md`, `CONTRIBUTING.md`

- [ ] **Step 1: Check README wording against the policy**

Run: `rg -n "문서/스킬 전용 저장소|SKILL.md|upstream|실행 코드" README.md docs/translation-sync-policy.md CONTRIBUTING.md`
Expected: README와 정책 문서가 같은 경계를 설명한다.

- [ ] **Step 2: Review the final diff**

Run: `git diff -- README.md docs/translation-sync-policy.md CONTRIBUTING.md ARCHITECTURE.md CHANGELOG.md CLAUDE.md TODOS.md`
Expected: diff shows docs-only positioning plus the new skill-first README structure.

- [ ] **Step 3: Commit the branch changes**

```bash
git add README.md CONTRIBUTING.md ARCHITECTURE.md CHANGELOG.md CLAUDE.md TODOS.md docs/translation-sync-policy.md
git commit -m "docs: reframe repo as Korean skill reference"
```
