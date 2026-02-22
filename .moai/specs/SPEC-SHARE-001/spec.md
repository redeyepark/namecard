---
id: SPEC-SHARE-001
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
author: MoAI
priority: medium
---

## HISTORY

| Version | Date       | Author | Description          |
|---------|------------|--------|----------------------|
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation |

---

# SPEC-SHARE-001: 내보내기 확장 및 공유 기능

## 요약

현재 명함 편집기는 앞면/뒷면을 개별 PNG 파일로 다운로드하는 기능만 제공합니다. 본 SPEC은 내보내기 기능을 확장하여 앞면+뒷면 합성 이미지 다운로드, 클립보드 복사, Web Share API 기반 공유, QR 코드 생성 기능을 추가합니다. 모든 기능은 클라이언트 사이드에서만 동작하며, 외부 서버로 사용자 데이터를 전송하지 않습니다.

---

## Environment (환경)

- **프레임워크**: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.x
- **스타일링**: Tailwind CSS 4.x
- **상태 관리**: Zustand 5.0.11 (persist middleware)
- **기존 내보내기**: html-to-image 1.11.13 (`toPng()`, pixelRatio: 2)
- **대상 브라우저**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **배포**: Cloudflare Workers (@opennextjs/cloudflare)
- **아키텍처**: Cloudflare Workers + Supabase 백엔드

## Assumptions (가정)

- 사용자는 모던 브라우저(Canvas API, Clipboard API, Web Share API 지원)를 사용한다.
- html-to-image 라이브러리의 `toPng()` 및 `toBlob()` 함수가 안정적으로 동작한다.
- 명함 앞면(`#card-front`)과 뒷면(`#card-back`) DOM 요소가 항상 존재한다.
- QR 코드에 포함할 연락처 정보는 기존 Zustand store의 `CardData`에서 추출할 수 있다.
- Web Share API와 Clipboard API가 지원되지 않는 브라우저에서는 대체 동작(fallback)을 제공해야 한다.

---

## Requirements (요구사항)

### REQ-U-001: 개별 및 합성 다운로드 옵션 제공 (Ubiquitous)

시스템은 **항상** 기존 개별 다운로드(앞면/뒷면 PNG)와 새로운 합성 다운로드(앞면+뒷면 결합 이미지) 옵션을 모두 제공해야 한다.

### REQ-E-001: 합성 이미지 다운로드 (Event-Driven)

**WHEN** 사용자가 "합성 이미지 다운로드" 버튼을 클릭 **THEN** 시스템은 앞면과 뒷면 이미지를 Canvas API를 사용하여 좌우로 배치한 단일 이미지를 생성하고, `namecard-composite.png` 파일로 다운로드를 실행해야 한다.

### REQ-E-002: 클립보드 복사 (Event-Driven)

**WHEN** 사용자가 "클립보드에 복사" 버튼을 클릭 **THEN** 시스템은 현재 활성화된 면(앞면 또는 뒷면)의 이미지를 `navigator.clipboard.write()`를 사용하여 클립보드에 PNG 형식으로 복사하고, 복사 완료 피드백(toast 또는 버튼 상태 변경)을 표시해야 한다.

### REQ-E-003: Web Share API 공유 (Event-Driven)

**WHEN** 사용자가 "공유" 버튼을 클릭 **THEN** 시스템은 `navigator.share()`를 호출하여 현재 활성화된 면의 이미지를 파일로 공유할 수 있는 OS 네이티브 공유 시트를 표시해야 한다.

### REQ-E-004: QR 코드 생성 (Event-Driven)

**WHEN** 사용자가 "QR 코드 생성" 버튼을 클릭 **THEN** 시스템은 명함 뒷면의 연락처 정보(이름, 직함, 소셜 링크)를 기반으로 vCard 형식의 QR 코드를 클라이언트 사이드에서 생성하고, 화면에 표시하며 PNG로 다운로드할 수 있는 옵션을 제공해야 한다.

### REQ-S-001: Web Share API Fallback (State-Driven)

**IF** 브라우저가 `navigator.share`를 지원하지 않는 경우 **THEN** "공유" 버튼을 비활성화(disabled)하고, 대신 "클립보드에 복사" 버튼을 대체 옵션으로 강조 표시해야 한다.

### REQ-S-002: Clipboard API Fallback (State-Driven)

**IF** 브라우저가 `navigator.clipboard.write()`를 지원하지 않는 경우 **THEN** "클립보드에 복사" 버튼을 비활성화하고, 툴팁으로 "이 브라우저에서는 클립보드 복사를 지원하지 않습니다"라는 안내 메시지를 표시해야 한다.

### REQ-N-001: 외부 서버 데이터 전송 금지 (Unwanted)

시스템은 명함 데이터, 이미지, 연락처 정보를 외부 서버로 전송**하지 않아야 한다**. 모든 내보내기 및 공유 기능은 클라이언트 사이드에서만 처리되어야 한다.

### REQ-O-001: JPEG 내보내기 (Optional)

**가능하면** PNG 외에 JPEG 형식의 내보내기 옵션을 제공하여, 파일 크기를 줄이고 싶은 사용자에게 선택권을 제공한다.

### REQ-O-002: 해상도 선택 (Optional)

**가능하면** 1x(표준), 2x(고화질), 3x(최고화질) 해상도 옵션을 제공하여, 사용자가 용도에 따라 출력 해상도를 선택할 수 있도록 한다.

---

## Specifications (기술 명세)

### 아키텍처 설계

#### 1. 합성 이미지 생성 (Canvas API)

- html-to-image의 `toBlob()` 또는 `toPng()`로 앞면/뒷면 이미지를 각각 생성
- Canvas API를 사용하여 두 이미지를 좌우로 배치 (gap 포함)
- Canvas의 `toBlob('image/png')`으로 합성 이미지 Blob 생성
- Blob을 `URL.createObjectURL()`로 변환하여 다운로드 실행

```
[Front Image] --- gap --- [Back Image]
     540px       20px        540px
```

- 합성 이미지 크기: (카드 너비 x 2 + gap) x 카드 높이 (pixelRatio 적용)

#### 2. 클립보드 복사 (Clipboard API)

- `toBlob()` 함수로 현재 활성 면의 이미지 Blob 생성
- `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` 호출
- 성공/실패에 따른 사용자 피드백 제공

#### 3. Web Share API 공유

- `navigator.canShare` 또는 `navigator.share` 존재 여부로 feature detection
- `toBlob()`으로 이미지 Blob 생성 후 `File` 객체로 변환
- `navigator.share({ files: [file], title: 'My Namecard' })` 호출

#### 4. QR 코드 생성

- `qrcode` 라이브러리 (클라이언트 사이드, Canvas 기반) 사용
- Zustand store에서 연락처 데이터 추출하여 vCard 문자열 생성
- vCard 3.0 형식: `BEGIN:VCARD`, `VERSION:3.0`, `FN:`, `TITLE:`, `URL:`, `END:VCARD`
- Canvas에 QR 코드 렌더링 후 다운로드 옵션 제공

#### 5. UI 구성: ExportPanel

- 기존 `ExportButton` 단일 버튼을 `ExportPanel` 드롭다운/모달로 확장
- 메뉴 항목:
  - "앞면 PNG 다운로드"
  - "뒷면 PNG 다운로드"
  - "합성 이미지 다운로드"
  - "클립보드에 복사" (활성 면)
  - "공유" (Web Share API)
  - "QR 코드 생성"
- 각 항목에 아이콘 및 설명 텍스트 포함
- 반응형 디자인: 모바일에서는 바텀 시트, 데스크톱에서는 드롭다운

### 기술적 제약사항

- **클라이언트 사이드 전용**: 외부 API 호출 금지, 모든 처리는 브라우저에서 수행
- **Feature Detection**: `navigator.clipboard.write`, `navigator.share` 등 브라우저 API는 사용 전 반드시 존재 여부 확인
- **Graceful Degradation**: 지원되지 않는 브라우저에서는 해당 기능 비활성화 및 대체 안내 제공
- **개인정보 보호**: 사용자 데이터(명함 내용, 이미지)는 외부로 전송되지 않음
- **번들 크기**: QR 코드 라이브러리 추가 시 번들 크기 증가를 최소화 (경량 라이브러리 선택)
- **접근성**: 모든 새 UI 요소에 ARIA 속성 적용, 키보드 네비게이션 지원

### Traceability (추적성)

| 요구사항 ID | 구현 파일 (예상)                              | 테스트 시나리오    |
|-------------|----------------------------------------------|-------------------|
| REQ-U-001   | `ExportPanel.tsx`                            | AC-001            |
| REQ-E-001   | `src/lib/export.ts` (compositeExport)        | AC-002            |
| REQ-E-002   | `src/lib/export.ts` (clipboardCopy)          | AC-003            |
| REQ-E-003   | `src/lib/export.ts` (webShare)               | AC-004            |
| REQ-E-004   | `src/lib/qrcode.ts`, `QRCodeModal.tsx`       | AC-005            |
| REQ-S-001   | `ExportPanel.tsx` (feature detection)        | AC-006            |
| REQ-S-002   | `ExportPanel.tsx` (feature detection)        | AC-007            |
| REQ-N-001   | All export modules                           | AC-008            |
| REQ-O-001   | `src/lib/export.ts` (jpegExport)             | EC-001            |
| REQ-O-002   | `ExportPanel.tsx` (resolution selector)      | EC-002            |
