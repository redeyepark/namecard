# 기술 스택

## 기술 스택 개요

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js | 16.1.6 | App Router 기반 React 프레임워크 |
| UI 라이브러리 | React | 19.2.3 | 컴포넌트 기반 UI 렌더링 |
| 언어 | TypeScript | 5.x | 정적 타입 검사 |
| 스타일링 | Tailwind CSS | 4.x | 유틸리티 기반 CSS 프레임워크 |
| 상태 관리 | Zustand | 5.0.11 | 경량 상태 관리 (persist middleware 포함) |
| 인증 | Supabase Auth (@supabase/ssr) | 0.8.0 | 이메일/비밀번호 + Google OAuth 인증 |
| 데이터베이스 | Supabase (supabase-js) | 2.97.0 | PostgreSQL DB + Storage |
| 색상 선택 | react-colorful | 5.6.1 | 경량 색상 선택기 (2KB, zero-dependency) |
| 이미지 내보내기 | html-to-image | 1.11.13 | DOM 요소를 PNG 이미지로 변환 |
| ID 생성 | uuid | 13.0.0 | 고유 식별자 생성 |
| 테스트 | Vitest | 4.0.18 | 단위 테스트 프레임워크 |
| 테스트 유틸 | Testing Library | 16.3.2 | React 컴포넌트 테스트 유틸리티 |
| 린터 | ESLint | 9.x | 코드 정적 분석 및 스타일 검사 |
| 빌드 도구 | Turbopack | Next.js 내장 | 고속 개발 서버 번들링 |
| 프로덕션 빌드 | @opennextjs/cloudflare | - | Cloudflare Workers용 Next.js 빌드 어댑터 |
| 배포 | Cloudflare Workers | - | 엣지 네트워크 기반 호스팅 및 배포 |

## 프레임워크: Next.js 16 (App Router)

- React 19 기반의 최신 프레임워크
- App Router 사용 (`src/app/` 디렉토리 구조)
- 서버 컴포넌트와 클라이언트 컴포넌트 혼합 사용
- API Routes를 통한 서버 사이드 비즈니스 로직 처리 (`src/app/api/`)
- middleware.ts를 통한 미들웨어 기능 (Supabase 세션 갱신 + 라우트 보호)
- Turbopack을 통한 고속 개발 서버

## 언어: TypeScript 5.x

- `strict: true` 모드 활성화
- Path alias 설정: `@/*` -> `./src/*`
- Module resolution: `bundler`
- Target: `ES2017`
- JSX: `react-jsx` (자동 import)

## 인증: Supabase Auth

- `@supabase/ssr` 패키지를 통한 서버 사이드 세션 관리
- 이메일/비밀번호 인증 (회원가입 + 이메일 확인)
- Google OAuth 소셜 로그인
- `middleware.ts`에서 Supabase 세션 자동 갱신
- `AuthProvider` 컴포넌트에서 `onAuthStateChange` 리스너로 인증 상태 관리
- `useAuth` 훅을 통한 클라이언트 컴포넌트 인증 상태 접근
- 관리자 역할: `ADMIN_EMAILS` 환경변수 화이트리스트, `/api/auth/me` 엔드포인트에서 확인

### Supabase 클라이언트 구성

| 클라이언트 | 파일 | 용도 |
|-----------|------|------|
| 브라우저 클라이언트 | `src/lib/supabase-auth.ts` | 클라이언트 컴포넌트에서 인증용 (anon key) |
| 서버 클라이언트 | `src/lib/supabase.ts` | API 라우트에서 DB/Storage 접근용 (service role key) |

### 인증 유틸리티 (`src/lib/auth-utils.ts`)

- `requireAuth`: 인증 필수 API 라우트 보호
- `requireAdmin`: 관리자 전용 API 라우트 보호
- `isAdmin`: 관리자 이메일 확인
- `AuthError`: 인증 오류 처리 클래스
- 소유권 검증 패턴: `GET /api/requests/[id]`에서 비관리자 사용자의 경우 `created_by`와 현재 사용자 이메일 일치 여부를 검증하여, 불일치 시 403 반환

## 데이터베이스: Supabase PostgreSQL

### 테이블 구조

| 테이블 | 용도 |
|--------|------|
| `card_requests` | 명함 제작 요청 (사용자 정보, 카드 데이터, 상태) |
| `card_request_status_history` | 요청 상태 변경 이력 추적 |

### Storage 버킷

| 버킷 | 용도 |
|------|------|
| `avatars` | 사용자 아바타 이미지 저장 |
| `illustrations` | 관리자가 업로드하는 일러스트 이미지 저장 |

### 데이터 접근 계층 (`src/lib/storage.ts`)

- `saveRequest`: 명함 제작 요청 저장
- `getRequest`: 요청 상세 조회
- `getAllRequests`: 전체 요청 목록 조회 (관리자용)
- `getRequestsByUser(email)`: 특정 사용자의 요청 목록 조회 (`created_by` 필터링)
- `updateRequest`: 요청 상태 업데이트
- 기타 Supabase DB/Storage CRUD 함수

## 스타일링: Tailwind CSS 4

- PostCSS 기반 유틸리티 CSS 프레임워크
- `@import "tailwindcss"` 방식의 CSS 4 문법 사용
- 반응형 디자인: `sm:`, `md:`, `lg:` breakpoints 활용
- 커스텀 CSS: 카드 플립 애니메이션, 탭 전환 애니메이션, focus-visible 스타일
- 터치 디바이스 최소 타겟 크기(44px) 보장을 위한 `@media (pointer: coarse)` 규칙

## 상태 관리: Zustand 5

- persist middleware를 통한 localStorage 자동 저장
- Storage key: `namecard-storage`
- 상태 구조: `CardData` (front + back) + `activeSide`
- 액션: `updateFront`, `updateBack`, `setActiveSide`, `addSocialLink`, `removeSocialLink`, `updateSocialLink`, `addHashtag`, `removeHashtag`, `resetCard`
- Redux 대비 보일러플레이트 최소화, 간결한 API

## 색상 선택: react-colorful 5.6

- 번들 크기: 약 2KB (gzipped)
- 외부 의존성 없음 (zero-dependency)
- `HexColorPicker` 컴포넌트 사용
- Hex 값 직접 입력 기능과 결합하여 사용

## 이미지 내보내기: html-to-image 1.11

- DOM 요소를 PNG 이미지로 변환
- `toPng()` 함수 사용
- `pixelRatio: 2` 설정으로 고해상도 출력
- `cacheBust: true`로 캐시 무효화
- 앞면(`#card-front`)과 뒷면(`#card-back`)을 각각 독립적으로 내보내기

## ID 생성: uuid 13.0

- `uuid` 패키지를 사용한 고유 식별자(UUID v4) 생성
- 명함 제작 요청, 소셜 링크 등 엔티티 식별에 사용

## 테스트: Vitest 4.0 + Testing Library

- Vitest: Vite 기반 고속 테스트 러너
- `@testing-library/react`: React 컴포넌트 테스트
- `@testing-library/jest-dom`: DOM assertion 확장
- `jsdom`: 브라우저 환경 시뮬레이션
- `@vitejs/plugin-react`: React JSX/TSX 테스트 지원
- 테스트 실행: `npm test` (단일 실행), `npm run test:watch` (감시 모드)

## 린터: ESLint 9

- `eslint-config-next` 16.1.6 기반 규칙
- 플랫 설정 파일 형식 (`eslint.config.mjs`)
- 실행: `npm run lint`

## 배포: Cloudflare Workers

- `@opennextjs/cloudflare` 어댑터를 통한 Next.js 빌드
- Cloudflare Workers 엣지 네트워크 기반 글로벌 배포
- 배포 URL: https://namecard.redeyepark.workers.dev
- 설정 파일: `wrangler.jsonc` (Cloudflare Workers 설정)
- `next.config.ts`에서 `images: { unoptimized: true }` 설정 (Workers 호환)

### CI/CD: GitHub Actions

- 워크플로우 파일: `.github/workflows/deploy.yml`
- 트리거: `master` 브랜치 push 시 자동 배포
- 실행 환경: `ubuntu-latest` (Linux) - Windows에서 Wrangler WASM 파일 처리 불가로 Linux 필수
- 빌드: `npx opennextjs-cloudflare build`
- 배포: `npx opennextjs-cloudflare deploy`
- 런타임 시크릿: `wrangler secret put` 명령으로 설정

## 개발 환경

- Node.js 22+ 권장
- 패키지 매니저: npm
- 개발 서버: `npm run dev` (Turbopack 기반 HMR)
- 빌드: `npm run build` (Next.js 빌드)
- 프로덕션 실행: `npm start`

## 환경변수

| 변수명 | 범위 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 + 서버 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 + 서버 | Supabase anon 키 (공개) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | Supabase service role 키 (DB/Storage 관리자 접근) |
| `ADMIN_EMAILS` | 서버 전용 | 관리자 이메일 목록 (쉼표 구분) |

## 아키텍처 결정 사항

### 풀스택 아키텍처 (Supabase 백엔드)

Supabase를 Backend-as-a-Service로 활용하여 인증, 데이터베이스, 파일 스토리지를 통합 관리합니다. Next.js API Routes를 통해 서버 사이드 비즈니스 로직(인증 검증, 권한 확인, 데이터 CRUD)을 처리하고, Supabase 클라이언트를 통해 PostgreSQL DB와 Storage에 접근합니다.

### Supabase Auth로 인증 관리

`@supabase/ssr` 패키지를 사용하여 서버 사이드 세션 관리를 구현합니다. 이메일/비밀번호 인증과 Google OAuth를 지원하며, `middleware.ts`에서 모든 요청에 대해 Supabase 세션을 자동 갱신합니다. 관리자 역할은 `ADMIN_EMAILS` 환경변수 화이트리스트 방식으로 간단하게 관리합니다.

### Cloudflare Workers로 엣지 배포

`@opennextjs/cloudflare` 어댑터를 사용하여 Next.js 애플리케이션을 Cloudflare Workers에 배포합니다. GitHub Actions CI/CD를 통해 `master` 브랜치에 push하면 자동으로 빌드 및 배포됩니다. 엣지 네트워크를 통한 글로벌 저지연 응답과 자동 확장을 제공합니다.

### localStorage로 카드 편집기 데이터 영속성

카드 편집기(/create/edit)에서 Zustand의 persist middleware를 활용하여 편집 중인 명함 데이터를 `localStorage`에 자동 저장합니다. 브라우저를 닫았다가 다시 열면 이전 편집 상태가 복원됩니다.

### html-to-image로 클라이언트 사이드 이미지 생성

서버 사이드 렌더링(Puppeteer, Sharp 등) 없이, 브라우저의 DOM 요소를 직접 캡처하여 PNG로 변환합니다. `pixelRatio: 2` 설정으로 레티나 디스플레이 수준의 고해상도 출력을 지원합니다.

### Zustand으로 경량 상태 관리

Redux, MobX 등 대비 보일러플레이트가 최소화된 Zustand을 선택했습니다. 단일 store에 모든 명함 데이터와 UI 상태를 관리하며, persist middleware 한 줄 추가로 localStorage 영속성을 구현했습니다. 프로젝트 규모에 적합한 간결한 상태 관리 솔루션입니다.

### react-colorful로 경량 색상 선택기

react-color(약 14KB) 대신 react-colorful(약 2KB)을 선택하여 번들 크기를 최소화했습니다. 외부 의존성이 없어 유지보수 부담이 적고, 접근성(WCAG)을 기본 지원합니다.

## 주요 npm 스크립트

| 스크립트 | 명령어 | 설명 |
|---------|--------|------|
| `dev` | `next dev` | 개발 서버 실행 (Turbopack HMR) |
| `build` | `next build` | 프로덕션 빌드 |
| `start` | `next start` | 프로덕션 서버 실행 |
| `cf:build` | `opennextjs-cloudflare build` | Cloudflare Pages용 빌드 |
| `preview` | `opennextjs-cloudflare build && preview` | Cloudflare 프리뷰 |
| `deploy` | `opennextjs-cloudflare build && deploy` | Cloudflare 배포 |
| `lint` | `eslint` | ESLint 코드 검사 |
| `test` | `vitest run` | 테스트 단일 실행 |
| `test:watch` | `vitest` | 테스트 감시 모드 |
