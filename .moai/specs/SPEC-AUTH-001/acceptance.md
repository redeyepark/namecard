# SPEC-AUTH-001: 수락 기준

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-AUTH-001 |
| 제목 | OAuth Authentication & Role-Based Access Control |
| 관련 SPEC | SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## 테스트 시나리오

### TS-001: Google OAuth 로그인

**Given** 사용자가 `/login` 페이지에 접근하고
**When** Google 로그인 버튼을 클릭하면
**Then** Google OAuth 인증 페이지로 리다이렉트된다

**Given** Google 인증이 성공하고
**When** OAuth 콜백이 처리되면
**Then** JWT 토큰이 생성되고 HTTP-only 쿠키에 저장된다
**And** 사용자는 `callbackUrl` 또는 기본 페이지(`/create`)로 리다이렉트된다

### TS-002: GitHub OAuth 로그인

**Given** 사용자가 `/login` 페이지에 접근하고
**When** GitHub 로그인 버튼을 클릭하면
**Then** GitHub OAuth 인증 페이지로 리다이렉트된다

**Given** GitHub 인증이 성공하고
**When** OAuth 콜백이 처리되면
**Then** JWT 토큰이 생성되고 HTTP-only 쿠키에 저장된다
**And** 사용자는 `callbackUrl` 또는 기본 페이지(`/create`)로 리다이렉트된다

### TS-003: 관리자 역할 자동 할당

**Given** `ADMIN_EMAILS` 환경 변수가 `admin@example.com,admin2@example.com`으로 설정되어 있고
**When** `admin@example.com` 이메일의 사용자가 로그인하면
**Then** JWT 토큰의 `role` 클레임이 `admin`으로 설정된다
**And** 세션 객체의 `user.role`이 `admin`이다

### TS-004: 일반 사용자 역할 할당

**Given** `ADMIN_EMAILS` 환경 변수가 `admin@example.com`으로 설정되어 있고
**When** `user@example.com` 이메일의 사용자가 로그인하면
**Then** JWT 토큰의 `role` 클레임이 `user`로 설정된다
**And** 세션 객체의 `user.role`이 `user`이다

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

**Given** `user` 역할의 사용자가 로그인한 상태에서
**When** `/admin` 페이지에 접근하면
**Then** `/`로 리다이렉트된다

**Given** `user` 역할의 사용자가 로그인한 상태에서
**When** `/admin/some-id` 페이지에 접근하면
**Then** `/`로 리다이렉트된다

### TS-008: 관리자 - 관리자 페이지 정상 접근

**Given** `admin` 역할의 사용자가 로그인한 상태에서
**When** `/admin` 페이지에 접근하면
**Then** 관리자 대시보드가 정상적으로 렌더링된다

### TS-009: 공개 페이지 접근

**Given** 사용자가 로그인하지 않은 상태에서
**When** `/` (랜딩 페이지)에 접근하면
**Then** 페이지가 정상적으로 렌더링된다
**And** 리다이렉트가 발생하지 않는다

### TS-010: API - 인증되지 않은 요청 차단

**Given** 인증 토큰이 없는 상태에서
**When** `POST /api/requests`로 요청하면
**Then** `401 Unauthorized` 응답을 반환한다

**Given** 인증 토큰이 없는 상태에서
**When** `GET /api/requests` (목록)로 요청하면
**Then** `401 Unauthorized` 응답을 반환한다

### TS-011: API - 일반 사용자 관리자 API 차단

**Given** `user` 역할의 인증된 사용자가
**When** `GET /api/requests` (목록)로 요청하면
**Then** `403 Forbidden` 응답을 반환한다

**Given** `user` 역할의 인증된 사용자가
**When** `PATCH /api/requests/[id]`로 요청하면
**Then** `403 Forbidden` 응답을 반환한다

### TS-012: API - 인증된 사용자 정상 접근

**Given** 인증된 사용자가 (역할 무관)
**When** `POST /api/requests`로 유효한 데이터를 전송하면
**Then** `201 Created` 응답과 함께 요청이 생성된다

**Given** 인증된 사용자가
**When** `GET /api/requests/[id]`로 요청하면
**Then** `200 OK` 응답과 함께 요청 상세 정보를 반환한다

### TS-013: API - 관리자 정상 접근

**Given** `admin` 역할의 인증된 사용자가
**When** `GET /api/requests`로 요청하면
**Then** `200 OK` 응답과 함께 전체 요청 목록을 반환한다

**Given** `admin` 역할의 인증된 사용자가
**When** `PATCH /api/requests/[id]`로 유효한 데이터를 전송하면
**Then** `200 OK` 응답과 함께 요청이 업데이트된다

### TS-014: 로그인 페이지 UI

**Given** 사용자가 `/login` 페이지에 접근하면
**Then** Google 로그인 버튼이 표시된다
**And** GitHub 로그인 버튼이 표시된다
**And** 페이지가 모바일/데스크톱에서 반응형으로 렌더링된다

### TS-015: 이미 로그인된 사용자 로그인 페이지 리다이렉트

**Given** 이미 로그인된 사용자가
**When** `/login` 페이지에 접근하면
**Then** `/create`로 리다이렉트된다

### TS-016: 로그아웃

**Given** 로그인된 사용자가
**When** 로그아웃 버튼을 클릭하면
**Then** 세션이 종료된다
**And** JWT 쿠키가 삭제된다
**And** `/`로 리다이렉트된다

### TS-017: 사용자 상태 표시

**Given** 로그인된 사용자가 보호된 페이지에 접근하면
**Then** 사용자 이름이 표시된다
**And** 프로필 이미지가 표시된다 (OAuth에서 제공 시)
**And** 로그아웃 버튼이 표시된다

**Given** `admin` 역할의 사용자가 관리자 페이지에 접근하면
**Then** 관리자 배지가 추가로 표시된다

### TS-018: callbackUrl 리다이렉트

**Given** 비인증 사용자가 `/create/edit`에 접근하여 로그인 페이지로 리다이렉트되었을 때
**When** 로그인에 성공하면
**Then** 원래 접근하려던 `/create/edit`로 리다이렉트된다

---

## Quality Gate 기준

### 기능 완성도

- [ ] Google OAuth 로그인/로그아웃 정상 동작
- [ ] GitHub OAuth 로그인/로그아웃 정상 동작
- [ ] 환경 변수 기반 관리자 역할 자동 할당
- [ ] 미들웨어를 통한 라우트 보호 (Public / Authenticated / Admin)
- [ ] API 라우트 인증 및 인가 적용
- [ ] 로그인 페이지 반응형 UI
- [ ] 사용자 상태 표시 (이름, 아바타, 역할 배지)
- [ ] callbackUrl 기반 리다이렉트

### 보안 체크리스트

- [ ] JWT 토큰이 HTTP-only 쿠키로 저장됨
- [ ] CSRF 보호 활성화 (NextAuth.js 기본)
- [ ] OAuth 시크릿이 클라이언트에 노출되지 않음
- [ ] `AUTH_SECRET` 환경 변수 설정 완료
- [ ] `.env.local`이 `.gitignore`에 포함됨
- [ ] 인증되지 않은 API 요청에 대해 401 반환
- [ ] 권한 부족 API 요청에 대해 403 반환

### 코드 품질

- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 경고 없음
- [ ] Next.js 빌드 성공
- [ ] 신규 파일에 적절한 타입 정의
- [ ] 컴포넌트에 적절한 ARIA 속성 적용

### 호환성

- [ ] 기존 명함 편집 기능 정상 동작
- [ ] 기존 관리자 기능 정상 동작
- [ ] 기존 API 엔드포인트 응답 형식 유지
- [ ] 모바일 및 데스크톱 반응형 레이아웃 유지

---

## Definition of Done

1. 모든 테스트 시나리오 (TS-001 ~ TS-018)가 수동 또는 자동 테스트를 통해 검증됨
2. 모든 Quality Gate 체크리스트 항목이 통과함
3. `next build` 성공
4. `.env.example` 파일이 모든 필수 환경 변수를 포함함
5. 기존 기능에 대한 회귀 테스트 통과
