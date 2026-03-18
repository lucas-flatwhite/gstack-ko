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
  bin/
  scripts/
  test/
  browse/src/
  browse/test/
  package.json
  conductor.json
  VERSION
  SKILL.md.tmpl
  setup
  bun.lock
  tsconfig.json
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

if [ "$changed" -eq 0 ]; then
  echo "  제거할 파일 없음 (이미 깔끔합니다)"
  exit 0
fi

git commit -m "sync: 번역 불필요 파일 제거 (빌드 툴링, 테스트)"
echo "✓ 완료. 이제 git push 하면 됩니다."
