# Namecard Editor (명함 편집기)

## 프로젝트 설명

브라우저에서 개인 명함을 디자인하고 편집할 수 있는 클라이언트 사이드 웹 애플리케이션입니다. 별도의 서버나 회원가입 없이, 웹 브라우저만으로 명함의 앞면과 뒷면을 실시간으로 편집하고, 완성된 명함을 고화질 PNG 이미지로 내보낼 수 있습니다.

## 대상 사용자

- 명함을 직접 디자인하고 싶은 개인 사용자
- 프리랜서
- 소규모 사업자

## 핵심 기능

### 명함 앞면/뒷면 실시간 편집 및 미리보기

- 앞면(Front): Display Name, Avatar Image 편집
- 뒷면(Back): Full Name, Title/Role, Hashtags, Social Links 편집
- 탭 전환으로 앞면/뒷면 즉시 전환 (카드 플립 애니메이션 포함)
- 데스크톱에서는 오른쪽에 sticky preview, 모바일에서는 상단에 preview 표시

### 이미지 업로드

- 드래그 앤 드롭(Drag & Drop) 방식 지원
- 클릭하여 파일 선택 방식 지원
- 지원 형식: PNG, JPG, WebP
- 파일 크기 제한: 5MB
- 업로드된 이미지 미리보기 및 삭제 기능
- Base64 인코딩으로 localStorage에 저장

### 배경색 커스터마이징

- 앞면/뒷면 개별 배경색 설정
- react-colorful 기반 시각적 색상 선택기
- Hex 값 직접 입력 지원
- 실시간 색상 미리보기

### 텍스트 편집

- **Display Name**: 앞면에 표시되는 이름 (최대 40자)
- **Full Name**: 뒷면에 표시되는 전체 이름 (최대 50자)
- **Title / Role**: 직함 또는 역할 (최대 80자)
- **Hashtags**: 태그 형태로 키워드 추가/삭제 (Enter 키 또는 버튼으로 추가)
- **Social Links**: Facebook, Instagram, LinkedIn, Email, Custom 플랫폼별 링크 CRUD (추가/수정/삭제)

### PNG 이미지 고화질 내보내기

- html-to-image 라이브러리를 사용한 DOM-to-PNG 변환
- 2x 해상도(pixelRatio: 2)로 고화질 출력
- 앞면과 뒷면을 각각 별도 파일로 다운로드 (namecard-front.png, namecard-back.png)
- 내보내기 진행 중 로딩 상태 표시

### localStorage 기반 자동 저장

- Zustand persist middleware를 활용한 자동 저장
- 브라우저를 닫아도 편집 내용 유지
- storage key: `namecard-storage`
- 초기화(Reset) 버튼으로 기본값 복원 (확인 단계 포함)

## 사용 사례

### 프리랜서가 자신의 명함을 직접 디자인

프리랜서가 자신의 브랜드 색상에 맞는 명함을 직접 만들어 네트워킹 시 활용할 수 있습니다. Avatar Image를 업로드하고, 브랜드 색상을 배경에 적용하며, 해시태그와 소셜 링크를 추가하여 개성 있는 명함을 제작합니다.

### 소규모 팀이 통일된 명함 디자인을 제작

팀원들이 동일한 배경색과 레이아웃을 사용하되, 각자의 이름, 직함, 연락처를 입력하여 통일된 디자인의 명함을 각자 제작할 수 있습니다.

### 네트워킹 이벤트를 위한 빠른 명함 생성

컨퍼런스나 밋업 참석 전, 빠르게 디지털 명함을 생성하여 PNG 이미지로 다운로드한 뒤 SNS나 메신저를 통해 공유할 수 있습니다.

## 접근성(Accessibility) 지원

- ARIA 속성 적용 (role, aria-label, aria-selected, aria-controls)
- 키보드 네비게이션 지원 (Tab, Enter, Space)
- focus-visible 스타일 전역 적용
- 터치 디바이스 최소 터치 영역 44px 보장
- 반응형 레이아웃 (모바일, 태블릿, 데스크톱)
