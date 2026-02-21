# SPEC-AUTH-001: 구현 계획

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | OAuth Authentication & Role-Based Access Control |
| 관련 SPEC | SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## Milestone 1: 인증 인프라 구축 (Primary Goal)

### 목표

NextAuth.js (Auth.js v5)를 설치하고 OAuth 인증 기반을 구축한다.

### 작업 목록

#### 1.1 패키지 설치 및 환경 변수 설정

- `next-auth@5.x` 패키지 설치
- `.env.local` 파일 생성 (OAuth 키, AUTH_SECRET)
- `.env.example` 파일 생성 (템플릿)
- `.gitignore`에 `.env.local` 확인

#### 1.2 NextAuth.js 설정 파일 생성

- `src/auth.ts` 생성
  - Google OAuth 제공자 설정
  - GitHub OAuth 제공자 설정
  - JWT 세션 전략 설정
  - 커스텀 로그인 페이지 경로 설정 (`/login`)
  - JWT callback: `ADMIN_EMAILS` 기반 역할 할당
  - Session callback: JWT의 role을 세션에 노출

#### 1.3 Auth API 라우트 생성

- `src/app/api/auth/[...nextauth]/route.ts` 생성
  - GET, POST 핸들러를 `auth.ts`의 handlers에서 내보내기

#### 1.4 타입 확장

- `src/types/next-auth.d.ts` 생성
  - `Session.user`에 `role` 필드 추가
  - `JWT`에 `role` 필드 추가

### 기술적 접근 방법

```
Auth.js v5 설정 흐름:
1. NextAuth() 함수로 auth, handlers, signIn, signOut 생성
2. providers: [Google({ ... }), GitHub({ ... })]
3. session: { strategy: "jwt" }  // DB 불필요
4. callbacks.jwt: ADMIN_EMAILS 체크 -> role 할당
5. callbacks.session: token.role -> session.user.role 전달
```

### 산출물

- `src/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/types/next-auth.d.ts`
- `.env.local`, `.env.example`

---

## Milestone 2: 라우트 보호 미들웨어 (Primary Goal)

### 목표

Next.js 미들웨어를 통해 페이지와 API 라우트를 보호한다.

### 작업 목록

#### 2.1 미들웨어 생성

- `src/middleware.ts` 생성
  - `auth.ts`의 `auth` 함수를 미들웨어로 활용
  - 보호 라우트 매칭 패턴 정의
  - 인증되지 않은 접근 시 `/login?callbackUrl=...`로 리다이렉트
  - 관리자 전용 라우트에 일반 사용자 접근 시 `/`로 리다이렉트

#### 2.2 라우트 보호 규칙 구현

- Public 라우트: `/`, `/login`, `/api/auth/*`
- Authenticated 라우트: `/create`, `/create/edit`
- Admin 라우트: `/admin`, `/admin/*`

#### 2.3 API 라우트 인증 체크 추가

- `src/app/api/requests/route.ts` 수정
  - POST: `auth()` 세션 검증 추가
  - GET: `auth()` + admin 역할 검증 추가
- `src/app/api/requests/[id]/route.ts` 수정
  - GET: `auth()` 세션 검증 추가
  - PATCH: `auth()` + admin 역할 검증 추가
- `src/app/api/requests/[id]/avatar/route.ts` 수정
  - GET: `auth()` 세션 검증 추가
- `src/app/api/requests/[id]/illustration/route.ts` 수정
  - GET: `auth()` 세션 검증 추가

### 기술적 접근 방법

```
미들웨어 전략:
1. matcher 설정으로 보호 라우트 패턴 정의
2. auth() 함수로 세션 토큰 검증
3. 토큰 없음 -> /login 리다이렉트 (callbackUrl 포함)
4. 토큰 있으나 admin 아님 + /admin 접근 -> / 리다이렉트
5. API 라우트는 각 핸들러 내에서 auth() 호출
```

### 산출물

- `src/middleware.ts`
- 수정된 API 라우트 핸들러 4개

---

## Milestone 3: 로그인 페이지 및 UI 컴포넌트 (Secondary Goal)

### 목표

로그인 페이지를 생성하고 인증 관련 UI 컴포넌트를 구현한다.

### 작업 목록

#### 3.1 로그인 페이지 생성

- `src/app/login/page.tsx` 생성
  - Google 로그인 버튼 (아이콘 + 텍스트)
  - GitHub 로그인 버튼 (아이콘 + 텍스트)
  - `callbackUrl` 쿼리 파라미터 처리
  - 오류 메시지 표시 (인증 실패 시)
  - 이미 로그인된 사용자 리다이렉트
  - Tailwind CSS 기반 반응형 디자인

#### 3.2 인증 컴포넌트 생성

- `src/components/auth/AuthProvider.tsx` 생성
  - `SessionProvider` 래퍼 (클라이언트 컴포넌트)
- `src/components/auth/LoginButton.tsx` 생성
  - 로그인/로그아웃 상태별 버튼
- `src/components/auth/UserMenu.tsx` 생성
  - 사용자 이름, 아바타 표시
  - 관리자 배지 표시
  - 로그아웃 버튼

#### 3.3 레이아웃 수정

- `src/app/layout.tsx` 수정
  - `AuthProvider`로 children 래핑
- `src/app/admin/layout.tsx` 수정
  - 헤더에 `UserMenu` 추가
  - 로그아웃 버튼 추가

### 기술적 접근 방법

```
컴포넌트 구조:
layout.tsx
  └── AuthProvider (SessionProvider)
        ├── /login -> LoginPage (signIn 호출)
        ├── /create -> UserMenu + 기존 컨텐츠
        └── /admin -> AdminLayout + UserMenu + 기존 컨텐츠
```

### 산출물

- `src/app/login/page.tsx`
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/LoginButton.tsx`
- `src/components/auth/UserMenu.tsx`
- 수정된 `src/app/layout.tsx`
- 수정된 `src/app/admin/layout.tsx`

---

## Milestone 4: 기존 페이지 통합 (Secondary Goal)

### 목표

기존 페이지에 인증 상태를 반영하고 사용자 경험을 개선한다.

### 작업 목록

#### 4.1 랜딩 페이지 수정

- `src/app/page.tsx` 수정
  - 비로그인 상태: "로그인하여 명함 만들기" CTA 버튼
  - 로그인 상태: "명함 만들기" CTA 버튼 (직접 `/create`로 이동)
  - 상단에 로그인 상태 표시

#### 4.2 명함 생성 페이지 수정

- `src/app/create/page.tsx` 수정
  - 상단에 사용자 정보 표시
  - 명함 요청 시 사용자 이메일 자동 첨부

### 산출물

- 수정된 `src/app/page.tsx`
- 수정된 `src/app/create/page.tsx`

---

## Milestone 5: 환경 변수 템플릿 및 문서화 (Final Goal)

### 목표

환경 변수 설정 가이드와 OAuth 앱 등록 절차를 문서화한다.

### 작업 목록

#### 5.1 환경 변수 템플릿

- `.env.example` 생성
  - 모든 필수 환경 변수와 설명 주석 포함
  - AUTH_SECRET 생성 방법 안내

#### 5.2 보안 검증

- `.gitignore`에 `.env.local` 포함 확인
- 환경 변수가 클라이언트 번들에 포함되지 않는지 검증
- HTTP-only 쿠키 설정 확인

### 산출물

- `.env.example`
- `.gitignore` 업데이트 (필요 시)

---

## 아키텍처 설계 방향

### 인증 흐름도

```
사용자 접근
    |
    v
[Next.js Middleware]
    |
    +--> Public Route? ---------> [Page Rendered]
    |
    +--> Has JWT Token? --No---> [Redirect /login?callbackUrl=...]
    |
    +--> Yes
    |
    +--> Admin Route?
    |       |
    |       +--> role === "admin"? --No---> [Redirect /]
    |       |
    |       +--> Yes --> [Admin Page Rendered]
    |
    +--> [Protected Page Rendered]
```

### 디렉토리 구조 (변경 후)

```
src/
├── auth.ts                          # NEW: NextAuth.js 설정
├── middleware.ts                     # NEW: 라우트 보호
├── app/
│   ├── layout.tsx                   # MODIFIED: AuthProvider 래핑
│   ├── page.tsx                     # MODIFIED: 인증 상태 반영
│   ├── login/
│   │   └── page.tsx                 # NEW: 로그인 페이지
│   ├── create/
│   │   ├── page.tsx                 # MODIFIED: 사용자 정보 표시
│   │   └── edit/page.tsx            # (변경 없음, 미들웨어로 보호)
│   ├── admin/
│   │   ├── layout.tsx               # MODIFIED: UserMenu 추가
│   │   ├── page.tsx                 # (변경 없음, 미들웨어로 보호)
│   │   └── [id]/page.tsx            # (변경 없음, 미들웨어로 보호)
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts         # NEW: Auth.js API 핸들러
│       └── requests/
│           ├── route.ts             # MODIFIED: 인증 체크 추가
│           └── [id]/
│               ├── route.ts         # MODIFIED: 인증/인가 체크 추가
│               ├── avatar/route.ts  # MODIFIED: 인증 체크 추가
│               └── illustration/route.ts  # MODIFIED: 인증 체크 추가
├── components/
│   └── auth/
│       ├── AuthProvider.tsx         # NEW: SessionProvider 래퍼
│       ├── LoginButton.tsx          # NEW: 로그인/로그아웃 버튼
│       └── UserMenu.tsx             # NEW: 사용자 메뉴
└── types/
    ├── card.ts                      # (변경 없음)
    └── next-auth.d.ts               # NEW: NextAuth 타입 확장
```

---

## 위험 요소 및 대응 방안

| 위험 요소 | 가능성 | 영향도 | 대응 방안 |
|-----------|--------|--------|----------|
| Auth.js v5와 Next.js 16 호환성 문제 | Low | High | 공식 문서 확인 및 최신 버전 사용 |
| OAuth 제공자 설정 오류 | Medium | Medium | `.env.example` 템플릿 및 설정 가이드 제공 |
| JWT 토큰 크기 초과 | Low | Low | 최소 정보만 JWT에 포함 (name, email, role) |
| 미들웨어 성능 영향 | Low | Medium | matcher 패턴으로 불필요한 경로 제외 |

---

## 기술적 의사결정

### 결정 1: JWT vs Database Session

- **선택**: JWT 전략
- **이유**: 데이터베이스 없는 프로젝트 구조 유지, 파일 시스템 기반 저장소와의 일관성
- **트레이드오프**: 서버 사이드 세션 무효화 불가 (JWT 만료까지 유효)

### 결정 2: 미들웨어 vs 페이지별 인증 체크

- **선택**: Next.js 미들웨어 (중앙 집중식)
- **이유**: 단일 지점에서 모든 라우트 보호, 코드 중복 최소화
- **트레이드오프**: 미들웨어에서 세밀한 권한 제어 제한 (API 라우트는 별도 체크)

### 결정 3: 환경 변수 기반 관리자 지정

- **선택**: `ADMIN_EMAILS` 환경 변수
- **이유**: 소규모 관리자 팀, DB 없는 환경에서 가장 단순한 솔루션
- **트레이드오프**: 관리자 변경 시 환경 변수 업데이트 및 재배포 필요
