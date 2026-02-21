---
id: SPEC-SHARE-001
document: acceptance
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-SHARE-001: 인수 기준

## 인수 기준 (Acceptance Criteria)

### AC-001: 내보내기 옵션 UI 표시

**Given** 사용자가 명함 편집 화면에 있을 때
**When** 내보내기 패널(ExportPanel)을 열면
**Then** 다음 옵션이 모두 표시되어야 한다:
- 앞면 PNG 다운로드
- 뒷면 PNG 다운로드
- 합성 이미지 다운로드
- 클립보드에 복사
- 공유 (Web Share API 지원 브라우저에서만)
- QR 코드 생성

**관련 요구사항**: REQ-U-001

---

### AC-002: 합성 이미지 다운로드

**Given** 명함 앞면과 뒷면이 모두 편집된 상태에서
**When** 사용자가 "합성 이미지 다운로드" 옵션을 클릭하면
**Then** 앞면과 뒷면이 좌우로 나란히 배치된 단일 PNG 이미지가 `namecard-composite.png` 파일명으로 다운로드되어야 한다.
**And** 다운로드 진행 중에는 로딩 인디케이터가 표시되어야 한다.
**And** 합성 이미지의 해상도는 pixelRatio: 2 이상이어야 한다.

**관련 요구사항**: REQ-E-001

---

### AC-003: 클립보드 복사

**Given** Clipboard API를 지원하는 브라우저에서
**When** 사용자가 "클립보드에 복사" 옵션을 클릭하면
**Then** 현재 활성화된 면(앞면 또는 뒷면)의 이미지가 PNG 형식으로 클립보드에 복사되어야 한다.
**And** 복사 성공 시 "Copied!" 피드백이 표시되고 2초 후 원래 텍스트로 복원되어야 한다.

**관련 요구사항**: REQ-E-002

---

### AC-004: Web Share API 공유

**Given** Web Share API를 지원하는 브라우저(Chrome Android, Safari iOS 등)에서
**When** 사용자가 "공유" 옵션을 클릭하면
**Then** OS 네이티브 공유 시트가 표시되어야 한다.
**And** 공유 파일은 현재 활성 면의 PNG 이미지여야 한다.
**And** 공유 제목은 "My Namecard"이어야 한다.

**관련 요구사항**: REQ-E-003

---

### AC-005: QR 코드 생성 및 표시

**Given** 명함 뒷면에 연락처 정보(Full Name, Title, Social Links)가 입력된 상태에서
**When** 사용자가 "QR 코드 생성" 옵션을 클릭하면
**Then** vCard 3.0 형식의 연락처 데이터가 포함된 QR 코드가 모달에 표시되어야 한다.
**And** QR 코드 모달에는 "PNG로 다운로드" 버튼이 있어야 한다.
**And** 모달은 닫기 버튼 또는 바깥 영역 클릭, Escape 키로 닫을 수 있어야 한다.

**관련 요구사항**: REQ-E-004

---

### AC-006: Web Share API Fallback

**Given** Web Share API를 지원하지 않는 브라우저(데스크톱 Firefox 등)에서
**When** 내보내기 패널을 열면
**Then** "공유" 옵션은 비활성화(disabled) 상태여야 한다.
**And** "클립보드에 복사" 옵션이 대체 방안으로 시각적으로 강조되어야 한다.

**관련 요구사항**: REQ-S-001

---

### AC-007: Clipboard API Fallback

**Given** Clipboard API write를 지원하지 않는 브라우저에서
**When** 내보내기 패널을 열면
**Then** "클립보드에 복사" 옵션은 비활성화(disabled) 상태여야 한다.
**And** 비활성화된 옵션에 "이 브라우저에서는 클립보드 복사를 지원하지 않습니다" 안내가 표시되어야 한다.

**관련 요구사항**: REQ-S-002

---

### AC-008: 외부 서버 데이터 전송 금지 검증

**Given** 모든 내보내기 및 공유 기능이 구현된 상태에서
**When** 네트워크 탭을 모니터링하며 각 기능을 실행하면
**Then** 외부 서버로의 HTTP 요청이 발생하지 않아야 한다.
**And** 모든 이미지 생성, QR 코드 생성, 공유 처리가 클라이언트 사이드에서만 수행되어야 한다.

**관련 요구사항**: REQ-N-001

---

## 엣지 케이스 (Edge Cases)

### EC-001: 브라우저 호환성

**Given** Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ 각 브라우저에서
**When** 내보내기 패널의 모든 기능을 테스트하면
**Then** Feature detection에 따라 지원/미지원 기능이 올바르게 활성화/비활성화되어야 한다.
**And** 지원되지 않는 기능에 대해 명확한 안내 메시지가 표시되어야 한다.

---

### EC-002: 대용량 이미지 처리

**Given** 5MB에 가까운 고해상도 아바타 이미지가 업로드된 명함에서
**When** 합성 이미지 다운로드 또는 3x 해상도 내보내기를 실행하면
**Then** 메모리 부족(out of memory) 오류 없이 정상적으로 완료되어야 한다.
**And** 처리 시간이 길어질 경우 로딩 인디케이터가 표시되어야 한다.

---

### EC-003: 오프라인 상태

**Given** 브라우저가 오프라인 상태일 때
**When** 모든 내보내기 기능(다운로드, 클립보드 복사, QR 코드)을 실행하면
**Then** 클라이언트 사이드 전용 기능이므로 정상적으로 동작해야 한다.
**And** Web Share API의 경우 OS에 따라 일부 공유 대상이 제한될 수 있으나 에러가 발생하지 않아야 한다.

---

### EC-004: 빈 연락처 정보에서 QR 코드 생성

**Given** 명함 뒷면에 연락처 정보가 비어 있거나 부분적으로만 입력된 상태에서
**When** QR 코드 생성을 실행하면
**Then** 입력된 정보만으로 최소한의 vCard가 생성되어야 한다.
**And** 필수 정보(FN: Full Name)가 비어 있는 경우 사용자에게 안내 메시지를 표시해야 한다.

---

## 성능 기준 (Performance Criteria)

| 항목                          | 목표값                    | 측정 방법                       |
|-------------------------------|--------------------------|--------------------------------|
| 개별 PNG 다운로드 소요 시간     | 2초 이내                  | Performance API measurement    |
| 합성 이미지 생성 소요 시간      | 3초 이내                  | Performance API measurement    |
| 클립보드 복사 소요 시간         | 2초 이내                  | Performance API measurement    |
| QR 코드 생성 소요 시간          | 1초 이내                  | Performance API measurement    |
| ExportPanel 드롭다운 열기       | 100ms 이내 (체감 즉시)    | User interaction timing        |
| 추가 번들 크기 (qrcode 라이브러리) | 30KB 이내 (gzipped)     | Bundle analyzer                |

---

## 개인정보 보호 요구사항 (Privacy Requirements)

| 항목                                 | 요구 수준                              |
|--------------------------------------|---------------------------------------|
| 외부 서버 데이터 전송                  | 절대 금지                              |
| 이미지 생성 위치                       | 클라이언트 사이드 전용 (Canvas API)     |
| QR 코드 생성 위치                      | 클라이언트 사이드 전용                  |
| 제3자 추적 스크립트                    | 내보내기 기능에 포함 금지               |
| 클립보드 데이터 수명                    | 사용자의 클립보드 정책에 따름           |
| Web Share 데이터 수명                  | OS 공유 시트 종료 시 메모리 해제        |

---

## Definition of Done (완료 정의)

- [ ] 모든 인수 기준(AC-001 ~ AC-008)이 통과
- [ ] 모든 엣지 케이스(EC-001 ~ EC-004)가 검증됨
- [ ] 성능 기준 내 동작 확인
- [ ] 개인정보 보호 요구사항 준수 확인
- [ ] 접근성 검증 완료 (ARIA 속성, 키보드 네비게이션, 최소 터치 영역)
- [ ] Chrome, Firefox, Safari, Edge에서 크로스 브라우저 테스트 통과
- [ ] 새로운 기능에 대한 단위 테스트 작성
- [ ] ESLint 에러 0건, TypeScript 타입 에러 0건
- [ ] ExportPanel 컴포넌트의 반응형 디자인 확인 (모바일/데스크톱)
- [ ] 코드 리뷰 완료

---

## Traceability (추적성)

| 인수 기준 | SPEC 요구사항 | 구현 Phase |
|----------|--------------|-----------|
| AC-001   | REQ-U-001    | Phase 2   |
| AC-002   | REQ-E-001    | Phase 1   |
| AC-003   | REQ-E-002    | Phase 3   |
| AC-004   | REQ-E-003    | Phase 4   |
| AC-005   | REQ-E-004    | Phase 5   |
| AC-006   | REQ-S-001    | Phase 4   |
| AC-007   | REQ-S-002    | Phase 3   |
| AC-008   | REQ-N-001    | All       |
| EC-001   | REQ-S-001/002| Phase 6   |
| EC-002   | REQ-E-001    | Phase 6   |
| EC-003   | REQ-N-001    | Phase 6   |
| EC-004   | REQ-E-004    | Phase 5   |
