# Namecard Editor (명함 편집기)

브라우저에서 직접 개인 명함의 앞면과 뒷면을 디자인하고 편집할 수 있는 웹 애플리케이션입니다.

## Screenshots / 스크린샷

(추후 추가 예정)

## 주요 기능

- 명함 앞면/뒷면 실시간 편집 및 미리보기
- 프로필 이미지 업로드 (드래그 앤 드롭 지원)
- 배경색 커스터마이징 (앞면/뒷면 개별 설정, 10가지 프리셋 색상)
- 텍스트 컬러 선택 (화이트/블랙)
- 텍스트 편집 (이름, 직함, 해시태그, 소셜 링크)
- 나눔명조체(NanumMyeongjo) 한국어 세리프 폰트 적용 (Google Fonts)
- 소셜 링크 `플랫폼/핸들` 형식 표시 (예: `facebook/wonder.choi`), email > linkedin > instagram > facebook 순 정렬, 우측 정렬
- PNG 이미지 고화질 내보내기 (2x 해상도)
- 자동 저장 (브라우저 localStorage)
- 사용자 대시보드 (내 요청 목록, 진행 상태 추적, 요청 상세 조회)
- 사용자 명함 컨펌 기능 (대시보드에서 직접 요청 확인)
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 관리자 CSV/Excel 대량 등록 (이메일 자동 회원가입 포함)
- 관리자 외부 URL 이미지 지원
- 확장 상태 워크플로우 (수정 요청, 반려, 배송 완료)
- 관리자 갤러리 뷰 (테이블/갤러리 토글, 6종 다중 필터)
- 관리자 의뢰 목록 검색 (이름/ID/이메일)
- 관리자 리스트 캐릭터 일러스트 썸네일 표시
- 카카오톡 공유 (Kakao JS SDK Feed 템플릿)
- 소셜 공유 (Facebook, X/Twitter, LinkedIn, LINE)
- 이미지 클립보드 복사 (Safari 호환)
- 앞/뒤 합성 이미지 다운로드
- 토스트 알림 시스템
- 비공개 카드 공유 제한
- 관리자 커스텀 테마 생성/편집/삭제 (기존 레이아웃 기반 색상/폰트/테두리 커스터마이징)
- 사용자 프로필 페이지 (포트폴리오 카드 갤러리, 테마 분포 시각화)
- 커뮤니티 피드 (최신순/인기순 정렬, 테마 필터, 무한 스크롤)
- SNS 프로필 테마 (소셜 네트워크 스타일 카드)
- 좋아요/북마크 시스템 (카드 소셜 인터랙션)

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16 | React 프레임워크 (App Router) |
| React | 19 | UI 라이브러리 |
| TypeScript | 5.9+ | 타입 안전성 |
| Tailwind CSS | 4 | 유틸리티 기반 스타일링 |
| Zustand | 5 | 상태 관리 + localStorage 영속성 |
| Supabase Auth | - | 이메일/비밀번호 + Google OAuth 인증 |
| Supabase | 2.97 | PostgreSQL DB + Storage (BaaS) |
| react-colorful | 5.6 | 색상 선택기 |
| html-to-image | 1.11 | PNG 이미지 내보내기 |
| xlsx | 0.18 | Excel/CSV 파일 파싱 (대량 등록) |
| Kakao JS SDK | - | 카카오톡 공유 |

## 시작하기

### 요구 사항

- Node.js 22 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 사용하세요.

#### 카카오톡 공유 설정 (선택)

카카오톡 공유 기능을 사용하려면 [Kakao Developers](https://developers.kakao.com)에서 앱을 생성하고 JavaScript 키를 `.env.local`에 설정하세요:

```
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 사용 방법

1. **앞면 편집**: Display Name 입력, 프로필 이미지 업로드, 배경색 변경, 텍스트 색상 선택 (화이트/블랙)
2. **뒷면 편집**: "뒷면" 탭 클릭 후 이름, 직함, 해시태그, 소셜 링크 편집, 텍스트 색상 선택
3. **미리보기**: 우측(데스크톱) 또는 상단(모바일)에서 실시간 확인
4. **내보내기/공유**: "내보내기 / 공유" 버튼으로 PNG 다운로드, 카카오톡 공유, 소셜 공유, 이미지 복사
5. **내 요청 확인**: 로그인 후 UserMenu의 "내 요청"을 클릭하여 `/dashboard`에서 제작 진행 상태 확인
6. **관리자 대량 등록**: 관리자 대시보드에서 "CSV/Excel 대량 등록" 버튼으로 명함 요청 일괄 등록

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── dashboard/       # 사용자 대시보드 (내 요청 목록, 상세, 북마크)
│   ├── profile/[id]/    # 사용자 프로필 페이지
│   ├── api/profiles/    # 사용자 프로필 API
│   ├── api/feed/        # 커뮤니티 피드 API
│   ├── api/cards/[id]/  # 좋아요/북마크 API
│   ├── api/admin/custom-themes/ # 커스텀 테마 관리 API
│   ├── api/themes/      # 공개 테마 목록 API
│   ├── api/requests/my/ # 사용자 본인 요청 목록 API
│   └── api/admin/bulk-upload/ # 관리자 CSV/Excel 대량 등록 API
├── components/
│   ├── admin/           # 관리자 컴포넌트 (갤러리 뷰, 필터, ThemeListBox 등)
│   ├── card/            # 카드 미리보기 컴포넌트 (6개 테마 + 커스텀 테마)
│   ├── dashboard/       # 대시보드 컴포넌트 (ProgressStepper, MyRequestList 등)
│   ├── editor/          # 편집기 컴포넌트 (테마별 메타데이터 편집 UI 포함)
│   ├── export/          # 내보내기 및 소셜 공유 (ExportPanel, KakaoShare, SocialShare)
│   ├── feed/            # 커뮤니티 피드 컴포넌트 (FeedContainer, FeedFilters)
│   ├── profile/         # 사용자 프로필 컴포넌트 (ProfileHeader, ProfileEditForm)
│   ├── social/          # 소셜 인터랙션 컴포넌트 (LikeButton, BookmarkButton)
│   ├── providers/       # 컨텍스트 프로바이더 (KakaoProvider)
│   └── ui/              # 공통 UI 컴포넌트 (Toast 알림 포함)
├── hooks/               # 커스텀 훅 (useAdminFilters 등)
├── stores/              # Zustand 상태 관리
├── types/               # TypeScript 타입 정의
└── lib/                 # 유틸리티 함수 (social-utils.ts 등)
```

## 최근 변경사항

### 좋아요 + 북마크 시스템 (SPEC-COMMUNITY-002)

- 카드 좋아요 토글 (하트 아이콘, 실시간 카운트)
- 카드 북마크 토글 (저장 아이콘, 개인 컬렉션)
- 북마크 대시보드 (`/dashboard/bookmarks`)
- 공개 카드 페이지 및 갤러리 썸네일에 좋아요/북마크 버튼 표시
- 인증 사용자만 좋아요/북마크 가능

### 사용자 프로필 + 커뮤니티 피드 (SPEC-COMMUNITY-001)

- 사용자 프로필 페이지 (`/profile/[id]`) - 포트폴리오 카드 갤러리
- 프로필 편집 (표시 이름, 자기소개, 아바타, 공개 설정)
- 테마 분포 시각화 차트
- 커뮤니티 피드 - 최신순/인기순 정렬, 테마 필터
- 무한 스크롤 카드 탐색
- SNS 프로필 테마 카드 스킨

### 관리자 커스텀 테마 (SPEC-CUSTOM-THEME-001)

- 관리자 패널에서 커스텀 테마 생성/편집/삭제 기능
- 기존 레이아웃 템플릿(classic, nametag) 기반 시각적 커스터마이징
- 색상, 폰트, 테두리 스타일, 커스텀 메타데이터 필드 설정
- 커스텀 테마 미리보기 및 에디터 실시간 반영
- 기존 6개 빌트인 테마 100% 하위 호환

### 카카오톡/소셜 공유 (SPEC-SOCIAL-SHARE-001)

- 카카오톡 공유 기능 추가 (Kakao JS SDK Feed 템플릿)
- 소셜 플랫폼 공유: Facebook, X(Twitter), LinkedIn, LINE
- 통합 내보내기/공유 패널 (데스크톱 드롭다운 / 모바일 바텀시트)
- 앞면/뒷면 합성 PNG 다운로드
- 이미지 클립보드 복사 (Safari 호환 포함)
- 토스트 알림 시스템 (성공/오류/정보 3종)
- 비공개 카드 소셜 공유 차단 가드

### 관리자 갤러리 뷰 (SPEC-GALLERY-001)

- 관리자 대시보드(`/admin`)에 테이블/갤러리 뷰 토글 추가
- 갤러리 뷰: 반응형 카드 그리드(2~5열), 테마별 스타일링, 상태 뱃지 표시
- 6종 다중 필터: 테마, 상태, 배경색(HSL 색상군), 해시태그(OR), 이미지 유무, 텍스트 검색
- `useAdminFilters` 커스텀 훅으로 필터 상태 통합 관리
- 테이블/갤러리 뷰 간 필터 상태 공유, 뷰 모드 localStorage 저장
- 의뢰 리스트에 캐릭터 일러스트 썸네일 표시 (사진 옆)
- 의뢰 리스트 및 멤버 목록 텍스트 검색 기능 추가

### 테마 관리 UI 개선 (SPEC-THEME-002)

- 관리자 테마 관리 페이지(`/admin/themes`)의 미리보기 레이아웃을 5열 그리드에서 리스트 박스 + 대형 미리보기 패턴으로 개선
- 좌측 사이드바에 5개 테마 목록 (의뢰 건수 배지 포함), 우측에 선택된 테마의 대형 카드 미리보기 + 편집 패널 배치
- 테마별 variant(타입/직업/기숙사/아르카나) 선택 및 메타데이터 편집을 실시간 미리보기로 확인 가능
- 테마 전환 시 각 테마의 편집 상태가 독립적으로 보존
- 모바일 반응형 지원 (1024px 미만에서 드롭다운 선택기로 전환)
- 기존 테마 일괄 적용 기능 100% 보존

### 폰트 변경

- 명함 카드에 나눔명조체(NanumMyeongjo) 한국어 세리프 폰트 적용
- Google Fonts를 통한 웹폰트 로딩

### 소셜 링크 표시 개선

- 소셜 링크를 `플랫폼/핸들` 형식으로 표시 (예: `facebook/wonder.choi`, `instagram/username`)
- URL에서 핸들을 추출하는 유틸리티 함수 추가 (`src/lib/social-utils.ts`)
- 표시 순서: email > linkedin > instagram > facebook (우측 정렬)
- CSV 대량 업로드 시 소셜 링크 라벨이 플랫폼명 대신 고객 데이터(핸들)를 올바르게 표시하도록 수정

### 사용자 컨펌 기능

- 사용자가 대시보드에서 명함 요청을 직접 확인(컨펌)할 수 있는 기능 추가

### 카드 생성 경로 비활성화

- 명함 생성 경로(`/create`) 임시 비활성화, 대시보드로 리다이렉트

### 텍스트 가독성 향상

- 명함 카드 텍스트 크기 약 20% 증가로 가독성 개선

### Harry Potter 테마 추가

- 위저드 카드 스타일의 네 번째 카드 테마 추가
- 4개 기숙사 지원: Gryffindor, Slytherin, Hufflepuff, Ravenclaw
- 기숙사별 고유 색상 및 문장 배지 적용
- 양피지/석재 프레임, 지팡이 장식, 주문 파워 스탯 표시
- 에디터에서 기숙사 선택 및 학년(1-7)/주문 파워(0-999) 입력 지원

### Tarot 테마 추가

- 신비로운 카드 스타일의 다섯 번째 카드 테마 추가
- 5개 아르카나 지원: Major, Wands, Cups, Swords, Pentacles
- 아르카나별 고유 색상 및 아르누보 보더 적용
- 천체 별 패턴, 신비로운 눈 모티프 장식
- 에디터에서 아르카나 선택 및 카드 번호(0-21)/미스틱(0-999) 입력 지원

## 라이선스

MIT
