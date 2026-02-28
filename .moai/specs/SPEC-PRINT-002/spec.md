# SPEC-PRINT-002: Gelato Print API Integration

---
id: SPEC-PRINT-002
version: 1.1.0
status: Completed
created: 2026-02-28
updated: 2026-02-28
author: manager-spec
priority: High
related: SPEC-PRINT-001
lifecycle: spec-anchored
---

## HISTORY

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-02-28 | 최초 작성 - Gelato Print API 연동 SPEC |
| 1.1.0 | 2026-02-28 | 구현 완료 |

## Overview

SPEC-PRINT-001에서 구현된 인쇄용 PDF 내보내기 기능을 확장하여, Gelato Print API를 통한 자동화된 인쇄 주문 시스템을 구축합니다. 관리자가 확정(confirmed) 상태의 명함 카드를 선택하여 Gelato의 글로벌 32개국 인쇄 네트워크를 통해 대량 주문할 수 있습니다.

### 핵심 비즈니스 가치

- 수동 인쇄 주문 프로세스 자동화
- 관리자 Gelato 계정 직결 결제 (Stripe 불필요)
- 한국 배송 지원 (한국어 주소)
- 주문 전 견적 확인으로 비용 투명성 확보

### 범위

- 포함: Gelato API 연동, 관리자 대량 주문 UI, 주문 추적, Webhook 상태 업데이트
- 제외: 사용자 직접 주문, 결제 게이트웨이 통합, Gelato 외 인쇄 서비스

## Environment

### 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5.x, Tailwind CSS 4
- **Backend**: Next.js API Routes, Supabase PostgreSQL, Supabase Storage
- **Deploy**: Cloudflare Workers (edge runtime)
- **인증**: Supabase Auth (관리자: ADMIN_EMAILS 환경변수)
- **PDF 생성**: jsPDF + html-to-image (SPEC-PRINT-001에서 구현)

### 외부 서비스

- **Gelato API**: v3/v4 REST API
  - 인증: `X-API-KEY` 헤더
  - Base URLs:
    - Order: `https://order.gelatoapis.com/v3`
    - Product: `https://product.gelatoapis.com/v3`
    - Shipment: `https://shipment.gelatoapis.com/v1`
    - Order Status: `https://order.gelatoapis.com/v4`

### 제약 조건

- Cloudflare Workers edge runtime 호환 필수 (Node.js 전용 라이브러리 사용 불가)
- Gelato API rate limit: 100 requests/second per API key
- 주문당 최대 100개 아이템
- PDF 파일은 publicly accessible URL 필요 (Supabase Storage public bucket)
- Gelato 요구사항: **4mm bleed** (현재 PDF는 3mm bleed - 업데이트 필요)

## Assumptions

- A1: 관리자가 Gelato 계정을 보유하고 있으며, API 키(테스트/프로덕션)가 발급된 상태
- A2: 관리자 Gelato 계정에 결제 수단이 등록되어 있음
- A3: 배송 주소는 주로 한국 (KR) 주소이며, 한국어로 입력
- A4: 명함 제품은 350gsm coated silk 양면 인쇄 (landscape) 사용
- A5: Supabase Storage에 PDF 파일용 public bucket 생성 가능
- A6: Cloudflare Workers에서 Gelato API로의 outbound HTTPS 요청이 허용됨
- A7: Webhook 수신을 위한 public endpoint가 Cloudflare Workers를 통해 노출 가능

## Requirements (EARS Format)

### R1: Gelato API Integration Layer

**[Event-Driven]** WHEN 관리자가 인쇄 주문 관련 작업을 요청하면, THEN 시스템은 서버 사이드 API 라우트를 통해 Gelato API에 프록시 요청을 전송해야 한다.

세부 요구사항:

- R1.1: 시스템은 `GELATO_API_KEY` 환경변수에 저장된 API 키를 `X-API-KEY` 헤더로 전송해야 한다
- R1.2: 모든 Gelato API 호출은 서버 사이드(API Routes)에서만 수행하여 API 키가 클라이언트에 노출되지 않아야 한다
- R1.3: Gelato API 오류 응답(4xx, 5xx)은 적절한 에러 메시지로 변환하여 클라이언트에 반환해야 한다
- R1.4: API 라우트는 `requireAdmin` 미들웨어로 보호되어야 한다

**지원 엔드포인트:**

| 내부 API 라우트 | Gelato API | 설명 |
|----------------|------------|------|
| `POST /api/admin/print/quote` | `POST /v3/orders:quote` | 견적 조회 |
| `POST /api/admin/print/orders` | `POST /v3/orders` | 주문 생성 |
| `GET /api/admin/print/orders/[id]` | `GET /v4/orders/{orderId}` | 주문 상태 조회 |
| `GET /api/admin/print/products` | `GET /v3/products/{productUid}` | 제품 정보 조회 |
| `GET /api/admin/print/shipping-methods` | `GET /v1/shipment-methods` | 배송 방법 조회 |

### R2: Print-Ready PDF Generation for Gelato

**[Event-Driven]** WHEN 관리자가 인쇄 주문을 위해 카드를 선택하면, THEN 시스템은 Gelato 요구사항에 맞는 인쇄용 PDF를 생성하고 publicly accessible URL을 제공해야 한다.

세부 요구사항:

- R2.1: PDF는 **4mm bleed**를 적용해야 한다 (현재 3mm에서 업데이트)
  - 페이지 크기: 99mm x 63mm (91x55mm 카드 + 4mm bleed 사방)
  - 이 변경은 Gelato 주문 전용이며, 기존 `exportCardAsPrintPdf` (3mm bleed)는 그대로 유지
- R2.2: PDF에는 crop mark를 포함하지 않아야 한다 (Gelato에서 자체 처리)
- R2.3: 해상도는 300 DPI 이상 (pixelRatio: 4 유지)
- R2.4: 생성된 PDF는 Supabase Storage `print-pdfs` 버킷에 업로드하여 public URL을 확보해야 한다
- R2.5: PDF URL은 Gelato 주문의 `fileUrl` 필드에 사용 가능해야 한다
- R2.6: PDF 파일명 형식: `{cardId}_front.pdf`, `{cardId}_back.pdf` (앞뒤 분리)

### R3: Admin Print Order UI

**[State-Driven]** IF 관리자가 관리자 대시보드에 접속한 상태이면, THEN 시스템은 인쇄 주문 관리 섹션을 표시해야 한다.

세부 요구사항:

- R3.1: 관리자 대시보드(`/admin`)에 "인쇄 주문" 탭/섹션을 추가해야 한다
- R3.2: confirmed 상태의 카드 목록에서 인쇄할 카드를 체크박스로 다중 선택할 수 있어야 한다
- R3.3: 선택된 카드의 미리보기(앞면/뒷면)를 표시해야 한다
- R3.4: "견적 조회" 버튼으로 선택 카드의 예상 비용을 확인할 수 있어야 한다
- R3.5: "주문하기" 버튼으로 Draft 주문을 생성할 수 있어야 한다
- R3.6: Draft 주문 확인 후 최종 주문 확정 기능을 제공해야 한다
- R3.7: 주문 수량 입력 (카드당 기본 100매, 조절 가능)

### R4: Order Management Database

**[Ubiquitous]** 시스템은 항상 모든 인쇄 주문의 상태와 이력을 데이터베이스에 기록해야 한다.

세부 요구사항:

- R4.1: `print_orders` 테이블 생성

  ```
  print_orders:
    id: UUID (PK, default gen_random_uuid())
    gelato_order_id: TEXT (Gelato에서 반환한 주문 ID, UNIQUE, nullable)
    status: TEXT (draft, pending, production, shipped, delivered, cancelled, failed)
    order_type: TEXT (draft | order)
    items: JSONB (주문 아이템 배열)
    shipping_address: JSONB (배송 주소)
    shipping_method: TEXT (normal, express, overnight)
    quote_amount: DECIMAL (견적 금액, nullable)
    quote_currency: TEXT (통화 코드, nullable)
    tracking_url: TEXT (배송 추적 URL, nullable)
    tracking_code: TEXT (운송장 번호, nullable)
    created_by: TEXT (관리자 이메일)
    created_at: TIMESTAMPTZ (default now())
    updated_at: TIMESTAMPTZ (default now())
  ```

- R4.2: `print_order_items` 테이블 생성

  ```
  print_order_items:
    id: UUID (PK, default gen_random_uuid())
    print_order_id: UUID (FK -> print_orders.id, ON DELETE CASCADE)
    card_request_id: UUID (FK -> card_requests.id)
    product_uid: TEXT (Gelato 제품 UID)
    quantity: INTEGER (인쇄 매수)
    front_pdf_url: TEXT (앞면 PDF URL)
    back_pdf_url: TEXT (뒷면 PDF URL)
    created_at: TIMESTAMPTZ (default now())
  ```

- R4.3: `card_requests` 테이블에 `print_status` 컬럼 추가 (nullable TEXT: null, ordered, printed, shipped, delivered)

### R5: Shipping Address Management

**[Event-Driven]** WHEN 관리자가 인쇄 주문을 생성할 때, THEN 시스템은 배송 주소 입력 폼을 제공하고 한국어 주소를 지원해야 한다.

세부 요구사항:

- R5.1: 배송 주소 입력 필드:
  - `companyName`: 수령인/회사명 (optional)
  - `firstName`: 이름 (required)
  - `lastName`: 성 (required)
  - `addressLine1`: 주소 1 (required)
  - `addressLine2`: 주소 2 (optional)
  - `city`: 시/군/구 (required)
  - `state`: 도/광역시 (required for KR)
  - `postCode`: 우편번호 (required)
  - `country`: 국가 코드 (default: KR)
  - `email`: 연락처 이메일 (required)
  - `phone`: 연락처 전화번호 (required)
- R5.2: 한국어 주소를 Gelato API 형식에 맞게 매핑해야 한다
- R5.3: 최근 사용한 배송 주소를 localStorage에 저장하여 재사용할 수 있어야 한다

### R6: Order Status Tracking

**[Event-Driven]** WHEN Gelato에서 주문 상태가 변경되면, THEN 시스템은 Webhook을 통해 자동으로 주문 상태를 업데이트해야 한다.

세부 요구사항:

- R6.1: Webhook 수신 엔드포인트: `POST /api/webhooks/gelato`
- R6.2: Webhook 이벤트 처리:
  - `order_status_updated`: `print_orders.status` 업데이트
  - `order_item_status_updated`: 개별 아이템 상태 업데이트
- R6.3: Webhook 인증: Gelato에서 제공하는 헤더 기반 인증 검증 (`X-Gelato-Signature` 또는 공유 시크릿)
- R6.4: 관리자 대시보드에서 주문 상태를 실시간 조회할 수 있어야 한다
- R6.5: 주문 상태 표시: 아이콘 + 텍스트 + 타임라인 형식
- R6.6: 배송 추적 URL이 있으면 "배송 추적" 링크를 표시해야 한다

### R7: Quote Before Order

**[Event-Driven]** WHEN 관리자가 인쇄 주문을 생성하기 전, THEN 시스템은 Gelato Quote API를 통해 예상 비용과 배송 옵션을 조회하여 표시해야 한다.

세부 요구사항:

- R7.1: 선택된 카드, 수량, 배송지, 배송 방법을 기반으로 견적을 조회해야 한다
- R7.2: 견적 결과 표시: 인쇄 비용, 배송비, 총 비용, 예상 배송일
- R7.3: 배송 방법 선택 가능 (normal, express, overnight) - 각각의 가격과 소요일 표시
- R7.4: 견적 확인 후 "주문 확정" 버튼으로 실제 주문을 진행할 수 있어야 한다
- R7.5: 견적은 캐싱하지 않으며, 매번 실시간으로 조회해야 한다

### Unwanted Behavior

- **[Unwanted]** 시스템은 API 키를 클라이언트 사이드 코드에 노출하지 않아야 한다
- **[Unwanted]** 시스템은 관리자가 아닌 사용자에게 인쇄 주문 기능을 제공하지 않아야 한다
- **[Unwanted]** 시스템은 confirmed 상태가 아닌 카드에 대해 인쇄 주문을 허용하지 않아야 한다
- **[Unwanted]** 시스템은 Webhook 인증 없이 상태 업데이트를 수락하지 않아야 한다
- **[Unwanted]** 시스템은 Draft 주문을 검토 없이 자동 확정하지 않아야 한다

## Technical Approach

### 아키텍처

```
[Admin Dashboard]
    |
    v
[Next.js API Routes] -- requireAdmin --> [Gelato API Proxy]
    |                                           |
    v                                           v
[Supabase DB]                           [Gelato REST API]
  - print_orders                          - Order API (v3)
  - print_order_items                     - Product API (v3)
  - card_requests (print_status)          - Shipment API (v1)
    |                                     - Status API (v4)
    v                                           |
[Supabase Storage]                              v
  - print-pdfs (public bucket)          [Gelato Webhook]
                                                |
                                                v
                                        [POST /api/webhooks/gelato]
```

### Gelato API Client

서버 사이드 Gelato API 클라이언트를 `src/lib/gelato.ts`에 구현:

```typescript
// Type-safe API client with error handling
interface GelatoClient {
  createQuote(params: QuoteParams): Promise<QuoteResponse>;
  createOrder(params: OrderParams): Promise<OrderResponse>;
  getOrder(orderId: string): Promise<OrderStatusResponse>;
  getProduct(productUid: string): Promise<ProductResponse>;
  getShippingMethods(): Promise<ShippingMethod[]>;
  confirmDraft(orderId: string): Promise<OrderResponse>;
}
```

### 제품 UID 매핑

| 옵션 | Product UID | 설명 |
|------|-------------|------|
| 기본 | `cards_pf_bb_pt_350-gsm-coated-silk_cl_4-4_hor` | 350gsm silk, 양면, landscape |
| 무광 코팅 | `cards_pf_bb_pt_350-gsm-coated-silk_cl_4-4_ct_matt-protection_prt_1-1_hor` | + matt coating |

### File Changes

| 유형 | 파일 경로 | 변경 내용 |
|------|----------|-----------|
| NEW | `src/lib/gelato.ts` | Gelato API 클라이언트 |
| NEW | `src/lib/gelato-types.ts` | Gelato API 타입 정의 |
| NEW | `src/app/api/admin/print/quote/route.ts` | 견적 조회 API |
| NEW | `src/app/api/admin/print/orders/route.ts` | 주문 생성 API |
| NEW | `src/app/api/admin/print/orders/[id]/route.ts` | 주문 상태 조회 API |
| NEW | `src/app/api/admin/print/products/route.ts` | 제품 정보 API |
| NEW | `src/app/api/admin/print/shipping-methods/route.ts` | 배송 방법 API |
| NEW | `src/app/api/webhooks/gelato/route.ts` | Webhook 수신 엔드포인트 |
| NEW | `src/app/api/admin/print/pdf/route.ts` | PDF 생성 + Storage 업로드 API |
| NEW | `src/components/admin/PrintOrderManager.tsx` | 인쇄 주문 관리 컨테이너 |
| NEW | `src/components/admin/PrintCardSelector.tsx` | 카드 선택 UI |
| NEW | `src/components/admin/PrintQuoteView.tsx` | 견적 조회 결과 표시 |
| NEW | `src/components/admin/PrintOrderStatus.tsx` | 주문 상태 표시 |
| NEW | `src/components/admin/ShippingAddressForm.tsx` | 배송 주소 입력 폼 |
| NEW | `src/components/admin/PrintOrderHistory.tsx` | 주문 이력 목록 |
| NEW | `src/types/print-order.ts` | 인쇄 주문 타입 정의 |
| NEW | `src/hooks/usePrintOrders.ts` | 인쇄 주문 CRUD 훅 |
| NEW | `supabase/migrations/010_add_print_orders.sql` | print_orders, print_order_items 테이블 |
| MODIFY | `src/lib/export.ts` | `exportCardAsGelatoPdf()` 함수 추가 (4mm bleed, crop mark 제외) |
| MODIFY | `src/app/admin/page.tsx` | 인쇄 주문 탭 추가 |

## Dependencies

### 외부 의존성

| 의존성 | 유형 | 설명 |
|--------|------|------|
| Gelato API | 외부 서비스 | 인쇄 주문 처리 |
| Supabase Storage | 인프라 | PDF 파일 호스팅 (public bucket) |

### 내부 의존성

| 의존성 | 유형 | 설명 |
|--------|------|------|
| SPEC-PRINT-001 | 선행 SPEC | 인쇄용 PDF 생성 기능 (완료) |
| `src/lib/export.ts` | 기존 코드 | PDF 생성 로직 기반 |
| `src/lib/auth-utils.ts` | 기존 코드 | `requireAdmin` 미들웨어 |
| `src/lib/supabase.ts` | 기존 코드 | Supabase 서버 클라이언트 |

### 환경변수

| 변수명 | 범위 | 설명 |
|--------|------|------|
| `GELATO_API_KEY` | 서버 전용 | Gelato API 키 (테스트/프로덕션) |
| `GELATO_WEBHOOK_SECRET` | 서버 전용 | Webhook 인증용 공유 시크릿 |

## Traceability

- SPEC-PRINT-001 -> SPEC-PRINT-002: PDF 생성 기능 확장
- R1 -> R7: 견적 조회 -> 주문 생성 플로우
- R2 -> R1: PDF 생성 -> API 연동
- R3 -> R4: UI -> Database
- R5 -> R3: 배송 주소 -> 주문 UI
- R6 -> R4: Webhook -> Database 업데이트
