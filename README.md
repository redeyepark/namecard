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
4. **내보내기**: "Download PNG" 버튼으로 앞면/뒷면 이미지 다운로드
5. **내 요청 확인**: 로그인 후 UserMenu의 "내 요청"을 클릭하여 `/dashboard`에서 제작 진행 상태 확인
6. **관리자 대량 등록**: 관리자 대시보드에서 "CSV/Excel 대량 등록" 버튼으로 명함 요청 일괄 등록

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── dashboard/       # 사용자 대시보드 (내 요청 목록, 상세)
│   ├── api/requests/my/ # 사용자 본인 요청 목록 API
│   └── api/admin/bulk-upload/ # 관리자 CSV/Excel 대량 등록 API
├── components/
│   ├── admin/           # 관리자 컴포넌트 (BulkUploadModal 등)
│   ├── card/            # 카드 미리보기 컴포넌트
│   ├── dashboard/       # 대시보드 컴포넌트 (ProgressStepper, MyRequestList 등)
│   ├── editor/          # 편집기 컴포넌트
│   ├── export/          # 내보내기 기능
│   └── ui/              # 공통 UI 컴포넌트
├── stores/              # Zustand 상태 관리
├── types/               # TypeScript 타입 정의
└── lib/                 # 유틸리티 함수 (social-utils.ts 등)
```

## 최근 변경사항

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

## 라이선스

MIT
