# SPEC-AUTH-001: Supabase 인증 및 역할 기반 접근 제어

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | Supabase Authentication & Role-Based Access Control |
| 생성일 | 2026-02-21 |
| 상태 | Implemented (REQ-AUTH-009 추가: 비밀번호 변경) |
| 우선순위 | High |
| 관련 SPEC | SPEC-ADMIN-001 (관리자 대시보드), SPEC-FLOW-001 (명함 제작 플로우) |

---

## Environment (환경)

### 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x |
| 인증 | Supabase Auth (@supabase/ssr + @supabase/supabase-js) | @supabase/ssr@0.8.0, @supabase/supabase-js@2.97.0 |
| 세션 전략 | Supabase 쿠키 기반 세션 (@supabase/ssr) | - |
| 데이터 저장 | Supabase PostgreSQL | - |
| 파일 저장 | Supabase Storage (avatars, illustrations 버킷) | - |
| 배포 | Cloudflare Pages (@opennextjs/cloudflare) | - |

### 현재 시스템 상태

- 인증 시스템 구현 완료: Supabase Auth 기반 이메일/비밀번호 + Google OAuth 인증
- 라우트 보호 구현 완료: `middleware.ts`를 통한 세션 갱신 및 페이지/API 라우트 보호
- 역할 기반 접근 제어 구현 완료: `ADMIN_EMAILS` 환경 변수 기반 관리자 역할 확인 (`/api/auth/me` 엔드포인트)
- 데이터베이스 마이그레이션 완료: Supabase PostgreSQL (`card_requests` 테이블)
- 파일 저장소 마이그레이션 완료: Supabase Storage (avatars, illustrations 버킷)
- 클라이언트 인증 상태 관리: `AuthProvider` 컨텍스트 + `useAuth()` 커스텀 훅

### 외부 의존성

- Supabase Auth (인증 및 사용자 관리)
- Google OAuth 2.0 (Supabase Auth를 통해 구성)
- Supabase PostgreSQL (데이터 저장)
- Supabase Storage (파일 저장)
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`

---

## Assumptions (가정)

### 기술적 가정

- **A1**: Supabase Auth는 Next.js 16 App Router와 `@supabase/ssr` 패키지를 통해 호환된다
- **A2**: Supabase 쿠키 기반 세션은 서버/클라이언트 양쪽에서 안전하게 관리된다
- **A3**: Google OAuth 제공자가 Supabase Auth를 통해 안정적으로 사용 가능하다
- **A4**: Cloudflare Pages 배포 환경에서 환경 변수를 안전하게 관리할 수 있다 (`.dev.vars`)

### 비즈니스 가정

- **A5**: 관리자 수는 소규모이며 환경 변수로 관리 가능하다 (ADMIN_EMAILS)
- **A6**: 일반 사용자는 명함 생성 기능만 필요하며, 관리 기능은 불필요하다
- **A7**: 랜딩 페이지(`/`)는 비로그인 상태에서도 접근 가능해야 한다
- **A8**: 사용자 프로필 데이터는 Supabase Auth가 관리하며, 관리자 여부는 `/api/auth/me`를 통해 확인한다

### 위험 요소

| 가정 | 신뢰도 | 오류 시 영향 | 검증 방법 |
|------|--------|-------------|----------|
| A1 | High | 인증 라이브러리 교체 필요 | @supabase/ssr 공식 문서 확인 |
| A2 | High | 세션 관리 방식 변경 필요 | Supabase SSR 쿠키 전략 문서 검증 |
| A5 | Medium | 관리자 관리 UI 추가 필요 | 운영 후 관리자 수 모니터링 |

---

## Requirements (요구사항)

### REQ-AUTH-001: Supabase 인증 설정

**[Ubiquitous]** 시스템은 **항상** Supabase Auth를 통한 인증을 지원해야 한다.

- REQ-AUTH-001.1: 이메일/비밀번호 인증을 지원해야 한다
- REQ-AUTH-001.2: Google OAuth 2.0 제공자를 Supabase Auth를 통해 지원해야 한다
- REQ-AUTH-001.3: Supabase 쿠키 기반 세션을 `@supabase/ssr`을 통해 관리해야 한다
- REQ-AUTH-001.4: 브라우저 클라이언트는 `createBrowserClient`로, 서버 클라이언트는 `createServerSupabaseClient`로 생성해야 한다

### REQ-AUTH-002: 사용자 역할 관리

**[Event-Driven]** **WHEN** 사용자가 로그인하면 **THEN** 시스템은 `/api/auth/me` 엔드포인트를 통해 `ADMIN_EMAILS` 환경 변수를 확인하여 관리자 여부를 반환해야 한다.

- REQ-AUTH-002.1: `ADMIN_EMAILS` 환경 변수에 포함된 이메일은 `isAdmin: true`를 반환한다
- REQ-AUTH-002.2: `ADMIN_EMAILS`에 포함되지 않은 이메일은 `isAdmin: false`를 반환한다
- REQ-AUTH-002.3: `ADMIN_EMAILS`는 쉼표로 구분된 이메일 목록이다 (예: `admin1@example.com,admin2@example.com`)
- REQ-AUTH-002.4: 관리자 여부는 서버 사이드에서 `isAdmin()` 유틸리티 함수로 확인한다

### REQ-AUTH-003: 페이지 접근 제어 (프록시 미들웨어)

**[State-Driven]** **IF** 사용자가 인증되지 않은 상태라면 **THEN** 보호된 라우트 접근 시 로그인 페이지로 리다이렉트해야 한다.

| 라우트 | 접근 수준 | 설명 |
|--------|----------|------|
| `/` | Public | 랜딩 페이지 |
| `/login` | Public | 로그인 페이지 (이메일/비밀번호 + Google OAuth) |
| `/signup` | Public | 회원가입 페이지 |
| `/confirm` | Public | 이메일 확인 완료 페이지 |
| `/callback` | Public | OAuth 콜백 핸들러 |
| `/create` | Authenticated | 명함 생성 위저드 (로그인 필요) |
| `/create/edit` | Authenticated | 명함 편집기 (로그인 필요) |
| `/admin` | Admin Only | 관리자 대시보드 |
| `/dashboard` | Authenticated | 사용자 대시보드 (내 요청 목록) |
| `/dashboard/[id]` | Authenticated | 사용자 요청 상세 (소유권 검증) |
| `/dashboard/settings` | Authenticated | 사용자 설정 (비밀번호 변경) |
| `/admin` | Admin Only | 관리자 대시보드 |
| `/admin/[id]` | Admin Only | 요청 상세 페이지 |

- REQ-AUTH-003.1: `middleware.ts`를 통해 Supabase 세션 갱신을 처리한다 (Cloudflare Edge Runtime 호환)
- REQ-AUTH-003.2: 인증되지 않은 사용자가 보호된 라우트에 접근하면 `/login`으로 리다이렉트한다
- REQ-AUTH-003.3: 리다이렉트 시 원래 요청 URL을 `callbackUrl` 파라미터로 전달한다
- REQ-AUTH-003.4: 인증된 일반 사용자가 `/admin` 라우트에 접근하면 `/`로 리다이렉트한다

### REQ-AUTH-004: API 라우트 접근 제어

**[State-Driven]** **IF** API 요청에 유효한 Supabase 세션이 없다면 **THEN** 시스템은 401 Unauthorized 응답을 반환해야 한다.

| API 라우트 | 메서드 | 접근 수준 |
|-----------|--------|----------|
| `POST /api/requests` | POST | Authenticated (requireAuth) |
| `GET /api/requests` | GET (목록) | Admin Only (requireAdmin) |
| `GET /api/requests/[id]` | GET (상세) | Authenticated (requireAuth) |
| `PATCH /api/requests/[id]` | PATCH | Admin Only (requireAdmin) |
| `GET /api/auth/me` | GET | Authenticated |

- REQ-AUTH-004.1: 인증되지 않은 API 요청에 대해 `401 Unauthorized`를 반환한다
- REQ-AUTH-004.2: 권한 부족 API 요청에 대해 `403 Forbidden`을 반환한다
- REQ-AUTH-004.3: 각 API 핸들러에서 `requireAuth()` 또는 `requireAdmin()` 헬퍼 함수를 통해 세션을 검증한다

### REQ-AUTH-005: 로그인 페이지

**[Event-Driven]** **WHEN** 사용자가 `/login` 페이지에 접근하면 **THEN** 이메일/비밀번호 입력 폼과 Google OAuth 로그인 버튼을 표시해야 한다.

- REQ-AUTH-005.1: 이메일/비밀번호 로그인 폼을 제공한다
- REQ-AUTH-005.2: Google OAuth 로그인 버튼을 제공한다
- REQ-AUTH-005.3: 로그인 성공 시 `callbackUrl`로 리다이렉트한다 (기본값: `/create`)
- REQ-AUTH-005.4: 이미 로그인된 사용자가 `/login`에 접근하면 `/create`로 리다이렉트한다
- REQ-AUTH-005.5: 로그인 실패 시 오류 메시지를 표시한다
- REQ-AUTH-005.6: Tailwind CSS를 사용하여 기존 디자인과 일관된 스타일을 적용한다

### REQ-AUTH-006: 로그아웃 기능

**[Event-Driven]** **WHEN** 사용자가 로그아웃 버튼을 클릭하면 **THEN** Supabase 세션을 종료하고 랜딩 페이지로 리다이렉트해야 한다.

- REQ-AUTH-006.1: `UserMenu` 컴포넌트에 로그아웃 버튼을 포함한다
- REQ-AUTH-006.2: 명함 생성 페이지에 사용자 정보 및 로그아웃 버튼을 표시한다
- REQ-AUTH-006.3: 로그아웃 시 `supabase.auth.signOut()`을 호출하고 `/`로 리다이렉트한다

### REQ-AUTH-007: 사용자 상태 표시

**[State-Driven]** **IF** 사용자가 로그인된 상태라면 **THEN** 네비게이션에 사용자 정보를 표시해야 한다.

- REQ-AUTH-007.1: 로그인 상태에서 `useAuth()` 훅을 통해 사용자 이름과 이메일을 표시한다
- REQ-AUTH-007.2: 비로그인 상태에서 "로그인" 링크를 표시한다
- REQ-AUTH-007.3: 관리자 역할인 경우 `useAuth()`의 `isAdmin` 상태로 "관리자" 배지를 표시한다

### REQ-AUTH-009: 비밀번호 변경 기능

**[Event-Driven]** **WHEN** 이메일/비밀번호 인증 사용자가 `/dashboard/settings` 페이지에 접근하면 **THEN** 시스템은 비밀번호 변경 폼을 표시해야 한다.

- REQ-AUTH-009.1: 현재 비밀번호 확인 후 새 비밀번호를 설정할 수 있다 (`supabase.auth.signInWithPassword()` + `supabase.auth.updateUser()`)
- REQ-AUTH-009.2: Google OAuth 사용자에게는 비밀번호 변경 불가 안내 메시지를 표시한다
- REQ-AUTH-009.3: `UserMenu`에 "설정" 링크(기어 아이콘)를 "내 요청"과 "로그아웃" 사이에 배치한다
- REQ-AUTH-009.4: 비밀번호 변경 성공 시 확인 메시지를 표시한다

### REQ-AUTH-008: 보안 요구사항

**[Unwanted]** 시스템은 다음 보안 위반이 발생**하지 않아야 한다**.

- REQ-AUTH-008.1: Supabase 쿠키 기반 세션을 사용하여 인증 상태를 관리한다 (XSS 방지)
- REQ-AUTH-008.2: Supabase Auth의 내장 CSRF 보호를 활용한다
- REQ-AUTH-008.3: `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 접근 가능해야 한다
- REQ-AUTH-008.4: `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 클라이언트에 노출 가능하다
- REQ-AUTH-008.5: 민감한 정보(비밀번호, 서비스 역할 키)는 클라이언트에 노출되지 않아야 한다

---

## Specifications (기술 명세)

### 아키텍처 개요

```
[Browser]
   |
   +--> middleware.ts (Supabase 세션 갱신 미들웨어)
   |        |
   |        +--> Supabase 쿠키 세션 갱신
   |        +--> 보호된 라우트 접근 시 세션 검증
   |
   +--> /login (로그인 페이지)
   |        |
   |        +--> 이메일/비밀번호 폼
   |        +--> Google OAuth 버튼
   |
   +--> /signup (회원가입 페이지)
   |        |
   |        +--> 이메일/비밀번호 등록 폼
   |
   +--> /confirm (이메일 확인 완료 페이지)
   |
   +--> /callback (OAuth 콜백 핸들러)
   |        |
   |        +--> exchangeCodeForSession
   |
   +--> /api/auth/me (사용자 정보 + isAdmin 확인)
   |        |
   |        +--> getServerUser() + isAdmin() 확인
   |
   +--> AuthProvider (클라이언트 인증 컨텍스트)
   |        |
   |        +--> onAuthStateChange 리스너
   |        +--> useAuth() 훅 (user, session, isLoading, isAdmin, signOut)
   |
   +--> Protected Pages (/create, /admin)
   |        |
   |        +--> useAuth() 훅으로 클라이언트 인증 상태 확인
   |
   +--> Protected API Routes
            |
            +--> requireAuth() / requireAdmin() 서버 사이드 인증 검증
```

### 파일 목록

| 파일 경로 | 설명 |
|-----------|------|
| `src/lib/supabase-auth.ts` | 브라우저 Supabase 클라이언트 (createBrowserClient, anon key) |
| `src/lib/auth-utils.ts` | 서버 인증 유틸리티 (createServerSupabaseClient, getServerUser, requireAuth, requireAdmin, isAdmin, AuthError) |
| `src/middleware.ts` | Supabase 세션 갱신 미들웨어 (Cloudflare Edge Runtime 호환) |
| `src/app/callback/route.ts` | OAuth 콜백 핸들러 (exchangeCodeForSession) |
| `src/app/api/auth/me/route.ts` | 사용자 정보 + isAdmin 상태 API |
| `src/app/login/page.tsx` | 로그인 페이지 (이메일/비밀번호 폼 + Google OAuth 버튼) |
| `src/app/signup/page.tsx` | 회원가입 페이지 (이메일/비밀번호 등록) |
| `src/app/confirm/page.tsx` | 이메일 확인 완료 페이지 |
| `src/components/auth/AuthProvider.tsx` | Supabase onAuthStateChange 컨텍스트 (useAuth 훅 제공) |
| `src/components/auth/LoginButton.tsx` | useAuth() 훅 기반 로그인 버튼 |
| `src/components/auth/UserMenu.tsx` | useAuth() + isAdmin 기반 사용자 메뉴 (내 요청, 설정, 로그아웃) |
| `src/app/dashboard/settings/page.tsx` | 사용자 설정 페이지 (비밀번호 변경) |
| `.env.local` | 환경 변수 (Supabase 키, ADMIN_EMAILS) |
| `.env.example` | 환경 변수 템플릿 |
| `.dev.vars` | Cloudflare Pages 로컬 개발 환경 변수 |

### 수정 파일 목록

| 파일 경로 | 수정 내용 |
|-----------|----------|
| `src/app/layout.tsx` | AuthProvider로 래핑 |
| `src/app/admin/layout.tsx` | useAuth() 기반 관리자 인증 체크 |
| `src/app/page.tsx` | useAuth() 기반 로그인 상태에 따른 CTA 버튼 변경 |
| `src/app/create/page.tsx` | useAuth() 기반 사용자 정보 표시 |
| `src/app/api/requests/route.ts` | POST에 requireAuth, GET에 requireAdmin 적용 |
| `src/app/api/requests/[id]/route.ts` | GET에 requireAuth, PATCH에 requireAdmin 적용 |
| `package.json` | `@supabase/ssr`, `@supabase/supabase-js` 의존성 추가 |

### Supabase Auth 구조

```
// Browser client (src/lib/supabase-auth.ts)
createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Server client (src/lib/auth-utils.ts)
createServerSupabaseClient() // cookies() 기반 서버 Supabase 클라이언트
getServerUser()              // 현재 서버 사이드 사용자 조회
requireAuth()                // 인증 필수 (미인증 시 AuthError 401)
requireAdmin()               // 관리자 필수 (비관리자 시 AuthError 403)
isAdmin(email)               // ADMIN_EMAILS 환경 변수 체크

// AuthProvider (src/components/auth/AuthProvider.tsx)
useAuth() -> { user, session, isLoading, isAdmin, signOut }
```

### 환경 변수 구조

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|----------|---------------|
| REQ-AUTH-001 | `src/lib/supabase-auth.ts`, `src/lib/auth-utils.ts` | 이메일/비밀번호 및 Google OAuth 로그인 플로우 검증 |
| REQ-AUTH-002 | `src/app/api/auth/me/route.ts`, `src/lib/auth-utils.ts` (isAdmin) | 역할 확인 검증 |
| REQ-AUTH-003 | `src/middleware.ts` | 라우트 보호 리다이렉트 검증 |
| REQ-AUTH-004 | `src/app/api/*/route.ts`, `src/lib/auth-utils.ts` (requireAuth, requireAdmin) | API 인증/인가 검증 |
| REQ-AUTH-005 | `src/app/login/page.tsx` | 로그인 페이지 UI/UX 검증 |
| REQ-AUTH-006 | `src/components/auth/UserMenu.tsx`, `src/components/auth/AuthProvider.tsx` | 로그아웃 플로우 검증 |
| REQ-AUTH-007 | `src/components/auth/UserMenu.tsx`, `src/components/auth/AuthProvider.tsx` | 사용자 상태 표시 검증 |
| REQ-AUTH-008 | `src/lib/auth-utils.ts`, `src/middleware.ts` | 보안 요구사항 검증 |
