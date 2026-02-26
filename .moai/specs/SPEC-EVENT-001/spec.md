---
id: SPEC-EVENT-001
version: "1.0.0"
status: planned
created: "2026-02-26"
updated: "2026-02-26"
author: MoAI
priority: high
---

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용           |
| ----- | ---------- | ------ | ------------------- |
| 1.0.0 | 2026-02-26 | MoAI   | 초기 SPEC 문서 작성 |

---

# SPEC-EVENT-001: 관리자 이벤트 참여 추적 시스템

## 요약

관리자가 이벤트(행사, 워크숍, 컨퍼런스 등)를 생성하고 관리하며, 명함 의뢰(card request)를 특정 이벤트에 연결하여 참여자를 추적할 수 있는 시스템을 구축한다. 이벤트 기반 필터링, 참여 이력 조회, CSV 대량 업로드 시 이벤트 지정, 미할당 의뢰 관리 등을 포함한다. 이벤트에 연결된 참여자가 있는 경우 이벤트 삭제를 방지하여 데이터 무결성을 보장한다.

## 배경 (Environment)

- **프로젝트**: Namecard Editor - Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, Zustand 5 기반 풀스택 애플리케이션
- **데이터베이스**: Supabase PostgreSQL
- **현재 상태**: 명함 의뢰 관리 시스템 구현 완료 (관리자 대시보드, 의뢰 상세, CSV 대량 업로드, 테마 시스템)
- **현재 데이터 모델**:
  - `card_requests` 테이블: id, card_front(JSONB), card_back(JSONB), original_avatar_url, illustration_url, status, submitted_at, updated_at, note, created_by, theme, pokemon_meta
  - `card_request_status_history` 테이블: id, request_id(FK), status, admin_feedback, created_at
  - **이벤트 관련 테이블이나 컬럼은 현재 존재하지 않음**
- **관리자 페이지 구조**:
  - `/admin` - 의뢰 목록 (RequestList.tsx)
  - `/admin/[id]` - 의뢰 상세 (RequestDetail.tsx)
  - `/admin/login` - 로그인
  - `/admin/themes` - 테마 관리
  - `BulkUploadModal.tsx` - CSV 대량 업로드
- **데이터 접근 계층**: `src/lib/storage.ts` (Supabase 직접 호출)
- **타입 정의**: `src/types/request.ts` (CardRequest, RequestStatus), `src/types/card.ts` (CardData, CardTheme)
- **기존 SPEC 참조**: SPEC-ADMIN-001 (관리자 페이지), SPEC-THEME-001 (테마 시스템)

## 가정 (Assumptions)

- 이벤트는 관리자만 생성, 수정, 삭제할 수 있으며, 일반 사용자에게는 노출되지 않는다
- 하나의 card request는 최대 하나의 이벤트에 연결될 수 있다 (1:N 관계 - 이벤트:의뢰)
- 이벤트 연결은 선택사항이며, event_id가 NULL인 의뢰는 "미할당"으로 표시된다
- 기존 card_requests 테이블에 event_id 컬럼을 추가하되, 기존 데이터의 event_id는 NULL로 유지된다
- 이벤트 테이블은 Supabase PostgreSQL에 새로 생성하며, RLS(Row Level Security) 정책을 적용한다
- CSV 대량 업로드 시 event_id 컬럼을 선택적으로 지원하며, 없는 경우 NULL 처리한다
- 이벤트 통계 대시보드는 Optional 기능으로, 초기 구현에서는 참여자 수 카운트만 제공한다
- 이벤트 날짜는 단일 날짜(event_date)로 관리하며, 시작/종료 날짜 범위는 추후 확장 가능하도록 설계한다

---

## 요구사항 (Requirements)

### Ubiquitous (보편적 요구사항)

**REQ-U-001**: 시스템은 **항상** 이벤트 목록을 각 이벤트의 참여자 수(연결된 card request 수)와 함께 표시해야 한다.

> 관리자가 이벤트 관리 페이지에 접근할 때마다 이벤트명, 설명, 날짜, 장소와 함께 해당 이벤트에 연결된 의뢰 건수가 실시간으로 표시되어야 한다.

---

### Event-Driven (이벤트 기반 요구사항)

**REQ-E-001**: **WHEN** 관리자가 이벤트 생성 폼을 제출하면 **THEN** 시스템은 이벤트 메타데이터(이름, 설명, 날짜, 장소)를 검증하고 events 테이블에 새 레코드를 저장해야 한다.

> 이벤트 이름은 필수이며 최대 100자, 설명은 선택 사항이며 최대 500자, 날짜는 유효한 ISO 8601 형식, 장소는 선택 사항이며 최대 200자로 제한한다.

**REQ-E-002**: **WHEN** 관리자가 의뢰 상세 페이지에서 이벤트를 선택하면 **THEN** 시스템은 해당 card request의 event_id를 업데이트하고 변경 이력을 기록해야 한다.

> 이벤트 셀렉터는 드롭다운 형태로 제공되며, "미할당" 옵션을 포함하여 이벤트 연결 해제도 가능해야 한다.

**REQ-E-003**: **WHEN** 관리자가 의뢰 목록에서 이벤트 필터를 적용하면 **THEN** 시스템은 선택된 이벤트에 연결된 의뢰만 필터링하여 표시해야 한다.

> 필터 옵션에는 "전체", "미할당", 그리고 각 이벤트가 포함된다. 기본값은 "전체"이다.

**REQ-E-004**: **WHEN** 관리자가 특정 참여자(created_by 이메일)를 조회하면 **THEN** 시스템은 해당 사용자가 참여한 모든 이벤트의 이력을 시간순으로 표시해야 한다.

> 참여 이력에는 이벤트명, 참여 날짜(submitted_at), 의뢰 상태가 포함된다.

**REQ-E-005**: **WHEN** 관리자가 CSV 대량 업로드 시 이벤트를 선택하면 **THEN** 시스템은 업로드되는 모든 의뢰에 해당 event_id를 자동으로 할당해야 한다.

> BulkUploadModal에 이벤트 드롭다운 셀렉터를 추가하며, 선택하지 않으면 NULL(미할당)로 처리한다.

---

### State-Driven (상태 기반 요구사항)

**REQ-S-001**: **IF** card request의 event_id가 NULL이면 **THEN** 시스템은 해당 의뢰를 "미할당" 라벨과 함께 표시해야 한다.

> 미할당 라벨은 시각적으로 구별 가능한 배지(예: 회색 배지)로 표시되며, 이벤트가 할당된 의뢰는 이벤트명 배지로 표시된다.

---

### Unwanted (비허용 요구사항)

**REQ-N-001**: 시스템은 연결된 참여자(card request)가 1건 이상 존재하는 이벤트를 삭제**하지 않아야 한다**.

> 삭제 시도 시 "이 이벤트에 N건의 의뢰가 연결되어 있어 삭제할 수 없습니다. 먼저 의뢰의 이벤트 연결을 해제해주세요." 메시지를 표시한다.

---

### Optional (선택적 요구사항)

**REQ-O-001**: **가능하면** 이벤트 통계 대시보드를 제공하여 이벤트별 참여자 수, 상태별 분포, 테마별 분포를 시각화한다.

> 초기 구현에서는 참여자 수 카운트와 상태별 분포만 표시하고, 차트 시각화는 추후 확장한다.

---

## 명세 (Specifications)

### 데이터 모델

#### 신규 테이블: events

| 컬럼         | 타입                        | 제약 조건          | 설명                           |
| ------------ | --------------------------- | ------------------ | ------------------------------ |
| id           | UUID                        | PRIMARY KEY        | 이벤트 고유 식별자             |
| name         | TEXT                        | NOT NULL, max 100  | 이벤트 이름                    |
| description  | TEXT                        | NULLABLE, max 500  | 이벤트 설명                    |
| event_date   | DATE                        | NULLABLE           | 이벤트 날짜                    |
| location     | TEXT                        | NULLABLE, max 200  | 이벤트 장소                    |
| created_at   | TIMESTAMPTZ                 | DEFAULT now()      | 생성 시각                      |
| updated_at   | TIMESTAMPTZ                 | DEFAULT now()      | 수정 시각                      |

#### 기존 테이블 변경: card_requests

| 변경 내용                  | 설명                                           |
| -------------------------- | ---------------------------------------------- |
| ADD COLUMN event_id UUID   | events 테이블 FK, NULLABLE, DEFAULT NULL       |
| ADD INDEX idx_event_id     | event_id 기반 필터링 성능 최적화               |

### API 엔드포인트

| Method | Path                          | 설명                          | 요구사항     |
| ------ | ----------------------------- | ----------------------------- | ------------ |
| GET    | /api/events                   | 이벤트 목록 (참여자 수 포함)  | REQ-U-001    |
| POST   | /api/events                   | 이벤트 생성                   | REQ-E-001    |
| PUT    | /api/events/[id]              | 이벤트 수정                   | REQ-E-001    |
| DELETE | /api/events/[id]              | 이벤트 삭제 (참여자 확인)     | REQ-N-001    |
| GET    | /api/events/[id]/participants | 이벤트별 참여자 목록          | REQ-E-003    |
| PATCH  | /api/requests/[id]/event      | 의뢰에 이벤트 할당/해제      | REQ-E-002    |
| GET    | /api/participants/[email]     | 참여자 이벤트 이력 조회       | REQ-E-004    |

### 컴포넌트 아키텍처

| 컴포넌트                | 위치                                   | 설명                              |
| ----------------------- | -------------------------------------- | --------------------------------- |
| EventManagementPage     | src/app/admin/events/page.tsx          | 이벤트 관리 메인 페이지           |
| EventList               | src/components/admin/EventList.tsx     | 이벤트 목록 (참여자 수 표시)      |
| EventForm               | src/components/admin/EventForm.tsx     | 이벤트 생성/수정 폼              |
| EventSelector           | src/components/admin/EventSelector.tsx | 이벤트 드롭다운 셀렉터            |
| EventFilter             | src/components/admin/EventFilter.tsx   | 의뢰 목록 이벤트 필터            |
| EventBadge              | src/components/admin/EventBadge.tsx    | 이벤트명/미할당 배지              |
| ParticipantHistory      | src/components/admin/ParticipantHistory.tsx | 참여자 이벤트 이력          |

### 타입 정의

```typescript
// src/types/event.ts

export interface Event {
  id: string;           // UUID
  name: string;         // max 100 chars
  description?: string; // max 500 chars
  eventDate?: string;   // ISO 8601 date
  location?: string;    // max 200 chars
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface EventWithCount extends Event {
  participantCount: number; // linked card_requests count
}

export interface EventParticipant {
  requestId: string;
  displayName: string;
  email?: string;
  status: string;
  submittedAt: string;
  theme?: string;
}

export interface ParticipantEventHistory {
  eventId: string;
  eventName: string;
  eventDate?: string;
  requestId: string;
  status: string;
  submittedAt: string;
}
```

### 추적성 (Traceability)

| 요구사항     | 관련 컴포넌트                                  | API 엔드포인트                      |
| ------------ | ---------------------------------------------- | ----------------------------------- |
| REQ-U-001    | EventList, EventManagementPage                 | GET /api/events                     |
| REQ-E-001    | EventForm, EventManagementPage                 | POST /api/events, PUT /api/events/[id] |
| REQ-E-002    | EventSelector, RequestDetail                   | PATCH /api/requests/[id]/event      |
| REQ-E-003    | EventFilter, RequestList                       | GET /api/events/[id]/participants   |
| REQ-E-004    | ParticipantHistory                             | GET /api/participants/[email]       |
| REQ-E-005    | BulkUploadModal, EventSelector                 | POST /api/requests (기존, event_id 추가) |
| REQ-S-001    | EventBadge, RequestList                        | -                                   |
| REQ-N-001    | EventList, EventManagementPage                 | DELETE /api/events/[id]             |
| REQ-O-001    | EventManagementPage (통계 섹션)                | GET /api/events                     |
