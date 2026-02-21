# SPEC-AUTH-001: 구현 계획

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | Supabase Authentication & Role-Based Access Control |
| 상태 | Completed |
| 관련 SPEC | SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## Milestone 1: Supabase 인증 인프라 구축 (Completed)

### 목표

Supabase Auth를 설치하고 인증 기반 인프라를 구축한다.

### 작업 목록

#### 1.1 패키지 설치 및 환경 변수 설정

- `@supabase/ssr@0.8.0` 패키지 설치
- `@supabase/supabase-js@2.97.0` 패키지 설치
- `.env.local` 파일 생성 (Supabase URL, Anon Key, Service Role Key, ADMIN_EMAILS)
- `.env.example` 파일 생성 (템플릿)
- `.dev.vars` 파일 생성 (Cloudflare Pages 로컬 개발 환경 변수)
- `.gitignore`에 `.env.local`, `.dev.vars` 확인

#### 1.2 Supabase 클라이언트 파일 생성

- `src/lib/supabase-auth.ts` 생성
  - `createBrowserClient`로 브라우저 Supabase 클라이언트 생성
  - `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 사용
- `src/lib/auth-utils.ts` 생성
  - `createServerSupabaseClient`: cookies() 기반 서버 Supabase 클라이언트
  - `getServerUser`: 현재 서버 사이드 사용자 조회
  - `requireAuth`: 인증 필수 래퍼 (미인증 시 AuthError 401)
  - `requireAdmin`: 관리자 필수 래퍼 (비관리자 시 AuthError 403)
  - `isAdmin`: `ADMIN_EMAILS` 환경 변수 기반 관리자 확인
  - `AuthError` 클래스: 인증/인가 에러 처리

### 기술적 접근 방법

```
Supabase Auth 설정 흐름:
1. createBrowserClient()로 브라우저 클라이언트 생성 (anon key 사용)
2. createServerSupabaseClient()로 서버 클라이언트 생성 (cookies 기반)
3. getServerUser()로 현재 사용자 조회
4. isAdmin(email)으로 ADMIN_EMAILS 환경 변수 체크
5. requireAuth() / requireAdmin()으로 API 라우트 보호
```

### 산출물

- `src/lib/supabase-auth.ts`
- `src/lib/auth-utils.ts`
- `.env.local`, `.env.example`, `.dev.vars`

---

## Milestone 2: 라우트 보호 및 API 인증 (Completed)

### 목표

proxy.ts를 통한 세션 갱신과 API 라우트 인증/인가를 구현한다.

### 작업 목록

#### 2.1 프록시 미들웨어 생성

- `src/proxy.ts` 생성 (Next.js 16에서 middleware.ts 대체)
  - Supabase 쿠키 세션 갱신 처리
  - 보호 라우트 접근 시 세션 검증
  - 인증되지 않은 접근 시 `/login?callbackUrl=...`로 리다이렉트
  - 관리자 전용 라우트에 일반 사용자 접근 시 `/`로 리다이렉트

#### 2.2 라우트 보호 규칙 구현

- Public 라우트: `/`, `/login`, `/signup`, `/confirm`, `/callback`
- Authenticated 라우트: `/create`, `/create/edit`
- Admin 라우트: `/admin`, `/admin/*`

#### 2.3 API 라우트 인증 체크 추가

- `src/app/api/requests/route.ts` 수정
  - POST: `requireAuth()` 세션 검증 추가
  - GET: `requireAdmin()` 관리자 검증 추가
- `src/app/api/requests/[id]/route.ts` 수정
  - GET: `requireAuth()` 세션 검증 추가
  - PATCH: `requireAdmin()` 관리자 검증 추가
- `src/app/api/auth/me/route.ts` 생성
  - GET: 현재 사용자 정보 + `isAdmin` 상태 반환

### 기술적 접근 방법

```
라우트 보호 전략:
1. proxy.ts에서 Supabase 세션 쿠키 갱신 (모든 요청에 대해)
2. 보호된 라우트 패턴 매칭으로 세션 확인
3. 세션 없음 -> /login 리다이렉트 (callbackUrl 포함)
4. 세션 있으나 admin 아님 + /admin 접근 -> / 리다이렉트
5. API 라우트는 각 핸들러 내에서 requireAuth() / requireAdmin() 호출
```

### 산출물

- `src/proxy.ts`
- `src/app/api/auth/me/route.ts`
- 수정된 API 라우트 핸들러 (`requests/route.ts`, `requests/[id]/route.ts`)

---

## Milestone 3: 로그인/회원가입 페이지 및 UI 컴포넌트 (Completed)

### 목표

로그인, 회원가입, 이메일 확인 페이지를 생성하고 인증 관련 UI 컴포넌트를 구현한다.

### 작업 목록

#### 3.1 로그인 페이지 생성

- `src/app/login/page.tsx` 생성
  - 이메일/비밀번호 입력 폼
  - Google OAuth 로그인 버튼
  - `callbackUrl` 쿼리 파라미터 처리
  - 오류 메시지 표시 (인증 실패 시)
  - 이미 로그인된 사용자 리다이렉트
  - Tailwind CSS 기반 반응형 디자인

#### 3.2 회원가입 페이지 생성

- `src/app/signup/page.tsx` 생성
  - 이메일/비밀번호 회원가입 폼
  - 가입 후 이메일 확인 안내

#### 3.3 이메일 확인 페이지 생성

- `src/app/confirm/page.tsx` 생성
  - 이메일 확인 성공 메시지 표시

#### 3.4 OAuth 콜백 핸들러 생성

- `src/app/callback/route.ts` 생성
  - `exchangeCodeForSession` 호출
  - 인증 완료 후 리다이렉트

#### 3.5 인증 컴포넌트 생성

- `src/components/auth/AuthProvider.tsx` 생성
  - Supabase `onAuthStateChange` 리스너
  - `useAuth()` 커스텀 훅 제공 (user, session, isLoading, isAdmin, signOut)
- `src/components/auth/LoginButton.tsx` 생성
  - `useAuth()` 훅 기반 로그인/로그아웃 상태별 버튼
- `src/components/auth/UserMenu.tsx` 생성
  - `useAuth()` 훅 기반 사용자 정보 및 isAdmin 표시
  - 로그아웃 버튼

#### 3.6 레이아웃 수정

- `src/app/layout.tsx` 수정
  - `AuthProvider`로 children 래핑

### 기술적 접근 방법

```
컴포넌트 구조:
layout.tsx
  └── AuthProvider (Supabase onAuthStateChange)
        ├── /login -> LoginPage (이메일/비밀번호 + Google OAuth)
        ├── /signup -> SignupPage (이메일/비밀번호 등록)
        ├── /confirm -> ConfirmPage (이메일 확인 완료)
        ├── /callback -> OAuth 콜백 핸들러
        ├── /create -> useAuth() + 기존 컨텐츠
        └── /admin -> useAuth() + isAdmin + 기존 컨텐츠
```

### 산출물

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/confirm/page.tsx`
- `src/app/callback/route.ts`
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/LoginButton.tsx`
- `src/components/auth/UserMenu.tsx`
- 수정된 `src/app/layout.tsx`

---

## Milestone 4: 기존 페이지 통합 (Completed)

### 목표

기존 페이지에 인증 상태를 반영하고 사용자 경험을 개선한다.

### 작업 목록

#### 4.1 랜딩 페이지 수정

- `src/app/page.tsx` 수정
  - `useAuth()` 훅으로 인증 상태 확인
  - 비로그인 상태: "로그인하여 명함 만들기" CTA 버튼
  - 로그인 상태: "명함 만들기" CTA 버튼 (직접 `/create`로 이동)

#### 4.2 명함 생성 페이지 수정

- `src/app/create/page.tsx` 수정
  - `useAuth()` 훅으로 사용자 정보 표시
  - 명함 요청 시 사용자 이메일 자동 첨부

#### 4.3 관리자 페이지 수정

- `src/app/admin/layout.tsx` 수정
  - `useAuth()` 훅으로 관리자 인증 확인
  - `UserMenu` 컴포넌트 추가

### 산출물

- 수정된 `src/app/page.tsx`
- 수정된 `src/app/create/page.tsx`
- 수정된 `src/app/admin/layout.tsx`

---

## Milestone 5: 환경 변수 및 보안 설정 (Completed)

### 목표

환경 변수 설정과 보안 검증을 완료한다.

### 작업 목록

#### 5.1 환경 변수 템플릿

- `.env.local` 생성
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
  - `ADMIN_EMAILS`: 관리자 이메일 목록
- `.env.example` 생성
  - 모든 필수 환경 변수와 설명 주석 포함
- `.dev.vars` 생성
  - Cloudflare Pages 로컬 개발용 환경 변수

#### 5.2 보안 검증

- `.gitignore`에 `.env.local`, `.dev.vars` 포함 확인
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에 노출되는지 확인
- `SUPABASE_SERVICE_ROLE_KEY`가 서버 사이드에서만 접근되는지 확인
- Supabase 쿠키 기반 세션 보안 확인

### 산출물

- `.env.local`
- `.env.example`
- `.dev.vars`
- `.gitignore` 업데이트

---

## 아키텍처 설계 방향

### 인증 흐름도

```
사용자 접근
    |
    v
[proxy.ts - Supabase 세션 갱신]
    |
    +--> Public Route? ---------> [Page Rendered]
    |    (/, /login, /signup,
    |     /confirm, /callback)
    |
    +--> Has Supabase Session? --No---> [Redirect /login?callbackUrl=...]
    |
    +--> Yes
    |
    +--> Admin Route?
    |       |
    |       +--> isAdmin? --No---> [Redirect /]
    |       |
    |       +--> Yes --> [Admin Page Rendered]
    |
    +--> [Protected Page Rendered]
```

### 디렉토리 구조 (구현 완료)

```
src/
├── proxy.ts                         # Supabase 세션 갱신 미들웨어
├── lib/
│   ├── supabase-auth.ts             # 브라우저 Supabase 클라이언트
│   └── auth-utils.ts                # 서버 인증 유틸리티
├── app/
│   ├── layout.tsx                   # MODIFIED: AuthProvider 래핑
│   ├── page.tsx                     # MODIFIED: useAuth() 인증 상태 반영
│   ├── login/
│   │   └── page.tsx                 # 로그인 페이지 (이메일/비밀번호 + Google OAuth)
│   ├── signup/
│   │   └── page.tsx                 # 회원가입 페이지
│   ├── confirm/
│   │   └── page.tsx                 # 이메일 확인 완료 페이지
│   ├── callback/
│   │   └── route.ts                 # OAuth 콜백 핸들러
│   ├── create/
│   │   ├── page.tsx                 # MODIFIED: useAuth() 사용자 정보 표시
│   │   └── edit/page.tsx            # (미들웨어로 보호)
│   ├── admin/
│   │   ├── layout.tsx               # MODIFIED: useAuth() + isAdmin 확인
│   │   ├── page.tsx                 # (미들웨어로 보호)
│   │   └── [id]/page.tsx            # (미들웨어로 보호)
│   └── api/
│       ├── auth/
│       │   └── me/
│       │       └── route.ts         # 사용자 정보 + isAdmin API
│       └── requests/
│           ├── route.ts             # MODIFIED: requireAuth / requireAdmin
│           └── [id]/
│               └── route.ts         # MODIFIED: requireAuth / requireAdmin
├── components/
│   └── auth/
│       ├── AuthProvider.tsx          # Supabase onAuthStateChange 컨텍스트
│       ├── LoginButton.tsx           # useAuth() 기반 로그인 버튼
│       └── UserMenu.tsx              # useAuth() + isAdmin 사용자 메뉴
```

---

## 위험 요소 및 대응 방안

| 위험 요소 | 가능성 | 영향도 | 대응 방안 |
|-----------|--------|--------|----------|
| @supabase/ssr과 Next.js 16 호환성 문제 | Low | High | 공식 문서 확인 및 최신 버전 사용 |
| Supabase Auth 쿠키 갱신 이슈 | Low | Medium | proxy.ts에서 세션 갱신 로직 구현 |
| Cloudflare Pages 환경 변수 관리 | Low | Medium | `.dev.vars` 및 Cloudflare 대시보드 설정 |
| Google OAuth 콜백 URL 설정 오류 | Medium | Medium | `.env.example` 템플릿 및 설정 가이드 제공 |

---

## 기술적 의사결정

### 결정 1: Supabase Auth vs NextAuth.js

- **선택**: Supabase Auth (@supabase/ssr)
- **이유**: 데이터베이스(Supabase PostgreSQL), 파일 저장소(Supabase Storage)와 통합된 단일 플랫폼, Cloudflare Pages 배포 호환성
- **트레이드오프**: Supabase 플랫폼에 대한 의존성 증가

### 결정 2: proxy.ts vs middleware.ts

- **선택**: `proxy.ts` (Next.js 16 방식)
- **이유**: Next.js 16에서 미들웨어 파일명이 `proxy.ts`로 변경됨
- **트레이드오프**: Next.js 15 이하 프로젝트와의 파일명 차이

### 결정 3: 이메일/비밀번호 + Google OAuth

- **선택**: 이메일/비밀번호 인증 + Google OAuth
- **이유**: GitHub OAuth 제거로 인증 방식 단순화, 이메일/비밀번호 추가로 범용성 확보
- **트레이드오프**: GitHub 사용자의 편의성 감소

### 결정 4: 환경 변수 기반 관리자 지정

- **선택**: `ADMIN_EMAILS` 환경 변수 + `/api/auth/me` 엔드포인트
- **이유**: 소규모 관리자 팀, 서버 사이드에서만 관리자 확인하여 보안 강화
- **트레이드오프**: 관리자 변경 시 환경 변수 업데이트 및 재배포 필요
