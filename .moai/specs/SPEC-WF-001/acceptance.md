---
id: SPEC-WF-001
title: 확장 상태 워크플로우 및 요청 편집/취소 기능 - 수용 기준
version: 1.0.0
status: draft
created: 2026-02-22
related-spec: SPEC-WF-001
---

# SPEC-WF-001: 수용 기준 (Acceptance Criteria)

---

## AC-WF-001: 확장 상태 타입 정의

### 시나리오 1: RequestStatus 타입이 7개 상태를 포함한다

```gherkin
Given TypeScript 타입 시스템에서 RequestStatus 타입이 정의되어 있을 때
When RequestStatus 타입을 확인하면
Then 다음 7개 값이 유효한 상태로 포함되어 있어야 한다:
  | 상태값              | 한국어 라벨 |
  | submitted           | 의뢰됨      |
  | processing          | 작업중      |
  | revision_requested  | 수정 요청   |
  | confirmed           | 확정        |
  | rejected            | 반려        |
  | delivered           | 배송 완료   |
  | cancelled           | 취소됨      |
```

### 시나리오 2: StatusHistoryEntry에 adminFeedback 필드가 포함된다

```gherkin
Given StatusHistoryEntry 인터페이스가 정의되어 있을 때
When 인터페이스 필드를 확인하면
Then status (RequestStatus), timestamp (string), adminFeedback (string | undefined) 필드가 존재해야 한다
```

---

## AC-WF-002: 상태 전환 규칙 - submitted에서 processing

```gherkin
Given 상태가 "submitted"인 요청이 존재할 때
When 관리자가 상태를 "processing"으로 변경하면
Then 요청 상태가 "processing"으로 변경되어야 한다
And 상태 이력에 "processing" 항목이 추가되어야 한다
And 응답 HTTP 상태 코드가 200이어야 한다
```

---

## AC-WF-003: 상태 전환 규칙 - submitted에서 rejected

```gherkin
Given 상태가 "submitted"인 요청이 존재할 때
When 관리자가 상태를 "rejected"로 변경하고 반려 사유를 "디자인 가이드라인 미준수"로 입력하면
Then 요청 상태가 "rejected"로 변경되어야 한다
And 상태 이력에 "rejected" 항목이 추가되어야 한다
And 해당 이력 항목의 admin_feedback에 "디자인 가이드라인 미준수"가 저장되어야 한다
```

---

## AC-WF-004: 상태 전환 규칙 - processing에서 revision_requested

```gherkin
Given 상태가 "processing"인 요청이 존재할 때
When 관리자가 상태를 "revision_requested"로 변경하고 피드백을 "아바타 이미지 해상도가 낮습니다. 고해상도 이미지로 교체해주세요."로 입력하면
Then 요청 상태가 "revision_requested"로 변경되어야 한다
And 상태 이력에 "revision_requested" 항목이 추가되어야 한다
And 해당 이력 항목의 admin_feedback에 피드백 메시지가 저장되어야 한다
```

---

## AC-WF-005: 상태 전환 규칙 - processing에서 confirmed

```gherkin
Given 상태가 "processing"인 요청이 존재할 때
When 관리자가 상태를 "confirmed"로 변경하면
Then 요청 상태가 "confirmed"로 변경되어야 한다
And 상태 이력에 "confirmed" 항목이 추가되어야 한다
```

---

## AC-WF-006: 상태 전환 규칙 - confirmed에서 delivered

```gherkin
Given 상태가 "confirmed"인 요청이 존재할 때
When 관리자가 상태를 "delivered"로 변경하면
Then 요청 상태가 "delivered"로 변경되어야 한다
And 상태 이력에 "delivered" 항목이 추가되어야 한다
```

---

## AC-WF-007: 잘못된 상태 전환 거부

### 시나리오 1: 종료 상태에서의 전환 시도

```gherkin
Given 상태가 "rejected"인 요청이 존재할 때
When 관리자가 상태를 "submitted"로 변경을 시도하면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 에러 메시지에 "Cannot transition from rejected to submitted"가 포함되어야 한다
And 요청 상태는 "rejected"로 유지되어야 한다
```

### 시나리오 2: 유효하지 않은 전환 경로

```gherkin
Given 상태가 "submitted"인 요청이 존재할 때
When 관리자가 상태를 "confirmed"로 변경을 시도하면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 에러 메시지에 "Cannot transition from submitted to confirmed"가 포함되어야 한다
```

### 시나리오 3: cancelled 상태에서의 전환 시도

```gherkin
Given 상태가 "cancelled"인 요청이 존재할 때
When 어떤 상태로든 전환을 시도하면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 요청 상태는 "cancelled"로 유지되어야 한다
```

### 시나리오 4: delivered 상태에서의 전환 시도

```gherkin
Given 상태가 "delivered"인 요청이 존재할 때
When 어떤 상태로든 전환을 시도하면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 요청 상태는 "delivered"로 유지되어야 한다
```

---

## AC-WF-008: 사용자 요청 편집 - submitted 상태

```gherkin
Given 인증된 사용자 "user@example.com"이 자신이 생성한 "submitted" 상태의 요청을 가지고 있을 때
When 사용자가 PATCH /api/requests/my/{id}로 displayName을 "홍길동"에서 "김철수"로 변경하면
Then 응답 HTTP 상태 코드가 200이어야 한다
And 요청의 card_front.displayName이 "김철수"로 업데이트되어야 한다
And 요청 상태는 "submitted"으로 유지되어야 한다
And updated_at이 현재 시각으로 갱신되어야 한다
```

---

## AC-WF-009: 사용자 요청 편집 - revision_requested 상태에서 자동 전환

```gherkin
Given 인증된 사용자의 요청이 "revision_requested" 상태이고
And 관리자 피드백 "아바타 이미지를 변경해주세요"가 기록되어 있을 때
When 사용자가 PATCH /api/requests/my/{id}로 아바타 이미지와 메모를 수정하면
Then 응답 HTTP 상태 코드가 200이어야 한다
And 요청 상태가 "submitted"로 자동 전환되어야 한다
And 상태 이력에 "submitted" 항목이 새로 추가되어야 한다
And 수정된 카드 데이터가 DB에 저장되어야 한다
```

---

## AC-WF-010: 사용자 요청 편집 - 편집 불가 상태 차단

```gherkin
Given 인증된 사용자의 요청이 "processing" 상태일 때
When 사용자가 PATCH /api/requests/my/{id}로 편집을 시도하면
Then 응답 HTTP 상태 코드가 403이어야 한다
And 에러 메시지에 "Cannot edit request in current status"가 포함되어야 한다
And 요청 데이터는 변경되지 않아야 한다
```

### 추가 시나리오: confirmed/rejected/delivered/cancelled 상태에서의 편집 시도

```gherkin
Given 인증된 사용자의 요청이 "<status>" 상태일 때
When 사용자가 PATCH /api/requests/my/{id}로 편집을 시도하면
Then 응답 HTTP 상태 코드가 403이어야 한다

Examples:
  | status    |
  | confirmed |
  | rejected  |
  | delivered |
  | cancelled |
```

---

## AC-WF-011: 사용자 요청 편집 - 소유권 검증

```gherkin
Given 인증된 사용자 "user-a@example.com"이 로그인되어 있고
And 요청의 created_by가 "user-b@example.com"일 때
When 사용자가 PATCH /api/requests/my/{id}로 편집을 시도하면
Then 응답 HTTP 상태 코드가 403이어야 한다
And 에러 메시지에 "Access denied"가 포함되어야 한다
```

---

## AC-WF-012: 사용자 요청 편집 - 편집 가능 데이터 범위

```gherkin
Given 인증된 사용자의 "submitted" 상태 요청이 존재할 때
When 사용자가 다음 데이터를 수정하면:
  | 필드            | 이전 값        | 새 값          |
  | displayName     | 홍길동         | 김철수          |
  | fullName        | 홍길동         | 김철수          |
  | title           | 개발자         | 시니어 개발자    |
  | hashtags        | [개발, 코딩]   | [개발, 디자인]   |
  | note            | 특이사항 없음   | 급하게 필요합니다 |
  | backgroundColor | #FFFFFF        | #F5F5F5         |
Then 모든 필드가 성공적으로 업데이트되어야 한다
And 응답 HTTP 상태 코드가 200이어야 한다
```

---

## AC-WF-013: 사용자 요청 취소 - submitted 상태

```gherkin
Given 인증된 사용자의 요청이 "submitted" 상태일 때
When 사용자가 POST /api/requests/my/{id}/cancel을 호출하면
Then 응답 HTTP 상태 코드가 200이어야 한다
And 요청 상태가 "cancelled"로 변경되어야 한다
And 상태 이력에 "cancelled" 항목이 추가되어야 한다
```

---

## AC-WF-014: 사용자 요청 취소 - revision_requested 상태

```gherkin
Given 인증된 사용자의 요청이 "revision_requested" 상태일 때
When 사용자가 POST /api/requests/my/{id}/cancel을 호출하면
Then 응답 HTTP 상태 코드가 200이어야 한다
And 요청 상태가 "cancelled"로 변경되어야 한다
```

---

## AC-WF-015: 사용자 요청 취소 - 취소 불가 상태

```gherkin
Given 인증된 사용자의 요청이 "<status>" 상태일 때
When 사용자가 POST /api/requests/my/{id}/cancel을 호출하면
Then 응답 HTTP 상태 코드가 403이어야 한다
And 에러 메시지에 "Cannot cancel request in current status"가 포함되어야 한다

Examples:
  | status     |
  | processing |
  | confirmed  |
  | rejected   |
  | delivered  |
  | cancelled  |
```

---

## AC-WF-016: 취소 확인 다이얼로그

```gherkin
Given 사용자가 대시보드 상세 페이지에서 "submitted" 상태의 요청을 보고 있을 때
When 사용자가 "취소" 버튼을 클릭하면
Then "취소하면 되돌릴 수 없습니다. 정말 취소하시겠습니까?" 확인 다이얼로그가 표시되어야 한다
And "확인" 버튼과 "돌아가기" 버튼이 제공되어야 한다

When 사용자가 "확인" 버튼을 클릭하면
Then 취소 API가 호출되어야 한다
And 상태가 "cancelled"로 변경되어야 한다

When 사용자가 "돌아가기" 버튼을 클릭하면
Then 다이얼로그가 닫히고 요청 상태는 변경되지 않아야 한다
```

---

## AC-WF-017: 관리자 피드백 - revision_requested 전환 시 필수

```gherkin
Given 관리자가 "processing" 상태의 요청 상세 페이지를 보고 있을 때
When 관리자가 "수정 요청" 버튼을 클릭하고 피드백을 입력하지 않은 채 전환을 시도하면
Then API 호출이 실행되지 않아야 한다 (프론트엔드 검증)
And 피드백 입력 필드에 "피드백을 입력해주세요" 안내 메시지가 표시되어야 한다

When 관리자가 피드백 "아바타 이미지 해상도가 낮습니다"를 입력하고 전환을 확인하면
Then API가 status="revision_requested"와 adminFeedback="아바타 이미지 해상도가 낮습니다"로 호출되어야 한다
And 응답 HTTP 상태 코드가 200이어야 한다
```

---

## AC-WF-018: 관리자 피드백 - rejected 전환 시 필수

```gherkin
Given 관리자가 "submitted" 상태의 요청 상세 페이지를 보고 있을 때
When 관리자가 "반려" 버튼을 클릭하고 사유 없이 전환을 시도하면
Then API 호출이 실행되지 않아야 한다
And 사유 입력 필드에 "반려 사유를 입력해주세요" 안내 메시지가 표시되어야 한다

When 관리자가 반려 사유 "부적절한 콘텐츠"를 입력하고 전환을 확인하면
Then API가 status="rejected"와 adminFeedback="부적절한 콘텐츠"로 호출되어야 한다
```

---

## AC-WF-019: 관리자 피드백 - API 레벨 검증

### 시나리오 1: revision_requested로 변경 시 피드백 누락

```gherkin
Given 관리자 권한으로 인증된 사용자가 있을 때
When PATCH /api/requests/{id}에 {"status": "revision_requested"} (adminFeedback 없음)을 보내면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 에러 메시지에 "Feedback is required for revision request"가 포함되어야 한다
```

### 시나리오 2: rejected로 변경 시 빈 피드백

```gherkin
Given 관리자 권한으로 인증된 사용자가 있을 때
When PATCH /api/requests/{id}에 {"status": "rejected", "adminFeedback": ""} (빈 문자열)을 보내면
Then 응답 HTTP 상태 코드가 400이어야 한다
And 에러 메시지에 "Reason is required for rejection"가 포함되어야 한다
```

---

## AC-WF-020: 피드백 사용자 표시 - revision_requested

```gherkin
Given 사용자의 요청이 "revision_requested" 상태이고
And 관리자 피드백이 "소셜 링크 URL을 확인해주세요"일 때
When 사용자가 대시보드 상세 페이지 (/dashboard/{id})를 열면
Then 보라색 배경의 피드백 배너가 표시되어야 한다
And 배너에 "관리자 수정 요청" 제목이 표시되어야 한다
And 배너 본문에 "소셜 링크 URL을 확인해주세요" 메시지가 표시되어야 한다
And "편집" 버튼이 표시되어야 한다
```

---

## AC-WF-021: 피드백 사용자 표시 - rejected

```gherkin
Given 사용자의 요청이 "rejected" 상태이고
And 반려 사유가 "디자인 가이드라인 미준수"일 때
When 사용자가 대시보드 상세 페이지를 열면
Then 빨간색 배경의 반려 사유 배너가 표시되어야 한다
And 배너에 "요청이 반려되었습니다" 제목이 표시되어야 한다
And 배너 본문에 "디자인 가이드라인 미준수" 메시지가 표시되어야 한다
And "편집" 및 "취소" 버튼이 표시되지 않아야 한다
```

---

## AC-WF-022: 상태 배지 스타일

```gherkin
Given StatusBadge 컴포넌트가 렌더링될 때
When status 값이 다음과 같으면:
  | status              | expected_label | expected_color_class             |
  | submitted           | 의뢰됨        | bg-blue-100 text-blue-800        |
  | processing          | 작업중        | bg-amber-100 text-amber-800      |
  | revision_requested  | 수정 요청     | bg-purple-100 text-purple-800    |
  | confirmed           | 확정          | bg-green-100 text-green-800      |
  | rejected            | 반려          | bg-red-100 text-red-800          |
  | delivered           | 배송 완료     | bg-indigo-100 text-indigo-800    |
  | cancelled           | 취소됨        | bg-gray-100 text-gray-500        |
Then 각 상태에 대해 expected_label 텍스트와 expected_color_class 스타일이 적용되어야 한다
```

---

## AC-WF-023: 관리자 상태 전환 UI

### 시나리오 1: submitted 상태에서의 관리자 UI

```gherkin
Given 관리자가 "submitted" 상태의 요청 상세 페이지를 열었을 때
Then "등록" (-> processing) 버튼이 표시되어야 한다
And "반려" (-> rejected) 버튼이 표시되어야 한다
And "반려" 버튼 클릭 시 반려 사유 입력 textarea가 표시되어야 한다
And "확정" 버튼은 표시되지 않아야 한다
```

### 시나리오 2: processing 상태에서의 관리자 UI

```gherkin
Given 관리자가 "processing" 상태의 요청 상세 페이지를 열었을 때
Then "확정" (-> confirmed) 버튼이 표시되어야 한다
And "수정 요청" (-> revision_requested) 버튼이 표시되어야 한다
And "수정 요청" 버튼 클릭 시 피드백 입력 textarea가 표시되어야 한다
```

### 시나리오 3: confirmed 상태에서의 관리자 UI

```gherkin
Given 관리자가 "confirmed" 상태의 요청 상세 페이지를 열었을 때
Then "배송 완료" (-> delivered) 버튼이 표시되어야 한다
And 다른 상태 전환 버튼은 표시되지 않아야 한다
```

### 시나리오 4: 종료 상태에서의 관리자 UI

```gherkin
Given 관리자가 "<terminal_status>" 상태의 요청 상세 페이지를 열었을 때
Then 어떤 상태 전환 버튼도 표시되지 않아야 한다
And "<banner_message>" 배너가 표시되어야 한다

Examples:
  | terminal_status | banner_message              |
  | rejected        | 이 의뢰는 반려되었습니다.      |
  | delivered       | 이 의뢰는 배송 완료되었습니다.  |
  | cancelled       | 이 의뢰는 취소되었습니다.      |
```

---

## AC-WF-024: 사용자 편집/취소 UI

### 시나리오 1: 편집 가능 상태에서의 버튼 표시

```gherkin
Given 사용자가 "<editable_status>" 상태의 요청 상세 페이지를 열었을 때
Then "편집" 버튼이 표시되어야 한다
And "취소" 버튼이 표시되어야 한다

Examples:
  | editable_status     |
  | submitted           |
  | revision_requested  |
```

### 시나리오 2: 편집 불가 상태에서의 버튼 숨김

```gherkin
Given 사용자가 "<non_editable_status>" 상태의 요청 상세 페이지를 열었을 때
Then "편집" 버튼이 표시되지 않아야 한다
And "취소" 버튼이 표시되지 않아야 한다

Examples:
  | non_editable_status |
  | processing          |
  | confirmed           |
  | rejected            |
  | delivered           |
  | cancelled           |
```

### 시나리오 3: 편집 모드 진입

```gherkin
Given 사용자가 "submitted" 상태의 요청 상세 페이지에서 "편집" 버튼을 클릭하면
Then 읽기 전용 카드 정보가 편집 가능한 폼으로 전환되어야 한다
And 기존 데이터가 폼 필드에 pre-populate 되어야 한다
And "저장" 버튼과 "편집 취소" 버튼이 표시되어야 한다
```

---

## AC-WF-025: ProgressStepper 확장 상태 표시

```gherkin
Given ProgressStepper 컴포넌트가 렌더링될 때
When currentStatus가 "revision_requested"이면
Then "의뢰됨" 단계가 활성화되어야 한다 (수정 후 재제출 대기 상태)
And "수정 요청" 라벨이 표시되어야 한다

When currentStatus가 "rejected"이면
Then 전체 프로세스가 중단된 것으로 표시되어야 한다
And 빨간색 시각적 표시가 있어야 한다

When currentStatus가 "delivered"이면
Then "확정" 단계 이후 "배송 완료" 단계가 활성화되어야 한다

When currentStatus가 "cancelled"이면
Then 전체 프로세스가 취소된 것으로 표시되어야 한다
And 회색 비활성 스타일이 적용되어야 한다
```

---

## AC-WF-026: 상태 이력에 피드백 표시

```gherkin
Given 요청의 상태 이력에 다음 항목들이 있을 때:
  | status              | timestamp            | admin_feedback                    |
  | submitted           | 2026-02-22T10:00:00Z | (없음)                            |
  | processing          | 2026-02-22T11:00:00Z | (없음)                            |
  | revision_requested  | 2026-02-22T14:00:00Z | 아바타 이미지를 교체해주세요          |
  | submitted           | 2026-02-22T16:00:00Z | (없음)                            |
  | processing          | 2026-02-22T17:00:00Z | (없음)                            |
  | confirmed           | 2026-02-23T10:00:00Z | (없음)                            |
When 상태 이력 컴포넌트가 렌더링되면
Then 모든 6개 항목이 시간 순서대로 표시되어야 한다
And "revision_requested" 항목에 "아바타 이미지를 교체해주세요" 피드백이 함께 표시되어야 한다
And 피드백이 없는 항목에는 피드백 영역이 표시되지 않아야 한다
```

---

## AC-WF-027: 엣지 케이스 - 동시 수정 충돌

```gherkin
Given 사용자가 "submitted" 상태의 요청을 편집 중이고
And 그 사이에 관리자가 해당 요청의 상태를 "processing"으로 변경했을 때
When 사용자가 편집 내용을 저장하면
Then 응답 HTTP 상태 코드가 403이어야 한다
And 에러 메시지에 "Cannot edit request in current status"가 포함되어야 한다
And 사용자에게 "요청 상태가 변경되었습니다. 페이지를 새로고침해주세요." 안내 메시지가 표시되어야 한다
```

---

## AC-WF-028: 엣지 케이스 - 미인증 사용자의 편집/취소 시도

```gherkin
Given 인증되지 않은 사용자가 있을 때
When PATCH /api/requests/my/{id} 또는 POST /api/requests/my/{id}/cancel을 호출하면
Then 응답 HTTP 상태 코드가 401이어야 한다
And 에러 메시지에 "Authentication required"가 포함되어야 한다
```

---

## 품질 게이트 (Quality Gates)

### Definition of Done

- [ ] 모든 요구사항 (R-WF-001 ~ R-WF-025)에 대한 수용 기준이 충족되었다
- [ ] TypeScript 컴파일이 오류 없이 완료된다 (`npx tsc --noEmit`)
- [ ] ESLint 경고가 0건이다 (`npm run lint`)
- [ ] 신규 API 엔드포인트에 대한 단위 테스트가 작성되었다
- [ ] DB 마이그레이션이 Supabase에 적용되었다
- [ ] 모든 7개 상태에 대한 StatusBadge 렌더링이 확인되었다
- [ ] 관리자 피드백 입력 및 표시 기능이 동작한다
- [ ] 사용자 편집 폼이 모든 편집 가능 필드를 지원한다
- [ ] 취소 확인 다이얼로그가 올바르게 동작한다
- [ ] 반응형 레이아웃이 모바일/데스크톱에서 정상 표시된다

### 검증 방법

| 검증 유형 | 도구 | 대상 |
|----------|------|------|
| 타입 검증 | TypeScript Compiler | 모든 .ts/.tsx 파일 |
| 린트 검증 | ESLint | 모든 소스 파일 |
| API 테스트 | Vitest | API 라우트 핸들러 |
| 컴포넌트 테스트 | Vitest + Testing Library | 신규/수정 컴포넌트 |
| 수동 테스트 | 브라우저 | 전체 워크플로우 시나리오 |
| DB 검증 | Supabase SQL Editor | 마이그레이션 결과 |

---

## 트레이서빌리티 태그

- SPEC: SPEC-WF-001
- AC-WF-001 -> R-WF-001
- AC-WF-002 ~ AC-WF-006 -> R-WF-002 ~ R-WF-006
- AC-WF-007 -> R-WF-007
- AC-WF-008 ~ AC-WF-012 -> R-WF-008 ~ R-WF-012
- AC-WF-013 ~ AC-WF-016 -> R-WF-013 ~ R-WF-016
- AC-WF-017 ~ AC-WF-019 -> R-WF-017 ~ R-WF-019
- AC-WF-020 ~ AC-WF-021 -> R-WF-020 ~ R-WF-021
- AC-WF-022 -> R-WF-022
- AC-WF-023 -> R-WF-023
- AC-WF-024 -> R-WF-024
- AC-WF-025 -> R-WF-025
- AC-WF-026 -> R-WF-021
- AC-WF-027 ~ AC-WF-028 -> 엣지 케이스 (R-WF-011, R-WF-012)
