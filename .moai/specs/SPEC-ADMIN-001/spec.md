# SPEC-ADMIN-001: 명함 의뢰 시스템 및 어드민 관리 페이지

---
id: SPEC-ADMIN-001
version: 1.0.0
status: Implemented
created: 2026-02-21
updated: 2026-02-22
author: manager-spec
priority: High
related-specs: SPEC-FLOW-001, SPEC-UI-001
lifecycle: spec-first
tags: admin, request, workflow, api-routes, file-storage
---

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-21 | manager-spec | 초기 SPEC 작성 |
| 1.1.0 | 2026-02-22 | MoAI | Status updated to Implemented - Supabase 기반 관리자 대시보드 구현 완료 |

---

## 1. 개요 (Overview)

### 1.1 목적

현재 명함 편집기는 100% 클라이언트 사이드 애플리케이션으로, 사용자가 명함을 디자인하고 PNG로 내보내는 것이 최종 단계이다. 이 SPEC은 명함 제작 워크플로우의 5단계를 **"의뢰하기"** 단계로 전환하고, 어드민이 의뢰를 관리할 수 있는 관리 페이지를 추가하여, 사용자가 명함 디자인을 의뢰하면 어드민이 직접 손그림 일러스트로 교체하여 완성하는 워크플로우를 구현한다.

### 1.2 범위

- 위저드 5단계(CompleteStep)를 의뢰 제출(RequestSubmitStep)으로 변경
- Next.js API Routes를 사용한 서버 사이드 데이터 저장
- 어드민 대시보드 (`/admin`) 및 상세 페이지 (`/admin/[id]`) 구현
- JSON 파일 + 이미지 파일 기반 파일 시스템 스토리지

### 1.3 목표

- 사용자가 명함 데이터를 서버에 의뢰로 제출할 수 있다
- 어드민이 의뢰 목록을 조회하고 개별 의뢰를 관리할 수 있다
- 어드민이 사용자 업로드 사진을 손그림 일러스트로 교체할 수 있다
- 어드민이 의뢰 상태를 관리하고 확정할 수 있다

---

## 2. 환경 (Environment)

### 2.1 현재 시스템 환경

| 항목 | 상세 |
|------|------|
| 프레임워크 | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 |
| 언어 | TypeScript 5.x |
| 스타일링 | Tailwind CSS 4.x |
| 상태 관리 | Zustand 5.0.11 (persist middleware) |
| 현재 라우트 | `/` (랜딩), `/create` (위저드), `/create/edit` (상세 편집) |
| 데이터 저장 | 브라우저 localStorage (`namecard-storage`) |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage) |
| 배포 | Cloudflare Workers (@opennextjs/cloudflare) |

### 2.2 변경 후 환경

| 항목 | 상세 |
|------|------|
| 추가 라우트 | `/admin` (대시보드), `/admin/[id]` (상세) |
| API Routes | `src/app/api/requests/` (Next.js Route Handlers) |
| 서버 스토리지 | Supabase PostgreSQL + Storage |
| 새 의존성 | `uuid` (요청 ID 생성) |

---

## 3. 가정 (Assumptions)

### 3.1 기술적 가정

- **ASM-T-001**: Next.js 16 App Router의 Route Handlers가 파일 시스템 읽기/쓰기를 지원한다
- **ASM-T-002**: `data/requests/` 디렉토리에 대한 읽기/쓰기 권한이 서버 프로세스에 있다
- **ASM-T-003**: Base64 인코딩된 이미지를 디코딩하여 파일로 저장할 수 있다
- **ASM-T-004**: JSON 파일 기반 스토리지는 프로토타입 수준에서 충분한 성능을 제공한다
- **ASM-T-005**: Cloudflare Workers + Supabase 조합으로 영속적 데이터 저장이 해결되었다

### 3.2 비즈니스 가정

- **ASM-B-001**: 동시 의뢰 수는 소규모(100건 이하)로, 파일 시스템 스토리지로 충분하다
- **ASM-B-002**: 어드민 인증은 ADMIN_EMAILS 환경변수 기반으로 구현되었다 (Supabase Auth 연동)
- **ASM-B-003**: 의뢰 상태 흐름은 단방향이다: 의뢰됨 -> 작업중 -> 확정
- **ASM-B-004**: 사용자는 의뢰 제출 후 의뢰 내용을 수정할 수 없다

### 3.3 신뢰도 및 위험

| 가정 ID | 신뢰도 | 틀렸을 때 위험 | 검증 방법 |
|---------|--------|---------------|----------|
| ASM-T-001 | High | Low | Next.js 문서 확인 |
| ASM-T-005 | High | Medium | Vercel 배포 시 외부 스토리지 필요 |
| ASM-B-001 | Medium | Low | 사용량 모니터링 |
| ASM-B-002 | High | Medium | 프로덕션 전환 시 인증 추가 필요 |

---

## 4. 요구사항 (Requirements)

### 4.1 Ubiquitous 요구사항 (항상 활성)

- **REQ-U-001**: 시스템은 **항상** 기존 위저드 1~4단계의 동작을 변경 없이 유지해야 한다
- **REQ-U-002**: 시스템은 **항상** 기존 localStorage 데이터와의 하위 호환성을 유지해야 한다
- **REQ-U-003**: 시스템은 **항상** API 요청/응답에서 적절한 HTTP 상태 코드를 반환해야 한다
- **REQ-U-004**: 시스템은 **항상** 이미지 파일을 Base64가 아닌 실제 파일로 디스크에 저장해야 한다
- **REQ-U-005**: 시스템은 **항상** 의뢰 데이터의 무결성을 보장해야 한다 (JSON 파일과 이미지 파일의 일관성)

### 4.2 Event-Driven 요구사항 (이벤트 기반)

#### A. 위저드 5단계 - 의뢰 제출

- **REQ-E-001**: **WHEN** 사용자가 5단계에서 "의뢰하기" 버튼을 클릭하면, **THEN** 시스템은 현재 카드 데이터와 이미지를 API로 전송해야 한다
- **REQ-E-002**: **WHEN** API가 의뢰를 성공적으로 저장하면, **THEN** 시스템은 의뢰 확인 화면에 요청 ID를 표시해야 한다
- **REQ-E-003**: **WHEN** API가 의뢰 저장에 실패하면, **THEN** 시스템은 사용자에게 오류 메시지를 표시하고 재시도할 수 있도록 해야 한다
- **REQ-E-004**: **WHEN** 의뢰가 성공적으로 제출되면, **THEN** 시스템은 의뢰 상태를 "의뢰됨(submitted)"으로 설정해야 한다

#### B. API Routes

- **REQ-E-005**: **WHEN** POST `/api/requests` 요청이 수신되면, **THEN** 시스템은 카드 데이터를 JSON 파일로, 아바타 이미지를 PNG 파일로 `data/requests/` 디렉토리에 저장해야 한다
- **REQ-E-006**: **WHEN** GET `/api/requests` 요청이 수신되면, **THEN** 시스템은 모든 의뢰 목록을 최신순으로 정렬하여 반환해야 한다
- **REQ-E-007**: **WHEN** GET `/api/requests/[id]` 요청이 수신되면, **THEN** 시스템은 해당 의뢰의 전체 데이터를 반환해야 한다
- **REQ-E-008**: **WHEN** PATCH `/api/requests/[id]` 요청이 수신되면, **THEN** 시스템은 요청된 필드(상태, 일러스트 이미지)를 업데이트해야 한다

#### C. 어드민 대시보드

- **REQ-E-009**: **WHEN** 어드민이 `/admin` 페이지에 접근하면, **THEN** 시스템은 모든 의뢰 목록을 로드하여 표시해야 한다
- **REQ-E-010**: **WHEN** 어드민이 의뢰 항목을 클릭하면, **THEN** 시스템은 해당 의뢰의 상세 페이지(`/admin/[id]`)로 이동해야 한다

#### D. 어드민 상세 페이지

- **REQ-E-011**: **WHEN** 어드민이 상세 페이지에서 일러스트 이미지를 업로드하면, **THEN** 시스템은 원본 사진과 새 일러스트를 나란히 미리보기로 표시해야 한다
- **REQ-E-012**: **WHEN** 어드민이 "등록" 버튼을 클릭하면, **THEN** 시스템은 일러스트를 저장하고 의뢰 상태를 "작업중(processing)"으로 변경해야 한다
- **REQ-E-013**: **WHEN** 어드민이 "확정" 버튼을 클릭하면, **THEN** 시스템은 의뢰 상태를 "확정(confirmed)"으로 변경해야 한다

### 4.3 State-Driven 요구사항 (상태 기반)

- **REQ-S-001**: **IF** 의뢰 상태가 "의뢰됨(submitted)"이면, **THEN** "등록" 버튼과 일러스트 업로드 영역이 활성화되어야 한다
- **REQ-S-002**: **IF** 의뢰 상태가 "작업중(processing)"이면, **THEN** "확정" 버튼이 활성화되고 일러스트 재업로드가 가능해야 한다
- **REQ-S-003**: **IF** 의뢰 상태가 "확정(confirmed)"이면, **THEN** 모든 편집 기능이 비활성화되고 확정 완료 상태를 표시해야 한다
- **REQ-S-004**: **IF** 일러스트 이미지가 아직 업로드되지 않았으면, **THEN** "등록" 버튼은 비활성화되어야 한다
- **REQ-S-005**: **IF** 의뢰 제출 중(로딩 상태)이면, **THEN** "의뢰하기" 버튼은 비활성화되고 로딩 인디케이터가 표시되어야 한다

### 4.4 Unwanted 요구사항 (금지 사항)

- **REQ-N-001**: 시스템은 의뢰 상태를 역방향으로 변경**하지 않아야 한다** (confirmed -> processing 불가)
- **REQ-N-002**: 시스템은 아바타 이미지 없이 의뢰를 제출할 수 있어야 한다 (아바타는 선택사항이므로 차단**하지 않아야 한다**)
- **REQ-N-003**: 시스템은 존재하지 않는 의뢰 ID에 대한 요청 시 500 에러를 반환**하지 않아야 한다** (404 반환)
- **REQ-N-004**: 시스템은 Base64 이미지 데이터를 JSON 파일 내에 인라인으로 저장**하지 않아야 한다** (파일 경로 참조 사용)

### 4.5 Optional 요구사항 (선택 사항)

- **REQ-O-001**: **가능하면** 사용자가 의뢰 시 메모(note)를 추가할 수 있는 텍스트 필드를 제공한다
- **REQ-O-002**: **가능하면** 어드민 상세 페이지에서 의뢰 상태 변경 이력을 표시한다
- **REQ-O-003**: **가능하면** 의뢰 목록에서 상태별 필터링 기능을 제공한다
- **REQ-O-004**: **가능하면** 의뢰 제출 후 사용자에게 의뢰 상태 확인 페이지를 제공한다

---

## 5. 사양 (Specifications)

### 5.1 데이터 모델

#### 5.1.1 CardRequest 인터페이스

```typescript
// src/types/request.ts

export type RequestStatus = 'submitted' | 'processing' | 'confirmed';

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: string;  // ISO 8601
}

export interface CardRequest {
  id: string;                          // UUID v4
  card: CardData;                      // 전체 카드 데이터 스냅샷 (이미지 제외)
  originalAvatarPath: string | null;   // 원본 아바타 이미지 파일 경로
  illustrationPath: string | null;     // 어드민 업로드 일러스트 파일 경로
  status: RequestStatus;
  submittedAt: string;                 // ISO 8601
  updatedAt: string;                   // ISO 8601
  note?: string;                       // 사용자 메모 (선택)
  statusHistory: StatusHistoryEntry[]; // 상태 변경 이력
}
```

#### 5.1.2 파일 시스템 스토리지 구조

```
data/
└── requests/
    ├── {uuid}.json                    # 의뢰 메타데이터
    ├── {uuid}-avatar.png              # 원본 아바타 이미지
    └── {uuid}-illustration.png        # 어드민 일러스트 이미지
```

#### 5.1.3 JSON 파일 스키마 예시

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "card": {
    "front": {
      "displayName": "홍길동",
      "avatarImage": null,
      "backgroundColor": "#E53E3E"
    },
    "back": {
      "fullName": "홍길동",
      "title": "Frontend Developer",
      "hashtags": ["#React", "#TypeScript"],
      "socialLinks": [
        { "platform": "email", "url": "hong@example.com", "label": "Email" }
      ],
      "backgroundColor": "#9B2C2C"
    }
  },
  "originalAvatarPath": "a1b2c3d4-e5f6-7890-abcd-ef1234567890-avatar.png",
  "illustrationPath": null,
  "status": "submitted",
  "submittedAt": "2026-02-21T10:30:00.000Z",
  "updatedAt": "2026-02-21T10:30:00.000Z",
  "note": "따뜻한 느낌으로 그려주세요",
  "statusHistory": [
    { "status": "submitted", "timestamp": "2026-02-21T10:30:00.000Z" }
  ]
}
```

**중요**: JSON 파일 내 `card.front.avatarImage`는 `null`로 설정한다. 실제 이미지는 별도 파일(`{uuid}-avatar.png`)로 저장하며, JSON에는 파일 경로만 `originalAvatarPath`로 참조한다.

### 5.2 API 설계

#### 5.2.1 POST /api/requests - 의뢰 생성

**Request:**
```
POST /api/requests
Content-Type: application/json

{
  "card": CardData,           // 전체 카드 데이터
  "avatarImage": string|null, // Base64 인코딩 이미지 (클라이언트에서 전송)
  "note": string|undefined    // 선택적 메모
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "status": "submitted",
  "submittedAt": "2026-02-21T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request data",
  "details": "card.front.displayName is required"
}
```

**서버 처리 로직:**
1. UUID 생성
2. Base64 이미지가 있으면 디코딩하여 `{uuid}-avatar.png`로 저장
3. `card.front.avatarImage`를 `null`로 치환
4. JSON 메타데이터 파일 `{uuid}.json` 저장
5. 응답 반환

#### 5.2.2 GET /api/requests - 의뢰 목록 조회

**Response (200 OK):**
```json
{
  "requests": [
    {
      "id": "uuid-string",
      "displayName": "홍길동",
      "status": "submitted",
      "submittedAt": "2026-02-21T10:30:00.000Z",
      "hasIllustration": false
    }
  ],
  "total": 1
}
```

**서버 처리 로직:**
1. `data/requests/` 디렉토리의 모든 `.json` 파일 읽기
2. 각 파일에서 요약 정보 추출
3. `submittedAt` 기준 내림차순 정렬
4. 목록 반환

#### 5.2.3 GET /api/requests/[id] - 의뢰 상세 조회

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "card": { ... },
  "originalAvatarUrl": "/api/requests/uuid/avatar",
  "illustrationUrl": "/api/requests/uuid/illustration",
  "status": "submitted",
  "submittedAt": "...",
  "updatedAt": "...",
  "note": "...",
  "statusHistory": [...]
}
```

**Response (404 Not Found):**
```json
{
  "error": "Request not found"
}
```

#### 5.2.4 PATCH /api/requests/[id] - 의뢰 업데이트

**Request (상태 변경):**
```json
{
  "status": "processing" | "confirmed"
}
```

**Request (일러스트 업로드):**
```
PATCH /api/requests/[id]
Content-Type: application/json

{
  "illustrationImage": "base64-encoded-image-data",
  "status": "processing"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "status": "processing",
  "updatedAt": "2026-02-21T11:00:00.000Z"
}
```

**상태 전환 규칙:**
- `submitted` -> `processing`: 허용 (일러스트 등록 시)
- `processing` -> `confirmed`: 허용 (확정 시)
- 역방향 전환: 거부 (400 Bad Request)

#### 5.2.5 GET /api/requests/[id]/avatar - 원본 아바타 이미지

**Response**: 이미지 파일 (Content-Type: image/png)

#### 5.2.6 GET /api/requests/[id]/illustration - 일러스트 이미지

**Response**: 이미지 파일 (Content-Type: image/png) 또는 404

### 5.3 아키텍처 설계

#### 5.3.1 라우트 구조

```
src/app/
├── api/
│   └── requests/
│       ├── route.ts                    # POST (생성), GET (목록)
│       └── [id]/
│           ├── route.ts                # GET (상세), PATCH (업데이트)
│           ├── avatar/
│           │   └── route.ts            # GET (원본 이미지)
│           └── illustration/
│               └── route.ts            # GET (일러스트 이미지)
├── admin/
│   ├── page.tsx                        # 어드민 대시보드 (의뢰 목록)
│   └── [id]/
│       └── page.tsx                    # 어드민 상세 (의뢰 관리)
└── create/
    └── page.tsx                        # 기존 위저드 (Step 5 변경)
```

#### 5.3.2 컴포넌트 구조

```
src/components/
├── wizard/
│   ├── RequestSubmitStep.tsx           # (신규) 5단계 - 의뢰 제출
│   ├── CompleteStep.tsx                # (삭제 또는 대체)
│   └── ... (기존 1~4단계 변경 없음)
├── admin/
│   ├── RequestList.tsx                 # (신규) 의뢰 목록 테이블
│   ├── RequestDetail.tsx               # (신규) 의뢰 상세 정보
│   ├── IllustrationUploader.tsx        # (신규) 일러스트 업로드 영역
│   ├── StatusBadge.tsx                 # (신규) 상태 배지 컴포넌트
│   ├── CardCompare.tsx                 # (신규) 원본 vs 일러스트 비교
│   └── StatusHistory.tsx               # (신규) 상태 이력 표시
└── ...
```

#### 5.3.3 데이터 흐름

```
[사용자 플로우]
위저드 1~4단계 -> 5단계 (의뢰하기)
                    |
                    v
              POST /api/requests
                    |
                    v
         data/requests/{uuid}.json + {uuid}-avatar.png
                    |
                    v
              의뢰 확인 화면 (요청 ID 표시)

[어드민 플로우]
/admin (목록)
    |
    v
GET /api/requests -> 의뢰 목록 표시
    |
    v (클릭)
/admin/[id] (상세)
    |
    v
GET /api/requests/[id] -> 카드 데이터 + 이미지 표시
    |
    v (일러스트 업로드 + 등록)
PATCH /api/requests/[id] -> 상태: processing
    |
    v (확정)
PATCH /api/requests/[id] -> 상태: confirmed
```

### 5.4 UI 사양

#### 5.4.1 Step 5 - RequestSubmitStep

- 카드 앞면/뒷면 최종 미리보기 (기존 CompleteStep과 동일한 레이아웃)
- 선택적 메모 입력 필드 (textarea, 최대 500자)
- "의뢰하기" 메인 버튼 (빨간색 계열, 전체 너비)
- 로딩 상태: 버튼 비활성화 + 스피너
- 성공 시: 의뢰 확인 카드 (요청 ID, 제출 시간, 안내 메시지)
- 실패 시: 에러 메시지 + 재시도 버튼
- "새 명함 만들기" 버튼 유지 (의뢰 완료 후 표시)

#### 5.4.2 ProgressBar 변경

- 5단계 레이블: "완료" -> "의뢰"

#### 5.4.3 어드민 대시보드 (`/admin`)

- 페이지 제목: "명함 의뢰 관리"
- 의뢰 목록 테이블:
  - 열: 요청 ID (축약), 이름, 제출일, 상태 배지
  - 정렬: 최신순
  - 행 클릭 시 상세 페이지 이동
- 상태 배지 색상:
  - 의뢰됨(submitted): 파란색
  - 작업중(processing): 노란색/주황색
  - 확정(confirmed): 녹색
- 빈 상태: "아직 의뢰가 없습니다" 메시지

#### 5.4.4 어드민 상세 페이지 (`/admin/[id]`)

- 상단: 요청 ID, 상태 배지, 제출일/수정일
- 카드 데이터 섹션:
  - displayName, fullName, title, hashtags, socialLinks, 배경색
  - 읽기 전용 표시
- 이미지 비교 섹션:
  - 좌측: 원본 업로드 사진 (없을 경우 "업로드된 사진 없음" 표시)
  - 우측: 일러스트 (업로드 영역 또는 업로드된 일러스트)
- 사용자 메모 섹션 (있을 경우)
- 액션 버튼:
  - "등록" 버튼: 일러스트 저장 + 상태를 processing으로 변경
  - "확정" 버튼: 상태를 confirmed로 변경
- 상태 이력 타임라인 (선택)

---

## 6. 기술적 제약사항 (Technical Constraints)

### 6.1 프레임워크 제약

- **TC-001**: Next.js 16 App Router의 Route Handlers만 사용 (Pages Router API Routes 사용 금지)
- **TC-002**: 기존 위저드 1~4단계 컴포넌트는 변경하지 않음
- **TC-003**: 기존 localStorage 데이터와의 하위 호환성 유지

### 6.2 스토리지 제약

- **TC-004**: 외부 데이터베이스 사용 금지 (프로토타입 수준, JSON 파일 기반)
- **TC-005**: 이미지는 Base64가 아닌 실제 파일로 디스크에 저장
- **TC-006**: `data/requests/` 디렉토리를 스토리지 루트로 사용
- **TC-007**: `.gitignore`에 `data/requests/` 추가 (사용자 데이터 VCS 제외)

### 6.3 보안 제약

- **TC-008**: 어드민 인증 미구현 (프로토타입 단계, 누구나 `/admin` 접근 가능)
- **TC-009**: 업로드 이미지 크기 제한: 최대 10MB (Base64 인코딩 시 약 13MB)
- **TC-010**: 허용 이미지 형식: PNG, JPG, WebP

### 6.4 성능 제약

- **TC-011**: 의뢰 목록 조회 시 파일 시스템 전체 스캔 (인덱스 없음)
- **TC-012**: 동시 쓰기 충돌 미처리 (프로토타입 수준)

---

## 7. 추적성 (Traceability)

### 7.1 요구사항-컴포넌트 매핑

| 요구사항 | 구현 컴포넌트/파일 |
|---------|-----------------|
| REQ-E-001~004 | `RequestSubmitStep.tsx`, `POST /api/requests` |
| REQ-E-005~008 | `src/app/api/requests/` Route Handlers |
| REQ-E-009~010 | `src/app/admin/page.tsx`, `RequestList.tsx` |
| REQ-E-011~013 | `src/app/admin/[id]/page.tsx`, `RequestDetail.tsx`, `IllustrationUploader.tsx` |
| REQ-S-001~005 | `RequestDetail.tsx`, `RequestSubmitStep.tsx` |
| REQ-N-001~004 | API Route Handlers (유효성 검증) |
| REQ-U-001~005 | 전체 시스템 (기존 동작 보존, 데이터 무결성) |

### 7.2 관련 SPEC

| SPEC ID | 관계 | 설명 |
|---------|------|------|
| SPEC-FLOW-001 | 의존 | 위저드 플로우 기반 (5단계 변경) |
| SPEC-UI-001 | 의존 | 기존 UI 컴포넌트 재사용 (CardFront, CardBack) |
| SPEC-SHARE-001 | 관련 | 명함 공유 기능과의 향후 통합 가능성 |
| SPEC-TPL-001 | 관련 | 템플릿 기능과의 향후 통합 가능성 |
