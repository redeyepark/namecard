---
id: SPEC-WF-001
title: 확장 상태 워크플로우 및 요청 편집/취소 기능
version: 1.0.0
status: implemented
created: 2026-02-22
priority: high
related-specs:
  - SPEC-UI-001
  - SPEC-ADMIN-001
  - SPEC-DASHBOARD-001
tags: workflow, status, edit, cancel, admin-feedback
---

# SPEC-WF-001: 확장 상태 워크플로우 및 요청 편집/취소 기능

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-22 | manager-spec | 초기 SPEC 작성 |
| 1.1.0 | 2026-02-22 | MoAI | Status updated to implemented - 확장 상태 워크플로우, 편집/취소, 관리자 피드백 구현 완료 |

---

## 1. 개요 (Overview)

### 목적

현재 명함 제작 요청 시스템은 `submitted -> processing -> confirmed`의 단순 3단계 워크플로우만 지원하며, 사용자가 요청 제출 후 수정하거나 취소할 수 없고, 관리자가 수정 요청이나 반려를 할 수 없는 제한이 있다. 본 SPEC은 확장 상태 워크플로우 도입, 사용자 요청 편집/취소 기능, 관리자 피드백 시스템을 구현하여 사용자-관리자 간 양방향 커뮤니케이션을 가능하게 한다.

### 범위

1. **확장 상태 워크플로우**: `revision_requested`, `rejected`, `delivered`, `cancelled` 상태 추가 및 전환 규칙 정의
2. **사용자 요청 편집/취소**: `submitted` 또는 `revision_requested` 상태에서 사용자가 요청 데이터를 수정하거나 취소할 수 있는 기능
3. **관리자 피드백 시스템**: 관리자가 수정 요청/반려 시 피드백 메시지를 첨부하고, 사용자가 이를 확인할 수 있는 시스템

---

## 2. 환경 (Environment)

### 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.0.11 |
| Backend | Next.js API Routes | 16.1.6 |
| Database | Supabase PostgreSQL | supabase-js 2.97.0 |
| Auth | Supabase Auth (@supabase/ssr) | 0.8.0 |
| Deploy | Cloudflare Workers (opennextjs-cloudflare) | - |

### 현재 상태

- **상태 타입**: `RequestStatus = 'submitted' | 'processing' | 'confirmed'` (3개)
- **전환 규칙**: `submitted -> processing -> confirmed` (단방향, 역방향 전환 없음)
- **사용자 기능**: 요청 제출 후 읽기 전용 (수정/취소 불가)
- **관리자 기능**: 상태 변경 + 일러스트 업로드만 가능 (피드백 없음)
- **DB 스키마**: `card_requests` 테이블의 `status` 필드는 TEXT 타입 (CHECK 제약조건으로 3개 상태 제한)
- **DB 스키마**: `card_request_status_history` 테이블에 `admin_feedback` 컬럼 없음

### 관련 SPEC

- SPEC-UI-001: 명함 에디터 UI
- SPEC-ADMIN-001: 관리자 대시보드
- SPEC-DASHBOARD-001: 사용자 대시보드

---

## 3. 가정 (Assumptions)

| ID | 가정 | 신뢰도 | 근거 | 오류 시 영향 | 검증 방법 |
|----|------|--------|------|-------------|-----------|
| A-01 | DB status 필드가 TEXT 타입이므로 새 상태 값 추가 시 마이그레이션이 필요하다 | High | 현재 CHECK 제약조건이 3개 상태만 허용 | 새 상태 값 INSERT 시 DB 오류 발생 | 마이그레이션 스크립트 실행 |
| A-02 | 사용자가 submitted/revision_requested 상태에서만 편집을 원한다 | High | product.md 로드맵 Phase 2 요구사항 | 의도치 않은 상태에서 데이터 변경 발생 | 사용자 테스트 |
| A-03 | 취소된 요청은 복구할 수 없어야 한다 | High | 비즈니스 요구사항 (취소는 최종 행위) | 취소 후 재활성화 시 데이터 정합성 문제 | 비즈니스 규칙 확인 |
| A-04 | Supabase service_role 키로 DB 접근하므로 RLS 정책 변경과 무관하다 | High | 현재 `src/lib/supabase.ts`에서 service_role 사용 | API 동작에 영향 없음 | 코드 확인 완료 |
| A-05 | 관리자 피드백은 상태 이력 레코드에 포함하는 것이 적절하다 | Medium | 별도 테이블 대비 간결한 설계 | 복잡한 피드백 스레드 필요 시 재설계 필요 | 프로토타입 검증 |

---

## 4. 요구사항 (Requirements) - EARS 형식

### 4.1 확장 상태 워크플로우

#### R-WF-001: 확장 상태 타입 정의 [High]

시스템은 **항상** 다음 7개의 요청 상태를 지원해야 한다: `submitted`, `processing`, `revision_requested`, `confirmed`, `rejected`, `delivered`, `cancelled`.

#### R-WF-002: 상태 전환 규칙 - submitted [High]

**WHEN** 관리자가 `submitted` 상태의 요청에 대해 상태 변경을 시도하면 **THEN** 시스템은 `processing` 또는 `rejected`로의 전환만 허용해야 한다.

#### R-WF-003: 상태 전환 규칙 - processing [High]

**WHEN** 관리자가 `processing` 상태의 요청에 대해 상태 변경을 시도하면 **THEN** 시스템은 `confirmed` 또는 `revision_requested`로의 전환만 허용해야 한다.

#### R-WF-004: 상태 전환 규칙 - revision_requested [High]

**WHEN** 사용자가 `revision_requested` 상태에서 요청을 재제출하면 **THEN** 시스템은 상태를 `submitted`로 자동 전환해야 한다.

#### R-WF-005: 상태 전환 규칙 - confirmed [High]

**WHEN** 관리자가 `confirmed` 상태의 요청에 대해 상태 변경을 시도하면 **THEN** 시스템은 `delivered`로의 전환만 허용해야 한다.

#### R-WF-006: 종료 상태 [High]

시스템은 `rejected`, `delivered`, `cancelled` 상태에서 다른 상태로의 전환을 **허용하지 않아야 한다**.

#### R-WF-007: 잘못된 전환 거부 [High]

**WHEN** 유효하지 않은 상태 전환이 요청되면 **THEN** 시스템은 HTTP 400 응답과 함께 현재 상태에서 요청된 상태로의 전환이 불가능하다는 오류 메시지를 반환해야 한다.

### 4.2 사용자 요청 편집

#### R-WF-008: 요청 편집 가능 조건 [High]

**IF** 요청 상태가 `submitted` 또는 `revision_requested`이면 **THEN** 시스템은 요청 소유자에게 편집 기능을 제공해야 한다.

#### R-WF-009: 편집 가능 데이터 범위 [High]

**WHEN** 사용자가 요청을 편집하면 **THEN** 시스템은 다음 데이터의 수정을 허용해야 한다: displayName, fullName, title, hashtags, socialLinks, 앞면/뒷면 배경색, 아바타 이미지, 메모(note).

#### R-WF-010: 편집 시 상태 자동 전환 [High]

**WHEN** 사용자가 `revision_requested` 상태에서 요청을 편집하여 저장하면 **THEN** 시스템은 요청 상태를 `submitted`로 자동 전환하고 상태 이력에 기록해야 한다.

#### R-WF-011: 편집 불가 상태 차단 [High]

**IF** 요청 상태가 `processing`, `confirmed`, `rejected`, `delivered`, `cancelled` 중 하나이면 **THEN** 시스템은 편집 API 요청에 대해 HTTP 403 응답을 반환해야 한다.

#### R-WF-012: 편집 소유권 검증 [High]

**WHEN** 사용자가 요청 편집 API를 호출하면 **THEN** 시스템은 요청의 `created_by`와 현재 인증된 사용자의 이메일이 일치하는지 검증하고, 불일치 시 HTTP 403을 반환해야 한다.

### 4.3 사용자 요청 취소

#### R-WF-013: 요청 취소 가능 조건 [High]

**IF** 요청 상태가 `submitted` 또는 `revision_requested`이면 **THEN** 시스템은 요청 소유자에게 취소 기능을 제공해야 한다.

#### R-WF-014: 취소 확인 다이얼로그 [Medium]

**WHEN** 사용자가 취소 버튼을 클릭하면 **THEN** 시스템은 "취소하면 되돌릴 수 없습니다" 경고 메시지와 함께 확인 다이얼로그를 표시해야 한다.

#### R-WF-015: 취소 실행 [High]

**WHEN** 사용자가 취소를 확인하면 **THEN** 시스템은 요청 상태를 `cancelled`로 변경하고 상태 이력에 기록해야 한다.

#### R-WF-016: 취소 불가역성 [High]

시스템은 `cancelled` 상태의 요청에 대해 상태 변경, 편집, 재활성화를 **허용하지 않아야 한다**.

### 4.4 관리자 피드백 시스템

#### R-WF-017: 수정 요청 피드백 필수 [High]

**WHEN** 관리자가 요청 상태를 `revision_requested`로 변경하면 **THEN** 시스템은 피드백 메시지 입력을 필수로 요구해야 한다 (빈 문자열 불허).

#### R-WF-018: 반려 사유 필수 [High]

**WHEN** 관리자가 요청 상태를 `rejected`로 변경하면 **THEN** 시스템은 반려 사유 입력을 필수로 요구해야 한다 (빈 문자열 불허).

#### R-WF-019: 피드백 저장 [High]

**WHEN** 관리자가 피드백/사유와 함께 상태를 변경하면 **THEN** 시스템은 해당 피드백을 `card_request_status_history` 테이블의 `admin_feedback` 컬럼에 저장해야 한다.

#### R-WF-020: 피드백 사용자 표시 [High]

**WHEN** 사용자가 `revision_requested` 또는 `rejected` 상태의 요청 상세 페이지를 열면 **THEN** 시스템은 관리자의 피드백 메시지를 눈에 잘 띄는 배너 형태로 표시해야 한다.

#### R-WF-021: 피드백 이력 조회 [Medium]

**WHEN** 사용자 또는 관리자가 상태 이력을 조회하면 **THEN** 시스템은 각 상태 변경 기록에 연관된 관리자 피드백을 함께 표시해야 한다.

### 4.5 UI 요구사항

#### R-WF-022: 새 상태 배지 스타일 [Medium]

시스템은 **항상** 다음 상태에 대해 시각적으로 구분 가능한 배지 스타일을 제공해야 한다:
- `revision_requested`: 보라색 배경 (수정 요청 상태 강조)
- `rejected`: 빨간색 배경 (반려 상태 경고)
- `delivered`: 남색/진파란색 배경 (배송 완료 표시)
- `cancelled`: 회색 배경 (비활성 상태 표현)

#### R-WF-023: 관리자 상태 전환 UI [High]

**WHEN** 관리자가 요청 상세 페이지를 열면 **THEN** 시스템은 현재 상태에서 유효한 전환 대상만 버튼으로 표시하고, `revision_requested` 또는 `rejected` 전환 시 피드백 입력 필드를 함께 표시해야 한다.

#### R-WF-024: 사용자 편집/취소 UI [High]

**IF** 요청 상태가 `submitted` 또는 `revision_requested`이면 **THEN** 사용자 요청 상세 페이지(`/dashboard/[id]`)에 "편집" 및 "취소" 버튼을 표시해야 한다.

#### R-WF-025: 사용자 진행 상태 인디케이터 확장 [Medium]

시스템은 **항상** 사용자 대시보드의 ProgressStepper 컴포넌트를 확장하여 `revision_requested`, `rejected`, `delivered`, `cancelled` 상태를 시각적으로 표현해야 한다.

---

## 5. 상태 전환 다이어그램

```
                         +---> rejected (관리자 반려, 사유 필수) [종료 상태]
                         |
submitted ---------------+---> processing (관리자 작업 시작)
  ^                                |
  |                                +---> confirmed (관리자 확정)
  |                                |         |
  +--- (사용자 재제출) ---+        |         +---> delivered (관리자 배송 완료 처리) [종료 상태]
                          |        |
                          |        +---> revision_requested (관리자 수정 요청, 피드백 필수)
                          |                    |
                          +--------------------+
                          |
submitted --------+
                  |
                  +---> cancelled (사용자 취소) [종료 상태]
                  |
revision_requested +---> cancelled (사용자 취소) [종료 상태]
```

### 유효 전환 맵

| 현재 상태 (From) | 허용 전환 (To) | 실행 주체 | 비고 |
|-----------------|---------------|----------|------|
| `submitted` | `processing` | 관리자 | 작업 시작 |
| `submitted` | `rejected` | 관리자 | 반려 (사유 필수) |
| `submitted` | `cancelled` | 사용자 | 요청 취소 |
| `processing` | `confirmed` | 관리자 | 확정 |
| `processing` | `revision_requested` | 관리자 | 수정 요청 (피드백 필수) |
| `revision_requested` | `submitted` | 사용자 | 재제출 (편집 완료 시 자동) |
| `revision_requested` | `cancelled` | 사용자 | 요청 취소 |
| `confirmed` | `delivered` | 관리자 | 배송 완료 |
| `rejected` | (없음) | - | 종료 상태 |
| `delivered` | (없음) | - | 종료 상태 |
| `cancelled` | (없음) | - | 종료 상태 |

---

## 6. 데이터베이스 변경사항

### 6.1 마이그레이션: card_requests 테이블 CHECK 제약조건 수정

```sql
-- 003_extend_workflow_statuses.sql

-- Step 1: card_requests 테이블의 status CHECK 제약조건 변경
ALTER TABLE card_requests DROP CONSTRAINT IF EXISTS card_requests_status_check;
ALTER TABLE card_requests ADD CONSTRAINT card_requests_status_check
  CHECK (status IN ('submitted', 'processing', 'confirmed', 'revision_requested', 'rejected', 'delivered', 'cancelled'));

-- Step 2: card_request_status_history 테이블의 status CHECK 제약조건 변경
ALTER TABLE card_request_status_history DROP CONSTRAINT IF EXISTS card_request_status_history_status_check;
ALTER TABLE card_request_status_history ADD CONSTRAINT card_request_status_history_status_check
  CHECK (status IN ('submitted', 'processing', 'confirmed', 'revision_requested', 'rejected', 'delivered', 'cancelled'));

-- Step 3: card_request_status_history 테이블에 admin_feedback 컬럼 추가
ALTER TABLE card_request_status_history ADD COLUMN admin_feedback TEXT;

-- Step 4: status 인덱스는 이미 존재하므로 추가 인덱스 불필요
-- (기존 idx_card_requests_status, idx_status_history_request_id 유지)
```

### 6.2 스키마 변경 요약

| 테이블 | 변경 유형 | 상세 |
|--------|----------|------|
| `card_requests` | CHECK 제약조건 수정 | 7개 상태 허용으로 확장 |
| `card_request_status_history` | CHECK 제약조건 수정 | 7개 상태 허용으로 확장 |
| `card_request_status_history` | 컬럼 추가 | `admin_feedback TEXT` (nullable) |

---

## 7. API 변경사항

### 7.1 기존 API 수정

#### PATCH /api/requests/[id] (관리자 상태 변경)

**변경 사항**: 요청 본문에 `adminFeedback` 필드 추가, 새로운 상태 전환 지원

**Request Body (변경 후)**:

```typescript
interface AdminPatchBody {
  status?: RequestStatus;          // 변경할 상태
  illustrationImage?: string;      // Base64 일러스트 이미지 (기존)
  adminFeedback?: string;          // 관리자 피드백 메시지 (신규)
}
```

**검증 규칙**:
- `status`가 `revision_requested`일 때: `adminFeedback`은 필수 (빈 문자열 불가)
- `status`가 `rejected`일 때: `adminFeedback`은 필수 (빈 문자열 불가)
- 다른 상태 변경 시: `adminFeedback`은 선택

**Response (변경 없음)**:

```typescript
interface AdminPatchResponse {
  id: string;
  status: RequestStatus;
  updatedAt: string;
}
```

**에러 응답 (추가)**:

| 상황 | HTTP 코드 | 에러 메시지 |
|------|----------|------------|
| revision_requested로 변경 시 피드백 누락 | 400 | `Feedback is required for revision request` |
| rejected로 변경 시 사유 누락 | 400 | `Reason is required for rejection` |

### 7.2 신규 API

#### PATCH /api/requests/my/[id] (사용자 요청 편집)

**목적**: 인증된 사용자가 자신의 요청 데이터를 편집

**인증**: `requireAuth` (요청 소유자만)

**Request Body**:

```typescript
interface UserEditBody {
  card?: {
    front?: Partial<CardFrontData>;  // displayName, backgroundColor 등
    back?: Partial<CardBackData>;    // fullName, title, hashtags, socialLinks, backgroundColor
  };
  note?: string;                     // 사용자 메모
  avatarImage?: string;              // Base64 아바타 이미지 (변경 시)
}
```

**검증 규칙**:
- 요청 소유권: `created_by === user.email` (불일치 시 403)
- 상태 제한: `submitted` 또는 `revision_requested`만 허용 (그 외 403)
- `revision_requested` 상태에서 편집 시: 상태를 자동으로 `submitted`로 전환

**Response (200)**:

```typescript
interface UserEditResponse {
  id: string;
  status: RequestStatus;
  updatedAt: string;
}
```

**에러 응답**:

| 상황 | HTTP 코드 | 에러 메시지 |
|------|----------|------------|
| 미인증 | 401 | `Authentication required` |
| 소유권 불일치 | 403 | `Access denied` |
| 편집 불가 상태 | 403 | `Cannot edit request in current status` |
| 요청 없음 | 404 | `Request not found` |

#### POST /api/requests/my/[id]/cancel (사용자 요청 취소)

**목적**: 인증된 사용자가 자신의 요청을 취소

**인증**: `requireAuth` (요청 소유자만)

**Request Body**: 없음

**검증 규칙**:
- 요청 소유권: `created_by === user.email` (불일치 시 403)
- 상태 제한: `submitted` 또는 `revision_requested`만 허용 (그 외 403)

**Response (200)**:

```typescript
interface CancelResponse {
  id: string;
  status: 'cancelled';
  updatedAt: string;
}
```

**에러 응답**:

| 상황 | HTTP 코드 | 에러 메시지 |
|------|----------|------------|
| 미인증 | 401 | `Authentication required` |
| 소유권 불일치 | 403 | `Access denied` |
| 취소 불가 상태 | 403 | `Cannot cancel request in current status` |
| 요청 없음 | 404 | `Request not found` |

### 7.3 기존 GET /api/requests/[id] 응답 변경

**변경 사항**: `statusHistory` 항목에 `adminFeedback` 포함

```typescript
interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string;          // ISO 8601
  adminFeedback?: string;     // 관리자 피드백 (신규, revision_requested/rejected 시)
}
```

---

## 8. UI 변경사항

### 8.1 타입 변경

**파일**: `src/types/request.ts`

```typescript
// 변경 전
export type RequestStatus = 'submitted' | 'processing' | 'confirmed';

// 변경 후
export type RequestStatus =
  | 'submitted'
  | 'processing'
  | 'revision_requested'
  | 'confirmed'
  | 'rejected'
  | 'delivered'
  | 'cancelled';

// StatusHistoryEntry에 adminFeedback 추가
export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string;
  adminFeedback?: string;     // 신규
}

// VALID_TRANSITIONS 확장
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ['processing', 'rejected', 'cancelled'],
  processing: ['confirmed', 'revision_requested'],
  revision_requested: ['submitted', 'cancelled'],
  confirmed: ['delivered'],
  rejected: [],
  delivered: [],
  cancelled: [],
};
```

### 8.2 컴포넌트 변경 목록

| 컴포넌트 | 파일 경로 | 변경 유형 | 변경 내용 |
|---------|----------|----------|----------|
| StatusBadge | `src/components/admin/StatusBadge.tsx` | 수정 | 4개 새 상태의 배지 색상/라벨 추가 |
| RequestDetail | `src/components/admin/RequestDetail.tsx` | 수정 | 새 상태 전환 버튼 + 피드백 입력 UI 추가 |
| StatusHistory | `src/components/admin/StatusHistory.tsx` | 수정 | adminFeedback 표시 지원 |
| MyRequestDetail | `src/components/dashboard/MyRequestDetail.tsx` | 수정 | 피드백 배너 + 편집/취소 버튼 추가 |
| ProgressStepper | `src/components/dashboard/ProgressStepper.tsx` | 수정 | 확장 상태 시각화 |
| EditRequestForm | `src/components/dashboard/EditRequestForm.tsx` | **신규** | 사용자 요청 편집 폼 |
| DashboardDetailPage | `src/app/dashboard/[id]/page.tsx` | 수정 | 편집/취소 버튼 및 EditRequestForm 통합 |

### 8.3 신규 컴포넌트: EditRequestForm

**파일**: `src/components/dashboard/EditRequestForm.tsx`

**기능**:
- 기존 요청 데이터를 폼 필드에 pre-populate
- displayName, fullName, title, hashtags, socialLinks, 배경색, 아바타 이미지, 메모 편집
- 저장 시 `PATCH /api/requests/my/[id]` 호출
- 저장 완료 시 편집 모드 종료 및 데이터 새로고침
- 취소(편집 취소) 버튼으로 편집 모드 종료

**Props**:

```typescript
interface EditRequestFormProps {
  request: CardRequest;
  onSave: () => void;       // 저장 완료 콜백
  onCancel: () => void;     // 편집 취소 콜백
}
```

---

## 9. 수용 기준 요약 (Acceptance Criteria Summary)

| ID | 요구사항 | 수용 기준 |
|----|---------|----------|
| R-WF-001 | 확장 상태 타입 | RequestStatus 타입이 7개 상태를 포함한다 |
| R-WF-002~006 | 상태 전환 규칙 | 유효 전환 맵에 정의된 전환만 성공한다 |
| R-WF-007 | 잘못된 전환 거부 | 유효하지 않은 전환 시 HTTP 400이 반환된다 |
| R-WF-008~012 | 사용자 편집 | submitted/revision_requested 상태에서만 편집 성공, 소유권 검증 통과 |
| R-WF-013~016 | 사용자 취소 | submitted/revision_requested 상태에서만 취소 성공, 확인 다이얼로그 표시 |
| R-WF-017~021 | 관리자 피드백 | revision_requested/rejected 전환 시 피드백 필수, 사용자에게 표시됨 |
| R-WF-022~025 | UI 변경 | 새 상태 배지, 전환 UI, 편집/취소 버튼, 확장 ProgressStepper 동작 |

---

## 10. 범위 밖 (Out of Scope)

- **이메일/푸시 알림**: 상태 변경 시 사용자에게 이메일 알림 전송 (별도 SPEC으로 계획)
- **실시간 업데이트**: WebSocket 또는 SSE를 통한 실시간 상태 변경 알림
- **대량 상태 변경**: 관리자가 여러 요청의 상태를 한 번에 변경하는 기능
- **요청 재생성**: 취소/반려된 요청을 기반으로 새 요청을 복제하는 기능
- **관리자-사용자 메시징 스레드**: 피드백 외 자유로운 메시지 교환 (Phase 4 계획)
- **RLS 정책 변경**: 보안 강화를 위한 RLS 정책 수정 (SPEC-SECURITY-001로 분리)

---

## 11. 의존성 (Dependencies)

### 내부 의존성

| 의존성 | 유형 | 영향 |
|--------|------|------|
| `src/types/request.ts` | 타입 변경 | RequestStatus 확장 시 이 타입을 사용하는 모든 컴포넌트에 영향 |
| `src/lib/storage.ts` | 함수 변경 | updateRequest 함수에 adminFeedback 처리 로직 추가 필요 |
| `src/lib/auth-utils.ts` | 기존 활용 | requireAuth, isAdmin 함수 변경 없이 재사용 |
| Supabase 마이그레이션 | DB 변경 | CHECK 제약조건 변경 + 컬럼 추가 마이그레이션 실행 필수 |

### 외부 의존성

| 의존성 | 버전 | 용도 |
|--------|------|------|
| Supabase PostgreSQL | - | DB 마이그레이션 실행 환경 |
| Next.js API Routes | 16.1.6 | 신규 API 엔드포인트 추가 |

---

## 12. 트레이서빌리티 (Traceability)

| 요구사항 | 관련 파일 | 테스트 |
|---------|----------|--------|
| R-WF-001 | `src/types/request.ts` | AC-WF-001 |
| R-WF-002~007 | `src/types/request.ts`, `src/app/api/requests/[id]/route.ts` | AC-WF-002~007 |
| R-WF-008~012 | `src/app/api/requests/my/[id]/route.ts` | AC-WF-008~012 |
| R-WF-013~016 | `src/app/api/requests/my/[id]/cancel/route.ts` | AC-WF-013~016 |
| R-WF-017~021 | `src/app/api/requests/[id]/route.ts`, `src/lib/storage.ts` | AC-WF-017~021 |
| R-WF-022~025 | `src/components/admin/`, `src/components/dashboard/` | AC-WF-022~025 |
