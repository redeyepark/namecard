# SPEC-AUTH-001: 수락 기준

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | Supabase Authentication & Role-Based Access Control |
| 상태 | Completed |
| 관련 SPEC | SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## 테스트 시나리오

### TS-001: Google OAuth 로그인

**Given** 사용자가 `/login` 페이지에 접근하고
**When** Google 로그인 버튼을 클릭하면
**Then** Supabase Auth를 통해 Google OAuth 인증 페이지로 리다이렉트된다

**Given** Google 인증이 성공하고
**When** `/callback`에서 `exchangeCodeForSession`이 처리되면
**Then** Supabase 쿠키 세션이 생성된다
**And** 사용자는 `callbackUrl` 또는 기본 페이지(`/create`)로 리다이렉트된다

### TS-002: 이메일/비밀번호 회원가입 및 로그인

**Given** 사용자가 `/signup` 페이지에 접근하고
**When** 이메일과 비밀번호를 입력하여 회원가입하면
**Then** Supabase Auth에 계정이 생성된다
**And** 이메일 확인 메일이 발송된다
**And** `/confirm` 페이지로 안내된다

**Given** 이메일 확인이 완료된 사용자가
**When** `/login` 페이지에서 이메일과 비밀번호를 입력하면
**Then** Supabase 쿠키 세션이 생성된다
**And** 사용자는 `callbackUrl` 또는 기본 페이지(`/create`)로 리다이렉트된다

### TS-003: 관리자 역할 확인

**Given** `ADMIN_EMAILS` 환경 변수가 `admin@example.com,admin2@example.com`으로 설정되어 있고
**When** `admin@example.com` 이메일의 사용자가 로그인 후 `/api/auth/me`를 호출하면
**Then** 응답에 `isAdmin: true`가 포함된다
**And** `AuthProvider`의 `useAuth()` 훅에서 `isAdmin`이 `true`가 된다

### TS-004: 일반 사용자 역할 확인

**Given** `ADMIN_EMAILS` 환경 변수가 `admin@example.com`으로 설정되어 있고
**When** `user@example.com` 이메일의 사용자가 로그인 후 `/api/auth/me`를 호출하면
**Then** 응답에 `isAdmin: false`가 포함된다
**And** `AuthProvider`의 `useAuth()` 훅에서 `isAdmin`이 `false`가 된다

### TS-005: 비인증 사용자 - 보호 페이지 접근 차단

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/create` 페이지에 접근하면
**Then** `/login?callbackUrl=%2Fcreate`로 리다이렉트된다

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/create/edit` 페이지에 접근하면
**Then** `/login?callbackUrl=%2Fcreate%2Fedit`로 리다이렉트된다

### TS-006: 비인증 사용자 - 관리자 페이지 접근 차단

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/admin` 페이지에 접근하면
**Then** `/login?callbackUrl=%2Fadmin`으로 리다이렉트된다

### TS-007: 일반 사용자 - 관리자 페이지 접근 차단

**Given** 일반 사용자(`isAdmin: false`)가 로그인한 상태에서
**When** `/admin` 페이지에 접근하면
**Then** `/`로 리다이렉트된다

**Given** 일반 사용자(`isAdmin: false`)가 로그인한 상태에서
**When** `/admin/some-id` 페이지에 접근하면
**Then** `/`로 리다이렉트된다

### TS-008: 관리자 - 관리자 페이지 정상 접근

**Given** 관리자(`isAdmin: true`)가 로그인한 상태에서
**When** `/admin` 페이지에 접근하면
**Then** 관리자 대시보드가 정상적으로 렌더링된다

### TS-009: 공개 페이지 접근

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/` (랜딩 페이지)에 접근하면
**Then** 페이지가 정상적으로 렌더링된다
**And** 리다이렉트가 발생하지 않는다

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/signup` 페이지에 접근하면
**Then** 회원가입 페이지가 정상적으로 렌더링된다

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/confirm` 페이지에 접근하면
**Then** 이메일 확인 페이지가 정상적으로 렌더링된다

### TS-010: API - 인증되지 않은 요청 차단

**Given** Supabase 세션이 없는 상태에서
**When** `POST /api/requests`로 요청하면
**Then** `401 Unauthorized` 응답을 반환한다

**Given** Supabase 세션이 없는 상태에서
**When** `GET /api/requests` (목록)로 요청하면
**Then** `401 Unauthorized` 응답을 반환한다

### TS-011: API - 일반 사용자 관리자 API 차단

**Given** 일반 사용자(`isAdmin: false`)의 Supabase 세션으로
**When** `GET /api/requests` (목록)로 요청하면
**Then** `403 Forbidden` 응답을 반환한다

**Given** 일반 사용자(`isAdmin: false`)의 Supabase 세션으로
**When** `PATCH /api/requests/[id]`로 요청하면
**Then** `403 Forbidden` 응답을 반환한다

### TS-012: API - 인증된 사용자 정상 접근

**Given** Supabase 세션이 유효한 사용자가 (역할 무관)
**When** `POST /api/requests`로 유효한 데이터를 전송하면
**Then** `201 Created` 응답과 함께 요청이 생성된다

**Given** Supabase 세션이 유효한 사용자가
**When** `GET /api/requests/[id]`로 요청하면
**Then** `200 OK` 응답과 함께 요청 상세 정보를 반환한다

### TS-013: API - 관리자 정상 접근

**Given** 관리자(`isAdmin: true`)의 Supabase 세션으로
**When** `GET /api/requests`로 요청하면
**Then** `200 OK` 응답과 함께 전체 요청 목록을 반환한다

**Given** 관리자(`isAdmin: true`)의 Supabase 세션으로
**When** `PATCH /api/requests/[id]`로 유효한 데이터를 전송하면
**Then** `200 OK` 응답과 함께 요청이 업데이트된다

### TS-014: 로그인 페이지 UI

**Given** 사용자가 `/login` 페이지에 접근하면
**Then** 이메일/비밀번호 입력 폼이 표시된다
**And** Google OAuth 로그인 버튼이 표시된다
**And** 페이지가 모바일/데스크톱에서 반응형으로 렌더링된다

### TS-015: 이미 로그인된 사용자 로그인 페이지 리다이렉트

**Given** 이미 로그인된 사용자가
**When** `/login` 페이지에 접근하면
**Then** `/create`로 리다이렉트된다

### TS-016: 로그아웃

**Given** 로그인된 사용자가
**When** 로그아웃 버튼을 클릭하면
**Then** `useAuth()`의 `signOut()`이 호출되어 `supabase.auth.signOut()`이 실행된다
**And** Supabase 세션 쿠키가 삭제된다
**And** `/`로 리다이렉트된다

### TS-017: 사용자 상태 표시

**Given** 로그인된 사용자가 보호된 페이지에 접근하면
**Then** `useAuth()` 훅을 통해 사용자 이름이 표시된다
**And** 로그아웃 버튼이 표시된다

**Given** 관리자(`isAdmin: true`) 사용자가 관리자 페이지에 접근하면
**Then** 관리자 배지가 추가로 표시된다

### TS-018: callbackUrl 리다이렉트

**Given** 비인증 사용자가 `/create/edit`에 접근하여 로그인 페이지로 리다이렉트되었을 때
**When** 로그인에 성공하면
**Then** 원래 접근하려던 `/create/edit`로 리다이렉트된다

### TS-019: 회원가입 페이지 UI

**Given** 사용자가 `/signup` 페이지에 접근하면
**Then** 이메일/비밀번호 입력 폼이 표시된다
**And** 회원가입 버튼이 표시된다
**And** 이미 계정이 있는 경우 로그인 페이지 링크가 표시된다

### TS-020: /api/auth/me 엔드포인트

**Given** 인증된 사용자가
**When** `GET /api/auth/me`로 요청하면
**Then** 사용자 정보(email 등)와 `isAdmin` 상태를 포함한 응답을 반환한다

**Given** 인증되지 않은 사용자가
**When** `GET /api/auth/me`로 요청하면
**Then** `401 Unauthorized` 응답을 반환한다

---

## Quality Gate 기준

### 기능 완성도

- [x] 이메일/비밀번호 회원가입 및 로그인 정상 동작
- [x] Google OAuth 로그인/로그아웃 정상 동작
- [x] 환경 변수 기반 관리자 역할 확인 (`/api/auth/me` + `isAdmin`)
- [x] proxy.ts를 통한 세션 갱신 및 라우트 보호 (Public / Authenticated / Admin)
- [x] API 라우트 인증 및 인가 적용 (requireAuth / requireAdmin)
- [x] 로그인 페이지 반응형 UI (이메일/비밀번호 폼 + Google OAuth 버튼)
- [x] 회원가입 페이지 및 이메일 확인 플로우
- [x] 사용자 상태 표시 (useAuth 훅 기반)
- [x] callbackUrl 기반 리다이렉트

### 보안 체크리스트

- [x] Supabase 쿠키 기반 세션으로 인증 상태 관리
- [x] Supabase Auth 내장 CSRF 보호 활용
- [x] `SUPABASE_SERVICE_ROLE_KEY`가 서버 사이드에서만 접근됨
- [x] `NEXT_PUBLIC_` 접두사 변수만 클라이언트에 노출
- [x] `.env.local`, `.dev.vars`가 `.gitignore`에 포함됨
- [x] 인증되지 않은 API 요청에 대해 401 반환 (requireAuth)
- [x] 권한 부족 API 요청에 대해 403 반환 (requireAdmin)

### 코드 품질

- [x] TypeScript 타입 에러 없음
- [x] ESLint 경고 없음
- [x] Next.js 빌드 성공
- [x] 신규 파일에 적절한 타입 정의
- [x] 컴포넌트에 적절한 ARIA 속성 적용

### 호환성

- [x] 기존 명함 편집 기능 정상 동작
- [x] 기존 관리자 기능 정상 동작
- [x] 기존 API 엔드포인트 응답 형식 유지
- [x] 모바일 및 데스크톱 반응형 레이아웃 유지

---

## Definition of Done

1. [x] 모든 테스트 시나리오 (TS-001 ~ TS-020)가 수동 또는 자동 테스트를 통해 검증됨
2. [x] 모든 Quality Gate 체크리스트 항목이 통과함
3. [x] `next build` 성공
4. [x] `.env.example` 파일이 모든 필수 환경 변수를 포함함
5. [x] 기존 기능에 대한 회귀 테스트 통과
