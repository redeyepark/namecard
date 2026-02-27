---
id: SPEC-SOCIAL-SHARE-001
type: plan
version: "1.0.0"
spec-ref: SPEC-SOCIAL-SHARE-001/spec.md
---

# SPEC-SOCIAL-SHARE-001: 구현 계획

## 개요

소셜 공유 기능을 4개 Phase(A, B, C, D)로 분할하여 점진적으로 구현합니다. 각 Phase는 독립적으로 테스트 및 배포 가능하며, 선행 Phase의 인프라를 재사용합니다.

---

## Phase 분류 및 우선순위

| Phase | 이름                     | 우선순위   | 복잡도 | 의존성         |
|-------|--------------------------|-----------|--------|---------------|
| A     | Sharing Infrastructure   | Primary   | Medium | 없음           |
| B     | KakaoTalk Integration    | Primary   | Medium | Phase A       |
| C     | Social Platform Sharing  | Secondary | Low    | Phase A       |
| D     | OG Image Optimization    | Secondary | High   | 없음 (독립)    |

---

## Phase A: Sharing Infrastructure (공유 인프라)

### 목표

기존 ExportButton을 ExportPanel로 교체하고, 합성 이미지 생성 / Web Share API / Clipboard 이미지 복사 / Feature Detection 유틸리티를 구축합니다.

### 태스크 분해

**A-1: Feature Detection 유틸리티 (`src/lib/share-utils.ts`)**

- `canShare()`: `navigator.share` 존재 여부 + HTTPS 확인
- `canCopyImageToClipboard()`: `navigator.clipboard.write` + `ClipboardItem` 존재 여부
- `isKakaoAvailable()`: `window.Kakao?.isInitialized()` 확인
- `openSharePopup(url, width, height)`: `window.open()` + 팝업 차단 감지
- `createCompositeImage(front, back)`: Canvas API 합성 로직

**A-2: 합성 이미지 생성 함수**

- `toBlob()` 으로 앞면/뒷면 각각 Blob 생성
- `createImageBitmap()` 또는 `new Image()` + `onload` 로 Blob -> Image 변환
- OffscreenCanvas 또는 `document.createElement('canvas')` 에서 좌우 배치
- 2x 해상도(pixelRatio: 2) 적용
- `canvas.toBlob('image/png')` 으로 결과물 출력

**A-3: Toast 알림 컴포넌트 (`src/components/ui/Toast.tsx`)**

- Context 기반 전역 toast 시스템
- `useToast()` 훅 제공
- 3초 자동 닫힘, 하단 중앙 배치
- 성공/에러/정보 3가지 variant

**A-4: ExportPanel UI 컴포넌트**

- `ExportPanel.tsx`: 메인 컨테이너, 트리거 버튼 포함
- `ExportDropdown.tsx`: 데스크톱 드롭다운 (>= 768px)
- `ExportBottomSheet.tsx`: 모바일 바텀시트 (< 768px)
- 반응형 전환: CSS 미디어 쿼리 또는 `useMediaQuery` 훅
- 기존 ExportButton의 앞면/뒷면 PNG 다운로드 기능 유지
- 각 메뉴 항목에 아이콘 + 설명 텍스트
- Feature detection에 따른 조건부 렌더링

**A-5: ExportButton 마이그레이션**

- 기존 `ExportButton.tsx` import를 `ExportPanel`로 교체
- 기존 기능(앞면/뒷면 개별 PNG 다운로드) 동작 검증
- 기존 ExportButton 파일은 deprecated 마크 후 보존

### 기술 스택

| 기술            | 용도                        | 버전     |
|-----------------|-----------------------------|----------|
| html-to-image   | DOM -> Blob 변환            | 1.11.13  |
| Canvas API      | 합성 이미지 생성            | Native   |
| Clipboard API   | 이미지 클립보드 복사        | Native   |
| Web Share API   | OS 네이티브 공유            | Native   |

### 변경 파일 목록

| 구분   | 파일 경로                                           | 설명                            |
|--------|----------------------------------------------------|---------------------------------|
| 신규   | `src/lib/share-utils.ts`                           | Feature detection + 유틸리티     |
| 신규   | `src/components/ui/Toast.tsx`                      | Toast 알림 컴포넌트              |
| 신규   | `src/components/ui/ToastProvider.tsx`               | Toast Context Provider           |
| 신규   | `src/components/export/ExportPanel.tsx`             | 통합 내보내기/공유 패널          |
| 신규   | `src/components/export/ExportDropdown.tsx`          | 데스크톱 드롭다운                |
| 신규   | `src/components/export/ExportBottomSheet.tsx`       | 모바일 바텀시트                  |
| 수정   | `src/lib/export.ts`                                | `toBlob()` 래퍼 함수 추가        |
| 수정   | `src/app/layout.tsx`                               | ToastProvider 추가               |
| 수정   | ExportButton 사용처                                 | ExportPanel로 교체               |

---

## Phase B: KakaoTalk Integration (카카오톡 통합)

### 목표

Kakao JavaScript SDK를 로드하고, KakaoTalk Feed 메시지 공유 기능을 구현합니다.

### 태스크 분해

**B-1: Kakao SDK TypeScript 타입 선언 (`src/types/kakao.d.ts`)**

- `Kakao.init(appKey: string)` 타입
- `Kakao.isInitialized()` 타입
- `Kakao.Share.sendDefault(settings: KakaoFeedSettings)` 타입
- `KakaoFeedSettings` 인터페이스 정의 (objectType, content, buttons)
- `Window` 인터페이스 확장: `Kakao` 프로퍼티 추가

**B-2: KakaoProvider 컴포넌트 (`src/components/providers/KakaoProvider.tsx`)**

- Next.js `<Script>` 컴포넌트로 SDK CDN 로드
- `strategy="afterInteractive"` 설정
- `onLoad` 콜백에서 `Kakao.init()` 실행
- `integrity` 속성으로 CDN 무결성 검증
- React Context로 SDK 상태 공유 (`isLoaded`, `isInitialized`, `error`)
- `useKakao()` 훅 제공

**B-3: KakaoShareButton 컴포넌트**

- `useKakao()` 훅으로 SDK 상태 확인
- `Kakao.Share.sendDefault()` 호출 로직
- Feed 템플릿 구성:
  - title: `card.front.displayName`
  - description: `card.back.title` + 해시태그 (`#` prefix)
  - imageUrl: `illustrationUrl` || OG 이미지 URL
  - link: 공개 카드 URL (`/cards/{id}`)
  - buttons: '명함 보기' 버튼
- SDK 미초기화 시 disabled 상태
- 에러 핸들링: try-catch + toast 알림

**B-4: 환경 변수 설정**

- `.env.local`에 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가
- `.env.example` 업데이트
- Cloudflare Workers 환경변수 설정 가이드

### 기술 스택

| 기술                | 용도                      | 버전        |
|---------------------|---------------------------|-------------|
| Kakao JS SDK        | KakaoTalk 공유 API        | 2.7.4 (CDN) |
| Next.js Script      | SDK 비동기 로드           | 16.1.6      |

### 변경 파일 목록

| 구분   | 파일 경로                                            | 설명                            |
|--------|-----------------------------------------------------|---------------------------------|
| 신규   | `src/types/kakao.d.ts`                              | Kakao SDK TypeScript 타입       |
| 신규   | `src/components/providers/KakaoProvider.tsx`         | SDK 로더 + Context Provider     |
| 신규   | `src/components/export/KakaoShareButton.tsx`         | 카카오톡 공유 버튼               |
| 수정   | `src/app/layout.tsx`                                | KakaoProvider 추가               |
| 수정   | `src/components/export/ExportPanel.tsx`              | KakaoShareButton 통합           |
| 신규   | `.env.example`                                      | KAKAO_JS_KEY 항목 추가           |

---

## Phase C: Social Platform Sharing (소셜 플랫폼 공유)

### 목표

Facebook, Twitter/X, LinkedIn, LINE 공유 버튼과 향상된 링크 복사 기능을 구현합니다.

### 태스크 분해

**C-1: 소셜 공유 유틸리티 (`src/lib/social-share.ts`)**

- `shareFacebook(url: string)`: Facebook 팝업 공유
- `shareTwitter(url: string, text: string)`: Twitter 팝업 공유
- `shareLinkedIn(url: string, title: string)`: LinkedIn 팝업 공유
- `shareLine(url: string)`: LINE 팝업 공유
- 공통 `openSharePopup()` 함수 재사용 (Phase A에서 구현)
- URL은 `encodeURIComponent()` 처리

**C-2: SocialShareButtons 컴포넌트**

- 각 플랫폼별 아이콘 버튼 (SVG inline)
- Grid 레이아웃 (2열 또는 3열)
- 플랫폼별 브랜드 색상 hover 효과
- `isPublic` prop에 따른 비활성화 처리
- 비공개 카드 경고 메시지 표시

**C-3: 향상된 링크 복사**

- 기존 `ShareUrlDisplay` 로직 재사용
- Toast 피드백 통합 (Phase A의 Toast 시스템)
- 복사 성공: "링크가 복사되었습니다"
- 복사 실패: "복사에 실패했습니다. 직접 복사해주세요."

**C-4: ExportPanel 통합**

- SocialShareButtons를 ExportPanel의 "소셜 공유" 섹션에 배치
- 비공개 카드 가드 로직 통합
- 각 버튼의 aria-label 한국어 설정

### 기술 스택

| 기술         | 용도                     | 버전   |
|--------------|--------------------------|--------|
| window.open  | 팝업 윈도우 공유         | Native |
| Clipboard API| 링크 텍스트 복사         | Native |

### 변경 파일 목록

| 구분   | 파일 경로                                             | 설명                              |
|--------|------------------------------------------------------|-----------------------------------|
| 신규   | `src/lib/social-share.ts`                            | 소셜 플랫폼 공유 유틸리티          |
| 신규   | `src/components/export/SocialShareButtons.tsx`        | 소셜 플랫폼 버튼 그리드            |
| 수정   | `src/components/export/ExportPanel.tsx`               | SocialShareButtons 통합           |

---

## Phase D: OG Image Optimization (OG 이미지 최적화)

### 목표

소셜 플랫폼에서 공유 시 표시되는 OG 이미지를 동적으로 생성하여 공유 시각적 품질을 향상합니다.

### 태스크 분해

**D-1: 동적 OG 이미지 생성기**

- 파일: `src/app/cards/[id]/opengraph-image.tsx` (Next.js 파일 규약)
- 또는 `src/app/api/og/[id]/route.tsx` (API Route 방식, Edge Runtime 호환성 우선)
- `ImageResponse` (next/og) 사용
- 크기: 1200 x 630px
- 레이아웃:
  - 좌측: 카드 일러스트레이션 축소판 (400x400)
  - 우측: displayName (32px bold), title (20px), 해시태그 (16px, muted)
  - 하단: 브랜드 로고/텍스트
- 배경: 그라데이션 또는 카드 테마 색상 기반

**D-2: 한글 폰트 임베딩**

- Noto Sans KR 폰트 파일을 fetch로 로드
- Google Fonts CDN 또는 프로젝트 내 `public/fonts/` 에서 제공
- `ImageResponse` 옵션의 `fonts` 배열에 등록
- 폰트 서브셋: Regular(400) + Bold(700)
- Edge Runtime 메모리 제한 고려하여 WOFF2 포맷 사용

**D-3: 캐싱 전략**

- `revalidate: 3600` (1시간) 설정
- 카드 데이터 변경 시 on-demand revalidation 고려
- Cloudflare CDN 캐시와 연동
- Content-Type: `image/png`

**D-4: Cloudflare Workers 호환성 검증**

- `next/og`의 `ImageResponse`가 @opennextjs/cloudflare에서 동작하는지 검증
- 미지원 시 대안:
  - Supabase Edge Function으로 OG 이미지 생성
  - 정적 이미지 + 동적 텍스트 오버레이
  - Cloudflare Workers용 Satori 직접 사용
- illustrationUrl이 없는 카드: 기본 OG 이미지 템플릿 사용

**D-5: 기존 OG 메타데이터 업데이트**

- `src/app/cards/[id]/page.tsx`의 `generateMetadata()` 수정
- `openGraph.images`를 동적 OG 이미지 URL로 업데이트
- Twitter Card `images`도 동일하게 업데이트
- 기존 `illustrationUrl` 폴백 유지

### 기술 스택

| 기술            | 용도                      | 버전        |
|-----------------|---------------------------|-------------|
| next/og         | OG 이미지 생성            | Next.js 내장 |
| Satori          | JSX -> SVG 변환           | next/og 내장 |
| Noto Sans KR    | 한글 폰트 렌더링          | Google Fonts |

### 변경 파일 목록

| 구분   | 파일 경로                                              | 설명                             |
|--------|-------------------------------------------------------|----------------------------------|
| 신규   | `src/app/cards/[id]/opengraph-image.tsx`              | 동적 OG 이미지 생성기             |
| 신규   | `public/fonts/NotoSansKR-Regular.woff2` (또는 fetch)  | 한글 폰트 파일                    |
| 수정   | `src/app/cards/[id]/page.tsx`                         | OG 메타데이터 업데이트            |

---

## 리스크 분석 및 대응

### 리스크 1: Kakao SDK CDN 가용성

- **영향**: SDK 로드 실패 시 카카오톡 공유 불가
- **확률**: Low
- **대응**: `onError` 콜백 + 타임아웃(5초) 처리. SDK 로드 실패 시 카카오톡 버튼 숨김. 다른 공유 옵션에 영향 없음

### 리스크 2: OG 이미지 Edge Runtime 호환성

- **영향**: Cloudflare Workers에서 `next/og` ImageResponse 미지원 가능
- **확률**: Medium
- **대응**: Phase D 착수 전 호환성 사전 검증. 미지원 시 Supabase Edge Function 또는 Satori 직접 사용으로 전환

### 리스크 3: Web Share API 팝업 차단

- **영향**: 일부 브라우저에서 `navigator.share()` 호출 차단
- **확률**: Low (사용자 제스처 내에서 호출하면 안전)
- **대응**: 반드시 click 이벤트 핸들러 내에서 호출. 비동기 작업 후 호출 시 사용자 제스처 컨텍스트 유실 주의

### 리스크 4: Safari Clipboard API 제약

- **영향**: Safari에서 `ClipboardItem`에 Promise를 전달해야 하는 비표준 요구사항
- **확률**: High (Safari 특성)
- **대응**: Safari 감지 후 `ClipboardItem` 생성자에 Promise<Blob> 전달 패턴 적용

### 리스크 5: 비공개 카드 소셜 공유 시 404

- **영향**: 비공개 카드 URL을 소셜 플랫폼이 크롤링 시 404 반환
- **확률**: Medium (사용자 실수)
- **대응**: 비공개 카드의 소셜 공유 버튼 비활성화 + 공개 전환 안내 메시지

---

## 전체 변경 파일 요약

### 신규 파일 (13개)

| 파일 경로                                            | Phase | 설명                            |
|------------------------------------------------------|-------|---------------------------------|
| `src/lib/share-utils.ts`                             | A     | Feature detection + 유틸리티     |
| `src/components/ui/Toast.tsx`                        | A     | Toast 알림 컴포넌트              |
| `src/components/ui/ToastProvider.tsx`                 | A     | Toast Context Provider           |
| `src/components/export/ExportPanel.tsx`               | A     | 통합 내보내기/공유 패널          |
| `src/components/export/ExportDropdown.tsx`            | A     | 데스크톱 드롭다운                |
| `src/components/export/ExportBottomSheet.tsx`         | A     | 모바일 바텀시트                  |
| `src/types/kakao.d.ts`                               | B     | Kakao SDK TypeScript 타입       |
| `src/components/providers/KakaoProvider.tsx`          | B     | Kakao SDK Provider               |
| `src/components/export/KakaoShareButton.tsx`          | B     | 카카오톡 공유 버튼               |
| `src/lib/social-share.ts`                            | C     | 소셜 플랫폼 공유 유틸리티        |
| `src/components/export/SocialShareButtons.tsx`        | C     | 소셜 플랫폼 버튼 그리드          |
| `src/app/cards/[id]/opengraph-image.tsx`             | D     | 동적 OG 이미지 생성기            |
| `.env.example`                                       | B     | 환경변수 예시 업데이트           |

### 수정 파일 (4개)

| 파일 경로                                  | Phase   | 변경 내용                          |
|--------------------------------------------|---------|-----------------------------------|
| `src/lib/export.ts`                        | A       | `toBlob()` 래퍼 함수 추가          |
| `src/app/layout.tsx`                       | A, B    | ToastProvider + KakaoProvider 추가 |
| ExportButton 사용처                         | A       | ExportPanel로 교체                 |
| `src/app/cards/[id]/page.tsx`              | D       | OG 메타데이터 업데이트             |

---

## 구현 순서 권장사항

1. **Phase A + C 병렬 가능**: Phase A의 share-utils.ts 완성 후 Phase C는 독립적으로 진행 가능
2. **Phase B는 Phase A 이후**: ExportPanel UI가 완성된 후 KakaoShareButton을 통합
3. **Phase D는 독립**: OG 이미지 생성은 다른 Phase와 무관하게 진행 가능하나, Cloudflare Workers 호환성 검증이 선행되어야 함
4. **최소 실행 가능 범위**: Phase A만으로도 합성 이미지 + Web Share + 클립보드 복사 등 핵심 공유 기능 제공 가능

---

## 전문가 상담 권장사항

- **expert-frontend**: ExportPanel UI 설계 (드롭다운/바텀시트 반응형 전환, 애니메이션)
- **expert-frontend**: OG 이미지 Satori/ImageResponse 레이아웃 구현
- **expert-backend**: Cloudflare Workers에서 `next/og` 호환성 검증 및 대안 아키텍처
