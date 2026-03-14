# TODO — gstack 로드맵

## Phase 1: 기반 (v0.2.0)
  - [x] gstack으로 이름 변경
  - [x] 모노레포 레이아웃으로 재구성
  - [x] 스킬 심볼릭 링크를 위한 setup 스크립트
  - [x] ref 기반 요소 선택을 갖춘 snapshot 커맨드
  - [x] 스냅샷 테스트

## Phase 2: 향상된 브라우저 (v0.2.0) ✅
  - [x] 주석 스크린샷 (--annotate 플래그, 스크린샷에 ref 레이블 오버레이)
  - [x] 스냅샷 비교 (--diff 플래그, 이전 스냅샷 대비 unified diff)
  - [x] 다이얼로그 처리 (자동 수락/거절, 다이얼로그 버퍼, 브라우저 잠금 방지)
  - [x] 파일 업로드 (upload <sel> <files>)
  - [x] Cursor-interactive 요소 (-C 플래그, cursor:pointer/onclick/tabindex 스캔)
  - [x] 엘리먼트 상태 확인 (is visible/hidden/enabled/disabled/checked/editable/focused)
  - [x] CircularBuffer — 콘솔/네트워크/다이얼로그를 위한 O(1) 링 버퍼 (기존 O(n) array+shift)
  - [x] Bun.write()를 통한 비동기 버퍼 플러시 (기존 appendFileSync)
  - [x] page.evaluate('1') + 2초 타임아웃으로 헬스 체크
  - [x] Playwright 에러 래핑 — AI 에이전트를 위한 실행 가능한 메시지
  - [x] useragent 수정 — 컨텍스트 재생성 시 쿠키/스토리지/URL 유지
  - [x] DRY: getCleanText 내보내기, chain의 커맨드 세트 업데이트
  - [x] 148개 통합 테스트 (기존 ~63개)

## Phase 3: QA 테스트 에이전트 (v0.3.0)
  - [x] `/qa` SKILL.md — 6단계 워크플로우: 초기화 → 인증 → 탐색 → 탐험 → 문서화 → 마무리
  - [x] 이슈 분류법 레퍼런스 (7개 카테고리: visual, functional, UX, content, performance, console, accessibility)
  - [x] 심각도 분류 (critical/high/medium/low)
  - [x] 페이지별 탐험 체크리스트
  - [x] 리포트 템플릿 (이슈별 증거를 갖춘 구조화된 마크다운)
  - [x] 재현 우선 철학: 이동하기 전에 모든 이슈에 증거 확보
  - [x] 두 가지 증거 티어: 대화형 버그 (멀티 스텝 스크린샷), 정적 버그 (단일 주석 스크린샷)
  - [x] 핵심 가이드: 세션당 5-10개 잘 문서화된 이슈, 넓이보다 깊이, 점진적으로 작성
  - [x] 세 가지 모드: full (체계적), quick (30초 스모크 테스트), regression (기준선 대비 비교)
  - [x] 프레임워크 감지 가이드 (Next.js, Rails, WordPress, SPA)
  - [x] 건강 점수 루브릭 (7개 카테고리, 가중 평균)
  - [x] `wait --networkidle` / `wait --load` / `wait --domcontentloaded`
  - [x] `console --errors` (에러/경고만 필터링)
  - [x] `cookie-import <json-file>` (도메인 자동 채우기를 갖춘 벌크 쿠키 가져오기)
  - [x] `browse/bin/find-browse` (스킬 전반에 걸친 DRY 바이너리 탐색)
  - [ ] 비디오 녹화 (Phase 5로 연기 — recreateContext가 페이지 상태를 파괴함)

## Phase 3.5: 브라우저 쿠키 가져오기 (v0.3.x)
  - [x] `cookie-import-browser` 커맨드 (Chromium 쿠키 DB 복호화)
  - [x] 쿠키 선택기 웹 UI (browse 서버에서 제공)
  - [x] `/setup-browser-cookies` 스킬
  - [x] 암호화된 쿠키 픽스처를 사용한 단위 테스트 (18개 테스트)
  - [x] 브라우저 레지스트리 (Comet, Chrome, Arc, Brave, Edge)

## Phase 3.6: 시각적 PR 주석 + S3 업로드
  - [ ] `/setup-gstack-upload` 스킬 (이미지 호스팅을 위한 S3 버킷 설정)
  - [ ] `browse/bin/gstack-upload` 헬퍼 (파일을 S3에 업로드, 공개 URL 반환)
  - [ ] `/ship` Step 7.5: PR 본문에 스크린샷이 포함된 시각적 검증
  - [ ] `/review` Step 4.5: PR에 주석 스크린샷이 포함된 시각적 리뷰
  - [ ] WebM → GIF 변환 (ffmpeg) PR에서 비디오 증거
  - [ ] 시각적 PR 주석을 위한 README 문서

## Phase 4: 스킬 + 브라우저 통합
  - [ ] ship + browse: 배포 후 검증
    - 푸시 후 스테이징/프리뷰 URL 탐색
    - 주요 페이지 스크린샷
    - JS 에러를 위한 콘솔 확인
    - 스냅샷 diff로 스테이징 vs 프로덕션 비교
    - PR 본문에 검증 스크린샷 포함
    - 중요 에러 발견 시 중지
  - [ ] review + browse: 시각적 diff 리뷰
    - PR의 프리뷰 배포 탐색
    - 변경된 페이지의 주석 스크린샷
    - 프로덕션과 시각적으로 비교
    - 반응형 레이아웃 확인 (모바일/태블릿/데스크톱)
    - 접근성 트리 회귀 확인
  - [ ] deploy-verify 스킬: 경량 배포 후 스모크 테스트
    - 주요 URL 탐색, 200 확인
    - 중요 페이지 스크린샷
    - 콘솔 에러 확인
    - 기준선 스냅샷과 비교
    - 증거와 함께 통과/실패

## Phase 5: 상태 및 세션
  - [ ] v20 암호화 형식 지원 (AES-256-GCM) — 미래 Chromium 버전이 v10에서 변경될 수 있음
  - [ ] 세션 (별도 쿠키/스토리지/히스토리를 갖춘 격리된 브라우저 인스턴스)
  - [ ] 상태 지속성 (쿠키 + localStorage를 JSON 파일로 저장/로드)
  - [ ] 인증 볼트 (암호화된 자격증명 저장소, 이름으로 참조, LLM이 비밀번호를 보지 못함)
  - [ ] 비디오 녹화 (녹화 시작/중지 — 깔끔한 컨텍스트 라이프사이클을 위해 세션 필요)
  - [ ] retro + browse: 배포 상태 추적
    - 프로덕션 상태 스크린샷
    - 성능 메트릭 확인 (페이지 로드 시간)
    - 주요 페이지에서 콘솔 에러 계산
    - 회고 기간에 걸친 추세 추적

## Phase 6: 고급 브라우저
  - [ ] Iframe 지원 (frame <sel>, frame main)
  - [ ] 시맨틱 로케이터 (role/label/text/placeholder/testid를 액션과 함께 찾기)
  - [ ] 기기 에뮬레이션 프리셋 (set device "iPhone 16 Pro")
  - [ ] 네트워크 모킹/라우팅 (요청 가로채기, 차단, 모킹)
  - [ ] 다운로드 처리 (경로 제어를 갖춘 클릭-다운로드)
  - [ ] 콘텐츠 안전 (--max-output 잘라내기, --allowed-domains)
  - [ ] 스트리밍 (페어 브라우징을 위한 WebSocket 라이브 프리뷰)
  - [ ] CDP 모드 (이미 실행 중인 Chrome/Electron 앱에 연결)

## 미래 아이디어
  - [ ] Linux/Windows 쿠키 복호화 (GNOME Keyring / kwallet / DPAPI)
  - [ ] QA 실행 간 추세 추적 — 시간에 따라 baseline.json 비교, 회귀 감지 (P2, S)
  - [ ] CI/CD 통합 — GitHub Action 단계로 `/qa`, 건강 점수 하락 시 PR 실패 (P2, M)
  - [ ] 접근성 감사 모드 — 집중된 접근성 테스트를 위한 `--a11y` 플래그 (P3, S)

## 아이디어 및 메모
  - 브라우저는 신경계 — 모든 스킬이 웹을 보고, 상호작용하고, 검증할 수 있어야 함
  - 스킬이 제품이고, 브라우저는 이를 가능하게 함
  - 하나의 저장소, 하나의 설치, 전체 AI 엔지니어링 워크플로우
  - Bun 컴파일 바이너리는 이 사용 사례에서 Rust CLI 성능과 일치 (병목은 Chromium, CLI 파싱이 아님)
  - 접근성 트리 스냅샷은 전체 DOM ~3000-5000 토큰 대비 ~200-400 토큰 사용 — AI 컨텍스트 효율성에 중요
  - ref를 위한 Locator 맵 방식: BrowserManager에 Map<string, Locator> 저장, DOM 변형 없음, CSP 문제 없음
  - 스냅샷 스코핑 (-i, -c, -d, -s 플래그)은 큰 페이지 성능에 중요
  - 모든 새 커맨드는 기존 패턴을 따름: 커맨드 세트에 추가, switch case 추가, 문자열 반환
