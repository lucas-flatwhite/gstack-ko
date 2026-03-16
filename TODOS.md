# TODOS

## 자동 업그레이드 모드 (무프롬프트)

**What:** 새 버전 감지 시 AskUserQuestion 프롬프트를 건너뛰고 자동 업그레이드하도록 `GSTACK_AUTO_UPGRADE=1` 환경변수 또는 `~/.gstack/config` 옵션을 추가합니다.

**Why:** 파워 유저와 CI 환경은 매번 묻지 않고 마찰 없는 업그레이드를 원할 수 있습니다.

**Context:** 현재 업그레이드 시스템(v0.3.4)은 항상 AskUserQuestion으로 확인을 받습니다. 이 TODO는 옵트인 우회 경로를 추가합니다. 구현은 preamble 지침에 약 10줄 수준: AskUserQuestion 호출 전에 env var/config를 확인하고, 설정되어 있으면 바로 업그레이드 플로우로 진입합니다. 다만 업그레이드 시스템이 안정화된 뒤 적용해야 하므로, 먼저 프롬프트 기반 플로우에 대한 사용자 피드백을 확인합니다.

**Effort:** S (small)
**Priority:** P3 (있으면 좋음, 도입 데이터 확인 후 재검토)

## 남은 스킬을 .tmpl로 전환

**What:** ship/, review/, plan-ceo-review/, plan-eng-review/, retro/ 의 SKILL.md를 `{{UPDATE_CHECK}}` 플레이스홀더 기반 `.tmpl` 템플릿으로 전환합니다.

**Why:** 이 5개 스킬은 아직 업데이트 체크 preamble이 복붙 상태입니다. preamble이 바뀔 때(v0.3.5의 `|| true` 수정처럼) 5개를 수동으로 모두 고쳐야 합니다. `{{UPDATE_CHECK}}` 리졸버는 이미 `scripts/gen-skill-docs.ts`에 있으므로, 남은 스킬만 전환하면 됩니다.

**Context:** browse 계열 스킬(SKILL.md, browse/, qa/, setup-browser-cookies/)은 v0.3.5에서 .tmpl 전환을 마쳤습니다. 남은 5개는 `{{UPDATE_CHECK}}`만 사용하므로(`{{BROWSE_SETUP}}` 불필요) 전환은 기계적입니다: preamble을 `{{UPDATE_CHECK}}`로 치환하고, `scripts/gen-skill-docs.ts`의 `findTemplates()`에 경로를 추가한 뒤 .tmpl + 생성 .md를 함께 커밋합니다.

**Depends on:** 먼저 v0.3.5 배포 완료 (`{{UPDATE_CHECK}}` 리졸버)
**Effort:** S (small, 약 20분)
**Priority:** P2 (다음 preamble 변경 시 드리프트 방지)
