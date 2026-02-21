# SPEC-DEPLOY-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-DEPLOY-001 |
| 제목 | Cloudflare Pages + Supabase 인프라 마이그레이션 구현 계획 |
| 관련 문서 | spec.md, acceptance.md |

---

## 마일스톤 개요

| 마일스톤 | 목표 | 우선순위 | 의존성 |
|---------|------|---------|--------|
| M1 | Supabase 프로젝트 설정 및 스키마 | Primary | 없음 |
| M2 | 스토리지 레이어 리팩토링 | Primary | M1 완료 |
| M3 | API 라우트 업데이트 | Primary | M2 완료 |
| M4 | Cloudflare Pages 배포 설정 | Primary | M3 완료 |
| M5 | 통합 테스트 및 프로덕션 배포 | Secondary | M4 완료 |

---

## M1: Supabase 프로젝트 설정 및 스키마

### 목표

Supabase 프로젝트를 생성하고 card_requests 데이터 모델에 맞는 PostgreSQL 스키마를 정의한다.

### 작업 목록

**M1-1: Supabase 프로젝트 초기화**

- Supabase Dashboard에서 새 프로젝트 생성
- 프로젝트 URL과 service_role 키 확보
- `.env.local`에 환경 변수 추가

**M1-2: 데이터베이스 스키마 생성**

- `card_requests` 테이블 생성 (spec.md R1 참조)
  - id: UUID PK
  - card_front: JSONB (CardFrontData, avatarImage 제외)
  - card_back: JSONB (CardBackData)
  - original_avatar_path: TEXT (Storage 경로)
  - illustration_path: TEXT (Storage 경로)
  - status: TEXT + CHECK constraint
  - submitted_at, updated_at: TIMESTAMPTZ
  - note: TEXT (nullable)
  - created_by: TEXT (nullable, NextAuth 사용자 이메일)
- `card_request_status_history` 테이블 생성
  - id: BIGSERIAL PK
  - request_id: UUID FK -> card_requests(id) ON DELETE CASCADE
  - status: TEXT + CHECK constraint
  - timestamp: TIMESTAMPTZ
- 인덱스 생성 (status, submitted_at DESC, request_id)

**M1-3: Storage 버킷 생성**

- `avatars` 버킷 생성 (Public)
- `illustrations` 버킷 생성 (Public)
- 파일 경로 규칙: `{request_id}/avatar.png`, `{request_id}/illustration.png`

**M1-4: RLS 비활성화 확인**

- card_requests 테이블의 RLS 비활성화 확인
- card_request_status_history 테이블의 RLS 비활성화 확인
- Storage 버킷의 공개 읽기 정책 설정

### 기술 접근

- Supabase SQL Editor 또는 마이그레이션 파일로 스키마 생성
- JSONB 컬럼 사용으로 중첩된 카드 데이터 유연하게 저장
- status 필드에 CHECK constraint로 유효값 보장
- `created_by` 필드 추가로 향후 사용자별 필터링 가능

### 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| JSONB 쿼리 성능 | 대량 데이터 시 느려질 수 있음 | GIN 인덱스 추가 검토 |
| Storage 용량 한도 | 무료 플랜 1GB 제한 | 이미지 최적화, 필요 시 유료 전환 |

---

## M2: 스토리지 레이어 리팩토링

### 목표

파일 시스템 기반 `storage.ts`를 Supabase 클라이언트 기반으로 완전히 교체한다.

### 작업 목록

**M2-1: Supabase 클라이언트 모듈 생성**

- `src/lib/supabase.ts` 생성
  - `createClient` with service_role key
  - 환경 변수 검증 (런타임 에러 방지)

**M2-2: 데이터베이스 CRUD 함수 구현**

- `src/lib/supabase-storage.ts` 생성
  - `insertCardRequest(request)`: INSERT + status_history INSERT
  - `getCardRequest(id)`: SELECT by UUID + JOIN status_history
  - `getAllCardRequests()`: SELECT ALL + ORDER BY submitted_at DESC
  - `updateCardRequest(id, updates)`: UPDATE + status_history INSERT (상태 변경 시)

**M2-3: 이미지 업로드/URL 함수 구현**

- `uploadImage(requestId, type, base64Data)`: base64 -> Buffer -> Supabase Storage upload
- `getImagePublicUrl(requestId, type)`: Supabase Storage 공개 URL 생성
- Buffer -> Uint8Array 변환 (Cloudflare Workers 호환)

**M2-4: 기존 storage.ts 제거**

- `src/lib/storage.ts` 삭제
- 모든 import 경로 업데이트

### 기술 접근

- Supabase JS 클라이언트 v2 사용
- 서버 사이드 전용 클라이언트 (service_role key)
- base64 디코딩: `atob()` + `Uint8Array` (Workers 호환)
- 트랜잭션: INSERT card_request와 status_history를 순차 실행 (Supabase JS에서는 명시적 트랜잭션 미지원이므로 순차 처리)

### 데이터 매핑

```
CardRequest (TypeScript)          ->  card_requests (PostgreSQL)
  .id                             ->  id (UUID)
  .card.front                     ->  card_front (JSONB)
  .card.back                      ->  card_back (JSONB)
  .originalAvatarPath             ->  original_avatar_path (TEXT)
  .illustrationPath               ->  illustration_path (TEXT)
  .status                         ->  status (TEXT)
  .submittedAt                    ->  submitted_at (TIMESTAMPTZ)
  .updatedAt                      ->  updated_at (TIMESTAMPTZ)
  .note                           ->  note (TEXT)
  .statusHistory[]                ->  card_request_status_history (별도 테이블)
```

### 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| camelCase -> snake_case 매핑 오류 | 데이터 불일치 | 변환 유틸리티 함수 작성, 단위 테스트 |
| Workers 환경에서 Buffer 미지원 | 이미지 업로드 실패 | Uint8Array 기반 구현, 폴리필 검토 |
| Supabase 클라이언트 초기화 타이밍 | cold start 지연 | 싱글톤 패턴, lazy initialization |

---

## M3: API 라우트 업데이트

### 목표

모든 API 라우트를 Supabase 기반 함수로 전환하고, 이미지 서빙 라우트를 제거한다.

### 작업 목록

**M3-1: POST /api/requests 수정**

- `saveRequest` -> `insertCardRequest`
- `saveImageFile` -> `uploadImage`
- NextAuth 세션 체크 유지
- 응답 형식 유지

**M3-2: GET /api/requests 수정**

- `getAllRequests` -> `getAllCardRequests`
- 관리자 권한 체크 유지
- 응답 형식 유지

**M3-3: GET /api/requests/[id] 수정**

- `getRequest` -> `getCardRequest`
- `originalAvatarUrl`: Supabase Storage 공개 URL로 변경
- `illustrationUrl`: Supabase Storage 공개 URL로 변경
- NextAuth 세션 체크 유지

**M3-4: PATCH /api/requests/[id] 수정**

- `getRequest` -> `getCardRequest`
- `updateRequest` -> `updateCardRequest`
- `saveImageFile` -> `uploadImage`
- 상태 전환 검증 유지
- 관리자 권한 체크 유지

**M3-5: 이미지 서빙 라우트 제거**

- `src/app/api/requests/[id]/avatar/route.ts` 삭제
- `src/app/api/requests/[id]/illustration/route.ts` 삭제
- 해당 이미지는 Supabase Storage 공개 URL로 직접 접근

### 기술 접근

- API 라우트의 요청/응답 인터페이스를 최대한 유지
- 이미지 URL만 Supabase Storage URL로 변경
- NextAuth 인증 로직은 변경 없이 유지
- 에러 핸들링 패턴 유지 (try-catch + NextResponse.json)

### 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| 프론트엔드 이미지 URL 변경 | 이미지 표시 깨짐 | 프론트엔드 컴포넌트의 이미지 URL 참조 확인 |
| NextAuth Edge 호환성 | 인증 실패 | Cloudflare Workers에서 NextAuth 테스트 |

---

## M4: Cloudflare Pages 배포 설정

### 목표

@opennextjs/cloudflare 어댑터를 설치하고 Cloudflare Pages 배포를 구성한다.

### 작업 목록

**M4-1: 의존성 설치**

```bash
npm install @opennextjs/cloudflare
npm install -D wrangler
```

**M4-2: 빌드 설정 파일 생성**

- `wrangler.toml` 생성 (spec.md R4 참조)
- `open-next.config.ts` 생성

**M4-3: package.json 빌드 스크립트 수정**

```json
{
  "scripts": {
    "build": "opennextjs-cloudflare build",
    "preview": "opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare deploy"
  }
}
```

**M4-4: next.config.ts 수정**

- Cloudflare Workers 호환을 위한 설정 확인
- 필요 시 `serverExternalPackages` 설정

**M4-5: .gitignore 업데이트**

- `.wrangler/` 추가
- `.open-next/` 추가

**M4-6: 환경 변수 설정**

- Cloudflare Dashboard에서 시크릿 설정 (AUTH_SECRET, OAuth 키들, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS)
- wrangler.toml에 공개 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, AUTH_TRUST_HOST)

### 기술 접근

- TEA_MELY 프로젝트의 OpenNext 설정 패턴 참조
- `nodejs_compat` compatibility flag로 Node.js API 일부 지원
- 로컬 테스트: `wrangler pages dev` 또는 `npm run preview`

### 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| Next.js 16 + OpenNext 호환성 | 빌드 실패 | OpenNext 최신 버전 사용, 이슈 트래커 확인 |
| Workers 번들 크기 제한 (25MB) | 배포 실패 | 의존성 최적화, tree-shaking 확인 |
| Cold start 지연 | 초기 응답 느림 | 경량 의존성 유지, Smart Placement 활성화 |

---

## M5: 통합 테스트 및 프로덕션 배포

### 목표

전체 시스템을 E2E로 검증하고 프로덕션 환경에 배포한다.

### 작업 목록

**M5-1: 로컬 통합 테스트**

- `wrangler pages dev`로 Cloudflare 로컬 환경 실행
- 모든 API 라우트 수동 테스트
- NextAuth 로그인 플로우 검증
- 이미지 업로드/다운로드 검증

**M5-2: OAuth 콜백 URL 설정**

- Google Cloud Console: 프로덕션 도메인 콜백 URL 추가
- GitHub Developer Settings: 프로덕션 도메인 콜백 URL 추가

**M5-3: 프로덕션 배포**

- `npm run deploy`로 Cloudflare Pages 배포
- Cloudflare Dashboard에서 커스텀 도메인 설정 (필요 시)
- 배포 후 전체 플로우 검증

**M5-4: 정리 작업**

- `data/requests/` 디렉토리 제거 (또는 .gitignore에 추가)
- tech.md 업데이트 (배포: Vercel -> Cloudflare Pages, DB: Supabase PostgreSQL)
- structure.md 업데이트 (새 파일 반영)
- product.md 업데이트 (필요 시)

---

## 아키텍처 설계 방향

### 배포 아키텍처

```
[사용자 브라우저]
      |
      v
[Cloudflare Pages CDN]   <-- 정적 자산 (HTML, CSS, JS)
      |
      v
[Cloudflare Workers]     <-- Next.js API 라우트 (서버 사이드)
      |                       - NextAuth.js 인증
      |                       - Supabase 클라이언트 (service_role)
      v
[Supabase]
  ├── PostgreSQL           <-- card_requests, status_history
  └── Storage              <-- avatars/, illustrations/ 버킷
```

### 데이터 흐름

```
명함 요청 제출:
  브라우저 -> POST /api/requests -> NextAuth 세션 확인
    -> Supabase DB: INSERT card_requests
    -> Supabase Storage: PUT avatars/{id}/avatar.png
    -> 응답: { id, status, submittedAt }

관리자 상태 변경:
  브라우저 -> PATCH /api/requests/[id] -> NextAuth 관리자 확인
    -> Supabase DB: UPDATE card_requests + INSERT status_history
    -> Supabase Storage: PUT illustrations/{id}/illustration.png (선택)
    -> 응답: { id, status, updatedAt }

이미지 접근:
  브라우저 -> Supabase Storage 공개 URL -> CDN -> 이미지 직접 응답
  (API 라우트 프록시 불필요)
```

### 인증 아키텍처

```
NextAuth.js v5 (유지)
  ├── Google OAuth Provider
  ├── GitHub OAuth Provider
  ├── JWT Strategy (세션)
  └── Callbacks
      ├── jwt: ADMIN_EMAILS 기반 role 결정
      └── session: role을 세션에 노출

Supabase 접근:
  └── service_role key (서버 사이드 전용)
      └── RLS 비활성화 -> 전체 접근 (인증은 NextAuth가 담당)
```

---

## 전문가 상담 권장 사항

### expert-backend 상담 권장

- Supabase 클라이언트 초기화 패턴 (Workers 환경)
- camelCase/snake_case 데이터 매핑 전략
- 트랜잭션 없이 데이터 일관성 보장 방법
- Supabase Storage 업로드 최적화

### expert-devops 상담 권장

- Cloudflare Pages 배포 파이프라인 설정
- 환경 변수 관리 (시크릿 vs 공개)
- OpenNext 어댑터 설정 최적화
- 모니터링 및 로깅 전략
