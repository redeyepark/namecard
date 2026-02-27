---
id: SPEC-SOCIAL-SHARE-001
version: "1.0.0"
status: completed
created: "2026-02-27"
updated: "2026-02-27"
completed: "2026-02-27"
author: MoAI
priority: high
---

## HISTORY

| Version | Date       | Author | Description                        |
|---------|------------|--------|------------------------------------|
| 1.0.0   | 2026-02-27 | MoAI   | Initial SPEC creation              |
| 1.1.0   | 2026-02-27 | MoAI   | Implementation completed           |

---

# SPEC-SOCIAL-SHARE-001: 소셜 공유 기능 (KakaoTalk + Social Platforms)

## 요약

현재 명함 플랫폼은 PNG 내보내기와 URL 클립보드 복사만 제공합니다. 본 SPEC은 KakaoTalk Feed 메시지 공유, Facebook/Twitter/LinkedIn/LINE 등 소셜 플랫폼 공유, Web Share API 연동, 합성 이미지 생성, 그리고 동적 OG 이미지 최적화를 추가하여 명함의 소셜 배포를 완성합니다. SPEC-SHARE-001(PNG/JPEG 내보내기 메커니즘)과는 별도 스코프이며, 본 SPEC은 소셜 유통 채널에 집중합니다.

---

## Environment (환경)

- **프레임워크**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.x
- **스타일링**: Tailwind CSS 4.x
- **상태 관리**: Zustand 5.0.11 (persist middleware)
- **기존 내보내기**: html-to-image 1.11.13 (`toPng()`, `toBlob()`, pixelRatio: 2)
- **QR 코드**: qrcode 1.x (Canvas 기반, 클라이언트 사이드)
- **인증**: Supabase Auth (@supabase/ssr 0.8.0)
- **배포**: Cloudflare Workers (@opennextjs/cloudflare), Edge Runtime
- **대상 브라우저**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **외부 SDK**: Kakao JavaScript SDK (CDN, `https://t1.kakaocdn.net/kakao_js_sdk/`)
- **기존 컴포넌트**: ExportButton.tsx, QRCodeModal.tsx, ShareUrlDisplay.tsx, PublicCardView.tsx
- **기존 유틸리티**: `src/lib/export.ts`, `src/lib/qrcode.ts`, `src/lib/social-utils.ts`
- **OG 메타데이터**: `src/app/cards/[id]/page.tsx`의 `generateMetadata()` (illustrationUrl 기반)

## Assumptions (가정)

- Kakao JavaScript SDK는 공식 CDN에서만 로드 가능하며, npm 패키지는 존재하지 않는다.
- Kakao Developers Console에서 JavaScript 앱 키 발급 및 도메인 등록이 사전 완료된다.
- NEXT_PUBLIC_KAKAO_JS_KEY 환경변수가 배포 환경에 설정된다.
- KakaoTalk Feed 템플릿의 imageUrl은 공개 접근 가능한 URL이어야 한다 (illustrationUrl 또는 OG 이미지 URL).
- Web Share API는 92.48% 커버리지이며, Firefox Desktop에서는 미지원이다.
- `navigator.clipboard.write()` (이미지 복사)는 HTTPS 환경에서만 동작한다.
- 소셜 공유 URL 스키마(Facebook, Twitter, LinkedIn, LINE)는 별도의 API 키 없이 사용 가능하다.
- OG 이미지 생성은 Edge Runtime(Cloudflare Workers)과 호환되어야 한다.
- 비공개(private) 카드의 경우 소셜 공유 기능을 제한적으로 제공한다.
- 합성 이미지 생성은 기존 html-to-image의 `toBlob()` 출력을 재사용한다.
- 모든 소셜 공유는 클라이언트 사이드에서 처리되며, 추가 백엔드 API는 불필요하다 (OG 이미지 제외).

---

## Requirements (요구사항)

### Module 1: 공유 인프라 (Sharing Infrastructure)

#### REQ-U-100: ExportPanel 통합 UI (Ubiquitous)

시스템은 **항상** 기존 ExportButton의 단일 다운로드 기능과 새로운 소셜 공유 옵션을 통합된 ExportPanel UI에서 모두 제공해야 한다. ExportPanel은 데스크톱에서 드롭다운 메뉴, 모바일에서 바텀시트로 표시되어야 한다.

#### REQ-E-101: 합성 이미지 생성 (Event-Driven)

**WHEN** 사용자가 합성 이미지 공유 또는 다운로드를 요청 **THEN** 시스템은 Canvas API를 사용하여 앞면과 뒷면 이미지를 좌우로 배치(side-by-side)한 단일 이미지를 2x 해상도로 생성해야 한다.

#### REQ-E-102: Web Share API 공유 (Event-Driven)

**WHEN** 사용자가 "공유" 버튼을 클릭 **THEN** 시스템은 `navigator.share()`를 호출하여 명함 이미지와 공개 URL을 포함한 OS 네이티브 공유 시트를 표시해야 한다.

#### REQ-E-103: 클립보드 이미지 복사 (Event-Driven)

**WHEN** 사용자가 "이미지 복사" 버튼을 클릭 **THEN** 시스템은 `navigator.clipboard.write()`를 사용하여 현재 활성 면의 이미지를 PNG 형식으로 클립보드에 복사하고, toast 알림으로 복사 완료 피드백을 제공해야 한다.

#### REQ-S-101: Feature Detection 기반 UI 적응 (State-Driven)

**IF** 브라우저가 특정 API(Web Share, Clipboard write, Kakao SDK)를 지원하지 않는 경우 **THEN** 시스템은 해당 공유 옵션을 비활성화(disabled)하고 툴팁으로 미지원 안내 메시지를 표시해야 한다.

### Module 2: KakaoTalk 통합 (KakaoTalk Integration)

#### REQ-E-200: Kakao SDK 초기화 (Event-Driven)

**WHEN** 애플리케이션이 로드되고 NEXT_PUBLIC_KAKAO_JS_KEY가 설정된 경우 **THEN** 시스템은 Next.js Script 컴포넌트를 통해 Kakao JavaScript SDK를 CDN에서 비동기 로드하고, `Kakao.init()`으로 초기화해야 한다.

#### REQ-E-201: KakaoTalk Feed 메시지 공유 (Event-Driven)

**WHEN** 사용자가 "카카오톡으로 공유" 버튼을 클릭 **THEN** 시스템은 `Kakao.Share.sendDefault()`를 호출하여 다음 정보가 포함된 Feed 메시지를 전송해야 한다:
- objectType: 'feed'
- content.title: 사용자의 displayName
- content.description: 직함(title) + 해시태그
- content.imageUrl: illustrationUrl 또는 OG 이미지 URL
- content.link: 공개 카드 URL (`/cards/[id]`)
- buttons: [{title: '명함 보기', link: {webUrl, mobileWebUrl}}]

#### REQ-S-200: Kakao SDK 미사용 환경 처리 (State-Driven)

**IF** NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았거나 Kakao SDK 로드에 실패한 경우 **THEN** 시스템은 카카오톡 공유 버튼을 숨기거나 비활성화하고, 다른 공유 옵션에는 영향을 주지 않아야 한다.

### Module 3: 소셜 플랫폼 공유 (Social Platform Sharing)

#### REQ-E-300: Facebook 공유 (Event-Driven)

**WHEN** 사용자가 "Facebook으로 공유" 버튼을 클릭 **THEN** 시스템은 `https://facebook.com/sharer/sharer.php?u={encodedURL}`을 팝업 윈도우(600x400)로 열어야 한다.

#### REQ-E-301: Twitter/X 공유 (Event-Driven)

**WHEN** 사용자가 "X(Twitter)로 공유" 버튼을 클릭 **THEN** 시스템은 `https://twitter.com/intent/tweet?url={encodedURL}&text={encodedTitle}`을 팝업 윈도우로 열어야 한다.

#### REQ-E-302: LinkedIn 공유 (Event-Driven)

**WHEN** 사용자가 "LinkedIn으로 공유" 버튼을 클릭 **THEN** 시스템은 `https://linkedin.com/shareArticle?mini=true&url={encodedURL}&title={encodedTitle}`을 팝업 윈도우로 열어야 한다.

#### REQ-E-303: LINE 공유 (Event-Driven)

**WHEN** 사용자가 "LINE으로 공유" 버튼을 클릭 **THEN** 시스템은 `https://social-plugins.line.me/lineit/share?url={encodedURL}`을 팝업 윈도우로 열어야 한다.

#### REQ-E-304: 향상된 링크 복사 (Event-Driven)

**WHEN** 사용자가 "링크 복사" 버튼을 클릭 **THEN** 시스템은 공개 카드 URL을 클립보드에 복사하고, 시각적 toast 알림으로 "링크가 복사되었습니다" 피드백을 제공해야 한다.

### Module 4: OG 이미지 최적화 (OG Image Optimization)

#### REQ-E-400: 동적 OG 이미지 생성 (Event-Driven)

**WHEN** 소셜 플랫폼 크롤러가 공개 카드 URL을 요청 **THEN** 시스템은 Next.js의 opengraph-image 파일 규약 또는 API Route를 통해 1200x630px 크기의 동적 OG 이미지를 생성해야 한다.

#### REQ-S-400: 한글 폰트 지원 (State-Driven)

**IF** OG 이미지에 한글 텍스트가 포함되는 경우 **THEN** 시스템은 Noto Sans KR 또는 Nanum Myeongjo 폰트를 임베딩하여 한글이 정상 렌더링되어야 한다.

#### REQ-S-401: OG 이미지 캐싱 (State-Driven)

**IF** 동일한 카드의 OG 이미지가 반복 요청되는 경우 **THEN** 시스템은 revalidate 설정을 통해 캐싱하여 Edge Runtime에서의 응답 시간을 최적화해야 한다.

### Module 5: 안전장치 (Safeguards)

#### REQ-S-500: 비공개 카드 공유 제한 (State-Driven)

**IF** 카드가 비공개(private) 상태인 경우 **THEN** 시스템은 소셜 공유 버튼들을 비활성화하고, "이 카드는 비공개 상태입니다. 공유하려면 먼저 공개로 변경하세요."라는 안내 메시지를 표시해야 한다. 단, PNG 다운로드와 클립보드 이미지 복사는 허용한다.

#### REQ-N-500: 사용자 데이터 외부 전송 금지 (Unwanted)

시스템은 명함 데이터, 이미지, 연락처 정보를 공유 기능을 위해 자체 서버 외의 외부 서버로 전송**하지 않아야 한다**. 소셜 플랫폼으로는 공개 URL만 전달되며, 카드 데이터 자체는 전송되지 않는다.

#### REQ-O-500: 공유 분석 (Optional)

**가능하면** 각 소셜 플랫폼별 공유 횟수를 집계하여 관리자 대시보드에 표시하는 기능을 제공한다.

---

## Specifications (기술 명세)

### 1. Kakao JavaScript SDK 통합

#### SDK 로딩 전략

- Next.js `<Script>` 컴포넌트를 사용하여 CDN에서 로드
- `strategy="afterInteractive"` 설정으로 페이지 로드 차단 방지
- SDK URL: `https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js`
- `integrity` 속성으로 무결성 검증
- `onLoad` 콜백에서 `Kakao.init(NEXT_PUBLIC_KAKAO_JS_KEY)` 실행

#### KakaoTalk Feed 메시지 구조

```
Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: card.front.displayName,
    description: `${card.back.title} ${card.back.hashtags.map(h => '#' + h).join(' ')}`,
    imageUrl: illustrationUrl || ogImageUrl,
    link: {
      webUrl: publicCardUrl,
      mobileWebUrl: publicCardUrl,
    },
  },
  buttons: [
    {
      title: '명함 보기',
      link: {
        webUrl: publicCardUrl,
        mobileWebUrl: publicCardUrl,
      },
    },
  ],
});
```

#### TypeScript 타입 선언

- `src/types/kakao.d.ts` 파일에 Kakao SDK 전역 타입 정의
- `Kakao.init()`, `Kakao.isInitialized()`, `Kakao.Share.sendDefault()` 타입 선언

### 2. ExportPanel UI 아키텍처

#### 컴포넌트 구조

```
ExportPanel
  +-- ExportTriggerButton (기존 ExportButton 대체)
  +-- ExportDropdown (desktop) / ExportBottomSheet (mobile)
       +-- Section: 다운로드
       |    +-- "앞면 PNG 다운로드"
       |    +-- "뒷면 PNG 다운로드"
       |    +-- "합성 이미지 다운로드"
       +-- Section: 소셜 공유
       |    +-- KakaoShareButton
       |    +-- FacebookShareButton
       |    +-- TwitterShareButton
       |    +-- LinkedInShareButton
       |    +-- LineShareButton
       +-- Section: 기타
            +-- "이미지 복사" (Clipboard)
            +-- "링크 복사"
            +-- "공유" (Web Share API)
```

#### 반응형 전략

- 데스크톱 (>= 768px): 트리거 버튼 클릭 시 드롭다운 메뉴
- 모바일 (< 768px): 트리거 버튼 클릭 시 바텀시트 (slide-up)
- 미디어 쿼리 감지: `useMediaQuery` 커스텀 훅 또는 Tailwind `md:` breakpoint

### 3. 합성 이미지 생성 (Canvas API)

```
[Front Image]  ---  [Back Image]
   540px       20px     540px
   (2x = 1080px)  (40px)  (2x = 1080px)

Total canvas: 2200px x (card height * 2)
```

- html-to-image `toBlob()`으로 앞면/뒷면 각각 Blob 생성
- `createImageBitmap()` 또는 `Image()` 객체로 Blob을 이미지로 변환
- Canvas에 좌우로 배치 후 `canvas.toBlob('image/png')` 출력

### 4. 소셜 플랫폼 공유 유틸리티

#### URL 스키마 매핑

| 플랫폼    | URL Pattern                                                         | 팝업 크기    |
|-----------|---------------------------------------------------------------------|-------------|
| Facebook  | `https://facebook.com/sharer/sharer.php?u={URL}`                    | 600 x 400  |
| Twitter/X | `https://twitter.com/intent/tweet?url={URL}&text={TITLE}`          | 600 x 400  |
| LinkedIn  | `https://linkedin.com/shareArticle?mini=true&url={URL}&title={TITLE}` | 600 x 500  |
| LINE      | `https://social-plugins.line.me/lineit/share?url={URL}`            | 500 x 500  |

#### 팝업 윈도우 전략

- `window.open(url, '_blank', 'width=600,height=400,scrollbars=yes')` 사용
- 팝업 차단 감지: `window.open()` 반환값이 null인 경우 `window.location.href` 폴백

### 5. Feature Detection 유틸리티

```typescript
// src/lib/share-utils.ts
export function canShare(): boolean
export function canCopyImageToClipboard(): boolean
export function isKakaoAvailable(): boolean
export function openSharePopup(url: string, width: number, height: number): void
export function createCompositeImage(front: Blob, back: Blob): Promise<Blob>
```

### 6. OG 이미지 생성

- 파일 위치: `src/app/cards/[id]/opengraph-image.tsx` (Next.js 파일 규약)
- 크기: 1200 x 630px
- 내용: 카드 앞면 디자인 축소판 + displayName + title + 해시태그
- 폰트: Noto Sans KR (Google Fonts CDN에서 fetch)
- 캐싱: `revalidate: 3600` (1시간)
- Edge Runtime 호환: `@vercel/og` 또는 `next/og` ImageResponse 사용
- Cloudflare Workers 호환 여부 확인 필요 (대안: Supabase Edge Function)

### 7. Toast 알림 시스템

- 경량 toast 컴포넌트 (외부 라이브러리 미사용)
- 3초 자동 닫힘
- 하단 중앙 위치
- 복사 성공/실패, 공유 상태 피드백

---

## 기술적 제약사항

- **Kakao SDK**: CDN 전용, npm 미지원. Next.js `<Script>` 컴포넌트 사용 필수
- **Web Share API**: Firefox Desktop 미지원 (~92.48% 커버리지)
- **Clipboard Image API**: HTTPS 필수, Safari에서 `ClipboardItem` Promise 패턴 필요
- **클라이언트 사이드 전용**: 소셜 공유 로직은 서버 API 불필요 (OG 이미지 제외)
- **Edge Runtime 호환**: OG 이미지 생성은 Cloudflare Workers에서 동작해야 함
- **DB 변경 없음**: 추가 데이터베이스 테이블 불필요
- **기존 기능 보존**: ExportButton의 기존 PNG 다운로드 기능은 ExportPanel으로 마이그레이션 시 유지
- **비공개 카드**: public 상태가 아닌 카드는 소셜 공유 비활성화 (다운로드는 허용)
- **번들 크기**: Kakao SDK는 외부 CDN 로드이므로 번들에 미포함. 신규 코드는 5KB(gzip) 이내 목표
- **접근성**: 모든 새 UI 요소에 ARIA 속성 적용, 키보드 네비게이션 지원

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일 (예상)                                  | 테스트 시나리오  |
|-------------|--------------------------------------------------|-----------------|
| REQ-U-100   | `ExportPanel.tsx`, `ExportDropdown.tsx`           | AC-A-001        |
| REQ-E-101   | `src/lib/share-utils.ts` (createCompositeImage)  | AC-A-002        |
| REQ-E-102   | `src/lib/share-utils.ts` (webShare)              | AC-A-003        |
| REQ-E-103   | `src/lib/share-utils.ts` (copyImageToClipboard)  | AC-A-004        |
| REQ-S-101   | `src/lib/share-utils.ts` (feature detection)     | AC-A-005        |
| REQ-E-200   | `KakaoProvider.tsx`, `src/types/kakao.d.ts`      | AC-B-001        |
| REQ-E-201   | `KakaoShareButton.tsx`                           | AC-B-002        |
| REQ-S-200   | `KakaoProvider.tsx` (error handling)             | AC-B-003        |
| REQ-E-300   | `SocialShareButtons.tsx` (Facebook)              | AC-C-001        |
| REQ-E-301   | `SocialShareButtons.tsx` (Twitter)               | AC-C-002        |
| REQ-E-302   | `SocialShareButtons.tsx` (LinkedIn)              | AC-C-003        |
| REQ-E-303   | `SocialShareButtons.tsx` (LINE)                  | AC-C-004        |
| REQ-E-304   | `SocialShareButtons.tsx` (Link Copy)             | AC-C-005        |
| REQ-E-400   | `src/app/cards/[id]/opengraph-image.tsx`         | AC-D-001        |
| REQ-S-400   | `opengraph-image.tsx` (Korean font)              | AC-D-002        |
| REQ-S-401   | `opengraph-image.tsx` (revalidate)               | AC-D-003        |
| REQ-S-500   | `ExportPanel.tsx` (private card guard)           | AC-E-001        |
| REQ-N-500   | All sharing modules                              | AC-E-002        |
| REQ-O-500   | Future (analytics)                               | -               |
