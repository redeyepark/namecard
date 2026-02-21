# 기술 스택

## 기술 스택 개요

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | Next.js | 16.1.6 | App Router 기반 React 프레임워크 |
| UI 라이브러리 | React | 19.2.3 | 컴포넌트 기반 UI 렌더링 |
| 언어 | TypeScript | 5.x | 정적 타입 검사 |
| 스타일링 | Tailwind CSS | 4.x | 유틸리티 기반 CSS 프레임워크 |
| 상태 관리 | Zustand | 5.0.11 | 경량 상태 관리 (persist middleware 포함) |
| 색상 선택 | react-colorful | 5.6.1 | 경량 색상 선택기 (2KB, zero-dependency) |
| 이미지 내보내기 | html-to-image | 1.11.13 | DOM 요소를 PNG 이미지로 변환 |
| 테스트 | Vitest | 4.0.18 | 단위 테스트 프레임워크 |
| 테스트 유틸 | Testing Library | 16.3.2 | React 컴포넌트 테스트 유틸리티 |
| 린터 | ESLint | 9.x | 코드 정적 분석 및 스타일 검사 |
| 빌드 도구 | Turbopack | Next.js 내장 | 고속 번들링 |
| 배포 | Vercel | - | 정적 호스팅 및 배포 |

## 프레임워크: Next.js 16 (App Router)

- React 19 기반의 최신 프레임워크
- App Router 사용 (`src/app/` 디렉토리 구조)
- 이 프로젝트에서는 서버 컴포넌트를 사용하지 않으며, 모든 컴포넌트에 `'use client'` 지시문 적용
- Turbopack을 통한 고속 개발 서버 및 빌드

## 언어: TypeScript 5.x

- `strict: true` 모드 활성화
- Path alias 설정: `@/*` -> `./src/*`
- Module resolution: `bundler`
- Target: `ES2017`
- JSX: `react-jsx` (자동 import)

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

## 배포: Vercel

- 정적 호스팅 (Static Hosting)
- Next.js와 네이티브 통합
- 자동 빌드 및 배포 (Git push 기반)

## 개발 환경

- Node.js 22+ 권장
- 패키지 매니저: npm
- 개발 서버: `npm run dev` (Turbopack 기반 HMR)
- 빌드: `npm run build`
- 프로덕션 실행: `npm start`

## 아키텍처 결정 사항

### 서버리스 아키텍처 (백엔드 없음)

별도의 서버, 데이터베이스, API 없이 순수하게 브라우저에서 동작합니다. 사용자 인증, 데이터 동기화 등 서버 의존 기능이 필요하지 않은 도구형 애플리케이션에 적합한 아키텍처입니다.

### localStorage로 데이터 영속성

Zustand의 persist middleware를 활용하여 모든 명함 데이터를 `localStorage`에 자동 저장합니다. 서버 DB 없이도 브라우저를 닫았다가 다시 열면 이전 편집 상태가 복원됩니다. 이미지는 Base64 인코딩 문자열로 저장됩니다.

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
| `lint` | `eslint` | ESLint 코드 검사 |
| `test` | `vitest run` | 테스트 단일 실행 |
| `test:watch` | `vitest` | 테스트 감시 모드 |
