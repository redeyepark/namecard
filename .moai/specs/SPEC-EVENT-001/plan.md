---
id: SPEC-EVENT-001
type: plan
version: "1.0.0"
created: "2026-02-26"
updated: "2026-02-26"
---

# SPEC-EVENT-001: 구현 계획

## 구현 전략

기존 관리자 시스템의 데이터 모델과 UI를 확장하여 이벤트 관리 기능을 추가한다. 데이터베이스 마이그레이션을 통해 events 테이블을 생성하고 card_requests에 event_id FK를 추가한다. 기존 의뢰 관리 흐름에 이벤트 필터링과 할당 기능을 통합하며, 새로운 이벤트 관리 페이지를 추가한다. 모든 변경은 기존 의뢰 관리 기능의 하위 호환성을 보장한다.

---

## Phase 1: 데이터 모델 및 데이터베이스 마이그레이션 (Primary Goal)

**목표**: events 테이블 생성 및 card_requests 테이블 확장

**작업 내용**:

1. Supabase SQL 마이그레이션 작성
   - `events` 테이블 생성 (id UUID PK, name TEXT NOT NULL, description TEXT, event_date DATE, location TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
   - `card_requests` 테이블에 `event_id UUID REFERENCES events(id)` 컬럼 추가 (NULLABLE)
   - `card_requests.event_id`에 인덱스 생성 (`idx_card_requests_event_id`)
   - RLS 정책 설정: 인증된 관리자만 events CRUD 가능

2. 타입 정의 파일 생성
   - `src/types/event.ts` - Event, EventWithCount, EventParticipant, ParticipantEventHistory 인터페이스
   - `src/types/request.ts` - CardRequest 인터페이스에 `eventId?: string` 필드 추가

3. 데이터 접근 계층 확장
   - `src/lib/event-storage.ts` - 이벤트 CRUD 함수 (createEvent, getEvents, getEventById, updateEvent, deleteEvent)
   - `src/lib/storage.ts` - saveRequest, getRequest, getAllRequests에 event_id 처리 추가

**마이그레이션 SQL 스키마**:

```sql
-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  event_date DATE,
  location TEXT CHECK (char_length(location) <= 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add event_id to card_requests
ALTER TABLE card_requests
  ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE RESTRICT;

-- Index for filtering performance
CREATE INDEX idx_card_requests_event_id ON card_requests(event_id);

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage events"
  ON events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**하위 호환성 검증**:
- 기존 card_requests 레코드의 event_id는 NULL로 유지
- event_id NULL인 의뢰의 기존 CRUD 동작이 변경 없이 작동
- getAllRequests, getRequest 함수의 기존 반환값 구조 유지

**관련 요구사항**: REQ-U-001, REQ-E-002, REQ-S-001, REQ-N-001

---

## Phase 2: 이벤트 CRUD API 엔드포인트 (Primary Goal)

**목표**: 이벤트 생성, 조회, 수정, 삭제 API 구현

**작업 내용**:

1. `src/app/api/events/route.ts` - 이벤트 목록 조회(GET) 및 생성(POST)
   - GET: events 테이블을 card_requests와 LEFT JOIN하여 participant_count 집계
   - POST: 입력 검증 (name 필수, 길이 제한) 후 events 테이블에 INSERT

2. `src/app/api/events/[id]/route.ts` - 이벤트 상세 조회(GET), 수정(PUT), 삭제(DELETE)
   - GET: 이벤트 상세 정보 + 참여자 수
   - PUT: 이벤트 메타데이터 업데이트
   - DELETE: 참여자 수 확인 후 0건이면 삭제, 1건 이상이면 409 Conflict 반환

3. `src/app/api/events/[id]/participants/route.ts` - 이벤트별 참여자 목록(GET)
   - card_requests WHERE event_id = ? 조회
   - displayName, email, status, submittedAt 반환

4. `src/app/api/requests/[id]/event/route.ts` - 의뢰 이벤트 할당/해제(PATCH)
   - body: { eventId: string | null }
   - event_id 업데이트

5. `src/app/api/participants/[email]/route.ts` - 참여자 이벤트 이력(GET)
   - card_requests JOIN events WHERE created_by = email
   - 시간순 정렬

**입력 검증 규칙**:
- name: 필수, 1-100자, 공백만으로 구성 불가
- description: 선택, 최대 500자
- event_date: 선택, 유효한 ISO 8601 날짜 형식
- location: 선택, 최대 200자

**에러 응답**:
- 400 Bad Request: 입력 검증 실패
- 404 Not Found: 이벤트/의뢰 미존재
- 409 Conflict: 참여자가 있는 이벤트 삭제 시도

**관련 요구사항**: REQ-U-001, REQ-E-001, REQ-E-003, REQ-E-004, REQ-N-001

---

## Phase 3: 이벤트 관리 UI 컴포넌트 (Secondary Goal)

**목표**: 이벤트 관리 페이지 및 관련 UI 컴포넌트 구현

**작업 내용**:

1. `src/app/admin/events/page.tsx` - 이벤트 관리 메인 페이지
   - 이벤트 목록 표시 (EventList 컴포넌트)
   - 이벤트 생성 버튼 및 폼 (EventForm 모달)
   - 이벤트 수정/삭제 액션

2. `src/components/admin/EventList.tsx` - 이벤트 목록 컴포넌트
   - 이벤트명, 날짜, 장소, 참여자 수 표시
   - 정렬: 최신 이벤트 우선
   - 수정/삭제 버튼 (삭제 시 참여자 수 확인)

3. `src/components/admin/EventForm.tsx` - 이벤트 생성/수정 폼
   - name(필수), description, event_date, location 입력 필드
   - 클라이언트 사이드 검증 + 서버 사이드 검증
   - 생성/수정 모드 분기

4. `src/components/admin/EventBadge.tsx` - 이벤트 배지 컴포넌트
   - 이벤트가 할당된 경우: 이벤트명 배지 (파란색 계열)
   - 미할당: "미할당" 텍스트 배지 (회색 계열)

5. 관리자 네비게이션에 "이벤트 관리" 메뉴 항목 추가

**디자인 원칙**:
- 기존 관리자 페이지의 디자인 시스템 준수 (Tailwind CSS 4, #020912 기본 색상)
- 최소 터치 타겟 44px 유지
- 모달 패턴은 기존 BulkUploadModal과 동일한 UX 패턴 사용

**관련 요구사항**: REQ-U-001, REQ-E-001, REQ-N-001

---

## Phase 4: 의뢰 목록 이벤트 통합 (Secondary Goal)

**목표**: 기존 의뢰 관리 화면에 이벤트 필터링 및 할당 기능 통합

**작업 내용**:

1. `src/components/admin/EventFilter.tsx` - 이벤트 필터 컴포넌트
   - 드롭다운: "전체", "미할당", [이벤트 목록]
   - 선택 시 의뢰 목록을 필터링

2. `src/components/admin/EventSelector.tsx` - 이벤트 셀렉터 컴포넌트
   - 의뢰 상세 페이지에서 이벤트 할당/해제
   - 드롭다운: "미할당", [이벤트 목록]
   - 변경 시 즉시 API 호출

3. `src/components/admin/RequestList.tsx` 수정
   - 이벤트 필터 추가 (EventFilter 통합)
   - 의뢰 행에 EventBadge 표시
   - 필터 상태에 따른 API 호출 파라미터 변경

4. `src/app/admin/[id]/page.tsx` 수정
   - 의뢰 상세 페이지에 EventSelector 추가
   - 이벤트 변경 시 업데이트 처리

5. `src/components/admin/ParticipantHistory.tsx` - 참여자 이벤트 이력
   - created_by 이메일 기반 이벤트 참여 이력 조회
   - 타임라인 형식 표시

**관련 요구사항**: REQ-E-002, REQ-E-003, REQ-E-004, REQ-S-001

---

## Phase 5: CSV 대량 업로드 이벤트 지원 (Secondary Goal)

**목표**: CSV 대량 업로드 시 이벤트 할당 기능 추가

**작업 내용**:

1. `src/components/admin/BulkUploadModal.tsx` 수정
   - 파일 선택 단계에 이벤트 셀렉터 (EventSelector) 추가
   - 선택된 이벤트 ID를 업로드 프로세스에 전달
   - 미선택 시 NULL(미할당) 처리

2. CSV 업로드 API 수정
   - request body에 eventId 필드 추가
   - 각 의뢰 생성 시 event_id 설정

3. 업로드 결과에 이벤트 할당 건수 표시

**관련 요구사항**: REQ-E-005

---

## Phase 6: 이벤트 통계 대시보드 (Optional Goal)

**목표**: 이벤트별 참여 통계 시각화 (선택적 구현)

**작업 내용**:

1. 이벤트 관리 페이지 상단에 요약 통계 섹션 추가
   - 전체 이벤트 수
   - 전체 참여자 수
   - 이벤트별 참여자 수 상위 5개

2. 이벤트 상세에서 상태별 분포 표시
   - submitted, processing, confirmed, delivered 등 상태별 카운트
   - 테마별 분포 (classic, pokemon, hearthstone 등)

3. 간단한 바 차트 또는 도넛 차트 (CSS 기반, 외부 라이브러리 없이)

**관련 요구사항**: REQ-O-001

---

## 기술 의존성

| 기술               | 용도                           | 비고                     |
| ------------------ | ------------------------------ | ------------------------ |
| Supabase PostgreSQL | events 테이블, FK 관계        | 기존 인프라 활용         |
| Next.js App Router | API Route Handlers             | 기존 패턴 준수           |
| TypeScript 5       | Event 타입 정의               | 기존 타입 시스템 확장    |
| Tailwind CSS 4     | UI 스타일링                   | 기존 디자인 시스템 준수  |
| Zustand 5          | 클라이언트 상태 (필요 시)      | 이벤트 필터 상태 캐싱    |

## 위험 분석 및 대응

| 위험 요소                              | 영향도 | 대응 방안                                                    |
| -------------------------------------- | ------ | ------------------------------------------------------------ |
| 마이그레이션 시 기존 데이터 영향       | High   | event_id NULLABLE로 설정, 기존 레코드 변경 없음              |
| LEFT JOIN 성능 저하                    | Medium | event_id 인덱스 생성, 참여자 수 집계 쿼리 최적화            |
| 이벤트 삭제 시 FK 제약조건 충돌        | Medium | ON DELETE RESTRICT + 애플리케이션 레벨 사전 검증             |
| BulkUploadModal 기존 기능 회귀         | Medium | event_id 선택을 optional로 구현, 기존 플로우 변경 최소화     |
| 이벤트 목록이 많아질 때 드롭다운 UX    | Low    | 검색 가능한 드롭다운 적용, 최신 이벤트 우선 정렬             |

## 파일 변경 예상 목록

### 신규 파일
- `src/types/event.ts`
- `src/lib/event-storage.ts`
- `src/app/api/events/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/events/[id]/participants/route.ts`
- `src/app/api/requests/[id]/event/route.ts`
- `src/app/api/participants/[email]/route.ts`
- `src/app/admin/events/page.tsx`
- `src/components/admin/EventList.tsx`
- `src/components/admin/EventForm.tsx`
- `src/components/admin/EventSelector.tsx`
- `src/components/admin/EventFilter.tsx`
- `src/components/admin/EventBadge.tsx`
- `src/components/admin/ParticipantHistory.tsx`

### 수정 파일
- `src/types/request.ts` (CardRequest에 eventId 추가)
- `src/lib/storage.ts` (event_id 처리 추가)
- `src/components/admin/RequestList.tsx` (이벤트 필터, 배지 통합)
- `src/components/admin/BulkUploadModal.tsx` (이벤트 셀렉터 추가)
- `src/app/admin/page.tsx` (이벤트 필터 상태 관리)
- `src/app/admin/[id]/page.tsx` (이벤트 셀렉터 통합)
- 관리자 레이아웃/네비게이션 (이벤트 관리 메뉴 추가)
