# SPEC-DEPLOY-001: 수락 기준

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Pages + Supabase 인프라 마이그레이션 수락 기준 |
| 관련 문서 | spec.md, plan.md |

---

## TC-R1: Supabase 데이터베이스 스키마

### TC-R1-1: card_requests 테이블 생성 확인

**Given** Supabase 프로젝트가 초기화되어 있고
**When** card_requests 테이블을 조회하면
**Then** 다음 컬럼이 존재해야 한다:
- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `card_front` (JSONB, NOT NULL)
- `card_back` (JSONB, NOT NULL)
- `original_avatar_path` (TEXT, NULLABLE)
- `illustration_path` (TEXT, NULLABLE)
- `status` (TEXT, NOT NULL, CHECK constraint)
- `submitted_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT now())
- `note` (TEXT, NULLABLE)
- `created_by` (TEXT, NULLABLE)

### TC-R1-2: card_request_status_history 테이블 생성 확인

**Given** Supabase 프로젝트가 초기화되어 있고
**When** card_request_status_history 테이블을 조회하면
**Then** 다음 컬럼이 존재해야 한다:
- `id` (BIGSERIAL, PRIMARY KEY)
- `request_id` (UUID, FK -> card_requests, ON DELETE CASCADE)
- `status` (TEXT, NOT NULL, CHECK constraint)
- `timestamp` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

### TC-R1-3: 상태값 CHECK constraint 검증

**Given** card_requests 테이블이 존재하고
**When** status 필드에 `'invalid_status'`를 입력하면
**Then** CHECK constraint 위반 에러가 발생해야 한다

**Given** card_requests 테이블이 존재하고
**When** status 필드에 `'submitted'`, `'processing'`, `'confirmed'` 중 하나를 입력하면
**Then** 정상적으로 저장되어야 한다

### TC-R1-4: 인덱스 존재 확인

**Given** 테이블이 생성되어 있고
**When** 인덱스 목록을 조회하면
**Then** 다음 인덱스가 존재해야 한다:
- `idx_card_requests_status` (card_requests.status)
- `idx_card_requests_submitted_at` (card_requests.submitted_at DESC)
- `idx_status_history_request_id` (card_request_status_history.request_id)

### TC-R1-5: RLS 비활성화 확인

**Given** card_requests 테이블이 존재하고
**When** RLS 상태를 확인하면
**Then** RLS가 비활성화(disabled) 상태여야 한다

---

## TC-R2: Supabase Storage 구성

### TC-R2-1: avatars 버킷 생성 확인

**Given** Supabase Storage가 설정되어 있고
**When** avatars 버킷 목록을 조회하면
**Then** `avatars` 버킷이 존재하고 Public으로 설정되어 있어야 한다

### TC-R2-2: illustrations 버킷 생성 확인

**Given** Supabase Storage가 설정되어 있고
**When** illustrations 버킷 목록을 조회하면
**Then** `illustrations` 버킷이 존재하고 Public으로 설정되어 있어야 한다

### TC-R2-3: 아바타 이미지 업로드 및 공개 URL 접근

**Given** avatars 버킷이 존재하고
**When** `{request_id}/avatar.png` 경로에 PNG 파일을 업로드하면
**Then** 업로드가 성공하고
**And** 공개 URL `{SUPABASE_URL}/storage/v1/object/public/avatars/{request_id}/avatar.png`로 이미지에 접근할 수 있어야 한다

### TC-R2-4: 일러스트레이션 이미지 업로드 및 공개 URL 접근

**Given** illustrations 버킷이 존재하고
**When** `{request_id}/illustration.png` 경로에 PNG 파일을 업로드하면
**Then** 업로드가 성공하고
**And** 공개 URL로 이미지에 접근할 수 있어야 한다

### TC-R2-5: 10MB 초과 이미지 업로드 거부

**Given** Storage 버킷이 존재하고
**When** 10MB를 초과하는 이미지를 업로드하면
**Then** 에러 응답이 반환되어야 한다

---

## TC-R3: 스토리지 레이어 마이그레이션

### TC-R3-1: Supabase 클라이언트 초기화

**Given** NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 환경 변수에 설정되어 있고
**When** `src/lib/supabase.ts`에서 클라이언트를 초기화하면
**Then** Supabase 클라이언트가 정상적으로 생성되어야 한다

**Given** 환경 변수가 누락되어 있고
**When** 클라이언트를 초기화하면
**Then** 명확한 에러 메시지가 출력되어야 한다

### TC-R3-2: insertCardRequest 함수

**Given** Supabase 연결이 설정되어 있고
**When** CardRequest 데이터로 `insertCardRequest`를 호출하면
**Then** card_requests 테이블에 레코드가 삽입되고
**And** card_request_status_history 테이블에 초기 상태 레코드가 삽입되고
**And** 삽입된 레코드의 id가 반환되어야 한다

### TC-R3-3: getCardRequest 함수

**Given** card_requests 테이블에 레코드가 존재하고
**When** 해당 레코드의 id로 `getCardRequest`를 호출하면
**Then** CardRequest 타입에 맞는 데이터가 반환되어야 한다
**And** statusHistory 배열이 포함되어야 한다

**Given** 존재하지 않는 id로 호출하면
**Then** null이 반환되어야 한다

### TC-R3-4: getAllCardRequests 함수

**Given** card_requests 테이블에 여러 레코드가 존재하고
**When** `getAllCardRequests`를 호출하면
**Then** submitted_at 기준 내림차순으로 정렬된 RequestSummary 배열이 반환되어야 한다

### TC-R3-5: updateCardRequest 함수

**Given** card_requests 테이블에 레코드가 존재하고
**When** 상태 변경과 함께 `updateCardRequest`를 호출하면
**Then** card_requests 레코드가 업데이트되고
**And** updated_at이 현재 시간으로 갱신되고
**And** card_request_status_history에 새 상태 레코드가 삽입되어야 한다

### TC-R3-6: uploadImage 함수

**Given** Supabase Storage가 설정되어 있고
**When** base64 인코딩된 이미지 데이터로 `uploadImage`를 호출하면
**Then** 해당 버킷에 PNG 파일이 업로드되고
**And** Storage 경로가 반환되어야 한다

### TC-R3-7: 파일 시스템 의존성 제거 확인

**Given** 마이그레이션이 완료되었고
**When** 프로젝트 전체에서 `import.*from 'fs'` 또는 `require('fs')`를 검색하면
**Then** 데이터 저장 목적의 fs 사용이 존재하지 않아야 한다

### TC-R3-8: camelCase/snake_case 매핑 정확성

**Given** TypeScript CardRequest 객체가 있고
**When** Supabase에 저장한 후 다시 조회하면
**Then** 원본 데이터와 동일한 값이 반환되어야 한다 (camelCase 필드명으로)

---

## TC-R4: Cloudflare Pages 배포

### TC-R4-1: OpenNext 빌드 성공

**Given** @opennextjs/cloudflare가 설치되어 있고
**When** `npm run build`를 실행하면
**Then** 빌드가 에러 없이 완료되어야 한다
**And** Cloudflare Pages 호환 출력이 생성되어야 한다

### TC-R4-2: wrangler.toml 유효성

**Given** wrangler.toml 파일이 존재하고
**When** `wrangler pages dev`를 실행하면
**Then** 로컬 개발 서버가 정상적으로 시작되어야 한다

### TC-R4-3: Workers 런타임 호환성

**Given** Cloudflare Pages 환경에서 실행 중이고
**When** 모든 API 라우트를 호출하면
**Then** Node.js 전용 API 관련 런타임 에러가 발생하지 않아야 한다

### TC-R4-4: Cloudflare Pages 배포 성공

**Given** 빌드가 성공하고
**When** `npm run deploy`를 실행하면
**Then** Cloudflare Pages에 배포가 완료되고
**And** 배포 URL이 반환되어야 한다

---

## TC-R5: 환경 변수

### TC-R5-1: 필수 환경 변수 설정 확인

**Given** Cloudflare Pages 프로젝트가 배포되어 있고
**When** 환경 변수 목록을 확인하면
**Then** 다음 변수가 모두 설정되어 있어야 한다:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- AUTH_SECRET
- AUTH_GOOGLE_ID
- AUTH_GOOGLE_SECRET
- AUTH_GITHUB_ID
- AUTH_GITHUB_SECRET
- ADMIN_EMAILS
- AUTH_TRUST_HOST

### TC-R5-2: Supabase 연결 테스트

**Given** NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있고
**When** Supabase 클라이언트를 통해 테이블을 조회하면
**Then** 정상적인 응답이 반환되어야 한다

### TC-R5-3: OAuth 콜백 URL 검증

**Given** 프로덕션 도메인에 배포되어 있고
**When** Google 로그인을 시도하면
**Then** Google OAuth 콜백이 프로덕션 도메인으로 올바르게 리다이렉트되어야 한다

**Given** 프로덕션 도메인에 배포되어 있고
**When** GitHub 로그인을 시도하면
**Then** GitHub OAuth 콜백이 프로덕션 도메인으로 올바르게 리다이렉트되어야 한다

---

## TC-R6: 파일 기반 스토리지 제거

### TC-R6-1: storage.ts 파일 제거 확인

**Given** 마이그레이션이 완료되었고
**When** `src/lib/storage.ts` 파일의 존재 여부를 확인하면
**Then** 해당 파일이 존재하지 않아야 한다

### TC-R6-2: 이미지 서빙 라우트 제거 확인

**Given** 마이그레이션이 완료되었고
**When** 다음 파일의 존재 여부를 확인하면
**Then** 해당 파일들이 존재하지 않아야 한다:
- `src/app/api/requests/[id]/avatar/route.ts`
- `src/app/api/requests/[id]/illustration/route.ts`

### TC-R6-3: 빌드 무결성

**Given** 파일이 제거된 상태에서
**When** `npm run build`를 실행하면
**Then** 누락된 import나 참조로 인한 빌드 에러가 발생하지 않아야 한다

### TC-R6-4: data 디렉토리 미사용 확인

**Given** 마이그레이션이 완료되었고
**When** 프로젝트 코드에서 `data/requests` 경로 참조를 검색하면
**Then** 해당 참조가 존재하지 않아야 한다

---

## TC-R7: API 라우트 호환성

### TC-R7-1: POST /api/requests - 명함 요청 생성

**Given** 인증된 사용자 세션이 존재하고
**When** 유효한 카드 데이터와 아바타 이미지로 POST /api/requests를 호출하면
**Then** 201 상태 코드와 `{ id, status: 'submitted', submittedAt }` 응답이 반환되어야 한다
**And** Supabase DB에 레코드가 저장되어야 한다
**And** Supabase Storage에 아바타 이미지가 업로드되어야 한다

**Given** 인증되지 않은 요청이
**When** POST /api/requests를 호출하면
**Then** 401 상태 코드가 반환되어야 한다

### TC-R7-2: GET /api/requests - 전체 목록 조회

**Given** 관리자 세션이 존재하고
**When** GET /api/requests를 호출하면
**Then** 200 상태 코드와 `{ requests: [...], total: N }` 응답이 반환되어야 한다

**Given** 일반 사용자 세션이 존재하고
**When** GET /api/requests를 호출하면
**Then** 403 상태 코드가 반환되어야 한다

### TC-R7-3: GET /api/requests/[id] - 상세 조회

**Given** 인증된 사용자 세션이 존재하고
**When** 유효한 id로 GET /api/requests/[id]를 호출하면
**Then** 200 상태 코드와 CardRequest 데이터가 반환되어야 한다
**And** `originalAvatarUrl`에 Supabase Storage 공개 URL이 포함되어야 한다
**And** `illustrationUrl`에 Supabase Storage 공개 URL이 포함되어야 한다 (일러스트레이션이 존재하는 경우)

**Given** 존재하지 않는 id로 호출하면
**Then** 404 상태 코드가 반환되어야 한다

### TC-R7-4: PATCH /api/requests/[id] - 상태 변경

**Given** 관리자 세션이 존재하고
**When** 유효한 상태 전환으로 PATCH /api/requests/[id]를 호출하면
**Then** 200 상태 코드와 `{ id, status, updatedAt }` 응답이 반환되어야 한다
**And** card_request_status_history에 새 레코드가 추가되어야 한다

**Given** 관리자 세션이 존재하고
**When** 유효하지 않은 상태 전환으로 PATCH를 호출하면
**Then** 400 상태 코드와 에러 메시지가 반환되어야 한다

### TC-R7-5: PATCH /api/requests/[id] - 일러스트레이션 업로드

**Given** 관리자 세션이 존재하고
**When** illustrationImage를 포함하여 PATCH /api/requests/[id]를 호출하면
**Then** Supabase Storage에 일러스트레이션 이미지가 업로드되고
**And** card_requests 레코드의 illustration_path가 업데이트되어야 한다

---

## 통합 테스트 시나리오

### E2E-1: 전체 명함 요청 플로우

**Given** 프로덕션 환경에 배포되어 있고
**When** 다음 전체 플로우를 실행하면:
1. Google OAuth로 로그인
2. 명함 데이터 입력 + 아바타 이미지 업로드
3. 명함 요청 제출 (POST /api/requests)
4. 관리자 계정으로 로그인
5. 요청 목록 확인 (GET /api/requests)
6. 요청 상세 확인 (GET /api/requests/[id])
7. 상태 변경: submitted -> processing (PATCH)
8. 일러스트레이션 업로드 (PATCH)
9. 상태 변경: processing -> confirmed (PATCH)
**Then** 모든 단계가 에러 없이 완료되어야 한다
**And** Supabase DB에 올바른 데이터가 저장되어 있어야 한다
**And** Supabase Storage에 이미지 파일이 존재해야 한다

### E2E-2: 이미지 공개 URL 접근 검증

**Given** 명함 요청이 아바타 이미지와 함께 제출되었고
**When** GET /api/requests/[id] 응답의 `originalAvatarUrl`에 접근하면
**Then** 이미지가 정상적으로 표시되어야 한다
**And** 별도의 인증 없이 접근할 수 있어야 한다 (공개 URL)

---

## Quality Gate (품질 게이트)

### Definition of Done

- [ ] Supabase 스키마가 spec.md의 R1에 정의된 대로 생성됨
- [ ] Supabase Storage 버킷(avatars, illustrations)이 Public으로 생성됨
- [ ] `src/lib/storage.ts`가 Supabase 기반 모듈로 완전히 대체됨
- [ ] 이미지 서빙 API 라우트(`avatar/route.ts`, `illustration/route.ts`)가 제거됨
- [ ] 모든 API 라우트가 Supabase 쿼리를 사용하도록 수정됨
- [ ] Node.js `fs` 모듈 의존성이 완전히 제거됨
- [ ] @opennextjs/cloudflare 어댑터로 빌드가 성공함
- [ ] Cloudflare Pages에 성공적으로 배포됨
- [ ] NextAuth.js 인증 플로우가 프로덕션에서 정상 동작함
- [ ] OAuth 콜백 URL이 프로덕션 도메인으로 설정됨
- [ ] 전체 E2E 플로우 (요청 제출 -> 관리자 처리 -> 완료)가 동작함
- [ ] 이미지가 Supabase Storage 공개 URL로 접근 가능함
- [ ] 환경 변수가 Cloudflare Dashboard에 올바르게 설정됨
- [ ] `.gitignore`에 `.wrangler/`, `.open-next/` 추가됨
- [ ] 프로젝트 문서(tech.md, structure.md) 업데이트됨

### 검증 도구

| 검증 항목 | 도구 | 방법 |
|----------|------|------|
| DB 스키마 | Supabase Dashboard SQL Editor | 테이블/컬럼/인덱스 조회 |
| Storage 버킷 | Supabase Dashboard Storage | 버킷 목록 및 설정 확인 |
| API 라우트 | curl / Postman / 브라우저 | HTTP 요청 및 응답 검증 |
| 빌드 성공 | npm run build | 빌드 로그 확인 |
| 배포 성공 | npm run deploy | 배포 URL 접근 확인 |
| 인증 플로우 | 브라우저 수동 테스트 | OAuth 로그인/콜백 검증 |
| 이미지 접근 | 브라우저 | Supabase Storage URL 직접 접근 |
| Workers 호환성 | wrangler pages dev | 로컬 Workers 환경 테스트 |
