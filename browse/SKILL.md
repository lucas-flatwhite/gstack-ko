---
name: browse
version: 1.1.0
description: |
  QA 테스트 및 사이트 도그푸딩을 위한 빠른 헤드리스 브라우저. URL 탐색, 요소 상호작용,
  페이지 상태 검증, 액션 전후 diff, 주석 스크린샷 촬영, 반응형 레이아웃 확인,
  폼 및 업로드 테스트, 다이얼로그 처리, 엘리먼트 상태 어서션.
  커맨드당 ~100ms. 기능 테스트, 배포 검증, 사용자 흐름 도그푸딩,
  또는 증거와 함께 버그 신고가 필요할 때 사용합니다.
allowed-tools:
  - Bash
  - Read

---

# browse: QA 테스트 및 도그푸딩

지속적인 헤드리스 Chromium. 첫 번째 호출 자동 시작 (~3s), 이후 커맨드당 ~100ms.
상태는 호출 간 유지됩니다 (쿠키, 탭, 로그인 세션).

## 핵심 QA 패턴

### 1. 페이지가 올바르게 로드되는지 확인
```bash
$B goto https://yourapp.com
$B text                          # 콘텐츠 로드됨?
$B console                       # JS 에러?
$B network                       # 실패한 요청?
$B is visible ".main-content"    # 주요 요소 존재?
```

### 2. 사용자 흐름 테스트
```bash
$B goto https://app.com/login
$B snapshot -i                   # 모든 대화형 요소 확인
$B fill @e3 "user@test.com"
$B fill @e4 "password"
$B click @e5                     # 제출
$B snapshot -D                   # diff: 제출 후 무엇이 변경됐나?
$B is visible ".dashboard"       # 성공 상태 존재?
```

### 3. 액션이 동작했는지 확인
```bash
$B snapshot                      # 기준선
$B click @e3                     # 무언가 수행
$B snapshot -D                   # unified diff가 정확히 무엇이 변경됐는지 보여줌
```

### 4. 버그 리포트를 위한 시각적 증거
```bash
$B snapshot -i -a -o /tmp/annotated.png   # 레이블이 붙은 스크린샷
$B screenshot /tmp/bug.png                # 일반 스크린샷
$B console                                # 에러 로그
```

### 5. 모든 클릭 가능한 요소 찾기 (비 ARIA 포함)
```bash
$B snapshot -C                   # cursor:pointer, onclick, tabindex가 있는 div 찾기
$B click @c1                     # 상호작용
```

### 6. 엘리먼트 상태 어서션
```bash
$B is visible ".modal"
$B is enabled "#submit-btn"
$B is disabled "#submit-btn"
$B is checked "#agree-checkbox"
$B is editable "#name-field"
$B is focused "#search-input"
$B js "document.body.textContent.includes('Success')"
```

### 7. 반응형 레이아웃 테스트
```bash
$B responsive /tmp/layout        # 모바일 + 태블릿 + 데스크톱 스크린샷
$B viewport 375x812              # 또는 특정 뷰포트 설정
$B screenshot /tmp/mobile.png
```

### 8. 파일 업로드 테스트
```bash
$B upload "#file-input" /path/to/file.pdf
$B is visible ".upload-success"
```

### 9. 다이얼로그 테스트
```bash
$B dialog-accept "yes"           # 핸들러 설정
$B click "#delete-button"        # 다이얼로그 트리거
$B dialog                        # 무엇이 나타났는지 확인
$B snapshot -D                   # 삭제가 실행됐는지 확인
```

### 10. 환경 비교
```bash
$B diff https://staging.app.com https://prod.app.com
```

## 스냅샷 플래그

```
-i        대화형 요소만 (버튼, 링크, 입력)
-c        컴팩트 (빈 구조 노드 제외)
-d <N>    깊이 제한
-s <sel>  CSS 셀렉터로 스코핑
-D        이전 스냅샷 대비 diff
-a        ref 레이블이 붙은 주석 스크린샷
-o <path> 스크린샷 출력 경로
-C        Cursor-interactive 요소 (@c refs)
```

조합 사용: `$B snapshot -i -a -C -o /tmp/annotated.png`

스냅샷 후 @ref 사용: `$B click @e3`, `$B fill @e4 "value"`, `$B click @c1`

## 전체 커맨드 목록

**탐색:** goto, back, forward, reload, url
**읽기:** text, html, links, forms, accessibility
**스냅샷:** snapshot (위 플래그 포함)
**상호작용:** click, fill, select, hover, type, press, scroll, wait, wait --networkidle, wait --load, viewport, upload, cookie-import, dialog-accept, dialog-dismiss
**검사:** js, eval, css, attrs, is, console, console --errors, network, dialog, cookies, storage, perf
**시각:** screenshot, pdf, responsive
**비교:** diff
**멀티 스텝:** chain (JSON 배열 파이프)
**탭:** tabs, tab, newtab, closetab
**서버:** status, stop, restart
