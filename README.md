# Namecard Editor (명함 편집기)

브라우저에서 직접 개인 명함의 앞면과 뒷면을 디자인하고 편집할 수 있는 웹 애플리케이션입니다.

## Screenshots / 스크린샷

(추후 추가 예정)

## 주요 기능

- 명함 앞면/뒷면 실시간 편집 및 미리보기
- 프로필 이미지 업로드 (드래그 앤 드롭 지원)
- 배경색 커스터마이징 (앞면/뒷면 개별 설정)
- 텍스트 편집 (이름, 직함, 해시태그, 소셜 링크)
- PNG 이미지 고화질 내보내기 (2x 해상도)
- 자동 저장 (브라우저 localStorage)
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16 | React 프레임워크 (App Router) |
| React | 19 | UI 라이브러리 |
| TypeScript | 5.9+ | 타입 안전성 |
| Tailwind CSS | 4 | 유틸리티 기반 스타일링 |
| Zustand | 5 | 상태 관리 + localStorage 영속성 |
| react-colorful | 5.6 | 색상 선택기 |
| html-to-image | 1.11 | PNG 이미지 내보내기 |

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

1. **앞면 편집**: Display Name 입력, 프로필 이미지 업로드, 배경색 변경
2. **뒷면 편집**: "뒷면" 탭 클릭 후 이름, 직함, 해시태그, 소셜 링크 편집
3. **미리보기**: 우측(데스크톱) 또는 상단(모바일)에서 실시간 확인
4. **내보내기**: "Download PNG" 버튼으로 앞면/뒷면 이미지 다운로드

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── card/            # 카드 미리보기 컴포넌트
│   ├── editor/          # 편집기 컴포넌트
│   ├── export/          # 내보내기 기능
│   └── ui/              # 공통 UI 컴포넌트
├── stores/              # Zustand 상태 관리
├── types/               # TypeScript 타입 정의
└── lib/                 # 유틸리티 함수
```

## 라이선스

MIT
