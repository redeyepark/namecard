# SPEC-DEPLOY-001: 수락 기준

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Workers + Supabase Infrastructure Migration |
| 상태 | Completed |
| 관련 SPEC | SPEC-UI-001, SPEC-FLOW-001, SPEC-AUTH-001 |

---

## 테스트 시나리오

### TC-R1: Supabase 데이터베이스 스키마

#### TC-R1-1: card_requests 테이블 생성 확인

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

#### TC-R1-2: card_request_status_history 테이블 생성 확인

**Given** Supabase 프로젝트가 초기화되어 있고
**When** card_request_status_history 테이블을 조회하면
**Then** 다음 컬럼이 존재해야 한다:
- `id` (BIGSERIAL, PRIMARY KEY)
- `request_id` (UUID, FK -> card_requests, ON DELETE CASCADE)
- `status` (TEXT, NOT NULL, CHECK constraint)
- `timestamp` (TIMESTAMPTZ, NOT NULL, DEFAULT now())

#### TC-R1-3: 상태값 CHECK constraint 검증

**Given** card_requests 테이블이 존재하고
**When** status 필드에 `'invalid_status'`를 입력하면
**Then** CHECK constraint 위반 에러가 발생해야 한다

**Given** card_requests 테이블이 존재하고
**When** status 필드에 `'submitted'`, `'processing'`, `'confirmed'` 중 하나를 입력하면
**Then** 정상적으로 저장되어야 한다

#### TC-R1-4: 인덱스 존재 확인

**Given** 테이블이 생성되어 있고
**When** 인덱스 목록을 조회하면
**Then** 다음 인덱스가 존재해야 한다:
- `idx_card_requests_status` (card_requests.status)
- `idx_card_requests_submitted_at` (card_requests.submitted_at DESC)
- `idx_status_history_request_id` (card_request_status_history.request_id)

#### TC-R1-5: RLS 비활성화 확인

**Given** card_requests 테이블이 존재하고
**When** RLS 상태를 확인하면
**Then** RLS가 비활성화(disabled) 상태여야 한다

---

### TC-R2: Supabase Storage 구성

#### TC-R2-1: avatars 버킷 생성 확인

**Given** Supabase Storage가 설정되어 있고
**When** 버킷 목록을 조회하면
**Then** `avatars` 버킷이 존재하고 Public으로 설정되어 있어야 한다

#### TC-R2-2: illustrations 버킷 생성 확인

**Given** Supabase Storage가 설정되어 있고
**When** 버킷 목록을 조회하면
**Then** `illustrations` 버킷이 존재하고 Public으로 설정되어 있어야 한다

#### TC-R2-3: 아바타 이미지 업로드 및 공개 URL 접근

**Given** avatars 버킷이 존재하고
**When** `{request_id}/avatar.png` 경로에 PNG 파일을 업로드하면
**Then** 업로드가 성공하고
**And** 공개 URL `{SUPABASE_URL}/storage/v1/object/public/avatars/{request_id}/avatar.png`로 이미지에 접근할 수 있어야 한다

#### TC-R2-4: 일러스트레이션 이미지 업로드 및 공개 URL 접근

**Given** illustrations 버킷이 존재하고
**When** `{request_id}/illustration.png` 경로에 PNG 파일을 업로드하면
**Then** 업로드가 성공하고
**And** 공개 URL로 이미지에 접근할 수 있어야 한다

---

### TC-R3: 스토리지 레이어 마이그레이션

#### TC-R3-1: Supabase 클라이언트 초기화

**Given** NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 환경 변수에 설정되어 있고
**When** Supabase 클라이언트를 초기화하면
**Then** Supabase 클라이언트가 정상적으로 생성되어야 한다

#### TC-R3-2: insertCardRequest 함수

**Given** Supabase 연결이 설정되어 있고
**When** CardRequest 데이터로 `insertCardRequest`를 호출하면
**Then** card_requests 테이블에 레코드가 삽입되고
**And** card_request_status_history 테이블에 초기 상태 레코드가 삽입되고
**And** 삽입된 레코드의 id가 반환되어야 한다

#### TC-R3-3: getCardRequest 함수

**Given** card_requests 테이블에 레코드가 존재하고
**When** 해당 레코드의 id로 `getCardRequest`를 호출하면
**Then** CardRequest 타입에 맞는 데이터가 반환되어야 한다
**And** statusHistory 배열이 포함되어야 한다

**Given** 존재하지 않는 id로 호출하면
**Then** null이 반환되어야 한다

#### TC-R3-4: getAllCardRequests 함수

**Given** card_requests 테이블에 여러 레코드가 존재하고
**When** `getAllCardRequests`를 호출하면
**Then** submitted_at 기준 내림차순으로 정렬된 RequestSummary 배열이 반환되어야 한다

#### TC-R3-5: updateCardRequest 함수

**Given** card_requests 테이블에 레코드가 존재하고
**When** 상태 변경과 함께 `updateCardRequest`를 호출하면
**Then** card_requests 레코드가 업데이트되고
**And** updated_at이 현재 시간으로 갱신되고
**And** card_request_status_history에 새 상태 레코드가 삽입되어야 한다

#### TC-R3-6: uploadImage 함수

**Given** Supabase Storage가 설정되어 있고
**When** base64 인코딩된 이미지 데이터로 `uploadImage`를 호출하면
**Then** 해당 버킷에 PNG 파일이 업로드되고
**And** Storage 경로가 반환되어야 한다

#### TC-R3-7: 파일 시스템 의존성 제거 확인

**Given** 마이그레이션이 완료되었고
**When** 프로젝트 전체에서 `import.*from 'fs'` 또는 `require('fs')`를 검색하면
**Then** 데이터 저장 목적의 fs 사용이 존재하지 않아야 한다

#### TC-R3-8: camelCase/snake_case 매핑 정확성

**Given** TypeScript CardRequest 객체가 있고
**When** Supabase에 저장한 후 다시 조회하면
**Then** 원본 데이터와 동일한 값이 반환되어야 한다 (camelCase 필드명으로)

---

### TC-R4: Cloudflare Workers 배포

#### TC-R4-1: OpenNext 빌드 성공

**Given** @opennextjs/cloudflare가 설치되어 있고
**When** `npx opennextjs-cloudflare build`를 실행하면
**Then** 빌드가 에러 없이 완료되어야 한다
**And** Cloudflare Workers 호환 출력이 생성되어야 한다

#### TC-R4-2: wrangler.jsonc 유효성

**Given** wrangler.jsonc 파일이 존재하고
**When** Worker 설정을 확인하면
**Then** name이 "namecard"이어야 한다
**And** compatibility_date가 "2026-02-20"이어야 한다
**And** compatibility_flags에 "nodejs_compat"가 포함되어야 한다

#### TC-R4-3: Workers 런타임 호환성

**Given** Cloudflare Workers 환경에서 실행 중이고
**When** 모든 API 라우트를 호출하면
**Then** Node.js 전용 API 관련 런타임 에러가 발생하지 않아야 한다

#### TC-R4-4: 프로덕션 배포 확인

**Given** GitHub Actions 워크플로우가 실행되고
**When** 배포가 완료되면
**Then** https://namecard.redeyepark.workers.dev 에서 애플리케이션에 접근할 수 있어야 한다

#### TC-R4-5: GitHub Actions CI/CD 파이프라인

**Given** `.github/workflows/deploy.yml` 워크플로우가 존재하고
**When** master 브랜치에 push가 발생하면
**Then** 자동으로 빌드 및 배포가 수행되어야 한다
**And** 런타임 시크릿(ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY)이 설정되어야 한다

---

### TC-R5: 환경 변수

#### TC-R5-1: 빌드 타임 환경 변수 설정 확인

**Given** GitHub Actions 워크플로우가 실행되고
**When** 빌드 단계에서 환경 변수를 확인하면
**Then** 다음 변수가 GitHub Secrets에서 빌드 환경에 주입되어야 한다:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

#### TC-R5-2: 런타임 시크릿 설정 확인

**Given** Cloudflare Workers가 배포되어 있고
**When** 런타임 시크릿을 확인하면
**Then** 다음 시크릿이 wrangler secret put으로 설정되어 있어야 한다:
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAILS

#### TC-R5-3: CI/CD 전용 시크릿 설정 확인

**Given** GitHub Actions 워크플로우가 실행되고
**When** 배포 단계에서 인증 정보를 확인하면
**Then** 다음 시크릿이 GitHub Secrets에 설정되어 있어야 한다:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

#### TC-R5-4: Supabase 연결 테스트

**Given** NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있고
**When** Supabase 클라이언트를 통해 테이블을 조회하면
**Then** 정상적인 응답이 반환되어야 한다

---

### TC-R6: 파일 기반 스토리지 제거

#### TC-R6-1: storage.ts 파일 제거 확인

**Given** 마이그레이션이 완료되었고
**When** `src/lib/storage.ts` 파일의 존재 여부를 확인하면
**Then** 해당 파일이 존재하지 않아야 한다

#### TC-R6-2: 이미지 서빙 라우트 제거 확인

**Given** 마이그레이션이 완료되었고
**When** 다음 파일의 존재 여부를 확인하면
**Then** 해당 파일들이 존재하지 않아야 한다:
- `src/app/api/requests/[id]/avatar/route.ts`
- `src/app/api/requests/[id]/illustration/route.ts`

#### TC-R6-3: 빌드 무결성

**Given** 파일이 제거된 상태에서
**When** `npm run build`를 실행하면
**Then** 누락된 import나 참조로 인한 빌드 에러가 발생하지 않아야 한다

#### TC-R6-4: data 디렉토리 미사용 확인

**Given** 마이그레이션이 완료되었고
**When** 프로젝트 코드에서 `data/requests` 경로 참조를 검색하면
**Then** 해당 참조가 존재하지 않아야 한다

---

### TC-R7: 미들웨어 호환성

#### TC-R7-1: middleware.ts Edge Runtime 동작

**Given** Cloudflare Workers 환경에서 실행 중이고
**When** middleware.ts가 요청을 처리하면
**Then** Supabase 세션 갱신이 정상적으로 수행되어야 한다
**And** Edge Runtime 에러가 발생하지 않아야 한다

#### TC-R7-2: proxy.ts 미사용 확인

**Given** 프로젝트 소스를 확인하면
**Then** `src/proxy.ts` 파일이 존재하지 않아야 한다
**And** proxy.ts 관련 설정이 next.config.ts에 존재하지 않아야 한다

#### TC-R7-3: 보호 라우트 접근 제어

**Given** Supabase 세션이 없는 상태에서
**When** `/create` 페이지에 접근하면
**Then** `/login?callbackUrl=%2Fcreate`로 리다이렉트되어야 한다

**Given** 일반 사용자가 로그인한 상태에서
**When** `/admin` 페이지에 접근하면
**Then** `/`로 리다이렉트되어야 한다

---

### TC-R8: API 라우트 호환성

#### TC-R8-1: POST /api/requests - 명함 요청 생성

**Given** 인증된 사용자 세션이 존재하고
**When** 유효한 카드 데이터와 아바타 이미지로 POST /api/requests를 호출하면
**Then** 201 상태 코드와 `{ id, status: 'submitted', submittedAt }` 응답이 반환되어야 한다
**And** Supabase DB에 레코드가 저장되어야 한다
**And** Supabase Storage에 아바타 이미지가 업로드되어야 한다

**Given** 인증되지 않은 요청이
**When** POST /api/requests를 호출하면
**Then** 401 상태 코드가 반환되어야 한다

#### TC-R8-2: GET /api/requests - 전체 목록 조회

**Given** 관리자 세션이 존재하고
**When** GET /api/requests를 호출하면
**Then** 200 상태 코드와 `{ requests: [...], total: N }` 응답이 반환되어야 한다

**Given** 일반 사용자 세션이 존재하고
**When** GET /api/requests를 호출하면
**Then** 403 상태 코드가 반환되어야 한다

#### TC-R8-3: GET /api/requests/[id] - 상세 조회

**Given** 인증된 사용자 세션이 존재하고
**When** 유효한 id로 GET /api/requests/[id]를 호출하면
**Then** 200 상태 코드와 CardRequest 데이터가 반환되어야 한다
**And** `originalAvatarUrl`에 Supabase Storage 공개 URL이 포함되어야 한다
**And** `illustrationUrl`에 Supabase Storage 공개 URL이 포함되어야 한다 (일러스트레이션이 존재하는 경우)

**Given** 존재하지 않는 id로 호출하면
**Then** 404 상태 코드가 반환되어야 한다

#### TC-R8-4: PATCH /api/requests/[id] - 상태 변경

**Given** 관리자 세션이 존재하고
**When** 유효한 상태 전환으로 PATCH /api/requests/[id]를 호출하면
**Then** 200 상태 코드와 `{ id, status, updatedAt }` 응답이 반환되어야 한다
**And** card_request_status_history에 새 레코드가 추가되어야 한다

**Given** 관리자 세션이 존재하고
**When** 유효하지 않은 상태 전환으로 PATCH를 호출하면
**Then** 400 상태 코드와 에러 메시지가 반환되어야 한다

#### TC-R8-5: PATCH /api/requests/[id] - 일러스트레이션 업로드

**Given** 관리자 세션이 존재하고
**When** illustrationImage를 포함하여 PATCH /api/requests/[id]를 호출하면
**Then** Supabase Storage에 일러스트레이션 이미지가 업로드되고
**And** card_requests 레코드의 illustration_path가 업데이트되어야 한다

---

## 통합 테스트 시나리오

### E2E-1: 전체 명함 요청 플로우

**Given** 프로덕션 환경(https://namecard.redeyepark.workers.dev)에 배포되어 있고
**When** 다음 전체 플로우를 실행하면:
1. 이메일/비밀번호 또는 Google OAuth로 로그인
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

### E2E-3: CI/CD 자동 배포 검증

**Given** GitHub Actions 워크플로우가 설정되어 있고
**When** master 브랜치에 코드를 push하면
**Then** 자동으로 빌드 및 배포가 수행되어야 한다
**And** https://namecard.redeyepark.workers.dev 에서 변경 사항이 반영되어야 한다

---

## Quality Gate (품질 게이트)

### 기능 완성도

- [x] Supabase 스키마가 spec.md의 R1에 정의된 대로 생성됨
- [x] Supabase Storage 버킷(avatars, illustrations)이 Public으로 생성됨
- [x] `src/lib/storage.ts`가 Supabase 기반 모듈로 완전히 대체됨
- [x] 이미지 서빙 API 라우트가 제거됨 (Storage 공개 URL로 대체)
- [x] 모든 API 라우트가 Supabase 쿼리를 사용하도록 수정됨
- [x] Node.js `fs` 모듈 의존성이 완전히 제거됨
- [x] @opennextjs/cloudflare 어댑터로 빌드가 성공함
- [x] Cloudflare Workers에 성공적으로 배포됨
- [x] Supabase Auth 인증 플로우가 프로덕션에서 정상 동작함 (이메일/비밀번호 + Google OAuth)
- [x] middleware.ts를 통한 세션 갱신 및 라우트 보호가 Edge Runtime에서 동작함
- [x] 전체 E2E 플로우 (요청 제출 -> 관리자 처리 -> 완료)가 동작함
- [x] 이미지가 Supabase Storage 공개 URL로 접근 가능함

### 인프라 체크리스트

- [x] wrangler.jsonc 설정이 올바르게 구성됨 (name, compatibility_date, compatibility_flags)
- [x] GitHub Actions 워크플로우가 master push 시 자동 실행됨
- [x] 빌드 타임 환경 변수가 GitHub Secrets에서 주입됨 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [x] 런타임 시크릿이 wrangler secret put으로 설정됨 (SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS)
- [x] CI/CD 인증 시크릿이 GitHub Secrets에 설정됨 (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [x] next.config.ts에 images.unoptimized = true가 설정됨
- [x] next.config.ts에 initOpenNextCloudflareForDev()가 호출됨
- [x] `.gitignore`에 `.wrangler/`, `.open-next/` 추가됨

### 보안 체크리스트

- [x] SUPABASE_SERVICE_ROLE_KEY가 Cloudflare Workers 런타임 시크릿으로만 설정됨
- [x] ADMIN_EMAILS가 Cloudflare Workers 런타임 시크릿으로 설정됨
- [x] NEXT_PUBLIC_ 접두사가 있는 변수만 빌드 타임에 클라이언트에 노출됨
- [x] `.env.local`, `.dev.vars`가 `.gitignore`에 포함됨
- [x] 인증되지 않은 API 요청에 대해 401 반환 (requireAuth)
- [x] 권한 부족 API 요청에 대해 403 반환 (requireAdmin)

### 코드 품질

- [x] TypeScript 타입 에러 없음
- [x] Next.js 빌드 성공
- [x] Cloudflare Workers 런타임 호환 (Edge Runtime)
- [x] proxy.ts 미사용 (middleware.ts 사용)

---

## 검증 도구

| 검증 항목 | 도구 | 방법 |
|----------|------|------|
| DB 스키마 | Supabase Dashboard SQL Editor | 테이블/컬럼/인덱스 조회 |
| Storage 버킷 | Supabase Dashboard Storage | 버킷 목록 및 설정 확인 |
| API 라우트 | curl / 브라우저 | HTTP 요청 및 응답 검증 |
| 빌드 성공 | GitHub Actions | 워크플로우 로그 확인 |
| 배포 성공 | 브라우저 | https://namecard.redeyepark.workers.dev 접근 확인 |
| 인증 플로우 | 브라우저 수동 테스트 | Supabase Auth 로그인/로그아웃 검증 |
| 이미지 접근 | 브라우저 | Supabase Storage URL 직접 접근 |
| CI/CD 동작 | GitHub Actions Dashboard | 워크플로우 실행 이력 확인 |
| 런타임 시크릿 | Cloudflare Dashboard | Workers 시크릿 바인딩 확인 |

---

## Definition of Done

1. [x] 모든 테스트 시나리오 (TC-R1 ~ TC-R8, E2E-1 ~ E2E-3)가 검증됨
2. [x] 모든 Quality Gate 체크리스트 항목이 통과함
3. [x] OpenNext 빌드 성공 (GitHub Actions)
4. [x] Cloudflare Workers 배포 성공 (https://namecard.redeyepark.workers.dev)
5. [x] GitHub Actions CI/CD 파이프라인 정상 동작
6. [x] 환경 변수 및 시크릿 올바르게 구성됨 (빌드 타임 / 런타임 / CI/CD 분리)
7. [x] 파일 시스템 기반 스토리지 완전 제거됨
8. [x] Supabase Auth 인증 플로우 프로덕션 정상 동작
9. [x] 기존 기능에 대한 회귀 테스트 통과
