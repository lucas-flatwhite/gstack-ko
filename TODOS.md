# 할 일

## 자동 업그레이드 모드(무프롬프트)

**무엇을:** `GSTACK_AUTO_UPGRADE=1` 환경변수 또는 `~/.gstack/config` 옵션을 추가해, 새 버전 감지 시 AskUserQuestion 프롬프트 없이 자동 업그레이드하도록 합니다.

**왜:** 파워 유저나 CI 환경에서는 매번 확인을 받지 않는 무마찰 업그레이드를 원할 수 있습니다.

**맥락:** 현재 업그레이드 시스템(v0.3.4)은 항상 AskUserQuestion으로 확인합니다. 이 TODO는 opt-in 우회 경로를 추가합니다. 구현은 프리앰블 지침에 약 10줄 수준입니다: AskUserQuestion 호출 전 env/config를 확인하고, 설정되어 있으면 업그레이드 플로우로 바로 진입합니다. 전체 업그레이드 시스템이 충분히 안정화된 뒤에 반영해야 하므로, 프롬프트 기반 플로우에 대한 사용자 피드백을 먼저 기다립니다.

**작업량:** S (small)
**우선순위:** P3 (있으면 좋음, 도입 데이터 확인 후 재검토)

## 남은 스킬을 .tmpl 파일로 전환

**무엇을:** ship/, review/, plan-ceo-review/, plan-eng-review/, retro/의 SKILL.md를 `{{UPDATE_CHECK}}` 플레이스홀더를 사용하는 .tmpl 템플릿으로 전환합니다.

**왜:** 이 5개 스킬은 update check 프리앰블을 아직 복붙으로 유지하고 있습니다. 프리앰블이 바뀔 때(v0.3.5의 `|| true` 수정 같은 경우) 5개를 모두 수동 수정해야 합니다. `scripts/gen-skill-docs.ts`에는 `{{UPDATE_CHECK}}` 리졸버가 이미 있으므로, 대상 스킬만 변환하면 됩니다.

**맥락:** browse 계열 스킬(SKILL.md, browse/, qa/, setup-browser-cookies/)은 v0.3.5에서 .tmpl로 전환됐습니다. 남은 5개는 `{{UPDATE_CHECK}}`만 사용하고(`{{BROWSE_SETUP}}` 없음), 변환은 기계적입니다: 프리앰블을 `{{UPDATE_CHECK}}`로 교체하고, `scripts/gen-skill-docs.ts`의 `findTemplates()`에 경로를 추가한 뒤, .tmpl + 생성된 .md를 함께 커밋합니다.

**의존성:** v0.3.5 선출시(`{{UPDATE_CHECK}}` 리졸버 포함).
**작업량:** S (small, 약 20분)
**우선순위:** P2 (다음 프리앰블 변경 시 드리프트 방지)
