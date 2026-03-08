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
| PDF 생성 | jsPDF | 4.2.0 | 클라이언트 사이드 PDF 문서 생성 |
| ID 생성 | uuid | 13.0.0 | 고유 식별자 생성 |
| QR 코드 | qrcode | 1.x | 클라이언트 사이드 QR 코드 생성 (Canvas 기반) |
| 파일 파싱 | xlsx (SheetJS) | 0.18.5 | Excel/CSV 파일 파싱 (브라우저 내 변환) |
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
- 비밀번호 변경: `supabase.auth.updateUser({ password })` API 사용, 변경 전 `signInWithPassword()`로 현재 비밀번호 검증

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

## 관리자 API: 대량 등록

### CSV/Excel 대량 업로드 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/admin/bulk-upload` | CSV/Excel 파일 기반 명함 제작 요청 대량 등록 (requireAdmin) |

- 지원 형식: `.csv`, `.xlsx`, `.xls`
- CSV 12개 컬럼: 사진URL, 앞면이름, 뒷면이름, 관심사, 키워드1-3, 이메일, Facebook, Instagram, LinkedIn, 배경색
- Excel 파일은 클라이언트(BulkUploadModal)에서 SheetJS(xlsx)로 CSV 변환 후 전송
- 이메일 자동 회원가입: 존재하지 않는 이메일은 Supabase Auth REST API 직접 호출로 자동 생성 (기본 비밀번호: 123456, `email_confirm: true`)
  - 기존 사용자 조회: `GET ${supabaseUrl}/auth/v1/admin/users` (service_role 키 인증)
  - 신규 사용자 생성: `POST ${supabaseUrl}/auth/v1/admin/users` (service_role 키 인증)
  - Supabase SDK의 `auth.admin` 메서드는 Cloudflare Workers 엣지 런타임과 호환되지 않아 REST API fetch()로 전환
- CSV 대량 등록 시 초기 상태: `processing` (작업중) - statusHistory에 submitted와 processing 두 건의 이력이 동시 기록됨
- 소셜 링크 핸들 추출: `extractSocialHandle()` 함수가 소셜 미디어 URL에서 실제 사용자 핸들을 추출하여 라벨로 사용 (플랫폼명 대신 `@username` 형태 표시)
- 응답 필드: `success`, `total`, `created`, `errors`, `autoRegistered`

## 관리자 API: 테마 관리

### 테마 통계 및 일괄 적용 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/admin/themes` | 테마별 의뢰 통계 조회 (requireAdmin) |
| PATCH | `/api/admin/themes` | 필터 기반 일괄 테마 적용 (requireAdmin) |

- GET: 각 테마(classic, pokemon, hearthstone, harrypotter, tarot)별 의뢰 건수 통계 반환
- PATCH: 상태, 현재 테마를 필터 조건으로 지정하고, 대상 테마 및 메타데이터를 일괄 적용

## 관리자 API: 이벤트 카드

### 이벤트별 카드 데이터 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/admin/events/[id]/cards` | 이벤트 참여자 전체 카드 데이터 조회 (requireAdminToken) |

- cancelled/rejected 상태 제외한 모든 카드 반환
- 반환 필드: id, card_front, card_back, illustration_url, theme, pokemon_meta
- 주의: hearthstone_meta, harrypotter_meta, tarot_meta 컬럼은 DB에 존재하지 않음 (pokemon_meta만 존재)
- EventPdfDownload 컴포넌트에서 PDF 생성 시 데이터 소스로 사용

## 커뮤니티 API

### 프로필 API (Link-in-Bio 확장)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/profiles/me` | 현재 사용자 프로필 조회 (requireAuth) |
| PUT | `/api/profiles/me` | 프로필 업데이트 (requireAuth) |
| POST | `/api/profiles/me/avatar` | 아바타 이미지 업로드 (requireAuth) |
| GET | `/api/profiles/me/links` | 내 링크 목록 조회 (requireAuth) |
| POST | `/api/profiles/me/links` | 링크 생성 (requireAuth) |
| PUT | `/api/profiles/me/links/[linkId]` | 링크 수정 (requireAuth) |
| DELETE | `/api/profiles/me/links/[linkId]` | 링크 삭제 (requireAuth) |
| PUT | `/api/profiles/me/links/reorder` | 링크 순서 변경 (requireAuth) |
| GET | `/api/profiles/[id]` | 사용자 프로필 조회 (공개) |
| GET | `/api/profiles/[id]/cards` | 사용자 카드 목록 조회 (공개) |
| GET | `/api/profiles/[id]/links` | 사용자 공개 링크 목록 조회 (공개) |

### 피드 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/feed` | 커뮤니티 피드 (정렬: latest/popular, 테마 필터, 페이지네이션) |

### 소셜 인터랙션 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/cards/[id]/like` | 좋아요 토글 (requireAuth) |
| DELETE | `/api/cards/[id]/like` | 좋아요 해제 (requireAuth) |
| POST | `/api/cards/[id]/bookmark` | 북마크 토글 (requireAuth) |
| DELETE | `/api/cards/[id]/bookmark` | 북마크 해제 (requireAuth) |

### 질문 & 생각 API (SPEC-COMMUNITY-003)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/questions` | 질문 목록 조회 (커서 기반 페이지네이션, 해시태그 필터) |
| POST | `/api/questions` | 질문 작성 (requireAuth) |
| GET | `/api/questions/[id]` | 질문 상세 조회 |
| DELETE | `/api/questions/[id]` | 질문 삭제 (본인만, requireAuth) |
| GET | `/api/questions/[id]/thoughts` | 생각 목록 조회 (커서 기반 페이지네이션) |
| POST | `/api/questions/[id]/thoughts` | 생각 작성 (requireAuth) |
| DELETE | `/api/questions/[id]/thoughts/[thoughtId]` | 생각 삭제 (본인만, requireAuth) |
| POST | `/api/thoughts/[id]/like` | 생각 좋아요 추가 (requireAuth) |
| DELETE | `/api/thoughts/[id]/like` | 생각 좋아요 해제 (requireAuth) |

### 커피챗 API (SPEC-COMMUNITY-004)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/coffee-chat` | 내 커피챗 목록 조회 (커서 기반 페이지네이션, requireAuth) |
| POST | `/api/coffee-chat` | 커피챗 요청 생성 (rate limit 5건/24h, requireAuth) |
| GET | `/api/coffee-chat/[id]` | 커피챗 상세 조회 (당사자만, requireAuth) |
| POST | `/api/coffee-chat/[id]/respond` | 커피챗 응답 (accept/decline/cancel/complete, requireAuth) |
| GET | `/api/coffee-chat/pending-count` | 수신 대기 건수 조회 (requireAuth) |
| GET | `/api/members/discoverable` | 탐색 가능 회원 목록 (커서 기반, requireAuth) |

### MBTI API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/mbti/questions` | MBTI 진행 상황 조회 (requireAuth) |
| POST | `/api/mbti/answer` | MBTI 답변 제출 (requireAuth) |

### 설문/투표 API (SPEC-SURVEY-001)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/surveys` | 설문 목록 조회 (커서 기반 페이지네이션, 해시태그 필터) |
| POST | `/api/surveys` | 설문 작성 (requireAuth) |
| GET | `/api/surveys/[id]` | 설문 상세 조회 |
| POST | `/api/surveys/[id]/vote` | 설문 투표 (requireAuth) |

### 관리자 질문 관리 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/admin/questions` | 관리자 질문 목록 (requireAdmin) |
| POST | `/api/admin/questions` | 관리자 질문 생성 (requireAdmin) |
| PUT | `/api/admin/questions/[id]` | 관리자 질문 수정 (requireAdmin) |
| DELETE | `/api/admin/questions/[id]` | 관리자 질문 삭제 (requireAdmin) |

### 커스텀 테마 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/admin/custom-themes` | 커스텀 테마 목록 (requireAdmin) |
| POST | `/api/admin/custom-themes` | 커스텀 테마 생성 (requireAdmin) |
| GET | `/api/admin/custom-themes/[id]` | 커스텀 테마 조회 (requireAdmin) |
| PUT | `/api/admin/custom-themes/[id]` | 커스텀 테마 수정 (requireAdmin) |
| DELETE | `/api/admin/custom-themes/[id]` | 커스텀 테마 삭제 (requireAdmin) |
| GET | `/api/themes` | 공개 테마 목록 (공개) |

## 관리자 API: 인쇄 주문

### 인쇄 주문 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/admin/print/quote` | Gelato 견적 조회 (requireAdminToken) |
| POST | `/api/admin/print/orders` | 인쇄 주문 생성 (requireAdminToken) |
| GET | `/api/admin/print/orders` | 주문 목록 조회 (requireAdminToken) |
| GET | `/api/admin/print/orders/[id]` | 주문 상태 조회 + Gelato API 동기화 (requireAdminToken) |
| PATCH | `/api/admin/print/orders/[id]` | Draft 주문 확정 (requireAdminToken) |
| GET | `/api/admin/print/products` | Gelato 제품 정보 조회 (requireAdminToken) |
| GET | `/api/admin/print/shipping-methods` | 배송 방법 목록 조회 (requireAdminToken) |
| POST | `/api/admin/print/pdf` | PDF Blob 업로드 → Supabase Storage (requireAdminToken) |
| POST | `/api/webhooks/gelato` | Gelato Webhook 수신 (공유 시크릿 인증) |

## 데이터베이스: Supabase PostgreSQL

### 테이블 구조

| 테이블 | 용도 |
|--------|------|
| `card_requests` | 명함 제작 요청 (사용자 정보, 카드 데이터, 상태). `is_public` BOOLEAN: 갤러리 공개 여부 (기본값: false), `event_id` UUID: 연결된 이벤트 ID, `print_status` TEXT: 인쇄 상태 추적 |
| `card_request_status_history` | 요청 상태 변경 이력 추적 |
| `events` | 이벤트 관리 (이벤트명, 날짜, 설명) |
| `custom_themes` | 커스텀 테마 정의 (slug, 이름, 색상, 폰트, 테두리 등) |
| `user_profiles` | 사용자 프로필 (표시 이름, 자기소개, 아바타, 공개 설정, level INTEGER DEFAULT 1, mbti_type VARCHAR(4)) |
| `card_likes` | 카드 좋아요 (user_id + card_id 복합 PK) |
| `card_bookmarks` | 카드 북마크 (user_id + card_id 복합 PK) |
| `print_orders` | 인쇄 주문 관리 (Gelato 주문 ID, 상태, 배송 주소, 견적, 추적 정보) |
| `print_order_items` | 인쇄 주문 아이템 (카드-주문 연결, PDF URL, 수량) |
| `profiles` | 사용자 프로필 (표시 이름, 자기소개, 아바타, 소셜 링크 JSONB, 공개 설정) |
| `profile_links` | 프로필 커스텀 링크 (제목, URL, 아이콘, 활성 상태, sort_order 정렬 순서) |
| `community_questions` | 커뮤니티 질문 (content, hashtags TEXT[], thought_count 비정규화, is_active) |
| `community_thoughts` | 커뮤니티 생각/답변 (question_id FK, content, like_count 비정규화, is_active) |
| `thought_likes` | 생각 좋아요 (user_id + thought_id 복합 PK) |
| `coffee_chat_requests` | 커피챗 요청 (requester_id, receiver_id, message, status 5-상태 FSM, meeting_preference, LEAST/GREATEST 유니크 인덱스) |
| `mbti_questions` | MBTI 질문 (dimension, order_num, content, option_a, option_b, is_active) |
| `mbti_answers` | MBTI 답변 (user_id, question_id, answer A/B, UNIQUE(user_id, question_id)) |
| `community_surveys` | 커뮤니티 설문 (title, description, hashtags, deadline, multi_select, anonymous) |
| `survey_options` | 설문 선택지 (survey_id, label, vote_count) |
| `survey_votes` | 설문 투표 (survey_id, option_id, user_id) |

### Storage 버킷

| 버킷 | 용도 |
|------|------|
| `avatars` | 사용자 아바타 이미지 저장 |
| `illustrations` | 관리자가 업로드하는 일러스트 이미지 저장 |
| `print-pdfs` | Gelato 인쇄용 PDF 파일 저장 (public 버킷) |

### 소셜 유틸리티 (`src/lib/social-utils.ts`)

- `extractHandle(value)`: 소셜 미디어 URL에서 클린 사용자명(핸들)을 추출하는 공유 유틸리티 함수
- Facebook, Instagram, LinkedIn, Naver Blog URL 패턴을 인식하여 경로에서 핸들 추출
- 이메일의 경우 원본 그대로 반환
- 카드 뒷면 3개 컴포넌트(CardBack, MiniPreview, MyRequestDetail)에서 공통 사용
- URL이 아닌 일반 텍스트는 그대로 반환

### QR 코드 및 vCard 유틸리티 (`src/lib/qrcode.ts`)

- `generateVCard(card)`: CardData에서 vCard 3.0 형식 문자열 생성
  - FN, N, TITLE 필드 매핑
  - 소셜 링크를 TEL, EMAIL, URL 필드로 변환
  - vCard 특수문자 이스케이프 처리
- `generateQRDataURL(text, size)`: 텍스트를 QR 코드 PNG data URL로 변환
  - qrcode npm 패키지 사용 (Canvas 기반)
  - 커스텀 색상: 딥 네이비(#020912) + 화이트
- `getCardPublicURL(cardId)`: 카드 공개 URL 생성 (`/cards/{cardId}`)

### URL 변환 유틸리티 (`src/lib/url-utils.ts`)

- `convertGoogleDriveUrl(url)`: Google Drive 공유 URL을 직접 이미지 URL(`lh3.googleusercontent.com`)로 변환
- 지원 패턴: `drive.google.com/open?id=`, `drive.google.com/file/d/`, `docs.google.com/uc?id=`
- IllustrationUploader, CardCompare, AdminCardPreview, bulk-upload API 라우트에서 공통 사용
- null/undefined 입력 시 원본 그대로 반환

### 질문/생각 데이터 계층 (`src/lib/question-storage.ts`)

- `getQuestions(cursor, limit, hashtag, userId)`: 질문 목록 조회 (커서 기반 페이지네이션, 해시태그 필터)
- `getQuestionById(id, userId)`: 질문 상세 조회 (작성자 프로필 JOIN)
- `createQuestion(authorId, content, hashtags)`: 질문 작성 (stripHtml 적용)
- `deleteQuestion(id, authorId)`: 질문 삭제 (소유권 검증)
- `getThoughts(questionId, cursor, limit, userId)`: 생각 목록 조회 (좋아요 상태 포함)
- `createThought(questionId, authorId, content)`: 생각 작성 (stripHtml 적용)
- `deleteThought(thoughtId, authorId)`: 생각 삭제 (소유권 검증)
- `toggleThoughtLike(thoughtId, userId)`: 생각 좋아요 토글 (upsert/delete)
- `stripHtml(text)`: HTML 태그 제거 유틸리티 (XSS 방지)

### 커피챗 데이터 계층 (`src/lib/coffee-chat-storage.ts`)

- `getCoffeeChats(userId, cursor, limit, filter)`: 커피챗 목록 조회 (커서 기반, 발신/수신 필터)
- `getCoffeeChatById(id, userId)`: 커피챗 상세 조회 (이메일 조건부 공개)
- `createCoffeeChat(requesterId, receiverId, message, meetingPreference)`: 커피챗 요청 생성 (rate limit + 중복 검사)
- `respondToCoffeeChat(id, userId, action, responseMessage)`: 커피챗 응답 (상태 전이 검증)
- `getPendingCount(userId)`: 수신 대기 건수 조회
- `getDiscoverableMembers(userId, cursor, limit)`: 탐색 가능 회원 목록 (활성 커피챗 여부 포함)
- `fetchUserProfiles(userIds)`: 사용자 프로필 일괄 조회 (batch fetch 최적화)

### MBTI 데이터 계층 (`src/lib/mbti-storage.ts`)

- `getMbtiQuestions()`: 활성 MBTI 질문 목록 조회 (order_num 순)
- `getUserMbtiAnswers(userId)`: 사용자 MBTI 답변 목록
- `getMbtiProgress(userId)`: 진행 상황 조회 (질문 + 답변 + 잠금 상태 + 레벨 + MBTI 유형)
- `submitMbtiAnswer(userId, questionId, answer)`: 답변 제출 (순서 검증, 레벨 업데이트, MBTI 유형 계산)
- `calculateLevel(answerCount)`: 레벨 계산 (Lv.1-5, 12개 단위)
- `calculateMbtiType(answers)`: MBTI 유형 계산 (차원별 A/B 다수결)

### 설문 데이터 계층 (`src/lib/survey-storage.ts`)

- Survey CRUD operations
- Vote management
- Results aggregation

### 데이터 접근 계층 (`src/lib/storage.ts`)

- `saveRequest`: 명함 제작 요청 저장
- `getRequest`: 요청 상세 조회
- `getAllRequests`: 전체 요청 목록 조회 (관리자용)
- `getRequestsByUser(email)`: 특정 사용자의 요청 목록 조회 (`created_by` 필터링)
- `updateRequest`: 요청 상태 업데이트
- 대량 등록 관련: `POST /api/admin/bulk-upload` 라우트에서 CSV 파싱 후 개별 요청 저장 처리
- 기타 Supabase DB/Storage CRUD 함수

## 스타일링: Tailwind CSS 4

- PostCSS 기반 유틸리티 CSS 프레임워크
- `@import "tailwindcss"` 방식의 CSS 4 문법 사용
- 반응형 디자인: `sm:`, `md:`, `lg:` breakpoints 활용
- 커스텀 CSS: 카드 플립 애니메이션, 탭 전환 애니메이션, focus-visible 스타일
- 터치 디바이스 최소 타겟 크기(44px) 보장을 위한 `@media (pointer: coarse)` 규칙
- 미니멀리스트 갤러리 스타일: 딥 네이비(`#020912`) + 오프 화이트(`#fcfcfc`) 색상 조합
- 날카로운 모서리(0px border-radius) 일관 적용
- 폰트: Google Fonts - Figtree(제목/헤딩) + Anonymous Pro(본문/모노)
- 명함 전용 폰트: Google Fonts - Nanum Myeongjo(나눔명조) 한국어 세리프 폰트. `--font-card` CSS 변수로 카드 컴포넌트에 적용. 나머지 UI는 기존 Figtree 유지

## 상태 관리: Zustand 5

- persist middleware를 통한 localStorage 자동 저장
- Storage key: `namecard-storage`
- 상태 구조: `CardData` (front + back + theme + pokemonMeta + hearthstoneMeta + harrypotterMeta + tarotMeta) + `activeSide` - front/back 각각 `textColor: string` 필드 포함 (앞면 기본: #FFFFFF, 뒷면 기본: #000000)
- 액션: `updateFront`, `updateBack`, `setActiveSide`, `addSocialLink`, `removeSocialLink`, `updateSocialLink`, `addHashtag`, `removeHashtag`, `resetCard`, `setTheme`, `setPokemonType`, `setPokemonExp`, `setHearthstoneClass`, `setHearthstoneMana`, `setHearthstoneAttack`, `setHearthstoneHealth`, `setHarrypotterHouse`, `setHarrypotterYear`, `setHarrypotterSpellPower`, `setTarotArcana`, `setTarotCardNumber`, `setTarotMystique`
- Pokemon 테마 선택 시 기본 메타데이터 자동 생성 (`{ type: 'electric', exp: 100 }`)
- Hearthstone 테마 선택 시 기본 메타데이터 자동 생성 (`{ classType: 'warrior', mana: 3, attack: 2, health: 5 }`)
- Harry Potter 테마 선택 시 기본 메타데이터 자동 생성 (`{ house: 'gryffindor', year: 1, spellPower: 100 }`)
- Tarot 테마 선택 시 기본 메타데이터 자동 생성 (`{ arcana: 'major', cardNumber: 0, mystique: 100 }`)
- Redux 대비 보일러플레이트 최소화, 간결한 API

## 색상 선택: react-colorful 5.6

- 번들 크기: 약 2KB (gzipped)
- 외부 의존성 없음 (zero-dependency)
- `HexColorPicker` 컴포넌트 사용
- Hex 값 직접 입력 기능과 결합하여 사용
- 10가지 한국어 프리셋 색상 제공 (퍼플, 블루, 그린, 엘로우, 오렌지, 레드, 블랙(#131313), 그레이, 엘로우그린, 핑크)

## 텍스트 색상 선택: TextColorPicker

- 화이트(#FFFFFF) / 블랙(#000000) 2가지 옵션의 간단한 선택기
- FrontEditor, BackEditor, PhotoUploadStep(위저드) 컴포넌트에서 사용
- CardFront: 선택된 텍스트 색상 + 미세한 텍스트 그림자(text-shadow) 적용
- CardBack: 모든 텍스트 요소에 동적 textColor 적용 (기존 하드코딩된 text-black 대체)

## 이미지 내보내기: html-to-image 1.11

- DOM 요소를 PNG 이미지로 변환
- `toPng()` 함수 사용
- `pixelRatio: 2` 설정으로 고해상도 출력
- `cacheBust: true`로 캐시 무효화
- 앞면(`#card-front`)과 뒷면(`#card-back`)을 각각 독립적으로 내보내기

## PDF 생성: jsPDF

- 클라이언트 사이드 PDF 문서 생성 라이브러리
- html-to-image와 연동하여 DOM 요소를 PDF에 삽입
- A4 portrait 레이아웃: 명함 앞면(좌) + 뒷면(우) 병렬 배치
- 이벤트 관리자 페이지에서 참여자 명함 일괄 PDF 다운로드 기능에 사용
- EventPdfDownload 컴포넌트에서 활용
- 인쇄용 PDF 내보내기: 사용자 다운로드용 3mm bleed (97x61mm) + crop marks, Gelato용 4mm bleed (99x63mm) crop marks 제외
- Gelato용 PDF는 앞면/뒷면 개별 Blob으로 생성하여 Supabase Storage에 업로드

## 인쇄 API: Gelato

- Gelato Print API (v3/v4) REST 연동
- 인증: `X-API-KEY` 헤더 기반 API 키 인증
- API 클라이언트: native `fetch` 기반 (Cloudflare Workers 호환, axios 대신)
- 네트워크 에러 시 최대 2회 자동 재시도
- Draft → Confirm 2단계 주문 플로우
- API Base URLs:
  - Order: `https://order.gelatoapis.com/v3`
  - Product: `https://product.gelatoapis.com/v3`
  - Shipment: `https://shipment.gelatoapis.com/v1`
  - Order Status: `https://order.gelatoapis.com/v4`
- Webhook: `POST /api/webhooks/gelato` (공유 시크릿 기반 인증, 상태 자동 동기화)

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
- `next.config.ts`에서 외부 이미지 URL 지원을 위한 CORS 헤더 및 referrer policy 설정 (CSV 대량 등록의 외부 이미지 URL 호환)

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
| `GELATO_API_KEY` | 서버 전용 | Gelato Print API 키 |
| `GELATO_WEBHOOK_SECRET` | 서버 전용 | Gelato Webhook 인증용 공유 시크릿 |

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

### jsPDF로 클라이언트 사이드 PDF 생성

서버 사이드 PDF 생성(Puppeteer, wkhtmltopdf 등) 없이, 브라우저에서 직접 PDF를 생성합니다. html-to-image로 캡처한 명함 이미지를 jsPDF로 A4 페이지에 배치하여 PDF 파일을 구성합니다. Cloudflare Workers 엣지 런타임 환경에서 서버 사이드 PDF 라이브러리 사용이 제한적이므로, 클라이언트 사이드 접근이 적합합니다.

### Zustand으로 경량 상태 관리

Redux, MobX 등 대비 보일러플레이트가 최소화된 Zustand을 선택했습니다. 단일 store에 모든 명함 데이터와 UI 상태를 관리하며, persist middleware 한 줄 추가로 localStorage 영속성을 구현했습니다. 프로젝트 규모에 적합한 간결한 상태 관리 솔루션입니다.

### 테마 기반 컴포넌트 위임 패턴

CardFront/CardBack을 래퍼 컴포넌트로 전환하여, `theme` 값(`classic`, `pokemon`, `hearthstone`, `harrypotter`, `tarot`, SNS 프로필, 커스텀 테마 등 6종 이상)에 따라 테마별 전용 컴포넌트로 렌더링을 위임합니다. 기존 클래식 테마 동작은 100% 보존하면서 새 테마를 독립 컴포넌트로 추가하여, 테마 간 스타일 간섭 없이 확장할 수 있습니다. `theme` 필드가 없는 기존 카드 데이터는 자동으로 `classic`으로 처리됩니다. 모든 테마 컴포넌트는 인라인 스타일을 사용하여 html-to-image 라이브러리와의 호환성을 보장합니다.

### 명함 뒷면 고정 폰트 사이즈

명함 뒷면 텍스트는 반응형 대신 고정 픽셀 크기를 사용합니다. fullName은 `text-[30px]`, title과 hashtags는 `text-[20px]`로 적용됩니다. CardBack, AdminCardPreview(AdminBack), ConfirmedCardPreview(ConfirmedBack) 3개 컴포넌트에 동일하게 적용되어 일관된 출력을 보장합니다.

### 사용자 확정(Confirm) 기능

사용자가 대시보드 요청 상세(`/dashboard/[id]`)에서 직접 카드 요청을 확정할 수 있습니다. `VALID_TRANSITIONS`에 `submitted -> confirmed` 전환이 추가되었으며, `isEditableStatus` 함수가 `processing` 상태도 편집 가능하도록 확장되었습니다. 편집 폼에서는 "저장 후 확정" 버튼을 통해 수정과 확정을 동시에 처리할 수 있습니다.

### Create 라우트 임시 차단

`/create` 및 `/create/edit` 라우트가 임시로 `/dashboard`로 리다이렉트됩니다. 위저드를 통한 신규 명함 제작이 일시 중단된 상태이며, 기존 코드의 리다이렉트 로직을 제거하면 쉽게 복원할 수 있습니다.

### react-colorful로 경량 색상 선택기

react-color(약 14KB) 대신 react-colorful(약 2KB)을 선택하여 번들 크기를 최소화했습니다. 외부 의존성이 없어 유지보수 부담이 적고, 접근성(WCAG)을 기본 지원합니다.

### 커뮤니티 아키텍처

사용자 프로필 시스템과 소셜 인터랙션(좋아요/북마크)을 도입하여 명함 서비스를 커뮤니티 플랫폼으로 확장합니다. `user_profiles` 테이블은 Supabase Auth의 `auth.users`와 FK 관계로 연결되며, 프로필 공개 설정을 통해 개인정보를 보호합니다. 좋아요는 `card_likes` 테이블에 복합 PK로 저장하여 중복을 방지하고, `card_requests.like_count` 컬럼으로 비정규화하여 피드 정렬 성능을 최적화합니다.

### 질문 & 생각 아키텍처 (SPEC-COMMUNITY-003)

질문/생각 공유 시스템은 3개 테이블(`community_questions`, `community_thoughts`, `thought_likes`)로 구성됩니다.

**커서 기반 페이지네이션**: 질문 목록과 생각 목록 모두 offset 대신 커서 기반 페이지네이션을 사용합니다. `created_at` 타임스탬프를 커서로 활용하여, 새 데이터 삽입 시에도 안정적인 페이지 이동을 보장합니다. 프론트엔드에서는 `react-intersection-observer`를 사용한 무한 스크롤로 구현합니다.

**비정규화 카운터 + 트리거**: `community_questions.thought_count`와 `community_thoughts.like_count`는 비정규화 컬럼으로, PostgreSQL 트리거(`update_question_thought_count`, `update_thought_like_count`)가 INSERT/DELETE 시 자동으로 카운트를 증감합니다. JOIN 없이 단일 테이블 쿼리로 목록 성능을 최적화합니다. `GREATEST(count - 1, 0)`으로 음수 방지.

**해시태그 시스템**: `community_questions.hashtags`는 `TEXT[]` 배열 타입이며, GIN 인덱스(`idx_questions_hashtags`)로 배열 포함 검색(`@>` 연산자)을 최적화합니다. 프론트엔드에서 HashtagChip 컴포넌트로 태그 클릭 시 필터링합니다.

**XSS 방지**: `question-storage.ts`의 `stripHtml()` 함수가 모든 사용자 입력에서 HTML 태그를 제거합니다. 정규식 기반(`/<[^>]*>/g`)의 서버 사이드 sanitization을 적용합니다.

**RLS 정책**: 활성(`is_active = true`) 질문/생각은 공개 열람, 작성/수정/삭제는 본인(`auth.uid() = author_id`)만 가능, 좋아요는 인증 사용자만 가능합니다.

### 커피챗 아키텍처 (SPEC-COMMUNITY-004)

커피챗 매칭 시스템은 5-상태 유한 상태 머신(FSM)과 다양한 안전장치를 갖춘 설계입니다.

**5-상태 FSM (Finite State Machine)**: `coffee_chat_requests.status`는 `pending` -> `accepted`/`declined`/`cancelled` -> `completed` 상태 전이를 따릅니다. `VALID_TRANSITIONS` 상수가 각 상태에서 허용되는 액션, 다음 상태, 수행 권한(`requester`/`receiver`/`both`)을 정의합니다. `coffee-chat-storage.ts`에서 서버 사이드 상태 전이 검증을 수행합니다.

**양방향 중복 방지**: `LEAST(requester_id, receiver_id)` + `GREATEST(requester_id, receiver_id)` partial unique index를 사용하여, A->B 요청과 B->A 요청을 동일 쌍으로 취급합니다. `WHERE status IN ('pending', 'accepted')` 조건으로 활성 요청만 제한하여, 거절/취소/완료 후에는 재요청이 가능합니다.

**Rate Limiting**: 24시간 내 최대 5건 요청으로 제한합니다. `coffee-chat-storage.ts`에서 `created_at > now() - interval '24 hours'` 조건으로 최근 요청 수를 카운트하여 초과 시 429 에러를 반환합니다.

**조건부 이메일 공개 (Email Privacy Pattern)**: 커피챗 응답에서 상대방 이메일은 `accepted` 상태에서만 포함됩니다. `coffee-chat-storage.ts`의 `fetchUserProfiles()`에서 상태에 따라 이메일 필드를 선택적으로 포함하여, 수락 전에는 개인정보를 보호합니다.

**실시간 배지 업데이트 (Polling Pattern)**: `useCoffeeChatCount` 훅이 `GET /api/coffee-chat/pending-count` 엔드포인트를 60초 간격으로 폴링합니다. `CoffeeChatBadge` 컴포넌트가 `CommunityNav`의 커피챗 탭에 pending 수신 건수를 실시간 배지로 표시합니다. WebSocket 대신 폴링 방식을 선택하여 Cloudflare Workers 환경과의 호환성을 보장합니다.

**자기 자신 요청 방지**: `coffee_chat_requests` 테이블의 `CONSTRAINT chk_not_self CHECK (requester_id != receiver_id)` 제약으로 자기 자신에게 커피챗을 요청할 수 없습니다.

**회원 탐색 (Discoverable Members)**: `GET /api/members/discoverable` 엔드포인트가 프로필 공개(`is_public = true`) 설정된 회원 목록을 커서 기반 페이지네이션으로 반환합니다. 각 회원에 대해 현재 사용자와의 활성 커피챗 존재 여부(`hasPendingChat`)를 포함합니다.

### MBTI 진단 시스템 아키텍처

MBTI 진단은 48개 질문(차원당 12개)을 순차적으로 잠금 해제하는 게이미피케이션 패턴을 적용합니다. `mbti_questions` 테이블에 질문을 저장하고, `mbti_answers`에 사용자 답변을 기록합니다. 질문 수 기반 동적 완료 체크(`>= questions.length`)로 질문 추가 시 코드 변경이 불필요합니다. 레벨 시스템은 12개 단위(Lv.1=0, Lv.2=12+, Lv.3=24+, Lv.4=36+, Lv.5=48)로 구성되며, `user_profiles.level`과 `user_profiles.mbti_type`에 결과가 저장됩니다.

### 커뮤니티 설문/투표 시스템 아키텍처 (SPEC-SURVEY-001)

설문/투표 시스템은 `community_surveys`, `survey_options`, `survey_votes` 3개 테이블로 구성됩니다. 설문 작성자는 제목, 설명, 선택지, 마감일, 복수선택 허용, 익명투표 옵션을 설정할 수 있습니다. 투표 결과는 `survey_options.vote_count` 비정규화 카운터로 실시간 집계됩니다.

### Link-in-Bio 프로필 아키텍처 (SPEC-LINKBIO-001)

프로필 페이지를 Linktree 스타일의 Link-in-Bio로 리디자인했습니다.

**DB 구조**: `profiles` 테이블에 사용자 프로필 정보(표시 이름, 자기소개, 아바타, 소셜 링크 JSONB, 공개 설정)를 저장하고, `profile_links` 테이블에 커스텀 링크(제목, URL, 아이콘, 활성 상태, 정렬 순서)를 저장합니다. `profile_links.sort_order`로 드래그 앤 드롭 순서 변경을 지원합니다.

**소셜 링크 JSONB**: `profiles.social_links`는 JSONB 타입으로, `{ platform: string, url: string }[]` 배열을 저장합니다. Instagram, Facebook, LinkedIn, Email, Website, GitHub, YouTube, Twitter 8개 플랫폼을 지원합니다. SocialIconRow 컴포넌트가 플랫폼별 아이콘을 자동 렌더링합니다.

**링크 관리 API**: `/api/profiles/me/links` 엔드포인트에서 링크 CRUD를 처리하고, `/api/profiles/me/links/reorder`에서 순서 변경을 일괄 업데이트합니다. `useLinks` 훅이 프론트엔드 상태를 관리합니다.

**아바타 업로드**: `/api/profiles/me/avatar` POST 엔드포인트에서 이미지 파일을 Supabase Storage에 업로드하고 프로필 URL을 업데이트합니다.

### 커스텀 테마 아키텍처

기존 하드코딩된 빌트인 테마 시스템을 확장하여, 관리자가 DB 기반으로 커스텀 테마를 생성할 수 있게 합니다. 커스텀 테마는 기존 레이아웃 템플릿(`classic`, `nametag`)을 `base_template`로 선택하고, 색상/폰트/테두리 등 시각적 속성만 커스터마이징합니다. `CardFront`/`CardBack` 래퍼에서 `CustomThemeCardFront`/`CustomThemeCardBack` 컴포넌트로 위임하며, `custom_themes` 테이블의 스타일 정보를 인라인 스타일로 적용합니다. `useCustomThemes` 훅이 테마 목록을 캐싱하여 불필요한 API 호출을 방지합니다.

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
