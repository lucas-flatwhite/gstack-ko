#!/usr/bin/env bun
/**
 * Generate SKILL.md files from .tmpl templates.
 *
 * Pipeline:
 *   read .tmpl → find {{PLACEHOLDERS}} → resolve from source → format → write .md
 *
 * Supports --dry-run: generate to memory, exit 1 if different from committed file.
 * Used by skill:check and CI freshness checks.
 */

import { COMMAND_DESCRIPTIONS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const KO_CATEGORY_TITLES: Record<string, string> = {
  Navigation: '탐색 (Navigation)',
  Reading: '읽기 (Reading)',
  Interaction: '상호작용 (Interaction)',
  Inspection: '검사 (Inspection)',
  Visual: '시각 (Visual)',
  Snapshot: '스냅샷 (Snapshot)',
  Meta: '메타 (Meta)',
  Tabs: '탭 (Tabs)',
  Server: '서버 (Server)',
};
const KO_COMMAND_DESCRIPTIONS: Record<string, string> = {
  goto: 'URL로 이동',
  back: '히스토리 뒤로',
  forward: '히스토리 앞으로',
  reload: '페이지 새로고침',
  url: '현재 URL 출력',
  text: '정리된 페이지 텍스트',
  html: 'selector의 innerHTML(없으면 에러), selector 미지정 시 전체 HTML',
  links: '모든 링크를 "텍스트 → href" 형식으로 출력',
  forms: '폼 필드를 JSON으로 출력',
  accessibility: '전체 ARIA 트리',
  js: 'JavaScript 표현식을 실행하고 결과를 문자열로 반환',
  eval: '파일의 JavaScript를 실행하고 결과를 문자열로 반환(경로는 /tmp 또는 cwd 하위)',
  css: '계산된 CSS 값',
  attrs: '요소 속성을 JSON으로 출력',
  is: '상태 검사(visible/hidden/enabled/disabled/checked/editable/focused)',
  console: '콘솔 메시지(--errors로 error/warning만 필터)',
  network: '네트워크 요청',
  dialog: '다이얼로그 메시지',
  cookies: '모든 쿠키를 JSON으로 출력',
  storage: 'localStorage + sessionStorage 읽기(JSON), 또는 set <key> <value>로 localStorage 쓰기',
  perf: '페이지 로드 타이밍',
  click: '요소 클릭',
  fill: '입력 요소 채우기',
  select: '드롭다운 값을 value/label/표시 텍스트로 선택',
  hover: '요소 hover',
  type: '포커스된 요소에 텍스트 입력',
  press: '키 입력(Enter/Tab/Escape/화살표/Backspace/Delete/Home/End/PageUp/PageDown/Shift+Enter 등)',
  scroll: '요소를 화면에 보이게 스크롤, selector 없으면 페이지 하단으로 스크롤',
  wait: '요소/네트워크 idle/페이지 로드를 대기(타임아웃 15초)',
  upload: '파일 업로드',
  viewport: '뷰포트 크기 설정',
  cookie: '현재 페이지 도메인에 쿠키 설정',
  'cookie-import': 'JSON 파일에서 쿠키 가져오기',
  'cookie-import-browser': 'Comet/Chrome/Arc/Brave/Edge에서 쿠키 가져오기(선택기 또는 --domain 직접 지정)',
  header: '커스텀 요청 헤더 설정(콜론 구분, 민감값 자동 마스킹)',
  useragent: 'User-Agent 설정',
  'dialog-accept': '다음 alert/confirm/prompt를 자동 수락(선택 텍스트는 prompt 응답으로 사용)',
  'dialog-dismiss': '다음 다이얼로그 자동 취소',
  screenshot: '스크린샷 저장',
  pdf: 'PDF로 저장',
  responsive: '모바일/태블릿/데스크톱 스크린샷 저장({prefix}-mobile.png 등)',
  diff: '두 페이지 간 텍스트 diff',
  tabs: '열린 탭 목록',
  tab: '탭 전환',
  newtab: '새 탭 열기',
  closetab: '탭 닫기',
  status: '헬스 체크',
  stop: '서버 종료',
  restart: '서버 재시작',
  snapshot: '요소 선택용 @e ref가 포함된 접근성 트리. 플래그: -i, -c, -d N, -s sel, -D, -a, -o path, -C',
  chain: 'JSON stdin에서 명령 배치 실행. 형식: [["cmd","arg1",...],...]',
};
const KO_SNAPSHOT_FLAG_DESCRIPTIONS: Record<string, string> = {
  '-i': '대화형 요소만(@e ref: 버튼/링크/입력)',
  '-c': '압축 출력(빈 구조 노드 제외)',
  '-d': '트리 깊이 제한 (0 = root만, 기본값: 무제한)',
  '-s': 'CSS 셀렉터 범위로 제한',
  '-D': '이전 snapshot 대비 unified diff(첫 호출은 기준선 저장)',
  '-a': 'ref 라벨이 포함된 주석 스크린샷',
  '-o': '주석 스크린샷 출력 경로(기본: /tmp/browse-annotated.png)',
  '-C': 'cursor-interactive 요소(@c ref - pointer/onclick 요소)',
};

// ─── Placeholder Resolvers ──────────────────────────────────

function generateCommandReference(): string {
  // Group commands by category
  const groups = new Map<string, Array<{ command: string; description: string; usage?: string }>>();
  for (const [cmd, meta] of Object.entries(COMMAND_DESCRIPTIONS)) {
    const list = groups.get(meta.category) || [];
    list.push({ command: cmd, description: meta.description, usage: meta.usage });
    groups.set(meta.category, list);
  }

  // Category display order
  const categoryOrder = [
    'Navigation', 'Reading', 'Interaction', 'Inspection',
    'Visual', 'Snapshot', 'Meta', 'Tabs', 'Server',
  ];

  const sections: string[] = [];
  for (const category of categoryOrder) {
    const commands = groups.get(category);
    if (!commands || commands.length === 0) continue;

    // Sort alphabetically within category
    commands.sort((a, b) => a.command.localeCompare(b.command));

    const categoryTitle = KO_CATEGORY_TITLES[category] ?? category;
    sections.push(`### ${categoryTitle}`);
    sections.push('| 명령어 | 설명 |');
    sections.push('|--------|------|');
    for (const cmd of commands) {
      const display = cmd.usage ? `\`${cmd.usage}\`` : `\`${cmd.command}\``;
      const description = KO_COMMAND_DESCRIPTIONS[cmd.command] ?? cmd.description;
      sections.push(`| ${display} | ${description} |`);
    }
    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

function generateSnapshotFlags(): string {
  const lines: string[] = [
    '`snapshot`은 페이지를 이해하고 상호작용 대상을 찾는 핵심 도구입니다.',
    '',
    '```',
  ];

  for (const flag of SNAPSHOT_FLAGS) {
    const label = flag.valueHint ? `${flag.short} ${flag.valueHint}` : flag.short;
    const description = KO_SNAPSHOT_FLAG_DESCRIPTIONS[flag.short] ?? flag.description;
    lines.push(`${label.padEnd(10)}${flag.long.padEnd(24)}${description}`);
  }

  lines.push('```');
  lines.push('');
  lines.push('플래그는 자유롭게 조합할 수 있습니다. `-o`는 `-a`를 함께 쓸 때만 유효합니다.');
  lines.push('예시: `$B snapshot -i -a -C -o /tmp/annotated.png`');
  lines.push('');
  lines.push('**Ref 번호 규칙:** @e ref는 트리 순서대로 순차 부여됩니다(@e1, @e2, ...).');
  lines.push('`-C`에서 생성되는 @c ref는 별도 번호 체계를 사용합니다(@c1, @c2, ...).');
  lines.push('');
  lines.push('snapshot 이후에는 @ref를 다른 명령의 셀렉터로 사용할 수 있습니다:');
  lines.push('```bash');
  lines.push('$B click @e3       $B fill @e4 "value"     $B hover @e1');
  lines.push('$B html @e2        $B css @e5 "color"      $B attrs @e6');
  lines.push('$B click @c1       # cursor-interactive ref (from -C)');
  lines.push('```');
  lines.push('');
  lines.push('**출력 형식:** 들여쓰기된 접근성 트리에 @ref ID가 붙으며 요소당 한 줄로 출력됩니다.');
  lines.push('```');
  lines.push('  @e1 [heading] "Welcome" [level=1]');
  lines.push('  @e2 [textbox] "Email"');
  lines.push('  @e3 [button] "Submit"');
  lines.push('```');
  lines.push('');
  lines.push('페이지 이동 후에는 ref가 무효화되므로 `goto` 뒤에는 `snapshot`을 다시 실행합니다.');

  return lines.join('\n');
}

function generateUpdateCheck(): string {
  return `## Update Check (먼저 실행)

\`\`\`bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
\`\`\`

출력이 \`UPGRADE_AVAILABLE <old> <new>\`이면 \`~/.claude/skills/gstack/gstack-upgrade/SKILL.md\`를 읽고 "Inline upgrade flow"를 따릅니다.
\`JUST_UPGRADED <from> <to>\`이면 사용자에게 "gstack v{to}로 실행 중(방금 업데이트됨)"이라고 알리고 계속합니다.`;
}

function generateBrowseSetup(): string {
  return `## SETUP (browse 커맨드 전에 반드시 실행)

\`\`\`bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && B="$_ROOT/.claude/skills/gstack/browse/dist/browse"
[ -z "$B" ] && B=~/.claude/skills/gstack/browse/dist/browse
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
\`\`\`

\`NEEDS_SETUP\`인 경우:
1. 사용자에게 "gstack browse는 1회 빌드가 필요합니다(~10초). 진행할까요?"라고 묻고 대기합니다.
2. \`cd <SKILL_DIR> && ./setup\` 실행
3. \`bun\`이 없으면: \`curl -fsSL https://bun.sh/install | bash\` 실행`;
}

const RESOLVERS: Record<string, () => string> = {
  COMMAND_REFERENCE: generateCommandReference,
  SNAPSHOT_FLAGS: generateSnapshotFlags,
  UPDATE_CHECK: generateUpdateCheck,
  BROWSE_SETUP: generateBrowseSetup,
};

// ─── Template Processing ────────────────────────────────────

const GENERATED_HEADER = `<!-- AUTO-GENERATED from {{SOURCE}} — do not edit directly -->\n<!-- Regenerate: bun run gen:skill-docs -->\n`;

function processTemplate(tmplPath: string): { outputPath: string; content: string } {
  const tmplContent = fs.readFileSync(tmplPath, 'utf-8');
  const relTmplPath = path.relative(ROOT, tmplPath);
  const outputPath = tmplPath.replace(/\.tmpl$/, '');

  // Replace placeholders
  let content = tmplContent.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const resolver = RESOLVERS[name];
    if (!resolver) throw new Error(`Unknown placeholder {{${name}}} in ${relTmplPath}`);
    return resolver();
  });

  // Check for any remaining unresolved placeholders
  const remaining = content.match(/\{\{(\w+)\}\}/g);
  if (remaining) {
    throw new Error(`Unresolved placeholders in ${relTmplPath}: ${remaining.join(', ')}`);
  }

  // Prepend generated header (after frontmatter)
  const header = GENERATED_HEADER.replace('{{SOURCE}}', path.basename(tmplPath));
  const fmEnd = content.indexOf('---', content.indexOf('---') + 3);
  if (fmEnd !== -1) {
    const insertAt = content.indexOf('\n', fmEnd) + 1;
    content = content.slice(0, insertAt) + header + content.slice(insertAt);
  } else {
    content = header + content;
  }

  return { outputPath, content };
}

// ─── Main ───────────────────────────────────────────────────

function findTemplates(): string[] {
  const templates: string[] = [];
  const candidates = [
    path.join(ROOT, 'SKILL.md.tmpl'),
    path.join(ROOT, 'browse', 'SKILL.md.tmpl'),
    path.join(ROOT, 'qa', 'SKILL.md.tmpl'),
    path.join(ROOT, 'setup-browser-cookies', 'SKILL.md.tmpl'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) templates.push(p);
  }
  return templates;
}

let hasChanges = false;

for (const tmplPath of findTemplates()) {
  const { outputPath, content } = processTemplate(tmplPath);
  const relOutput = path.relative(ROOT, outputPath);

  if (DRY_RUN) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
    if (existing !== content) {
      console.log(`STALE: ${relOutput}`);
      hasChanges = true;
    } else {
      console.log(`FRESH: ${relOutput}`);
    }
  } else {
    fs.writeFileSync(outputPath, content);
    console.log(`GENERATED: ${relOutput}`);
  }
}

if (DRY_RUN && hasChanges) {
  console.error('\nGenerated SKILL.md files are stale. Run: bun run gen:skill-docs');
  process.exit(1);
}
