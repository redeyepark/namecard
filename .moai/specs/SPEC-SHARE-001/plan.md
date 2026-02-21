---
id: SPEC-SHARE-001
document: plan
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-SHARE-001: 구현 계획

## 개요

현재 개별 PNG 다운로드만 지원하는 내보내기 기능을 합성 이미지, 클립보드 복사, Web Share API, QR 코드 생성으로 확장합니다. 기존 `ExportButton` 컴포넌트를 `ExportPanel`로 교체하여 다양한 내보내기 옵션을 제공합니다.

---

## Phase 1: Export 유틸리티 확장 (Primary Goal)

### 목표

기존 `src/lib/export.ts`를 확장하여 합성 이미지 생성 및 다양한 포맷 내보내기 기능 추가

### 작업 항목

1. **`toImageBlob()` 함수 추가**
   - html-to-image의 `toBlob()` 래퍼 함수
   - pixelRatio 옵션 지원 (1x, 2x, 3x)
   - PNG/JPEG 포맷 선택 지원

2. **`exportCompositeImage()` 함수 추가**
   - 앞면/뒷면 이미지를 각각 `toPng()`으로 생성
   - Canvas API로 두 이미지를 좌우 배치 (20px gap)
   - Canvas `toBlob('image/png')`으로 합성 Blob 생성
   - `URL.createObjectURL()` + `<a>` 태그로 다운로드 실행

3. **기존 `exportCardAsPng()` 리팩터링**
   - `toImageBlob()`을 내부적으로 활용하도록 변경
   - JPEG 포맷 옵션 파라미터 추가 (Optional: REQ-O-001)

### 예상 영향 파일

- `src/lib/export.ts` (수정 및 확장)

### 의존성

- html-to-image (기존 설치됨)
- Canvas API (브라우저 내장)

---

## Phase 2: ExportPanel UI 컴포넌트 (Primary Goal)

### 목표

기존 `ExportButton`을 대체하는 `ExportPanel` 드롭다운 UI 구현

### 작업 항목

1. **`ExportPanel.tsx` 컴포넌트 생성**
   - 트리거 버튼 + 드롭다운 메뉴 구조
   - 메뉴 항목: 앞면 다운로드, 뒷면 다운로드, 합성 이미지 다운로드, 클립보드 복사, 공유, QR 코드
   - 각 항목에 아이콘 및 설명 텍스트

2. **드롭다운 동작 구현**
   - 클릭으로 열기/닫기
   - 바깥 영역 클릭 시 닫기
   - Escape 키로 닫기
   - 키보드 네비게이션 (Arrow Up/Down, Enter)

3. **반응형 디자인**
   - 데스크톱: 드롭다운 메뉴
   - 모바일: 바텀 시트 또는 전체 너비 드롭다운

4. **접근성**
   - `role="menu"`, `role="menuitem"` ARIA 속성
   - `aria-expanded`, `aria-haspopup` 상태 관리
   - focus trap 및 focus management

5. **기존 ExportButton 교체**
   - `ExportButton.tsx`를 `ExportPanel.tsx`로 교체
   - 기존 사용처 업데이트

### 예상 영향 파일

- `src/components/export/ExportPanel.tsx` (신규)
- `src/components/export/ExportButton.tsx` (제거 또는 ExportPanel로 교체)
- ExportButton을 사용하는 부모 컴포넌트 (수정)

### 의존성

- Phase 1 (Export 유틸리티) 완료 필요

---

## Phase 3: 클립보드 복사 기능 (Primary Goal)

### 목표

Clipboard API를 활용한 이미지 클립보드 복사 기능 구현

### 작업 항목

1. **`copyToClipboard()` 함수 추가** (`src/lib/export.ts`)
   - `toBlob()`으로 현재 활성 면 이미지 Blob 생성
   - `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` 호출
   - Promise 기반 성공/실패 반환

2. **Feature Detection 유틸리티**
   - `canCopyToClipboard()`: `navigator.clipboard?.write` 존재 여부 확인
   - `canShare()`: `navigator.share` 존재 여부 확인
   - `src/lib/feature-detection.ts` 유틸리티 파일 생성

3. **사용자 피드백 UI**
   - 복사 성공: 버튼 텍스트 일시적 변경 ("Copied!" -> 2초 후 원복)
   - 복사 실패: 에러 메시지 표시

### 예상 영향 파일

- `src/lib/export.ts` (수정)
- `src/lib/feature-detection.ts` (신규)
- `src/components/export/ExportPanel.tsx` (수정)

### 의존성

- Clipboard API (브라우저 내장)
- Phase 1, Phase 2 완료 필요

---

## Phase 4: Web Share API 통합 (Secondary Goal)

### 목표

OS 네이티브 공유 기능을 통한 명함 이미지 공유

### 작업 항목

1. **`shareImage()` 함수 추가** (`src/lib/export.ts`)
   - `toBlob()`으로 이미지 Blob 생성
   - `new File([blob], 'namecard.png', { type: 'image/png' })` 파일 객체 생성
   - `navigator.share({ files: [file], title: 'My Namecard' })` 호출

2. **Feature Detection 적용**
   - `navigator.share` 미지원 시 공유 버튼 비활성화
   - `navigator.canShare({ files: [...] })` 사전 검증

3. **Fallback 처리** (REQ-S-001)
   - Web Share 미지원 시 클립보드 복사로 대체 안내
   - 툴팁 또는 안내 메시지 표시

### 예상 영향 파일

- `src/lib/export.ts` (수정)
- `src/components/export/ExportPanel.tsx` (수정)

### 의존성

- Web Share API (브라우저 내장)
- Phase 3 완료 필요 (Fallback에 클립보드 복사 활용)

---

## Phase 5: QR 코드 생성 (Secondary Goal)

### 목표

명함 연락처 정보를 vCard QR 코드로 변환하여 제공

### 작업 항목

1. **`qrcode` 라이브러리 설치**
   - `npm install qrcode` (클라이언트 사이드 Canvas 기반)
   - `npm install -D @types/qrcode` (TypeScript 타입)

2. **`src/lib/qrcode.ts` 유틸리티 생성**
   - `generateVCard()`: Zustand store 데이터에서 vCard 3.0 문자열 생성
   - `generateQRCodeDataUrl()`: vCard 문자열을 QR 코드 Data URL로 변환

3. **`QRCodeModal.tsx` 컴포넌트 생성**
   - QR 코드 이미지 표시
   - "PNG로 다운로드" 버튼
   - 모달 닫기 버튼
   - 접근성: `role="dialog"`, `aria-modal="true"`, focus trap

4. **vCard 데이터 매핑**
   - `FN:` -> store의 fullName
   - `TITLE:` -> store의 title
   - `URL:` -> store의 socialLinks 각 항목
   - `NOTE:` -> store의 hashtags (comma-separated)

### 예상 영향 파일

- `src/lib/qrcode.ts` (신규)
- `src/components/export/QRCodeModal.tsx` (신규)
- `src/components/export/ExportPanel.tsx` (수정)
- `package.json` (qrcode 라이브러리 추가)

### 의존성

- `qrcode` npm 패키지 (신규 설치)
- Phase 2 완료 필요 (ExportPanel에서 QR 코드 메뉴 항목)

---

## Phase 6: 브라우저 호환성 및 마무리 (Final Goal)

### 목표

브라우저 호환성 확보, 에러 처리 강화, 최종 통합 테스트

### 작업 항목

1. **브라우저 호환성 테스트**
   - Chrome, Firefox, Safari, Edge에서 각 기능 동작 확인
   - iOS Safari의 Web Share API 동작 확인
   - Firefox의 Clipboard API 제한 사항 대응

2. **에러 처리 강화**
   - 내보내기 실패 시 사용자 친화적 에러 메시지
   - 네트워크 오프라인 상태에서의 동작 확인
   - 대용량 이미지(고해상도 아바타) 처리 시 메모리 이슈 대응

3. **성능 최적화**
   - 이미지 생성 시 로딩 인디케이터 표시
   - Canvas 메모리 정리 (composite 이미지 생성 후)
   - 불필요한 리렌더링 방지

4. **접근성 최종 검수**
   - 스크린 리더 테스트
   - 키보드 전용 네비게이션 테스트
   - 모든 인터랙티브 요소의 최소 터치 영역(44px) 확인

### 예상 영향 파일

- 전체 export 관련 파일 (수정)
- 테스트 파일 (신규/수정)

---

## 리스크 및 대응 방안

| 리스크                                         | 영향도 | 대응 방안                                              |
|-----------------------------------------------|--------|-------------------------------------------------------|
| Safari에서 Clipboard API write 미지원           | 높음   | Feature detection 후 비활성화 + 대체 안내              |
| QR 코드 라이브러리 번들 크기 과다                | 중간   | 경량 라이브러리 선택, dynamic import 적용              |
| Canvas API의 CORS 이슈 (외부 이미지 포함 시)    | 중간   | html-to-image의 cacheBust 옵션 활용                   |
| 고해상도 합성 이미지 생성 시 메모리 부족          | 낮음   | Canvas 사용 후 즉시 해제, pixelRatio 제한              |
| Web Share API의 file 공유 미지원 브라우저        | 중간   | canShare() 사전 검증 후 fallback 처리                  |

---

## 마일스톤 요약

| Phase | 목표                        | 우선순위       | 주요 산출물                          |
|-------|-----------------------------|---------------|-------------------------------------|
| 1     | Export 유틸리티 확장          | Primary Goal  | `export.ts` 확장 함수들              |
| 2     | ExportPanel UI               | Primary Goal  | `ExportPanel.tsx` 컴포넌트           |
| 3     | 클립보드 복사                 | Primary Goal  | Clipboard API 통합                   |
| 4     | Web Share API                | Secondary Goal| 네이티브 공유 기능                    |
| 5     | QR 코드 생성                  | Secondary Goal| `qrcode.ts`, `QRCodeModal.tsx`       |
| 6     | 호환성 및 마무리              | Final Goal    | 크로스 브라우저 테스트, 접근성 검수    |

---

## Traceability (추적성)

| SPEC 요구사항 | 구현 Phase | 관련 파일                                |
|--------------|-----------|------------------------------------------|
| REQ-U-001    | Phase 2   | `ExportPanel.tsx`                        |
| REQ-E-001    | Phase 1   | `src/lib/export.ts`                      |
| REQ-E-002    | Phase 3   | `src/lib/export.ts`                      |
| REQ-E-003    | Phase 4   | `src/lib/export.ts`                      |
| REQ-E-004    | Phase 5   | `src/lib/qrcode.ts`, `QRCodeModal.tsx`   |
| REQ-S-001    | Phase 4   | `ExportPanel.tsx`                        |
| REQ-S-002    | Phase 3   | `ExportPanel.tsx`                        |
| REQ-N-001    | All       | All export modules                       |
| REQ-O-001    | Phase 1   | `src/lib/export.ts`                      |
| REQ-O-002    | Phase 1   | `ExportPanel.tsx`                        |
