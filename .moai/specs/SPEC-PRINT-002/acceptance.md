# SPEC-PRINT-002: Acceptance Criteria

---
spec-id: SPEC-PRINT-002
version: 1.0.0
created: 2026-02-28
---

## Test Scenarios (Given-When-Then)

### Scenario 1: Gelato API 견적 조회 (R1, R7)

```gherkin
Feature: Gelato 견적 조회

  Scenario: 관리자가 선택한 카드의 인쇄 견적을 조회한다
    Given 관리자가 로그인한 상태이다
    And confirmed 상태의 카드 3장이 선택되어 있다
    And 배송 주소가 한국(KR)으로 입력되어 있다
    And 배송 방법이 "normal"로 선택되어 있다
    When 관리자가 "견적 조회" 버튼을 클릭한다
    Then 시스템은 Gelato Quote API에 요청을 전송한다
    And 견적 결과에 인쇄 비용이 표시된다
    And 견적 결과에 배송비가 표시된다
    And 견적 결과에 총 비용이 표시된다
    And 견적 결과에 예상 배송일이 표시된다

  Scenario: 배송 방법별 견적 비교
    Given 관리자가 카드를 선택하고 배송 주소를 입력한 상태이다
    When 관리자가 배송 방법을 "normal"에서 "express"로 변경한다
    And "견적 조회" 버튼을 클릭한다
    Then express 배송의 견적이 표시된다
    And 예상 배송일이 normal보다 짧게 표시된다

  Scenario: 견적 조회 실패 처리
    Given 관리자가 카드를 선택한 상태이다
    When Gelato API가 500 에러를 반환한다
    Then "견적 조회에 실패했습니다. 잠시 후 다시 시도해주세요." 에러 메시지가 표시된다
    And 이전 입력 상태가 유지된다
```

### Scenario 2: 인쇄 주문 생성 플로우 (R1, R3, R5)

```gherkin
Feature: 인쇄 주문 생성

  Scenario: 관리자가 Draft 주문을 생성하고 확정한다
    Given 관리자가 로그인한 상태이다
    And confirmed 상태의 카드 5장이 선택되어 있다
    And 각 카드의 수량이 100매로 설정되어 있다
    And 배송 주소가 입력되어 있다
    And 견적 조회가 완료된 상태이다
    When 관리자가 "주문하기" 버튼을 클릭한다
    Then 시스템은 Gelato에 orderType "draft"로 주문을 생성한다
    And print_orders 테이블에 status "draft"로 레코드가 생성된다
    And print_order_items 테이블에 5개 아이템이 생성된다
    And 주문 확인 화면이 표시된다

  Scenario: Draft 주문을 최종 확정한다
    Given Draft 상태의 주문이 존재한다
    And 주문 확인 화면이 표시되어 있다
    When 관리자가 "주문 확정" 버튼을 클릭한다
    Then 시스템은 Gelato API로 Draft 주문을 확정(PATCH)한다
    And print_orders.status가 "pending"으로 업데이트된다
    And 성공 메시지가 표시된다
```

### Scenario 3: Gelato용 PDF 생성 및 업로드 (R2)

```gherkin
Feature: Gelato용 PDF 생성

  Scenario: 카드의 인쇄용 PDF를 생성하고 업로드한다
    Given confirmed 상태의 카드가 존재한다
    When 관리자가 해당 카드를 인쇄 주문에 포함시킨다
    Then 시스템은 4mm bleed가 적용된 PDF를 생성한다
    And PDF 페이지 크기는 99mm x 63mm이다
    And PDF에 crop mark가 포함되지 않는다
    And 해상도는 300 DPI 이상이다
    And 앞면 PDF가 Supabase Storage에 업로드된다
    And 뒷면 PDF가 Supabase Storage에 업로드된다
    And 각 PDF의 public URL이 반환된다

  Scenario: 기존 PDF 다운로드 기능 유지
    Given 사용자가 카드 편집 페이지에 있다
    When "인쇄용 PDF 다운로드" 버튼을 클릭한다
    Then 기존 3mm bleed + crop mark가 적용된 PDF가 다운로드된다
    And Gelato용 4mm bleed 변경의 영향을 받지 않는다
```

### Scenario 4: 주문 상태 추적 - Webhook (R6)

```gherkin
Feature: 주문 상태 Webhook 수신

  Scenario: Gelato에서 주문 상태 변경 Webhook을 수신한다
    Given 확정된 주문이 존재한다 (gelato_order_id: "order-123")
    When Gelato에서 order_status_updated 이벤트를 전송한다
    And 이벤트 payload에 status가 "shipped"이다
    And 유효한 Webhook 시크릿이 포함되어 있다
    Then print_orders.status가 "shipped"로 업데이트된다
    And tracking_url이 저장된다
    And tracking_code가 저장된다
    And updated_at이 현재 시각으로 갱신된다

  Scenario: 유효하지 않은 Webhook 요청을 거부한다
    Given Webhook 엔드포인트가 활성화되어 있다
    When 유효하지 않은 시크릿으로 Webhook 요청이 수신된다
    Then 시스템은 401 Unauthorized를 반환한다
    And 데이터베이스는 변경되지 않는다

  Scenario: 배송 완료 시 카드 상태 동기화
    Given 주문에 포함된 카드 3장이 있다
    When Gelato에서 status "delivered" 이벤트를 수신한다
    Then print_orders.status가 "delivered"로 업데이트된다
    And 해당 카드들의 card_requests.print_status가 "delivered"로 업데이트된다
```

### Scenario 5: 배송 주소 관리 (R5)

```gherkin
Feature: 배송 주소 관리

  Scenario: 한국어 배송 주소를 입력한다
    Given 관리자가 인쇄 주문 화면에 있다
    When 관리자가 배송 주소를 입력한다:
      | 필드 | 값 |
      | 성 | 홍 |
      | 이름 | 길동 |
      | 주소 1 | 서울특별시 강남구 테헤란로 123 |
      | 주소 2 | 4층 |
      | 시 | 서울 |
      | 도 | 서울특별시 |
      | 우편번호 | 06234 |
      | 국가 | KR |
      | 이메일 | admin@example.com |
      | 전화번호 | 010-1234-5678 |
    Then 배송 주소 유효성 검증이 통과된다
    And 주소가 Gelato API 형식으로 매핑된다

  Scenario: 최근 배송 주소를 불러온다
    Given 이전에 주문 시 입력한 배송 주소가 있다
    When 관리자가 "최근 주소 불러오기" 버튼을 클릭한다
    Then localStorage에 저장된 최근 배송 주소가 폼에 자동 입력된다

  Scenario: 필수 필드 누락 시 에러 표시
    Given 관리자가 배송 주소를 입력 중이다
    When "이름" 필드를 비워둔 채 제출한다
    Then "이름은 필수 입력 항목입니다" 에러 메시지가 표시된다
    And 폼 제출이 차단된다
```

### Scenario 6: 관리자 대시보드 인쇄 주문 탭 (R3)

```gherkin
Feature: 관리자 인쇄 주문 관리

  Scenario: 관리자 대시보드에서 인쇄 주문 섹션에 접근한다
    Given 관리자가 /admin 페이지에 접속한 상태이다
    When "인쇄 주문" 탭을 클릭한다
    Then 인쇄 주문 관리 화면이 표시된다
    And "새 주문" 서브탭이 기본 선택되어 있다
    And "주문 이력" 서브탭이 존재한다

  Scenario: confirmed 카드만 인쇄 주문에 선택 가능하다
    Given 인쇄 주문 관리 화면에 있다
    When 카드 선택 목록이 로드된다
    Then confirmed 상태의 카드만 목록에 표시된다
    And submitted, processing, cancelled 상태의 카드는 표시되지 않는다

  Scenario: 주문 이력에서 과거 주문을 조회한다
    Given 과거 인쇄 주문 3건이 존재한다
    When "주문 이력" 서브탭을 클릭한다
    Then 3건의 주문 목록이 표시된다
    And 각 주문의 상태, 생성일, 아이템 수가 표시된다
    When 특정 주문을 클릭한다
    Then 주문 상세 정보가 표시된다 (아이템 목록, 배송 정보, 상태 타임라인)
```

### Scenario 7: 비관리자 접근 차단 (Unwanted)

```gherkin
Feature: 인쇄 주문 보안

  Scenario: 비관리자가 인쇄 주문 API에 접근을 시도한다
    Given 일반 사용자가 로그인한 상태이다
    When POST /api/admin/print/orders에 요청을 보낸다
    Then 시스템은 403 Forbidden을 반환한다

  Scenario: 인증 없이 Webhook 엔드포인트에 접근한다
    Given 인증 헤더가 없는 요청이다
    When POST /api/webhooks/gelato에 요청을 보낸다
    Then 시스템은 401 Unauthorized를 반환한다

  Scenario: confirmed가 아닌 카드로 주문을 시도한다
    Given 관리자가 로그인한 상태이다
    When processing 상태의 카드를 인쇄 주문에 포함시키려 한다
    Then 시스템은 "confirmed 상태의 카드만 인쇄 주문이 가능합니다" 에러를 반환한다
```

## Edge Case Scenarios

### E1: 대량 주문 처리

```gherkin
Scenario: 100장의 카드를 한 번에 주문한다
  Given 관리자가 100장의 confirmed 카드를 선택했다
  When 주문을 생성한다
  Then 시스템은 Gelato의 주문당 100 아이템 제한 내에서 주문을 생성한다
  And 각 카드의 PDF가 순차적으로 생성되며 진행률이 표시된다

Scenario: 100장 초과 카드 선택 시 경고
  Given 관리자가 101장의 카드를 선택하려 한다
  When 101번째 카드를 선택한다
  Then "Gelato 주문당 최대 100개 아이템까지 가능합니다" 경고가 표시된다
  And 101번째 카드 선택이 차단된다
```

### E2: 네트워크 오류

```gherkin
Scenario: Gelato API 타임아웃
  Given 관리자가 견적을 조회 중이다
  When Gelato API가 10초 내에 응답하지 않는다
  Then "요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요." 메시지가 표시된다
  And 이전 상태가 유지된다

Scenario: PDF 업로드 실패
  Given 카드 PDF 생성은 완료되었다
  When Supabase Storage 업로드가 실패한다
  Then 에러 메시지가 표시된다
  And 재시도 버튼이 제공된다
```

### E3: 동시 작업

```gherkin
Scenario: 같은 카드에 대해 중복 주문 방지
  Given 카드 A가 이미 pending 상태의 주문에 포함되어 있다
  When 관리자가 카드 A를 새 주문에 포함시키려 한다
  Then "이 카드는 이미 진행 중인 주문(ORDER-XXX)에 포함되어 있습니다" 경고가 표시된다
  And 관리자가 확인 후 진행하거나 취소할 수 있다
```

### E4: Webhook 재시도

```gherkin
Scenario: Webhook 처리 중 서버 오류 발생
  Given Gelato에서 Webhook을 전송한다
  When 서버에서 500 에러가 발생한다
  Then Gelato는 5초 간격으로 최대 3회 재시도한다
  And 재시도 시 동일 이벤트가 중복 처리되지 않는다 (idempotency)
```

## Quality Gate Criteria

### Functional Completeness

- [ ] Gelato API 프록시 엔드포인트 6개 모두 동작
- [ ] 견적 조회 -> 주문 생성 -> 주문 확정 플로우 완료
- [ ] Webhook 수신 및 상태 업데이트 동작
- [ ] 4mm bleed PDF 생성 및 Storage 업로드 성공
- [ ] 기존 3mm bleed PDF 다운로드 기능 정상 유지
- [ ] 한국어 배송 주소 입력 및 매핑 정상 동작

### Security

- [ ] API 키가 클라이언트에 노출되지 않음 (소스 코드 및 네트워크 탭 확인)
- [ ] 모든 admin API 라우트가 requireAdmin으로 보호됨
- [ ] Webhook 엔드포인트가 인증 검증을 수행함
- [ ] confirmed 상태가 아닌 카드 주문 차단 확인

### Performance

- [ ] 단일 카드 PDF 생성: 5초 이내
- [ ] 견적 조회 응답: 3초 이내
- [ ] 주문 생성 응답: 5초 이내
- [ ] 관리자 대시보드 인쇄 주문 탭 로딩: 2초 이내

### Error Handling

- [ ] Gelato API 4xx 에러 시 사용자 친화적 메시지 표시
- [ ] Gelato API 5xx 에러 시 재시도 안내 메시지 표시
- [ ] 네트워크 타임아웃 시 적절한 안내 메시지
- [ ] PDF 생성 실패 시 에러 표시 및 재시도 옵션

### Compatibility

- [ ] Cloudflare Workers edge runtime에서 모든 API 라우트 정상 동작
- [ ] Supabase Storage public URL이 Gelato API에서 접근 가능
- [ ] 기존 카드 상태 워크플로우 (submitted -> processing -> confirmed -> delivered)에 영향 없음

## Definition of Done

1. 모든 Quality Gate 기준 충족
2. 7개 Requirements (R1-R7) 구현 완료
3. 모든 Unwanted Behavior 제약 충족
4. DB 마이그레이션 파일 작성 완료
5. 환경변수 문서화 (GELATO_API_KEY, GELATO_WEBHOOK_SECRET)
6. 테스트 주문(Draft) 1건 이상 성공적으로 생성
7. Webhook 수신 테스트 완료 (Gelato 테스트 환경)
8. 기존 SPEC-PRINT-001 기능 (3mm bleed PDF 다운로드) 회귀 없음 확인

## Traceability

| 요구사항 | 테스트 시나리오 | Quality Gate |
|---------|---------------|-------------|
| R1 (API Integration) | Scenario 1, 2, 7 | Functional, Security |
| R2 (PDF Generation) | Scenario 3 | Functional, Compatibility |
| R3 (Admin UI) | Scenario 2, 6 | Functional, Performance |
| R4 (Database) | Scenario 2, 4 | Functional |
| R5 (Shipping) | Scenario 5 | Functional |
| R6 (Webhook) | Scenario 4, E4 | Functional, Security |
| R7 (Quote) | Scenario 1 | Functional, Performance |
