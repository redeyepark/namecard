# SPEC-PRINT-002: Implementation Plan

---
spec-id: SPEC-PRINT-002
version: 1.0.0
created: 2026-02-28
---

## Milestone Overview

| 마일스톤 | 우선순위 | 내용 | 의존성 |
|---------|---------|------|--------|
| M1: Database & Types | Primary Goal | DB 스키마, 타입 정의 | 없음 |
| M2: Gelato API Client | Primary Goal | API 클라이언트 및 라우트 | M1 |
| M3: PDF Generation (4mm) | Primary Goal | Gelato용 PDF 생성 + Storage 업로드 | M1 |
| M4: Admin UI - Card Selection | Secondary Goal | 카드 선택 및 견적 조회 UI | M2, M3 |
| M5: Admin UI - Order Management | Secondary Goal | 주문 생성, 상태 추적 UI | M4 |
| M6: Webhook Integration | Final Goal | 상태 자동 업데이트 | M2, M5 |
| M7: Polish & Edge Cases | Optional Goal | UX 개선, 에러 처리 강화 | M6 |

## Milestone Details

### M1: Database & Types (Primary Goal)

**목표**: 인쇄 주문 데이터 모델 구축

**Tasks**:

1. DB 마이그레이션 파일 생성
   - [ ] `supabase/migrations/010_add_print_orders.sql`
   - [ ] `print_orders` 테이블 생성 (id, gelato_order_id, status, order_type, items, shipping_address, shipping_method, quote_amount, quote_currency, tracking_url, tracking_code, created_by, created_at, updated_at)
   - [ ] `print_order_items` 테이블 생성 (id, print_order_id FK, card_request_id FK, product_uid, quantity, front_pdf_url, back_pdf_url, created_at)
   - [ ] `card_requests`에 `print_status` 컬럼 추가 (nullable TEXT)
   - [ ] RLS 정책 설정 (관리자만 접근)
   - [ ] updated_at 자동 갱신 트리거

2. TypeScript 타입 정의
   - [ ] `src/types/print-order.ts`: PrintOrder, PrintOrderItem, PrintStatus, ShippingAddress 타입
   - [ ] `src/lib/gelato-types.ts`: Gelato API request/response 타입 (QuoteParams, QuoteResponse, OrderParams, OrderResponse, OrderStatusResponse, ProductResponse, ShippingMethod, WebhookEvent)

**산출물**:
- `supabase/migrations/010_add_print_orders.sql`
- `src/types/print-order.ts`
- `src/lib/gelato-types.ts`

---

### M2: Gelato API Client (Primary Goal)

**목표**: Gelato API 프록시 레이어 구축

**Tasks**:

1. Gelato API 클라이언트 구현
   - [ ] `src/lib/gelato.ts`: HTTP 클라이언트 (fetch 기반, Cloudflare Workers 호환)
   - [ ] API 키 인증 (`X-API-KEY` 헤더)
   - [ ] 에러 핸들링 (Gelato API 에러 코드 매핑)
   - [ ] 타입 안전한 요청/응답 처리
   - [ ] 재시도 로직 (네트워크 에러 시 최대 2회)

2. API Routes 구현
   - [ ] `src/app/api/admin/print/quote/route.ts`: POST - 견적 조회
   - [ ] `src/app/api/admin/print/orders/route.ts`: POST - 주문 생성, GET - 주문 목록
   - [ ] `src/app/api/admin/print/orders/[id]/route.ts`: GET - 주문 상태, PATCH - Draft 확정
   - [ ] `src/app/api/admin/print/products/route.ts`: GET - 제품 정보
   - [ ] `src/app/api/admin/print/shipping-methods/route.ts`: GET - 배송 방법 목록
   - [ ] 모든 라우트에 `requireAdmin` 미들웨어 적용

**산출물**:
- `src/lib/gelato.ts`
- 6개 API Route 파일

**기술 결정**:
- fetch API 사용 (Cloudflare Workers 호환, axios 대신)
- 서버 사이드 전용 (API 키 보호)
- Draft -> Confirm 2단계 주문 플로우

---

### M3: PDF Generation for Gelato (Primary Goal)

**목표**: Gelato 요구사항에 맞는 PDF 생성 및 Storage 업로드

**Tasks**:

1. Gelato용 PDF 생성 함수
   - [ ] `src/lib/export.ts`에 `exportCardAsGelatoPdf()` 추가
   - [ ] 4mm bleed 적용 (99mm x 63mm)
   - [ ] crop mark 제외
   - [ ] 앞면/뒷면 개별 PDF 파일 생성 (Gelato는 파일 단위 업로드)
   - [ ] 300 DPI 이상 해상도 (pixelRatio: 4)

2. Supabase Storage 업로드
   - [ ] `print-pdfs` public bucket 생성 (마이그레이션)
   - [ ] `src/app/api/admin/print/pdf/route.ts`: PDF 생성 + Storage 업로드 API
   - [ ] 서버 사이드에서 html-to-image 대체 방안 검토
     - 대안 A: 클라이언트에서 PDF Blob 생성 후 서버로 업로드
     - 대안 B: 서버에서 카드 데이터 기반 PDF 직접 생성 (jsPDF only)
   - [ ] public URL 반환

**기술 결정**:
- **대안 A 채택 권장**: 클라이언트에서 html-to-image + jsPDF로 PDF Blob 생성 -> 서버 API로 업로드 -> Supabase Storage 저장
  - 이유: html-to-image는 DOM 접근 필요 (서버에서 불가), 기존 SPEC-PRINT-001 코드 재활용 가능
- 기존 `exportCardAsPrintPdf` (3mm bleed)는 사용자 직접 다운로드용으로 유지

**산출물**:
- `src/lib/export.ts` 수정 (exportCardAsGelatoPdf 추가)
- `src/app/api/admin/print/pdf/route.ts`
- Storage bucket 마이그레이션

---

### M4: Admin UI - Card Selection & Quote (Secondary Goal)

**목표**: 카드 선택, 견적 조회 UI

**Tasks**:

1. 카드 선택 컴포넌트
   - [ ] `src/components/admin/PrintCardSelector.tsx`: confirmed 카드 목록 + 체크박스 다중 선택
   - [ ] 카드 미리보기 (앞면/뒷면 썸네일)
   - [ ] 카드별 수량 입력 (기본 100매)
   - [ ] 전체 선택/해제 토글
   - [ ] 이벤트별 필터링

2. 견적 조회 컴포넌트
   - [ ] `src/components/admin/PrintQuoteView.tsx`: 견적 결과 표시
   - [ ] 인쇄 비용, 배송비, 총 비용 표시
   - [ ] 배송 방법별 가격/소요일 비교
   - [ ] 통화 표시 (USD 또는 현지 통화)

3. 배송 주소 폼
   - [ ] `src/components/admin/ShippingAddressForm.tsx`: 한국어 주소 입력 폼
   - [ ] 필수/선택 필드 유효성 검증
   - [ ] localStorage에 최근 주소 저장/불러오기
   - [ ] 국가 코드 기본값: KR

**산출물**:
- `src/components/admin/PrintCardSelector.tsx`
- `src/components/admin/PrintQuoteView.tsx`
- `src/components/admin/ShippingAddressForm.tsx`

---

### M5: Admin UI - Order Management (Secondary Goal)

**목표**: 주문 생성, 상태 추적, 이력 관리 UI

**Tasks**:

1. 주문 관리 컨테이너
   - [ ] `src/components/admin/PrintOrderManager.tsx`: 전체 인쇄 주문 플로우 컨테이너
   - [ ] 탭 구조: "새 주문" | "주문 이력"
   - [ ] 주문 플로우: 카드 선택 -> 배송 주소 -> 견적 확인 -> 주문 확정

2. 주문 상태 표시
   - [ ] `src/components/admin/PrintOrderStatus.tsx`: 주문 상태 타임라인
   - [ ] 상태별 아이콘 + 색상: draft(회색), pending(노란색), production(파란색), shipped(보라색), delivered(초록색), cancelled(빨간색), failed(빨간색)
   - [ ] 배송 추적 URL 링크

3. 주문 이력
   - [ ] `src/components/admin/PrintOrderHistory.tsx`: 과거 주문 목록
   - [ ] 주문 상세 보기 (아이템 목록, 배송 정보, 타임라인)
   - [ ] 상태 필터링

4. 커스텀 훅
   - [ ] `src/hooks/usePrintOrders.ts`: 주문 CRUD, 견적 조회, 상태 폴링

5. Admin 페이지 통합
   - [ ] `src/app/admin/page.tsx` 수정: "인쇄 주문" 탭 추가

**산출물**:
- `src/components/admin/PrintOrderManager.tsx`
- `src/components/admin/PrintOrderStatus.tsx`
- `src/components/admin/PrintOrderHistory.tsx`
- `src/hooks/usePrintOrders.ts`
- `src/app/admin/page.tsx` 수정

---

### M6: Webhook Integration (Final Goal)

**목표**: Gelato 상태 변경 자동 수신 및 처리

**Tasks**:

1. Webhook 엔드포인트
   - [ ] `src/app/api/webhooks/gelato/route.ts`: POST - Webhook 수신
   - [ ] 인증 검증 (공유 시크릿 또는 서명 검증)
   - [ ] `order_status_updated` 이벤트 처리 -> `print_orders.status` 업데이트
   - [ ] `order_item_status_updated` 이벤트 처리 -> 개별 아이템 상태 업데이트
   - [ ] 배송 추적 정보 업데이트 (tracking_url, tracking_code)
   - [ ] `card_requests.print_status` 동기화

2. Webhook 보안
   - [ ] `GELATO_WEBHOOK_SECRET` 환경변수 기반 인증
   - [ ] 요청 본문 무결성 검증
   - [ ] 이미 처리된 이벤트 중복 방지 (idempotency)

**산출물**:
- `src/app/api/webhooks/gelato/route.ts`

---

### M7: Polish & Edge Cases (Optional Goal)

**목표**: UX 개선 및 에러 처리 강화

**Tasks**:

- [ ] Gelato API 타임아웃 처리 (10초 제한)
- [ ] PDF 업로드 실패 시 재시도 로직
- [ ] 대량 주문 시 진행률 표시 (카드별 PDF 생성 상태)
- [ ] 주문 취소 기능 (Draft 상태에서만)
- [ ] 이메일 알림 (주문 완료, 배송 시작) - 선택적
- [ ] 모바일 반응형 UI 최적화
- [ ] 로딩 스켈레톤 UI

## Technology Decisions

### Gelato API 호출 방식

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| fetch (native) | Cloudflare Workers 호환, 의존성 없음 | 보일러플레이트 | **채택** |
| axios | 인터셉터, 편의 기능 | Workers 미호환 가능 | 미채택 |

### PDF 생성 전략

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 클라이언트 생성 + 서버 업로드 | 기존 코드 재활용, DOM 접근 가능 | 클라이언트 부하 | **채택** |
| 서버 사이드 생성 | 클라이언트 무관 | Workers에서 DOM 없음 | 미채택 |

### Draft vs Direct Order

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| Draft -> Confirm 2단계 | 주문 전 검토 가능, 실수 방지 | 추가 스텝 | **채택** |
| Direct Order | 빠른 주문 | 실수 시 취소 어려움 | 미채택 |

### Bleed 전략

| 옵션 | 장점 | 단점 | 결정 |
|------|------|------|------|
| 기존 3mm 유지 + Gelato용 4mm 별도 | 하위 호환성 보장 | 함수 2개 유지 | **채택** |
| 전체 4mm 통일 | 단순 | 기존 PDF 출력 변경 | 미채택 |

## Risk Analysis

### High Risk

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Cloudflare Workers에서 Gelato API 호출 차단 | 핵심 기능 불가 | Workers outbound fetch 테스트 선행, 실패 시 외부 함수 서비스 고려 |
| html-to-image가 관리자 브라우저에서 카드 렌더링 불가 | PDF 생성 불가 | 숨겨진 DOM에 카드 렌더링 후 캡처, 또는 미리 생성된 이미지 활용 |

### Medium Risk

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Gelato API 스키마 변경 | API 호출 실패 | 타입 검증 레이어, 에러 로깅 |
| Supabase Storage public URL 만료 | Gelato에서 PDF 접근 불가 | public bucket 설정 확인, URL 유효성 검증 |
| Webhook 수신 실패 | 상태 동기화 누락 | 수동 상태 조회 폴백, Webhook 재시도 |

### Low Risk

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Gelato rate limit 도달 | 대량 주문 시 지연 | 요청 큐잉, 배치 처리 |
| 한국어 주소 인코딩 문제 | 배송 오류 | UTF-8 인코딩 확인, 테스트 주문으로 검증 |

## File Change Summary

### 신규 파일 (19개)

```
src/lib/gelato.ts                                    # Gelato API 클라이언트
src/lib/gelato-types.ts                              # Gelato API 타입
src/types/print-order.ts                             # 인쇄 주문 타입
src/hooks/usePrintOrders.ts                          # 인쇄 주문 훅
src/app/api/admin/print/quote/route.ts               # 견적 API
src/app/api/admin/print/orders/route.ts              # 주문 API
src/app/api/admin/print/orders/[id]/route.ts         # 주문 상태 API
src/app/api/admin/print/products/route.ts            # 제품 API
src/app/api/admin/print/shipping-methods/route.ts    # 배송 API
src/app/api/admin/print/pdf/route.ts                 # PDF 업로드 API
src/app/api/webhooks/gelato/route.ts                 # Webhook 엔드포인트
src/components/admin/PrintOrderManager.tsx            # 주문 관리 컨테이너
src/components/admin/PrintCardSelector.tsx            # 카드 선택 UI
src/components/admin/PrintQuoteView.tsx               # 견적 표시
src/components/admin/PrintOrderStatus.tsx             # 주문 상태
src/components/admin/ShippingAddressForm.tsx          # 배송 주소 폼
src/components/admin/PrintOrderHistory.tsx            # 주문 이력
supabase/migrations/010_add_print_orders.sql          # DB 마이그레이션
supabase/migrations/010_add_print_pdfs_storage.sql    # Storage bucket
```

### 수정 파일 (2개)

```
src/lib/export.ts                                    # exportCardAsGelatoPdf() 추가
src/app/admin/page.tsx                               # 인쇄 주문 탭 추가
```

## Expert Consultation Recommendations

### Backend Expert (expert-backend)

추천 이유: Gelato API 프록시 레이어, Webhook 처리, DB 스키마 설계에 전문성 필요

상담 범위:
- Gelato API 클라이언트 아키텍처 (에러 핸들링, 재시도 패턴)
- Webhook 인증 및 idempotency 처리
- DB 스키마 최적화 (인덱스, RLS 정책)
- Cloudflare Workers 호환성 검증

### Frontend Expert (expert-frontend)

추천 이유: 다단계 주문 플로우 UI, 상태 관리, 실시간 업데이트 구현

상담 범위:
- 주문 플로우 UX (카드 선택 -> 견적 -> 주문)
- 대량 카드 선택 시 성능 최적화
- 주문 상태 실시간 폴링 vs WebSocket
- PDF 생성 진행률 표시 UX
