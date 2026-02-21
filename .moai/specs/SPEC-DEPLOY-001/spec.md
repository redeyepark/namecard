# SPEC-DEPLOY-001: Cloudflare Workers 배포 및 Supabase 백엔드 마이그레이션

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Workers + Supabase Infrastructure Migration |
| 생성일 | 2026-02-21 |
| 상태 | Implemented |
| 우선순위 | High |
| 담당 | expert-backend, expert-devops |
| 관련 SPEC | SPEC-UI-001 (명함 편집기), SPEC-FLOW-001 (명함 제작 플로우), SPEC-AUTH-001 (인증) |

---

## Environment (환경)

### 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x |
| 상태 관리 | Zustand | 5.0.11 |
| 인증 | Supabase Auth (@supabase/ssr) | @supabase/ssr@0.8.0 |
| 데이터베이스 | Supabase PostgreSQL | - |
| 파일 저장 | Supabase Storage (avatars, illustrations 버킷) | - |
| 배포 | Cloudflare Workers (@opennextjs/cloudflare) | @opennextjs/cloudflare@1.16.5 |
| CI/CD | GitHub Actions | ubuntu-latest, Node.js 22 |
| 배포 URL | https://namecard.redeyepark.workers.dev | - |

### 현재 시스템 상태

- 배포 인프라 구현 완료: Cloudflare Workers + @opennextjs/cloudflare 어댑터
- CI/CD 파이프라인 구현 완료: GitHub Actions (`.github/workflows/deploy.yml`)
- 데이터베이스 마이그레이션 완료: Supabase PostgreSQL (`card_requests`, `card_request_status_history` 테이블)
- 파일 저장소 마이그레이션 완료: Supabase Storage (`avatars`, `illustrations` 버킷)
- 인증 시스템 구현 완료: Supabase Auth (@supabase/ssr) - 이메일/비밀번호 + Google OAuth
- 미들웨어 구현 완료: `src/middleware.ts` (Edge Runtime, Cloudflare Workers 호환)
- 파일 시스템 기반 스토리지 완전 제거 완료

### 외부 의존성

- Supabase (PostgreSQL, Storage, Auth)
- Cloudflare Workers (배포 플랫폼)
- GitHub Actions (CI/CD)
- Google OAuth 2.0 (Supabase Auth를 통해 구성)

---

## Assumptions (가정)

### 기술적 가정

| ID | 가정 | 신뢰도 | 검증 결과 |
|----|------|--------|----------|
| A1 | @opennextjs/cloudflare가 Next.js 16과 호환된다 | Verified | 빌드 및 배포 성공 확인 |
| A2 | Supabase Auth (@supabase/ssr)가 Cloudflare Workers Edge Runtime에서 동작한다 | Verified | middleware.ts에서 정상 동작 확인 |
| A3 | Supabase JS 클라이언트가 Cloudflare Workers에서 동작한다 | Verified | API 라우트에서 정상 동작 확인 |
| A4 | 기존 CardRequest 데이터 모델이 PostgreSQL로 자연스럽게 매핑된다 | Verified | JSONB 컬럼 + 관계형 테이블 조합으로 구현 |
| A5 | Supabase Storage가 base64 이미지 업로드를 지원한다 | Verified | avatars, illustrations 버킷에서 정상 동작 |
| A6 | GitHub Actions에서 Wrangler 배포가 가능하다 | Verified | ubuntu-latest 환경에서 정상 배포 |

### 비즈니스 가정

| ID | 가정 | 신뢰도 | 검증 결과 |
|----|------|--------|----------|
| B1 | 기존 파일 기반 데이터의 마이그레이션은 불필요하다 (개발 데이터만 존재) | Verified | 프로덕션 미배포 상태에서 마이그레이션 진행 |
| B2 | Supabase 무료 플랜으로 초기 운영이 가능하다 | Verified | 소규모 프로젝트, 낮은 트래픽 |
| B3 | RLS가 불필요하다 (Supabase Auth가 인증을 담당하고 service_role 키로 접근) | Verified | API 라우트에서 requireAuth/requireAdmin으로 접근 제어 |

### 위험 요소 (해결됨)

| 위험 | 해결 방안 |
|------|----------|
| Cloudflare Workers에서 proxy.ts (Node.js Runtime) 미지원 | middleware.ts (Edge Runtime) 사용으로 해결 |
| Windows에서 Wrangler WASM 파일 호환성 문제 | GitHub Actions CI/CD로 배포하여 해결 |
| Next.js Image Optimization 미지원 | next.config.ts에서 images.unoptimized = true로 해결 |

---

## Requirements (요구사항)

### R1: Supabase 데이터베이스 스키마

**R1.1** (Ubiquitous)
시스템은 **항상** card_requests 테이블에 명함 요청 데이터를 저장해야 한다.

**R1.2** (Event-Driven)
**WHEN** 새로운 명함 요청이 생성되면 **THEN** card_requests 테이블에 레코드를 삽입하고 card_request_status_history 테이블에 초기 상태를 기록해야 한다.

**R1.3** (State-Driven)
**IF** card_requests 레코드에 중첩된 카드 데이터(front, back)가 포함되어 있으면 **THEN** JSONB 컬럼에 구조화된 형태로 저장해야 한다.

**R1.4** (Unwanted)
시스템은 RLS(Row Level Security)를 적용**하지 않아야 한다**. 모든 데이터 접근은 service_role 키를 통해 서버 사이드 API 라우트에서 처리한다.

#### 스키마 설계

```sql
-- card_requests 테이블
CREATE TABLE card_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_front JSONB NOT NULL,
  card_back JSONB NOT NULL,
  original_avatar_path TEXT,
  illustration_path TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'processing', 'confirmed')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_by TEXT
);

-- card_request_status_history 테이블
CREATE TABLE card_request_status_history (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES card_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'processing', 'confirmed')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_card_requests_status ON card_requests(status);
CREATE INDEX idx_card_requests_submitted_at ON card_requests(submitted_at DESC);
CREATE INDEX idx_status_history_request_id ON card_request_status_history(request_id);
```

---

### R2: Supabase Storage 구성

**R2.1** (Ubiquitous)
시스템은 **항상** 아바타 이미지를 `avatars` 버킷에, 일러스트레이션 이미지를 `illustrations` 버킷에 저장해야 한다.

**R2.2** (Event-Driven)
**WHEN** 사용자가 아바타 이미지를 포함한 명함 요청을 제출하면 **THEN** base64 데이터를 디코딩하여 Supabase Storage `avatars` 버킷에 PNG 파일로 업로드해야 한다.

**R2.3** (Event-Driven)
**WHEN** 관리자가 일러스트레이션 이미지를 업로드하면 **THEN** base64 데이터를 디코딩하여 Supabase Storage `illustrations` 버킷에 PNG 파일로 업로드해야 한다.

**R2.4** (State-Driven)
**IF** 이미지가 Supabase Storage에 저장되어 있으면 **THEN** 공개 URL을 통해 직접 접근할 수 있어야 한다 (별도의 API 라우트 불필요).

#### Storage 버킷 설정

| 버킷 | 공개 여부 | 파일 형식 | 최대 크기 | 경로 패턴 |
|------|----------|----------|----------|----------|
| avatars | Public | image/png | 10MB | `{request_id}/avatar.png` |
| illustrations | Public | image/png | 10MB | `{request_id}/illustration.png` |

---

### R3: 스토리지 레이어 마이그레이션

**R3.1** (Ubiquitous)
시스템은 **항상** Supabase 클라이언트를 통해 데이터 저장 및 조회를 수행해야 한다.

**R3.2** (Event-Driven)
**WHEN** 기존 파일 시스템 기반 함수가 호출되면 **THEN** Supabase 클라이언트를 사용한 동등한 데이터베이스/스토리지 작업으로 대체되어야 한다.

**R3.3** (Unwanted)
시스템은 Node.js `fs` 모듈을 데이터 저장 목적으로 사용**하지 않아야 한다**.

#### 함수 매핑

| 기존 함수 (storage.ts) | 새 함수 (supabase 기반) | 동작 |
|----------------------|----------------------|------|
| `saveRequest(request)` | `insertCardRequest(request)` | Supabase INSERT |
| `getRequest(id)` | `getCardRequest(id)` | Supabase SELECT by ID |
| `getAllRequests()` | `getAllCardRequests()` | Supabase SELECT ALL + ORDER BY |
| `updateRequest(id, updates)` | `updateCardRequest(id, updates)` | Supabase UPDATE |
| `saveImageFile(id, type, base64)` | `uploadImage(id, type, base64)` | Supabase Storage upload |
| `getImageFile(id, type)` | 제거 (공개 URL 사용) | N/A |

---

### R4: Cloudflare Workers 배포 설정

**R4.1** (Ubiquitous)
시스템은 **항상** @opennextjs/cloudflare 어댑터를 통해 Cloudflare Workers에 배포되어야 한다.

**R4.2** (Event-Driven)
**WHEN** `npx opennextjs-cloudflare build`가 실행되면 **THEN** Cloudflare Workers 호환 출력을 생성해야 한다.

**R4.3** (State-Driven)
**IF** Cloudflare Workers 환경에서 실행 중이면 **THEN** Edge Runtime 호환 코드만 실행되어야 한다 (Node.js 전용 API 사용 금지).

**R4.4** (Event-Driven)
**WHEN** master 브랜치에 push가 발생하면 **THEN** GitHub Actions 워크플로우가 자동으로 빌드 및 배포를 수행해야 한다.

#### 구성 파일

`wrangler.jsonc` 설정:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "namecard",
  "compatibility_date": "2026-02-20",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "namecard"
    }
  ]
}
```

`next.config.ts` 설정:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare Workers는 Next.js Image Optimization 미지원
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

#### GitHub Actions CI/CD 파이프라인 (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout (actions/checkout@v4)
      - Setup Node.js 22 (actions/setup-node@v4, npm 캐시)
      - Install dependencies (npm ci)
      - Build with OpenNext (npx opennextjs-cloudflare build)
        - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 빌드 환경 변수로 주입
      - Deploy to Cloudflare Workers (npx opennextjs-cloudflare deploy)
        - CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID 사용
      - Set runtime secrets (wrangler secret put)
        - ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY를 Cloudflare Workers 시크릿으로 설정
```

---

### R5: 환경 변수 구성

**R5.1** (Ubiquitous)
시스템은 **항상** 아래 환경 변수를 올바르게 설정해야 한다.

| 변수명 | 유형 | 용도 | 설정 위치 |
|--------|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (빌드 타임) | Supabase 프로젝트 URL | GitHub Secrets -> 빌드 env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (빌드 타임) | Supabase 익명 키 | GitHub Secrets -> 빌드 env |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (런타임) | Supabase 서비스 키 (서버 전용) | Cloudflare Workers secret (wrangler secret put) |
| `ADMIN_EMAILS` | Secret (런타임) | 관리자 이메일 목록 | Cloudflare Workers secret (wrangler secret put) |
| `CLOUDFLARE_API_TOKEN` | CI/CD 전용 | Cloudflare API 인증 토큰 | GitHub Secrets |
| `CLOUDFLARE_ACCOUNT_ID` | CI/CD 전용 | Cloudflare 계정 ID | GitHub Secrets |

**R5.2** (Unwanted)
시스템은 `NEXT_PUBLIC_` 접두사가 없는 시크릿 변수를 클라이언트에 노출**하지 않아야 한다**.

---

### R6: 파일 기반 스토리지 제거

**R6.1** (Unwanted)
시스템은 `data/requests/` 디렉토리에 데이터를 저장**하지 않아야 한다**.

**R6.2** (Event-Driven)
**WHEN** 마이그레이션이 완료되면 **THEN** 다음 파일/디렉토리가 제거되어야 한다:

- `src/lib/storage.ts` (파일 시스템 기반 스토리지 모듈)
- `src/app/api/requests/[id]/avatar/route.ts` (이미지 서빙 API)
- `src/app/api/requests/[id]/illustration/route.ts` (이미지 서빙 API)
- `data/requests/` 디렉토리 (데이터 디렉토리)

**R6.3** (Event-Driven)
**WHEN** 이미지 URL이 요청되면 **THEN** Supabase Storage 공개 URL을 직접 반환해야 한다 (별도의 프록시 API 라우트 없음).

---

### R7: 미들웨어 호환성

**R7.1** (Ubiquitous)
시스템은 **항상** `src/middleware.ts`를 Edge Runtime으로 실행해야 한다 (Cloudflare Workers 호환).

**R7.2** (Unwanted)
시스템은 Next.js 16의 `proxy.ts` (Node.js Runtime)를 사용**하지 않아야 한다**. Cloudflare Workers는 Node.js Runtime을 지원하지 않는다.

**R7.3** (State-Driven)
**IF** 사용자 요청이 보호된 라우트에 대한 것이면 **THEN** middleware.ts에서 Supabase 세션을 갱신하고 인증 상태를 확인해야 한다.

---

### R8: API 라우트 호환성 (Optional)

**가능하면** 기존 API 라우트의 요청/응답 인터페이스를 유지하여 프론트엔드 변경을 최소화해야 한다.

**R8.1** (State-Driven)
**IF** GET /api/requests/[id] 응답에 이미지 URL이 포함되면 **THEN** `originalAvatarUrl`과 `illustrationUrl` 필드에 Supabase Storage 공개 URL을 반환해야 한다.

---

## Specifications (기술 명세)

### 기술 스택 변경 사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 데이터 저장 | 파일 시스템 (JSON) | Supabase PostgreSQL |
| 이미지 저장 | 파일 시스템 (PNG) | Supabase Storage |
| 이미지 서빙 | API 라우트 프록시 | Supabase Storage 공개 URL |
| 인증 | NextAuth.js v5 | Supabase Auth (@supabase/ssr) |
| 미들웨어 | 없음 | middleware.ts (Edge Runtime) |
| 배포 | 없음 | Cloudflare Workers |
| CI/CD | 없음 | GitHub Actions |
| 빌드 어댑터 | 없음 | @opennextjs/cloudflare |
| DB 클라이언트 | 없음 | @supabase/supabase-js |

### 신규 의존성

| 패키지 | 용도 |
|--------|------|
| `@supabase/supabase-js@^2.97.0` | Supabase 클라이언트 (DB + Storage + Auth) |
| `@supabase/ssr@^0.8.0` | Supabase 서버 사이드 렌더링 (쿠키 세션 관리) |
| `@opennextjs/cloudflare@^1.16.5` | Cloudflare Workers 어댑터 |
| `wrangler@^4.67.0` (devDependency) | Cloudflare 로컬 개발 및 배포 도구 |

### 영향 받는 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/storage.ts` | 삭제 | 파일 시스템 스토리지 제거 |
| `src/lib/supabase.ts` | 신규 | Supabase 서버 클라이언트 (service_role key) |
| `src/lib/supabase-auth.ts` | 신규 | 브라우저 Supabase 클라이언트 (anon key) |
| `src/lib/auth-utils.ts` | 신규 | 서버 인증 유틸리티 (requireAuth, requireAdmin) |
| `src/lib/supabase-storage.ts` | 신규 | Supabase DB/Storage CRUD 함수 |
| `src/middleware.ts` | 신규 | Supabase 세션 갱신 미들웨어 (Edge Runtime) |
| `src/app/api/requests/route.ts` | 수정 | Supabase 쿼리로 변경 |
| `src/app/api/requests/[id]/route.ts` | 수정 | Supabase 쿼리 + Storage URL |
| `src/app/api/requests/[id]/avatar/route.ts` | 삭제 | Storage 공개 URL로 대체 |
| `src/app/api/requests/[id]/illustration/route.ts` | 삭제 | Storage 공개 URL로 대체 |
| `wrangler.jsonc` | 신규 | Cloudflare Workers 배포 설정 |
| `.github/workflows/deploy.yml` | 신규 | GitHub Actions CI/CD 파이프라인 |
| `next.config.ts` | 수정 | images.unoptimized + initOpenNextCloudflareForDev |
| `package.json` | 수정 | 의존성 추가, 빌드 스크립트 변경 |
| `.gitignore` | 수정 | .wrangler/, .open-next/ 추가 |

### Cloudflare Workers 런타임 제약사항

| 제약 | 해결 방안 |
|------|----------|
| `fs` 모듈 사용 불가 | Supabase 클라이언트로 대체 |
| `path` 모듈 사용 불가 | 문자열 연결로 대체 |
| `Buffer` 제한적 지원 | `Uint8Array` + `atob`/`btoa` 사용 |
| Next.js Image Optimization 미지원 | `images.unoptimized: true` 설정 |
| Node.js Runtime (proxy.ts) 미지원 | Edge Runtime (middleware.ts) 사용 |
| Windows에서 WASM 파일 비호환 | GitHub Actions CI/CD로 배포 |

### 배포 아키텍처

```
[사용자 브라우저]
      |
      v
[Cloudflare Workers]     <-- Next.js 전체 (SSR + 정적 자산)
      |                       - middleware.ts (Edge Runtime, Supabase 세션 갱신)
      |                       - Supabase Auth (@supabase/ssr) 쿠키 기반 인증
      |                       - API 라우트 (Supabase service_role 클라이언트)
      v
[Supabase]
  |-- PostgreSQL           <-- card_requests, card_request_status_history
  |-- Storage              <-- avatars/, illustrations/ 버킷
  +-- Auth                 <-- 이메일/비밀번호 + Google OAuth 인증
```

### CI/CD 아키텍처

```
[GitHub Repository - master branch push]
      |
      v
[GitHub Actions - ubuntu-latest]
  1. Checkout -> Setup Node.js 22 -> npm ci
  2. npx opennextjs-cloudflare build
     (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 주입)
  3. npx opennextjs-cloudflare deploy
     (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID 사용)
  4. wrangler secret put
     (ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY 런타임 시크릿 설정)
      |
      v
[https://namecard.redeyepark.workers.dev]
```

---

## Traceability (추적성)

| 요구사항 | 구현 파일 | 테스트 |
|---------|----------|--------|
| R1 (DB 스키마) | Supabase SQL Editor | acceptance.md TC-R1-* |
| R2 (Storage) | Supabase Dashboard | acceptance.md TC-R2-* |
| R3 (스토리지 레이어) | src/lib/supabase-storage.ts | acceptance.md TC-R3-* |
| R4 (CF Workers) | wrangler.jsonc, .github/workflows/deploy.yml | acceptance.md TC-R4-* |
| R5 (환경변수) | GitHub Secrets, Cloudflare Workers secrets | acceptance.md TC-R5-* |
| R6 (파일 스토리지 제거) | 삭제 대상 파일들 | acceptance.md TC-R6-* |
| R7 (미들웨어) | src/middleware.ts | acceptance.md TC-R7-* |
| R8 (API 호환성) | src/app/api/requests/ | acceptance.md TC-R8-* |
