# SPEC-DEPLOY-001: Cloudflare Pages 배포 및 Supabase 백엔드 마이그레이션

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Pages + Supabase 인프라 마이그레이션 |
| 생성일 | 2026-02-21 |
| 상태 | Planned |
| 우선순위 | High |
| 담당 | expert-backend, expert-devops |
| 관련 SPEC | SPEC-UI-001 (명함 편집기), SPEC-FLOW-001 (명함 제작 플로우) |

---

## Environment (환경)

### 현재 시스템 상태

- **프레임워크**: Next.js 16.1.6 + React 19.2.3 + TypeScript 5
- **UI**: Tailwind CSS v4, Zustand 5.0.11
- **인증**: NextAuth.js v5 (Google + GitHub OAuth, JWT strategy)
- **데이터 저장**: 파일 시스템 (`data/requests/` 디렉토리, JSON 파일)
- **이미지 저장**: 파일 시스템 (`data/requests/` 디렉토리, PNG 파일)
- **배포**: 미설정 (로컬 개발 환경)
- **패키지 매니저**: npm
- **데이터베이스**: 없음

### 목표 시스템 상태

- **배포 플랫폼**: Cloudflare Pages + @opennextjs/cloudflare 어댑터
- **데이터베이스**: Supabase PostgreSQL
- **이미지 저장**: Supabase Storage (avatars, illustrations 버킷)
- **인증**: NextAuth.js v5 유지 (Supabase Auth 사용 안 함)
- **API 인증 방식**: 서버 사이드 API 라우트에서 Supabase service_role 키 사용

### 참조 아키텍처

TEA_MELY 프로젝트가 동일한 Cloudflare Pages + Supabase 아키텍처를 사용하고 있어 참조 패턴으로 활용:

- Cloudflare Pages + @opennextjs/cloudflare 어댑터
- Supabase PostgreSQL + Supabase Storage
- wrangler.toml 설정 패턴

---

## Assumptions (가정)

### 기술 가정

| ID | 가정 | 신뢰도 | 근거 | 위험 (오류 시) | 검증 방법 |
|----|------|--------|------|--------------|----------|
| A1 | @opennextjs/cloudflare가 Next.js 16과 호환된다 | Medium | Next.js 15 지원 확인, 16은 미검증 | 빌드 실패, 어댑터 교체 필요 | 빌드 테스트 실행 |
| A2 | NextAuth.js v5가 Cloudflare Workers 런타임에서 동작한다 | Medium | Edge Runtime 지원 문서 확인 | 인증 실패, Edge 호환 어댑터 필요 | Cloudflare 로컬 테스트 |
| A3 | Supabase JS 클라이언트가 Cloudflare Workers에서 동작한다 | High | Supabase 공식 Edge Function 지원 | API 호출 실패 | wrangler dev 테스트 |
| A4 | 기존 CardRequest 데이터 모델이 PostgreSQL로 자연스럽게 매핑된다 | High | JSON 컬럼 + 관계형 테이블 조합 가능 | 스키마 재설계 필요 | 스키마 프로토타입 |
| A5 | Supabase Storage가 base64 이미지 업로드를 지원한다 | High | Buffer/Blob 업로드 공식 지원 | 이미지 업로드 방식 변경 필요 | Storage API 테스트 |

### 비즈니스 가정

| ID | 가정 | 신뢰도 | 근거 | 위험 (오류 시) |
|----|------|--------|------|--------------|
| B1 | 기존 파일 기반 데이터의 마이그레이션은 불필요하다 (개발 데이터만 존재) | High | 프로덕션 미배포 상태 | 데이터 마이그레이션 스크립트 필요 |
| B2 | Supabase 무료 플랜으로 초기 운영이 가능하다 | High | 소규모 프로젝트, 낮은 트래픽 예상 | 유료 플랜 전환 필요 |
| B3 | RLS가 불필요하다 (NextAuth.js가 인증을 담당하고 service_role 키로 접근) | High | API 라우트에서 세션 체크 구현 완료 | RLS 정책 추가 설계 필요 |

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
  card_front JSONB NOT NULL,       -- CardFrontData (avatarImage는 null로 저장)
  card_back JSONB NOT NULL,        -- CardBackData
  original_avatar_path TEXT,       -- Supabase Storage 경로
  illustration_path TEXT,          -- Supabase Storage 경로
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'processing', 'confirmed')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_by TEXT                  -- NextAuth 사용자 이메일 (선택)
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
시스템은 **항상** `src/lib/supabase.ts`를 통해 Supabase 클라이언트를 초기화해야 한다.

**R3.2** (Event-Driven)
**WHEN** 기존 `storage.ts`의 파일 시스템 함수가 호출되면 **THEN** Supabase 클라이언트를 사용한 동등한 데이터베이스/스토리지 작업으로 대체되어야 한다.

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

#### Supabase 클라이언트 초기화

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only client with service_role key
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

---

### R4: Cloudflare Pages 배포 설정

**R4.1** (Ubiquitous)
시스템은 **항상** @opennextjs/cloudflare 어댑터를 통해 Cloudflare Pages에 배포되어야 한다.

**R4.2** (Event-Driven)
**WHEN** `npm run build`가 실행되면 **THEN** OpenNext 어댑터가 Cloudflare Pages 호환 출력을 생성해야 한다.

**R4.3** (State-Driven)
**IF** Cloudflare Pages 환경에서 실행 중이면 **THEN** Workers 런타임 호환 코드만 실행되어야 한다 (Node.js 전용 API 사용 금지).

#### 구성 파일

```toml
# wrangler.toml
name = "namecard"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NEXT_PUBLIC_SUPABASE_URL = ""

# Secrets are set via Cloudflare Dashboard:
# - AUTH_SECRET
# - AUTH_GOOGLE_ID
# - AUTH_GOOGLE_SECRET
# - AUTH_GITHUB_ID
# - AUTH_GITHUB_SECRET
# - SUPABASE_SERVICE_ROLE_KEY
# - ADMIN_EMAILS
```

```typescript
// open-next.config.ts
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
};

export default config;
```

---

### R5: 환경 변수 업데이트

**R5.1** (Ubiquitous)
시스템은 **항상** 아래 환경 변수를 설정해야 한다.

| 변수명 | 유형 | 용도 | 설정 위치 |
|--------|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase 프로젝트 URL | wrangler.toml [vars] |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase 서비스 키 (서버 전용) | Cloudflare Dashboard |
| `AUTH_SECRET` | Secret | NextAuth JWT 서명 키 | Cloudflare Dashboard |
| `AUTH_GOOGLE_ID` | Secret | Google OAuth Client ID | Cloudflare Dashboard |
| `AUTH_GOOGLE_SECRET` | Secret | Google OAuth Client Secret | Cloudflare Dashboard |
| `AUTH_GITHUB_ID` | Secret | GitHub OAuth Client ID | Cloudflare Dashboard |
| `AUTH_GITHUB_SECRET` | Secret | GitHub OAuth Client Secret | Cloudflare Dashboard |
| `ADMIN_EMAILS` | Secret | 관리자 이메일 목록 | Cloudflare Dashboard |
| `AUTH_TRUST_HOST` | Public | NextAuth 호스트 신뢰 설정 | wrangler.toml [vars] |

**R5.2** (Event-Driven)
**WHEN** 프로덕션 배포 시 **THEN** OAuth 콜백 URL을 프로덕션 도메인으로 업데이트해야 한다.

- Google: `https://{domain}/api/auth/callback/google`
- GitHub: `https://{domain}/api/auth/callback/github`

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

### R7: API 라우트 호환성 (Optional)

**가능하면** 기존 API 라우트의 요청/응답 인터페이스를 유지하여 프론트엔드 변경을 최소화해야 한다.

**R7.1** (State-Driven)
**IF** GET /api/requests/[id] 응답에 이미지 URL이 포함되면 **THEN** `originalAvatarUrl`과 `illustrationUrl` 필드에 Supabase Storage 공개 URL을 반환해야 한다.

---

## Specifications (사양)

### 기술 스택 변경 사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 데이터 저장 | 파일 시스템 (JSON) | Supabase PostgreSQL |
| 이미지 저장 | 파일 시스템 (PNG) | Supabase Storage |
| 이미지 서빙 | API 라우트 프록시 | Supabase Storage 공개 URL |
| 배포 | 없음 | Cloudflare Pages |
| 빌드 어댑터 | 없음 | @opennextjs/cloudflare |
| DB 클라이언트 | 없음 | @supabase/supabase-js |

### 신규 의존성

| 패키지 | 용도 |
|--------|------|
| `@supabase/supabase-js` | Supabase 클라이언트 (DB + Storage) |
| `@opennextjs/cloudflare` | Cloudflare Pages 어댑터 |
| `wrangler` (devDependency) | Cloudflare 로컬 개발 및 배포 도구 |

### 영향 받는 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/storage.ts` | 삭제 | 파일 시스템 스토리지 제거 |
| `src/lib/supabase.ts` | 신규 | Supabase 클라이언트 초기화 |
| `src/lib/supabase-storage.ts` | 신규 | Supabase DB/Storage CRUD 함수 |
| `src/app/api/requests/route.ts` | 수정 | Supabase 쿼리로 변경 |
| `src/app/api/requests/[id]/route.ts` | 수정 | Supabase 쿼리 + Storage URL |
| `src/app/api/requests/[id]/avatar/route.ts` | 삭제 | Storage 공개 URL로 대체 |
| `src/app/api/requests/[id]/illustration/route.ts` | 삭제 | Storage 공개 URL로 대체 |
| `wrangler.toml` | 신규 | Cloudflare Pages 배포 설정 |
| `open-next.config.ts` | 신규 | OpenNext 어댑터 설정 |
| `next.config.ts` | 수정 | Node.js API 제한 관련 설정 |
| `package.json` | 수정 | 의존성 추가, 빌드 스크립트 변경 |
| `.env.local` | 수정 | Supabase 환경 변수 추가 |
| `.gitignore` | 수정 | .wrangler/ 추가 |

### Cloudflare Workers 런타임 제약사항

다음 Node.js API는 Cloudflare Workers에서 사용할 수 없으므로 제거 또는 대체가 필요하다:

| 제약 | 현재 사용처 | 대체 방안 |
|------|-----------|----------|
| `fs` 모듈 | `src/lib/storage.ts` | Supabase 클라이언트로 대체 |
| `path` 모듈 | `src/lib/storage.ts` | 문자열 연결로 대체 |
| `Buffer` | 이미지 처리 | `Uint8Array` + `atob`/`btoa` 사용 |

---

## Traceability (추적성)

| 요구사항 | 구현 파일 | 테스트 |
|---------|----------|--------|
| R1 (DB 스키마) | supabase/migrations/ | acceptance.md TC-R1-* |
| R2 (Storage) | supabase 대시보드 설정 | acceptance.md TC-R2-* |
| R3 (스토리지 레이어) | src/lib/supabase-storage.ts | acceptance.md TC-R3-* |
| R4 (CF Pages) | wrangler.toml, open-next.config.ts | acceptance.md TC-R4-* |
| R5 (환경변수) | .env.local, Cloudflare Dashboard | acceptance.md TC-R5-* |
| R6 (파일 스토리지 제거) | 삭제 대상 파일들 | acceptance.md TC-R6-* |
| R7 (API 호환성) | src/app/api/requests/ | acceptance.md TC-R7-* |
