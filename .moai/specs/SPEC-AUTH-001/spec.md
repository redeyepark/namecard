# SPEC-AUTH-001: OAuth 인증 및 역할 기반 접근 제어

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | OAuth Authentication & Role-Based Access Control |
| 생성일 | 2026-02-21 |
| 상태 | Planned |
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
| 인증 | NextAuth.js (Auth.js v5) | next-auth@5.x |
| 세션 전략 | JWT | - |
| 데이터 저장 | File System (JSON) | - |
| 배포 | Vercel | - |

### 현재 시스템 상태

- 인증 시스템 없음: 모든 라우트가 보호되지 않은 상태
- 관리자 대시보드(`/admin`)가 공개 접근 가능
- API 라우트에 인증/인가 미적용
- 데이터베이스 없음: 파일 시스템 기반 데이터 저장 (JSON, `data/requests/`)
- 사용자 정보 저장소 없음

### 외부 의존성

- Google OAuth 2.0 API (Google Cloud Console)
- GitHub OAuth App (GitHub Developer Settings)
- 환경 변수: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_EMAILS`

---

## Assumptions (가정)

### 기술적 가정

- **A1**: NextAuth.js v5 (Auth.js)는 Next.js 16 App Router와 호환된다
- **A2**: JWT 전략은 데이터베이스 없이 세션을 관리할 수 있다
- **A3**: OAuth 제공자(Google, GitHub)의 API는 안정적으로 사용 가능하다
- **A4**: Vercel 배포 환경에서 환경 변수를 안전하게 관리할 수 있다

### 비즈니스 가정

- **A5**: 관리자 수는 소규모이며 환경 변수로 관리 가능하다 (ADMIN_EMAILS)
- **A6**: 일반 사용자는 명함 생성 기능만 필요하며, 관리 기능은 불필요하다
- **A7**: 랜딩 페이지(`/`)는 비로그인 상태에서도 접근 가능해야 한다
- **A8**: 사용자 프로필 데이터는 최소한으로 유지한다 (이름, 이메일, 역할만 JWT에 저장)

### 위험 요소

| 가정 | 신뢰도 | 오류 시 영향 | 검증 방법 |
|------|--------|-------------|----------|
| A1 | High | 인증 라이브러리 교체 필요 | Auth.js v5 공식 문서 확인 |
| A2 | High | DB 어댑터 추가 필요 | JWT 전략 문서 검증 |
| A5 | Medium | 관리자 관리 UI 추가 필요 | 운영 후 관리자 수 모니터링 |

---

## Requirements (요구사항)

### REQ-AUTH-001: OAuth 인증 설정

**[Ubiquitous]** 시스템은 **항상** NextAuth.js (Auth.js v5)를 통한 OAuth 2.0 인증을 지원해야 한다.

- REQ-AUTH-001.1: Google OAuth 2.0 제공자를 지원해야 한다
- REQ-AUTH-001.2: GitHub OAuth 제공자를 지원해야 한다
- REQ-AUTH-001.3: JWT 전략을 사용하여 세션을 관리해야 한다 (데이터베이스 어댑터 없음)
- REQ-AUTH-001.4: JWT 클레임에 사용자 정보를 포함해야 한다 (name, email, role)

### REQ-AUTH-002: 사용자 역할 관리

**[Event-Driven]** **WHEN** 사용자가 OAuth로 로그인하면 **THEN** 시스템은 `ADMIN_EMAILS` 환경 변수를 확인하여 역할을 할당해야 한다.

- REQ-AUTH-002.1: `ADMIN_EMAILS` 환경 변수에 포함된 이메일은 `admin` 역할을 부여한다
- REQ-AUTH-002.2: `ADMIN_EMAILS`에 포함되지 않은 이메일은 `user` 역할을 부여한다
- REQ-AUTH-002.3: `ADMIN_EMAILS`는 쉼표로 구분된 이메일 목록이다 (예: `admin1@example.com,admin2@example.com`)
- REQ-AUTH-002.4: 역할 정보는 JWT 토큰의 커스텀 클레임에 저장한다

### REQ-AUTH-003: 페이지 접근 제어 (미들웨어)

**[State-Driven]** **IF** 사용자가 인증되지 않은 상태라면 **THEN** 보호된 라우트 접근 시 로그인 페이지로 리다이렉트해야 한다.

| 라우트 | 접근 수준 | 설명 |
|--------|----------|------|
| `/` | Public | 로그인 불필요 |
| `/login` | Public | 로그인 페이지 |
| `/create` | Authenticated | 로그인 필요 (모든 인증 사용자) |
| `/create/edit` | Authenticated | 로그인 필요 (모든 인증 사용자) |
| `/admin` | Admin Only | 관리자 역할 필요 |
| `/admin/[id]` | Admin Only | 관리자 역할 필요 |

- REQ-AUTH-003.1: Next.js 미들웨어(`middleware.ts`)를 통해 라우트 보호를 구현한다
- REQ-AUTH-003.2: 인증되지 않은 사용자가 보호된 라우트에 접근하면 `/login`으로 리다이렉트한다
- REQ-AUTH-003.3: 리다이렉트 시 원래 요청 URL을 `callbackUrl` 파라미터로 전달한다
- REQ-AUTH-003.4: 인증된 일반 사용자가 `/admin` 라우트에 접근하면 `/`로 리다이렉트한다

### REQ-AUTH-004: API 라우트 접근 제어

**[State-Driven]** **IF** API 요청에 유효한 인증 토큰이 없다면 **THEN** 시스템은 401 Unauthorized 응답을 반환해야 한다.

| API 라우트 | 메서드 | 접근 수준 |
|-----------|--------|----------|
| `POST /api/requests` | POST | Authenticated |
| `GET /api/requests` | GET (목록) | Admin Only |
| `PATCH /api/requests/[id]` | PATCH | Admin Only |
| `GET /api/requests/[id]` | GET (상세) | Authenticated |
| `GET /api/requests/[id]/avatar` | GET | Authenticated |
| `GET /api/requests/[id]/illustration` | GET | Authenticated |

- REQ-AUTH-004.1: 인증되지 않은 API 요청에 대해 `401 Unauthorized`를 반환한다
- REQ-AUTH-004.2: 권한 부족 API 요청에 대해 `403 Forbidden`을 반환한다
- REQ-AUTH-004.3: 각 API 핸들러에서 `auth()` 함수를 통해 세션을 검증한다

### REQ-AUTH-005: 로그인 페이지

**[Event-Driven]** **WHEN** 사용자가 `/login` 페이지에 접근하면 **THEN** Google과 GitHub OAuth 로그인 버튼을 표시해야 한다.

- REQ-AUTH-005.1: Google 로그인 버튼을 제공한다
- REQ-AUTH-005.2: GitHub 로그인 버튼을 제공한다
- REQ-AUTH-005.3: 로그인 성공 시 `callbackUrl`로 리다이렉트한다 (기본값: `/create`)
- REQ-AUTH-005.4: 이미 로그인된 사용자가 `/login`에 접근하면 `/create`로 리다이렉트한다
- REQ-AUTH-005.5: 로그인 실패 시 오류 메시지를 표시한다
- REQ-AUTH-005.6: Tailwind CSS를 사용하여 기존 디자인과 일관된 스타일을 적용한다

### REQ-AUTH-006: 로그아웃 기능

**[Event-Driven]** **WHEN** 사용자가 로그아웃 버튼을 클릭하면 **THEN** 세션을 종료하고 랜딩 페이지로 리다이렉트해야 한다.

- REQ-AUTH-006.1: 관리자 대시보드 헤더에 로그아웃 버튼을 추가한다
- REQ-AUTH-006.2: 명함 생성 페이지에 사용자 정보 및 로그아웃 버튼을 표시한다
- REQ-AUTH-006.3: 로그아웃 후 JWT 토큰을 무효화하고 `/`로 리다이렉트한다

### REQ-AUTH-007: 사용자 상태 표시

**[State-Driven]** **IF** 사용자가 로그인된 상태라면 **THEN** 네비게이션에 사용자 이름과 아바타를 표시해야 한다.

- REQ-AUTH-007.1: 로그인 상태에서 사용자 이름과 프로필 이미지를 표시한다
- REQ-AUTH-007.2: 비로그인 상태에서 "로그인" 링크를 표시한다
- REQ-AUTH-007.3: 관리자 역할인 경우 "관리자" 배지를 표시한다

### REQ-AUTH-008: 보안 요구사항

**[Unwanted]** 시스템은 다음 보안 위반이 발생**하지 않아야 한다**.

- REQ-AUTH-008.1: HTTP-only 쿠키를 사용하여 세션 토큰을 저장한다 (XSS 방지)
- REQ-AUTH-008.2: CSRF 보호를 활성화한다 (NextAuth.js 기본 제공)
- REQ-AUTH-008.3: JWT 시크릿(`AUTH_SECRET`)은 환경 변수로만 관리한다
- REQ-AUTH-008.4: OAuth 클라이언트 시크릿은 서버 사이드에서만 접근 가능해야 한다
- REQ-AUTH-008.5: 민감한 정보(비밀번호, 토큰)는 클라이언트에 노출되지 않아야 한다

---

## Specifications (기술 명세)

### 아키텍처 개요

```
[Browser]
   |
   +--> Next.js Middleware (route protection)
   |        |
   |        +--> Check JWT session
   |        +--> Redirect to /login if unauthenticated
   |        +--> Redirect to / if unauthorized (non-admin)
   |
   +--> /login (Login Page)
   |        |
   |        +--> Google OAuth 2.0
   |        +--> GitHub OAuth
   |
   +--> /api/auth/[...nextauth] (Auth.js API Routes)
   |        |
   |        +--> JWT callback (assign role from ADMIN_EMAILS)
   |        +--> Session callback (expose role to client)
   |
   +--> Protected Pages (/create, /admin)
   |        |
   |        +--> useSession() for client-side auth state
   |
   +--> Protected API Routes
            |
            +--> auth() for server-side session validation
```

### 신규 파일 목록

| 파일 경로 | 설명 |
|-----------|------|
| `src/auth.ts` | NextAuth.js 설정 (providers, callbacks, JWT strategy) |
| `src/middleware.ts` | Next.js 미들웨어 (라우트 보호, 역할 검증) |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js API 라우트 핸들러 |
| `src/app/login/page.tsx` | 로그인 페이지 (OAuth 버튼) |
| `src/components/auth/AuthProvider.tsx` | SessionProvider 래퍼 컴포넌트 |
| `src/components/auth/LoginButton.tsx` | 로그인/로그아웃 버튼 컴포넌트 |
| `src/components/auth/UserMenu.tsx` | 사용자 정보 표시 드롭다운 |
| `src/types/next-auth.d.ts` | NextAuth.js 타입 확장 (role 필드) |
| `.env.local` | 환경 변수 (OAuth 키, AUTH_SECRET, ADMIN_EMAILS) |
| `.env.example` | 환경 변수 템플릿 |

### 수정 파일 목록

| 파일 경로 | 수정 내용 |
|-----------|----------|
| `src/app/layout.tsx` | SessionProvider로 래핑 |
| `src/app/admin/layout.tsx` | 로그아웃 버튼 추가, 관리자 인증 체크 |
| `src/app/page.tsx` | 로그인 상태에 따른 CTA 버튼 변경 |
| `src/app/create/page.tsx` | 사용자 정보 표시 |
| `src/app/api/requests/route.ts` | POST에 인증 체크, GET에 관리자 체크 추가 |
| `src/app/api/requests/[id]/route.ts` | PATCH에 관리자 체크, GET에 인증 체크 추가 |
| `src/app/api/requests/[id]/avatar/route.ts` | 인증 체크 추가 |
| `src/app/api/requests/[id]/illustration/route.ts` | 인증 체크 추가 |
| `package.json` | `next-auth` 의존성 추가 |

### NextAuth.js 설정 구조 (`src/auth.ts`)

```typescript
// Key configuration structure
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      // Assign role based on ADMIN_EMAILS
    },
    session({ session, token }) {
      // Expose role in session
    },
    authorized({ auth, request }) {
      // Route-level authorization
    },
  },
});
```

### JWT 토큰 구조

```typescript
interface JWT {
  name: string;
  email: string;
  picture: string;
  role: "admin" | "user";
  sub: string;
}
```

### 환경 변수 구조

```env
# Auth.js
AUTH_SECRET=<generated-secret>

# Google OAuth
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>

# GitHub OAuth
AUTH_GITHUB_ID=<github-client-id>
AUTH_GITHUB_SECRET=<github-client-secret>

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일 | 테스트 시나리오 |
|------------|----------|---------------|
| REQ-AUTH-001 | `src/auth.ts` | OAuth 로그인 플로우 검증 |
| REQ-AUTH-002 | `src/auth.ts` (jwt callback) | 역할 할당 검증 |
| REQ-AUTH-003 | `src/middleware.ts` | 라우트 보호 리다이렉트 검증 |
| REQ-AUTH-004 | `src/app/api/*/route.ts` | API 인증/인가 검증 |
| REQ-AUTH-005 | `src/app/login/page.tsx` | 로그인 페이지 UI/UX 검증 |
| REQ-AUTH-006 | `src/components/auth/UserMenu.tsx` | 로그아웃 플로우 검증 |
| REQ-AUTH-007 | `src/components/auth/UserMenu.tsx` | 사용자 상태 표시 검증 |
| REQ-AUTH-008 | `src/auth.ts`, `src/middleware.ts` | 보안 요구사항 검증 |
