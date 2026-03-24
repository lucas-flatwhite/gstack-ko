#!/usr/bin/env bash
# sync-cleanup.sh
# upstream(garrytan/gstack) sync 후 실행하세요.
# 번역 불필요 파일(빌드 툴링, 테스트, 바이너리)을 제거하고 커밋합니다.
#
# 사용법:
#   git fetch upstream
#   git merge upstream/main
#   bash sync-cleanup.sh
#   git push

set -e

REMOVE=(
  # 빌드 툴링 / 런타임
  bin/
  scripts/
  lib/
  setup
  package.json
  bun.lock
  tsconfig.json
  conductor.json
  VERSION
  actionlint.yaml

  # 테스트
  test/

  # 브라우저 소스/테스트/바이너리/스크립트
  browse/src/
  browse/test/
  browse/bin/
  browse/dist/
  browse/scripts/

  # 에이전트 설정 (Codex/Gemini)
  .agents/
  agents/

  # CI/CD
  .github/

  # 인프라
  supabase/

  # 생성용 템플릿 (SKILL.md만 유지)
  SKILL.md.tmpl

  # 생성된 스킬 목록 (빌드 산출물)
  docs/skills.md

  # 환경 설정 예제
  .env.example
)

echo "▶ 번역 불필요 파일 제거 중..."

changed=0
for path in "${REMOVE[@]}"; do
  if git ls-files --error-unmatch "$path" &>/dev/null 2>&1; then
    git rm -r --quiet "$path"
    echo "  삭제: $path"
    changed=1
  fi
done

# 스킬별 SKILL.md.tmpl 제거 (최상위 이외)
for tmpl in $(git ls-files '*/SKILL.md.tmpl' 2>/dev/null); do
  git rm --quiet "$tmpl"
  echo "  삭제: $tmpl"
  changed=1
done

# 스킬별 bin/ 디렉토리 제거 (프로그램 스크립트)
for bindir in $(git ls-files '*/bin/*' 2>/dev/null | sed 's|/[^/]*$||' | sort -u); do
  git rm -r --quiet "$bindir"
  echo "  삭제: $bindir/"
  changed=1
done

if [ "$changed" -eq 0 ]; then
  echo "  제거할 파일 없음 (이미 깔끔합니다)"
  exit 0
fi

git commit -m "sync: 번역 불필요 파일 제거 (빌드 툴링, 테스트)"
echo "✓ 완료. 이제 git push 하면 됩니다."
