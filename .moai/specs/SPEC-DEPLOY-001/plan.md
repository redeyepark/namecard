# SPEC-DEPLOY-001: 구현 계획

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Workers + Supabase Infrastructure Migration |
| 상태 | Completed |
| 관련 SPEC | SPEC-UI-001, SPEC-FLOW-001, SPEC-AUTH-001 |

---

## 마일스톤 개요

| 마일스톤 | 목표 | 상태 |
|---------|------|------|
| M1 | Supabase 프로젝트 설정 및 스키마 | Completed |
| M2 | 스토리지 레이어 리팩토링 | Completed |
| M3 | API 라우트 업데이트 | Completed |
| M4 | Cloudflare Workers 배포 설정 | Completed |
| M5 | GitHub Actions CI/CD 구축 | Completed |
| M6 | 통합 테스트 및 프로덕션 배포 | Completed |

---

## M1: Supabase 프로젝트 설정 및 스키마 (Completed)

### 목표

Supabase 프로젝트를 생성하고 card_requests 데이터 모델에 맞는 PostgreSQL 스키마를 정의한다.

### 작업 목록

#### M1-1: Supabase 프로젝트 초기화

- Supabase Dashboard에서 새 프로젝트 생성
- 프로젝트 URL과 키 확보 (URL, anon key, service_role key)
- `.env.local`에 환경 변수 추가

#### M1-2: 데이터베이스 스키마 생성

- `card_requests` 테이블 생성 (spec.md R1 참조)
  - id: UUID PK
  - card_front: JSONB (CardFrontData)
  - card_back: JSONB (CardBackData)
  - original_avatar_path: TEXT (Storage 경로)
  - illustration_path: TEXT (Storage 경로)
  - status: TEXT + CHECK constraint ('submitted', 'processing', 'confirmed')
  - submitted_at, updated_at: TIMESTAMPTZ
  - note: TEXT (nullable)
  - created_by: TEXT (nullable)
- `card_request_status_history` 테이블 생성
  - id: BIGSERIAL PK
  - request_id: UUID FK -> card_requests(id) ON DELETE CASCADE
  - status: TEXT + CHECK constraint
  - timestamp: TIMESTAMPTZ
- 인덱스 생성 (status, submitted_at DESC, request_id)

#### M1-3: Storage 버킷 생성

- `avatars` 버킷 생성 (Public)
- `illustrations` 버킷 생성 (Public)
- 파일 경로 규칙: `{request_id}/avatar.png`, `{request_id}/illustration.png`

#### M1-4: RLS 비활성화 확인

- card_requests 테이블의 RLS 비활성화 확인
- card_request_status_history 테이블의 RLS 비활성화 확인
- Storage 버킷의 공개 읽기 정책 설정

### 산출물

- Supabase PostgreSQL 스키마 (card_requests, card_request_status_history)
- Supabase Storage 버킷 (avatars, illustrations)

---

## M2: 스토리지 레이어 리팩토링 (Completed)

### 목표

파일 시스템 기반 `storage.ts`를 Supabase 클라이언트 기반으로 완전히 교체한다.

### 작업 목록

#### M2-1: Supabase 클라이언트 모듈 생성

- `src/lib/supabase.ts` 생성 (서버 사이드 service_role 클라이언트)
- `src/lib/supabase-auth.ts` 생성 (브라우저 anon key 클라이언트)
- `src/lib/auth-utils.ts` 생성 (서버 인증 유틸리티)

#### M2-2: 데이터베이스 CRUD 함수 구현

- `src/lib/supabase-storage.ts` 생성
  - `insertCardRequest(request)`: INSERT + status_history INSERT
  - `getCardRequest(id)`: SELECT by UUID + JOIN status_history
  - `getAllCardRequests()`: SELECT ALL + ORDER BY submitted_at DESC
  - `updateCardRequest(id, updates)`: UPDATE + status_history INSERT

#### M2-3: 이미지 업로드/URL 함수 구현

- `uploadImage(requestId, type, base64Data)`: base64 -> Uint8Array -> Supabase Storage upload
- `getImagePublicUrl(requestId, type)`: Supabase Storage 공개 URL 생성
- Workers 호환을 위한 Uint8Array 기반 구현

#### M2-4: 기존 storage.ts 제거

- `src/lib/storage.ts` 삭제
- 모든 import 경로 업데이트

### 산출물

- `src/lib/supabase.ts`
- `src/lib/supabase-auth.ts`
- `src/lib/auth-utils.ts`
- `src/lib/supabase-storage.ts`

---

## M3: API 라우트 업데이트 (Completed)

### 목표

모든 API 라우트를 Supabase 기반 함수로 전환하고, 이미지 서빙 라우트를 제거한다.

### 작업 목록

#### M3-1: POST /api/requests 수정

- `saveRequest` -> `insertCardRequest`
- `saveImageFile` -> `uploadImage`
- Supabase Auth 세션 체크 (requireAuth)
- 응답 형식 유지

#### M3-2: GET /api/requests 수정

- `getAllRequests` -> `getAllCardRequests`
- 관리자 권한 체크 (requireAdmin)
- 응답 형식 유지

#### M3-3: GET /api/requests/[id] 수정

- `getRequest` -> `getCardRequest`
- `originalAvatarUrl`: Supabase Storage 공개 URL로 변경
- `illustrationUrl`: Supabase Storage 공개 URL로 변경
- 세션 체크 (requireAuth)

#### M3-4: PATCH /api/requests/[id] 수정

- `getRequest` -> `getCardRequest`
- `updateRequest` -> `updateCardRequest`
- `saveImageFile` -> `uploadImage`
- 관리자 권한 체크 (requireAdmin)

#### M3-5: 이미지 서빙 라우트 제거

- `src/app/api/requests/[id]/avatar/route.ts` 삭제
- `src/app/api/requests/[id]/illustration/route.ts` 삭제
- Supabase Storage 공개 URL로 직접 접근

### 산출물

- 수정된 API 라우트 (requests/route.ts, requests/[id]/route.ts)
- 삭제된 이미지 서빙 라우트

---

## M4: Cloudflare Workers 배포 설정 (Completed)

### 목표

@opennextjs/cloudflare 어댑터를 설치하고 Cloudflare Workers 배포를 구성한다.

### 작업 목록

#### M4-1: 의존성 설치

- `@opennextjs/cloudflare@^1.16.5` 설치
- `wrangler@^4.67.0` (devDependency) 설치

#### M4-2: 빌드 설정 파일 생성

- `wrangler.jsonc` 생성 (JSONC 형식 사용, wrangler.toml 아님)
  - Worker name: "namecard"
  - compatibility_date: "2026-02-20"
  - compatibility_flags: ["nodejs_compat"]
  - assets 바인딩 설정
  - WORKER_SELF_REFERENCE 서비스 바인딩

#### M4-3: package.json 빌드 스크립트 수정

- `cf:build`: `opennextjs-cloudflare build`
- `preview`: `opennextjs-cloudflare build && opennextjs-cloudflare preview`
- `deploy`: `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
- `cf:typegen`: `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`

#### M4-4: next.config.ts 수정

- `images.unoptimized: true` 설정 (Cloudflare Workers 호환)
- `initOpenNextCloudflareForDev()` 호출 (로컬 개발 서버 통합)

#### M4-5: .gitignore 업데이트

- `.wrangler/` 추가
- `.open-next/` 추가

### 산출물

- `wrangler.jsonc`
- 수정된 `next.config.ts`
- 수정된 `package.json`
- 수정된 `.gitignore`

---

## M5: GitHub Actions CI/CD 구축 (Completed)

### 목표

GitHub Actions를 사용하여 master 브랜치 push 시 자동 빌드 및 배포 파이프라인을 구성한다.

### 작업 목록

#### M5-1: GitHub Actions 워크플로우 생성

- `.github/workflows/deploy.yml` 생성
- 트리거: master 브랜치 push
- ubuntu-latest 러너 사용

#### M5-2: 빌드 단계 구성

- actions/checkout@v4: 리포지토리 체크아웃
- actions/setup-node@v4: Node.js 22 설정 + npm 캐시
- npm ci: 의존성 설치
- npx opennextjs-cloudflare build: OpenNext 빌드
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 빌드 환경 변수로 주입

#### M5-3: 배포 단계 구성

- npx opennextjs-cloudflare deploy: Cloudflare Workers 배포
  - CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID 사용

#### M5-4: 런타임 시크릿 설정 단계 구성

- wrangler secret put ADMIN_EMAILS
- wrangler secret put SUPABASE_SERVICE_ROLE_KEY

#### M5-5: GitHub Secrets 설정

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAILS
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

### 산출물

- `.github/workflows/deploy.yml`
- GitHub Secrets 설정 완료

### 기술적 의사결정: GitHub Actions vs 로컬 배포

- **선택**: GitHub Actions CI/CD
- **이유**: Windows 환경에서 Wrangler의 WASM 파일(resvg.wasm?module)을 처리할 수 없음. Windows 파일 시스템에서 `?` 문자가 파일명에 허용되지 않아 로컬 빌드/배포가 불가능함
- **결과**: ubuntu-latest 환경에서 안정적으로 빌드 및 배포 수행

---

## M6: 통합 테스트 및 프로덕션 배포 (Completed)

### 목표

전체 시스템을 E2E로 검증하고 프로덕션 환경에 배포한다.

### 작업 목록

#### M6-1: 프로덕션 배포

- GitHub Actions를 통한 자동 배포 실행
- 배포 URL 확인: https://namecard.redeyepark.workers.dev

#### M6-2: 통합 테스트

- 명함 요청 제출 플로우 검증
- Supabase Auth 로그인 플로우 검증 (이메일/비밀번호, Google OAuth)
- 이미지 업로드/조회 검증
- 관리자 대시보드 기능 검증

#### M6-3: 정리 작업

- 파일 시스템 기반 코드 완전 제거 확인
- 프로젝트 문서 업데이트

### 산출물

- 프로덕션 배포 완료: https://namecard.redeyepark.workers.dev

---

## 아키텍처 설계 방향

### 배포 아키텍처

```
[사용자 브라우저]
      |
      v
[Cloudflare Workers]     <-- Next.js 전체 (SSR + 정적 자산)
      |                       - middleware.ts (Edge Runtime)
      |                       - Supabase Auth 쿠키 세션 관리
      |                       - API 라우트 (Supabase service_role)
      v
[Supabase]
  |-- PostgreSQL           <-- card_requests, status_history
  |-- Storage              <-- avatars/, illustrations/ 버킷
  +-- Auth                 <-- 이메일/비밀번호 + Google OAuth
```

### 데이터 흐름

```
명함 요청 제출:
  브라우저 -> POST /api/requests -> requireAuth() Supabase 세션 확인
    -> Supabase DB: INSERT card_requests
    -> Supabase Storage: PUT avatars/{id}/avatar.png
    -> 응답: { id, status, submittedAt }

관리자 상태 변경:
  브라우저 -> PATCH /api/requests/[id] -> requireAdmin() 관리자 확인
    -> Supabase DB: UPDATE card_requests + INSERT status_history
    -> Supabase Storage: PUT illustrations/{id}/illustration.png (선택)
    -> 응답: { id, status, updatedAt }

이미지 접근:
  브라우저 -> Supabase Storage 공개 URL -> 이미지 직접 응답
  (API 라우트 프록시 불필요)
```

### 인증 아키텍처

```
Supabase Auth (@supabase/ssr)
  |-- 이메일/비밀번호 인증
  |-- Google OAuth Provider
  +-- 쿠키 기반 세션 관리

middleware.ts (Edge Runtime):
  |-- Supabase 세션 갱신 (supabase.auth.getUser())
  |-- 보호 라우트 접근 제어
  +-- 관리자 라우트 접근 제어 (ADMIN_EMAILS)

API 라우트 인증:
  |-- requireAuth(): Supabase 세션 검증 (미인증 시 401)
  +-- requireAdmin(): ADMIN_EMAILS 기반 관리자 검증 (비관리자 시 403)
```

### CI/CD 아키텍처

```
[개발자 - master push]
      |
      v
[GitHub Actions]
  1. checkout + setup node 22
  2. npm ci (의존성 설치)
  3. opennextjs-cloudflare build
     (빌드 타임 환경 변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  4. opennextjs-cloudflare deploy
     (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
  5. wrangler secret put
     (런타임 시크릿: ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY)
      |
      v
[Cloudflare Workers: namecard.redeyepark.workers.dev]
```

---

## 기술적 의사결정

### 결정 1: middleware.ts (Edge Runtime) vs proxy.ts (Node.js Runtime)

- **선택**: `middleware.ts` (Edge Runtime)
- **이유**: Cloudflare Workers는 Edge Runtime만 지원함. Next.js 16의 `proxy.ts`는 Node.js Runtime으로 실행되어 Cloudflare Workers에서 동작하지 않음
- **트레이드오프**: proxy.ts의 추가 기능(Node.js API 접근)을 사용할 수 없음

### 결정 2: GitHub Actions CI/CD vs 로컬 배포

- **선택**: GitHub Actions CI/CD
- **이유**: Windows에서 Wrangler의 WASM 파일(resvg.wasm?module)을 처리할 수 없음. `?` 문자가 Windows 파일명에서 허용되지 않아 로컬 빌드가 불가능함
- **트레이드오프**: 배포가 GitHub push에 의존하며, 로컬에서 직접 배포할 수 없음

### 결정 3: images.unoptimized = true

- **선택**: Next.js Image Optimization 비활성화
- **이유**: Cloudflare Workers는 Next.js의 이미지 최적화 기능을 지원하지 않음
- **트레이드오프**: 이미지 자동 최적화(리사이징, 포맷 변환)를 사용할 수 없음

### 결정 4: 런타임 시크릿 관리 방식 (wrangler secret put)

- **선택**: Cloudflare Workers secrets via `wrangler secret put`
- **이유**: `SUPABASE_SERVICE_ROLE_KEY`와 `ADMIN_EMAILS`는 런타임에만 필요한 시크릿으로, 빌드 타임이 아닌 Cloudflare Workers 런타임에 바인딩되어야 함
- **트레이드오프**: 시크릿 변경 시 재배포가 필요하지 않지만, wrangler CLI를 통해 별도로 관리해야 함

### 결정 5: wrangler.jsonc (JSONC) vs wrangler.toml

- **선택**: `wrangler.jsonc` (JSON with Comments)
- **이유**: JSON 형식이 TypeScript 프로젝트와 일관성이 있으며, JSON Schema 지원으로 IDE 자동 완성 가능
- **트레이드오프**: 기존 Cloudflare 가이드 문서 대부분이 TOML 형식을 사용하므로 참고 시 변환 필요

### 결정 6: Supabase Auth vs NextAuth.js

- **선택**: Supabase Auth (@supabase/ssr)
- **이유**: 데이터베이스(Supabase PostgreSQL), 파일 저장소(Supabase Storage)와 통합된 단일 플랫폼 사용. Cloudflare Workers Edge Runtime 호환성 확보
- **트레이드오프**: Supabase 플랫폼에 대한 의존성 증가, GitHub OAuth 제거
