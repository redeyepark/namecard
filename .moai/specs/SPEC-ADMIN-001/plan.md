# SPEC-ADMIN-001: 구현 계획

---
spec-id: SPEC-ADMIN-001
version: 1.0.0
status: Planned
created: 2026-02-21
updated: 2026-02-21
---

## 1. 구현 개요

### 1.1 접근 방식

기존 클라이언트 사이드 SPA에 서버 사이드 기능(API Routes + 파일 시스템 스토리지)을 추가하는 하이브리드 아키텍처 전환이다. 기존 위저드 1~4단계의 동작은 그대로 보존하면서, 5단계만 변경하고 어드민 페이지를 신규 추가한다.

### 1.2 구현 원칙

- **기존 동작 보존**: 위저드 1~4단계, localStorage 데이터, 기존 컴포넌트 변경 없음
- **점진적 확장**: 기존 코드베이스에 새 기능을 추가하는 방식
- **프로토타입 수준**: 인증, 에러 복구, 동시성 처리는 최소화

---

## 2. 마일스톤

### 마일스톤 1: 기반 인프라 (Primary Goal)

**목표**: API Routes와 파일 시스템 스토리지의 기반을 구축한다.

**작업 목록:**

1. **데이터 모델 정의**
   - `src/types/request.ts` 생성
   - `CardRequest`, `RequestStatus`, `StatusHistoryEntry` 인터페이스 정의
   - 추적: REQ-U-005

2. **파일 시스템 유틸리티**
   - `src/lib/storage.ts` 생성
   - `data/requests/` 디렉토리 자동 생성 로직
   - JSON 파일 읽기/쓰기 헬퍼 함수
   - Base64 이미지 디코딩 및 파일 저장 함수
   - 이미지 파일 읽기 함수
   - 추적: REQ-U-004, REQ-N-004

3. **`.gitignore` 업데이트**
   - `data/requests/` 경로 추가
   - 추적: TC-007

4. **`uuid` 의존성 추가**
   - `npm install uuid` 및 `npm install -D @types/uuid`
   - 추적: 5.2 API 설계

### 마일스톤 2: API Routes (Primary Goal)

**목표**: 의뢰 CRUD API를 구현한다.

**작업 목록:**

1. **POST /api/requests (의뢰 생성)**
   - `src/app/api/requests/route.ts` 생성
   - 요청 데이터 유효성 검증
   - UUID 생성, 이미지 파일 저장, JSON 메타데이터 저장
   - 201 Created 응답 반환
   - 추적: REQ-E-005, REQ-U-003

2. **GET /api/requests (의뢰 목록)**
   - 같은 파일 내 GET 핸들러 추가
   - 전체 JSON 파일 스캔 및 요약 정보 추출
   - 최신순 정렬
   - 추적: REQ-E-006

3. **GET /api/requests/[id] (의뢰 상세)**
   - `src/app/api/requests/[id]/route.ts` 생성
   - JSON 파일 읽기 및 이미지 URL 첨부
   - 404 처리
   - 추적: REQ-E-007, REQ-N-003

4. **PATCH /api/requests/[id] (의뢰 업데이트)**
   - 같은 파일 내 PATCH 핸들러 추가
   - 상태 전환 규칙 검증 (역방향 금지)
   - 일러스트 이미지 저장
   - 상태 이력 업데이트
   - 추적: REQ-E-008, REQ-N-001

5. **GET /api/requests/[id]/avatar (원본 이미지)**
   - `src/app/api/requests/[id]/avatar/route.ts` 생성
   - 이미지 파일 스트리밍 응답
   - 추적: 5.2.5

6. **GET /api/requests/[id]/illustration (일러스트 이미지)**
   - `src/app/api/requests/[id]/illustration/route.ts` 생성
   - 이미지 파일 스트리밍 응답 (없으면 404)
   - 추적: 5.2.6

### 마일스톤 3: 위저드 5단계 변경 (Primary Goal)

**목표**: CompleteStep을 RequestSubmitStep으로 교체한다.

**작업 목록:**

1. **RequestSubmitStep 컴포넌트 생성**
   - `src/components/wizard/RequestSubmitStep.tsx` 생성
   - 카드 앞면/뒷면 최종 미리보기 (기존 CardFront, CardBack 재사용)
   - 선택적 메모 입력 필드
   - "의뢰하기" 버튼 (API 호출)
   - 로딩/성공/에러 상태 관리
   - 성공 시 확인 화면 (요청 ID 표시)
   - 추적: REQ-E-001~004, REQ-S-005

2. **WizardContainer 수정**
   - `CompleteStep` import를 `RequestSubmitStep`으로 교체
   - `wizardStep === 5` 렌더링 변경
   - 추적: REQ-U-001

3. **ProgressBar 수정**
   - `STEP_LABELS` 배열의 5번째 항목: '완료' -> '의뢰'
   - 추적: 5.4.2

### 마일스톤 4: 어드민 대시보드 (Secondary Goal)

**목표**: 의뢰 목록을 조회하는 어드민 대시보드를 구현한다.

**작업 목록:**

1. **어드민 공통 컴포넌트**
   - `src/components/admin/StatusBadge.tsx` 생성 (상태별 배지)
   - 추적: 5.4.3

2. **RequestList 컴포넌트**
   - `src/components/admin/RequestList.tsx` 생성
   - 의뢰 목록 테이블 (ID, 이름, 제출일, 상태 배지)
   - 행 클릭 시 상세 페이지 이동
   - 빈 상태 메시지
   - 데이터 fetch (GET /api/requests)
   - 추적: REQ-E-009~010

3. **어드민 대시보드 페이지**
   - `src/app/admin/page.tsx` 생성
   - 페이지 제목, RequestList 렌더링
   - 추적: REQ-E-009

4. **어드민 레이아웃**
   - `src/app/admin/layout.tsx` 생성 (선택적)
   - 어드민 전용 네비게이션 또는 헤더

### 마일스톤 5: 어드민 상세 페이지 (Secondary Goal)

**목표**: 개별 의뢰를 관리하는 상세 페이지를 구현한다.

**작업 목록:**

1. **IllustrationUploader 컴포넌트**
   - `src/components/admin/IllustrationUploader.tsx` 생성
   - 드래그앤드롭 + 클릭 파일 선택 (기존 ImageUploader 참고)
   - 이미지 미리보기
   - 추적: REQ-E-011

2. **CardCompare 컴포넌트**
   - `src/components/admin/CardCompare.tsx` 생성
   - 원본 사진 vs 일러스트 나란히 비교
   - CardFront를 재사용하여 카드 미리보기
   - 추적: REQ-E-011

3. **StatusHistory 컴포넌트**
   - `src/components/admin/StatusHistory.tsx` 생성
   - 상태 변경 이력 타임라인
   - 추적: REQ-O-002

4. **RequestDetail 컴포넌트**
   - `src/components/admin/RequestDetail.tsx` 생성
   - 카드 데이터 읽기 전용 표시
   - 이미지 비교 섹션
   - 사용자 메모 표시
   - "등록" / "확정" 액션 버튼
   - 상태별 UI 분기 (REQ-S-001~003)
   - 추적: REQ-E-011~013, REQ-S-001~004

5. **어드민 상세 페이지**
   - `src/app/admin/[id]/page.tsx` 생성
   - RequestDetail 렌더링
   - 데이터 fetch (GET /api/requests/[id])
   - 추적: REQ-E-011

### 마일스톤 6: 통합 및 품질 검증 (Final Goal)

**목표**: 전체 플로우를 통합 테스트하고 품질을 검증한다.

**작업 목록:**

1. **E2E 플로우 테스트**
   - 사용자: 위저드 1~5단계 -> 의뢰 제출 -> 확인 화면
   - 어드민: 목록 조회 -> 상세 -> 일러스트 업로드 -> 등록 -> 확정
   - 에러 케이스: API 실패, 잘못된 파일, 존재하지 않는 ID

2. **기존 기능 회귀 테스트**
   - 위저드 1~4단계 정상 동작 확인
   - localStorage 데이터 호환성 확인
   - PNG 내보내기 기능 정상 동작 확인

3. **접근성 검증**
   - ARIA 속성 확인
   - 키보드 네비게이션 확인
   - 스크린 리더 호환성

---

## 3. 파일 변경 계획

### 3.1 신규 파일

| 파일 경로 | 설명 | 마일스톤 |
|----------|------|---------|
| `src/types/request.ts` | 의뢰 데이터 타입 정의 | M1 |
| `src/lib/storage.ts` | 파일 시스템 스토리지 유틸리티 | M1 |
| `src/app/api/requests/route.ts` | POST, GET API 핸들러 | M2 |
| `src/app/api/requests/[id]/route.ts` | GET, PATCH API 핸들러 | M2 |
| `src/app/api/requests/[id]/avatar/route.ts` | 아바타 이미지 서빙 | M2 |
| `src/app/api/requests/[id]/illustration/route.ts` | 일러스트 이미지 서빙 | M2 |
| `src/components/wizard/RequestSubmitStep.tsx` | 5단계 의뢰 제출 | M3 |
| `src/components/admin/StatusBadge.tsx` | 상태 배지 | M4 |
| `src/components/admin/RequestList.tsx` | 의뢰 목록 | M4 |
| `src/app/admin/page.tsx` | 어드민 대시보드 | M4 |
| `src/app/admin/layout.tsx` | 어드민 레이아웃 | M4 |
| `src/components/admin/IllustrationUploader.tsx` | 일러스트 업로드 | M5 |
| `src/components/admin/CardCompare.tsx` | 원본/일러스트 비교 | M5 |
| `src/components/admin/StatusHistory.tsx` | 상태 이력 | M5 |
| `src/components/admin/RequestDetail.tsx` | 의뢰 상세 정보 | M5 |
| `src/app/admin/[id]/page.tsx` | 어드민 상세 페이지 | M5 |

### 3.2 수정 파일

| 파일 경로 | 변경 내용 | 마일스톤 |
|----------|----------|---------|
| `src/components/wizard/WizardContainer.tsx` | CompleteStep -> RequestSubmitStep 교체 | M3 |
| `src/components/wizard/ProgressBar.tsx` | '완료' -> '의뢰' 레이블 변경 | M3 |
| `.gitignore` | `data/requests/` 추가 | M1 |
| `package.json` | `uuid`, `@types/uuid` 의존성 추가 | M1 |

### 3.3 삭제 고려 파일

| 파일 경로 | 상태 | 비고 |
|----------|------|------|
| `src/components/wizard/CompleteStep.tsx` | 유지 (미삭제) | RequestSubmitStep이 대체하지만, 참조용으로 유지. 향후 정리 |

---

## 4. 기술적 접근

### 4.1 파일 시스템 스토리지 설계

```typescript
// src/lib/storage.ts 핵심 함수

// 디렉토리 확인 및 생성
async function ensureDataDir(): Promise<void>

// 의뢰 저장
async function saveRequest(request: CardRequest): Promise<void>

// Base64 이미지를 파일로 저장
async function saveImageFile(id: string, suffix: string, base64Data: string): Promise<string>

// 의뢰 읽기
async function getRequest(id: string): Promise<CardRequest | null>

// 모든 의뢰 목록 읽기
async function getAllRequests(): Promise<CardRequest[]>

// 의뢰 업데이트
async function updateRequest(id: string, updates: Partial<CardRequest>): Promise<CardRequest | null>

// 이미지 파일 읽기
async function getImageFile(id: string, suffix: string): Promise<Buffer | null>
```

### 4.2 API Route Handler 패턴

Next.js 16 App Router의 Route Handler를 사용하며, 각 핸들러는 다음 패턴을 따른다:

```typescript
// src/app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 1. 요청 본문 파싱
  // 2. 유효성 검증
  // 3. 비즈니스 로직 (storage 함수 호출)
  // 4. 응답 반환
}

export async function GET() {
  // 1. 전체 목록 조회
  // 2. 요약 정보 추출
  // 3. 정렬
  // 4. 응답 반환
}
```

### 4.3 클라이언트 API 호출 패턴

```typescript
// fetch를 사용한 직접 호출 (별도 라이브러리 없음)
const response = await fetch('/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ card, avatarImage, note }),
});
```

### 4.4 상태 전환 로직

```
[submitted] ---(등록)--> [processing] ---(확정)--> [confirmed]
     |                       |                         |
     |                       |                         x (변경 불가)
     x (역방향 불가)          x (역방향 불가)
```

유효한 전환:
- `submitted` -> `processing`
- `processing` -> `confirmed`

거부되는 전환:
- `confirmed` -> 어떤 상태든
- `processing` -> `submitted`

---

## 5. 위험 분석

### 5.1 기술적 위험

| 위험 | 영향 | 발생 가능성 | 대응 방안 |
|------|------|-----------|----------|
| Vercel 배포 시 파일 시스템 비영속성 | High | High | 로컬 개발 전용 명시, 프로덕션은 외부 스토리지 필요 |
| 대용량 Base64 이미지 전송 | Medium | Medium | 이미지 크기 제한(10MB), 클라이언트 사전 검증 |
| 동시 파일 쓰기 충돌 | Low | Low | 프로토타입 수준으로 허용, 향후 잠금 메커니즘 추가 |
| JSON 파일 스캔 성능 | Low | Low | 100건 이하 가정, 인덱스 파일 도입 가능 |

### 5.2 아키텍처 위험

| 위험 | 영향 | 발생 가능성 | 대응 방안 |
|------|------|-----------|----------|
| 인증 미구현 (누구나 어드민 접근) | High | High | 프로토타입 단계 명시, 프로덕션 전환 시 인증 필수 |
| localStorage -> API 전환 혼선 | Medium | Low | 기존 localStorage 로직은 변경하지 않음 |

---

## 6. 의존성

### 6.1 외부 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `uuid` | ^11.x | 의뢰 ID 생성 (UUID v4) |
| `@types/uuid` | ^11.x | TypeScript 타입 정의 (dev) |

### 6.2 내부 의존성

| 컴포넌트 | 의존 대상 | 설명 |
|---------|----------|------|
| RequestSubmitStep | CardFront, CardBack | 카드 미리보기 재사용 |
| RequestSubmitStep | useCardStore | 현재 카드 데이터 접근 |
| CardCompare | CardFront | 카드 미리보기 재사용 (일러스트 이미지 오버라이드) |
| IllustrationUploader | ImageUploader (참고) | 유사한 업로드 패턴 참조 |
| API Routes | storage.ts | 파일 시스템 유틸리티 |

---

## 7. 추적성 (Traceability)

| 마일스톤 | 관련 요구사항 |
|---------|-------------|
| M1: 기반 인프라 | REQ-U-004, REQ-U-005, REQ-N-004, TC-006, TC-007 |
| M2: API Routes | REQ-E-005~008, REQ-U-003, REQ-N-001, REQ-N-003 |
| M3: 위저드 5단계 | REQ-E-001~004, REQ-S-005, REQ-U-001, REQ-U-002 |
| M4: 어드민 대시보드 | REQ-E-009~010, REQ-O-003 |
| M5: 어드민 상세 | REQ-E-011~013, REQ-S-001~004, REQ-O-001~002 |
| M6: 통합 및 검증 | 전체 요구사항 |
