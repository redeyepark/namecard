---
id: SPEC-WF-001
title: 확장 상태 워크플로우 및 요청 편집/취소 기능 - 구현 계획
version: 1.0.0
status: draft
created: 2026-02-22
related-spec: SPEC-WF-001
---

# SPEC-WF-001: 구현 계획 (Implementation Plan)

## 구현 전략 개요

본 기능은 **데이터베이스 -> 타입/비즈니스 로직 -> API -> UI** 순서의 바텀업 방식으로 구현한다. 이 접근법은 각 계층이 하위 계층에 의존하므로 테스트 가능성과 안정성을 보장한다.

---

## 마일스톤 1: 데이터베이스 및 타입 기반 구축 [Priority: High]

### 목표
확장 상태를 지원하는 DB 스키마와 TypeScript 타입 시스템 구축

### 태스크

#### T-01: DB 마이그레이션 스크립트 작성 및 실행
- **파일**: `supabase/migrations/003_extend_workflow_statuses.sql`
- **작업 내용**:
  - `card_requests` 테이블 `status` CHECK 제약조건을 7개 상태로 확장
  - `card_request_status_history` 테이블 `status` CHECK 제약조건을 7개 상태로 확장
  - `card_request_status_history` 테이블에 `admin_feedback TEXT` 컬럼 추가
- **검증**: Supabase SQL Editor에서 마이그레이션 실행 후, 새 상태 값으로 INSERT 테스트

#### T-02: RequestStatus 타입 확장
- **파일**: `src/types/request.ts`
- **작업 내용**:
  - `RequestStatus` union 타입에 4개 상태 추가: `revision_requested`, `rejected`, `delivered`, `cancelled`
  - `StatusHistoryEntry` 인터페이스에 `adminFeedback?: string` 필드 추가
  - `VALID_TRANSITIONS` 맵을 확장된 7개 상태로 업데이트
  - 편의 함수 추가: `isEditableStatus(status)`, `isCancellableStatus(status)`, `isTerminalStatus(status)`
- **검증**: TypeScript 컴파일 통과, 기존 코드에서 타입 오류 없음 확인

#### T-03: storage.ts 업데이트
- **파일**: `src/lib/storage.ts`
- **작업 내용**:
  - `getRequest()` 함수에서 `admin_feedback` 컬럼을 `card_request_status_history` 조회에 포함
  - `updateRequest()` 함수에서 `statusHistory` 항목의 `adminFeedback` 필드를 DB에 저장하도록 수정
  - 사용자 요청 편집용 `updateRequestByUser()` 함수 추가 (카드 데이터 + 아바타 + 메모 업데이트)
- **검증**: 단위 테스트로 admin_feedback 저장/조회 확인

### 산출물
- 마이그레이션 스크립트 파일
- 확장된 타입 정의
- 업데이트된 데이터 접근 함수

---

## 마일스톤 2: API 엔드포인트 구현 [Priority: High]

### 목표
확장된 상태 전환, 사용자 편집, 취소를 위한 API 구현

### 태스크

#### T-04: 관리자 PATCH API 확장
- **파일**: `src/app/api/requests/[id]/route.ts`
- **작업 내용**:
  - 요청 본문에서 `adminFeedback` 파싱 추가
  - `revision_requested` 전환 시 `adminFeedback` 필수 검증 로직
  - `rejected` 전환 시 `adminFeedback` 필수 검증 로직
  - `statusHistory` 항목에 `adminFeedback` 포함하여 저장
  - `confirmed -> delivered` 전환 지원
  - `submitted -> rejected` 전환 지원
- **검증**: API 테스트로 각 전환 시나리오 확인 (성공/실패)

#### T-05: 사용자 편집 API 생성
- **파일**: `src/app/api/requests/my/[id]/route.ts` (신규)
- **작업 내용**:
  - `PATCH` 핸들러 구현
  - `requireAuth`로 인증 검증
  - 요청 소유권 검증 (`created_by === user.email`)
  - 편집 가능 상태 검증 (`submitted` 또는 `revision_requested`)
  - 카드 데이터 부분 업데이트 처리
  - 아바타 이미지 업데이트 시 Storage 재업로드
  - `revision_requested` 상태에서 편집 시 `submitted`로 자동 전환 + 이력 기록
- **검증**: 소유권 검증, 상태 검증, 데이터 업데이트 각각 테스트

#### T-06: 사용자 취소 API 생성
- **파일**: `src/app/api/requests/my/[id]/cancel/route.ts` (신규)
- **작업 내용**:
  - `POST` 핸들러 구현
  - `requireAuth`로 인증 검증
  - 요청 소유권 검증
  - 취소 가능 상태 검증 (`submitted` 또는 `revision_requested`)
  - 상태를 `cancelled`로 변경 + 이력 기록
- **검증**: 취소 성공/실패 시나리오 테스트

### 산출물
- 수정된 관리자 PATCH API
- 신규 사용자 편집 PATCH API
- 신규 사용자 취소 POST API

---

## 마일스톤 3: 관리자 UI 업데이트 [Priority: High]

### 목표
관리자 대시보드에서 확장된 상태 전환 및 피드백 입력 UI 제공

### 태스크

#### T-07: StatusBadge 컴포넌트 확장
- **파일**: `src/components/admin/StatusBadge.tsx`
- **작업 내용**:
  - `STATUS_CONFIG`에 4개 새 상태 추가:
    - `revision_requested`: `{ label: '수정 요청', className: 'bg-purple-100 text-purple-800' }`
    - `rejected`: `{ label: '반려', className: 'bg-red-100 text-red-800' }`
    - `delivered`: `{ label: '배송 완료', className: 'bg-indigo-100 text-indigo-800' }`
    - `cancelled`: `{ label: '취소됨', className: 'bg-gray-100 text-gray-500' }`
- **검증**: 모든 7개 상태에 대해 배지 렌더링 확인

#### T-08: RequestDetail 컴포넌트 확장 (관리자)
- **파일**: `src/components/admin/RequestDetail.tsx`
- **작업 내용**:
  - `processing` 상태에서 "수정 요청" 버튼 + 피드백 textarea 추가
  - `submitted` 상태에서 "반려" 버튼 + 반려 사유 textarea 추가
  - `confirmed` 상태에서 "배송 완료" 버튼 추가
  - 피드백/사유가 빈 문자열일 때 해당 전환 버튼 비활성화
  - API 호출 시 `adminFeedback` 포함
  - `revision_requested`, `rejected` 상태의 배너 표시
- **검증**: 각 상태별 올바른 버튼 표시, 피드백 필수 검증 동작 확인

#### T-09: StatusHistory 컴포넌트 확장
- **파일**: `src/components/admin/StatusHistory.tsx`
- **작업 내용**:
  - `StatusHistoryEntry`에 `adminFeedback` 표시 지원
  - 피드백이 있는 이력 항목에 말풍선 스타일로 피드백 메시지 표시
- **검증**: 피드백이 있는/없는 이력 항목 모두 올바르게 렌더링

### 산출물
- 확장된 상태 배지 컴포넌트
- 피드백 입력 기능이 추가된 관리자 상세 뷰
- 피드백 표시 기능이 추가된 상태 이력 컴포넌트

---

## 마일스톤 4: 사용자 UI 업데이트 [Priority: High]

### 목표
사용자 대시보드에서 편집/취소 기능 및 피드백 확인 UI 제공

### 태스크

#### T-10: MyRequestDetail 컴포넌트 확장
- **파일**: `src/components/dashboard/MyRequestDetail.tsx`
- **작업 내용**:
  - `revision_requested` 상태에서 관리자 피드백 배너 표시 (보라색 배경)
  - `rejected` 상태에서 반려 사유 배너 표시 (빨간색 배경)
  - `cancelled` 상태에서 취소됨 배너 표시 (회색 배경)
  - `delivered` 상태에서 배송 완료 배너 표시 (남색 배경)
  - 편집 가능 상태일 때 "편집" 버튼 추가
  - 취소 가능 상태일 때 "취소" 버튼 추가
  - 취소 버튼 클릭 시 확인 다이얼로그 표시
- **검증**: 각 상태별 배너, 버튼 표시/숨김 동작 확인

#### T-11: EditRequestForm 컴포넌트 생성
- **파일**: `src/components/dashboard/EditRequestForm.tsx` (신규)
- **작업 내용**:
  - 기존 위저드 입력 필드를 재활용한 편집 폼 구현
  - displayName, fullName, title 텍스트 입력
  - hashtags 편집 (HashtagEditor 재사용)
  - socialLinks 편집 (SocialLinkEditor 재사용)
  - 앞면/뒷면 배경색 편집 (ColorPicker 재사용)
  - 아바타 이미지 변경 (ImageUploader 재사용)
  - 메모(note) 편집
  - 저장 버튼: `PATCH /api/requests/my/[id]` 호출
  - 취소(편집 취소) 버튼: 편집 모드 종료
  - 로딩/에러 상태 처리
- **검증**: 폼 데이터 바인딩, API 호출, 에러 처리 동작 확인

#### T-12: DashboardDetailPage 통합
- **파일**: `src/app/dashboard/[id]/page.tsx`
- **작업 내용**:
  - `isEditing` 상태 관리 추가
  - 편집 모드일 때 `EditRequestForm` 렌더링
  - 편집/취소 완료 시 데이터 재조회
  - 취소 API 호출 및 결과 처리
- **검증**: 편집 모드 전환, 데이터 새로고침, 페이지 이동 동작 확인

#### T-13: ProgressStepper 확장
- **파일**: `src/components/dashboard/ProgressStepper.tsx`
- **작업 내용**:
  - 기존 3단계 (의뢰됨/작업중/확정) 표시에서 확장 상태 지원
  - `revision_requested`: 의뢰됨 단계로 "회귀" 시각화 (수정 요청 표시)
  - `rejected`: 전체 프로세스 중단 시각화 (빨간색)
  - `delivered`: 확정 이후 배송 완료 단계 추가
  - `cancelled`: 전체 프로세스 취소 시각화 (회색)
- **검증**: 모든 7개 상태에 대한 시각적 표현 확인

### 산출물
- 피드백 배너 및 편집/취소 버튼이 추가된 사용자 상세 뷰
- 신규 편집 폼 컴포넌트
- 확장된 진행 상태 인디케이터

---

## 마일스톤 5: 통합 테스트 및 검증 [Priority: High]

### 목표
전체 워크플로우 엔드투엔드 동작 검증

### 태스크

#### T-14: API 통합 테스트
- **작업 내용**:
  - 전체 상태 전환 시나리오 테스트 (Happy Path)
  - 유효하지 않은 전환 시나리오 테스트 (Sad Path)
  - 사용자 편집 API 소유권/상태 검증 테스트
  - 사용자 취소 API 소유권/상태 검증 테스트
  - 관리자 피드백 필수 검증 테스트
- **검증**: 모든 테스트 케이스 통과

#### T-15: UI 기능 테스트
- **작업 내용**:
  - 각 상태에서 올바른 UI 요소가 표시되는지 확인
  - 편집 폼 데이터 바인딩 및 저장 동작 확인
  - 취소 확인 다이얼로그 동작 확인
  - 피드백 배너 표시 확인
  - 상태 배지 색상/라벨 확인
- **검증**: 시각적 검증 + 기능 동작 확인

#### T-16: 엣지 케이스 처리
- **작업 내용**:
  - 동시 수정 시나리오 (사용자가 편집 중 관리자가 상태 변경)
  - 네트워크 오류 시 사용자 피드백
  - 빈 카드 데이터 편집
  - 대용량 아바타 이미지 업데이트
- **검증**: 오류 상황에서의 graceful degradation 확인

### 산출물
- 통합 테스트 결과 보고
- 엣지 케이스 처리 확인

---

## 기술 접근 (Technical Approach)

### 아키텍처 설계 방향

1. **타입 안전성 (Type Safety)**: `RequestStatus` union 타입 확장으로 컴파일 타임에 상태 관련 오류를 포착한다. 편의 함수 (`isEditableStatus`, `isCancellableStatus`, `isTerminalStatus`)를 통해 상태 검증을 중앙화한다.

2. **API 라우트 분리**: 관리자 API (`/api/requests/[id]`)와 사용자 API (`/api/requests/my/[id]`)를 분리하여 관심사를 명확히 구분한다. 각 API는 독립적인 인증/인가 검증을 수행한다.

3. **컴포넌트 재사용**: 편집 폼에서 기존 에디터 컴포넌트 (HashtagEditor, SocialLinkEditor, ColorPicker, ImageUploader)를 재사용하여 코드 중복을 최소화한다.

4. **점진적 마이그레이션**: DB CHECK 제약조건 변경은 기존 데이터에 영향을 주지 않으며, 새 컬럼 (`admin_feedback`)은 nullable이므로 하위 호환성이 유지된다.

### 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 방안 |
|--------|--------|------|----------|
| DB 마이그레이션 실패 | Low | High | Supabase SQL Editor에서 수동 실행, 롤백 스크립트 준비 |
| 타입 확장에 따른 기존 컴포넌트 타입 오류 | Medium | Medium | TypeScript strict 모드에서 컴파일 후 오류 목록 확인 및 일괄 수정 |
| 사용자가 편집 중 관리자가 상태 변경 | Medium | Medium | API 호출 시 현재 상태 재확인, 충돌 시 에러 메시지 및 데이터 새로고침 안내 |
| revision_requested에서 submitted로의 자동 전환 시 이력 누락 | Low | Medium | 편집 API에서 상태 전환과 이력 기록을 트랜잭션으로 처리 |

### 파일 변경 요약

| 파일 | 변경 유형 | 태스크 |
|------|----------|--------|
| `supabase/migrations/003_extend_workflow_statuses.sql` | 신규 | T-01 |
| `src/types/request.ts` | 수정 | T-02 |
| `src/lib/storage.ts` | 수정 | T-03 |
| `src/app/api/requests/[id]/route.ts` | 수정 | T-04 |
| `src/app/api/requests/my/[id]/route.ts` | 신규 | T-05 |
| `src/app/api/requests/my/[id]/cancel/route.ts` | 신규 | T-06 |
| `src/components/admin/StatusBadge.tsx` | 수정 | T-07 |
| `src/components/admin/RequestDetail.tsx` | 수정 | T-08 |
| `src/components/admin/StatusHistory.tsx` | 수정 | T-09 |
| `src/components/dashboard/MyRequestDetail.tsx` | 수정 | T-10 |
| `src/components/dashboard/EditRequestForm.tsx` | 신규 | T-11 |
| `src/app/dashboard/[id]/page.tsx` | 수정 | T-12 |
| `src/components/dashboard/ProgressStepper.tsx` | 수정 | T-13 |

---

## 전문가 상담 권장

본 SPEC은 다음 영역에서 전문가 상담이 도움이 될 수 있다:

### expert-backend 상담 권장
- API 라우트 설계 (관리자 API vs 사용자 API 분리 패턴)
- DB 마이그레이션 전략 (CHECK 제약조건 변경, 하위 호환성)
- 동시성 처리 (사용자 편집 중 관리자 상태 변경 시나리오)

### expert-frontend 상담 권장
- EditRequestForm 컴포넌트 설계 (기존 에디터 컴포넌트 재사용 패턴)
- ProgressStepper 확장 설계 (7개 상태 시각화 전략)
- 상태별 조건부 UI 렌더링 패턴

---

## 트레이서빌리티 태그

- SPEC: SPEC-WF-001
- 마일스톤 1 -> R-WF-001 (타입), R-WF-002~006 (전환 규칙)
- 마일스톤 2 -> R-WF-007 (전환 거부), R-WF-008~012 (편집), R-WF-013~016 (취소), R-WF-017~019 (피드백 저장)
- 마일스톤 3 -> R-WF-022~023 (관리자 UI)
- 마일스톤 4 -> R-WF-020~021 (피드백 표시), R-WF-024~025 (사용자 UI)
- 마일스톤 5 -> 전체 요구사항 통합 검증
