---
id: SPEC-SOCIAL-SHARE-001
type: acceptance
version: "1.0.0"
spec-ref: SPEC-SOCIAL-SHARE-001/spec.md
---

# SPEC-SOCIAL-SHARE-001: 인수 기준

---

## Phase A: Sharing Infrastructure (공유 인프라)

### AC-A-001: ExportPanel 통합 UI 표시

**Scenario 1: 데스크톱 드롭다운 표시**

```gherkin
Given 사용자가 데스크톱 브라우저(>= 768px)에서 명함 편집 페이지에 있다
When 사용자가 ExportPanel 트리거 버튼을 클릭한다
Then 드롭다운 메뉴가 표시된다
And 메뉴에는 "앞면 PNG 다운로드", "뒷면 PNG 다운로드", "합성 이미지 다운로드" 항목이 포함된다
And 메뉴에는 소셜 공유 섹션이 포함된다
And 메뉴에는 "이미지 복사", "링크 복사", "공유" 항목이 포함된다
```

**Scenario 2: 모바일 바텀시트 표시**

```gherkin
Given 사용자가 모바일 브라우저(< 768px)에서 명함 편집 페이지에 있다
When 사용자가 ExportPanel 트리거 버튼을 클릭한다
Then 화면 하단에서 바텀시트가 슬라이드업으로 표시된다
And 바텀시트에는 드롭다운과 동일한 메뉴 항목이 포함된다
And 배경 오버레이를 클릭하면 바텀시트가 닫힌다
```

**Scenario 3: 기존 PNG 다운로드 기능 보존**

```gherkin
Given ExportPanel이 열린 상태이다
When 사용자가 "앞면 PNG 다운로드" 항목을 클릭한다
Then namecard-front.png 파일이 다운로드된다
And 다운로드된 이미지는 2x 해상도(pixelRatio: 2)이다
```

### AC-A-002: 합성 이미지 생성

**Scenario 1: 합성 이미지 다운로드**

```gherkin
Given 명함 앞면과 뒷면이 모두 렌더링된 상태이다
When 사용자가 "합성 이미지 다운로드" 항목을 클릭한다
Then 앞면과 뒷면이 좌우로 배치된 단일 PNG 이미지가 다운로드된다
And 이미지 파일명은 "namecard-composite.png"이다
And 이미지 해상도는 2x이다
And 두 이미지 사이에 간격(gap)이 포함된다
```

**Scenario 2: 합성 이미지 생성 실패 시**

```gherkin
Given 명함 앞면 또는 뒷면 DOM 요소가 존재하지 않는다
When 합성 이미지 생성을 시도한다
Then 에러 toast 알림이 표시된다: "이미지 생성에 실패했습니다"
And 콘솔에 에러 로그가 기록된다
```

### AC-A-003: Web Share API 공유

**Scenario 1: Web Share API 지원 브라우저**

```gherkin
Given 브라우저가 navigator.share를 지원한다
And 명함 이미지가 생성 가능한 상태이다
When 사용자가 "공유" 버튼을 클릭한다
Then OS 네이티브 공유 시트가 표시된다
And 공유 데이터에 명함 이미지 파일과 공개 URL이 포함된다
```

**Scenario 2: Web Share API 미지원 브라우저**

```gherkin
Given 브라우저가 navigator.share를 지원하지 않는다
When ExportPanel이 렌더링된다
Then "공유" 버튼이 비활성화(disabled) 상태로 표시된다
And 버튼에 마우스를 올리면 "이 브라우저에서는 공유를 지원하지 않습니다" 툴팁이 표시된다
```

### AC-A-004: 클립보드 이미지 복사

**Scenario 1: 이미지 클립보드 복사 성공**

```gherkin
Given 브라우저가 navigator.clipboard.write를 지원한다
And HTTPS 환경에서 실행 중이다
When 사용자가 "이미지 복사" 버튼을 클릭한다
Then 현재 활성 면의 이미지가 클립보드에 PNG 형식으로 복사된다
And 성공 toast 알림이 표시된다: "이미지가 복사되었습니다"
```

**Scenario 2: 클립보드 이미지 복사 미지원**

```gherkin
Given 브라우저가 navigator.clipboard.write를 지원하지 않는다
When ExportPanel이 렌더링된다
Then "이미지 복사" 버튼이 비활성화 상태로 표시된다
And 툴팁으로 "이 브라우저에서는 이미지 복사를 지원하지 않습니다" 메시지가 표시된다
```

### AC-A-005: Feature Detection

**Scenario 1: 모든 API 지원 환경**

```gherkin
Given 브라우저가 Web Share API, Clipboard write, Kakao SDK를 모두 지원한다
When ExportPanel이 렌더링된다
Then 모든 공유 옵션이 활성화 상태로 표시된다
```

**Scenario 2: 제한된 API 환경**

```gherkin
Given 브라우저가 Web Share API만 미지원한다
When ExportPanel이 렌더링된다
Then "공유" 버튼만 비활성화되고 나머지 옵션은 모두 활성화된다
And 비활성화된 버튼에는 미지원 안내 툴팁이 표시된다
```

---

## Phase B: KakaoTalk Integration (카카오톡 통합)

### AC-B-001: Kakao SDK 초기화

**Scenario 1: SDK 정상 로드**

```gherkin
Given NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되어 있다
When 페이지가 로드된다
Then Kakao JavaScript SDK가 CDN에서 비동기로 로드된다
And Kakao.init()이 호출되어 SDK가 초기화된다
And Kakao.isInitialized()가 true를 반환한다
```

**Scenario 2: SDK 로드 실패**

```gherkin
Given Kakao CDN에 접근할 수 없다
When 페이지가 로드되고 5초가 경과한다
Then SDK 로드 실패가 감지된다
And 카카오톡 공유 버튼이 숨겨진다
And 다른 공유 기능에는 영향이 없다
And 콘솔에 경고 로그가 기록된다
```

**Scenario 3: 환경변수 미설정**

```gherkin
Given NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 설정되지 않았다
When 페이지가 로드된다
Then Kakao SDK 로드를 시도하지 않는다
And 카카오톡 공유 버튼이 ExportPanel에서 숨겨진다
```

### AC-B-002: KakaoTalk Feed 메시지 공유

**Scenario 1: 정상 공유**

```gherkin
Given Kakao SDK가 초기화된 상태이다
And 사용자의 명함이 공개(public) 상태이다
When 사용자가 "카카오톡으로 공유" 버튼을 클릭한다
Then Kakao.Share.sendDefault()가 호출된다
And Feed 메시지의 title에 사용자의 displayName이 포함된다
And Feed 메시지의 description에 직함과 해시태그가 포함된다
And Feed 메시지의 imageUrl에 illustrationUrl 또는 OG 이미지 URL이 설정된다
And Feed 메시지의 link가 공개 카드 URL(/cards/{id})로 설정된다
And "명함 보기" 버튼이 포함된다
```

**Scenario 2: illustrationUrl 없는 카드**

```gherkin
Given Kakao SDK가 초기화된 상태이다
And 사용자의 명함에 illustrationUrl이 없다
When 사용자가 "카카오톡으로 공유" 버튼을 클릭한다
Then Feed 메시지의 imageUrl에 OG 이미지 URL이 폴백으로 사용된다
And 나머지 공유 정보는 정상적으로 포함된다
```

### AC-B-003: Kakao SDK 오류 처리

**Scenario 1: 공유 중 오류 발생**

```gherkin
Given Kakao SDK가 초기화된 상태이다
When Kakao.Share.sendDefault() 호출 중 오류가 발생한다
Then 에러 toast 알림이 표시된다: "카카오톡 공유에 실패했습니다"
And 콘솔에 상세 에러 로그가 기록된다
```

---

## Phase C: Social Platform Sharing (소셜 플랫폼 공유)

### AC-C-001: Facebook 공유

**Scenario 1: Facebook 팝업 공유**

```gherkin
Given 사용자의 명함이 공개(public) 상태이다
When 사용자가 "Facebook으로 공유" 버튼을 클릭한다
Then 새 팝업 윈도우(600x400)가 열린다
And URL은 "https://facebook.com/sharer/sharer.php?u={encodedCardURL}"이다
```

**Scenario 2: 팝업 차단 시**

```gherkin
Given 브라우저의 팝업 차단이 활성화되어 있다
When 사용자가 "Facebook으로 공유" 버튼을 클릭한다
And window.open()이 null을 반환한다
Then 현재 창에서 Facebook 공유 페이지로 리디렉션된다
```

### AC-C-002: Twitter/X 공유

**Scenario 1: Twitter 팝업 공유**

```gherkin
Given 사용자의 명함이 공개 상태이다
When 사용자가 "X(Twitter)로 공유" 버튼을 클릭한다
Then 새 팝업 윈도우가 열린다
And URL은 "https://twitter.com/intent/tweet?url={encodedURL}&text={encodedTitle}"이다
And text 파라미터에 displayName이 포함된다
```

### AC-C-003: LinkedIn 공유

**Scenario 1: LinkedIn 팝업 공유**

```gherkin
Given 사용자의 명함이 공개 상태이다
When 사용자가 "LinkedIn으로 공유" 버튼을 클릭한다
Then 새 팝업 윈도우(600x500)가 열린다
And URL은 "https://linkedin.com/shareArticle?mini=true&url={encodedURL}&title={encodedTitle}"이다
```

### AC-C-004: LINE 공유

**Scenario 1: LINE 팝업 공유**

```gherkin
Given 사용자의 명함이 공개 상태이다
When 사용자가 "LINE으로 공유" 버튼을 클릭한다
Then 새 팝업 윈도우(500x500)가 열린다
And URL은 "https://social-plugins.line.me/lineit/share?url={encodedURL}"이다
```

### AC-C-005: 향상된 링크 복사

**Scenario 1: 링크 복사 성공**

```gherkin
Given 사용자의 명함이 공개 상태이다
When 사용자가 "링크 복사" 버튼을 클릭한다
Then 공개 카드 URL이 클립보드에 복사된다
And 성공 toast 알림이 표시된다: "링크가 복사되었습니다"
And toast는 3초 후 자동으로 사라진다
```

**Scenario 2: 링크 복사 실패**

```gherkin
Given 브라우저에서 clipboard.writeText가 실패한다
When 사용자가 "링크 복사" 버튼을 클릭한다
Then 에러 toast 알림이 표시된다: "복사에 실패했습니다"
```

---

## Phase D: OG Image Optimization (OG 이미지 최적화)

### AC-D-001: 동적 OG 이미지 생성

**Scenario 1: OG 이미지 정상 생성**

```gherkin
Given 카드 ID가 유효하고 카드가 공개 상태이다
When 소셜 플랫폼 크롤러가 /cards/{id} 페이지를 요청한다
Then og:image 메타태그에 동적 OG 이미지 URL이 포함된다
And OG 이미지 URL을 요청하면 1200x630px PNG 이미지가 반환된다
And Content-Type은 "image/png"이다
```

**Scenario 2: 존재하지 않는 카드**

```gherkin
Given 카드 ID가 유효하지 않거나 비공개 카드이다
When OG 이미지 URL이 요청된다
Then 기본 OG 이미지(브랜드 로고)가 반환된다
And HTTP 상태 코드는 200이다
```

### AC-D-002: 한글 폰트 렌더링

**Scenario 1: 한글 displayName 렌더링**

```gherkin
Given 카드의 displayName이 "홍길동"이다
When OG 이미지가 생성된다
Then 이미지에 "홍길동"이 Noto Sans KR 폰트로 정상 렌더링된다
And 글자가 깨지거나 tofu(사각형)로 표시되지 않는다
```

**Scenario 2: 영문+한글 혼합 텍스트**

```gherkin
Given 카드의 title이 "Senior Developer 개발자"이다
When OG 이미지가 생성된다
Then 영문과 한글이 모두 정상 렌더링된다
And 폰트 간 크기/정렬이 자연스럽다
```

### AC-D-003: OG 이미지 캐싱

**Scenario 1: 캐시 히트**

```gherkin
Given 카드의 OG 이미지가 1시간 이내에 생성된 적이 있다
When 동일한 OG 이미지가 다시 요청된다
Then 캐시된 이미지가 반환된다
And 응답 시간이 100ms 이내이다
```

**Scenario 2: 캐시 만료 후 재생성**

```gherkin
Given 카드의 OG 이미지 캐시가 1시간 이상 경과했다
When OG 이미지가 요청된다
Then 새로운 OG 이미지가 생성된다
And 생성 시간이 3초 이내이다
```

---

## Phase E: Safeguards (안전장치)

### AC-E-001: 비공개 카드 공유 제한

**Scenario 1: 비공개 카드 소셜 공유 차단**

```gherkin
Given 사용자의 명함이 비공개(private) 상태이다
When ExportPanel이 렌더링된다
Then 카카오톡, Facebook, Twitter, LinkedIn, LINE 공유 버튼이 모두 비활성화된다
And "이 카드는 비공개 상태입니다. 공유하려면 먼저 공개로 변경하세요." 안내 메시지가 표시된다
And "앞면 PNG 다운로드", "뒷면 PNG 다운로드", "합성 이미지 다운로드"는 활성화 상태이다
And "이미지 복사" 기능은 활성화 상태이다
```

**Scenario 2: 비공개 카드 다운로드 허용**

```gherkin
Given 사용자의 명함이 비공개(private) 상태이다
When 사용자가 "합성 이미지 다운로드"를 클릭한다
Then 합성 이미지가 정상적으로 다운로드된다
And 공유 제한과 무관하게 다운로드 기능은 동작한다
```

### AC-E-002: 데이터 외부 전송 금지

**Scenario 1: 소셜 공유 시 URL만 전달**

```gherkin
Given 사용자가 소셜 플랫폼 공유를 실행한다
When Facebook/Twitter/LinkedIn/LINE 공유 URL이 생성된다
Then URL 파라미터에 카드의 공개 URL만 포함된다
And 카드 데이터(이름, 연락처, 이미지 데이터)가 URL에 포함되지 않는다
```

**Scenario 2: KakaoTalk 공유 시 공개 URL만 전달**

```gherkin
Given 사용자가 카카오톡 공유를 실행한다
When Kakao.Share.sendDefault()가 호출된다
Then content.link에 공개 카드 URL만 설정된다
And content.imageUrl에는 공개 접근 가능한 이미지 URL만 설정된다
And 카드의 원본 데이터(socialLinks, 연락처)는 전송되지 않는다
```

---

## 성능 기준

| 항목                          | 기준                           |
|-------------------------------|-------------------------------|
| 합성 이미지 생성 시간          | 2초 이내                       |
| Kakao SDK 로드 시간            | 3초 이내 (afterInteractive)   |
| OG 이미지 생성 시간 (캐시 미스) | 3초 이내                       |
| OG 이미지 응답 시간 (캐시 히트) | 100ms 이내                     |
| ExportPanel 렌더링 시간        | 100ms 이내                     |
| Toast 알림 표시 지연            | 200ms 이내                     |
| 클립보드 이미지 복사 시간       | 2초 이내                       |
| 추가 번들 크기 (Kakao SDK 제외) | 5KB (gzip) 이내               |

---

## Quality Gate (TRUST 5)

### Tested

- [ ] Feature detection 유틸리티 단위 테스트
- [ ] 합성 이미지 생성 로직 단위 테스트
- [ ] ExportPanel 컴포넌트 렌더링 테스트
- [ ] KakaoShareButton 초기화/에러 핸들링 테스트
- [ ] 소셜 공유 URL 생성 단위 테스트
- [ ] 비공개 카드 공유 제한 로직 테스트
- [ ] OG 이미지 생성 통합 테스트
- [ ] Toast 알림 동작 테스트

### Readable

- [ ] 모든 함수에 JSDoc 주석 (영문)
- [ ] 컴포넌트 Props 인터페이스에 설명 주석
- [ ] 복잡한 로직(합성 이미지, Safari 클립보드)에 인라인 주석
- [ ] 파일별 명확한 책임 분리

### Unified

- [ ] Tailwind CSS 클래스 일관성 (기존 디자인 시스템 준수)
- [ ] ESLint 경고 0건
- [ ] TypeScript strict 모드 에러 0건
- [ ] 컴포넌트 네이밍 규칙 준수 (PascalCase)
- [ ] 유틸리티 함수 네이밍 규칙 준수 (camelCase)

### Secured

- [ ] 외부 서버로 카드 데이터 미전송 확인
- [ ] Kakao SDK integrity 속성 적용
- [ ] URL 파라미터 encodeURIComponent 처리
- [ ] HTTPS 환경 확인 (Clipboard API 사전조건)
- [ ] 환경변수(KAKAO_JS_KEY) 노출 범위 확인 (NEXT_PUBLIC_ prefix로 제한)

### Trackable

- [ ] 모든 커밋 메시지에 SPEC-SOCIAL-SHARE-001 참조
- [ ] Phase별 커밋 분리 (feat: Phase A, feat: Phase B 등)
- [ ] 에러 발생 시 console.error 로깅
- [ ] Feature detection 결과 console.debug 로깅 (개발 환경)

---

## Definition of Done

- [ ] Phase A~D의 모든 인수 기준(AC) 시나리오 통과
- [ ] 기존 ExportButton 기능이 ExportPanel에서 동일하게 동작
- [ ] KakaoTalk Feed 메시지가 정상 전송되고 링크가 올바른 카드 페이지로 이동
- [ ] 5개 소셜 플랫폼(KakaoTalk, Facebook, Twitter, LinkedIn, LINE) 공유 동작 확인
- [ ] 비공개 카드 소셜 공유 차단, 다운로드 허용 동작 확인
- [ ] OG 이미지가 소셜 플랫폼에서 정상 표시 (Facebook Debugger, Twitter Card Validator로 검증)
- [ ] Feature detection에 따른 graceful degradation 동작 확인
- [ ] TRUST 5 Quality Gate 체크리스트 전항목 통과
- [ ] 성능 기준 전항목 충족
- [ ] TypeScript 컴파일 에러 0건
- [ ] ESLint 에러/경고 0건
