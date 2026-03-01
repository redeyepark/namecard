---
spec_id: SPEC-LINKBIO-001
type: implementation-plan
version: "1.0.0"
created: "2026-03-01"
updated: "2026-03-01"
---

# SPEC-LINKBIO-001: 구현 계획서

## 1. 구현 개요

프로필 페이지(`/profile/[id]`)를 Linktree 스타일의 모바일 퍼스트 Link-in-Bio 페이지로 리디자인한다.
Phase 1은 핵심 레이아웃 변경, 소셜 아이콘 표시, 커스텀 링크 CRUD, 카드 포트폴리오 섹션, 관련 API를 포함한다.

## 2. 기술 명세

### 2.1 사용 기술

| 기술 | 용도 | 비고 |
|------|------|------|
| Next.js 16.1.6 (App Router) | 서버/클라이언트 컴포넌트 | 기존 프레임워크 |
| TypeScript 5.x | 정적 타입 검사 | 기존 설정 |
| Tailwind CSS 4.x | 반응형 스타일링 | 기존 설정 |
| Zustand 5.0.11 | 클라이언트 상태 (편집 모드) | 기존 설치 |
| Supabase (supabase-js 2.97.0) | DB CRUD, Auth | 기존 설치 |
| lucide-react | 소셜 아이콘 렌더링 | 기존 설치 |

### 2.2 추가 패키지

추가 npm 패키지 없음. 기존 의존성만으로 구현 가능.

## 3. 태스크 분해

### Milestone 1: 데이터베이스 및 타입 (Priority High)

**Task 1.1: DB 마이그레이션 준비**
- `user_links` 테이블 CREATE SQL 작성
- `user_profiles` 테이블에 `social_links JSONB DEFAULT '[]'` 컬럼 추가 SQL 작성
- RLS 정책 설정 SQL 작성
- 인덱스 생성 SQL 작성
- 산출물: `.moai/specs/SPEC-LINKBIO-001/migration.sql` (참고용)

**Task 1.2: TypeScript 타입 정의**
- `src/types/profile.ts`에 `UserLink`, `SocialLink`, `SocialPlatform` 타입 추가
- `UserProfile` 인터페이스에 `socialLinks` 필드 추가
- `ProfilePageData` 인터페이스에 `links` 필드 추가
- 기존 타입 하위 호환성 유지

### Milestone 2: 데이터 접근 계층 (Priority High)

**Task 2.1: Profile Storage 확장**
- `src/lib/profile-storage.ts`에 링크 CRUD 함수 추가
  - `getUserLinks(userId: string)`: 활성 링크 조회
  - `getMyLinks(userId: string)`: 전체 링크 조회
  - `createUserLink(userId, data)`: 링크 생성
  - `updateUserLink(userId, linkId, data)`: 링크 수정
  - `deleteUserLink(userId, linkId)`: 링크 삭제
  - `reorderUserLinks(userId, linkIds)`: 순서 변경
- `getProfile()` 함수에 `social_links` 필드 포함하도록 확장
- snake_case(DB) -> camelCase(TS) 변환 일관 적용

**Task 2.2: URL 검증 유틸리티**
- `src/lib/link-validation.ts` 생성
  - `validateUrl(url: string): { valid: boolean; error?: string }`
  - `javascript:` 프로토콜 차단
  - `http://` 또는 `https://` 필수
  - `data:` URI 차단
  - 빈 문자열 차단
  - `sanitizeUrl(url: string): string` - 공백 trim, 프로토콜 정규화

### Milestone 3: API 엔드포인트 (Priority High)

**Task 3.1: 링크 공개 API**
- `src/app/api/profiles/[id]/links/route.ts` 생성
  - GET: 활성 링크 목록 (sort_order ASC)
  - 인증 불필요

**Task 3.2: 링크 CRUD API**
- `src/app/api/profiles/me/links/route.ts` 생성
  - GET: 내 전체 링크 (비활성 포함)
  - POST: 링크 생성 (title, url 필수, URL 검증)
- `src/app/api/profiles/me/links/[linkId]/route.ts` 생성
  - PUT: 링크 수정 (소유권 검증)
  - DELETE: 링크 삭제 (소유권 검증)
- `src/app/api/profiles/me/links/reorder/route.ts` 생성
  - PATCH: 순서 변경

**Task 3.3: 프로필 API 확장**
- `src/app/api/profiles/me/route.ts` PUT 핸들러에 `socialLinks` 필드 처리 추가
- 소셜 링크 JSONB 저장/조회 로직

### Milestone 4: UI 컴포넌트 (Priority High)

**Task 4.1: 핵심 표시 컴포넌트**
- `SocialIconRow.tsx`: 소셜 플랫폼별 lucide-react 아이콘 매핑, 가로 행 배치, 클릭 시 URL 오픈
- `LinkButton.tsx`: 전체 너비 버튼, 중앙 정렬 title 텍스트, 딥 네이비 테두리, 호버 효과
- `LinkList.tsx`: LinkButton 배열을 세로 스택으로 렌더링
- `CardPortfolio.tsx`: 기존 GalleryCardThumbnail 재사용, 2열 그리드 또는 수평 스크롤

**Task 4.2: 편집 컴포넌트**
- `LinkEditor.tsx`: 소유자 전용 링크 목록 + 추가/수정/삭제 UI
- `LinkEditModal.tsx`: 링크 추가/수정용 모달 (title, url 입력 폼)
- `SocialLinksEditor.tsx`: 소셜 플랫폼 선택 + URL 입력 편집기

**Task 4.3: useLinks 훅**
- `src/hooks/useLinks.ts` 생성
- fetch, create, update, delete, reorder 비동기 함수
- 로딩/에러 상태 관리
- 낙관적 업데이트 (optional, Phase 1에서는 refetch 방식도 가능)

### Milestone 5: 페이지 리디자인 (Priority High)

**Task 5.1: ProfileHeader 리디자인**
- 아바타 80px (기존 120px에서 축소)
- 원형 아바타 유지
- 이름 + Bio 중앙 정렬
- QR/공유 버튼을 페이지 하단으로 이동
- 소셜 아이콘 행 통합
- max-width: 680px 적용

**Task 5.2: ProfileClient 리디자인**
- 전체 세로 레이아웃으로 재구성
- 섹션 순서: 프로필 헤더 -> 소셜 아이콘 -> 링크 버튼 -> 카드 포트폴리오 -> QR/공유
- 소유자/방문자 분기 렌더링
- 소유자: 편집 UI 표시
- 방문자: 읽기 전용 UI

**Task 5.3: page.tsx 수정**
- `getProfile()` 반환에 소셜 링크 포함
- 링크 데이터 추가 fetch (getUserLinks)
- 소유자 판별: Supabase Auth 세션 확인 (서버 사이드)
- `isOwner` prop을 ProfileClient에 전달

### Milestone 6: 통합 테스트 및 마무리 (Priority Medium)

**Task 6.1: 엣지 케이스 처리**
- 소셜 링크 0개 시 아이콘 행 숨김
- 커스텀 링크 0개 + 방문자: 링크 섹션 숨김
- 카드 0장: 포트폴리오 섹션 숨김
- 비공개 프로필 + 비소유자: 잠금 화면
- URL 검증 실패: 에러 메시지 표시

**Task 6.2: 반응형 검증**
- 모바일 (375px): 단일 컬럼, 터치 영역 44px 이상
- 태블릿 (768px): 단일 컬럼, 여유 패딩
- 데스크톱 (1024px+): max-width 680px 중앙 정렬

**Task 6.3: 접근성(a11y) 검증**
- ARIA label 적용 (소셜 아이콘, 링크 버튼, 편집 버튼)
- 키보드 네비게이션 (Tab, Enter, Escape)
- focus-visible 스타일 적용

## 4. 아키텍처 설계

### 4.1 데이터 흐름

```
[Server Component: page.tsx]
  |-- getProfile(id) --> { profile, cardCount, totalLikes, themeDistribution }
  |-- getUserLinks(id) --> UserLink[]
  |-- getUserCards(id) --> GalleryCardData[]
  |-- checkOwnership(session, id) --> boolean
  |
  v
[Client Component: ProfileClient]
  |-- Props: profile, links, cards, isOwner
  |-- useLinks(userId) --> 링크 CRUD 훅 (소유자만)
  |
  |-- <ProfileHeader />  (avatar, name, bio)
  |-- <SocialIconRow />   (social icons)
  |-- <LinkList />         (visitor view)
  |   or <LinkEditor />    (owner view)
  |-- <CardPortfolio />    (card grid/slider)
  |-- QR/Share buttons
```

### 4.2 소유자 판별 로직

```typescript
// page.tsx (Server Component)
import { createClient } from '@/lib/supabase-server';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const isOwner = user?.id === id;
```

서버 사이드에서 소유자 판별 후 `isOwner` boolean을 클라이언트로 전달.
클라이언트에서는 `isOwner` 값에 따라 편집 UI를 조건부 렌더링.

### 4.3 링크 편집 흐름

```
[소유자 프로필 방문]
  |
  |-- "프로필 편집" 플로팅 버튼 클릭
  |    |
  |    v
  |-- [편집 모드 활성화]
  |    |-- LinkEditor 표시 (CRUD UI)
  |    |-- SocialLinksEditor 표시
  |    |
  |    |-- "링크 추가" 클릭 --> LinkEditModal (title, url 입력)
  |    |    |-- 저장 --> POST /api/profiles/me/links
  |    |    |-- useLinks.create() --> 리스트 갱신
  |    |
  |    |-- 기존 링크 수정 --> LinkEditModal (pre-filled)
  |    |    |-- 저장 --> PUT /api/profiles/me/links/[linkId]
  |    |
  |    |-- 링크 삭제 --> 확인 후 DELETE /api/profiles/me/links/[linkId]
```

## 5. 파일 변경 목록

### 5.1 신규 파일 (13개)

| 파일 경로 | 용도 |
|-----------|------|
| `src/types/profile.ts` (확장) | UserLink, SocialLink 타입 |
| `src/lib/link-validation.ts` | URL 검증 유틸리티 |
| `src/hooks/useLinks.ts` | 링크 CRUD 훅 |
| `src/app/api/profiles/[id]/links/route.ts` | 공개 링크 API |
| `src/app/api/profiles/me/links/route.ts` | 내 링크 CRUD API |
| `src/app/api/profiles/me/links/[linkId]/route.ts` | 개별 링크 API |
| `src/app/api/profiles/me/links/reorder/route.ts` | 링크 순서 API |
| `src/components/profile/SocialIconRow.tsx` | 소셜 아이콘 행 |
| `src/components/profile/LinkButton.tsx` | 링크 버튼 |
| `src/components/profile/LinkList.tsx` | 링크 목록 |
| `src/components/profile/LinkEditor.tsx` | 링크 편집기 |
| `src/components/profile/LinkEditModal.tsx` | 링크 모달 |
| `src/components/profile/SocialLinksEditor.tsx` | 소셜 링크 편집기 |
| `src/components/profile/CardPortfolio.tsx` | 카드 포트폴리오 |

### 5.2 수정 파일 (5개)

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `src/types/profile.ts` | UserLink, SocialLink, SocialPlatform 타입 추가 |
| `src/lib/profile-storage.ts` | 링크 CRUD 함수 추가, getProfile에 social_links 포함 |
| `src/app/profile/[id]/page.tsx` | 링크 fetch, 소유자 판별, 추가 props 전달 |
| `src/app/profile/[id]/ProfileClient.tsx` | 세로 레이아웃 리디자인 |
| `src/components/profile/ProfileHeader.tsx` | 80px 아바타, 축소 레이아웃 |
| `src/app/api/profiles/me/route.ts` | socialLinks PUT 처리 추가 |

## 6. 리스크 분석

### 6.1 기술적 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Supabase RLS 정책 설정 오류 | 데이터 노출/접근 차단 | 로컬 테스트 후 프로덕션 적용, service_role 키로 API 접근 패턴 유지 |
| social_links JSONB 스키마 변경 | 마이그레이션 복잡도 증가 | 초기 스키마를 단순하게 유지 (platform + url) |
| 기존 ProfileHeader 리디자인으로 인한 회귀 | 기존 기능 깨짐 | 변경 전 스냅샷 테스트, 점진적 리팩터링 |
| Cloudflare Workers 엣지 런타임 호환성 | 서버 사이드 Auth 세션 접근 실패 | 기존 middleware.ts 패턴 활용, @supabase/ssr 사용 |

### 6.2 UX 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 레이아웃 변경으로 인한 혼란 | 기존 사용자 이탈 | 기존 카드 그리드를 CardPortfolio로 자연스럽게 전환 |
| 편집 UX 복잡도 | 소유자 편집 진입 장벽 | 플로팅 버튼으로 명확한 편집 진입점 제공 |

## 7. 의존성

### 7.1 선행 작업

- DB 마이그레이션 (`user_links` 테이블 생성, `social_links` 컬럼 추가) - Supabase 대시보드에서 수동 실행 필요

### 7.2 후속 작업 (Phase 2/3으로 연기)

- 드래그 앤 드롭 링크 순서 변경 (Phase 2)
- 링크 클릭 추적 analytics (Phase 3)
- 프로필 배경 커스터마이징 (Phase 3)

## 8. 성능 고려사항

### 8.1 서버 컴포넌트 활용
- `page.tsx`에서 프로필 + 링크 + 카드 데이터를 서버 사이드에서 병렬 fetch
- 클라이언트로 전달되는 데이터 최소화

### 8.2 쿼리 최적화
- `user_links` 테이블에 `user_id` 인덱스 생성으로 조회 성능 보장
- 링크 목록은 최대 50개 제한 (무한 스크롤 불필요)

### 8.3 번들 사이즈
- 추가 npm 패키지 없음 (lucide-react 기존 사용)
- 편집 컴포넌트는 동적 import로 소유자만 로드 (선택사항)
